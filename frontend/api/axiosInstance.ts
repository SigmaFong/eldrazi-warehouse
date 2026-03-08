import axios from "axios";

const axiosInstance = axios.create({
  baseURL:         "http://localhost:5000/api",
  withCredentials: true,          // sends HTTP-only cookie automatically
  headers: {
    "Content-Type": "application/json",
  },
});

// ── Request interceptor: attach Bearer token from localStorage ────────────
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("eldrazi_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor: unwrap error messages cleanly ───────────────────
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message ??
      error.message ??
      "An unexpected error occurred";
    return Promise.reject(new Error(message));
  }
);

export default axiosInstance;
