import { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Loader2, Lock, Mail, MessageSquare, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import AuthImagePattern from "../components/AuthImagePattern";

const AuthPage = ({ initialMode = "login" }) => {
    const [isLogin, setIsLogin] = useState(initialMode === "login");
    const [showPassword, setShowPassword] = useState(false);

    // Login State
    const [loginData, setLoginData] = useState({
        email: "",
        password: "",
    });

    // Signup State
    const [signupData, setSignupData] = useState({
        fullName: "",
        email: "",
        password: "",
    });

    const { login, signup, isLoggingIn, isSigningUp } = useAuthStore();
    const navigate = useNavigate();

    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        login(loginData);
    };

    const handleSignupSubmit = (e) => {
        e.preventDefault();
        if (!signupData.fullName.trim()) return toast.error("Full Name is required");
        if (!signupData.email.trim()) return toast.error("Email is required");
        if (!/\S+@\S+\.\S+/.test(signupData.email)) return toast.error("Invalid email format");
        if (!signupData.password) return toast.error("Password is required");
        if (signupData.password.length < 6) return toast.error("Password must be at least 6 characters");

        signup(signupData);
    };

    const containerVariants = {
        initial: (direction) => ({
            opacity: 0,
            x: direction > 0 ? 100 : -100,
        }),
        animate: {
            opacity: 1,
            x: 0,
            transition: {
                x: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.4 },
                staggerChildren: 0.05,
            },
        },
        exit: (direction) => ({
            opacity: 0,
            x: direction > 0 ? -100 : 100,
            transition: {
                x: { duration: 0.3 },
                opacity: { duration: 0.3 },
            },
        }),
    };

    const direction = isLogin ? -1 : 1;
    const itemVariants = {
        initial: { opacity: 0, y: 10 },
        animate: { opacity: 1, y: 0 },
    };

    return (
        <div className="min-h-screen grid lg:grid-cols-2 bg-[url('/auth_bg.jpg?v=1')] bg-cover bg-center bg-no-repeat overflow-hidden">
            {/* Left Side - Animated Forms */}
            <div className="flex flex-col justify-center items-center p-6 sm:p-12 relative z-10">
                <AnimatePresence mode="wait" custom={direction}>
                    {isLogin ? (
                        <motion.div
                            key="login"
                            custom={direction}
                            variants={containerVariants}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            className="w-full max-w-md space-y-8 p-10 bg-base-100/40 backdrop-blur-2xl rounded-3xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] border border-white/10"
                        >
                            {/* Login UI */}
                            <div className="text-center mb-8">
                                <motion.div variants={itemVariants} className="flex flex-col items-center gap-3 group">

                                    <div className="size-16 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-all duration-500 group-hover:rotate-12 shadow-inner">
                                        <img src="/logo.jpg" className="size-16 rounded-2xl object-cover" alt="Logo" />
                                    </div>
                                    <h1 className="text-3xl font-bold mt-4 tracking-tight">Welcome Back</h1>
                                    <p className="text-base-content/70 font-medium">Elevate your conversations</p>
                                </motion.div>
                            </div>

                            <form onSubmit={handleLoginSubmit} className="space-y-6">
                                <motion.div variants={itemVariants} className="form-control">
                                    <label className="label">
                                        <span className="label-text font-semibold text-base-content/80">Email</span>
                                    </label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <Mail className="h-5 w-5 text-base-content/40 group-focus-within:text-primary transition-colors" />
                                        </div>
                                        <input
                                            type="email"
                                            className="input input-bordered w-full pl-12 bg-base-100/30 border-base-content/10 focus:border-primary/50 focus:bg-base-100/50 transition-all duration-300 rounded-xl"
                                            placeholder="you@example.com"
                                            value={loginData.email}
                                            onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                                        />
                                    </div>
                                </motion.div>

                                <motion.div variants={itemVariants} className="form-control">
                                    <label className="label">
                                        <span className="label-text font-semibold text-base-content/80">Password</span>
                                    </label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <Lock className="h-5 w-5 text-base-content/40 group-focus-within:text-primary transition-colors" />
                                        </div>
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            className="input input-bordered w-full pl-12 bg-base-100/30 border-base-content/10 focus:border-primary/50 focus:bg-base-100/50 transition-all duration-300 rounded-xl"
                                            placeholder="••••••••"
                                            value={loginData.password}
                                            onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                                        />
                                        <button
                                            type="button"
                                            className="absolute inset-y-0 right-0 pr-4 flex items-center hover:text-primary transition-colors"
                                            onClick={() => setShowPassword(!showPassword)}
                                        >
                                            {showPassword ? <EyeOff className="h-5 w-5 text-base-content/40" /> : <Eye className="h-5 w-5 text-base-content/40" />}
                                        </button>
                                    </div>
                                </motion.div>

                                <motion.button
                                    variants={itemVariants}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    type="submit"
                                    className="btn btn-primary w-full h-12 rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all duration-300"
                                    disabled={isLoggingIn}
                                >
                                    {isLoggingIn ? (
                                        <div className="flex items-center gap-2">
                                            <Loader2 className="h-5 w-5 animate-spin" />
                                            <span>Signing in...</span>
                                        </div>
                                    ) : "Sign in"}
                                </motion.button>
                            </form>

                            <motion.div variants={itemVariants} className="text-center pt-4">
                                <p className="text-base-content/60 font-medium">
                                    Don&apos;t have an account?{" "}
                                    <button onClick={() => setIsLogin(false)} className="text-primary hover:underline font-bold transition-all">
                                        Create account
                                    </button>
                                </p>
                            </motion.div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="signup"
                            custom={direction}
                            variants={containerVariants}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            className="w-full max-w-md space-y-8 p-10 bg-base-100/40 backdrop-blur-2xl rounded-3xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] border border-white/10"
                        >
                            {/* Signup UI */}
                            <div className="text-center mb-8">
                                <motion.div variants={itemVariants} className="flex flex-col items-center gap-3 group">

                                    <div className="size-16 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-all duration-500 group-hover:rotate-12 shadow-inner">
                                        <img src="/logo.jpg" className="size-16 rounded-2xl object-cover" alt="Logo" />
                                    </div>
                                    <h1 className="text-3xl font-bold mt-4 tracking-tight">Create Account</h1>
                                    <p className="text-base-content/70 font-medium">Join our global community</p>
                                </motion.div>
                            </div>

                            <form onSubmit={handleSignupSubmit} className="space-y-6">
                                <motion.div variants={itemVariants} className="form-control">
                                    <label className="label">
                                        <span className="label-text font-semibold text-base-content/80">Full Name</span>
                                    </label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <User className="size-5 text-base-content/40 group-focus-within:text-primary transition-colors" />
                                        </div>
                                        <input
                                            type="text"
                                            className="input input-bordered w-full pl-12 bg-base-100/30 border-base-content/10 focus:border-primary/50 focus:bg-base-100/50 transition-all duration-300 rounded-xl"
                                            placeholder="John Doe"
                                            value={signupData.fullName}
                                            onChange={(e) => setSignupData({ ...signupData, fullName: e.target.value })}
                                        />
                                    </div>
                                </motion.div>

                                <motion.div variants={itemVariants} className="form-control">
                                    <label className="label">
                                        <span className="label-text font-semibold text-base-content/80">Email</span>
                                    </label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <Mail className="size-5 text-base-content/40 group-focus-within:text-primary transition-colors" />
                                        </div>
                                        <input
                                            type="email"
                                            className="input input-bordered w-full pl-12 bg-base-100/30 border-base-content/10 focus:border-primary/50 focus:bg-base-100/50 transition-all duration-300 rounded-xl"
                                            placeholder="you@example.com"
                                            value={signupData.email}
                                            onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                                        />
                                    </div>
                                </motion.div>

                                <motion.div variants={itemVariants} className="form-control">
                                    <label className="label">
                                        <span className="label-text font-semibold text-base-content/80">Password</span>
                                    </label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <Lock className="size-5 text-base-content/40 group-focus-within:text-primary transition-colors" />
                                        </div>
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            className="input input-bordered w-full pl-12 bg-base-100/30 border-base-content/10 focus:border-primary/50 focus:bg-base-100/50 transition-all duration-300 rounded-xl"
                                            placeholder="••••••••"
                                            value={signupData.password}
                                            onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                                        />
                                        <button
                                            type="button"
                                            className="absolute inset-y-0 right-0 pr-4 flex items-center hover:text-primary transition-colors"
                                            onClick={() => setShowPassword(!showPassword)}
                                        >
                                            {showPassword ? <EyeOff className="size-5 text-base-content/40" /> : <Eye className="size-5 text-base-content/40" />}
                                        </button>
                                    </div>
                                </motion.div>

                                <motion.button
                                    variants={itemVariants}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    type="submit"
                                    className="btn btn-primary w-full h-12 rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all duration-300"
                                    disabled={isSigningUp}
                                >
                                    {isSigningUp ? (
                                        <div className="flex items-center gap-2">
                                            <Loader2 className="size-5 animate-spin" />
                                            <span>Creating account...</span>
                                        </div>
                                    ) : "Create Account"}
                                </motion.button>
                            </form>

                            <motion.div variants={itemVariants} className="text-center pt-4">
                                <p className="text-base-content/60 font-medium">
                                    Already have an account?{" "}
                                    <button onClick={() => setIsLogin(true)} className="text-primary hover:underline font-bold transition-all">
                                        Sign in
                                    </button>
                                </p>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Right Side - Consistent Animated Pattern */}
            <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="hidden lg:block h-full"
            >
                <AuthImagePattern
                    title={isLogin ? "Welcome back!" : "Join our community"}
                    subtitle={isLogin ? "Stay connected with your community and experience next-level communication." : "Connect with friends, share moments, and experience communication refined."}
                />
            </motion.div>
        </div>
    );
};

export default AuthPage;
