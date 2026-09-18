import mongoose from "mongoose";

const roomSchema = new mongoose.Schema({
  name: { type: String, trim: true, default: "" },
  isPrivate: { type: Boolean, default: false },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  hiddenFor: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    deletedAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

export default mongoose.model("Room", roomSchema);
