import axios from "axios";

export const API_URL = "https://chatroom-6dks.onrender.com/api";
export const SOCKET_URL = "https://chatroom-6dks.onrender.com";

const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use(config => {
  const token = localStorage.getItem("syncspace_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
