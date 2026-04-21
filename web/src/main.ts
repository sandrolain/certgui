// Entry point: register all components and mount the app.
import "./cg-app.js";

// Auto-reload the page when the server restarts.
// The EventSource reconnects automatically; on reconnect after the first
// connection we know the server was restarted, so reload to get fresh assets.
let _sseConnected = false;
const _es = new EventSource("/api/v1/events");
_es.addEventListener("open", () => {
  if (_sseConnected) {
    window.location.reload();
  }
  _sseConnected = true;
});
