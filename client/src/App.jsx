import { AuthProvider, useAuth } from "./context/AuthContext";
import { SocketProvider } from "./context/SocketContext";
import AuthPage from "./pages/AuthPage";
import ChatLayout from "./pages/ChatLayout";

function AppContent() {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">Loading ChatRoom...</div>;
  return user ? <SocketProvider><ChatLayout /></SocketProvider> : <AuthPage />;
}

export default function App() {
  return <AuthProvider><AppContent /></AuthProvider>;
}
