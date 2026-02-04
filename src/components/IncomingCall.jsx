import { Phone, PhoneOff, X } from "lucide-react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { stopRingtone } from "../lib/sounds";

const IncomingCall = () => {
    const { callerName, callerId, resetCall, setCallAccepted } = useChatStore();
    const { socket } = useAuthStore();

    const handleAccept = () => {
        stopRingtone();
        setCallAccepted(true);
        // App.jsx controls logic: IncomingCall unmounts, CallModal mounts
    };

    const handleDecline = () => {
        stopRingtone();
        socket?.emit("endCall", { to: callerId, reason: "declined" });
        resetCall();
    };

    return (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-base-100 shadow-xl rounded-2xl p-4 flex flex-col items-center gap-4 w-80 border border-base-300 animate-slide-in-top">
            {/* Avatar Placeholder or Logo */}
            <div className="avatar placeholder">
                <div className="bg-neutral text-neutral-content rounded-full w-16">
                    <span className="text-xl">{callerName?.charAt(0).toUpperCase()}</span>
                </div>
            </div>

            <div className="text-center">
                <h3 className="font-bold text-lg">{callerName}</h3>
                <p className="text-sm text-base-content/70">
                    Incoming {useChatStore.getState().callType === "audio" ? "Voice" : "Video"} Call...
                </p>
            </div>

            <div className="flex gap-8 mt-2">
                {/* Accept Button */}
                <button
                    onClick={handleAccept}
                    className="btn btn-circle btn-success btn-lg shadow-lg hover:scale-110 transition-transform"
                    title="Accept Call"
                >
                    <Phone size={28} className="text-white" />
                </button>

                {/* Decline Button */}
                <button
                    onClick={handleDecline}
                    className="btn btn-circle btn-error btn-lg shadow-lg hover:scale-110 transition-transform"
                    title="Decline Call"
                >
                    <PhoneOff size={28} className="text-white" />
                </button>
            </div>
        </div>
    );
};

export default IncomingCall;
