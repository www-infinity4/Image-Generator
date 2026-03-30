/* =====================================================================
   Image-Generator — Auth System
   auth.js — login / register, SHA-256 passwords, AES-GCM encrypted
             profile storage.  Ported from Mario-spin by www-infinity4.
   ===================================================================== */
window.AUTH = (() => {
  "use strict";

  const USERS_KEY      = "ig_users_v1";
  const SESSION_KEY    = "ig_session_v1";
  // Default admin seed — only used if no admin entry exists in localStorage.
  // Change password via Sign Up with role upgrade or by clearing localStorage.
  const ADMIN_USERNAME = "Kris";
  const ADMIN_EMAIL    = "tigerbalm7623@gmail.com";
  const ADMIN_PASSWORD = "Kris";

  async function sha256(text) {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
    return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  async function deriveKey(password, salt) {
    const mat = await crypto.subtle.importKey(
      "raw", new TextEncoder().encode(password), { name: "PBKDF2" }, false, ["deriveKey"]
    );
    return crypto.subtle.deriveKey(
      { name: "PBKDF2", salt, iterations: 310000, hash: "SHA-256" },
      mat, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]
    );
  }

  async function encryptData(data, password) {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv   = crypto.getRandomValues(new Uint8Array(12));
    const key  = await deriveKey(password, salt);
    const enc  = new TextEncoder().encode(JSON.stringify(data));
    const cipher = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, enc);
    const combined = new Uint8Array(16 + 12 + cipher.byteLength);
    combined.set(salt, 0); combined.set(iv, 16);
    combined.set(new Uint8Array(cipher), 28);
    return btoa(String.fromCharCode(...combined));
  }

  function getUsers() {
    try { return JSON.parse(localStorage.getItem(USERS_KEY) || "{}"); }
    catch (_) { return {}; }
  }
  function saveUsers(u) { localStorage.setItem(USERS_KEY, JSON.stringify(u)); }

  async function ensureAdmin() {
    const users = getUsers();
    if (!users[ADMIN_USERNAME]) {
      const hash = await sha256(ADMIN_PASSWORD);
      users[ADMIN_USERNAME] = {
        username: ADMIN_USERNAME, email: ADMIN_EMAIL, passwordHash: hash,
        role: "admin", createdAt: new Date().toISOString(),
        spinCount: 0, totalScore: 0, tokens: [],
      };
      saveUsers(users);
    }
  }

  function getSession() {
    try { return JSON.parse(sessionStorage.getItem(SESSION_KEY) || "null"); }
    catch (_) { return null; }
  }
  function setSession(user) {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({
      username: user.username, email: user.email, role: user.role,
    }));
  }
  function clearSession() { sessionStorage.removeItem(SESSION_KEY); }

  async function login(usernameOrEmail, password) {
    await ensureAdmin();
    const users = getUsers();
    const hash  = await sha256(password);
    const user  = Object.values(users).find(
      (u) => (u.username === usernameOrEmail || u.email === usernameOrEmail) && u.passwordHash === hash
    );
    if (!user) throw new Error("Invalid username/email or password.");
    setSession(user);
    return { username: user.username, email: user.email, role: user.role };
  }

  async function register(username, email, password) {
    await ensureAdmin();
    if (!/^[a-zA-Z0-9_-]{2,32}$/.test(username))
      throw new Error("Username must be 2-32 alphanumeric characters (_, - allowed).");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      throw new Error("Please enter a valid email address.");
    if (password.length < 4)
      throw new Error("Password must be at least 4 characters.");
    const users = getUsers();
    if (users[username]) throw new Error("Username already taken.");
    if (Object.values(users).some((u) => u.email === email))
      throw new Error("Email already registered.");
    const hash = await sha256(password);
    const user = {
      username, email, passwordHash: hash, role: "user",
      createdAt: new Date().toISOString(),
      spinCount: 0, totalScore: 0, tokens: [],
    };
    users[username] = user;
    saveUsers(users);
    setSession(user);
    return { username, email, role: "user" };
  }

  function logout()      { clearSession(); }
  function currentUser() { return getSession(); }
  function isAdmin()     { const u = getSession(); return u && u.role === "admin"; }

  function updateUserStats(username, spinCount, totalScore) {
    const users = getUsers();
    if (users[username]) {
      users[username].spinCount  = spinCount;
      users[username].totalScore = totalScore;
      saveUsers(users);
    }
  }

  async function saveConversation(username, userMsg, aiMsg) {
    const users = getUsers();
    if (!users[username]) return;
    try {
      const seed  = username + "_conv_" + (users[username].createdAt || "");
      const entry = { ts: new Date().toISOString(), user: userMsg, ai: aiMsg };
      const enc   = await encryptData(entry, seed);
      users[username].conversations = users[username].conversations || [];
      users[username].conversations.push({ encryptedAt: entry.ts, data: enc });
      if (users[username].conversations.length > 100)
        users[username].conversations = users[username].conversations.slice(-100);
      saveUsers(users);
    } catch (_) {}
  }

  function getUserList() {
    const users = getUsers();
    return Object.values(users).map((u) => ({
      username: u.username, email: u.email, role: u.role,
      createdAt: u.createdAt, spinCount: u.spinCount, totalScore: u.totalScore,
    }));
  }

  return {
    ensureAdmin, login, register, logout, currentUser, isAdmin,
    updateUserStats, saveConversation, getUserList,
  };
})();
