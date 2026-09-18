import { Router } from "express";
import { createMessage, deleteMessage, editMessage, getMessages } from "../controllers/message.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = Router();
router.use(protect);
router.get("/:id/messages", getMessages);
router.post("/:id/messages", createMessage);
router.patch("/:id/messages/:messageId", editMessage);
router.delete("/:id/messages/:messageId", deleteMessage);
export default router;
