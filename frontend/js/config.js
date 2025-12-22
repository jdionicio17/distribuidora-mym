// frontend/js/config.js
const isLocal =
  location.hostname === "localhost" ||
  location.hostname === "127.0.0.1";

window.API_BASE = isLocal
  ? "http://localhost:3000"
  : "https://distribuidora-mym-api.onrender.com";
