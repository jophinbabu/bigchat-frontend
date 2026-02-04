import { useEffect, useRef } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import { formatMessageTime } from "../lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Check, CheckCheck } from "lucide-react";

const ChatContainer = ({ onBack }) => {
  const {
    messages,
    getMessages,
    isMessagesLoading,
    selectedUser,
    subscribeToMessages,
    unsubscribeFromMessages,
    markMessagesAsRead,
    typingUser,
  } = useChatStore();
  const { authUser } = useAuthStore();
  const messageEndRef = useRef(null);

  useEffect(() => {
    getMessages(selectedUser._id);
    markMessagesAsRead(selectedUser._id);
    subscribeToMessages();

    return () => unsubscribeFromMessages();
  }, [selectedUser._id, getMessages, subscribeToMessages, unsubscribeFromMessages, markMessagesAsRead]);

  useEffect(() => {
    if (messageEndRef.current && messages) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  if (isMessagesLoading) {
    return (
      <div className="flex-1 flex flex-col bg-base-100/50">
        <div className="relative z-20">
          <ChatHeader onBack={onBack} />
        </div>
        <div className="flex-1 overflow-y-auto">
          <MessageSkeleton />
        </div>
        <div className="p-3 sm:p-4 bg-base-100/40 backdrop-blur-md border-t border-base-content/5 relative z-20">
          <MessageInput />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-[url('/chat_bg.jpg?v=2')] bg-cover bg-center bg-no-repeat relative">
      <div className="absolute inset-0 bg-black/5 pointer-events-none" />

      {/* Fixed Header */}
      <div className="relative z-20">
        <ChatHeader onBack={onBack} />
      </div>

      {/* Scrollable Messages Area */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-4 sm:space-y-6 relative z-10">
        <AnimatePresence initial={false}>
          {messages.map((message, index) => {
            const isMe = message.sender.toString() === authUser._id.toString();

            return (
              <motion.div
                key={message._id}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.3, delay: (messages.length - index < 10) ? (messages.indexOf(message) % 10) * 0.05 : 0 }}
                className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                ref={messageEndRef}
              >
                <div className={`flex gap-2 sm:gap-3 max-w-[90%] sm:max-w-[85%] ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                  <div className="shrink-0 flex items-end mb-1 hidden sm:flex">
                    <img
                      src={isMe ? authUser.profilePic || "/avatar.png" : selectedUser.profilePic || "/avatar.png"}
                      alt="profile"
                      className="size-8 rounded-xl object-cover ring-2 ring-base-100 shadow-sm"
                    />
                  </div>

                  <div className="flex flex-col">
                    <div
                      className={`
                        px-3 sm:px-4 py-2 sm:py-3 shadow-md
                        ${isMe
                          ? "bg-primary text-primary-content rounded-2xl rounded-tr-none"
                          : "bg-base-100 text-base-content rounded-2xl rounded-tl-none border border-base-content/5"
                        }
                      `}
                    >
                      {message.image && (
                        <motion.img
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          src={message.image}
                          alt="Attachment"
                          className="max-w-[200px] sm:max-w-[240px] rounded-xl mb-2 shadow-inner cursor-pointer hover:opacity-95 transition-opacity"
                        />
                      )}
                      {message.text && <p className="text-sm sm:text-[15px] leading-relaxed break-words">{message.text}</p>}
                      {message.audioUrl && (
                        <div className="mt-2 min-w-[180px] sm:min-w-[240px]">
                          {message.duration ? (
                            <div className="text-xs opacity-50 mb-1 ml-1 flex items-center gap-1">
                              <span className={`size-1.5 rounded-full ${isMe ? "bg-base-100" : "bg-primary"} animate-pulse`}></span>
                              Voice Note • {Math.floor(message.duration / 60)}:{(message.duration % 60).toString().padStart(2, '0')}
                            </div>
                          ) : null}
                          <audio
                            src={`${message.audioUrl}?t=cors_fix`}
                            controls
                            crossOrigin="anonymous"
                            className={`w-full h-10 ${isMe ? "brightness-110" : ""}`}
                          />
                        </div>
                      )}
                    </div>

                    <div className={`mt-1 sm:mt-1.5 flex items-center gap-2 px-1 ${isMe ? "justify-end" : "justify-start"}`}>
                      <span className="text-[9px] sm:text-[10px] font-bold opacity-30 uppercase tracking-widest">
                        {formatMessageTime(message.createdAt)}
                      </span>
                      {isMe && (
                        <div className="flex items-center">
                          {message.isRead ? (
                            <CheckCheck className="size-3 sm:size-3.5 text-blue-400 stroke-[3px]" />
                          ) : (
                            <Check className="size-3 sm:size-3.5 text-base-content/30 stroke-[3px]" />
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Real-time Typing Indicator */}
        <AnimatePresence>
          {typingUser && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              className="flex items-center gap-2 px-1"
            >
              <div className="flex gap-1 items-center bg-base-100/50 backdrop-blur-sm px-3 py-1.5 rounded-full border border-base-content/5 shadow-sm">
                <span className="text-[10px] font-black uppercase tracking-widest text-primary animate-pulse">
                  {selectedUser.fullName.split(" ")[0]} is typing
                </span>
                <div className="flex gap-0.5">
                  <motion.div
                    animate={{ y: [0, -3, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                    className="size-1 bg-primary rounded-full"
                  />
                  <motion.div
                    animate={{ y: [0, -3, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                    className="size-1 bg-primary rounded-full"
                  />
                  <motion.div
                    animate={{ y: [0, -3, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                    className="size-1 bg-primary rounded-full"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={messageEndRef} />
      </div>

      {/* Fixed Input at Bottom */}
      <div className="p-3 sm:p-4 bg-base-100/40 backdrop-blur-md border-t border-base-content/5 relative z-20">
        <MessageInput />
      </div>
    </div>
  );
};
export default ChatContainer;