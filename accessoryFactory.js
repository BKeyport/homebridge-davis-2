class AccessoryFactory {

  constructor(platform) {

    this.platform = platform;
    this.log = platform.log;

    this.api = platform.api;

    this.Characteristic = this.api.hap.Characteristic;
    this.Service = this.api.hap.Service;

    this.accessories = new Map();
  }

  configureAccessory(accessory) {

    const uuid = accessory.UUID;

    if (this.accessories.has(uuid)) {
      return;
    }

    this.platform.logger.debug(
      "Factory",
      "restore cached accessory: %s",
      accessory.displayName
    );

    this.accessories.set(uuid, accessory);
  }

  // --------------------------------------------------
  // Identity + display helpers
  // --------------------------------------------------
  _getDisplayName(type, context, txid = null) {

    const base = {
      "outdoor:temperature": "Outdoor Temperature",
      "outdoor:humidity": "Outdoor Humidity",
      "indoor:temperature": "Indoor Temperature",
      "indoor:humidity": "Indoor Humidity",
      "air:quality": "Air Quality",
    };

    let name =
      base[`${type}:${context}`] ??
      `${type} ${context}`;

    if (txid != null && (type === "outdoor" || type === "air")) {
      name += ` (TX${txid})`;
    }

    return name;
  }

  _ensureAccessory(type, context = "", txid = null) {

    const key =
      `Davis2::${type}` +
      (context ? `::${context}` : "") +
      (txid != null ? `::tx${txid}` : "");

    const uuid = this.api.hap.uuid.generate(key);

    let accessory = this.accessories.get(uuid);

    if (accessory) {
      return accessory;
    }

    const displayName = this._getDisplayName(type, context, txid);

    this.platform.logger.debug(
      "Factory",
      "create accessory: %s (%s)",
      displayName,
      key
    );

    accessory = new this.api.platformAccessory(
      displayName,
      uuid
    );

    this.accessories.set(uuid, accessory);

    this.api.registerPlatformAccessories(
      "homebridge-davis-2",
      "Davis2",
      [accessory]
    );

    return accessory;
  }

  // --------------------------------------------------
  // Sensors
  // --------------------------------------------------
  _setTemp(accessory, name, value) {

    const service =
      accessory.getService(this.Service.TemperatureSensor) ||
      accessory.addService(this.Service.TemperatureSensor, name);

    service.setCharacteristic(
      this.Characteristic.CurrentTemperature,
      value
    );
  }

  _setHum(accessory, name, value) {

    const service =
      accessory.getService(this.Service.HumiditySensor) ||
      accessory.addService(this.Service.HumiditySensor, name);

    service.setCharacteristic(
      this.Characteristic.CurrentRelativeHumidity,
      value
    );
  }

  _setAir(accessory, pm2p5) {

    const service =
      accessory.getService(this.Service.AirQualitySensor) ||
      accessory.addService(this.Service.AirQualitySensor, "Air Quality");

    const aqi =
      pm2p5 <= 5 ? 1 :
      pm2p5 <= 12 ? 2 :
      pm2p5 <= 35 ? 3 :
      pm2p5 <= 55 ? 4 : 5;

    service.setCharacteristic(
      this.Characteristic.AirQuality,
      aqi
    );

    this.platform.logger.debug(
      "Factory",
      "Air PM2.5=%s AQI=%s",
      pm2p5,
      aqi
    );
  }

  // --------------------------------------------------
  // Update loop
  // --------------------------------------------------
  updateAll() {

    const state = this.platform.registry.getState();

    if (!state?.data) {
      return;
    }

    const data = state.data;

    const allowedUUIDs = new Set();

    // ---------------- EXTERNAL ----------------
    if (this.platform.enableExternalSensors) {

      if (data.temperature != null) {
        const acc = this._ensureAccessory("outdoor", "temperature", data.txid);
        this._setTemp(acc, "Outdoor Temperature", data.temperature);
        allowedUUIDs.add(acc.UUID);
      }

      if (data.humidity != null) {
        const acc = this._ensureAccessory("outdoor", "humidity", data.txid);
        this._setHum(acc, "Outdoor Humidity", data.humidity);
        allowedUUIDs.add(acc.UUID);
      }
    }

    // ---------------- INTERNAL ----------------
    if (this.platform.enableInternalSensors) {

      if (data.internalTemperature != null) {
        const acc = this._ensureAccessory("indoor", "temperature");
        this._setTemp(acc, "Indoor Temperature", data.internalTemperature);
        allowedUUIDs.add(acc.UUID);
      }

      if (data.internalHumidity != null) {
        const acc = this._ensureAccessory("indoor", "humidity");
        this._setHum(acc, "Indoor Humidity", data.internalHumidity);
        allowedUUIDs.add(acc.UUID);
      }
    }

    // ---------------- AIR ----------------
    if (this.platform.enableAirLink && data.airQuality) {

      const acc = this._ensureAccessory("air", "quality", data.txid);
      this._setAir(acc, data.airQuality.pm2p5);
      allowedUUIDs.add(acc.UUID);
    }

    this.cleanupUnusedAccessories(allowedUUIDs);
  }

  // --------------------------------------------------
  // Cleanup
  // --------------------------------------------------
  cleanupUnusedAccessories(allowedUUIDs) {

    for (const [uuid, accessory] of this.accessories.entries()) {

      if (!allowedUUIDs.has(uuid)) {

        this.platform.logger.debug(
          "Factory",
          "remove stale accessory: %s",
          accessory.displayName
        );

        this.api.unregisterPlatformAccessories(
          "homebridge-davis-2",
          "Davis2",
          [accessory]
        );

        this.accessories.delete(uuid);
      }
    }
  }
}

module.exports = AccessoryFactory;
