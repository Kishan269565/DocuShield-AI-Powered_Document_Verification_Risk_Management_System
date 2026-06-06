import axios from "axios";

const api = axios.create({
  baseURL: "https://docushield-backend-qn71.onrender.com/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add token to every request
api.interceptors.request.use((config) => {
  // Get token from cookie
  const token = document.cookie
    .split("; ")
    .find((row) => row.startsWith("token="))
    ?.split("=")[1];

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;