
class AccessoryFactory {

  constructor(platform) {

    this.platform = platform;
    this.log = platform.log;
    this.api = platform.api;

    this.Characteristic = this.api.hap.Characteristic;
    this.Service = this.api.hap.Service;

    this.accessories = new Map();

    this.log.info("AccessoryFactory initialized");
  }

  configureAccessory(accessory) {

    const uuid = accessory.UUID;

    if (this.accessories.has(uuid)) {
      this.log.debug(`Accessory already registered in factory cache → ${accessory.displayName}`);
      return;
    }

    this.accessories.set(uuid, accessory);
    this.log.debug(`Restored cached accessory → ${accessory.displayName}`);
  }

  _getOrCreateAccessory(name, type) {

    const uuid = this.api.hap.uuid.generate(name);

    let accessory = this.accessories.get(uuid);

    if (accessory) {
      this.log.debug(`Reusing existing accessory → ${name}`);
      return accessory;
    }

    this.log.debug(`Creating new accessory → ${name}`);

    accessory = new this.api.platformAccessory(name, uuid);

    accessory.context = { name, type };

    this.api.registerPlatformAccessories(
      "homebridge-davis-2",
      "Davis2",
      [accessory]
    );

    this.accessories.set(uuid, accessory);

    return accessory;
  }

  _setTemperatureService(accessory, name, valueCelsius) {

    let service =
      accessory.getService(this.Service.TemperatureSensor) ||
      accessory.addService(this.Service.TemperatureSensor, name);

    service.setCharacteristic(this.Characteristic.Name, name);

    service.setCharacteristic(
      this.Characteristic.CurrentTemperature,
      valueCelsius
    );
  }

  _setHumidityService(accessory, name, value) {

    let service =
      accessory.getService(this.Service.HumiditySensor) ||
      accessory.addService(this.Service.HumiditySensor, name);

    service.setCharacteristic(this.Characteristic.Name, name);

    service.setCharacteristic(
      this.Characteristic.CurrentRelativeHumidity,
      value
    );
  }

  updateAll() {

    const state = this.platform.registry.getState();

    if (!state.data) return;

    const data = state.data;

    if (data.temperature != null) {
      const acc = this._getOrCreateAccessory("Outdoor Temperature", "temp");
      this._setTemperatureService(acc, "Outdoor Temperature", data.temperature);
      this.log.debug(`Updated → Outdoor Temperature`);
    }

    if (data.humidity != null) {
      const acc = this._getOrCreateAccessory("Outdoor Humidity", "humidity");
      this._setHumidityService(acc, "Outdoor Humidity", data.humidity);
      this.log.debug(`Updated → Outdoor Humidity`);
    }

    if (data.internalTemperature != null) {
      const acc = this._getOrCreateAccessory("Indoor Temperature", "temp");
      this._setTemperatureService(acc, "Indoor Temperature", data.internalTemperature);
      this.log.debug(`Updated → Indoor Temperature`);
    }

    if (data.internalHumidity != null) {
      const acc = this._getOrCreateAccessory("Indoor Humidity", "humidity");
      this._setHumidityService(acc, "Indoor Humidity", data.internalHumidity);
      this.log.debug(`Updated → Indoor Humidity`);
    }
  }
}

module.exports = AccessoryFactory;
