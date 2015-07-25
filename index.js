/* global Buffer, ChromeApiProxy, EventEmitter2 */
'use strict';

(function(exports) {
  var EXTENSION_ID = 'mncdajaedfblonbkmodofckdialkolgk';

  function ChromeUsbSerialport(path, options, openImmediately, callback) {
    this._chrome = new ChromeApiProxy(EXTENSION_ID);
    this.path = path;
    this.options = options;
    openImmediately && this.open(callback);
  }

  ChromeUsbSerialport.prototype = Object.create(EventEmitter2.prototype);

  ChromeUsbSerialport.prototype._chrome = null;

  ChromeUsbSerialport.prototype._connectionId = -1;

  ChromeUsbSerialport.prototype._isOpened = false;

  ChromeUsbSerialport.prototype.open = function(callback) {
    var that = this;
    var chrome = this._chrome;
    var options = {
      bitrate: this.options.baudRate
    };
    chrome.call('chrome.serial.connect', this.path, options)
    .then(function(info) {
      that._connectionId = info.connectionId;
      chrome.listenSerialPort(that._onData.bind(that));
      setTimeout(function() {
        if(!that._isOpened) {
          that._isOpened = true;
          that.emit('open');
        }
      }, 2000);
    });
  };

  ChromeUsbSerialport.prototype._onData = function(info) {
    if (!this._isOpened && info.connectionId === this._connectionId) {
      this._isOpened = true;
      this.emit('open');
    }
    this.emit('data', info.data);
  };

  ChromeUsbSerialport.prototype.write = function(data, callback) {
    var string = JSON.stringify(data);
    data = JSON.parse(string).data;
    this._chrome.call(
      'chrome.serial.send',
      this._connectionId,
      data // The data type is Array.
    );
    callback && callback();
  };

  ChromeUsbSerialport.prototype.close = function(callback) {
    this._chrome.call(
      'chrome.serial.disconnect',
      this._connectionId
    );
    this._isOpened = false;
    this._connectionId = -1;
    callback && callback();
    this.emit('close');
  };

  ChromeUsbSerialport.prototype.flush = function(callback) {
    this._chrome.call(
      'chrome.serial.flush',
      this._connectionId
    );
    callback && callback();
  };

  ChromeUsbSerialport.prototype.drain = function(callback) {
    callback && callback();
  };

  exports.ChromeUsbSerialport = ChromeUsbSerialport;
}(window));
