import axios from "axios";
import { useAuthStore } from "../store/useAuthStore";

// Use dynamic base URL: Production (Vercel) vs Development (Vite Proxy)
const API_URL = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : "/api";

export const axiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Check if error is 401 AND we are not already trying to logout
    // Also skip if the failed request WAS the logout request itself
    if (
      error.response?.status === 401 &&
      !originalRequest.url.includes("logout") &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      try {
        await useAuthStore.getState().logout();
        // No need for window.location because logout() clears authUser 
        // and App.jsx will redirect to /login automatically
      } catch (err) {
        console.error("Logout failed:", err);
      }
    }
    return Promise.reject(error);
  }
);