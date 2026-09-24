import { useEffect, useRef, useState } from "react";
import { ArrowDown, Hash, Send, Users } from "lucide-react";
import api from "../services/api";
import { useSocket } from "../context/SocketContext";
import { useAuth } from "../context/AuthContext";
import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";

export default function ChatWindow({ room, onNewMessage }) {
  const { socket } = useSocket();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [editingMessage, setEditingMessage] = useState(null);
  const [typingName, setTypingName] = useState("");
  const [hasMore, setHasMore] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const listRef = useRef(null);
  const typingTimer = useRef(null);

  const other = room?.isPrivate ? room.members.find(m => String(m._id) !== String(user?.id)) : null;

  const loadMessages = async (before) => {
    if (!room) return;
    const params = new URLSearchParams({ limit: "30" });
    if (before) params.set("before", before);
    const { data } = await api.get(`/rooms/${room._id}/messages?${params}`);
    if (before) {
      const el = listRef.current;
      const oldHeight = el?.scrollHeight || 0;
      setMessages(prev => [...data.messages, ...prev]);
      requestAnimationFrame(() => {
        if (el) el.scrollTop = el.scrollHeight - oldHeight;
      });
    } else {
      setMessages(data.messages);
      requestAnimationFrame(() => {
        if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
      });
    }
    setHasMore(data.hasMore);
  };

  useEffect(() => {
    if (!room) return;
    setMessages([]);
    loadMessages();
    socket?.emit("join-room", room._id);
    return () => socket?.emit("leave-room", room._id);
  }, [room?._id, socket]);

  useEffect(() => {
    if (!socket) return;

    const onNew = msg => {
      if (String(msg.room) !== String(room?._id)) return;
      setMessages(prev => prev.some(m => m._id === msg._id) ? prev : [...prev, msg]);
      requestAnimationFrame(() => {
        if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
      });
    };
    const onTyping = payload => {
      if (String(payload.roomId) === String(room?._id) && String(payload.userId) !== String(user?.id))
        setTypingName(payload.name);
    };
    const onStop = payload => {
      if (String(payload.roomId) === String(room?._id)) setTypingName("");
    };
    const onRead = payload => {
      if (String(payload.roomId) !== String(room?._id)) return;
      setMessages(prev => prev.map(m => payload.messageIds.includes(m._id)
        ? { ...m, readBy: Array.from(new Set([...(m.readBy || []).map(String), String(payload.userId)])) }
        : m));
    };

    const onEdited = message => {
      if (String(message.room?._id || message.room) !== String(room?._id)) return;
      setMessages(prev => prev.map(m => m._id === message._id ? message : m));
    };

    const onDeleted = message => {
      if (String(message.room?._id || message.room) !== String(room?._id)) return;
      setMessages(prev => prev.map(m => m._id === message._id ? message : m));
    };

    socket.on("new-message", onNew);
    socket.on("typing", onTyping);
    socket.on("stop-typing", onStop);
    socket.on("message-read", onRead);
    socket.on("message-edited", onEdited);
    socket.on("message-deleted", onDeleted);
    return () => {
      socket.off("new-message", onNew);
      socket.off("typing", onTyping);
      socket.off("stop-typing", onStop);
      socket.off("message-read", onRead);
      socket.off("message-edited", onEdited);
      socket.off("message-deleted", onDeleted);
    };
  }, [socket, room?._id, user?.id]);

  useEffect(() => {
    if (!room || !socket || !messages.length) return;
    const unread = messages
      .filter(m => !m.readBy?.some(id => String(id._id || id) === String(user.id)) && String(m.sender?._id) !== String(user.id))
      .map(m => m._id);
    if (unread.length) socket.emit("mark-read", { roomId: room._id, messageIds: unread });
  }, [messages.length, room?._id, socket]);

  const editMessage = message => {
    if (!message?._id) return;
    setEditingMessage(message);
    setText(message.text || "");
  };

  const deleteMessage = message => {
    if (!message?._id || !socket || !room) return;
    if (!window.confirm("Delete this message for everyone?")) return;

    socket.emit("delete-message", {
      roomId: room._id,
      messageId: message._id
    }, result => {
      if (!result?.ok) {
        window.alert(result?.message || "Could not delete message");
      }
    });
  };

  const send = e => {
    e.preventDefault();
    const clean = text.trim();
    if (!clean || !socket || !room) return;

    if (editingMessage) {
      socket.emit("edit-message", {
        roomId: room._id,
        messageId: editingMessage._id,
        text: clean
      }, result => {
        if (result?.ok) {
          setText("");
          setEditingMessage(null);
        } else {
          window.alert(result?.message || "Could not edit message");
        }
      });
      return;
    }

    socket.emit("send-message", { roomId: room._id, text: clean }, result => {
      if (result?.ok) setText("");
    });
    socket.emit("stop-typing", { roomId: room._id });
  };

  const changeText = e => {
    setText(e.target.value);
    if (!socket || !room) return;
    socket.emit("typing", { roomId: room._id });
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => socket.emit("stop-typing", { roomId: room._id }), 900);
  };

  const onScroll = async e => {
    if (e.currentTarget.scrollTop < 80 && hasMore && !loadingOlder && messages.length) {
      setLoadingOlder(true);
      await loadMessages(messages[0]._id);
      setLoadingOlder(false);
    }
  };

  if (!room) return (
    <main className="flex flex-1 items-center justify-center bg-slate-50 p-8 text-center">
      <div><div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-white"><Hash /></div>
      <h2 className="text-xl font-bold">Welcome to ChatRoom</h2><p className="mt-1 text-sm text-slate-500">Select a room or start a direct message.</p></div>
    </main>
  );

  return (
    <main className="flex min-h-0 flex-1 flex-col bg-slate-50">
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-5">
        <div>
          <h2 className="flex items-center gap-2 font-bold">{room.isPrivate ? other?.name : <><Hash size={18} />{room.name}</>}</h2>
          <p className="text-xs text-slate-500">{room.isPrivate ? (other?.isOnline ? "Online" : "Offline") : `${room.members.length} members`}</p>
        </div>
        <Users size={18} className="text-slate-400" />
      </header>

      <div ref={listRef} onScroll={onScroll} className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-5">
        {loadingOlder && <div className="text-center text-xs text-slate-400">Loading older messages...</div>}
        {messages.map(m => (
          <MessageBubble
            key={m._id}
            message={m}
            own={String(m.sender?._id) === String(user?.id)}
            onEdit={editMessage}
            onDelete={deleteMessage}
          />
        ))}
        <TypingIndicator name={typingName} />
      </div>

      <form onSubmit={send} className="border-t border-slate-200 bg-white p-3">
        {editingMessage && (
          <div className="mb-2 flex items-center justify-between rounded-lg bg-slate-100 px-3 py-2 text-xs text-slate-600">
            <span>Editing message</span>
            <button type="button" onClick={() => { setEditingMessage(null); setText(""); }}
              className="font-semibold hover:text-slate-900">Cancel</button>
          </div>
        )}
        <div className="flex items-end gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2">
          <textarea value={text} onChange={changeText} rows={1} onKeyDown={e => {
            if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(e); }
          }} placeholder="Write a message..." className="max-h-32 min-h-10 flex-1 resize-none bg-transparent px-2 py-2 text-sm outline-none" />
          <button className="rounded-lg bg-slate-900 p-2.5 text-white hover:bg-slate-700"><Send size={17} /></button>
        </div>
        <div className="px-2 pt-1 text-[10px] text-slate-400">Enter to send · Shift + Enter for a new line</div>
      </form>
    </main>
  );
}
