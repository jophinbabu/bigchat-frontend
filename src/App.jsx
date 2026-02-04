import { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Loader } from "lucide-react";
import { Toaster } from "react-hot-toast";
import toast from "react-hot-toast";

import { useAuthStore } from "./store/useAuthStore";
import { useThemeStore } from "./store/useThemeStore";
import { useChatStore } from "./store/useChatStore"; // Import Chat Store

import HomePage from "./pages/HomePage";
import AuthPage from "./pages/AuthPage";
import Navbar from "./components/Navbar";
import SettingsPage from "./pages/SettingsPage";
import ProfilePage from "./pages/ProfilePage";
import CallModal from "./components/CallModal"; // Import Call Modal
import IncomingCall from "./components/IncomingCall"; // Import Incoming Call Modal
import WhiteboardModal from "./components/WhiteboardModal"; // Import Whiteboard Modal
import { playRingtone, stopRingtone } from "./lib/sounds"; // Import sound utils

const App = () => {
  const { theme } = useThemeStore();
  const { authUser, checkAuth, isCheckingAuth, socket } = useAuthStore();
  const { isCalling, isReceivingCall, setIncomingCall, resetCall, subscribeToPushNotifications, isCallAccepted, isWhiteboardOpen, openWhiteboard } = useChatStore();



  // 1. Check Authentication & Permissions on Mount
  useEffect(() => {
    checkAuth();
    // Request Notification Permission - REMOVED: User can enable from settings
    // if ("Notification" in window) {
    //   Notification.requestPermission();
    // }

    // Register Service Worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/service-worker.js")
        .then(() => {
          console.log("SW Registered");
        })
        .catch(err => {
          console.log("SW Registration failed:", err);
          toast.error("Push Notification Setup Failed: " + err.message);
        });
    } else {
      toast.error("Push Notifications Not Supported (Check HTTPS)");
    }
  }, [checkAuth]);

  // Re-trigger subscribe when authUser is definitely loaded
  useEffect(() => {
    if (authUser) {
      // We need to call the store action. Since it is destructured, we can use it.
      // But wait, the original code had it desturctured from useAuthStore? 
      // No, I moved it to useChatStore in previous step.
      // Let's ensure we use the one from useChatStore.
      subscribeToPushNotifications();
    }
  }, [authUser, subscribeToPushNotifications]);

  // 2. Global Socket Listeners for Calls
  useEffect(() => {
    if (!socket) return;

    // When someone calls us
    // When someone calls us
    socket.on("callUser", (data) => {
      const { isCalling, isReceivingCall, callerId } = useChatStore.getState();

      // 1. Check for duplicate/retry from same caller
      // If we are already receiving a call from THIS person, ignore duplicates
      if (isReceivingCall && callerId === data.from) {
        console.log("Duplicate call signal received, ignoring");
        return;
      }

      // 2. Genuine Busy Check
      // If we are in a call OR receiving a call from SOMEONE ELSE
      if (isCalling || isReceivingCall) {
        socket.emit("endCall", { to: data.from, reason: "busy" });
        return;
      }

      setIncomingCall(data);
      playRingtone(); // Start ringing

      // Show system notification
      if (Notification.permission === "granted") {
        new Notification(`Incoming ${data.callType === "audio" ? "Voice" : "Video"} Call`, {
          body: `${data.name} is calling you...`,
          icon: "/logo.jpg"
        });
      }
    });

    // When the call ends (or is rejected)
    socket.on("callEnded", (data) => {
      if (data?.reason === "busy") {
        toast.error("User is busy in another call.");
      } else if (data?.reason === "declined") {
        toast.error("Call declined.");
      } else {
        toast.success("Call ended.");
      }

      resetCall();
      stopRingtone(); // Stop ringing
    });

    socket.on("whiteboard-open", (data) => {
      console.log('📥 Received whiteboard-open from:', data);
      if (!isWhiteboardOpen) {

        // If we're not talking to this person, switch to them!
        if (data.sender && useChatStore.getState().selectedUser?._id !== data.sender._id) {
          useChatStore.getState().setSelectedUser(data.sender);
        }

        toast(`${data.sender?.fullName || 'Partner'} opened whiteboard`, { icon: '🎨' });
        openWhiteboard();
      }
    });

    return () => {
      socket.off("callUser");
      socket.off("callEnded");
      socket.off("whiteboard-open");
      stopRingtone(); // Cleanup
    };
  }, [socket, isCalling, isReceivingCall, setIncomingCall, resetCall, isWhiteboardOpen, openWhiteboard]);

  // Loading State
  if (isCheckingAuth && !authUser) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader className="size-10 animate-spin" />
      </div>
    );
  }

  // Determine call screen logic
  const showCallModal = isCalling || isCallAccepted;
  const showIncomingCall = isReceivingCall && !isCallAccepted;

  return (
    <div data-theme={theme}>
      <Navbar />

      <Routes>
        <Route path="/" element={authUser ? <HomePage /> : <Navigate to="/login" />} />

        {/* Auth Routes */}
        <Route path="/signup" element={!authUser ? <AuthPage initialMode="signup" /> : <Navigate to="/" />} />
        <Route path="/login" element={!authUser ? <AuthPage initialMode="login" /> : <Navigate to="/" />} />

        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/profile" element={authUser ? <ProfilePage /> : <Navigate to="/login" />} />
      </Routes>

      {/* Call Modals */}
      {showCallModal && <CallModal />}
      {showIncomingCall && <IncomingCall />}
      {isWhiteboardOpen && <WhiteboardModal />}

      <Toaster />
    </div>
  );
};

export default App;