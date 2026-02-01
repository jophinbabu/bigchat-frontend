import { motion } from "framer-motion";

const AuthImagePattern = ({ title, subtitle }) => {
    return (
        <div className="hidden lg:flex items-center justify-center bg-transparent backdrop-blur-xl p-16 h-full">
            <div className="max-w-md text-center">
                <div className="grid grid-cols-3 gap-6 mb-12">
                    {[...Array(9)].map((_, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0.1, scale: 0.8 }}
                            animate={{
                                opacity: [0.1, 0.3, 0.1],
                                scale: [0.8, 1, 0.8],
                                rotate: [0, 5, 0],
                            }}
                            transition={{
                                duration: 3,
                                repeat: Infinity,
                                delay: i * 0.2,
                                ease: "easeInOut",
                            }}
                            className="aspect-square rounded-2xl bg-primary/20 backdrop-blur-md border border-primary/10 shadow-lg shadow-primary/5"
                        />
                    ))}
                </div>
                <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    className="text-4xl font-extrabold mb-6 tracking-tight bg-gradient-to-br from-base-content to-base-content/60 bg-clip-text text-transparent"
                >
                    {title}
                </motion.h2>
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.5 }}
                    className="text-lg text-base-content/60 leading-relaxed font-medium"
                >
                    {subtitle}
                </motion.p>
            </div>
        </div>
    );
};

export default AuthImagePattern;
