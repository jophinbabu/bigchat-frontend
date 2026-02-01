import { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { Camera, Mail, User, ShieldCheck, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const ProfilePage = () => {
  const { authUser, isUpdatingProfile, updateProfile } = useAuthStore();
  const [selectedImg, setSelectedImg] = useState(null);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = async () => {
      const base64Image = reader.result;
      setSelectedImg(base64Image);
      await updateProfile({ profilePic: base64Image });
    };
  };

  const containerVariants = {
    initial: { opacity: 0, y: 20 },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
  };

  return (
    <div className="min-h-screen py-24 px-4 bg-transparent overflow-x-hidden">
      <motion.div
        variants={containerVariants}
        initial="initial"
        animate="animate"
        className="max-w-2xl mx-auto"
      >
        <div className="bg-base-100/30 backdrop-blur-3xl rounded-3xl p-8 space-y-10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] border border-white/10 ring-1 ring-white/5 relative overflow-hidden">
          {/* Subtle Background Glow */}
          <div className="absolute -top-24 -right-24 size-64 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -left-24 size-64 bg-secondary/5 rounded-full blur-3xl" />

          <motion.div variants={itemVariants} className="text-center space-y-2 relative z-10">
            <h1 className="text-4xl font-black tracking-tighter bg-gradient-to-br from-base-content to-base-content/60 bg-clip-text text-transparent">
              My Profile
            </h1>
            <p className="text-base-content/50 font-medium">Manage your personal presence and security</p>
          </motion.div>

          {/* Avatar Upload Section */}
          <motion.div variants={itemVariants} className="flex flex-col items-center gap-6 relative z-10">
            <div className="relative group">
              <div className="size-40 rounded-[2.5rem] overflow-hidden ring-4 ring-base-100/50 shadow-2xl transition-transform duration-500 group-hover:scale-[1.02]">
                <img
                  src={selectedImg || authUser.profilePic || "/avatar.png"}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              </div>

              <label
                htmlFor="avatar-upload"
                className={`
                  absolute -bottom-2 -right-2 
                  bg-primary text-primary-content hover:scale-110
                  size-12 rounded-2xl cursor-pointer 
                  flex items-center justify-center
                  transition-all duration-300 shadow-xl ring-4 ring-base-100/80
                  ${isUpdatingProfile ? "animate-pulse pointer-events-none" : "hover:rotate-12"}
                `}
              >
                {isUpdatingProfile ? (
                  <Loader2 className="size-6 animate-spin" />
                ) : (
                  <Camera className="size-6" />
                )}
                <input
                  type="file"
                  id="avatar-upload"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={isUpdatingProfile}
                />
              </label>
            </div>

            <AnimatePresence mode="wait">
              <motion.p
                key={isUpdatingProfile ? "uploading" : "idle"}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="text-sm font-bold opacity-40 uppercase tracking-[0.2em]"
              >
                {isUpdatingProfile ? "Synchronizing..." : "Update facial identity"}
              </motion.p>
            </AnimatePresence>
          </motion.div>

          {/* Basic Info */}
          <div className="grid gap-6 md:grid-cols-2 relative z-10">
            <motion.div variants={itemVariants} className="space-y-2">
              <div className="text-xs font-black uppercase tracking-widest text-base-content/40 flex items-center gap-2 px-1">
                <User className="size-3" />
                Identity Designation
              </div>
              <div className="px-5 py-4 bg-base-content/5 rounded-2xl border border-white/5 font-bold text-base-content/80 shadow-inner">
                {authUser?.fullName}
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="space-y-2">
              <div className="text-xs font-black uppercase tracking-widest text-base-content/40 flex items-center gap-2 px-1">
                <Mail className="size-3" />
                Cloud Communication
              </div>
              <div className="px-5 py-4 bg-base-content/5 rounded-2xl border border-white/5 font-bold text-base-content/80 shadow-inner truncate">
                {authUser?.email}
              </div>
            </motion.div>
          </div>

          {/* Account Metadata */}
          <motion.div
            variants={itemVariants}
            className="bg-base-content/5 rounded-3xl p-8 space-y-6 relative z-10 border border-white/5 shadow-inner"
          >
            <div className="flex items-center gap-3 border-b border-base-content/5 pb-4">
              <div className="p-2 rounded-xl bg-green-500/10 text-green-500">
                <ShieldCheck className="size-5" />
              </div>
              <h2 className="text-xl font-black tracking-tight">Security & Metadata</h2>
            </div>

            <div className="grid gap-4 text-sm font-bold">
              <div className="flex items-center justify-between p-4 rounded-2xl bg-base-100/20">
                <span className="opacity-40 uppercase tracking-wider text-[10px]">Joined Network</span>
                <span className="text-base-content/70">{authUser.createdAt?.split("T")[0]}</span>
              </div>

              <div className="flex items-center justify-between p-4 rounded-2xl bg-base-100/20">
                <span className="opacity-40 uppercase tracking-wider text-[10px]">Vault Status</span>
                <div className="flex items-center gap-2 text-green-500">
                  <div className="size-2 rounded-full bg-green-500 animate-pulse" />
                  <span>ACTIVE</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default ProfilePage;