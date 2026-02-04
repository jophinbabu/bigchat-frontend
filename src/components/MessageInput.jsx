import { useRef, useState, useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { axiosInstance } from "../lib/axios.js";
import { Image, Send, X, Mic, Square, Trash2, Sparkles, Loader2, Ghost } from "lucide-react";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

const MessageInput = () => {
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isInvisible, setIsInvisible] = useState(false); // New State
  const [finalDuration, setFinalDuration] = useState(0); // Store duration when recording stops

  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const timerRef = useRef(null);

  const { sendMessage, selectedUser } = useChatStore();
  const { authUser, socket } = useAuthStore();

  // Timer effect - handles recording duration counter
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => {
      clearInterval(timerRef.current);
    };
  }, [isRecording]);

  // Cleanup effect - only runs on unmount
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []); // Empty dependency - only runs on unmount

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleInputChange = (e) => {
    setText(e.target.value);
    if (!socket || !selectedUser) return;

    socket.emit("typing", {
      senderId: authUser._id,
      receiverId: selectedUser._id,
    });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("stopTyping", {
        senderId: authUser._id,
        receiverId: selectedUser._id,
      });
    }, 2000);
  };

  const startRecording = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      toast.error("Mic access denied. Secure context (HTTPS) or localhost required.");
      return;
    }
    try {
      // Request high quality audio
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      });

      // Use Opus codec for better quality
      let mimeType = "audio/webm;codecs=opus";
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = "audio/webm";
      }
      console.log("Using mimeType:", mimeType);

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      const chunks = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunks.push(e.data);
          console.log(`Audio chunk received: ${e.data.size} bytes`);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: mimeType });
        console.log(`Final audio blob: ${blob.size} bytes, type: ${mimeType}`);

        if (blob.size < 1000) {
          toast.error("Recording too short or failed. Please try again.");
          console.error("Audio blob is too small:", blob.size);
        } else {
          setAudioBlob(blob);
        }
        stream.getTracks().forEach(track => track.stop());
      };

      // Request data every 100ms to ensure we capture all audio
      mediaRecorder.start(100);
      setIsRecording(true);
      setRecordingDuration(0);
      setFinalDuration(0);
    } catch (error) {
      toast.error("Could not access microphone");
      console.error(error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      setFinalDuration(recordingDuration); // Capture the duration before stopping
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const discardRecording = () => {
    setAudioBlob(null);
    setRecordingDuration(0);
    setFinalDuration(0);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleTranscribe = async () => {
    if (!audioBlob || isTranscribing) return;
    setIsTranscribing(true);

    try {
      // Convert blob to base64
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        const base64Audio = reader.result;

        try {
          const res = await axiosInstance.post("/messages/transcribe", {
            audio: base64Audio
          });

          setText((prev) => prev + " " + res.data.text);
          toast.success("Transcription complete!");
        } catch (error) {
          console.error("Transcription failed:", error);
          toast.error("Failed to transcribe audio");
        } finally {
          setIsTranscribing(false);
        }
      };
    } catch (error) {
      console.error("Error preparing audio:", error);
      setIsTranscribing(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() && !imagePreview && !audioBlob) return;

    try {
      let audioBase64 = null;
      if (audioBlob) {
        audioBase64 = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(audioBlob);
        });
      }

      await sendMessage({
        text: text.trim(),
        image: imagePreview,
        audio: audioBase64,
        duration: finalDuration || recordingDuration, // Use captured duration
        isInvisible,
      });

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      socket.emit("stopTyping", {
        senderId: authUser._id,
        receiverId: selectedUser._id,
      });

      // Reset all state
      setText("");
      setImagePreview(null);
      setAudioBlob(null);
      setRecordingDuration(0);
      setFinalDuration(0);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  return (
    <div className="w-full">
      <AnimatePresence>
        {(imagePreview || audioBlob) && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="mb-4 flex items-center gap-3"
          >
            {imagePreview && (
              <div className="relative group">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="size-20 object-cover rounded-2xl border-2 border-primary/20 shadow-lg"
                />
                <button
                  onClick={removeImage}
                  className="absolute -top-2 -right-2 size-6 rounded-full bg-base-100 shadow-md flex items-center justify-center hover:bg-error hover:text-error-content transition-colors"
                  type="button"
                >
                  <X className="size-4" />
                </button>
              </div>
            )}

            {audioBlob && (
              <div className="bg-primary/10 px-4 py-3 rounded-2xl flex items-center gap-3 border border-primary/20 shadow-sm min-w-[200px]">
                <div className="size-10 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Mic className="size-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-primary uppercase tracking-wider">Voice Note</p>
                  <p className="text-sm font-medium opacity-60">Ready to send</p>
                </div>
                <button
                  type="button"
                  onClick={handleTranscribe}
                  disabled={isTranscribing}
                  className="p-2 rounded-xl hover:bg-primary/10 text-primary transition-colors disabled:opacity-50"
                  title="Transcribe to text"
                >
                  {isTranscribing ? (
                    <Loader2 className="size-5 animate-spin" />
                  ) : (
                    <Sparkles className="size-5" />
                  )}
                </button>
                <button
                  onClick={discardRecording}
                  className="p-2 rounded-xl hover:bg-error/10 text-error transition-colors"
                >
                  <Trash2 className="size-5" />
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSendMessage} className="flex items-center gap-1.5 sm:gap-3">
        <div className="flex-1 flex gap-1.5 sm:gap-2">
          <div className="relative flex-1 group">
            {isRecording ? (
              <div className="w-full h-10 sm:h-12 bg-error/10 rounded-xl sm:rounded-2xl flex items-center px-3 sm:px-4 animate-pulse border border-error/20">
                <div className="size-2 rounded-full bg-error animate-ping mr-2 sm:mr-3" />
                <span className="text-xs sm:text-sm font-black text-error uppercase tracking-widest flex-1">
                  Recording... {formatDuration(recordingDuration)}
                </span>
              </div>
            ) : (
              <input
                type="text"
                className="w-full input input-bordered rounded-xl sm:rounded-2xl bg-base-content/5 border-none focus:ring-2 focus:ring-primary/50 transition-all text-sm h-10 sm:h-12 pr-10 sm:pr-12"
                placeholder="Type a message..."
                value={text}
                onChange={handleInputChange}
                disabled={audioBlob !== null}
              />
            )}

            {!isRecording && (
              <>
                <button
                  type="button"
                  className={`absolute right-10 sm:right-12 top-1/2 -translate-y-1/2 p-1.5 sm:p-2 rounded-lg sm:rounded-xl transition-all
                            ${isInvisible ? "text-primary bg-primary/10" : "text-base-content/40 hover:text-primary hover:bg-primary/5"}`}
                  onClick={() => setIsInvisible(!isInvisible)}
                  title="Invisible Ink"
                >
                  <Ghost size={18} className="sm:w-5 sm:h-5" />
                </button>
                <button
                  type="button"
                  className={`absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 p-1.5 sm:p-2 rounded-lg sm:rounded-xl transition-all
                            ${imagePreview ? "text-primary bg-primary/10" : "text-base-content/40 hover:text-primary hover:bg-primary/5"}`}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={audioBlob !== null}
                >
                  <Image size={18} className="sm:w-5 sm:h-5" />
                </button>
              </>
            )}
          </div>

          <input
            type="file"
            accept="image/*"
            className="hidden"
            ref={fileInputRef}
            onChange={handleImageChange}
          />
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {!text.trim() && !imagePreview && !audioBlob && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={isRecording ? stopRecording : startRecording}
              className={`btn size-10 sm:size-12 min-h-0 rounded-xl sm:rounded-2xl shadow-lg transition-all px-0
                ${isRecording
                  ? "bg-error text-error-content hover:bg-error/90 ring-4 ring-error/20"
                  : "bg-primary/10 text-primary hover:bg-primary/20 hover:scale-105"
                }`}
            >
              {isRecording ? <Square size={18} className="sm:w-5 sm:h-5 fill-current" /> : <Mic size={18} className="sm:w-5 sm:h-5" />}
            </motion.button>
          )}

          {(text.trim() || imagePreview || audioBlob) && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="submit"
              className="size-10 sm:size-12 rounded-xl sm:rounded-2xl shadow-lg bg-primary text-zinc-900 flex items-center justify-center transition-all hover:bg-primary/90"
            >
              <Send size={18} strokeWidth={2.5} className="sm:w-5 sm:h-5" />
            </motion.button>
          )}
        </div>
      </form>
    </div>
  );
};

export default MessageInput;