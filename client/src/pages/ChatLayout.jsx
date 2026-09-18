import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import RoomList from "../components/RoomList";
import ChatWindow from "../components/ChatWindow";
import api from "../services/api";

export default function ChatLayout() {
  const { user, logout } = useAuth();
  const { socket } = useSocket();
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState([]);
  const [unreadCounts, setUnreadCounts] = useState(() => {
    try { return JSON.parse(localStorage.getItem("syncspace_unread") || "{}"); }
    catch { return {}; }
  });

  useEffect(() => {
    localStorage.setItem("syncspace_unread", JSON.stringify(unreadCounts));
  }, [unreadCounts]);

  const loadRooms = async () => {
    const { data } = await api.get("/rooms");
    setRooms(data.rooms);
    setSelectedRoom(prev => prev ? data.rooms.find(r => r._id === prev._id) || prev : null);
  };

  useEffect(() => { loadRooms(); }, []);

  // Listen globally for messages from every room. ChatWindow only listens to
  // the currently selected room, so unread counts must be tracked here.
  useEffect(() => {
    if (!socket || !user) return;

    const handleGlobalMessage = message => {
      const roomId = String(message.room?._id || message.room);
      const senderId = String(message.sender?._id || message.sender);

      // Never count our own messages as unread.
      if (senderId === String(user.id)) return;

      // The currently open room is already being read by ChatWindow.
      if (String(selectedRoom?._id) === roomId) return;

      setUnreadCounts(prev => ({
        ...prev,
        [roomId]: (prev[roomId] || 0) + 1
      }));
    };

    socket.on("new-message", handleGlobalMessage);

    return () => {
      socket.off("new-message", handleGlobalMessage);
    };
  }, [socket, user, selectedRoom?._id]);

  useEffect(() => {
    if (!search.trim()) return setUsers([]);
    const timer = setTimeout(async () => {
      try {
        const { data } = await api.get(`/rooms/users/search?q=${encodeURIComponent(search)}`);
        setUsers(data.users);
      } catch { setUsers([]); }
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);

  const selectRoom = room => {
    setSelectedRoom(room);
    setUnreadCounts(prev => {
      if (!prev[room._id]) return prev;
      const next = { ...prev };
      delete next[room._id];
      return next;
    });
  };

  const createRoom = async () => {
    const name = prompt("Public room name:");
    if (!name?.trim()) return;
    const { data } = await api.post("/rooms", { name });
    await loadRooms();
    selectRoom(data.room);
  };

  const renameRoom = async room => {
    const name = window.prompt("New room name:", room.name);
    if (!name?.trim() || name.trim() === room.name) return;

    try {
      const { data } = await api.patch(`/rooms/${room._id}`, { name: name.trim() });
      setRooms(prev => prev.map(r => r._id === room._id ? data.room : r));
      setSelectedRoom(prev => prev?._id === room._id ? data.room : prev);
    } catch (e) {
      window.alert(e.response?.data?.message || "Could not rename room");
    }
  };
const joinRoom = async room => {
  try {
    await api.post(`/rooms/${room._id}/join`);
    socket?.emit("join-room", room._id);

    const { data } = await api.get("/rooms");

    setRooms(data.rooms);

    const joined = data.rooms.find(
      r => String(r._id) === String(room._id)
    );

    if (joined) {
      selectRoom(joined);
    }
  } catch (e) {
    alert(e.response?.data?.message || "Could not join room");
  }
};

  const deleteConversation = async room => {
    const other = room.members.find(m => String(m._id) !== String(user.id));
    const name = other?.name || "this conversation";

    if (!window.confirm(`Delete the conversation with ${name} for you?`)) return;

    try {
      await api.delete(`/rooms/${room._id}/conversation`);
      setUnreadCounts(prev => {
        const next = { ...prev };
        delete next[room._id];
        return next;
      });
      if (String(selectedRoom?._id) === String(room._id)) {
        setSelectedRoom(null);
      }
      await loadRooms();
    } catch (e) {
      window.alert(e.response?.data?.message || "Could not delete conversation");
    }
  };

  const startDM = async u => {
    const { data } = await api.post("/rooms/dm", { userId: u._id });
    await loadRooms();
    selectRoom(data.room);
    setSearch("");
    setUsers([]);
  };

  return (
    <div className="flex h-screen flex-col bg-white md:flex-row">
      <RoomList
        rooms={rooms}
        selectedRoom={selectedRoom}
        onSelect={selectRoom}
        onCreate={createRoom}
        onJoin={joinRoom}
        onLogout={logout}
        search={search}
        setSearch={setSearch}
        users={users}
        onDM={startDM}
        onDeleteConversation={deleteConversation}
        onRenameRoom={renameRoom}
        user={user}
        unreadCounts={unreadCounts}
      />
      <ChatWindow room={selectedRoom} />
    </div>
  );
}
