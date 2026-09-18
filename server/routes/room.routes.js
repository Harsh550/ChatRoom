import { Router } from "express";
import { createDM, createRoom, deleteConversation, getMembers, joinRoom, leaveRoom, listRooms, searchUsers, updateRoom } from "../controllers/room.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = Router();
router.use(protect);
router.get("/", listRooms);
router.post("/", createRoom);
router.patch("/:id", updateRoom);
router.post("/dm", createDM);
router.delete("/:id/conversation", deleteConversation);
router.get("/users/search", searchUsers);
router.post("/:id/join", joinRoom);
router.post("/:id/leave", leaveRoom);
router.get("/:id/members", getMembers);
export default router;
