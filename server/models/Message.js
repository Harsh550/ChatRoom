import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  room: { type: mongoose.Schema.Types.ObjectId, ref: "Room", required: true, index: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  text: { type: String, required: true, trim: true, maxlength: 5000 },
  readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  deletedFor: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  deletedForEveryone: { type: Boolean, default: false },
  deletedAt: { type: Date, default: null },
  editedAt: { type: Date, default: null }
}, { timestamps: true });

messageSchema.index({ room: 1, createdAt: -1 });

export default mongoose.model("Message", messageSchema);
