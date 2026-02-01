import { MessageSquare, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

const NoChatSelected = () => {
  return (
    <div className="w-full flex-1 flex flex-col items-center justify-center p-8 sm:p-16 bg-base-100/20 backdrop-blur-md relative overflow-hidden">
      {/* Dynamic Background Elements */}
      <div className="absolute top-1/4 left-1/4 size-64 bg-primary/5 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 size-64 bg-secondary/5 rounded-full blur-3xl animate-pulse delay-700" />

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="max-w-md text-center space-y-8 relative z-10"
      >
        {/* Animated Icon Container */}
        <div className="flex justify-center">
          <motion.div
            animate={{
              y: [0, -12, 0],
              rotate: [0, 5, -5, 0]
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="relative group"
          >
            <div className="size-24 rounded-3xl bg-primary/15 flex items-center justify-center shadow-xl shadow-primary/5 border border-primary/10 transition-transform duration-500 group-hover:scale-110">
              <MessageSquare className="size-12 text-primary" />
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="absolute -top-2 -right-2 p-2 rounded-xl bg-secondary shadow-lg"
              >
                <Sparkles className="size-5 text-secondary-content" />
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* Text Content */}
        <div className="space-y-4">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-2xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-br from-base-content to-base-content/60 bg-clip-text text-transparent"
          >
            Communication Refined
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-sm sm:text-lg text-base-content/50 font-medium leading-relaxed"
          >
            Choose a contact from the sidebar to begin your journey. Experience messaging at its finest.
          </motion.p>
        </div>

        {/* Subtle Hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="flex justify-center pt-4"
        >
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-base-content/5 border border-base-content/5 text-xs font-bold text-base-content/30 uppercase tracking-[0.2em]">
            <div className="size-1.5 rounded-full bg-primary animate-ping" />
            Ready to Connect
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default NoChatSelected;