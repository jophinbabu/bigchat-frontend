import { useChatStore } from "../store/useChatStore";
import { motion } from "framer-motion";

import Sidebar from "../components/Sidebar";
import NoChatSelected from "../components/NoChatSelected";
import ChatContainer from "../components/ChatContainer";

const HomePage = () => {
  const { selectedUser, setSelectedUser } = useChatStore();

  // Handle back to sidebar on mobile
  const handleBackToSidebar = () => {
    setSelectedUser(null);
  };

  return (
    <div className="h-screen bg-[url('/home_bg.jpg')] bg-cover bg-center bg-no-repeat overflow-hidden relative">
      <div className="absolute inset-0 bg-black/40" />
      <div className="flex items-center justify-center pt-20 px-2 sm:px-4 h-full relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="bg-base-100/10 backdrop-blur-2xl rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-7xl h-[calc(100vh-5rem)] sm:h-[calc(100vh-6rem)] border border-white/5 ring-1 ring-white/5"
        >
          <div className="flex h-full rounded-2xl sm:rounded-3xl overflow-hidden">
            {/* Sidebar - hidden on mobile when chat is selected */}
            <div className={`${selectedUser ? "hidden md:flex" : "flex"} h-full`}>
              <Sidebar />
            </div>

            {/* Chat area - hidden on mobile when no chat selected */}
            <div className={`${selectedUser ? "flex" : "hidden md:flex"} flex-1 h-full`}>
              {!selectedUser ? (
                <NoChatSelected />
              ) : (
                <ChatContainer onBack={handleBackToSidebar} />
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
export default HomePage;