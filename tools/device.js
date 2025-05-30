const Status = Object.freeze({
  NONE: "none",
  OBSOLETE: "obsolete",
  VINTAGE: "vintage"
});

class Device {
  constructor(status, firstOS, maxOS, type, name, released) {
    if (typeof firstOS !== 'number' || !Number.isInteger(firstOS)) {
      throw new TypeError('firstOS must be an integer');
    }
    if (typeof maxOS !== 'number' || !Number.isInteger(maxOS)) {
      throw new TypeError('maxOS must be an integer');
    }
    if (typeof status !== 'string') {
      throw new TypeError('status must be a string');
    }
    if (typeof type !== 'string') {
      throw new TypeError('type must be a string');
    }
    if (typeof name !== 'string') {
      throw new TypeError('name must be a string');
    }
    if (typeof released !== 'string') {
      throw new TypeError('released must be a string');
    }
    this.status = status;
    this.firstOS = firstOS;
    this.maxOS = maxOS;
    this.type = type;
    this.name = name;
    this.released = released;
  }

  isEqual(otherDevice) {
    if (!(otherDevice instanceof Device)) {
      return false;
    }
    return (
      this.status === otherDevice.status &&
      this.firstOS === otherDevice.firstOS &&
      this.maxOS === otherDevice.maxOS &&
      this.type === otherDevice.type &&
      this.name === otherDevice.name &&
      this.released === otherDevice.released
    );
  }
}

module.exports = { Device, Status };
