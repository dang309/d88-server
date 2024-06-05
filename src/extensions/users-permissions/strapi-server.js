const { callback } = require("./controllers/auth");
const { me } = require("./controllers/user");

module.exports = (plugin) => {
  plugin.controllers.auth["callback"] = callback;
  plugin.controllers.user["me"] = me;

  return plugin;
};
