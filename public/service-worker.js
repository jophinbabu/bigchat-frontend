self.addEventListener("install", (event) => {
    self.skipWaiting();
});

self.addEventListener("activate", (event) => {
    event.waitUntil(clients.claim());
});

self.addEventListener("push", function (event) {
    let data;
    try {
        data = event.data.json();
    } catch (e) {
        data = { title: "New Message", body: "You have a new message" };
    }

    const title = data.title || "New Message";
    const options = {
        body: data.body || "",
        icon: data.icon || "/logo.jpg",
        badge: "/logo.jpg",
        vibrate: [100, 50, 100],
        data: {
            url: data.url || "/",
        },
    };

    // Simplified: Always show notification. 
    // Mobile browsers sometimes restrict 'clients.matchAll', so we prioritize delivery.
    event.waitUntil(
        self.registration.showNotification(title, options)
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
                        return client.focus();
                    }
                }
                return client.focus();
            }
            if (clients.openWindow) {
                return clients.openWindow(event.notification.data.url || '/');
            }
        })
    );
});
