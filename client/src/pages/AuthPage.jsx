import { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function AuthPage() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async e => {
    e.preventDefault();
    setError(""); setBusy(true);
    try {
      if (mode === "login") await login(form.email, form.password);
      else await register(form.name, form.email, form.password);
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    } finally { setBusy(false); }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-5">
      <div className="w-full max-w-md rounded-2xl bg-white p-7 shadow-2xl">
        <h1 className="text-2xl font-bold">SyncSpace</h1>
        <p className="mt-1 text-sm text-slate-500">Real-time chat & collaboration</p>
        <form onSubmit={submit} className="mt-7 space-y-4">
          {mode === "register" && <input required placeholder="Full name" value={form.name} onChange={e => setForm({...form, name:e.target.value})} className="w-full rounded-lg border px-3 py-3 outline-none focus:border-slate-500" />}
          <input required type="email" placeholder="Email" value={form.email} onChange={e => setForm({...form, email:e.target.value})} className="w-full rounded-lg border px-3 py-3 outline-none focus:border-slate-500" />
          <input required minLength={6} type="password" placeholder="Password" value={form.password} onChange={e => setForm({...form, password:e.target.value})} className="w-full rounded-lg border px-3 py-3 outline-none focus:border-slate-500" />
          {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>}
          <button disabled={busy} className="w-full rounded-lg bg-slate-900 py-3 font-semibold text-white disabled:opacity-60">{busy ? "Please wait..." : mode === "login" ? "Sign in" : "Create account"}</button>
        </form>
        <button onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }} className="mt-5 w-full text-sm text-slate-600 hover:text-slate-900">
          {mode === "login" ? "New to SyncSpace? Create an account" : "Already have an account? Sign in"}
        </button>
      </div>
    </div>
  );
}
