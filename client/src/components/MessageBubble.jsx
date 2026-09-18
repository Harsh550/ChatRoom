import { CheckCheck, Pencil, Trash2 } from "lucide-react";

export default function MessageBubble({ message, own, onDelete, onEdit }) {
  const deleted = message.deletedForEveryone;
  return (
    <div className={`group flex ${own ? "justify-end" : "justify-start"}`}>
      <div className={`relative max-w-[78%] rounded-2xl px-4 py-2.5 ${own ? "rounded-br-md bg-slate-900 text-white" : "rounded-bl-md bg-slate-100 text-slate-900"} ${deleted ? "opacity-70" : ""}`}>
        {!own && <div className="mb-1 text-xs font-bold text-slate-500">{message.sender?.name}</div>}
        <div className={`whitespace-pre-wrap break-words text-sm ${deleted ? "italic" : ""}`}>{message.text}</div>
        <div className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${own ? "text-slate-300" : "text-slate-400"}`}>
          {new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          {message.editedAt && !deleted && <span>· edited</span>}
          {own && !deleted && <CheckCheck size={13} className={(message.readBy?.length || 0) > 1 ? "text-sky-400" : ""} />}
          {deleted && <span>deleted</span>}
        </div>
        {own && !deleted && (
          <div className="absolute -left-20 top-1/2 hidden -translate-y-1/2 items-center gap-1 rounded-lg border border-slate-200 bg-white p-1 shadow-sm group-hover:flex">
            <button type="button" onClick={() => onEdit?.(message)} title="Edit message" className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900"><Pencil size={14} /></button>
            <button type="button" onClick={() => onDelete?.(message)} title="Delete message" className="rounded-md p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600"><Trash2 size={14} /></button>
          </div>
        )}
      </div>
    </div>
  );
}
