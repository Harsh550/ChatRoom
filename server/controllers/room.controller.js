import mongoose from "mongoose";
import Room from "../models/Room.js";
import User from "../models/User.js";

export const listRooms = async (req, res) => {
  const rooms = await Room.find({
    $or: [
      { isPrivate: false },
      { isPrivate: true, members: req.user._id, "hiddenFor.user": { $ne: req.user._id } }
    ]
  }).populate("members", "name email isOnline lastSeen").populate("createdBy", "name");

  const result = rooms.map(room => {
    const plain = room.toObject();
    plain.isMember = room.members.some(member => String(member._id) === String(req.user._id));
    return plain;
  });

  res.json({ rooms: result });
};

export const createRoom = async (req, res) => {
  const { name } = req.body;
  if (!name?.trim()) return res.status(400).json({ message: "Room name is required" });
  if (name.trim().length > 50) return res.status(400).json({ message: "Room name must be 50 characters or less" });

  const room = await Room.create({
    name: name.trim(),
    isPrivate: false,
    members: [req.user._id],
    createdBy: req.user._id
  });

  res.status(201).json({
    room: await room.populate([
      { path: "members", select: "name email isOnline lastSeen" },
      { path: "createdBy", select: "name" }
    ])
  });
};

export const updateRoom = async (req, res) => {
  const room = await Room.findById(req.params.id);
  if (!room) return res.status(404).json({ message: "Room not found" });
  if (room.isPrivate) return res.status(400).json({ message: "Only public rooms can be renamed" });
  if (!room.createdBy.equals(req.user._id))
    return res.status(403).json({ message: "Only the room creator can rename this room" });

  const name = req.body.name?.trim();
  if (!name) return res.status(400).json({ message: "Room name is required" });
  if (name.length > 50) return res.status(400).json({ message: "Room name must be 50 characters or less" });

  room.name = name;
  await room.save();
  await room.populate([
    { path: "members", select: "name email isOnline lastSeen" },
    { path: "createdBy", select: "name" }
  ]);
  res.json({ room });
};

export const joinRoom = async (req, res) => {
  const room = await Room.findById(req.params.id);
  if (!room) return res.status(404).json({ message: "Room not found" });
  if (room.isPrivate) return res.status(403).json({ message: "Private rooms cannot be joined this way" });

  if (!room.members.some(id => id.equals(req.user._id))) {
    room.members.push(req.user._id);
    await room.save();
  }
  res.json({ message: "Joined room" });
};

export const leaveRoom = async (req, res) => {
  const room = await Room.findById(req.params.id);
  if (!room) return res.status(404).json({ message: "Room not found" });
  room.members = room.members.filter(id => !id.equals(req.user._id));
  await room.save();
  res.json({ message: "Left room" });
};

export const getMembers = async (req, res) => {
  const room = await Room.findById(req.params.id).populate("members", "name email isOnline lastSeen");
  if (!room) return res.status(404).json({ message: "Room not found" });
  res.json({ members: room.members });
};

export const createDM = async (req, res) => {
  const { userId } = req.body;
  if (!mongoose.isValidObjectId(userId)) return res.status(400).json({ message: "Invalid userId" });
  if (String(userId) === String(req.user._id)) return res.status(400).json({ message: "Cannot DM yourself" });

  const target = await User.findById(userId);
  if (!target) return res.status(404).json({ message: "User not found" });

  let room = await Room.findOne({
    isPrivate: true,
    members: { $all: [req.user._id, userId], $size: 2 }
  });

  if (!room) {
    room = await Room.create({
      name: "",
      isPrivate: true,
      members: [req.user._id, userId],
      createdBy: req.user._id
    });
  } else {
    room.hiddenFor = room.hiddenFor.filter(entry => String(entry.user) !== String(req.user._id));
    await room.save();
  }

  res.status(201).json({
    room: await room.populate("members", "name email isOnline lastSeen")
  });
};

export const deleteConversation = async (req, res) => {
  const room = await Room.findById(req.params.id);
  if (!room) return res.status(404).json({ message: "Conversation not found" });
  if (!room.isPrivate) return res.status(400).json({ message: "Only direct-message conversations can be deleted here" });
  if (!room.members.some(id => id.equals(req.user._id)))
    return res.status(403).json({ message: "You are not a member of this conversation" });

  if (!room.hiddenFor.some(entry => String(entry.user) === String(req.user._id))) {
    room.hiddenFor.push({ user: req.user._id, deletedAt: new Date() });
    await room.save();
  }
  res.json({ message: "Conversation deleted for you", roomId: room._id });
};

export const searchUsers = async (req, res) => {
  const q = req.query.q?.trim();
  if (!q) return res.json({ users: [] });
  const users = await User.find({
    _id: { $ne: req.user._id },
    $or: [{ name: new RegExp(q, "i") }, { email: new RegExp(q, "i") }]
  }).select("name email isOnline lastSeen").limit(10);
  res.json({ users });
};
