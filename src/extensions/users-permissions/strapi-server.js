const { callback } = require("./controllers/auth");

module.exports = (plugin) => {
  plugin.controllers.auth["callback"] = callback;

  return plugin;
};
