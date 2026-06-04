import axios from "axios";

const api = axios.create({
  baseURL: "https://docushield-backend-qn71.onrender.com/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;