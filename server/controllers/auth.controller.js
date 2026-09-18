import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { signToken } from "../middleware/auth.middleware.js";

const publicUser = (u) => ({
  id: u._id,
  name: u.name,
  email: u.email,
  isOnline: u.isOnline,
  lastSeen: u.lastSeen
});

export const register = async (req, res) => {
  const { name, email, password } = req.body;
  if (!name?.trim() || !email?.trim() || !password)
    return res.status(400).json({ message: "Name, email and password are required" });
  if (password.length < 6)
    return res.status(400).json({ message: "Password must be at least 6 characters" });

  const exists = await User.findOne({ email: email.toLowerCase() });
  if (exists) return res.status(409).json({ message: "Email already registered" });

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({ name: name.trim(), email: email.toLowerCase(), passwordHash });
  res.status(201).json({ token: signToken(user._id), user: publicUser(user) });
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: email?.toLowerCase() });
  if (!user || !(await bcrypt.compare(password || "", user.passwordHash)))
    return res.status(401).json({ message: "Invalid email or password" });

  res.json({ token: signToken(user._id), user: publicUser(user) });
};

export const me = async (req, res) => res.json({ user: publicUser(req.user) });
