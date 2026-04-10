import axios from "axios";

// Use environment variable, fallback to production URL
const baseURL = import.meta.env.VITE_BACKEND_URL || "https://jira-mul1.onrender.com";

console.log("🔌 API Base URL:", baseURL);

const api = axios.create({
  baseURL,
  withCredentials: true,  // Enable cookies/credentials for CORS
  timeout: 10000,         // 10 second timeout
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// Error interceptor for debugging
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/";
    }
    return Promise.reject(error);
  }
);

export default api;