import { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Loader } from "lucide-react";
import { Toaster } from "react-hot-toast";

import { useAuthStore } from "./store/useAuthStore";
import { useThemeStore } from "./store/useThemeStore";
import { useChatStore } from "./store/useChatStore"; // Import Chat Store

import HomePage from "./pages/HomePage";
import AuthPage from "./pages/AuthPage";
import Navbar from "./components/Navbar";
import SettingsPage from "./pages/SettingsPage";
import ProfilePage from "./pages/ProfilePage";
import CallModal from "./components/CallModal"; // Import Call Modal
import { playRingtone, stopRingtone } from "./lib/sounds"; // Import sound utils

const App = () => {
  const { theme } = useThemeStore();
  const { authUser, checkAuth, isCheckingAuth, socket } = useAuthStore();
  const { isCalling, isReceivingCall, setIncomingCall, resetCall, subscribeToPushNotifications } = useChatStore();



  // 1. Check Authentication & Permissions on Mount
  useEffect(() => {
    checkAuth();
    // Request Notification Permission
    if ("Notification" in window) {
      Notification.requestPermission();
    }

    // Register Service Worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/service-worker.js")
        .then(() => {
          console.log("SW Registered");
        })
        .catch(err => console.log("SW Registration failed:", err));
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
    socket.on("callUser", (data) => {
      setIncomingCall(data);
      playRingtone(); // Start ringing

      // Show system notification
      if (Notification.permission === "granted") {
        new Notification("Incoming Call", {
          body: `${data.name} is calling you...`,
          icon: "/logo.jpg" // Optional: assume logo exists or use default
        });
      }
    });

    // When the call ends (or is rejected)
    socket.on("callEnded", () => {
      resetCall();
      stopRingtone(); // Stop ringing
    });

    return () => {
      socket.off("callUser");
      socket.off("callEnded");
      stopRingtone(); // Cleanup
    };
  }, [socket, setIncomingCall, resetCall]);

  // Loading State
  if (isCheckingAuth && !authUser) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader className="size-10 animate-spin" />
      </div>
    );
  }

  // Determine if we should show the call screen
  const showCallModal = isCalling || isReceivingCall;

  return (
    <div data-theme={theme}>
      {/* 3. Render Call Modal globally over everything */}
      {showCallModal && <CallModal />}

      <Navbar />

      <Routes>
        <Route path="/" element={authUser ? <HomePage /> : <Navigate to="/login" />} />

        {/* Auth Routes */}
        <Route path="/signup" element={!authUser ? <AuthPage initialMode="signup" /> : <Navigate to="/" />} />
        <Route path="/login" element={!authUser ? <AuthPage initialMode="login" /> : <Navigate to="/" />} />

        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/profile" element={authUser ? <ProfilePage /> : <Navigate to="/login" />} />
      </Routes>

      <Toaster />
    </div>
  );
};

export default App;