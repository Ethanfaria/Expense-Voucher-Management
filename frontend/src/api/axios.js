import axios from "axios";

const ORIGIN = import.meta.env.VITE_API_URL || "http://localhost:5000";

const api = axios.create({ baseURL: `${ORIGIN}/api` });

export const fileUrl = (path) => (path ? `${ORIGIN}${path}` : null);

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLoginCall = error.config?.url === "/auth/login";
    if (error.response?.status === 401 && !isLoginCall) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;