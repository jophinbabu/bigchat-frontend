self.addEventListener("push", function (event) {
    const data = event.data.json();
    const title = data.title || "New Message";
    const options = {
        body: data.body || "",
        icon: data.icon || "/logo.jpg",
        badge: "/logo.jpg",
        data: {
            url: data.url || "/",
        },
    };

    event.waitUntil(
        clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
            // Check if any window is currently focused
            for (const client of clientList) {
                if (client.focused) {
                    // App is open and focused -> Do NOT show system notification
                    // (Because the app will play its own sound/toast)
                    return;
                }
            }
            // If no window is focused, show notification
            return self.registration.showNotification(title, options);
        })
    );
});

self.addEventListener("notificationclick", function (event) {
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (clientList) {
            if (clientList.length > 0) {
                let client = clientList[0];
                for (let i = 0; i < clientList.length; i++) {
                    if (clientList[i].focused) {
                        client = clientList[i];
                    }
                }
                return client.focus();
            }
            return clients.openWindow(event.notification.data.url);
        })
    );
});
