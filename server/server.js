import "dotenv/config";
import express from "express";
import http from "http";
import cors from "cors";
import { Server } from "socket.io";
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/auth.routes.js";
import roomRoutes from "./routes/room.routes.js";
import messageRoutes from "./routes/message.routes.js";
import { registerSocketHandlers } from "./sockets/socketHandlers.js";

await connectDB();

const app = express();
const httpServer = http.createServer(app);

const allowedOrigins = process.env.VITE_API_URL
  ? process.env.VITE_API_URL.split(",").map(x => x.trim())
  : ["http://localhost:5173"];

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json({ limit: "2mb" }));

app.get("/api/health", (_, res) => res.json({ status: "ok", service: "syncspace-server" }));
app.use("/api/auth", authRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/rooms", messageRoutes);

const io = new Server(httpServer, {
  cors: { origin: allowedOrigins, credentials: true }
});

registerSocketHandlers(io);

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => console.log(`SyncSpace server running on port ${PORT}`));
