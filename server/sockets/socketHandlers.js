import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Room from "../models/Room.js";
import Message from "../models/Message.js";

const onlineSockets = new Map();

const userFromSocket = async (socket) => {
  const token = socket.handshake.auth?.token;
  if (!token) throw new Error("Unauthorized");
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const user = await User.findById(decoded.userId).select("-passwordHash");
  if (!user) throw new Error("Unauthorized");
  return user;
};

const broadcastPresence = async (io, userId, event, payload) => {
  const rooms = await Room.find({ members: userId }).select("_id");
  for (const room of rooms) io.to(room._id.toString()).emit(event, payload);
};

export const registerSocketHandlers = (io) => {
  io.use(async (socket, next) => {
    try {
      socket.user = await userFromSocket(socket);
      next();
    } catch {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", async (socket) => {
    const user = socket.user;
    socket.join(`user:${user._id}`);

    if (!onlineSockets.has(user._id.toString())) {
      onlineSockets.set(user._id.toString(), new Set());
      user.isOnline = true;
      user.lastSeen = null;
      await user.save();
      await broadcastPresence(io, user._id, "user-online", {
        userId: user._id,
        isOnline: true
      });
    }
    onlineSockets.get(user._id.toString()).add(socket.id);

    const rooms = await Room.find({ members: user._id }).select("_id");
    rooms.forEach(r => socket.join(r._id.toString()));

    socket.on("join-room", async (roomId) => {
      const room = await Room.findById(roomId).select("members");
      if (room?.members.some(id => id.equals(user._id))) socket.join(roomId);
    });

    socket.on("leave-room", (roomId) => socket.leave(roomId));

    socket.on("send-message", async ({ roomId, text }, ack) => {
      try {
        const room = await Room.findById(roomId).select("members");
        if (!room || !room.members.some(id => id.equals(user._id))) throw new Error("Not a room member");
        const clean = text?.trim();
        if (!clean) throw new Error("Empty message");

        const message = await Message.create({
          room: roomId,
          sender: user._id,
          text: clean,
          readBy: [user._id]
        });
        await message.populate("sender", "name email");
        io.to(roomId).emit("new-message", message);
        ack?.({ ok: true, message });
      } catch (error) {
        ack?.({ ok: false, message: error.message });
      }
    });

    socket.on("typing", ({ roomId }) => socket.to(roomId).emit("typing", {
      roomId, userId: user._id, name: user.name
    }));

    socket.on("stop-typing", ({ roomId }) => socket.to(roomId).emit("stop-typing", {
      roomId, userId: user._id
    }));

    socket.on("edit-message", async ({ roomId, messageId, text }, ack) => {
      try {
        const room = await Room.findById(roomId).select("members");
        if (!room || !room.members.some(id => id.equals(user._id))) throw new Error("Not a room member");
        const message = await Message.findOne({ _id: messageId, room: roomId });
        if (!message) throw new Error("Message not found");
        if (!message.sender.equals(user._id)) throw new Error("You can only edit your own messages");
        if (message.deletedForEveryone) throw new Error("Deleted messages cannot be edited");
        const clean = text?.trim();
        if (!clean) throw new Error("Message text is required");
        message.text = clean;
        message.editedAt = new Date();
        await message.save();
        await message.populate("sender", "name email");
        io.to(roomId).emit("message-edited", message);
        ack?.({ ok: true, message });
      } catch (error) {
        ack?.({ ok: false, message: error.message });
      }
    });

    socket.on("delete-message", async ({ roomId, messageId }, ack) => {
      try {
        const room = await Room.findById(roomId).select("members");
        if (!room || !room.members.some(id => id.equals(user._id))) throw new Error("Not a room member");
        const message = await Message.findOne({ _id: messageId, room: roomId });
        if (!message) throw new Error("Message not found");
        if (!message.sender.equals(user._id)) throw new Error("You can only delete your own messages");
        message.deletedForEveryone = true;
        message.deletedAt = new Date();
        message.text = "This message was deleted";
        await message.save();
        await message.populate("sender", "name email");
        io.to(roomId).emit("message-deleted", message);
        ack?.({ ok: true, message });
      } catch (error) { ack?.({ ok: false, message: error.message }); }
    });

    socket.on("mark-read", async ({ roomId, messageIds }) => {
      if (!Array.isArray(messageIds) || !messageIds.length) return;
      const room = await Room.findById(roomId).select("members");
      if (!room?.members.some(id => id.equals(user._id))) return;

      await Message.updateMany(
        { _id: { $in: messageIds }, room: roomId },
        { $addToSet: { readBy: user._id } }
      );
      io.to(roomId).emit("message-read", {
        roomId, messageIds, userId: user._id
      });
    });

    socket.on("disconnect", async () => {
      const sockets = onlineSockets.get(user._id.toString());
      if (!sockets) return;
      sockets.delete(socket.id);
      if (sockets.size === 0) {
        onlineSockets.delete(user._id.toString());
        const freshUser = await User.findById(user._id);
        if (freshUser) {
          freshUser.isOnline = false;
          freshUser.lastSeen = new Date();
          await freshUser.save();
          await broadcastPresence(io, user._id, "user-offline", {
            userId: user._id,
            isOnline: false,
            lastSeen: freshUser.lastSeen
          });
        }
      }
    });
  });
};
