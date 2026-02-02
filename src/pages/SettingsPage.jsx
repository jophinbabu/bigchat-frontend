import { useThemeStore } from "../store/useThemeStore";

// Define the themes you want to support
const THEMES = [
  "light", "dark", "cupcake", "bumblebee", "emerald", "corporate",
  "synthwave", "retro", "cyberpunk", "valentine", "halloween",
  "garden", "forest", "aqua", "lofi", "pastel", "fantasy",
  "wireframe", "black", "luxury", "dracula", "cmyk", "autumn",
  "business", "acid", "lemonade", "night", "coffee", "winter",
  "dim", "nord", "sunset",
];

const SettingsPage = () => {
  const { theme, setTheme } = useThemeStore();

  return (
    <div className="h-screen container mx-auto px-4 pt-20 max-w-5xl">
      <div className="space-y-6">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold">Theme</h2>
          <p className="text-sm text-base-content/60">Choose your interface theme</p>
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
          {THEMES.map((t) => (
            <button
              key={t}
              className={`
                group flex flex-col items-center gap-1.5 p-2 rounded-lg transition-colors
                ${theme === t ? "bg-base-200" : "hover:bg-base-200/50"}
              `}
              onClick={() => setTheme(t)}
            >
              <div className="relative h-8 w-full rounded-md overflow-hidden" data-theme={t}>
                <div className="absolute inset-0 grid grid-cols-4 gap-px p-1">
                  <div className="rounded bg-primary"></div>
                  <div className="rounded bg-secondary"></div>
                  <div className="rounded bg-accent"></div>
                  <div className="rounded bg-neutral"></div>
                </div>
              </div>
              <span className="text-[11px] font-medium truncate w-full text-center">
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </span>
            </button>
          ))}
        </div>

        {/* Preview Section */}
        <h3 className="text-lg font-semibold mb-3">Preview</h3>
        <div className="rounded-xl border border-base-300 overflow-hidden bg-transparent backdrop-blur-lg shadow-lg">
          <div className="p-4 bg-base-200">
            <div className="max-w-lg mx-auto">
              {/* Mock Chat UI */}
              <div className="bg-transparent rounded-xl shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-base-300 bg-transparent">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-content font-medium">
                      J
                    </div>
                    <div>
                      <h3 className="font-medium text-sm">John Doe</h3>
                      <p className="text-xs text-base-content/70">Online</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 space-y-4 min-h-[200px] max-h-[200px] overflow-y-auto bg-transparent">
                  {/* Mock Messages */}
                  <div className="flex justify-start">
                    <div className="max-w-[80%] rounded-xl p-3 shadow-sm bg-base-200">
                      <p className="text-sm">Hey! How's it going?</p>
                      <p className="text-[10px] mt-1.5 text-base-content/70">12:00 PM</p>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <div className="max-w-[80%] rounded-xl p-3 shadow-sm bg-primary text-primary-content">
                      <p className="text-sm">I'm doing great! Just working on the chat app.</p>
                      <p className="text-[10px] mt-1.5 text-primary-content/70">12:01 PM</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notification Debugger Section */}
      <div className="mt-10 p-6 bg-base-200 rounded-lg">
        <h3 className="text-lg font-bold mb-4">Notification Debugger (Mobile)</h3>
        <div className="flex flex-col gap-2 font-mono text-sm">
          <p>Permission: <span className="font-bold">{Notification.permission}</span></p>
          <p>Service Worker: <span className="font-bold">{"serviceWorker" in navigator ? "Supported" : "Not Supported"}</span></p>
          <p>HTTPS: <span className="font-bold">{window.location.protocol === "https:" || window.location.hostname === "localhost" ? "Yes" : "No (Push requires HTTPS)"}</span></p>
        </div>

        <div className="mt-4 flex gap-4">
          <button
            className="btn btn-primary"
            onClick={async () => {
              // Manual Request
              const permission = await Notification.requestPermission();
              alert(`Msg Permission: ${permission}`);
              if (permission === 'granted') {
                // Trigger Subscription
                import("../store/useChatStore").then(({ useChatStore }) => {
                  useChatStore.getState().subscribeToPushNotifications();
                  alert("Triggered Subscription. Check Toasts.");
                });
              }
            }}
          >
            Enable Notifications
          </button>

          <button
            className="btn btn-secondary"
            onClick={() => {
              if ("serviceWorker" in navigator) {
                navigator.serviceWorker.register("/service-worker.js")
                  .then(reg => alert("SW Registered: " + reg.scope))
                  .catch(err => alert("SW Error: " + err.message));
              } else {
                alert("SW Not Supported");
              }
            }}
          >
            Re-Register SW
          </button>
        </div>
        <p className="text-xs mt-2 text-base-content/60">Note: On Mobile, you must click 'Enable' manually if the automatic prompt was blocked.</p>
      </div>
    </div>
  );
};
export default SettingsPage;