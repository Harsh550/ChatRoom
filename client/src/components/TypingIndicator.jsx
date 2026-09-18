export default function TypingIndicator({ name }) {
  if (!name) return <div className="h-6" />;
  return <div className="h-6 px-1 text-xs text-slate-500">{name} is typing...</div>;
}
