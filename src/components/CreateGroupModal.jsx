import { useState, useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import { X, UserPlus, Check } from "lucide-react";

const CreateGroupModal = ({ isOpen, onClose }) => {
    const { users, createGroup, getUsers } = useChatStore();
    const [groupName, setGroupName] = useState("");
    const [selectedUsers, setSelectedUsers] = useState([]);

    useEffect(() => {
        if (isOpen) {
            getUsers();
        }
    }, [isOpen, getUsers]);

    const toggleUser = (userId) => {
        if (selectedUsers.includes(userId)) {
            setSelectedUsers(selectedUsers.filter((id) => id !== userId));
        } else {
            setSelectedUsers([...selectedUsers, userId]);
        }
    };

    const handleCreate = async () => {
        if (!groupName || selectedUsers.length < 2) return;
        const success = await createGroup(groupName, selectedUsers);
        if (success) {
            setGroupName("");
            setSelectedUsers([]);
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-base-100 w-full max-w-md rounded-2xl shadow-2xl p-6 relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-base-content/50 hover:text-base-content"
                >
                    <X className="size-5" />
                </button>

                <h2 className="text-xl font-bold mb-4">Create New Group</h2>

                <div className="space-y-4">
                    {/* Group Name Input */}
                    <div className="form-control">
                        <label className="label">
                            <span className="label-text font-medium">Group Name</span>
                        </label>
                        <input
                            type="text"
                            placeholder="e.g., Weekend Plans"
                            className="input input-bordered w-full"
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                        />
                    </div>

                    {/* User Selection */}
                    <div className="form-control">
                        <label className="label">
                            <span className="label-text font-medium">Select Members ({selectedUsers.length})</span>
                        </label>
                        <div className="max-h-60 overflow-y-auto space-y-2 border border-base-300 rounded-lg p-2">
                            {users.map((user) => (
                                <div
                                    key={user._id}
                                    onClick={() => toggleUser(user._id)}
                                    className={`
                    flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors
                    ${selectedUsers.includes(user._id) ? "bg-primary/10 border-primary" : "hover:bg-base-200"}
                  `}
                                >
                                    <div className="relative">
                                        <img
                                            src={user.profilePic || "/avatar.png"}
                                            alt={user.fullName}
                                            className="size-10 rounded-full object-cover"
                                        />
                                        {selectedUsers.includes(user._id) && (
                                            <div className="absolute -bottom-1 -right-1 bg-primary rounded-full p-0.5 border-2 border-base-100">
                                                <Check className="size-3 text-primary-content" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 text-left">
                                        <p className="font-medium text-sm">{user.fullName}</p>
                                        <p className="text-xs text-base-content/60">Online</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {selectedUsers.length < 2 && (
                            <p className="text-xs text-error mt-2">Select at least 2 members</p>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-3 mt-6">
                        <button className="btn btn-ghost" onClick={onClose}>
                            Cancel
                        </button>
                        <button
                            className="btn btn-primary"
                            onClick={handleCreate}
                            disabled={!groupName || selectedUsers.length < 2}
                        >
                            <UserPlus className="size-4" />
                            Create Group
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreateGroupModal;
