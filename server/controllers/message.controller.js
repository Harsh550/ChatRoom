import Message from "../models/Message.js";
import Room from "../models/Room.js";

export const getMessages = async (req, res) => {
  const room = await Room.findById(req.params.id);
  if (!room) return res.status(404).json({ message: "Room not found" });
  if (!room.members.some(id => id.equals(req.user._id)))
    return res.status(403).json({ message: "Join the room first" });

  const limit = Math.min(Math.max(Number(req.query.limit) || 30, 1), 100);
  const filter = { room: room._id, deletedFor: { $ne: req.user._id } };

  if (req.query.before) {
    const cursor = await Message.findById(req.query.before).select("createdAt");
    if (cursor) filter.createdAt = { $lt: cursor.createdAt };
  }

  const messages = await Message.find(filter)
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate("sender", "name email")
    .populate("readBy", "name");

  res.json({ messages: messages.reverse(), hasMore: messages.length === limit });
};

export const createMessage = async (req, res) => {
  const room = await Room.findById(req.params.id);
  if (!room) return res.status(404).json({ message: "Room not found" });
  if (!room.members.some(id => id.equals(req.user._id)))
    return res.status(403).json({ message: "Join the room first" });

  const text = req.body.text?.trim();
  if (!text) return res.status(400).json({ message: "Message text is required" });

  const message = await Message.create({
    room: room._id, sender: req.user._id, text, readBy: [req.user._id]
  });
  res.status(201).json({ message: await message.populate("sender", "name email") });
};

export const editMessage = async (req, res) => {
  const message = await Message.findById(req.params.messageId);
  if (!message) return res.status(404).json({ message: "Message not found" });
  if (!message.sender.equals(req.user._id))
    return res.status(403).json({ message: "You can only edit your own messages" });
  if (message.deletedForEveryone)
    return res.status(400).json({ message: "Deleted messages cannot be edited" });

  const text = req.body.text?.trim();
  if (!text) return res.status(400).json({ message: "Message text is required" });

  message.text = text;
  message.editedAt = new Date();
  await message.save();
  await message.populate("sender", "name email");
  res.json({ message });
};

export const deleteMessage = async (req, res) => {
  const message = await Message.findById(req.params.messageId);
  if (!message) return res.status(404).json({ message: "Message not found" });
  if (!message.sender.equals(req.user._id))
    return res.status(403).json({ message: "You can only delete your own messages" });
  if (message.deletedForEveryone)
    return res.status(400).json({ message: "Message is already deleted" });

  message.deletedForEveryone = true;
  message.deletedAt = new Date();
  message.text = "This message was deleted";
  await message.save();
  await message.populate("sender", "name email");
  res.json({ message });
};
