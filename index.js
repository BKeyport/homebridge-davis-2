const PLATFORM_NAME = "Davis2";
const PLUGIN_NAME = "homebridge-davis-2";

const DavisPlatform = require("./platform");

// Global guard prevents double registration in same Node process
let initialized = false;

module.exports = (api) => {

  if (initialized) {
    console.log("[Davis Weather System] Plugin already initialized — skipping duplicate registration");
    return;
  }

  initialized = true;

  api.registerPlatform(
    PLUGIN_NAME,
    PLATFORM_NAME,
    DavisPlatform
  );
};
