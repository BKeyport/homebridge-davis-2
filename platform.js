const Fetcher = require("./fetcher");
const Parser = require("./parser");
const Registry = require("./registry");
const AccessoryFactory = require("./accessoryFactory");
const PluginLogger = require("./pluginLogger");

class DavisPlatform {

  constructor(log, config, api) {

    this.log = log;
    this.config = config;
    this.api = api;

    this.url = config.url;

    this.pollingIntervalSeconds = config.pollingIntervalSeconds ?? 60;
    this.staleAfterSeconds = (config.staleAfterMinutes ?? 5) * 60;

    this.inputTemperatureUnit = config.inputTemperatureUnit;

    this.enableExternalSensors = config.enableExternalSensors ?? false;
    this.enableInternalSensors = config.enableInternalSensors ?? false;
    this.enableAirLink = config.enableAirLink ?? false;

    this.txids = Array.isArray(config.txids) && config.txids.length
      ? config.txids.filter(Number.isFinite)
      : [1];

    this.logger = new PluginLogger(log, config);

    this.fetcher = null;
    this.parser = null;
    this.registry = null;
    this.factory = null;

    this.pendingCachedAccessories = [];

    this.api.on("didFinishLaunching", () => {
      this.initialize();
    });
  }

  configureAccessory(accessory) {
    if (this.factory) {
      this.factory.configureAccessory(accessory);
    } else {
      this.pendingCachedAccessories.push(accessory);
    }
  }

  initialize() {

    this.logger.debug("Platform", "Initialize hit");

    this.parser = new Parser(this);
    this.registry = new Registry(this);
    this.factory = new AccessoryFactory(this);

    for (const accessory of this.pendingCachedAccessories) {
      this.factory.configureAccessory(accessory);
    }

    this.pendingCachedAccessories = [];

    // ✅ NEW: startup config INFO log
    this.logger.info(
      "Platform",
      "Config loaded | ext=%s int=%s air=%s unit=%s txids=%j interval=%ss stale=%sm",
      this.enableExternalSensors,
      this.enableInternalSensors,
      this.enableAirLink,
      this.inputTemperatureUnit,
      this.txids,
      this.pollingIntervalSeconds,
      this.staleAfterSeconds / 60
    );

    this.fetcher = new Fetcher(this);
    this.fetcher.start();

    this.logger.debug("Platform", "Fetcher started");
  }

  onFetchSuccess(payload) {

    const parsed = this.parser.parse(payload);

    if (!parsed) {
      return;
    }

    this.registry.update(parsed);
    this.factory.updateAll();
  }
}

module.exports = DavisPlatform;
