import { create } from "zustand";
import { axiosInstance } from "../lib/axios.js";
import toast from "react-hot-toast";
import { io } from "socket.io-client";
import { useChatStore } from "./useChatStore";
import { playNotificationSound } from "../lib/sounds";

// Use dynamic base URL: Production (Vercel) vs Development (Vite Proxy)
const BASE_URL = import.meta.env.VITE_API_URL || "/";

export const useAuthStore = create((set, get) => ({
  authUser: null,
  isSigningUp: false,
  isLoggingIn: false,
  isCheckingAuth: true,
  onlineUsers: [],
  socket: null,
  isUpdatingProfile: false, // Added state

  checkAuth: async () => {
    try {
      const res = await axiosInstance.get("/auth/check");
      set({ authUser: res.data });
      get().connectSocket();
    } catch (error) {
      // Don't log 401 errors as they are expected when user is not logged in
      if (error.response?.status !== 401) {
        console.log("Error in checkAuth:", error);
      }
      set({ authUser: null });
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  signup: async (data) => {
    set({ isSigningUp: true });
    try {
      const res = await axiosInstance.post("/auth/signup", data);
      // Don't set authUser yet, wait for verification
      // set({ authUser: res.data }); 
      toast.success("Account created! Please verify your email.");
      return true; // Indicate success to component
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong");
      return false;
    } finally {
      set({ isSigningUp: false });
    }
  },

  verifyEmail: async (data) => {
    set({ isLoggingIn: true }); // Use logging in state or similar
    try {
      const res = await axiosInstance.post("/auth/verify-email", data);
      set({ authUser: res.data });
      toast.success("Email verified successfully!");
      get().connectSocket();
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || "Verification failed");
      return false;
    } finally {
      set({ isLoggingIn: false });
    }
  },

  login: async (data) => {
    set({ isLoggingIn: true });
    try {
      const res = await axiosInstance.post("/auth/login", data);
      set({ authUser: res.data });
      toast.success("Logged in successfully");
      get().connectSocket();
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong");
    } finally {
      set({ isLoggingIn: false });
    }
  },

  logout: async () => {
    try {
      await axiosInstance.post("/auth/logout");
      set({ authUser: null });
      toast.success("Logged out successfully");
      get().disconnectSocket();
    } catch (error) {
      // If logout fails (e.g. 401), we still want to clear the local state
      // so the user is sent to the login screen.
      console.log("Logout failed, cleaning up local state:", error);

      set({ authUser: null }); // Force local cleanup
      get().disconnectSocket();
      // DO NOT throw error here, or the interceptor will catch it loop again
    }
  },

  // Added updateProfile function
  updateProfile: async (data) => {
    set({ isUpdatingProfile: true });
    try {
      const res = await axiosInstance.put("/auth/update-profile", data);
      set({ authUser: res.data });
      toast.success("Profile updated successfully");
    } catch (error) {
      console.log("error in update profile:", error);
      toast.error(error.response?.data?.message || "Something went wrong");
    } finally {
      set({ isUpdatingProfile: false });
    }
  },

  connectSocket: () => {
    const { authUser } = get();
    if (!authUser || get().socket?.connected) return;

    // Check if socket already exists (even if not connected yet) to prevent duplicates
    if (get().socket) return;

    // Explicitly set transports to websocket to avoid polling issues if necessary,
    // though default auto-upgrade is usually fine.
    const socket = io(BASE_URL, {
      query: {
        userId: authUser._id,
      },
    });

    socket.connect();

    set({ socket: socket });

    socket.on("getOnlineUsers", (userIds) => {
      set({ onlineUsers: userIds });
    });

    // Global listener to track unread messages when no chat is open
    socket.on("newMessage", (newMessage) => {
      const { selectedUser, unreadCounts } = useChatStore.getState();
      const { authUser } = get();

      // Ignore messages sent by self
      if (newMessage.sender === authUser._id || newMessage.sender?._id === authUser._id) return;

      // Check if message is for current chat
      const isMessageForCurrentChat = selectedUser && (
        newMessage.conversationId === selectedUser._id ||
        newMessage.sender?.toString() === selectedUser._id?.toString()
      );

      // If not in current chat: Notify & Increment Unread
      if (!isMessageForCurrentChat) {
        // Notification Logic
        playNotificationSound();
        if (Notification.permission === "granted") {
          new Notification("New Message", {
            body: "You have a new message",
            icon: "/logo.jpg"
          });
        }

        let senderId = newMessage.conversationId || newMessage.sender;
        // Ensure senderId is a string key
        if (senderId && typeof senderId !== "string") {
          senderId = senderId.toString();
        }

        useChatStore.setState({
          unreadCounts: {
            ...unreadCounts,
            [senderId]: (unreadCounts[senderId] || 0) + 1
          }
        });
      }
    });
  },

  disconnectSocket: () => {
    if (get().socket?.connected) {
      get().socket.disconnect();
    }
    set({ socket: null });
  },
}));