// Simple "Pop" sound for messages
const NOTIFICATION_SOUND = "data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU"; // Truncated placeholder, I will use a real short one below or just a URL if easier. 
// Actually, let's use a real, short beep URL or just a simple function that creates an oscillator if we want to be fancy.
// But for reliability with `new Audio()`, a URL is best. I'll use a reliable CDN or a short Data URI.

// Short "Pop" Message Sound (Data URI)
const MSG_SOUND = "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3";
// Phone Ringtone (Data URI or URL)
const CALL_SOUND = "https://assets.mixkit.co/active_storage/sfx/1359/1359-preview.mp3";

export const playNotificationSound = () => {
    const audio = new Audio(MSG_SOUND);
    audio.play().catch((err) => console.log("Audio play failed (interaction needed):", err));
};

let ringtoneAudio = null;

export const playRingtone = async () => {
    if (ringtoneAudio) return; // Already playing
    ringtoneAudio = new Audio(CALL_SOUND);
    ringtoneAudio.loop = true;
    try {
        await ringtoneAudio.play();
    } catch (err) {
        // Ignore AbortError (happens if stopped immediately)
        if (err.name !== "AbortError") {
            console.log("Ringtone play failed:", err);
        }
    }
};

export const stopRingtone = () => {
    if (ringtoneAudio) {
        ringtoneAudio.pause();
        ringtoneAudio.currentTime = 0;
        ringtoneAudio = null;
    }
};
