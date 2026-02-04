import { useEffect, useRef, useState } from "react";
import Peer from "simple-peer";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { Phone, PhoneOff, Video } from "lucide-react";
import toast from "react-hot-toast";

const CallModal = () => {
    const { socket, authUser } = useAuthStore();
    const { isReceivingCall, callerSignal, callerName, callerId, selectedUser, resetCall, isCallAccepted, setCallAccepted, callType } = useChatStore();

    const [stream, setStream] = useState(null);

    const myVideo = useRef();
    const userVideo = useRef();
    const connectionRef = useRef();

    useEffect(() => {
        let currentStream = null;

        const initMedia = async () => {
            try {
                if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                    toast.error("Camera access denied. Secure context (HTTPS) or localhost required.");
                    resetCall();
                    return;
                }
                const constraints = {
                    video: callType === "video",
                    audio: true
                };
                currentStream = await navigator.mediaDevices.getUserMedia(constraints);
                setStream(currentStream);
                if (myVideo.current && callType === "video") myVideo.current.srcObject = currentStream;

                if (!isReceivingCall && selectedUser) {
                    const peer = new Peer({
                        initiator: true,
                        trickle: false,
                        stream: currentStream,
                    });

                    peer.on("signal", (data) => {
                        socket.emit("callUser", {
                            userToCall: selectedUser._id,
                            signalData: data,
                            from: authUser._id,
                            name: authUser.fullName,
                            callType: callType,
                        });
                    });

                    peer.on("stream", (remoteStream) => {
                        if (userVideo.current && callType === "video") userVideo.current.srcObject = remoteStream;
                    });

                    socket.on("callAccepted", (signal) => {
                        setCallAccepted(true);
                        peer.signal(signal);
                    });

                    connectionRef.current = peer;
                }
            } catch (error) {
                console.error("Media error:", error);
                if (error.name === "NotReadableError") {
                    toast.error("Camera or Microphone is already in use.");
                } else {
                    toast.error("Could not access camera/microphone.");
                }
                resetCall();
            }
        };

        initMedia();

        return () => {
            socket.off("callAccepted");
            if (currentStream) {
                currentStream.getTracks().forEach(track => track.stop());
            }
            if (connectionRef.current) {
                connectionRef.current.destroy();
            }
        };
    }, []); // Run once on mount

    // Auto-answer if incoming call is accepted
    useEffect(() => {
        if (isReceivingCall && isCallAccepted && stream && !connectionRef.current) {
            answerCall();
        }
    }, [isCallAccepted, isReceivingCall, stream]);

    const answerCall = () => {
        const peer = new Peer({
            initiator: false,
            trickle: false,
            stream: stream,
        });

        peer.on("signal", (data) => {
            socket.emit("answerCall", { signal: data, to: callerId });
        });

        peer.on("stream", (currentStream) => {
            if (userVideo.current && callType === "video") userVideo.current.srcObject = currentStream;
        });

        peer.signal(callerSignal);
        connectionRef.current = peer;
    };

    const endCall = () => {
        // Stop tracks
        if (stream) stream.getTracks().forEach(track => track.stop());
        if (connectionRef.current) connectionRef.current.destroy();

        // Notify other user
        const targetId = isReceivingCall ? callerId : selectedUser?._id;
        socket.emit("endCall", { to: targetId });

        resetCall(); // Close modal
    };

    return (
        <div className="fixed inset-0 bg-black/80 z-50 flex flex-col items-center justify-center">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-4xl p-4">

                {/* My Video / Avatar */}
                <div className="relative bg-zinc-800 rounded-xl overflow-hidden aspect-video flex items-center justify-center">
                    {callType === "video" ? (
                        <video playsInline muted ref={myVideo} autoPlay className="w-full h-full object-cover" />
                    ) : (
                        <div className="avatar placeholder">
                            <div className="bg-neutral text-neutral-content rounded-full w-24">
                                <span className="text-3xl">{authUser?.fullName?.charAt(0).toUpperCase()}</span>
                            </div>
                        </div>
                    )}
                    <p className="absolute bottom-2 left-2 bg-black/50 px-2 rounded text-white text-sm">Me ({callType})</p>
                </div>

                {/* Their Video / Avatar */}
                {isCallAccepted ? (
                    <div className="relative bg-zinc-800 rounded-xl overflow-hidden aspect-video flex items-center justify-center">
                        {callType === "video" ? (
                            <video playsInline ref={userVideo} autoPlay className="w-full h-full object-cover" />
                        ) : (
                            <div className="avatar placeholder">
                                <div className="bg-neutral text-neutral-content rounded-full w-24">
                                    <span className="text-3xl">
                                        {(isReceivingCall ? callerName : selectedUser?.fullName)?.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                            </div>
                        )}
                        <p className="absolute bottom-2 left-2 bg-black/50 px-2 rounded text-white text-sm">
                            {isReceivingCall ? callerName : selectedUser?.fullName}
                        </p>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center bg-zinc-800 rounded-xl aspect-video text-white animate-pulse">
                        <p className="text-xl font-bold mb-4">
                            Calling...
                        </p>
                    </div>
                )}
            </div>

            <button onClick={endCall} className="mt-8 btn btn-error btn-circle btn-lg">
                <PhoneOff size={32} />
            </button>
        </div>
    );
};

export default CallModal;