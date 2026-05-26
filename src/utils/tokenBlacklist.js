const blacklist = new Set();

module.exports = {
  addToBlacklist: (token) => blacklist.add(token),
  isBlacklisted: (token) => blacklist.has(token),
};
