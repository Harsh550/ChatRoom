import { Hash, LogOut, Plus, MessageCircle, UserPlus, Pencil } from "lucide-react";

export default function RoomList({
  rooms, selectedRoom, onSelect, onCreate, onJoin, onLogout,
  onDeleteConversation, onRenameRoom,
  search, setSearch, users, onDM, user, unreadCounts
}) {
  const publicRooms = rooms.filter(r => !r.isPrivate);
  const joinedRooms = publicRooms.filter(r => r.isMember);
  const discoverRooms = publicRooms.filter(r => !r.isMember);

  return (
    <aside className="flex w-full flex-col border-r border-slate-200 bg-white md:w-72">
      <div className="border-b border-slate-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">ChatRoom</h1>
            <p className="text-xs text-slate-500">Real-time collaboration</p>
          </div>
          <button onClick={onLogout} title="Logout" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">
            <LogOut size={18} />
          </button>
        </div>
        <div className="mt-4 flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-slate-900 text-center text-sm font-semibold leading-8 text-white">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold">{user?.name}</div>
            <div className="text-xs text-emerald-600">Online</div>
          </div>
        </div>
      </div>

      <div className="border-b border-slate-200 p-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Your Rooms</span>
          <button onClick={onCreate} className="rounded-md p-1 hover:bg-slate-100"><Plus size={16} /></button>
        </div>
        <div className="space-y-1">
          {joinedRooms.map(room => {
            const unread = unreadCounts?.[room._id] || 0;
            const isCreator = String(room.createdBy?._id || room.createdBy) === String(user?.id);
            return (
              <div key={room._id}
                className={`group flex w-full items-center gap-1 rounded-lg px-2 py-1 ${selectedRoom?._id === room._id ? "bg-slate-900 text-white" : "hover:bg-slate-100"}`}>
                <button onClick={() => onSelect(room)}
                  className="flex min-w-0 flex-1 items-center gap-2 px-1 py-1 text-left text-sm">
                  <Hash size={16} />
                  <span className="min-w-0 flex-1 truncate">{room.name}</span>
                  {unread > 0 && (
                    <span className={`min-w-5 rounded-full px-1.5 py-0.5 text-center text-[10px] font-bold ${selectedRoom?._id === room._id ? "bg-white text-slate-900" : "bg-slate-900 text-white"}`}>
                      {unread > 99 ? "99+" : unread}
                    </span>
                  )}
                </button>
                {isCreator && (
                  <button type="button" onClick={() => onRenameRoom?.(room)} title="Rename room"
                    className={`rounded-md p-1 opacity-0 transition group-hover:opacity-100 ${selectedRoom?._id === room._id ? "hover:bg-slate-800" : "hover:bg-slate-200"}`}>
                    <Pencil size={14} />
                  </button>
                )}
              </div>
            );
          })}
          {!joinedRooms.length && <p className="px-3 py-2 text-xs text-slate-400">No rooms joined yet.</p>}
        </div>
      </div>

      <div className="border-b border-slate-200 p-3">
        <div className="mb-2 flex items-center gap-2">
          <UserPlus size={15} className="text-slate-500" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Start DM</span>
        </div>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search users..."
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400" />
        {search && users.map(u => (
          <button key={u._id} onClick={() => onDM(u)} className="mt-1 flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left hover:bg-slate-100">
            <span className={`h-2.5 w-2.5 rounded-full ${u.isOnline ? "bg-emerald-500" : "bg-slate-300"}`} />
            <span className="truncate text-sm">{u.name}</span>
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        <div className="mb-2 flex items-center gap-2">
          <MessageCircle size={15} className="text-slate-500" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Conversations</span>
        </div>
        {rooms.filter(r => r.isPrivate).map(room => {
          const other = room.members.find(m => String(m._id) !== String(user?.id));
          const unread = unreadCounts?.[room._id] || 0;
          return (
            <div key={room._id} className={`group mb-1 flex items-center gap-2 rounded-lg px-3 py-2 ${selectedRoom?._id === room._id ? "bg-slate-900 text-white" : "hover:bg-slate-100"}`}>
              <button onClick={() => onSelect(room)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${other?.isOnline ? "bg-emerald-500" : "bg-slate-300"}`} />
                <span className="min-w-0 flex-1 truncate text-sm">{other?.name || "Direct message"}</span>
                {unread > 0 && <span className={`min-w-5 rounded-full px-1.5 py-0.5 text-center text-[10px] font-bold ${selectedRoom?._id === room._id ? "bg-white text-slate-900" : "bg-slate-900 text-white"}`}>{unread > 99 ? "99+" : unread}</span>}
              </button>
              <button type="button" onClick={() => onDeleteConversation?.(room)} title="Delete conversation" className={`rounded-md p-1 opacity-0 transition group-hover:opacity-100 ${selectedRoom?._id === room._id ? "hover:bg-slate-800" : "hover:bg-slate-200"}`}>⋮</button>
            </div>
          );
        })}

        {!!discoverRooms.length && (
          <div className="mt-5">
            <div className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Discover Rooms</div>
            <div className="space-y-1">
              {discoverRooms.map(room => (
                <div key={room._id} className="flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-slate-50">
                  <Hash size={15} className="text-slate-400" />
                  <span className="min-w-0 flex-1 truncate text-sm">{room.name}</span>
                  <button onClick={() => onJoin(room)} className="rounded-md bg-slate-900 px-2 py-1 text-xs font-semibold text-white hover:bg-slate-700">
                    Join
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
