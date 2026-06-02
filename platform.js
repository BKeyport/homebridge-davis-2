
const Fetcher = require("./fetcher");
const Parser = require("./parser");
const Registry = require("./registry");
const AccessoryFactory = require("./accessoryFactory");

class DavisPlatform {

  constructor(log, config, api) {

    // HARD GUARD: prevents duplicate platform instances in same process
    if (global.__davis2_platform_instance__) {
      log.warn("Duplicate Davis2 platform instance detected — aborting initialization");
      return global.__davis2_platform_instance__;
    }

    global.__davis2_platform_instance__ = this;

    this.log = log;
    this.config = config;
    this.api = api;

    this.url = config.url;

    this.pollingIntervalSeconds = config.pollingIntervalSeconds || 60;

    this.staleAfterSeconds = (config.staleAfterMinutes || 5) * 60;

    this.txids = config.txids || [1];

    // raw debug toggle from config
    this.verboseLogging = config.verboseLogging ?? false;

    this.fetcher = null;
    this.parser = null;
    this.registry = null;
    this.factory = null;

    this.pendingCachedAccessories = [];

    this.log.info("Homebridge-Davis-2 initializing");

    this.api.on("didFinishLaunching", () => {
      this.initialize();
    });
  }

  /**
   * CENTRALIZED VERBOSE CHECK
   * fixes: "isVerbose is not a function"
   */
  isVerbose() {
    return this.verboseLogging === true;
  }

  configureAccessory(accessory) {

    if (this.factory) {
      this.factory.configureAccessory(accessory);
    } else {
      this.pendingCachedAccessories.push(accessory);
      this.log.debug("configureAccessory buffered (factory not ready)");
    }
  }

  initialize() {

    this.parser = new Parser(this);
    this.registry = new Registry(this);
    this.factory = new AccessoryFactory(this);

    // flush cached accessories safely
    for (const accessory of this.pendingCachedAccessories) {
      this.factory.configureAccessory(accessory);
    }

    this.pendingCachedAccessories = [];

    this.fetcher = new Fetcher(this);
    this.fetcher.start();
  }

  onFetchSuccess(payload) {

    const parsed = this.parser.parse(payload);
    if (!parsed) return;

    this.registry.update(parsed);
    this.factory.updateAll();
  }
}

module.exports = DavisPlatform;
