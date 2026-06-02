/* Service worker de Web Push para PUEBLO (Sprint 13).
 *
 * Recibe el push del servidor (lib/push/send.ts) y muestra la notificación.
 * El payload es el JSON que arma `construirNotificacion`: { title, body, url, tag }.
 */

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: "PUEBLO", body: event.data ? event.data.text() : "" };
  }

  const title = data.title || "PUEBLO";
  const options = {
    body: data.body || "",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    tag: data.tag || undefined,
    // Con un tag, renotify hace que el dispositivo vuelva a avisar al reemplazar.
    renotify: Boolean(data.tag),
    data: { url: data.url || "/" },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // Si ya hay una pestaña en esa ruta, la enfocamos en vez de abrir otra.
        for (const client of clientList) {
          if (client.url.includes(url) && "focus" in client) {
            return client.focus();
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(url);
        }
      }),
  );
});
