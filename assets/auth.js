/* Image Generator local prototype account store.
   No built-in administrator, client secret, recovery password, or remote authentication claim. */
window.AUTH = (() => {
  "use strict";

  const USERS_KEY = "ig_users_v2";
  const SESSION_KEY = "ig_session_v2";
  const ITERATIONS = 210000;

  function read(key, fallback) {
    try {
      const value = JSON.parse(localStorage.getItem(key));
      return value == null ? fallback : value;
    } catch (_) {
      return fallback;
    }
  }
  function write(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
  function bytesToBase64(bytes) {
    let binary = "";
    bytes.forEach(byte => { binary += String.fromCharCode(byte); });
    return btoa(binary);
  }
  function base64ToBytes(value) {
    const binary = atob(value);
    return Uint8Array.from(binary, char => char.charCodeAt(0));
  }
  async function passwordDigest(password, saltBytes) {
    if (!crypto?.subtle) throw new Error("Secure browser cryptography is unavailable.");
    const material = await crypto.subtle.importKey(
      "raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]
    );
    const bits = await crypto.subtle.deriveBits(
      { name: "PBKDF2", hash: "SHA-256", salt: saltBytes, iterations: ITERATIONS },
      material, 256
    );
    return bytesToBase64(new Uint8Array(bits));
  }
  function publicUser(record) {
    return record ? {
      username: record.username,
      email: record.email || "",
      role: "user",
      createdAt: record.createdAt
    } : null;
  }
  function currentRecord() {
    const session = read(SESSION_KEY, null);
    if (!session?.userKey) return null;
    const users = read(USERS_KEY, {});
    return users[session.userKey] || null;
  }
  async function register(username, email, password) {
    const cleanName = String(username || "").trim().replace(/[^a-zA-Z0-9_.-]/g, "").slice(0, 40);
    const cleanEmail = String(email || "").trim().slice(0, 160);
    if (cleanName.length < 3) throw new Error("Username must be at least 3 characters.");
    if (String(password || "").length < 8) throw new Error("Password must be at least 8 characters.");
    const userKey = cleanName.toLowerCase();
    const users = read(USERS_KEY, {});
    if (users[userKey]) throw new Error("That username already exists on this device.");
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const record = {
      username: cleanName,
      email: cleanEmail,
      salt: bytesToBase64(salt),
      passwordDigest: await passwordDigest(password, salt),
      createdAt: new Date().toISOString()
    };
    users[userKey] = record;
    write(USERS_KEY, users);
    write(SESSION_KEY, { userKey, signedInAt: new Date().toISOString() });
    return publicUser(record);
  }
  async function login(usernameOrEmail, password) {
    const lookup = String(usernameOrEmail || "").trim().toLowerCase();
    const users = read(USERS_KEY, {});
    const entry = Object.entries(users).find(([key, value]) =>
      key === lookup || String(value.email || "").toLowerCase() === lookup
    );
    if (!entry) throw new Error("Invalid username/email or password.");
    const [userKey, record] = entry;
    const candidate = await passwordDigest(password, base64ToBytes(record.salt));
    if (candidate !== record.passwordDigest) throw new Error("Invalid username/email or password.");
    write(SESSION_KEY, { userKey, signedInAt: new Date().toISOString() });
    return publicUser(record);
  }
  function logout() { localStorage.removeItem(SESSION_KEY); }
  function currentUser() { return publicUser(currentRecord()); }
  function isAdmin() { return false; }
  async function ensureAdmin() { return null; }

  return { ensureAdmin, login, register, logout, currentUser, isAdmin };
})();
