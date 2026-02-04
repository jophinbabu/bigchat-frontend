import { create } from "zustand";
import { axiosInstance } from "../lib/axios.js";
import toast from "react-hot-toast";
import { useAuthStore } from "./useAuthStore";

import { encryptMessage, decryptMessage } from "../lib/encryption";
import { playNotificationSound } from "../lib/sounds"; // Import sound util

export const useChatStore = create((set, get) => ({
  // --- Existing Chat State ---
  messages: [],
  users: [], // Keep this for "Recent Chats"
  searchResults: [], // New: For global search results
  selectedUser: null,
  isUsersLoading: false, // For initial load (Recent Chats)
  isSearching: false, // For search request
  isMessagesLoading: false,

  // --- New Call State (Added for Video Calls) ---
  isCalling: false,       // Are WE starting a call?
  isReceivingCall: false, // Is someone calling US?
  isCallAccepted: false,  // Has the call been accepted?
  callerName: "",         // Name of the person calling us
  callerSignal: null,     // WebRTC signal data
  callerId: null,         // User ID of the caller
  callType: null,         // "audio" or "video"
  isWhiteboardOpen: false, // Is the whiteboard modal open?
  typingUser: null,       // User ID of the person typing to us
  unreadCounts: {},       // Track unread message counts per user: { [userId]: count }

  // --- Message Actions ---
  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      // Fetch only recent chats (no search query)
      const res = await axiosInstance.get("/users");
      set({ users: res.data });
    } catch (error) {
      // Ignore 401s (handled by interceptor)
      if (error.response?.status !== 401) {
        toast.error(error.response.data.message);
      }
    } finally {
      set({ isUsersLoading: false });
    }
  },

  searchUsers: async (searchString) => {
    if (!searchString) return;
    set({ isSearching: true });
    try {
      const res = await axiosInstance.get(`/users?search=${searchString}`);
      set({ searchResults: res.data });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isSearching: false });
    }
  },

  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      // Decrypt messages here
      const decryptedMessages = res.data.map(msg => ({
        ...msg,
        text: decryptMessage(msg.text)
      }));
      set({ messages: decryptedMessages });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  sendMessage: async (messageData) => {
    const { selectedUser, messages, users } = get();
    try {
      // Encrypt text before sending
      const encryptedData = {
        ...messageData,
        text: encryptMessage(messageData.text)
      };

      const res = await axiosInstance.post(
        `/messages/send/${selectedUser._id}`,
        encryptedData
      );

      // Decrypt the response just in case (though we usually just need the text we sent)
      const newMessage = { ...res.data, text: decryptMessage(res.data.text) };

      set({ messages: [...messages, newMessage] });

      // Add selectedUser to users list (sidebar) if not already there
      const userExists = users.some(u => u._id === selectedUser._id);
      if (!userExists) {
        set({ users: [selectedUser, ...users] });
      }
    } catch (error) {
      toast.error(error.response.data.message);
    }
  },

  markMessagesAsRead: async (userId) => {
    try {
      await axiosInstance.put(`/messages/read/${userId}`);

      set({
        messages: get().messages.map((msg) =>
          msg.sender.toString() === userId.toString() ? { ...msg, isRead: true } : msg
        ),
      });
    } catch (error) {
      console.error("Failed to mark read:", error);
    }
  },

  subscribeToMessages: () => {
    const { selectedUser } = get();
    if (!selectedUser) return;

    const socket = useAuthStore.getState().socket;

    // Remove existing listeners first to prevent duplicates
    socket.off("newMessage");
    socket.off("messagesRead");
    socket.off("displayTyping");
    socket.off("hideTyping");

    socket.on("newMessage", (newMessage) => {
      console.log("New message received via socket:", newMessage);

      // Ignore messages sent by self (safety check)
      const authUser = useAuthStore.getState().authUser;
      if (newMessage.sender === authUser?._id || newMessage.sender?._id === authUser?._id) return;

      const { selectedUser } = get();
      if (!selectedUser) return;

      // Extract sender ID (handle both string and object formats)
      const senderId = newMessage.sender?._id || newMessage.sender;
      const selectedId = selectedUser._id;

      // More robust matching for both DM and Group messages
      const isMessageForCurrentChat =
        newMessage.conversationId?.toString() === selectedId.toString() || // Group Match
        senderId.toString() === selectedId.toString(); // DM Match

      console.log("Message matching check:", {
        senderId: senderId.toString(),
        selectedId: selectedId.toString(),
        conversationId: newMessage.conversationId?.toString(),
        isForCurrentChat: isMessageForCurrentChat
      });

      if (!isMessageForCurrentChat) {
        // Global listener in useAuthStore handles notifications/unread counts
        return;
      }

      // Decrypt incoming message
      const decryptedMessage = {
        ...newMessage,
        text: decryptMessage(newMessage.text)
      };

      set({
        messages: [...get().messages, decryptedMessage],
      });
      get().markMessagesAsRead(selectedUser._id);
    });

    socket.on("messagesRead", ({ readBy }) => {
      const authUser = useAuthStore.getState().authUser;
      if (selectedUser && readBy.toString() === selectedUser._id.toString()) {
        set({
          messages: get().messages.map((msg) =>
            msg.sender.toString() === authUser._id.toString() ? { ...msg, isRead: true } : msg
          ),
        });
      }
    });

    socket.on("displayTyping", ({ senderId }) => {
      if (selectedUser && senderId.toString() === selectedUser._id.toString()) {
        set({ typingUser: senderId });
      }
    });

    socket.on("hideTyping", ({ senderId }) => {
      if (selectedUser && senderId.toString() === selectedUser._id.toString()) {
        set({ typingUser: null });
      }
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;
    socket.off("newMessage");
    socket.off("messagesRead");
    socket.off("displayTyping");
    socket.off("hideTyping");
  },

  setSelectedUser: (selectedUser) => {
    if (selectedUser) {
      // Clear unread count when selecting a user
      const newUnreadCounts = { ...get().unreadCounts };
      delete newUnreadCounts[selectedUser._id];
      set({ selectedUser, unreadCounts: newUnreadCounts });
    } else {
      set({ selectedUser });
    }
  },

  // --- Call Actions (Added for Video Calls) ---

  // Call this when we click the "Video Icon" to start a call
  setIsCalling: (status, type = "video") => set({ isCalling: status, callType: type }),

  // Call this when the socket tells us "Incoming Call!"
  setIncomingCall: (callData) =>
    set({
      isReceivingCall: true,
      isCallAccepted: false,
      callerName: callData.name,
      callerSignal: callData.signal,
      callerId: callData.from,
      callType: callData.callType || "video", // Default to video if not specified
    }),

  // Accept the call
  setCallAccepted: (status) => set({ isCallAccepted: status }),

  // Call this when call ends or is rejected
  resetCall: () =>
    set({
      isCalling: false,
      isReceivingCall: false,
      isCallAccepted: false, // Reset
      callerName: "",
      callerSignal: null,
      callerId: null,
      callType: null,
    }),

  // --- Web Push Subscription ---
  subscribeToPushNotifications: async () => {
    try {
      if (!("serviceWorker" in navigator)) return;
      if (!("PushManager" in window)) return;

      console.log("Attempting to subscribe to push...");
      console.log("Current Notification Permission:", Notification.permission);
      const registration = await navigator.serviceWorker.ready;
      console.log("SW Registration found:", registration);

      // Fetch VAPID Key from backend
      const res = await axiosInstance.get("/config/vapid-public-key");
      const publicVapidKey = res.data.publicKey;

      const convertedVapidKey = urlBase64ToUint8Array(publicVapidKey);

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey
      });

      console.log("Got Push Subscription:", subscription);

      await axiosInstance.post("/users/subscribe", { subscription });
      console.log("Web Push Subscribed Successfully!");
      toast.success("Notifications Enabled!");

    } catch (error) {
      console.error("Failed to subscribe to push notifications:", error);
      toast.error("Failed to enable notifications. Permission denied?");
    }
  },

  // --- Group Chat Actions ---
  groups: [],
  isGroupsLoading: false,

  getGroups: async () => {
    set({ isGroupsLoading: true });
    try {
      const res = await axiosInstance.get("/groups");
      set({ groups: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch groups");
    } finally {
      set({ isGroupsLoading: false });
    }
  },

  createGroup: async (name, members) => {
    try {
      const res = await axiosInstance.post("/groups/create", { name, members });
      set({ groups: [res.data, ...get().groups] });
      toast.success("Group created successfully");
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create group");
      return false;
    }
  },

  // --- Whiteboard Actions ---
  openWhiteboard: () => set({ isWhiteboardOpen: true }),
  closeWhiteboard: () => set({ isWhiteboardOpen: false }),
}));

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}