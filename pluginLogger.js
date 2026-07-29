class PluginLogger {

  constructor(log, config = {}) {
    this.log = log;
    this.config = config;
  }

  get verboseEnabled() {
    return this.config.verboseLogging === true;
  }

  info(component, message, ...args) {
    this.log.info(`[INFO] ${component}: ${message}`, ...args);
  }

  success(component, message, ...args) {
    this.log.success(`[SUCCESS] ${component}: ${message}`, ...args);
  }

  warn(component, message, ...args) {
    this.log.warn(`[WARN] ${component}: ${message}`, ...args);
  }

  error(component, message, ...args) {
    this.log.error(`[ERROR] ${component}: ${message}`, ...args);
  }

  debug(component, message, ...args) {
    this.log.debug(`[DEBUG] ${component}: ${message}`, ...args);
  }

  verbose(component, message, ...args) {
    if (!this.verboseEnabled) {
      return;
    }

    this.log.debug(`[VERBOSE] ${component}: ${message}`, ...args);
  }
}

module.exports = PluginLogger;
