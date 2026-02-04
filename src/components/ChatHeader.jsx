import { Video, X, ArrowLeft, Users, Phone, Pen, Gamepad2 } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";

const ChatHeader = ({ onBack }) => {
  const { selectedUser, setSelectedUser } = useChatStore();
  const { onlineUsers } = useAuthStore();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      setSelectedUser(null);
    }
  };

  const isGroup = selectedUser?.participants && selectedUser.participants.length > 0;

  const onlineCount = isGroup
    ? selectedUser.participants.filter(p => onlineUsers.includes(p._id)).length
    : 0;

  return (
    <div className="px-3 sm:px-4 py-3 sm:py-3.5 border-b border-base-300/30 bg-base-100/90 backdrop-blur-xl shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
          {/* Back button - visible on mobile */}
          <button
            onClick={handleBack}
            className="md:hidden btn btn-ghost btn-circle btn-sm flex-shrink-0"
          >
            <ArrowLeft className="size-5" />
          </button>

          {/* Avatar */}
          <div className="avatar flex-shrink-0">
            <div className="size-9 sm:size-10 rounded-full relative ring-1 ring-base-300/50 flex items-center justify-center bg-base-300 text-base-content/50 overflow-hidden">
              {isGroup ? (
                selectedUser.groupImage ? (
                  <img src={selectedUser.groupImage} alt={selectedUser.groupName} />
                ) : (
                  <Users className="size-5 sm:size-6" />
                )
              ) : (
                <img src={selectedUser.profilePic || "/avatar.png"} alt={selectedUser.fullName} />
              )}

              {!isGroup && onlineUsers.includes(selectedUser._id) && (
                <span className="absolute bottom-0 right-0 size-2.5 bg-green-500 rounded-full ring-2 ring-base-100" />
              )}
            </div>
          </div>

          {/* User/Group Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm sm:text-base truncate">
              {isGroup ? selectedUser.groupName : selectedUser.fullName}
            </h3>
            <p className="text-xs text-base-content/70 truncate">
              {isGroup
                ? `${selectedUser.participants.length} members${onlineCount > 0 ? `, ${onlineCount} online` : ''}`
                : (onlineUsers.includes(selectedUser._id) ? "Online" : "Offline")
              }
            </p>
          </div>
        </div>

        <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
          {/* Hide Video for Groups for now unless we implement Group Calls */}
          {!isGroup && (
            <>
              <button
                onClick={() => useChatStore.getState().setIsCalling(true, "audio")}
                className="btn btn-ghost btn-circle btn-sm text-primary hover:bg-primary/10"
                title="Voice Call"
              >
                <Phone className="size-4 sm:size-5" />
              </button>
              <button
                onClick={() => useChatStore.getState().setIsCalling(true, "video")}
                className="btn btn-ghost btn-circle btn-sm text-primary hover:bg-primary/10"
                title="Video Call"
              >
                <Video className="size-4 sm:size-5" />
              </button>
              <button
                onClick={() => useChatStore.getState().openWhiteboard()}
                className="btn btn-ghost btn-circle btn-sm text-primary hover:bg-primary/10"
                title="Whiteboard"
              >
                <Pen className="size-4 sm:size-5" />
              </button>
              <button
                onClick={() => {
                  useChatStore.getState().setGameSymbol('X'); // Initiator is X
                  useChatStore.getState().openGame();
                }}
                className="btn btn-ghost btn-circle btn-sm text-primary hover:bg-primary/10"
                title="Play Game"
              >
                <Gamepad2 className="size-4 sm:size-5" />
              </button>
            </>
          )}

          {/* Close button - hidden on mobile (use back instead) */}
          <button
            onClick={() => setSelectedUser(null)}
            className="hidden md:flex btn btn-ghost btn-circle btn-sm"
          >
            <X className="size-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
export default ChatHeader;