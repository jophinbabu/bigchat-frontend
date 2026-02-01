import { Link } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { LogOut, MessageSquare, Settings, User } from "lucide-react";
import { motion } from "framer-motion";

const Navbar = () => {
  const { logout, authUser } = useAuthStore();

  return (
    <header className="bg-base-100/40 backdrop-blur-xl border-b border-base-content/5 fixed w-full top-0 z-50">
      <div className="container mx-auto px-4 h-16">
        <div className="flex items-center justify-between h-full">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2.5 transition-all group">
              <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-all">
                <img src="/logo.jpg" className="w-full h-full object-cover rounded-lg" alt="Logo" />
              </div>
              <h1 className="text-xl font-black tracking-tighter group-hover:text-primary transition-colors">BigChat</h1>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/settings"
              className="btn btn-sm btn-ghost gap-2 rounded-xl transition-all hover:bg-base-content/5"
            >
              <Settings className="w-4 h-4 opacity-70" />
              <span className="hidden sm:inline font-bold text-xs uppercase tracking-wider">Settings</span>
            </Link>

            {authUser && (
              <>
                <Link to="/profile" className="btn btn-sm btn-ghost gap-2 rounded-xl transition-all hover:bg-base-content/5">
                  <User className="size-4 opacity-70" />
                  <span className="hidden sm:inline font-bold text-xs uppercase tracking-wider">Profile</span>
                </Link>

                <button
                  className="btn btn-sm btn-error/10 hover:btn-error text-error gap-2 rounded-xl transition-all border-none"
                  onClick={logout}
                >
                  <LogOut className="size-4" />
                  <span className="hidden sm:inline font-bold text-xs uppercase tracking-wider">Logout</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
export default Navbar;