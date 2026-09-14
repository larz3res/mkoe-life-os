// Stand-in for the Claude-artifact "window.storage" API, backed by the
// browser's localStorage so the app works as a normal hosted website.
// Same shape (get/set/delete), so App.jsx doesn't need to know the difference.

const PREFIX = "lifeos:";

export const storage = {
  async get(key) {
    try {
      const v = localStorage.getItem(PREFIX + key);
      return v === null ? null : { key, value: v };
    } catch {
      return null;
    }
  },
  async set(key, value) {
    try {
      localStorage.setItem(PREFIX + key, value);
      return { key, value };
    } catch {
      return null;
    }
  },
  async delete(key) {
    try {
      localStorage.removeItem(PREFIX + key);
      return { key, deleted: true };
    } catch {
      return null;
    }
  },
};
