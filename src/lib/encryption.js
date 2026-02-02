import CryptoJS from "crypto-js";

const SECRET_KEY = import.meta.env.VITE_MESSAGE_SECRET_KEY || "default-secret-key-123";

export const encryptMessage = (text) => {
    if (!text) return text;
    return CryptoJS.AES.encrypt(text, SECRET_KEY).toString();
};

export const decryptMessage = (cipherText) => {
    if (!cipherText) return cipherText;
    try {
        const bytes = CryptoJS.AES.decrypt(cipherText, SECRET_KEY);
        const originalText = bytes.toString(CryptoJS.enc.Utf8);
        // If decryption fails (empty string or malformed), return original to be safe 
        // (though in strict mode we might want to hide it, but legacy messages are plain)
        return originalText || cipherText;
    } catch (error) {
        console.warn("Failed to decrypt message:", error);
        return cipherText;
    }
};
