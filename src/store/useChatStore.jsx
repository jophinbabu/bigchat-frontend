import { create } from "zustand";
import { axiosInstance } from "../lib/axios.js";
import toast from "react-hot-toast";
import { useAuthStore } from "./useAuthStore";

import { encryptMessage, decryptMessage } from "../lib/encryption";

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
  callerName: "",         // Name of the person calling us
  callerSignal: null,     // WebRTC signal data
  callerId: null,         // User ID of the caller
  typingUser: null,       // User ID of the person typing to us

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
    const { selectedUser, messages } = get();
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

    socket.on("newMessage", (newMessage) => {
      console.log("New message received via socket:", newMessage);
      const isMessageSentBySelectedUser =
        newMessage.sender.toString() === selectedUser._id.toString();

      if (!isMessageSentBySelectedUser) {
        console.log("Message is not from selected user. Ignoring.");
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

  setSelectedUser: (selectedUser) => set({ selectedUser }),

  // --- Call Actions (Added for Video Calls) ---

  // Call this when we click the "Video Icon" to start a call
  setIsCalling: (status) => set({ isCalling: status }),

  // Call this when the socket tells us "Incoming Call!"
  setIncomingCall: (callData) =>
    set({
      isReceivingCall: true,
      callerName: callData.name,
      callerSignal: callData.signal,
      callerId: callData.from,
    }),

  // Call this when call ends or is rejected
  resetCall: () =>
    set({
      isCalling: false,
      isReceivingCall: false,
      callerName: "",
      callerSignal: null,
      callerId: null,
    }),
}));