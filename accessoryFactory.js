class AccessoryFactory {

  constructor(platform) {

    this.platform = platform;
    this.log = platform.log;

    this.api = platform.api;

    this.Characteristic = this.api.hap.Characteristic;
    this.Service = this.api.hap.Service;

    this.accessories = new Map();
    this.lastState = new Map();
  }

  configureAccessory(accessory) {

    const uuid = accessory.UUID;

    if (this.accessories.has(uuid)) {
      this.platform.logger.debug(
        "Factory",
        "skip cached accessory: %s",
        accessory.displayName
      );
      return;
    }

    this.platform.logger.debug(
      "Factory",
      "restore cached accessory: %s",
      accessory.displayName
    );

    this.accessories.set(uuid, accessory);
  }

  _ensureAccessory(name) {

    const uuid = this.api.hap.uuid.generate(name);

    let accessory = this.accessories.get(uuid);

    if (accessory) {
      this.platform.logger.debug(
        "Factory",
        "reuse accessory: %s",
        name
      );
      return accessory;
    }

    this.platform.logger.debug(
      "Factory",
      "create accessory: %s",
      name
    );

    accessory = new this.api.platformAccessory(name, uuid);

    this.accessories.set(uuid, accessory);

    this.api.registerPlatformAccessories(
      "homebridge-davis-2",
      "Davis2",
      [accessory]
    );

    return accessory;
  }

  _setTemp(accessory, name, value) {

    this.platform.logger.debug(
      "Factory",
      "push temp: %s",
      name
    );

    const service =
      accessory.getService(this.Service.TemperatureSensor) ||
      accessory.addService(this.Service.TemperatureSensor, name);

    service.setCharacteristic(
      this.Characteristic.CurrentTemperature,
      value
    );
  }

  _setHum(accessory, name, value) {

    this.platform.logger.debug(
      "Factory",
      "push hum: %s",
      name
    );

    const service =
      accessory.getService(this.Service.HumiditySensor) ||
      accessory.addService(this.Service.HumiditySensor, name);

    service.setCharacteristic(
      this.Characteristic.CurrentRelativeHumidity,
      value
    );
  }

  updateAll() {

    const state = this.platform.registry.getState();

    if (!state?.data) {
      this.platform.logger.debug("Factory", "no state data");
      return;
    }

    const data = state.data;

    this.platform.logger.debug("Factory", "updateAll start");

    // ---------------- EXTERNAL ----------------
    if (this.platform.enableExternalSensors) {

      this.platform.logger.debug("Factory", "external enabled");

      if (data.temperature != null) {
        const acc = this._ensureAccessory("Outdoor Temperature");
        this._setTemp(acc, "Outdoor Temperature", data.temperature);
      }

      if (data.humidity != null) {
        const acc = this._ensureAccessory("Outdoor Humidity");
        this._setHum(acc, "Outdoor Humidity", data.humidity);
      }

    } else {
      this.platform.logger.debug("Factory", "external disabled");
    }

    // ---------------- INTERNAL ----------------
    if (this.platform.enableInternalSensors) {

      this.platform.logger.debug("Factory", "internal enabled");

      if (data.internalTemperature != null) {
        const acc = this._ensureAccessory("Indoor Temperature");
        this._setTemp(acc, "Indoor Temperature", data.internalTemperature);
      }

      if (data.internalHumidity != null) {
        const acc = this._ensureAccessory("Indoor Humidity");
        this._setHum(acc, "Indoor Humidity", data.internalHumidity);
      }

    } else {
      this.platform.logger.debug("Factory", "internal disabled");
    }

    // ---------------- AIR ----------------
    if (this.platform.enableAirLink && data.airQuality) {

      this.platform.logger.debug("Factory", "air enabled");

      const acc = this._ensureAccessory("Air Quality");

      const pm = data.airQuality.pm2p5;

      const aqi =
        pm <= 5 ? 0 :
        pm <= 12 ? 1 :
        pm <= 35 ? 2 :
        pm <= 55 ? 3 : 4;

      this._ensureAccessory("Air Quality Sensor Ready");

      this.platform.logger.debug("Factory", "air processed");

    } else {
      this.platform.logger.debug("Factory", "air disabled or missing");
    }

    // ---------------- FINAL SNAPSHOT ----------------
    this.platform.logger.verbose(
      "Factory",
      "PUSH OUT: %j",
      {
        external: this.platform.enableExternalSensors ? {
          temperature: data.temperature,
          humidity: data.humidity
        } : null,

        internal: this.platform.enableInternalSensors ? {
          temperature: data.internalTemperature,
          humidity: data.internalHumidity
        } : null,

        air: this.platform.enableAirLink && data.airQuality ? {
          pm2p5: data.airQuality.pm2p5,
          pm10: data.airQuality.pm10
        } : null
      }
    );

    this.platform.logger.debug("Factory", "updateAll end");
  }
}

module.exports = AccessoryFactory;
