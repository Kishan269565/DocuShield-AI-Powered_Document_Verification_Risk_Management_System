import api from "@/utils/api";

export const login = async (email: string, password: string) => {
  const res = await api.post("/auth/login", {
    email,
    password,
  });

  const { token } = res.data;

  // 🔐 Store JWT for authenticated requests
  localStorage.setItem("token", token);

  return res.data;
};
