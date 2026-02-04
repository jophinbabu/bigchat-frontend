import { Video, X, ArrowLeft, Users, Phone, Pen } from "lucide-react";
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
    <div className="px-3 sm:px-4 py-3 border-b border-base-300 bg-base-100/80 backdrop-blur-md sticky top-0 z-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Back button - visible on mobile */}
          <button
            onClick={handleBack}
            className="md:hidden btn btn-ghost btn-circle btn-sm"
          >
            <ArrowLeft className="size-5" />
          </button>

          {/* Avatar */}
          <div className="avatar">
            <div className="size-10 rounded-full relative ring-1 ring-base-300/50 flex items-center justify-center bg-base-300 text-base-content/50 overflow-hidden">
              {isGroup ? (
                selectedUser.groupImage ? (
                  <img src={selectedUser.groupImage} alt={selectedUser.groupName} />
                ) : (
                  <Users className="size-6" />
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
          <div>
            <h3 className="font-semibold text-sm sm:text-base">
              {isGroup ? selectedUser.groupName : selectedUser.fullName}
            </h3>
            <p className="text-xs text-base-content/70">
              {isGroup
                ? `${selectedUser.participants.length} members${onlineCount > 0 ? `, ${onlineCount} online` : ''}`
                : (onlineUsers.includes(selectedUser._id) ? "Online" : "Offline")
              }
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          {/* Hide Video for Groups for now unless we implement Group Calls */}
          {!isGroup && (
            <>
              <button
                onClick={() => useChatStore.getState().setIsCalling(true, "audio")}
                className="btn btn-ghost btn-circle btn-sm text-primary hover:bg-primary/10"
              >
                <Phone className="size-5" />
              </button>
              <button
                onClick={() => useChatStore.getState().setIsCalling(true, "video")}
                className="btn btn-ghost btn-circle btn-sm text-primary hover:bg-primary/10"
              >
                <Video className="size-5" />
              </button>
              <button
                onClick={() => useChatStore.getState().openWhiteboard()}
                className="btn btn-ghost btn-circle btn-sm text-primary hover:bg-primary/10"
                title="Collaborative Whiteboard"
              >
                <Pen className="size-5" />
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