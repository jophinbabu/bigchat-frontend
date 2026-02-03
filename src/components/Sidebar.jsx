import { useEffect, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";
import { Users, Search, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import CreateGroupModal from "./CreateGroupModal";

const Sidebar = () => {
  const { getUsers, users, selectedUser, setSelectedUser, isUsersLoading, searchResults, searchUsers, isSearching, getGroups, groups, isGroupsLoading, unreadCounts } = useChatStore();
  const { onlineUsers } = useAuthStore();
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);

  console.log("Sidebar Rendered. UnreadCounts:", unreadCounts);

  // Load Recent Chats and Groups on Mount
  useEffect(() => {
    if (useAuthStore.getState().authUser) {
      getUsers();
      getGroups();
    }
  }, [getUsers, getGroups]);

  // Debounced Global Search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim()) {
        searchUsers(searchQuery);
      }
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [searchUsers, searchQuery]);

  // Filter Recent Chats locally for better UX
  const filteredRecentChats = users.filter((user) => {
    const matchesSearch = user.fullName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesOnline = showOnlineOnly ? (onlineUsers.includes(user._id) || user.fullName === "Gemini AI") : true;
    return matchesSearch && matchesOnline;
  });

  const filteredGroups = groups.filter((group) => {
    return group.groupName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Helper to render user item
  const renderUserItem = (user, animateDelay = 0) => (
    <motion.button
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2, delay: animateDelay }}
      key={user._id}
      onClick={() => {
        setSelectedUser(user);
        // Optional: clear search if you want
        // setSearchQuery(""); 
      }}
      className={`
        w-full p-3 flex items-center gap-4 rounded-2xl
        transition-all duration-300 group
        ${selectedUser?._id === user._id
          ? "bg-primary/10 text-primary shadow-sm"
          : "hover:bg-base-content/5 text-base-content/70 hover:text-base-content active:bg-base-content/10"
        }
      `}
    >
      <div className="relative shrink-0">
        <img
          src={user.profilePic || "/avatar.png"}
          alt={user.fullName}
          className={`size-12 object-cover rounded-2xl transition-transform duration-500 group-hover:scale-105 ${selectedUser?._id === user._id ? "ring-2 ring-primary/20" : ""}`}
        />
        {(onlineUsers.includes(user._id) || user.fullName === "Gemini AI") && (
          <span
            className="absolute -bottom-0.5 -right-0.5 size-3.5 bg-green-500 
            rounded-full ring-2 ring-base-100 shadow-sm"
          />
        )}
        {/* Unread message badge */}
        {unreadCounts[user._id] > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-error text-error-content text-xs font-bold rounded-full flex items-center justify-center px-1 ring-2 ring-base-100 shadow-sm animate-pulse">
            {unreadCounts[user._id] > 99 ? "99+" : unreadCounts[user._id]}
          </span>
        )}
      </div>

      <div className="text-left min-w-0 flex-1">
        <div className="font-bold truncate text-[15px]">{user.fullName}</div>
        <div className="text-xs font-medium opacity-50 truncate">
          {onlineUsers.includes(user._id) || user.fullName === "Gemini AI" ? "Active now" : "Offline"}
        </div>
      </div>
    </motion.button>
  );

  const renderGroupItem = (group, animateDelay = 0) => (
    <motion.button
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2, delay: animateDelay }}
      key={group._id}
      onClick={() => {
        // Adapt group object to fit selectedUser interface temporarily
        // or ensure Store handles it. Store checks _id.
        // We add fullName for display compatibility if needed, but easier to just use groupName in Header.
        setSelectedUser({ ...group, fullName: group.groupName, profilePic: group.groupImage });
      }}
      className={`
        w-full p-3 flex items-center gap-4 rounded-2xl
        transition-all duration-300 group
        ${selectedUser?._id === group._id
          ? "bg-primary/10 text-primary shadow-sm"
          : "hover:bg-base-content/5 text-base-content/70 hover:text-base-content active:bg-base-content/10"
        }
      `}
    >
      <div className="relative shrink-0">
        <div className={`size-12 rounded-2xl flex items-center justify-center bg-base-300 ${selectedUser?._id === group._id ? "ring-2 ring-primary/20" : ""}`}>
          <Users className="size-6 opacity-60" />
        </div>
      </div>

      <div className="text-left min-w-0 flex-1">
        <div className="font-bold truncate text-[15px]">{group.groupName}</div>
        <div className="text-xs font-medium opacity-50 truncate">
          {group.participants.length} members
        </div>
      </div>
    </motion.button>
  );

  const renderSkeleton = () => (
    Array(3).fill(null).map((_, idx) => (
      <div key={idx} className="w-full p-3 flex items-center gap-4">
        <div className="skeleton size-12 rounded-full shrink-0" />
        <div className="hidden lg:block text-left min-w-0 flex-1">
          <div className="skeleton h-4 w-32 mb-2" />
          <div className="skeleton h-3 w-16" />
        </div>
      </div>
    ))
  );

  return (
    <aside className="h-full w-full md:w-80 border-r border-base-content/10 flex flex-col transition-all duration-300 bg-base-100/20 backdrop-blur-sm">
      {/* Header */}
      <div className="w-full p-4 md:p-6 border-b border-base-content/10 space-y-3 md:space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Users className="size-5" />
            </div>
            <span className="font-bold text-lg tracking-tight">Messages</span>
          </div>
          {/* Add Group Button */}
          <button
            onClick={() => setIsGroupModalOpen(true)}
            className="btn btn-circle btn-ghost btn-sm tooltip tooltip-bottom"
            data-tip="Create Group"
          >
            <Plus className="size-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-base-content/40" />
          <input
            type="text"
            placeholder="Search contacts..."
            className="input input-sm w-full pl-9 bg-base-content/5 border-none focus:ring-1 focus:ring-primary/50 transition-all rounded-xl"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Lists */}
      <div className="flex-1 overflow-y-auto w-full py-3 px-2 space-y-1">

        {/* Global Search Results */}
        {searchQuery.trim().length > 0 && (
          <div className="mb-6">
            <div className="text-xs font-bold text-base-content/40 uppercase tracking-widest px-4 mb-2">
              Global Search
            </div>
            {isSearching ? renderSkeleton() : (
              <AnimatePresence>
                {searchResults.length === 0 ? (
                  <p className="text-sm text-base-content/40 px-4 py-2">No users found</p>
                ) : (
                  searchResults.map((user, idx) => renderUserItem(user, idx * 0.05))
                )}
              </AnimatePresence>
            )}
          </div>
        )}

        {/* Groups */}
        {!showOnlineOnly && filteredGroups.length > 0 && (
          <div className="mb-2">
            <div className="text-xs font-bold text-base-content/40 uppercase tracking-widest px-4 mb-2">
              Groups
            </div>
            <AnimatePresence>
              {filteredGroups.map((group, idx) => renderGroupItem(group, idx * 0.05))}
            </AnimatePresence>
          </div>
        )}

        {/* Recent Chats */}
        <div className="mb-2">
          <div className="text-xs font-bold text-base-content/40 uppercase tracking-widest px-4 mb-2">
            {searchQuery.trim().length > 0 ? "Matching Conversations" : "Direct Messages"}
          </div>

          {isUsersLoading ? renderSkeleton() : (
            <AnimatePresence>
              {filteredRecentChats.length === 0 ? (
                <div className="text-center text-base-content/40 py-4">
                  {searchQuery ? "No matching conversations" : "No recent chats"}
                </div>
              ) : (
                filteredRecentChats.map((user, idx) => renderUserItem(user, idx * 0.05))
              )}
            </AnimatePresence>
          )}
        </div>

      </div>

      <CreateGroupModal isOpen={isGroupModalOpen} onClose={() => setIsGroupModalOpen(false)} />
    </aside>
  );
};

export default Sidebar;