var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  try {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  } catch (e) {
    throw mod = 0, e;
  }
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// apps/max-game/source/stand-output/vendor/ws/lib/constants.js
var require_constants = __commonJS({
  "apps/max-game/source/stand-output/vendor/ws/lib/constants.js"(exports2, module2) {
    "use strict";
    var BINARY_TYPES = ["nodebuffer", "arraybuffer", "fragments"];
    var hasBlob = typeof Blob !== "undefined";
    if (hasBlob) BINARY_TYPES.push("blob");
    module2.exports = {
      BINARY_TYPES,
      EMPTY_BUFFER: Buffer.alloc(0),
      GUID: "258EAFA5-E914-47DA-95CA-C5AB0DC85B11",
      hasBlob,
      kForOnEventAttribute: /* @__PURE__ */ Symbol("kIsForOnEventAttribute"),
      kListener: /* @__PURE__ */ Symbol("kListener"),
      kStatusCode: /* @__PURE__ */ Symbol("status-code"),
      kWebSocket: /* @__PURE__ */ Symbol("websocket"),
      NOOP: () => {
      }
    };
  }
});

// apps/max-game/source/stand-output/vendor/ws/lib/buffer-util.js
var require_buffer_util = __commonJS({
  "apps/max-game/source/stand-output/vendor/ws/lib/buffer-util.js"(exports2, module2) {
    "use strict";
    var { EMPTY_BUFFER } = require_constants();
    var FastBuffer = Buffer[Symbol.species];
    function concat(list, totalLength) {
      if (list.length === 0) return EMPTY_BUFFER;
      if (list.length === 1) return list[0];
      const target = Buffer.allocUnsafe(totalLength);
      let offset = 0;
      for (let i = 0; i < list.length; i++) {
        const buf = list[i];
        target.set(buf, offset);
        offset += buf.length;
      }
      if (offset < totalLength) {
        return new FastBuffer(target.buffer, target.byteOffset, offset);
      }
      return target;
    }
    function _mask(source, mask, output, offset, length) {
      for (let i = 0; i < length; i++) {
        output[offset + i] = source[i] ^ mask[i & 3];
      }
    }
    function _unmask(buffer, mask) {
      for (let i = 0; i < buffer.length; i++) {
        buffer[i] ^= mask[i & 3];
      }
    }
    function toArrayBuffer(buf) {
      if (buf.length === buf.buffer.byteLength) {
        return buf.buffer;
      }
      return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.length);
    }
    function toBuffer(data) {
      toBuffer.readOnly = true;
      if (Buffer.isBuffer(data)) return data;
      let buf;
      if (data instanceof ArrayBuffer) {
        buf = new FastBuffer(data);
      } else if (ArrayBuffer.isView(data)) {
        buf = new FastBuffer(data.buffer, data.byteOffset, data.byteLength);
      } else {
        buf = Buffer.from(data);
        toBuffer.readOnly = false;
      }
      return buf;
    }
    module2.exports = {
      concat,
      mask: _mask,
      toArrayBuffer,
      toBuffer,
      unmask: _unmask
    };
    if (!process.env.WS_NO_BUFFER_UTIL) {
      try {
        const bufferUtil = require("bufferutil");
        module2.exports.mask = function(source, mask, output, offset, length) {
          if (length < 48) _mask(source, mask, output, offset, length);
          else bufferUtil.mask(source, mask, output, offset, length);
        };
        module2.exports.unmask = function(buffer, mask) {
          if (buffer.length < 32) _unmask(buffer, mask);
          else bufferUtil.unmask(buffer, mask);
        };
      } catch (e) {
      }
    }
  }
});

// apps/max-game/source/stand-output/vendor/ws/lib/limiter.js
var require_limiter = __commonJS({
  "apps/max-game/source/stand-output/vendor/ws/lib/limiter.js"(exports2, module2) {
    "use strict";
    var kDone = /* @__PURE__ */ Symbol("kDone");
    var kRun = /* @__PURE__ */ Symbol("kRun");
    var Limiter = class {
      /**
       * Creates a new `Limiter`.
       *
       * @param {Number} [concurrency=Infinity] The maximum number of jobs allowed
       *     to run concurrently
       */
      constructor(concurrency) {
        this[kDone] = () => {
          this.pending--;
          this[kRun]();
        };
        this.concurrency = concurrency || Infinity;
        this.jobs = [];
        this.pending = 0;
      }
      /**
       * Adds a job to the queue.
       *
       * @param {Function} job The job to run
       * @public
       */
      add(job) {
        this.jobs.push(job);
        this[kRun]();
      }
      /**
       * Removes a job from the queue and runs it if possible.
       *
       * @private
       */
      [kRun]() {
        if (this.pending === this.concurrency) return;
        if (this.jobs.length) {
          const job = this.jobs.shift();
          this.pending++;
          job(this[kDone]);
        }
      }
    };
    module2.exports = Limiter;
  }
});

// apps/max-game/source/stand-output/vendor/ws/lib/permessage-deflate.js
var require_permessage_deflate = __commonJS({
  "apps/max-game/source/stand-output/vendor/ws/lib/permessage-deflate.js"(exports2, module2) {
    "use strict";
    var zlib = require("zlib");
    var bufferUtil = require_buffer_util();
    var Limiter = require_limiter();
    var { kStatusCode } = require_constants();
    var FastBuffer = Buffer[Symbol.species];
    var TRAILER = Buffer.from([0, 0, 255, 255]);
    var kPerMessageDeflate = /* @__PURE__ */ Symbol("permessage-deflate");
    var kTotalLength = /* @__PURE__ */ Symbol("total-length");
    var kCallback = /* @__PURE__ */ Symbol("callback");
    var kBuffers = /* @__PURE__ */ Symbol("buffers");
    var kError = /* @__PURE__ */ Symbol("error");
    var zlibLimiter;
    var PerMessageDeflate = class {
      /**
       * Creates a PerMessageDeflate instance.
       *
       * @param {Object} [options] Configuration options
       * @param {(Boolean|Number)} [options.clientMaxWindowBits] Advertise support
       *     for, or request, a custom client window size
       * @param {Boolean} [options.clientNoContextTakeover=false] Advertise/
       *     acknowledge disabling of client context takeover
       * @param {Number} [options.concurrencyLimit=10] The number of concurrent
       *     calls to zlib
       * @param {(Boolean|Number)} [options.serverMaxWindowBits] Request/confirm the
       *     use of a custom server window size
       * @param {Boolean} [options.serverNoContextTakeover=false] Request/accept
       *     disabling of server context takeover
       * @param {Number} [options.threshold=1024] Size (in bytes) below which
       *     messages should not be compressed if context takeover is disabled
       * @param {Object} [options.zlibDeflateOptions] Options to pass to zlib on
       *     deflate
       * @param {Object} [options.zlibInflateOptions] Options to pass to zlib on
       *     inflate
       * @param {Boolean} [isServer=false] Create the instance in either server or
       *     client mode
       * @param {Number} [maxPayload=0] The maximum allowed message length
       */
      constructor(options, isServer, maxPayload) {
        this._maxPayload = maxPayload | 0;
        this._options = options || {};
        this._threshold = this._options.threshold !== void 0 ? this._options.threshold : 1024;
        this._isServer = !!isServer;
        this._deflate = null;
        this._inflate = null;
        this.params = null;
        if (!zlibLimiter) {
          const concurrency = this._options.concurrencyLimit !== void 0 ? this._options.concurrencyLimit : 10;
          zlibLimiter = new Limiter(concurrency);
        }
      }
      /**
       * @type {String}
       */
      static get extensionName() {
        return "permessage-deflate";
      }
      /**
       * Create an extension negotiation offer.
       *
       * @return {Object} Extension parameters
       * @public
       */
      offer() {
        const params = {};
        if (this._options.serverNoContextTakeover) {
          params.server_no_context_takeover = true;
        }
        if (this._options.clientNoContextTakeover) {
          params.client_no_context_takeover = true;
        }
        if (this._options.serverMaxWindowBits) {
          params.server_max_window_bits = this._options.serverMaxWindowBits;
        }
        if (this._options.clientMaxWindowBits) {
          params.client_max_window_bits = this._options.clientMaxWindowBits;
        } else if (this._options.clientMaxWindowBits == null) {
          params.client_max_window_bits = true;
        }
        return params;
      }
      /**
       * Accept an extension negotiation offer/response.
       *
       * @param {Array} configurations The extension negotiation offers/reponse
       * @return {Object} Accepted configuration
       * @public
       */
      accept(configurations) {
        configurations = this.normalizeParams(configurations);
        this.params = this._isServer ? this.acceptAsServer(configurations) : this.acceptAsClient(configurations);
        return this.params;
      }
      /**
       * Releases all resources used by the extension.
       *
       * @public
       */
      cleanup() {
        if (this._inflate) {
          this._inflate.close();
          this._inflate = null;
        }
        if (this._deflate) {
          const callback = this._deflate[kCallback];
          this._deflate.close();
          this._deflate = null;
          if (callback) {
            callback(
              new Error(
                "The deflate stream was closed while data was being processed"
              )
            );
          }
        }
      }
      /**
       *  Accept an extension negotiation offer.
       *
       * @param {Array} offers The extension negotiation offers
       * @return {Object} Accepted configuration
       * @private
       */
      acceptAsServer(offers) {
        const opts = this._options;
        const accepted = offers.find((params) => {
          if (opts.serverNoContextTakeover === false && params.server_no_context_takeover || params.server_max_window_bits && (opts.serverMaxWindowBits === false || typeof opts.serverMaxWindowBits === "number" && opts.serverMaxWindowBits > params.server_max_window_bits) || typeof opts.clientMaxWindowBits === "number" && !params.client_max_window_bits) {
            return false;
          }
          return true;
        });
        if (!accepted) {
          throw new Error("None of the extension offers can be accepted");
        }
        if (opts.serverNoContextTakeover) {
          accepted.server_no_context_takeover = true;
        }
        if (opts.clientNoContextTakeover) {
          accepted.client_no_context_takeover = true;
        }
        if (typeof opts.serverMaxWindowBits === "number") {
          accepted.server_max_window_bits = opts.serverMaxWindowBits;
        }
        if (typeof opts.clientMaxWindowBits === "number") {
          accepted.client_max_window_bits = opts.clientMaxWindowBits;
        } else if (accepted.client_max_window_bits === true || opts.clientMaxWindowBits === false) {
          delete accepted.client_max_window_bits;
        }
        return accepted;
      }
      /**
       * Accept the extension negotiation response.
       *
       * @param {Array} response The extension negotiation response
       * @return {Object} Accepted configuration
       * @private
       */
      acceptAsClient(response) {
        const params = response[0];
        if (this._options.clientNoContextTakeover === false && params.client_no_context_takeover) {
          throw new Error('Unexpected parameter "client_no_context_takeover"');
        }
        if (!params.client_max_window_bits) {
          if (typeof this._options.clientMaxWindowBits === "number") {
            params.client_max_window_bits = this._options.clientMaxWindowBits;
          }
        } else if (this._options.clientMaxWindowBits === false || typeof this._options.clientMaxWindowBits === "number" && params.client_max_window_bits > this._options.clientMaxWindowBits) {
          throw new Error(
            'Unexpected or invalid parameter "client_max_window_bits"'
          );
        }
        return params;
      }
      /**
       * Normalize parameters.
       *
       * @param {Array} configurations The extension negotiation offers/reponse
       * @return {Array} The offers/response with normalized parameters
       * @private
       */
      normalizeParams(configurations) {
        configurations.forEach((params) => {
          Object.keys(params).forEach((key) => {
            let value = params[key];
            if (value.length > 1) {
              throw new Error(`Parameter "${key}" must have only a single value`);
            }
            value = value[0];
            if (key === "client_max_window_bits") {
              if (value !== true) {
                const num = +value;
                if (!Number.isInteger(num) || num < 8 || num > 15) {
                  throw new TypeError(
                    `Invalid value for parameter "${key}": ${value}`
                  );
                }
                value = num;
              } else if (!this._isServer) {
                throw new TypeError(
                  `Invalid value for parameter "${key}": ${value}`
                );
              }
            } else if (key === "server_max_window_bits") {
              const num = +value;
              if (!Number.isInteger(num) || num < 8 || num > 15) {
                throw new TypeError(
                  `Invalid value for parameter "${key}": ${value}`
                );
              }
              value = num;
            } else if (key === "client_no_context_takeover" || key === "server_no_context_takeover") {
              if (value !== true) {
                throw new TypeError(
                  `Invalid value for parameter "${key}": ${value}`
                );
              }
            } else {
              throw new Error(`Unknown parameter "${key}"`);
            }
            params[key] = value;
          });
        });
        return configurations;
      }
      /**
       * Decompress data. Concurrency limited.
       *
       * @param {Buffer} data Compressed data
       * @param {Boolean} fin Specifies whether or not this is the last fragment
       * @param {Function} callback Callback
       * @public
       */
      decompress(data, fin, callback) {
        zlibLimiter.add((done) => {
          this._decompress(data, fin, (err, result) => {
            done();
            callback(err, result);
          });
        });
      }
      /**
       * Compress data. Concurrency limited.
       *
       * @param {(Buffer|String)} data Data to compress
       * @param {Boolean} fin Specifies whether or not this is the last fragment
       * @param {Function} callback Callback
       * @public
       */
      compress(data, fin, callback) {
        zlibLimiter.add((done) => {
          this._compress(data, fin, (err, result) => {
            done();
            callback(err, result);
          });
        });
      }
      /**
       * Decompress data.
       *
       * @param {Buffer} data Compressed data
       * @param {Boolean} fin Specifies whether or not this is the last fragment
       * @param {Function} callback Callback
       * @private
       */
      _decompress(data, fin, callback) {
        const endpoint = this._isServer ? "client" : "server";
        if (!this._inflate) {
          const key = `${endpoint}_max_window_bits`;
          const windowBits = typeof this.params[key] !== "number" ? zlib.Z_DEFAULT_WINDOWBITS : this.params[key];
          this._inflate = zlib.createInflateRaw({
            ...this._options.zlibInflateOptions,
            windowBits
          });
          this._inflate[kPerMessageDeflate] = this;
          this._inflate[kTotalLength] = 0;
          this._inflate[kBuffers] = [];
          this._inflate.on("error", inflateOnError);
          this._inflate.on("data", inflateOnData);
        }
        this._inflate[kCallback] = callback;
        this._inflate.write(data);
        if (fin) this._inflate.write(TRAILER);
        this._inflate.flush(() => {
          const err = this._inflate[kError];
          if (err) {
            this._inflate.close();
            this._inflate = null;
            callback(err);
            return;
          }
          const data2 = bufferUtil.concat(
            this._inflate[kBuffers],
            this._inflate[kTotalLength]
          );
          if (this._inflate._readableState.endEmitted) {
            this._inflate.close();
            this._inflate = null;
          } else {
            this._inflate[kTotalLength] = 0;
            this._inflate[kBuffers] = [];
            if (fin && this.params[`${endpoint}_no_context_takeover`]) {
              this._inflate.reset();
            }
          }
          callback(null, data2);
        });
      }
      /**
       * Compress data.
       *
       * @param {(Buffer|String)} data Data to compress
       * @param {Boolean} fin Specifies whether or not this is the last fragment
       * @param {Function} callback Callback
       * @private
       */
      _compress(data, fin, callback) {
        const endpoint = this._isServer ? "server" : "client";
        if (!this._deflate) {
          const key = `${endpoint}_max_window_bits`;
          const windowBits = typeof this.params[key] !== "number" ? zlib.Z_DEFAULT_WINDOWBITS : this.params[key];
          this._deflate = zlib.createDeflateRaw({
            ...this._options.zlibDeflateOptions,
            windowBits
          });
          this._deflate[kTotalLength] = 0;
          this._deflate[kBuffers] = [];
          this._deflate.on("data", deflateOnData);
        }
        this._deflate[kCallback] = callback;
        this._deflate.write(data);
        this._deflate.flush(zlib.Z_SYNC_FLUSH, () => {
          if (!this._deflate) {
            return;
          }
          let data2 = bufferUtil.concat(
            this._deflate[kBuffers],
            this._deflate[kTotalLength]
          );
          if (fin) {
            data2 = new FastBuffer(data2.buffer, data2.byteOffset, data2.length - 4);
          }
          this._deflate[kCallback] = null;
          this._deflate[kTotalLength] = 0;
          this._deflate[kBuffers] = [];
          if (fin && this.params[`${endpoint}_no_context_takeover`]) {
            this._deflate.reset();
          }
          callback(null, data2);
        });
      }
    };
    module2.exports = PerMessageDeflate;
    function deflateOnData(chunk) {
      this[kBuffers].push(chunk);
      this[kTotalLength] += chunk.length;
    }
    function inflateOnData(chunk) {
      this[kTotalLength] += chunk.length;
      if (this[kPerMessageDeflate]._maxPayload < 1 || this[kTotalLength] <= this[kPerMessageDeflate]._maxPayload) {
        this[kBuffers].push(chunk);
        return;
      }
      this[kError] = new RangeError("Max payload size exceeded");
      this[kError].code = "WS_ERR_UNSUPPORTED_MESSAGE_LENGTH";
      this[kError][kStatusCode] = 1009;
      this.removeListener("data", inflateOnData);
      this.reset();
    }
    function inflateOnError(err) {
      this[kPerMessageDeflate]._inflate = null;
      err[kStatusCode] = 1007;
      this[kCallback](err);
    }
  }
});

// apps/max-game/source/stand-output/vendor/ws/lib/validation.js
var require_validation = __commonJS({
  "apps/max-game/source/stand-output/vendor/ws/lib/validation.js"(exports2, module2) {
    "use strict";
    var { isUtf8 } = require("buffer");
    var { hasBlob } = require_constants();
    var tokenChars = [
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      // 0 - 15
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      // 16 - 31
      0,
      1,
      0,
      1,
      1,
      1,
      1,
      1,
      0,
      0,
      1,
      1,
      0,
      1,
      1,
      0,
      // 32 - 47
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      0,
      0,
      0,
      0,
      0,
      0,
      // 48 - 63
      0,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      // 64 - 79
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      0,
      0,
      0,
      1,
      1,
      // 80 - 95
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      // 96 - 111
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      0,
      1,
      0,
      1,
      0
      // 112 - 127
    ];
    function isValidStatusCode(code) {
      return code >= 1e3 && code <= 1014 && code !== 1004 && code !== 1005 && code !== 1006 || code >= 3e3 && code <= 4999;
    }
    function _isValidUTF8(buf) {
      const len = buf.length;
      let i = 0;
      while (i < len) {
        if ((buf[i] & 128) === 0) {
          i++;
        } else if ((buf[i] & 224) === 192) {
          if (i + 1 === len || (buf[i + 1] & 192) !== 128 || (buf[i] & 254) === 192) {
            return false;
          }
          i += 2;
        } else if ((buf[i] & 240) === 224) {
          if (i + 2 >= len || (buf[i + 1] & 192) !== 128 || (buf[i + 2] & 192) !== 128 || buf[i] === 224 && (buf[i + 1] & 224) === 128 || // Overlong
          buf[i] === 237 && (buf[i + 1] & 224) === 160) {
            return false;
          }
          i += 3;
        } else if ((buf[i] & 248) === 240) {
          if (i + 3 >= len || (buf[i + 1] & 192) !== 128 || (buf[i + 2] & 192) !== 128 || (buf[i + 3] & 192) !== 128 || buf[i] === 240 && (buf[i + 1] & 240) === 128 || // Overlong
          buf[i] === 244 && buf[i + 1] > 143 || buf[i] > 244) {
            return false;
          }
          i += 4;
        } else {
          return false;
        }
      }
      return true;
    }
    function isBlob(value) {
      return hasBlob && typeof value === "object" && typeof value.arrayBuffer === "function" && typeof value.type === "string" && typeof value.stream === "function" && (value[Symbol.toStringTag] === "Blob" || value[Symbol.toStringTag] === "File");
    }
    module2.exports = {
      isBlob,
      isValidStatusCode,
      isValidUTF8: _isValidUTF8,
      tokenChars
    };
    if (isUtf8) {
      module2.exports.isValidUTF8 = function(buf) {
        return buf.length < 24 ? _isValidUTF8(buf) : isUtf8(buf);
      };
    } else if (!process.env.WS_NO_UTF_8_VALIDATE) {
      try {
        const isValidUTF8 = require("utf-8-validate");
        module2.exports.isValidUTF8 = function(buf) {
          return buf.length < 32 ? _isValidUTF8(buf) : isValidUTF8(buf);
        };
      } catch (e) {
      }
    }
  }
});

// apps/max-game/source/stand-output/vendor/ws/lib/receiver.js
var require_receiver = __commonJS({
  "apps/max-game/source/stand-output/vendor/ws/lib/receiver.js"(exports2, module2) {
    "use strict";
    var { Writable } = require("stream");
    var PerMessageDeflate = require_permessage_deflate();
    var {
      BINARY_TYPES,
      EMPTY_BUFFER,
      kStatusCode,
      kWebSocket
    } = require_constants();
    var { concat, toArrayBuffer, unmask } = require_buffer_util();
    var { isValidStatusCode, isValidUTF8 } = require_validation();
    var FastBuffer = Buffer[Symbol.species];
    var GET_INFO = 0;
    var GET_PAYLOAD_LENGTH_16 = 1;
    var GET_PAYLOAD_LENGTH_64 = 2;
    var GET_MASK = 3;
    var GET_DATA = 4;
    var INFLATING = 5;
    var DEFER_EVENT = 6;
    var Receiver = class extends Writable {
      /**
       * Creates a Receiver instance.
       *
       * @param {Object} [options] Options object
       * @param {Boolean} [options.allowSynchronousEvents=true] Specifies whether
       *     any of the `'message'`, `'ping'`, and `'pong'` events can be emitted
       *     multiple times in the same tick
       * @param {String} [options.binaryType=nodebuffer] The type for binary data
       * @param {Object} [options.extensions] An object containing the negotiated
       *     extensions
       * @param {Boolean} [options.isServer=false] Specifies whether to operate in
       *     client or server mode
       * @param {Number} [options.maxPayload=0] The maximum allowed message length
       * @param {Boolean} [options.skipUTF8Validation=false] Specifies whether or
       *     not to skip UTF-8 validation for text and close messages
       */
      constructor(options = {}) {
        super();
        this._allowSynchronousEvents = options.allowSynchronousEvents !== void 0 ? options.allowSynchronousEvents : true;
        this._binaryType = options.binaryType || BINARY_TYPES[0];
        this._extensions = options.extensions || {};
        this._isServer = !!options.isServer;
        this._maxPayload = options.maxPayload | 0;
        this._skipUTF8Validation = !!options.skipUTF8Validation;
        this[kWebSocket] = void 0;
        this._bufferedBytes = 0;
        this._buffers = [];
        this._compressed = false;
        this._payloadLength = 0;
        this._mask = void 0;
        this._fragmented = 0;
        this._masked = false;
        this._fin = false;
        this._opcode = 0;
        this._totalPayloadLength = 0;
        this._messageLength = 0;
        this._fragments = [];
        this._errored = false;
        this._loop = false;
        this._state = GET_INFO;
      }
      /**
       * Implements `Writable.prototype._write()`.
       *
       * @param {Buffer} chunk The chunk of data to write
       * @param {String} encoding The character encoding of `chunk`
       * @param {Function} cb Callback
       * @private
       */
      _write(chunk, encoding, cb) {
        if (this._opcode === 8 && this._state == GET_INFO) return cb();
        this._bufferedBytes += chunk.length;
        this._buffers.push(chunk);
        this.startLoop(cb);
      }
      /**
       * Consumes `n` bytes from the buffered data.
       *
       * @param {Number} n The number of bytes to consume
       * @return {Buffer} The consumed bytes
       * @private
       */
      consume(n) {
        this._bufferedBytes -= n;
        if (n === this._buffers[0].length) return this._buffers.shift();
        if (n < this._buffers[0].length) {
          const buf = this._buffers[0];
          this._buffers[0] = new FastBuffer(
            buf.buffer,
            buf.byteOffset + n,
            buf.length - n
          );
          return new FastBuffer(buf.buffer, buf.byteOffset, n);
        }
        const dst = Buffer.allocUnsafe(n);
        do {
          const buf = this._buffers[0];
          const offset = dst.length - n;
          if (n >= buf.length) {
            dst.set(this._buffers.shift(), offset);
          } else {
            dst.set(new Uint8Array(buf.buffer, buf.byteOffset, n), offset);
            this._buffers[0] = new FastBuffer(
              buf.buffer,
              buf.byteOffset + n,
              buf.length - n
            );
          }
          n -= buf.length;
        } while (n > 0);
        return dst;
      }
      /**
       * Starts the parsing loop.
       *
       * @param {Function} cb Callback
       * @private
       */
      startLoop(cb) {
        this._loop = true;
        do {
          switch (this._state) {
            case GET_INFO:
              this.getInfo(cb);
              break;
            case GET_PAYLOAD_LENGTH_16:
              this.getPayloadLength16(cb);
              break;
            case GET_PAYLOAD_LENGTH_64:
              this.getPayloadLength64(cb);
              break;
            case GET_MASK:
              this.getMask();
              break;
            case GET_DATA:
              this.getData(cb);
              break;
            case INFLATING:
            case DEFER_EVENT:
              this._loop = false;
              return;
          }
        } while (this._loop);
        if (!this._errored) cb();
      }
      /**
       * Reads the first two bytes of a frame.
       *
       * @param {Function} cb Callback
       * @private
       */
      getInfo(cb) {
        if (this._bufferedBytes < 2) {
          this._loop = false;
          return;
        }
        const buf = this.consume(2);
        if ((buf[0] & 48) !== 0) {
          const error = this.createError(
            RangeError,
            "RSV2 and RSV3 must be clear",
            true,
            1002,
            "WS_ERR_UNEXPECTED_RSV_2_3"
          );
          cb(error);
          return;
        }
        const compressed = (buf[0] & 64) === 64;
        if (compressed && !this._extensions[PerMessageDeflate.extensionName]) {
          const error = this.createError(
            RangeError,
            "RSV1 must be clear",
            true,
            1002,
            "WS_ERR_UNEXPECTED_RSV_1"
          );
          cb(error);
          return;
        }
        this._fin = (buf[0] & 128) === 128;
        this._opcode = buf[0] & 15;
        this._payloadLength = buf[1] & 127;
        if (this._opcode === 0) {
          if (compressed) {
            const error = this.createError(
              RangeError,
              "RSV1 must be clear",
              true,
              1002,
              "WS_ERR_UNEXPECTED_RSV_1"
            );
            cb(error);
            return;
          }
          if (!this._fragmented) {
            const error = this.createError(
              RangeError,
              "invalid opcode 0",
              true,
              1002,
              "WS_ERR_INVALID_OPCODE"
            );
            cb(error);
            return;
          }
          this._opcode = this._fragmented;
        } else if (this._opcode === 1 || this._opcode === 2) {
          if (this._fragmented) {
            const error = this.createError(
              RangeError,
              `invalid opcode ${this._opcode}`,
              true,
              1002,
              "WS_ERR_INVALID_OPCODE"
            );
            cb(error);
            return;
          }
          this._compressed = compressed;
        } else if (this._opcode > 7 && this._opcode < 11) {
          if (!this._fin) {
            const error = this.createError(
              RangeError,
              "FIN must be set",
              true,
              1002,
              "WS_ERR_EXPECTED_FIN"
            );
            cb(error);
            return;
          }
          if (compressed) {
            const error = this.createError(
              RangeError,
              "RSV1 must be clear",
              true,
              1002,
              "WS_ERR_UNEXPECTED_RSV_1"
            );
            cb(error);
            return;
          }
          if (this._payloadLength > 125 || this._opcode === 8 && this._payloadLength === 1) {
            const error = this.createError(
              RangeError,
              `invalid payload length ${this._payloadLength}`,
              true,
              1002,
              "WS_ERR_INVALID_CONTROL_PAYLOAD_LENGTH"
            );
            cb(error);
            return;
          }
        } else {
          const error = this.createError(
            RangeError,
            `invalid opcode ${this._opcode}`,
            true,
            1002,
            "WS_ERR_INVALID_OPCODE"
          );
          cb(error);
          return;
        }
        if (!this._fin && !this._fragmented) this._fragmented = this._opcode;
        this._masked = (buf[1] & 128) === 128;
        if (this._isServer) {
          if (!this._masked) {
            const error = this.createError(
              RangeError,
              "MASK must be set",
              true,
              1002,
              "WS_ERR_EXPECTED_MASK"
            );
            cb(error);
            return;
          }
        } else if (this._masked) {
          const error = this.createError(
            RangeError,
            "MASK must be clear",
            true,
            1002,
            "WS_ERR_UNEXPECTED_MASK"
          );
          cb(error);
          return;
        }
        if (this._payloadLength === 126) this._state = GET_PAYLOAD_LENGTH_16;
        else if (this._payloadLength === 127) this._state = GET_PAYLOAD_LENGTH_64;
        else this.haveLength(cb);
      }
      /**
       * Gets extended payload length (7+16).
       *
       * @param {Function} cb Callback
       * @private
       */
      getPayloadLength16(cb) {
        if (this._bufferedBytes < 2) {
          this._loop = false;
          return;
        }
        this._payloadLength = this.consume(2).readUInt16BE(0);
        this.haveLength(cb);
      }
      /**
       * Gets extended payload length (7+64).
       *
       * @param {Function} cb Callback
       * @private
       */
      getPayloadLength64(cb) {
        if (this._bufferedBytes < 8) {
          this._loop = false;
          return;
        }
        const buf = this.consume(8);
        const num = buf.readUInt32BE(0);
        if (num > Math.pow(2, 53 - 32) - 1) {
          const error = this.createError(
            RangeError,
            "Unsupported WebSocket frame: payload length > 2^53 - 1",
            false,
            1009,
            "WS_ERR_UNSUPPORTED_DATA_PAYLOAD_LENGTH"
          );
          cb(error);
          return;
        }
        this._payloadLength = num * Math.pow(2, 32) + buf.readUInt32BE(4);
        this.haveLength(cb);
      }
      /**
       * Payload length has been read.
       *
       * @param {Function} cb Callback
       * @private
       */
      haveLength(cb) {
        if (this._payloadLength && this._opcode < 8) {
          this._totalPayloadLength += this._payloadLength;
          if (this._totalPayloadLength > this._maxPayload && this._maxPayload > 0) {
            const error = this.createError(
              RangeError,
              "Max payload size exceeded",
              false,
              1009,
              "WS_ERR_UNSUPPORTED_MESSAGE_LENGTH"
            );
            cb(error);
            return;
          }
        }
        if (this._masked) this._state = GET_MASK;
        else this._state = GET_DATA;
      }
      /**
       * Reads mask bytes.
       *
       * @private
       */
      getMask() {
        if (this._bufferedBytes < 4) {
          this._loop = false;
          return;
        }
        this._mask = this.consume(4);
        this._state = GET_DATA;
      }
      /**
       * Reads data bytes.
       *
       * @param {Function} cb Callback
       * @private
       */
      getData(cb) {
        let data = EMPTY_BUFFER;
        if (this._payloadLength) {
          if (this._bufferedBytes < this._payloadLength) {
            this._loop = false;
            return;
          }
          data = this.consume(this._payloadLength);
          if (this._masked && (this._mask[0] | this._mask[1] | this._mask[2] | this._mask[3]) !== 0) {
            unmask(data, this._mask);
          }
        }
        if (this._opcode > 7) {
          this.controlMessage(data, cb);
          return;
        }
        if (this._compressed) {
          this._state = INFLATING;
          this.decompress(data, cb);
          return;
        }
        if (data.length) {
          this._messageLength = this._totalPayloadLength;
          this._fragments.push(data);
        }
        this.dataMessage(cb);
      }
      /**
       * Decompresses data.
       *
       * @param {Buffer} data Compressed data
       * @param {Function} cb Callback
       * @private
       */
      decompress(data, cb) {
        const perMessageDeflate = this._extensions[PerMessageDeflate.extensionName];
        perMessageDeflate.decompress(data, this._fin, (err, buf) => {
          if (err) return cb(err);
          if (buf.length) {
            this._messageLength += buf.length;
            if (this._messageLength > this._maxPayload && this._maxPayload > 0) {
              const error = this.createError(
                RangeError,
                "Max payload size exceeded",
                false,
                1009,
                "WS_ERR_UNSUPPORTED_MESSAGE_LENGTH"
              );
              cb(error);
              return;
            }
            this._fragments.push(buf);
          }
          this.dataMessage(cb);
          if (this._state === GET_INFO) this.startLoop(cb);
        });
      }
      /**
       * Handles a data message.
       *
       * @param {Function} cb Callback
       * @private
       */
      dataMessage(cb) {
        if (!this._fin) {
          this._state = GET_INFO;
          return;
        }
        const messageLength = this._messageLength;
        const fragments = this._fragments;
        this._totalPayloadLength = 0;
        this._messageLength = 0;
        this._fragmented = 0;
        this._fragments = [];
        if (this._opcode === 2) {
          let data;
          if (this._binaryType === "nodebuffer") {
            data = concat(fragments, messageLength);
          } else if (this._binaryType === "arraybuffer") {
            data = toArrayBuffer(concat(fragments, messageLength));
          } else if (this._binaryType === "blob") {
            data = new Blob(fragments);
          } else {
            data = fragments;
          }
          if (this._allowSynchronousEvents) {
            this.emit("message", data, true);
            this._state = GET_INFO;
          } else {
            this._state = DEFER_EVENT;
            setImmediate(() => {
              this.emit("message", data, true);
              this._state = GET_INFO;
              this.startLoop(cb);
            });
          }
        } else {
          const buf = concat(fragments, messageLength);
          if (!this._skipUTF8Validation && !isValidUTF8(buf)) {
            const error = this.createError(
              Error,
              "invalid UTF-8 sequence",
              true,
              1007,
              "WS_ERR_INVALID_UTF8"
            );
            cb(error);
            return;
          }
          if (this._state === INFLATING || this._allowSynchronousEvents) {
            this.emit("message", buf, false);
            this._state = GET_INFO;
          } else {
            this._state = DEFER_EVENT;
            setImmediate(() => {
              this.emit("message", buf, false);
              this._state = GET_INFO;
              this.startLoop(cb);
            });
          }
        }
      }
      /**
       * Handles a control message.
       *
       * @param {Buffer} data Data to handle
       * @return {(Error|RangeError|undefined)} A possible error
       * @private
       */
      controlMessage(data, cb) {
        if (this._opcode === 8) {
          if (data.length === 0) {
            this._loop = false;
            this.emit("conclude", 1005, EMPTY_BUFFER);
            this.end();
          } else {
            const code = data.readUInt16BE(0);
            if (!isValidStatusCode(code)) {
              const error = this.createError(
                RangeError,
                `invalid status code ${code}`,
                true,
                1002,
                "WS_ERR_INVALID_CLOSE_CODE"
              );
              cb(error);
              return;
            }
            const buf = new FastBuffer(
              data.buffer,
              data.byteOffset + 2,
              data.length - 2
            );
            if (!this._skipUTF8Validation && !isValidUTF8(buf)) {
              const error = this.createError(
                Error,
                "invalid UTF-8 sequence",
                true,
                1007,
                "WS_ERR_INVALID_UTF8"
              );
              cb(error);
              return;
            }
            this._loop = false;
            this.emit("conclude", code, buf);
            this.end();
          }
          this._state = GET_INFO;
          return;
        }
        if (this._allowSynchronousEvents) {
          this.emit(this._opcode === 9 ? "ping" : "pong", data);
          this._state = GET_INFO;
        } else {
          this._state = DEFER_EVENT;
          setImmediate(() => {
            this.emit(this._opcode === 9 ? "ping" : "pong", data);
            this._state = GET_INFO;
            this.startLoop(cb);
          });
        }
      }
      /**
       * Builds an error object.
       *
       * @param {function(new:Error|RangeError)} ErrorCtor The error constructor
       * @param {String} message The error message
       * @param {Boolean} prefix Specifies whether or not to add a default prefix to
       *     `message`
       * @param {Number} statusCode The status code
       * @param {String} errorCode The exposed error code
       * @return {(Error|RangeError)} The error
       * @private
       */
      createError(ErrorCtor, message, prefix, statusCode, errorCode) {
        this._loop = false;
        this._errored = true;
        const err = new ErrorCtor(
          prefix ? `Invalid WebSocket frame: ${message}` : message
        );
        Error.captureStackTrace(err, this.createError);
        err.code = errorCode;
        err[kStatusCode] = statusCode;
        return err;
      }
    };
    module2.exports = Receiver;
  }
});

// apps/max-game/source/stand-output/vendor/ws/lib/sender.js
var require_sender = __commonJS({
  "apps/max-game/source/stand-output/vendor/ws/lib/sender.js"(exports2, module2) {
    "use strict";
    var { Duplex } = require("stream");
    var { randomFillSync } = require("crypto");
    var PerMessageDeflate = require_permessage_deflate();
    var { EMPTY_BUFFER, kWebSocket, NOOP } = require_constants();
    var { isBlob, isValidStatusCode } = require_validation();
    var { mask: applyMask, toBuffer } = require_buffer_util();
    var kByteLength = /* @__PURE__ */ Symbol("kByteLength");
    var maskBuffer = Buffer.alloc(4);
    var RANDOM_POOL_SIZE = 8 * 1024;
    var randomPool;
    var randomPoolPointer = RANDOM_POOL_SIZE;
    var DEFAULT = 0;
    var DEFLATING = 1;
    var GET_BLOB_DATA = 2;
    var Sender = class _Sender {
      /**
       * Creates a Sender instance.
       *
       * @param {Duplex} socket The connection socket
       * @param {Object} [extensions] An object containing the negotiated extensions
       * @param {Function} [generateMask] The function used to generate the masking
       *     key
       */
      constructor(socket, extensions, generateMask) {
        this._extensions = extensions || {};
        if (generateMask) {
          this._generateMask = generateMask;
          this._maskBuffer = Buffer.alloc(4);
        }
        this._socket = socket;
        this._firstFragment = true;
        this._compress = false;
        this._bufferedBytes = 0;
        this._queue = [];
        this._state = DEFAULT;
        this.onerror = NOOP;
        this[kWebSocket] = void 0;
      }
      /**
       * Frames a piece of data according to the HyBi WebSocket protocol.
       *
       * @param {(Buffer|String)} data The data to frame
       * @param {Object} options Options object
       * @param {Boolean} [options.fin=false] Specifies whether or not to set the
       *     FIN bit
       * @param {Function} [options.generateMask] The function used to generate the
       *     masking key
       * @param {Boolean} [options.mask=false] Specifies whether or not to mask
       *     `data`
       * @param {Buffer} [options.maskBuffer] The buffer used to store the masking
       *     key
       * @param {Number} options.opcode The opcode
       * @param {Boolean} [options.readOnly=false] Specifies whether `data` can be
       *     modified
       * @param {Boolean} [options.rsv1=false] Specifies whether or not to set the
       *     RSV1 bit
       * @return {(Buffer|String)[]} The framed data
       * @public
       */
      static frame(data, options) {
        let mask;
        let merge = false;
        let offset = 2;
        let skipMasking = false;
        if (options.mask) {
          mask = options.maskBuffer || maskBuffer;
          if (options.generateMask) {
            options.generateMask(mask);
          } else {
            if (randomPoolPointer === RANDOM_POOL_SIZE) {
              if (randomPool === void 0) {
                randomPool = Buffer.alloc(RANDOM_POOL_SIZE);
              }
              randomFillSync(randomPool, 0, RANDOM_POOL_SIZE);
              randomPoolPointer = 0;
            }
            mask[0] = randomPool[randomPoolPointer++];
            mask[1] = randomPool[randomPoolPointer++];
            mask[2] = randomPool[randomPoolPointer++];
            mask[3] = randomPool[randomPoolPointer++];
          }
          skipMasking = (mask[0] | mask[1] | mask[2] | mask[3]) === 0;
          offset = 6;
        }
        let dataLength;
        if (typeof data === "string") {
          if ((!options.mask || skipMasking) && options[kByteLength] !== void 0) {
            dataLength = options[kByteLength];
          } else {
            data = Buffer.from(data);
            dataLength = data.length;
          }
        } else {
          dataLength = data.length;
          merge = options.mask && options.readOnly && !skipMasking;
        }
        let payloadLength = dataLength;
        if (dataLength >= 65536) {
          offset += 8;
          payloadLength = 127;
        } else if (dataLength > 125) {
          offset += 2;
          payloadLength = 126;
        }
        const target = Buffer.allocUnsafe(merge ? dataLength + offset : offset);
        target[0] = options.fin ? options.opcode | 128 : options.opcode;
        if (options.rsv1) target[0] |= 64;
        target[1] = payloadLength;
        if (payloadLength === 126) {
          target.writeUInt16BE(dataLength, 2);
        } else if (payloadLength === 127) {
          target[2] = target[3] = 0;
          target.writeUIntBE(dataLength, 4, 6);
        }
        if (!options.mask) return [target, data];
        target[1] |= 128;
        target[offset - 4] = mask[0];
        target[offset - 3] = mask[1];
        target[offset - 2] = mask[2];
        target[offset - 1] = mask[3];
        if (skipMasking) return [target, data];
        if (merge) {
          applyMask(data, mask, target, offset, dataLength);
          return [target];
        }
        applyMask(data, mask, data, 0, dataLength);
        return [target, data];
      }
      /**
       * Sends a close message to the other peer.
       *
       * @param {Number} [code] The status code component of the body
       * @param {(String|Buffer)} [data] The message component of the body
       * @param {Boolean} [mask=false] Specifies whether or not to mask the message
       * @param {Function} [cb] Callback
       * @public
       */
      close(code, data, mask, cb) {
        let buf;
        if (code === void 0) {
          buf = EMPTY_BUFFER;
        } else if (typeof code !== "number" || !isValidStatusCode(code)) {
          throw new TypeError("First argument must be a valid error code number");
        } else if (data === void 0 || !data.length) {
          buf = Buffer.allocUnsafe(2);
          buf.writeUInt16BE(code, 0);
        } else {
          const length = Buffer.byteLength(data);
          if (length > 123) {
            throw new RangeError("The message must not be greater than 123 bytes");
          }
          buf = Buffer.allocUnsafe(2 + length);
          buf.writeUInt16BE(code, 0);
          if (typeof data === "string") {
            buf.write(data, 2);
          } else {
            buf.set(data, 2);
          }
        }
        const options = {
          [kByteLength]: buf.length,
          fin: true,
          generateMask: this._generateMask,
          mask,
          maskBuffer: this._maskBuffer,
          opcode: 8,
          readOnly: false,
          rsv1: false
        };
        if (this._state !== DEFAULT) {
          this.enqueue([this.dispatch, buf, false, options, cb]);
        } else {
          this.sendFrame(_Sender.frame(buf, options), cb);
        }
      }
      /**
       * Sends a ping message to the other peer.
       *
       * @param {*} data The message to send
       * @param {Boolean} [mask=false] Specifies whether or not to mask `data`
       * @param {Function} [cb] Callback
       * @public
       */
      ping(data, mask, cb) {
        let byteLength;
        let readOnly;
        if (typeof data === "string") {
          byteLength = Buffer.byteLength(data);
          readOnly = false;
        } else if (isBlob(data)) {
          byteLength = data.size;
          readOnly = false;
        } else {
          data = toBuffer(data);
          byteLength = data.length;
          readOnly = toBuffer.readOnly;
        }
        if (byteLength > 125) {
          throw new RangeError("The data size must not be greater than 125 bytes");
        }
        const options = {
          [kByteLength]: byteLength,
          fin: true,
          generateMask: this._generateMask,
          mask,
          maskBuffer: this._maskBuffer,
          opcode: 9,
          readOnly,
          rsv1: false
        };
        if (isBlob(data)) {
          if (this._state !== DEFAULT) {
            this.enqueue([this.getBlobData, data, false, options, cb]);
          } else {
            this.getBlobData(data, false, options, cb);
          }
        } else if (this._state !== DEFAULT) {
          this.enqueue([this.dispatch, data, false, options, cb]);
        } else {
          this.sendFrame(_Sender.frame(data, options), cb);
        }
      }
      /**
       * Sends a pong message to the other peer.
       *
       * @param {*} data The message to send
       * @param {Boolean} [mask=false] Specifies whether or not to mask `data`
       * @param {Function} [cb] Callback
       * @public
       */
      pong(data, mask, cb) {
        let byteLength;
        let readOnly;
        if (typeof data === "string") {
          byteLength = Buffer.byteLength(data);
          readOnly = false;
        } else if (isBlob(data)) {
          byteLength = data.size;
          readOnly = false;
        } else {
          data = toBuffer(data);
          byteLength = data.length;
          readOnly = toBuffer.readOnly;
        }
        if (byteLength > 125) {
          throw new RangeError("The data size must not be greater than 125 bytes");
        }
        const options = {
          [kByteLength]: byteLength,
          fin: true,
          generateMask: this._generateMask,
          mask,
          maskBuffer: this._maskBuffer,
          opcode: 10,
          readOnly,
          rsv1: false
        };
        if (isBlob(data)) {
          if (this._state !== DEFAULT) {
            this.enqueue([this.getBlobData, data, false, options, cb]);
          } else {
            this.getBlobData(data, false, options, cb);
          }
        } else if (this._state !== DEFAULT) {
          this.enqueue([this.dispatch, data, false, options, cb]);
        } else {
          this.sendFrame(_Sender.frame(data, options), cb);
        }
      }
      /**
       * Sends a data message to the other peer.
       *
       * @param {*} data The message to send
       * @param {Object} options Options object
       * @param {Boolean} [options.binary=false] Specifies whether `data` is binary
       *     or text
       * @param {Boolean} [options.compress=false] Specifies whether or not to
       *     compress `data`
       * @param {Boolean} [options.fin=false] Specifies whether the fragment is the
       *     last one
       * @param {Boolean} [options.mask=false] Specifies whether or not to mask
       *     `data`
       * @param {Function} [cb] Callback
       * @public
       */
      send(data, options, cb) {
        const perMessageDeflate = this._extensions[PerMessageDeflate.extensionName];
        let opcode = options.binary ? 2 : 1;
        let rsv1 = options.compress;
        let byteLength;
        let readOnly;
        if (typeof data === "string") {
          byteLength = Buffer.byteLength(data);
          readOnly = false;
        } else if (isBlob(data)) {
          byteLength = data.size;
          readOnly = false;
        } else {
          data = toBuffer(data);
          byteLength = data.length;
          readOnly = toBuffer.readOnly;
        }
        if (this._firstFragment) {
          this._firstFragment = false;
          if (rsv1 && perMessageDeflate && perMessageDeflate.params[perMessageDeflate._isServer ? "server_no_context_takeover" : "client_no_context_takeover"]) {
            rsv1 = byteLength >= perMessageDeflate._threshold;
          }
          this._compress = rsv1;
        } else {
          rsv1 = false;
          opcode = 0;
        }
        if (options.fin) this._firstFragment = true;
        const opts = {
          [kByteLength]: byteLength,
          fin: options.fin,
          generateMask: this._generateMask,
          mask: options.mask,
          maskBuffer: this._maskBuffer,
          opcode,
          readOnly,
          rsv1
        };
        if (isBlob(data)) {
          if (this._state !== DEFAULT) {
            this.enqueue([this.getBlobData, data, this._compress, opts, cb]);
          } else {
            this.getBlobData(data, this._compress, opts, cb);
          }
        } else if (this._state !== DEFAULT) {
          this.enqueue([this.dispatch, data, this._compress, opts, cb]);
        } else {
          this.dispatch(data, this._compress, opts, cb);
        }
      }
      /**
       * Gets the contents of a blob as binary data.
       *
       * @param {Blob} blob The blob
       * @param {Boolean} [compress=false] Specifies whether or not to compress
       *     the data
       * @param {Object} options Options object
       * @param {Boolean} [options.fin=false] Specifies whether or not to set the
       *     FIN bit
       * @param {Function} [options.generateMask] The function used to generate the
       *     masking key
       * @param {Boolean} [options.mask=false] Specifies whether or not to mask
       *     `data`
       * @param {Buffer} [options.maskBuffer] The buffer used to store the masking
       *     key
       * @param {Number} options.opcode The opcode
       * @param {Boolean} [options.readOnly=false] Specifies whether `data` can be
       *     modified
       * @param {Boolean} [options.rsv1=false] Specifies whether or not to set the
       *     RSV1 bit
       * @param {Function} [cb] Callback
       * @private
       */
      getBlobData(blob, compress, options, cb) {
        this._bufferedBytes += options[kByteLength];
        this._state = GET_BLOB_DATA;
        blob.arrayBuffer().then((arrayBuffer) => {
          if (this._socket.destroyed) {
            const err = new Error(
              "The socket was closed while the blob was being read"
            );
            process.nextTick(callCallbacks, this, err, cb);
            return;
          }
          this._bufferedBytes -= options[kByteLength];
          const data = toBuffer(arrayBuffer);
          if (!compress) {
            this._state = DEFAULT;
            this.sendFrame(_Sender.frame(data, options), cb);
            this.dequeue();
          } else {
            this.dispatch(data, compress, options, cb);
          }
        }).catch((err) => {
          process.nextTick(onError, this, err, cb);
        });
      }
      /**
       * Dispatches a message.
       *
       * @param {(Buffer|String)} data The message to send
       * @param {Boolean} [compress=false] Specifies whether or not to compress
       *     `data`
       * @param {Object} options Options object
       * @param {Boolean} [options.fin=false] Specifies whether or not to set the
       *     FIN bit
       * @param {Function} [options.generateMask] The function used to generate the
       *     masking key
       * @param {Boolean} [options.mask=false] Specifies whether or not to mask
       *     `data`
       * @param {Buffer} [options.maskBuffer] The buffer used to store the masking
       *     key
       * @param {Number} options.opcode The opcode
       * @param {Boolean} [options.readOnly=false] Specifies whether `data` can be
       *     modified
       * @param {Boolean} [options.rsv1=false] Specifies whether or not to set the
       *     RSV1 bit
       * @param {Function} [cb] Callback
       * @private
       */
      dispatch(data, compress, options, cb) {
        if (!compress) {
          this.sendFrame(_Sender.frame(data, options), cb);
          return;
        }
        const perMessageDeflate = this._extensions[PerMessageDeflate.extensionName];
        this._bufferedBytes += options[kByteLength];
        this._state = DEFLATING;
        perMessageDeflate.compress(data, options.fin, (_, buf) => {
          if (this._socket.destroyed) {
            const err = new Error(
              "The socket was closed while data was being compressed"
            );
            callCallbacks(this, err, cb);
            return;
          }
          this._bufferedBytes -= options[kByteLength];
          this._state = DEFAULT;
          options.readOnly = false;
          this.sendFrame(_Sender.frame(buf, options), cb);
          this.dequeue();
        });
      }
      /**
       * Executes queued send operations.
       *
       * @private
       */
      dequeue() {
        while (this._state === DEFAULT && this._queue.length) {
          const params = this._queue.shift();
          this._bufferedBytes -= params[3][kByteLength];
          Reflect.apply(params[0], this, params.slice(1));
        }
      }
      /**
       * Enqueues a send operation.
       *
       * @param {Array} params Send operation parameters.
       * @private
       */
      enqueue(params) {
        this._bufferedBytes += params[3][kByteLength];
        this._queue.push(params);
      }
      /**
       * Sends a frame.
       *
       * @param {Buffer[]} list The frame to send
       * @param {Function} [cb] Callback
       * @private
       */
      sendFrame(list, cb) {
        if (list.length === 2) {
          this._socket.cork();
          this._socket.write(list[0]);
          this._socket.write(list[1], cb);
          this._socket.uncork();
        } else {
          this._socket.write(list[0], cb);
        }
      }
    };
    module2.exports = Sender;
    function callCallbacks(sender, err, cb) {
      if (typeof cb === "function") cb(err);
      for (let i = 0; i < sender._queue.length; i++) {
        const params = sender._queue[i];
        const callback = params[params.length - 1];
        if (typeof callback === "function") callback(err);
      }
    }
    function onError(sender, err, cb) {
      callCallbacks(sender, err, cb);
      sender.onerror(err);
    }
  }
});

// apps/max-game/source/stand-output/vendor/ws/lib/event-target.js
var require_event_target = __commonJS({
  "apps/max-game/source/stand-output/vendor/ws/lib/event-target.js"(exports2, module2) {
    "use strict";
    var { kForOnEventAttribute, kListener } = require_constants();
    var kCode = /* @__PURE__ */ Symbol("kCode");
    var kData = /* @__PURE__ */ Symbol("kData");
    var kError = /* @__PURE__ */ Symbol("kError");
    var kMessage = /* @__PURE__ */ Symbol("kMessage");
    var kReason = /* @__PURE__ */ Symbol("kReason");
    var kTarget = /* @__PURE__ */ Symbol("kTarget");
    var kType = /* @__PURE__ */ Symbol("kType");
    var kWasClean = /* @__PURE__ */ Symbol("kWasClean");
    var Event = class {
      /**
       * Create a new `Event`.
       *
       * @param {String} type The name of the event
       * @throws {TypeError} If the `type` argument is not specified
       */
      constructor(type) {
        this[kTarget] = null;
        this[kType] = type;
      }
      /**
       * @type {*}
       */
      get target() {
        return this[kTarget];
      }
      /**
       * @type {String}
       */
      get type() {
        return this[kType];
      }
    };
    Object.defineProperty(Event.prototype, "target", { enumerable: true });
    Object.defineProperty(Event.prototype, "type", { enumerable: true });
    var CloseEvent = class extends Event {
      /**
       * Create a new `CloseEvent`.
       *
       * @param {String} type The name of the event
       * @param {Object} [options] A dictionary object that allows for setting
       *     attributes via object members of the same name
       * @param {Number} [options.code=0] The status code explaining why the
       *     connection was closed
       * @param {String} [options.reason=''] A human-readable string explaining why
       *     the connection was closed
       * @param {Boolean} [options.wasClean=false] Indicates whether or not the
       *     connection was cleanly closed
       */
      constructor(type, options = {}) {
        super(type);
        this[kCode] = options.code === void 0 ? 0 : options.code;
        this[kReason] = options.reason === void 0 ? "" : options.reason;
        this[kWasClean] = options.wasClean === void 0 ? false : options.wasClean;
      }
      /**
       * @type {Number}
       */
      get code() {
        return this[kCode];
      }
      /**
       * @type {String}
       */
      get reason() {
        return this[kReason];
      }
      /**
       * @type {Boolean}
       */
      get wasClean() {
        return this[kWasClean];
      }
    };
    Object.defineProperty(CloseEvent.prototype, "code", { enumerable: true });
    Object.defineProperty(CloseEvent.prototype, "reason", { enumerable: true });
    Object.defineProperty(CloseEvent.prototype, "wasClean", { enumerable: true });
    var ErrorEvent = class extends Event {
      /**
       * Create a new `ErrorEvent`.
       *
       * @param {String} type The name of the event
       * @param {Object} [options] A dictionary object that allows for setting
       *     attributes via object members of the same name
       * @param {*} [options.error=null] The error that generated this event
       * @param {String} [options.message=''] The error message
       */
      constructor(type, options = {}) {
        super(type);
        this[kError] = options.error === void 0 ? null : options.error;
        this[kMessage] = options.message === void 0 ? "" : options.message;
      }
      /**
       * @type {*}
       */
      get error() {
        return this[kError];
      }
      /**
       * @type {String}
       */
      get message() {
        return this[kMessage];
      }
    };
    Object.defineProperty(ErrorEvent.prototype, "error", { enumerable: true });
    Object.defineProperty(ErrorEvent.prototype, "message", { enumerable: true });
    var MessageEvent = class extends Event {
      /**
       * Create a new `MessageEvent`.
       *
       * @param {String} type The name of the event
       * @param {Object} [options] A dictionary object that allows for setting
       *     attributes via object members of the same name
       * @param {*} [options.data=null] The message content
       */
      constructor(type, options = {}) {
        super(type);
        this[kData] = options.data === void 0 ? null : options.data;
      }
      /**
       * @type {*}
       */
      get data() {
        return this[kData];
      }
    };
    Object.defineProperty(MessageEvent.prototype, "data", { enumerable: true });
    var EventTarget = {
      /**
       * Register an event listener.
       *
       * @param {String} type A string representing the event type to listen for
       * @param {(Function|Object)} handler The listener to add
       * @param {Object} [options] An options object specifies characteristics about
       *     the event listener
       * @param {Boolean} [options.once=false] A `Boolean` indicating that the
       *     listener should be invoked at most once after being added. If `true`,
       *     the listener would be automatically removed when invoked.
       * @public
       */
      addEventListener(type, handler, options = {}) {
        for (const listener of this.listeners(type)) {
          if (!options[kForOnEventAttribute] && listener[kListener] === handler && !listener[kForOnEventAttribute]) {
            return;
          }
        }
        let wrapper;
        if (type === "message") {
          wrapper = function onMessage(data, isBinary) {
            const event = new MessageEvent("message", {
              data: isBinary ? data : data.toString()
            });
            event[kTarget] = this;
            callListener(handler, this, event);
          };
        } else if (type === "close") {
          wrapper = function onClose(code, message) {
            const event = new CloseEvent("close", {
              code,
              reason: message.toString(),
              wasClean: this._closeFrameReceived && this._closeFrameSent
            });
            event[kTarget] = this;
            callListener(handler, this, event);
          };
        } else if (type === "error") {
          wrapper = function onError(error) {
            const event = new ErrorEvent("error", {
              error,
              message: error.message
            });
            event[kTarget] = this;
            callListener(handler, this, event);
          };
        } else if (type === "open") {
          wrapper = function onOpen() {
            const event = new Event("open");
            event[kTarget] = this;
            callListener(handler, this, event);
          };
        } else {
          return;
        }
        wrapper[kForOnEventAttribute] = !!options[kForOnEventAttribute];
        wrapper[kListener] = handler;
        if (options.once) {
          this.once(type, wrapper);
        } else {
          this.on(type, wrapper);
        }
      },
      /**
       * Remove an event listener.
       *
       * @param {String} type A string representing the event type to remove
       * @param {(Function|Object)} handler The listener to remove
       * @public
       */
      removeEventListener(type, handler) {
        for (const listener of this.listeners(type)) {
          if (listener[kListener] === handler && !listener[kForOnEventAttribute]) {
            this.removeListener(type, listener);
            break;
          }
        }
      }
    };
    module2.exports = {
      CloseEvent,
      ErrorEvent,
      Event,
      EventTarget,
      MessageEvent
    };
    function callListener(listener, thisArg, event) {
      if (typeof listener === "object" && listener.handleEvent) {
        listener.handleEvent.call(listener, event);
      } else {
        listener.call(thisArg, event);
      }
    }
  }
});

// apps/max-game/source/stand-output/vendor/ws/lib/extension.js
var require_extension = __commonJS({
  "apps/max-game/source/stand-output/vendor/ws/lib/extension.js"(exports2, module2) {
    "use strict";
    var { tokenChars } = require_validation();
    function push(dest, name, elem) {
      if (dest[name] === void 0) dest[name] = [elem];
      else dest[name].push(elem);
    }
    function parse(header) {
      const offers = /* @__PURE__ */ Object.create(null);
      let params = /* @__PURE__ */ Object.create(null);
      let mustUnescape = false;
      let isEscaping = false;
      let inQuotes = false;
      let extensionName;
      let paramName;
      let start = -1;
      let code = -1;
      let end = -1;
      let i = 0;
      for (; i < header.length; i++) {
        code = header.charCodeAt(i);
        if (extensionName === void 0) {
          if (end === -1 && tokenChars[code] === 1) {
            if (start === -1) start = i;
          } else if (i !== 0 && (code === 32 || code === 9)) {
            if (end === -1 && start !== -1) end = i;
          } else if (code === 59 || code === 44) {
            if (start === -1) {
              throw new SyntaxError(`Unexpected character at index ${i}`);
            }
            if (end === -1) end = i;
            const name = header.slice(start, end);
            if (code === 44) {
              push(offers, name, params);
              params = /* @__PURE__ */ Object.create(null);
            } else {
              extensionName = name;
            }
            start = end = -1;
          } else {
            throw new SyntaxError(`Unexpected character at index ${i}`);
          }
        } else if (paramName === void 0) {
          if (end === -1 && tokenChars[code] === 1) {
            if (start === -1) start = i;
          } else if (code === 32 || code === 9) {
            if (end === -1 && start !== -1) end = i;
          } else if (code === 59 || code === 44) {
            if (start === -1) {
              throw new SyntaxError(`Unexpected character at index ${i}`);
            }
            if (end === -1) end = i;
            push(params, header.slice(start, end), true);
            if (code === 44) {
              push(offers, extensionName, params);
              params = /* @__PURE__ */ Object.create(null);
              extensionName = void 0;
            }
            start = end = -1;
          } else if (code === 61 && start !== -1 && end === -1) {
            paramName = header.slice(start, i);
            start = end = -1;
          } else {
            throw new SyntaxError(`Unexpected character at index ${i}`);
          }
        } else {
          if (isEscaping) {
            if (tokenChars[code] !== 1) {
              throw new SyntaxError(`Unexpected character at index ${i}`);
            }
            if (start === -1) start = i;
            else if (!mustUnescape) mustUnescape = true;
            isEscaping = false;
          } else if (inQuotes) {
            if (tokenChars[code] === 1) {
              if (start === -1) start = i;
            } else if (code === 34 && start !== -1) {
              inQuotes = false;
              end = i;
            } else if (code === 92) {
              isEscaping = true;
            } else {
              throw new SyntaxError(`Unexpected character at index ${i}`);
            }
          } else if (code === 34 && header.charCodeAt(i - 1) === 61) {
            inQuotes = true;
          } else if (end === -1 && tokenChars[code] === 1) {
            if (start === -1) start = i;
          } else if (start !== -1 && (code === 32 || code === 9)) {
            if (end === -1) end = i;
          } else if (code === 59 || code === 44) {
            if (start === -1) {
              throw new SyntaxError(`Unexpected character at index ${i}`);
            }
            if (end === -1) end = i;
            let value = header.slice(start, end);
            if (mustUnescape) {
              value = value.replace(/\\/g, "");
              mustUnescape = false;
            }
            push(params, paramName, value);
            if (code === 44) {
              push(offers, extensionName, params);
              params = /* @__PURE__ */ Object.create(null);
              extensionName = void 0;
            }
            paramName = void 0;
            start = end = -1;
          } else {
            throw new SyntaxError(`Unexpected character at index ${i}`);
          }
        }
      }
      if (start === -1 || inQuotes || code === 32 || code === 9) {
        throw new SyntaxError("Unexpected end of input");
      }
      if (end === -1) end = i;
      const token = header.slice(start, end);
      if (extensionName === void 0) {
        push(offers, token, params);
      } else {
        if (paramName === void 0) {
          push(params, token, true);
        } else if (mustUnescape) {
          push(params, paramName, token.replace(/\\/g, ""));
        } else {
          push(params, paramName, token);
        }
        push(offers, extensionName, params);
      }
      return offers;
    }
    function format(extensions) {
      return Object.keys(extensions).map((extension) => {
        let configurations = extensions[extension];
        if (!Array.isArray(configurations)) configurations = [configurations];
        return configurations.map((params) => {
          return [extension].concat(
            Object.keys(params).map((k) => {
              let values = params[k];
              if (!Array.isArray(values)) values = [values];
              return values.map((v) => v === true ? k : `${k}=${v}`).join("; ");
            })
          ).join("; ");
        }).join(", ");
      }).join(", ");
    }
    module2.exports = { format, parse };
  }
});

// apps/max-game/source/stand-output/vendor/ws/lib/websocket.js
var require_websocket = __commonJS({
  "apps/max-game/source/stand-output/vendor/ws/lib/websocket.js"(exports2, module2) {
    "use strict";
    var EventEmitter = require("events");
    var https = require("https");
    var http = require("http");
    var net = require("net");
    var tls = require("tls");
    var { randomBytes, createHash } = require("crypto");
    var { Duplex, Readable } = require("stream");
    var { URL } = require("url");
    var PerMessageDeflate = require_permessage_deflate();
    var Receiver = require_receiver();
    var Sender = require_sender();
    var { isBlob } = require_validation();
    var {
      BINARY_TYPES,
      EMPTY_BUFFER,
      GUID,
      kForOnEventAttribute,
      kListener,
      kStatusCode,
      kWebSocket,
      NOOP
    } = require_constants();
    var {
      EventTarget: { addEventListener, removeEventListener }
    } = require_event_target();
    var { format, parse } = require_extension();
    var { toBuffer } = require_buffer_util();
    var closeTimeout = 30 * 1e3;
    var kAborted = /* @__PURE__ */ Symbol("kAborted");
    var protocolVersions = [8, 13];
    var readyStates = ["CONNECTING", "OPEN", "CLOSING", "CLOSED"];
    var subprotocolRegex = /^[!#$%&'*+\-.0-9A-Z^_`|a-z~]+$/;
    var WebSocket2 = class _WebSocket extends EventEmitter {
      /**
       * Create a new `WebSocket`.
       *
       * @param {(String|URL)} address The URL to which to connect
       * @param {(String|String[])} [protocols] The subprotocols
       * @param {Object} [options] Connection options
       */
      constructor(address, protocols, options) {
        super();
        this._binaryType = BINARY_TYPES[0];
        this._closeCode = 1006;
        this._closeFrameReceived = false;
        this._closeFrameSent = false;
        this._closeMessage = EMPTY_BUFFER;
        this._closeTimer = null;
        this._errorEmitted = false;
        this._extensions = {};
        this._paused = false;
        this._protocol = "";
        this._readyState = _WebSocket.CONNECTING;
        this._receiver = null;
        this._sender = null;
        this._socket = null;
        if (address !== null) {
          this._bufferedAmount = 0;
          this._isServer = false;
          this._redirects = 0;
          if (protocols === void 0) {
            protocols = [];
          } else if (!Array.isArray(protocols)) {
            if (typeof protocols === "object" && protocols !== null) {
              options = protocols;
              protocols = [];
            } else {
              protocols = [protocols];
            }
          }
          initAsClient(this, address, protocols, options);
        } else {
          this._autoPong = options.autoPong;
          this._isServer = true;
        }
      }
      /**
       * For historical reasons, the custom "nodebuffer" type is used by the default
       * instead of "blob".
       *
       * @type {String}
       */
      get binaryType() {
        return this._binaryType;
      }
      set binaryType(type) {
        if (!BINARY_TYPES.includes(type)) return;
        this._binaryType = type;
        if (this._receiver) this._receiver._binaryType = type;
      }
      /**
       * @type {Number}
       */
      get bufferedAmount() {
        if (!this._socket) return this._bufferedAmount;
        return this._socket._writableState.length + this._sender._bufferedBytes;
      }
      /**
       * @type {String}
       */
      get extensions() {
        return Object.keys(this._extensions).join();
      }
      /**
       * @type {Boolean}
       */
      get isPaused() {
        return this._paused;
      }
      /**
       * @type {Function}
       */
      /* istanbul ignore next */
      get onclose() {
        return null;
      }
      /**
       * @type {Function}
       */
      /* istanbul ignore next */
      get onerror() {
        return null;
      }
      /**
       * @type {Function}
       */
      /* istanbul ignore next */
      get onopen() {
        return null;
      }
      /**
       * @type {Function}
       */
      /* istanbul ignore next */
      get onmessage() {
        return null;
      }
      /**
       * @type {String}
       */
      get protocol() {
        return this._protocol;
      }
      /**
       * @type {Number}
       */
      get readyState() {
        return this._readyState;
      }
      /**
       * @type {String}
       */
      get url() {
        return this._url;
      }
      /**
       * Set up the socket and the internal resources.
       *
       * @param {Duplex} socket The network socket between the server and client
       * @param {Buffer} head The first packet of the upgraded stream
       * @param {Object} options Options object
       * @param {Boolean} [options.allowSynchronousEvents=false] Specifies whether
       *     any of the `'message'`, `'ping'`, and `'pong'` events can be emitted
       *     multiple times in the same tick
       * @param {Function} [options.generateMask] The function used to generate the
       *     masking key
       * @param {Number} [options.maxPayload=0] The maximum allowed message size
       * @param {Boolean} [options.skipUTF8Validation=false] Specifies whether or
       *     not to skip UTF-8 validation for text and close messages
       * @private
       */
      setSocket(socket, head, options) {
        const receiver = new Receiver({
          allowSynchronousEvents: options.allowSynchronousEvents,
          binaryType: this.binaryType,
          extensions: this._extensions,
          isServer: this._isServer,
          maxPayload: options.maxPayload,
          skipUTF8Validation: options.skipUTF8Validation
        });
        const sender = new Sender(socket, this._extensions, options.generateMask);
        this._receiver = receiver;
        this._sender = sender;
        this._socket = socket;
        receiver[kWebSocket] = this;
        sender[kWebSocket] = this;
        socket[kWebSocket] = this;
        receiver.on("conclude", receiverOnConclude);
        receiver.on("drain", receiverOnDrain);
        receiver.on("error", receiverOnError);
        receiver.on("message", receiverOnMessage);
        receiver.on("ping", receiverOnPing);
        receiver.on("pong", receiverOnPong);
        sender.onerror = senderOnError;
        if (socket.setTimeout) socket.setTimeout(0);
        if (socket.setNoDelay) socket.setNoDelay();
        if (head.length > 0) socket.unshift(head);
        socket.on("close", socketOnClose);
        socket.on("data", socketOnData);
        socket.on("end", socketOnEnd);
        socket.on("error", socketOnError);
        this._readyState = _WebSocket.OPEN;
        this.emit("open");
      }
      /**
       * Emit the `'close'` event.
       *
       * @private
       */
      emitClose() {
        if (!this._socket) {
          this._readyState = _WebSocket.CLOSED;
          this.emit("close", this._closeCode, this._closeMessage);
          return;
        }
        if (this._extensions[PerMessageDeflate.extensionName]) {
          this._extensions[PerMessageDeflate.extensionName].cleanup();
        }
        this._receiver.removeAllListeners();
        this._readyState = _WebSocket.CLOSED;
        this.emit("close", this._closeCode, this._closeMessage);
      }
      /**
       * Start a closing handshake.
       *
       *          +----------+   +-----------+   +----------+
       *     - - -|ws.close()|-->|close frame|-->|ws.close()|- - -
       *    |     +----------+   +-----------+   +----------+     |
       *          +----------+   +-----------+         |
       * CLOSING  |ws.close()|<--|close frame|<--+-----+       CLOSING
       *          +----------+   +-----------+   |
       *    |           |                        |   +---+        |
       *                +------------------------+-->|fin| - - - -
       *    |         +---+                      |   +---+
       *     - - - - -|fin|<---------------------+
       *              +---+
       *
       * @param {Number} [code] Status code explaining why the connection is closing
       * @param {(String|Buffer)} [data] The reason why the connection is
       *     closing
       * @public
       */
      close(code, data) {
        if (this.readyState === _WebSocket.CLOSED) return;
        if (this.readyState === _WebSocket.CONNECTING) {
          const msg = "WebSocket was closed before the connection was established";
          abortHandshake(this, this._req, msg);
          return;
        }
        if (this.readyState === _WebSocket.CLOSING) {
          if (this._closeFrameSent && (this._closeFrameReceived || this._receiver._writableState.errorEmitted)) {
            this._socket.end();
          }
          return;
        }
        this._readyState = _WebSocket.CLOSING;
        this._sender.close(code, data, !this._isServer, (err) => {
          if (err) return;
          this._closeFrameSent = true;
          if (this._closeFrameReceived || this._receiver._writableState.errorEmitted) {
            this._socket.end();
          }
        });
        setCloseTimer(this);
      }
      /**
       * Pause the socket.
       *
       * @public
       */
      pause() {
        if (this.readyState === _WebSocket.CONNECTING || this.readyState === _WebSocket.CLOSED) {
          return;
        }
        this._paused = true;
        this._socket.pause();
      }
      /**
       * Send a ping.
       *
       * @param {*} [data] The data to send
       * @param {Boolean} [mask] Indicates whether or not to mask `data`
       * @param {Function} [cb] Callback which is executed when the ping is sent
       * @public
       */
      ping(data, mask, cb) {
        if (this.readyState === _WebSocket.CONNECTING) {
          throw new Error("WebSocket is not open: readyState 0 (CONNECTING)");
        }
        if (typeof data === "function") {
          cb = data;
          data = mask = void 0;
        } else if (typeof mask === "function") {
          cb = mask;
          mask = void 0;
        }
        if (typeof data === "number") data = data.toString();
        if (this.readyState !== _WebSocket.OPEN) {
          sendAfterClose(this, data, cb);
          return;
        }
        if (mask === void 0) mask = !this._isServer;
        this._sender.ping(data || EMPTY_BUFFER, mask, cb);
      }
      /**
       * Send a pong.
       *
       * @param {*} [data] The data to send
       * @param {Boolean} [mask] Indicates whether or not to mask `data`
       * @param {Function} [cb] Callback which is executed when the pong is sent
       * @public
       */
      pong(data, mask, cb) {
        if (this.readyState === _WebSocket.CONNECTING) {
          throw new Error("WebSocket is not open: readyState 0 (CONNECTING)");
        }
        if (typeof data === "function") {
          cb = data;
          data = mask = void 0;
        } else if (typeof mask === "function") {
          cb = mask;
          mask = void 0;
        }
        if (typeof data === "number") data = data.toString();
        if (this.readyState !== _WebSocket.OPEN) {
          sendAfterClose(this, data, cb);
          return;
        }
        if (mask === void 0) mask = !this._isServer;
        this._sender.pong(data || EMPTY_BUFFER, mask, cb);
      }
      /**
       * Resume the socket.
       *
       * @public
       */
      resume() {
        if (this.readyState === _WebSocket.CONNECTING || this.readyState === _WebSocket.CLOSED) {
          return;
        }
        this._paused = false;
        if (!this._receiver._writableState.needDrain) this._socket.resume();
      }
      /**
       * Send a data message.
       *
       * @param {*} data The message to send
       * @param {Object} [options] Options object
       * @param {Boolean} [options.binary] Specifies whether `data` is binary or
       *     text
       * @param {Boolean} [options.compress] Specifies whether or not to compress
       *     `data`
       * @param {Boolean} [options.fin=true] Specifies whether the fragment is the
       *     last one
       * @param {Boolean} [options.mask] Specifies whether or not to mask `data`
       * @param {Function} [cb] Callback which is executed when data is written out
       * @public
       */
      send(data, options, cb) {
        if (this.readyState === _WebSocket.CONNECTING) {
          throw new Error("WebSocket is not open: readyState 0 (CONNECTING)");
        }
        if (typeof options === "function") {
          cb = options;
          options = {};
        }
        if (typeof data === "number") data = data.toString();
        if (this.readyState !== _WebSocket.OPEN) {
          sendAfterClose(this, data, cb);
          return;
        }
        const opts = {
          binary: typeof data !== "string",
          mask: !this._isServer,
          compress: true,
          fin: true,
          ...options
        };
        if (!this._extensions[PerMessageDeflate.extensionName]) {
          opts.compress = false;
        }
        this._sender.send(data || EMPTY_BUFFER, opts, cb);
      }
      /**
       * Forcibly close the connection.
       *
       * @public
       */
      terminate() {
        if (this.readyState === _WebSocket.CLOSED) return;
        if (this.readyState === _WebSocket.CONNECTING) {
          const msg = "WebSocket was closed before the connection was established";
          abortHandshake(this, this._req, msg);
          return;
        }
        if (this._socket) {
          this._readyState = _WebSocket.CLOSING;
          this._socket.destroy();
        }
      }
    };
    Object.defineProperty(WebSocket2, "CONNECTING", {
      enumerable: true,
      value: readyStates.indexOf("CONNECTING")
    });
    Object.defineProperty(WebSocket2.prototype, "CONNECTING", {
      enumerable: true,
      value: readyStates.indexOf("CONNECTING")
    });
    Object.defineProperty(WebSocket2, "OPEN", {
      enumerable: true,
      value: readyStates.indexOf("OPEN")
    });
    Object.defineProperty(WebSocket2.prototype, "OPEN", {
      enumerable: true,
      value: readyStates.indexOf("OPEN")
    });
    Object.defineProperty(WebSocket2, "CLOSING", {
      enumerable: true,
      value: readyStates.indexOf("CLOSING")
    });
    Object.defineProperty(WebSocket2.prototype, "CLOSING", {
      enumerable: true,
      value: readyStates.indexOf("CLOSING")
    });
    Object.defineProperty(WebSocket2, "CLOSED", {
      enumerable: true,
      value: readyStates.indexOf("CLOSED")
    });
    Object.defineProperty(WebSocket2.prototype, "CLOSED", {
      enumerable: true,
      value: readyStates.indexOf("CLOSED")
    });
    [
      "binaryType",
      "bufferedAmount",
      "extensions",
      "isPaused",
      "protocol",
      "readyState",
      "url"
    ].forEach((property) => {
      Object.defineProperty(WebSocket2.prototype, property, { enumerable: true });
    });
    ["open", "error", "close", "message"].forEach((method) => {
      Object.defineProperty(WebSocket2.prototype, `on${method}`, {
        enumerable: true,
        get() {
          for (const listener of this.listeners(method)) {
            if (listener[kForOnEventAttribute]) return listener[kListener];
          }
          return null;
        },
        set(handler) {
          for (const listener of this.listeners(method)) {
            if (listener[kForOnEventAttribute]) {
              this.removeListener(method, listener);
              break;
            }
          }
          if (typeof handler !== "function") return;
          this.addEventListener(method, handler, {
            [kForOnEventAttribute]: true
          });
        }
      });
    });
    WebSocket2.prototype.addEventListener = addEventListener;
    WebSocket2.prototype.removeEventListener = removeEventListener;
    module2.exports = WebSocket2;
    function initAsClient(websocket, address, protocols, options) {
      const opts = {
        allowSynchronousEvents: true,
        autoPong: true,
        protocolVersion: protocolVersions[1],
        maxPayload: 100 * 1024 * 1024,
        skipUTF8Validation: false,
        perMessageDeflate: true,
        followRedirects: false,
        maxRedirects: 10,
        ...options,
        socketPath: void 0,
        hostname: void 0,
        protocol: void 0,
        timeout: void 0,
        method: "GET",
        host: void 0,
        path: void 0,
        port: void 0
      };
      websocket._autoPong = opts.autoPong;
      if (!protocolVersions.includes(opts.protocolVersion)) {
        throw new RangeError(
          `Unsupported protocol version: ${opts.protocolVersion} (supported versions: ${protocolVersions.join(", ")})`
        );
      }
      let parsedUrl;
      if (address instanceof URL) {
        parsedUrl = address;
      } else {
        try {
          parsedUrl = new URL(address);
        } catch (e) {
          throw new SyntaxError(`Invalid URL: ${address}`);
        }
      }
      if (parsedUrl.protocol === "http:") {
        parsedUrl.protocol = "ws:";
      } else if (parsedUrl.protocol === "https:") {
        parsedUrl.protocol = "wss:";
      }
      websocket._url = parsedUrl.href;
      const isSecure = parsedUrl.protocol === "wss:";
      const isIpcUrl = parsedUrl.protocol === "ws+unix:";
      let invalidUrlMessage;
      if (parsedUrl.protocol !== "ws:" && !isSecure && !isIpcUrl) {
        invalidUrlMessage = `The URL's protocol must be one of "ws:", "wss:", "http:", "https", or "ws+unix:"`;
      } else if (isIpcUrl && !parsedUrl.pathname) {
        invalidUrlMessage = "The URL's pathname is empty";
      } else if (parsedUrl.hash) {
        invalidUrlMessage = "The URL contains a fragment identifier";
      }
      if (invalidUrlMessage) {
        const err = new SyntaxError(invalidUrlMessage);
        if (websocket._redirects === 0) {
          throw err;
        } else {
          emitErrorAndClose(websocket, err);
          return;
        }
      }
      const defaultPort = isSecure ? 443 : 80;
      const key = randomBytes(16).toString("base64");
      const request = isSecure ? https.request : http.request;
      const protocolSet = /* @__PURE__ */ new Set();
      let perMessageDeflate;
      opts.createConnection = opts.createConnection || (isSecure ? tlsConnect : netConnect);
      opts.defaultPort = opts.defaultPort || defaultPort;
      opts.port = parsedUrl.port || defaultPort;
      opts.host = parsedUrl.hostname.startsWith("[") ? parsedUrl.hostname.slice(1, -1) : parsedUrl.hostname;
      opts.headers = {
        ...opts.headers,
        "Sec-WebSocket-Version": opts.protocolVersion,
        "Sec-WebSocket-Key": key,
        Connection: "Upgrade",
        Upgrade: "websocket"
      };
      opts.path = parsedUrl.pathname + parsedUrl.search;
      opts.timeout = opts.handshakeTimeout;
      if (opts.perMessageDeflate) {
        perMessageDeflate = new PerMessageDeflate(
          opts.perMessageDeflate !== true ? opts.perMessageDeflate : {},
          false,
          opts.maxPayload
        );
        opts.headers["Sec-WebSocket-Extensions"] = format({
          [PerMessageDeflate.extensionName]: perMessageDeflate.offer()
        });
      }
      if (protocols.length) {
        for (const protocol of protocols) {
          if (typeof protocol !== "string" || !subprotocolRegex.test(protocol) || protocolSet.has(protocol)) {
            throw new SyntaxError(
              "An invalid or duplicated subprotocol was specified"
            );
          }
          protocolSet.add(protocol);
        }
        opts.headers["Sec-WebSocket-Protocol"] = protocols.join(",");
      }
      if (opts.origin) {
        if (opts.protocolVersion < 13) {
          opts.headers["Sec-WebSocket-Origin"] = opts.origin;
        } else {
          opts.headers.Origin = opts.origin;
        }
      }
      if (parsedUrl.username || parsedUrl.password) {
        opts.auth = `${parsedUrl.username}:${parsedUrl.password}`;
      }
      if (isIpcUrl) {
        const parts = opts.path.split(":");
        opts.socketPath = parts[0];
        opts.path = parts[1];
      }
      let req;
      if (opts.followRedirects) {
        if (websocket._redirects === 0) {
          websocket._originalIpc = isIpcUrl;
          websocket._originalSecure = isSecure;
          websocket._originalHostOrSocketPath = isIpcUrl ? opts.socketPath : parsedUrl.host;
          const headers = options && options.headers;
          options = { ...options, headers: {} };
          if (headers) {
            for (const [key2, value] of Object.entries(headers)) {
              options.headers[key2.toLowerCase()] = value;
            }
          }
        } else if (websocket.listenerCount("redirect") === 0) {
          const isSameHost = isIpcUrl ? websocket._originalIpc ? opts.socketPath === websocket._originalHostOrSocketPath : false : websocket._originalIpc ? false : parsedUrl.host === websocket._originalHostOrSocketPath;
          if (!isSameHost || websocket._originalSecure && !isSecure) {
            delete opts.headers.authorization;
            delete opts.headers.cookie;
            if (!isSameHost) delete opts.headers.host;
            opts.auth = void 0;
          }
        }
        if (opts.auth && !options.headers.authorization) {
          options.headers.authorization = "Basic " + Buffer.from(opts.auth).toString("base64");
        }
        req = websocket._req = request(opts);
        if (websocket._redirects) {
          websocket.emit("redirect", websocket.url, req);
        }
      } else {
        req = websocket._req = request(opts);
      }
      if (opts.timeout) {
        req.on("timeout", () => {
          abortHandshake(websocket, req, "Opening handshake has timed out");
        });
      }
      req.on("error", (err) => {
        if (req === null || req[kAborted]) return;
        req = websocket._req = null;
        emitErrorAndClose(websocket, err);
      });
      req.on("response", (res) => {
        const location = res.headers.location;
        const statusCode = res.statusCode;
        if (location && opts.followRedirects && statusCode >= 300 && statusCode < 400) {
          if (++websocket._redirects > opts.maxRedirects) {
            abortHandshake(websocket, req, "Maximum redirects exceeded");
            return;
          }
          req.abort();
          let addr;
          try {
            addr = new URL(location, address);
          } catch (e) {
            const err = new SyntaxError(`Invalid URL: ${location}`);
            emitErrorAndClose(websocket, err);
            return;
          }
          initAsClient(websocket, addr, protocols, options);
        } else if (!websocket.emit("unexpected-response", req, res)) {
          abortHandshake(
            websocket,
            req,
            `Unexpected server response: ${res.statusCode}`
          );
        }
      });
      req.on("upgrade", (res, socket, head) => {
        websocket.emit("upgrade", res);
        if (websocket.readyState !== WebSocket2.CONNECTING) return;
        req = websocket._req = null;
        const upgrade = res.headers.upgrade;
        if (upgrade === void 0 || upgrade.toLowerCase() !== "websocket") {
          abortHandshake(websocket, socket, "Invalid Upgrade header");
          return;
        }
        const digest = createHash("sha1").update(key + GUID).digest("base64");
        if (res.headers["sec-websocket-accept"] !== digest) {
          abortHandshake(websocket, socket, "Invalid Sec-WebSocket-Accept header");
          return;
        }
        const serverProt = res.headers["sec-websocket-protocol"];
        let protError;
        if (serverProt !== void 0) {
          if (!protocolSet.size) {
            protError = "Server sent a subprotocol but none was requested";
          } else if (!protocolSet.has(serverProt)) {
            protError = "Server sent an invalid subprotocol";
          }
        } else if (protocolSet.size) {
          protError = "Server sent no subprotocol";
        }
        if (protError) {
          abortHandshake(websocket, socket, protError);
          return;
        }
        if (serverProt) websocket._protocol = serverProt;
        const secWebSocketExtensions = res.headers["sec-websocket-extensions"];
        if (secWebSocketExtensions !== void 0) {
          if (!perMessageDeflate) {
            const message = "Server sent a Sec-WebSocket-Extensions header but no extension was requested";
            abortHandshake(websocket, socket, message);
            return;
          }
          let extensions;
          try {
            extensions = parse(secWebSocketExtensions);
          } catch (err) {
            const message = "Invalid Sec-WebSocket-Extensions header";
            abortHandshake(websocket, socket, message);
            return;
          }
          const extensionNames = Object.keys(extensions);
          if (extensionNames.length !== 1 || extensionNames[0] !== PerMessageDeflate.extensionName) {
            const message = "Server indicated an extension that was not requested";
            abortHandshake(websocket, socket, message);
            return;
          }
          try {
            perMessageDeflate.accept(extensions[PerMessageDeflate.extensionName]);
          } catch (err) {
            const message = "Invalid Sec-WebSocket-Extensions header";
            abortHandshake(websocket, socket, message);
            return;
          }
          websocket._extensions[PerMessageDeflate.extensionName] = perMessageDeflate;
        }
        websocket.setSocket(socket, head, {
          allowSynchronousEvents: opts.allowSynchronousEvents,
          generateMask: opts.generateMask,
          maxPayload: opts.maxPayload,
          skipUTF8Validation: opts.skipUTF8Validation
        });
      });
      if (opts.finishRequest) {
        opts.finishRequest(req, websocket);
      } else {
        req.end();
      }
    }
    function emitErrorAndClose(websocket, err) {
      websocket._readyState = WebSocket2.CLOSING;
      websocket._errorEmitted = true;
      websocket.emit("error", err);
      websocket.emitClose();
    }
    function netConnect(options) {
      options.path = options.socketPath;
      return net.connect(options);
    }
    function tlsConnect(options) {
      options.path = void 0;
      if (!options.servername && options.servername !== "") {
        options.servername = net.isIP(options.host) ? "" : options.host;
      }
      return tls.connect(options);
    }
    function abortHandshake(websocket, stream, message) {
      websocket._readyState = WebSocket2.CLOSING;
      const err = new Error(message);
      Error.captureStackTrace(err, abortHandshake);
      if (stream.setHeader) {
        stream[kAborted] = true;
        stream.abort();
        if (stream.socket && !stream.socket.destroyed) {
          stream.socket.destroy();
        }
        process.nextTick(emitErrorAndClose, websocket, err);
      } else {
        stream.destroy(err);
        stream.once("error", websocket.emit.bind(websocket, "error"));
        stream.once("close", websocket.emitClose.bind(websocket));
      }
    }
    function sendAfterClose(websocket, data, cb) {
      if (data) {
        const length = isBlob(data) ? data.size : toBuffer(data).length;
        if (websocket._socket) websocket._sender._bufferedBytes += length;
        else websocket._bufferedAmount += length;
      }
      if (cb) {
        const err = new Error(
          `WebSocket is not open: readyState ${websocket.readyState} (${readyStates[websocket.readyState]})`
        );
        process.nextTick(cb, err);
      }
    }
    function receiverOnConclude(code, reason) {
      const websocket = this[kWebSocket];
      websocket._closeFrameReceived = true;
      websocket._closeMessage = reason;
      websocket._closeCode = code;
      if (websocket._socket[kWebSocket] === void 0) return;
      websocket._socket.removeListener("data", socketOnData);
      process.nextTick(resume, websocket._socket);
      if (code === 1005) websocket.close();
      else websocket.close(code, reason);
    }
    function receiverOnDrain() {
      const websocket = this[kWebSocket];
      if (!websocket.isPaused) websocket._socket.resume();
    }
    function receiverOnError(err) {
      const websocket = this[kWebSocket];
      if (websocket._socket[kWebSocket] !== void 0) {
        websocket._socket.removeListener("data", socketOnData);
        process.nextTick(resume, websocket._socket);
        websocket.close(err[kStatusCode]);
      }
      if (!websocket._errorEmitted) {
        websocket._errorEmitted = true;
        websocket.emit("error", err);
      }
    }
    function receiverOnFinish() {
      this[kWebSocket].emitClose();
    }
    function receiverOnMessage(data, isBinary) {
      this[kWebSocket].emit("message", data, isBinary);
    }
    function receiverOnPing(data) {
      const websocket = this[kWebSocket];
      if (websocket._autoPong) websocket.pong(data, !this._isServer, NOOP);
      websocket.emit("ping", data);
    }
    function receiverOnPong(data) {
      this[kWebSocket].emit("pong", data);
    }
    function resume(stream) {
      stream.resume();
    }
    function senderOnError(err) {
      const websocket = this[kWebSocket];
      if (websocket.readyState === WebSocket2.CLOSED) return;
      if (websocket.readyState === WebSocket2.OPEN) {
        websocket._readyState = WebSocket2.CLOSING;
        setCloseTimer(websocket);
      }
      this._socket.end();
      if (!websocket._errorEmitted) {
        websocket._errorEmitted = true;
        websocket.emit("error", err);
      }
    }
    function setCloseTimer(websocket) {
      websocket._closeTimer = setTimeout(
        websocket._socket.destroy.bind(websocket._socket),
        closeTimeout
      );
    }
    function socketOnClose() {
      const websocket = this[kWebSocket];
      this.removeListener("close", socketOnClose);
      this.removeListener("data", socketOnData);
      this.removeListener("end", socketOnEnd);
      websocket._readyState = WebSocket2.CLOSING;
      let chunk;
      if (!this._readableState.endEmitted && !websocket._closeFrameReceived && !websocket._receiver._writableState.errorEmitted && (chunk = websocket._socket.read()) !== null) {
        websocket._receiver.write(chunk);
      }
      websocket._receiver.end();
      this[kWebSocket] = void 0;
      clearTimeout(websocket._closeTimer);
      if (websocket._receiver._writableState.finished || websocket._receiver._writableState.errorEmitted) {
        websocket.emitClose();
      } else {
        websocket._receiver.on("error", receiverOnFinish);
        websocket._receiver.on("finish", receiverOnFinish);
      }
    }
    function socketOnData(chunk) {
      if (!this[kWebSocket]._receiver.write(chunk)) {
        this.pause();
      }
    }
    function socketOnEnd() {
      const websocket = this[kWebSocket];
      websocket._readyState = WebSocket2.CLOSING;
      websocket._receiver.end();
      this.end();
    }
    function socketOnError() {
      const websocket = this[kWebSocket];
      this.removeListener("error", socketOnError);
      this.on("error", NOOP);
      if (websocket) {
        websocket._readyState = WebSocket2.CLOSING;
        this.destroy();
      }
    }
  }
});

// apps/max-game/source/stand-output/vendor/ws/lib/stream.js
var require_stream = __commonJS({
  "apps/max-game/source/stand-output/vendor/ws/lib/stream.js"(exports2, module2) {
    "use strict";
    var { Duplex } = require("stream");
    function emitClose(stream) {
      stream.emit("close");
    }
    function duplexOnEnd() {
      if (!this.destroyed && this._writableState.finished) {
        this.destroy();
      }
    }
    function duplexOnError(err) {
      this.removeListener("error", duplexOnError);
      this.destroy();
      if (this.listenerCount("error") === 0) {
        this.emit("error", err);
      }
    }
    function createWebSocketStream(ws, options) {
      let terminateOnDestroy = true;
      const duplex = new Duplex({
        ...options,
        autoDestroy: false,
        emitClose: false,
        objectMode: false,
        writableObjectMode: false
      });
      ws.on("message", function message(msg, isBinary) {
        const data = !isBinary && duplex._readableState.objectMode ? msg.toString() : msg;
        if (!duplex.push(data)) ws.pause();
      });
      ws.once("error", function error(err) {
        if (duplex.destroyed) return;
        terminateOnDestroy = false;
        duplex.destroy(err);
      });
      ws.once("close", function close() {
        if (duplex.destroyed) return;
        duplex.push(null);
      });
      duplex._destroy = function(err, callback) {
        if (ws.readyState === ws.CLOSED) {
          callback(err);
          process.nextTick(emitClose, duplex);
          return;
        }
        let called = false;
        ws.once("error", function error(err2) {
          called = true;
          callback(err2);
        });
        ws.once("close", function close() {
          if (!called) callback(err);
          process.nextTick(emitClose, duplex);
        });
        if (terminateOnDestroy) ws.terminate();
      };
      duplex._final = function(callback) {
        if (ws.readyState === ws.CONNECTING) {
          ws.once("open", function open() {
            duplex._final(callback);
          });
          return;
        }
        if (ws._socket === null) return;
        if (ws._socket._writableState.finished) {
          callback();
          if (duplex._readableState.endEmitted) duplex.destroy();
        } else {
          ws._socket.once("finish", function finish() {
            callback();
          });
          ws.close();
        }
      };
      duplex._read = function() {
        if (ws.isPaused) ws.resume();
      };
      duplex._write = function(chunk, encoding, callback) {
        if (ws.readyState === ws.CONNECTING) {
          ws.once("open", function open() {
            duplex._write(chunk, encoding, callback);
          });
          return;
        }
        ws.send(chunk, callback);
      };
      duplex.on("end", duplexOnEnd);
      duplex.on("error", duplexOnError);
      return duplex;
    }
    module2.exports = createWebSocketStream;
  }
});

// apps/max-game/source/stand-output/vendor/ws/lib/subprotocol.js
var require_subprotocol = __commonJS({
  "apps/max-game/source/stand-output/vendor/ws/lib/subprotocol.js"(exports2, module2) {
    "use strict";
    var { tokenChars } = require_validation();
    function parse(header) {
      const protocols = /* @__PURE__ */ new Set();
      let start = -1;
      let end = -1;
      let i = 0;
      for (i; i < header.length; i++) {
        const code = header.charCodeAt(i);
        if (end === -1 && tokenChars[code] === 1) {
          if (start === -1) start = i;
        } else if (i !== 0 && (code === 32 || code === 9)) {
          if (end === -1 && start !== -1) end = i;
        } else if (code === 44) {
          if (start === -1) {
            throw new SyntaxError(`Unexpected character at index ${i}`);
          }
          if (end === -1) end = i;
          const protocol2 = header.slice(start, end);
          if (protocols.has(protocol2)) {
            throw new SyntaxError(`The "${protocol2}" subprotocol is duplicated`);
          }
          protocols.add(protocol2);
          start = end = -1;
        } else {
          throw new SyntaxError(`Unexpected character at index ${i}`);
        }
      }
      if (start === -1 || end !== -1) {
        throw new SyntaxError("Unexpected end of input");
      }
      const protocol = header.slice(start, i);
      if (protocols.has(protocol)) {
        throw new SyntaxError(`The "${protocol}" subprotocol is duplicated`);
      }
      protocols.add(protocol);
      return protocols;
    }
    module2.exports = { parse };
  }
});

// apps/max-game/source/stand-output/vendor/ws/lib/websocket-server.js
var require_websocket_server = __commonJS({
  "apps/max-game/source/stand-output/vendor/ws/lib/websocket-server.js"(exports2, module2) {
    "use strict";
    var EventEmitter = require("events");
    var http = require("http");
    var { Duplex } = require("stream");
    var { createHash } = require("crypto");
    var extension = require_extension();
    var PerMessageDeflate = require_permessage_deflate();
    var subprotocol = require_subprotocol();
    var WebSocket2 = require_websocket();
    var { GUID, kWebSocket } = require_constants();
    var keyRegex = /^[+/0-9A-Za-z]{22}==$/;
    var RUNNING = 0;
    var CLOSING = 1;
    var CLOSED = 2;
    var WebSocketServer = class extends EventEmitter {
      /**
       * Create a `WebSocketServer` instance.
       *
       * @param {Object} options Configuration options
       * @param {Boolean} [options.allowSynchronousEvents=true] Specifies whether
       *     any of the `'message'`, `'ping'`, and `'pong'` events can be emitted
       *     multiple times in the same tick
       * @param {Boolean} [options.autoPong=true] Specifies whether or not to
       *     automatically send a pong in response to a ping
       * @param {Number} [options.backlog=511] The maximum length of the queue of
       *     pending connections
       * @param {Boolean} [options.clientTracking=true] Specifies whether or not to
       *     track clients
       * @param {Function} [options.handleProtocols] A hook to handle protocols
       * @param {String} [options.host] The hostname where to bind the server
       * @param {Number} [options.maxPayload=104857600] The maximum allowed message
       *     size
       * @param {Boolean} [options.noServer=false] Enable no server mode
       * @param {String} [options.path] Accept only connections matching this path
       * @param {(Boolean|Object)} [options.perMessageDeflate=false] Enable/disable
       *     permessage-deflate
       * @param {Number} [options.port] The port where to bind the server
       * @param {(http.Server|https.Server)} [options.server] A pre-created HTTP/S
       *     server to use
       * @param {Boolean} [options.skipUTF8Validation=false] Specifies whether or
       *     not to skip UTF-8 validation for text and close messages
       * @param {Function} [options.verifyClient] A hook to reject connections
       * @param {Function} [options.WebSocket=WebSocket] Specifies the `WebSocket`
       *     class to use. It must be the `WebSocket` class or class that extends it
       * @param {Function} [callback] A listener for the `listening` event
       */
      constructor(options, callback) {
        super();
        options = {
          allowSynchronousEvents: true,
          autoPong: true,
          maxPayload: 100 * 1024 * 1024,
          skipUTF8Validation: false,
          perMessageDeflate: false,
          handleProtocols: null,
          clientTracking: true,
          verifyClient: null,
          noServer: false,
          backlog: null,
          // use default (511 as implemented in net.js)
          server: null,
          host: null,
          path: null,
          port: null,
          WebSocket: WebSocket2,
          ...options
        };
        if (options.port == null && !options.server && !options.noServer || options.port != null && (options.server || options.noServer) || options.server && options.noServer) {
          throw new TypeError(
            'One and only one of the "port", "server", or "noServer" options must be specified'
          );
        }
        if (options.port != null) {
          this._server = http.createServer((req, res) => {
            const body = http.STATUS_CODES[426];
            res.writeHead(426, {
              "Content-Length": body.length,
              "Content-Type": "text/plain"
            });
            res.end(body);
          });
          this._server.listen(
            options.port,
            options.host,
            options.backlog,
            callback
          );
        } else if (options.server) {
          this._server = options.server;
        }
        if (this._server) {
          const emitConnection = this.emit.bind(this, "connection");
          this._removeListeners = addListeners(this._server, {
            listening: this.emit.bind(this, "listening"),
            error: this.emit.bind(this, "error"),
            upgrade: (req, socket, head) => {
              this.handleUpgrade(req, socket, head, emitConnection);
            }
          });
        }
        if (options.perMessageDeflate === true) options.perMessageDeflate = {};
        if (options.clientTracking) {
          this.clients = /* @__PURE__ */ new Set();
          this._shouldEmitClose = false;
        }
        this.options = options;
        this._state = RUNNING;
      }
      /**
       * Returns the bound address, the address family name, and port of the server
       * as reported by the operating system if listening on an IP socket.
       * If the server is listening on a pipe or UNIX domain socket, the name is
       * returned as a string.
       *
       * @return {(Object|String|null)} The address of the server
       * @public
       */
      address() {
        if (this.options.noServer) {
          throw new Error('The server is operating in "noServer" mode');
        }
        if (!this._server) return null;
        return this._server.address();
      }
      /**
       * Stop the server from accepting new connections and emit the `'close'` event
       * when all existing connections are closed.
       *
       * @param {Function} [cb] A one-time listener for the `'close'` event
       * @public
       */
      close(cb) {
        if (this._state === CLOSED) {
          if (cb) {
            this.once("close", () => {
              cb(new Error("The server is not running"));
            });
          }
          process.nextTick(emitClose, this);
          return;
        }
        if (cb) this.once("close", cb);
        if (this._state === CLOSING) return;
        this._state = CLOSING;
        if (this.options.noServer || this.options.server) {
          if (this._server) {
            this._removeListeners();
            this._removeListeners = this._server = null;
          }
          if (this.clients) {
            if (!this.clients.size) {
              process.nextTick(emitClose, this);
            } else {
              this._shouldEmitClose = true;
            }
          } else {
            process.nextTick(emitClose, this);
          }
        } else {
          const server = this._server;
          this._removeListeners();
          this._removeListeners = this._server = null;
          server.close(() => {
            emitClose(this);
          });
        }
      }
      /**
       * See if a given request should be handled by this server instance.
       *
       * @param {http.IncomingMessage} req Request object to inspect
       * @return {Boolean} `true` if the request is valid, else `false`
       * @public
       */
      shouldHandle(req) {
        if (this.options.path) {
          const index = req.url.indexOf("?");
          const pathname = index !== -1 ? req.url.slice(0, index) : req.url;
          if (pathname !== this.options.path) return false;
        }
        return true;
      }
      /**
       * Handle a HTTP Upgrade request.
       *
       * @param {http.IncomingMessage} req The request object
       * @param {Duplex} socket The network socket between the server and client
       * @param {Buffer} head The first packet of the upgraded stream
       * @param {Function} cb Callback
       * @public
       */
      handleUpgrade(req, socket, head, cb) {
        socket.on("error", socketOnError);
        const key = req.headers["sec-websocket-key"];
        const upgrade = req.headers.upgrade;
        const version = +req.headers["sec-websocket-version"];
        if (req.method !== "GET") {
          const message = "Invalid HTTP method";
          abortHandshakeOrEmitwsClientError(this, req, socket, 405, message);
          return;
        }
        if (upgrade === void 0 || upgrade.toLowerCase() !== "websocket") {
          const message = "Invalid Upgrade header";
          abortHandshakeOrEmitwsClientError(this, req, socket, 400, message);
          return;
        }
        if (key === void 0 || !keyRegex.test(key)) {
          const message = "Missing or invalid Sec-WebSocket-Key header";
          abortHandshakeOrEmitwsClientError(this, req, socket, 400, message);
          return;
        }
        if (version !== 8 && version !== 13) {
          const message = "Missing or invalid Sec-WebSocket-Version header";
          abortHandshakeOrEmitwsClientError(this, req, socket, 400, message);
          return;
        }
        if (!this.shouldHandle(req)) {
          abortHandshake(socket, 400);
          return;
        }
        const secWebSocketProtocol = req.headers["sec-websocket-protocol"];
        let protocols = /* @__PURE__ */ new Set();
        if (secWebSocketProtocol !== void 0) {
          try {
            protocols = subprotocol.parse(secWebSocketProtocol);
          } catch (err) {
            const message = "Invalid Sec-WebSocket-Protocol header";
            abortHandshakeOrEmitwsClientError(this, req, socket, 400, message);
            return;
          }
        }
        const secWebSocketExtensions = req.headers["sec-websocket-extensions"];
        const extensions = {};
        if (this.options.perMessageDeflate && secWebSocketExtensions !== void 0) {
          const perMessageDeflate = new PerMessageDeflate(
            this.options.perMessageDeflate,
            true,
            this.options.maxPayload
          );
          try {
            const offers = extension.parse(secWebSocketExtensions);
            if (offers[PerMessageDeflate.extensionName]) {
              perMessageDeflate.accept(offers[PerMessageDeflate.extensionName]);
              extensions[PerMessageDeflate.extensionName] = perMessageDeflate;
            }
          } catch (err) {
            const message = "Invalid or unacceptable Sec-WebSocket-Extensions header";
            abortHandshakeOrEmitwsClientError(this, req, socket, 400, message);
            return;
          }
        }
        if (this.options.verifyClient) {
          const info = {
            origin: req.headers[`${version === 8 ? "sec-websocket-origin" : "origin"}`],
            secure: !!(req.socket.authorized || req.socket.encrypted),
            req
          };
          if (this.options.verifyClient.length === 2) {
            this.options.verifyClient(info, (verified, code, message, headers) => {
              if (!verified) {
                return abortHandshake(socket, code || 401, message, headers);
              }
              this.completeUpgrade(
                extensions,
                key,
                protocols,
                req,
                socket,
                head,
                cb
              );
            });
            return;
          }
          if (!this.options.verifyClient(info)) return abortHandshake(socket, 401);
        }
        this.completeUpgrade(extensions, key, protocols, req, socket, head, cb);
      }
      /**
       * Upgrade the connection to WebSocket.
       *
       * @param {Object} extensions The accepted extensions
       * @param {String} key The value of the `Sec-WebSocket-Key` header
       * @param {Set} protocols The subprotocols
       * @param {http.IncomingMessage} req The request object
       * @param {Duplex} socket The network socket between the server and client
       * @param {Buffer} head The first packet of the upgraded stream
       * @param {Function} cb Callback
       * @throws {Error} If called more than once with the same socket
       * @private
       */
      completeUpgrade(extensions, key, protocols, req, socket, head, cb) {
        if (!socket.readable || !socket.writable) return socket.destroy();
        if (socket[kWebSocket]) {
          throw new Error(
            "server.handleUpgrade() was called more than once with the same socket, possibly due to a misconfiguration"
          );
        }
        if (this._state > RUNNING) return abortHandshake(socket, 503);
        const digest = createHash("sha1").update(key + GUID).digest("base64");
        const headers = [
          "HTTP/1.1 101 Switching Protocols",
          "Upgrade: websocket",
          "Connection: Upgrade",
          `Sec-WebSocket-Accept: ${digest}`
        ];
        const ws = new this.options.WebSocket(null, void 0, this.options);
        if (protocols.size) {
          const protocol = this.options.handleProtocols ? this.options.handleProtocols(protocols, req) : protocols.values().next().value;
          if (protocol) {
            headers.push(`Sec-WebSocket-Protocol: ${protocol}`);
            ws._protocol = protocol;
          }
        }
        if (extensions[PerMessageDeflate.extensionName]) {
          const params = extensions[PerMessageDeflate.extensionName].params;
          const value = extension.format({
            [PerMessageDeflate.extensionName]: [params]
          });
          headers.push(`Sec-WebSocket-Extensions: ${value}`);
          ws._extensions = extensions;
        }
        this.emit("headers", headers, req);
        socket.write(headers.concat("\r\n").join("\r\n"));
        socket.removeListener("error", socketOnError);
        ws.setSocket(socket, head, {
          allowSynchronousEvents: this.options.allowSynchronousEvents,
          maxPayload: this.options.maxPayload,
          skipUTF8Validation: this.options.skipUTF8Validation
        });
        if (this.clients) {
          this.clients.add(ws);
          ws.on("close", () => {
            this.clients.delete(ws);
            if (this._shouldEmitClose && !this.clients.size) {
              process.nextTick(emitClose, this);
            }
          });
        }
        cb(ws, req);
      }
    };
    module2.exports = WebSocketServer;
    function addListeners(server, map) {
      for (const event of Object.keys(map)) server.on(event, map[event]);
      return function removeListeners() {
        for (const event of Object.keys(map)) {
          server.removeListener(event, map[event]);
        }
      };
    }
    function emitClose(server) {
      server._state = CLOSED;
      server.emit("close");
    }
    function socketOnError() {
      this.destroy();
    }
    function abortHandshake(socket, code, message, headers) {
      message = message || http.STATUS_CODES[code];
      headers = {
        Connection: "close",
        "Content-Type": "text/html",
        "Content-Length": Buffer.byteLength(message),
        ...headers
      };
      socket.once("finish", socket.destroy);
      socket.end(
        `HTTP/1.1 ${code} ${http.STATUS_CODES[code]}\r
` + Object.keys(headers).map((h) => `${h}: ${headers[h]}`).join("\r\n") + "\r\n\r\n" + message
      );
    }
    function abortHandshakeOrEmitwsClientError(server, req, socket, code, message) {
      if (server.listenerCount("wsClientError")) {
        const err = new Error(message);
        Error.captureStackTrace(err, abortHandshakeOrEmitwsClientError);
        server.emit("wsClientError", err, socket, req);
      } else {
        abortHandshake(socket, code, message);
      }
    }
  }
});

// apps/max-game/source/stand-output/vendor/ws/index.js
var require_ws = __commonJS({
  "apps/max-game/source/stand-output/vendor/ws/index.js"(exports2, module2) {
    "use strict";
    var WebSocket2 = require_websocket();
    WebSocket2.createWebSocketStream = require_stream();
    WebSocket2.Server = require_websocket_server();
    WebSocket2.Receiver = require_receiver();
    WebSocket2.Sender = require_sender();
    WebSocket2.WebSocket = WebSocket2;
    WebSocket2.WebSocketServer = WebSocket2.Server;
    module2.exports = WebSocket2;
  }
});

// apps/max-game/source/stand-output/vendor/long/src/long.js
var require_long = __commonJS({
  "apps/max-game/source/stand-output/vendor/long/src/long.js"(exports2, module2) {
    module2.exports = Long2;
    var wasm = null;
    try {
      wasm = new WebAssembly.Instance(new WebAssembly.Module(new Uint8Array([
        0,
        97,
        115,
        109,
        1,
        0,
        0,
        0,
        1,
        13,
        2,
        96,
        0,
        1,
        127,
        96,
        4,
        127,
        127,
        127,
        127,
        1,
        127,
        3,
        7,
        6,
        0,
        1,
        1,
        1,
        1,
        1,
        6,
        6,
        1,
        127,
        1,
        65,
        0,
        11,
        7,
        50,
        6,
        3,
        109,
        117,
        108,
        0,
        1,
        5,
        100,
        105,
        118,
        95,
        115,
        0,
        2,
        5,
        100,
        105,
        118,
        95,
        117,
        0,
        3,
        5,
        114,
        101,
        109,
        95,
        115,
        0,
        4,
        5,
        114,
        101,
        109,
        95,
        117,
        0,
        5,
        8,
        103,
        101,
        116,
        95,
        104,
        105,
        103,
        104,
        0,
        0,
        10,
        191,
        1,
        6,
        4,
        0,
        35,
        0,
        11,
        36,
        1,
        1,
        126,
        32,
        0,
        173,
        32,
        1,
        173,
        66,
        32,
        134,
        132,
        32,
        2,
        173,
        32,
        3,
        173,
        66,
        32,
        134,
        132,
        126,
        34,
        4,
        66,
        32,
        135,
        167,
        36,
        0,
        32,
        4,
        167,
        11,
        36,
        1,
        1,
        126,
        32,
        0,
        173,
        32,
        1,
        173,
        66,
        32,
        134,
        132,
        32,
        2,
        173,
        32,
        3,
        173,
        66,
        32,
        134,
        132,
        127,
        34,
        4,
        66,
        32,
        135,
        167,
        36,
        0,
        32,
        4,
        167,
        11,
        36,
        1,
        1,
        126,
        32,
        0,
        173,
        32,
        1,
        173,
        66,
        32,
        134,
        132,
        32,
        2,
        173,
        32,
        3,
        173,
        66,
        32,
        134,
        132,
        128,
        34,
        4,
        66,
        32,
        135,
        167,
        36,
        0,
        32,
        4,
        167,
        11,
        36,
        1,
        1,
        126,
        32,
        0,
        173,
        32,
        1,
        173,
        66,
        32,
        134,
        132,
        32,
        2,
        173,
        32,
        3,
        173,
        66,
        32,
        134,
        132,
        129,
        34,
        4,
        66,
        32,
        135,
        167,
        36,
        0,
        32,
        4,
        167,
        11,
        36,
        1,
        1,
        126,
        32,
        0,
        173,
        32,
        1,
        173,
        66,
        32,
        134,
        132,
        32,
        2,
        173,
        32,
        3,
        173,
        66,
        32,
        134,
        132,
        130,
        34,
        4,
        66,
        32,
        135,
        167,
        36,
        0,
        32,
        4,
        167,
        11
      ])), {}).exports;
    } catch (e) {
    }
    function Long2(low, high, unsigned) {
      this.low = low | 0;
      this.high = high | 0;
      this.unsigned = !!unsigned;
    }
    Long2.prototype.__isLong__;
    Object.defineProperty(Long2.prototype, "__isLong__", { value: true });
    function isLong(obj) {
      return (obj && obj["__isLong__"]) === true;
    }
    Long2.isLong = isLong;
    var INT_CACHE = {};
    var UINT_CACHE = {};
    function fromInt(value, unsigned) {
      var obj, cachedObj, cache;
      if (unsigned) {
        value >>>= 0;
        if (cache = 0 <= value && value < 256) {
          cachedObj = UINT_CACHE[value];
          if (cachedObj)
            return cachedObj;
        }
        obj = fromBits(value, (value | 0) < 0 ? -1 : 0, true);
        if (cache)
          UINT_CACHE[value] = obj;
        return obj;
      } else {
        value |= 0;
        if (cache = -128 <= value && value < 128) {
          cachedObj = INT_CACHE[value];
          if (cachedObj)
            return cachedObj;
        }
        obj = fromBits(value, value < 0 ? -1 : 0, false);
        if (cache)
          INT_CACHE[value] = obj;
        return obj;
      }
    }
    Long2.fromInt = fromInt;
    function fromNumber(value, unsigned) {
      if (isNaN(value))
        return unsigned ? UZERO : ZERO;
      if (unsigned) {
        if (value < 0)
          return UZERO;
        if (value >= TWO_PWR_64_DBL)
          return MAX_UNSIGNED_VALUE;
      } else {
        if (value <= -TWO_PWR_63_DBL)
          return MIN_VALUE;
        if (value + 1 >= TWO_PWR_63_DBL)
          return MAX_VALUE;
      }
      if (value < 0)
        return fromNumber(-value, unsigned).neg();
      return fromBits(value % TWO_PWR_32_DBL | 0, value / TWO_PWR_32_DBL | 0, unsigned);
    }
    Long2.fromNumber = fromNumber;
    function fromBits(lowBits, highBits, unsigned) {
      return new Long2(lowBits, highBits, unsigned);
    }
    Long2.fromBits = fromBits;
    var pow_dbl = Math.pow;
    function fromString(str, unsigned, radix) {
      if (str.length === 0)
        throw Error("empty string");
      if (str === "NaN" || str === "Infinity" || str === "+Infinity" || str === "-Infinity")
        return ZERO;
      if (typeof unsigned === "number") {
        radix = unsigned, unsigned = false;
      } else {
        unsigned = !!unsigned;
      }
      radix = radix || 10;
      if (radix < 2 || 36 < radix)
        throw RangeError("radix");
      var p;
      if ((p = str.indexOf("-")) > 0)
        throw Error("interior hyphen");
      else if (p === 0) {
        return fromString(str.substring(1), unsigned, radix).neg();
      }
      var radixToPower = fromNumber(pow_dbl(radix, 8));
      var result = ZERO;
      for (var i = 0; i < str.length; i += 8) {
        var size = Math.min(8, str.length - i), value = parseInt(str.substring(i, i + size), radix);
        if (size < 8) {
          var power = fromNumber(pow_dbl(radix, size));
          result = result.mul(power).add(fromNumber(value));
        } else {
          result = result.mul(radixToPower);
          result = result.add(fromNumber(value));
        }
      }
      result.unsigned = unsigned;
      return result;
    }
    Long2.fromString = fromString;
    function fromValue(val, unsigned) {
      if (typeof val === "number")
        return fromNumber(val, unsigned);
      if (typeof val === "string")
        return fromString(val, unsigned);
      return fromBits(val.low, val.high, typeof unsigned === "boolean" ? unsigned : val.unsigned);
    }
    Long2.fromValue = fromValue;
    var TWO_PWR_16_DBL = 1 << 16;
    var TWO_PWR_24_DBL = 1 << 24;
    var TWO_PWR_32_DBL = TWO_PWR_16_DBL * TWO_PWR_16_DBL;
    var TWO_PWR_64_DBL = TWO_PWR_32_DBL * TWO_PWR_32_DBL;
    var TWO_PWR_63_DBL = TWO_PWR_64_DBL / 2;
    var TWO_PWR_24 = fromInt(TWO_PWR_24_DBL);
    var ZERO = fromInt(0);
    Long2.ZERO = ZERO;
    var UZERO = fromInt(0, true);
    Long2.UZERO = UZERO;
    var ONE = fromInt(1);
    Long2.ONE = ONE;
    var UONE = fromInt(1, true);
    Long2.UONE = UONE;
    var NEG_ONE = fromInt(-1);
    Long2.NEG_ONE = NEG_ONE;
    var MAX_VALUE = fromBits(4294967295 | 0, 2147483647 | 0, false);
    Long2.MAX_VALUE = MAX_VALUE;
    var MAX_UNSIGNED_VALUE = fromBits(4294967295 | 0, 4294967295 | 0, true);
    Long2.MAX_UNSIGNED_VALUE = MAX_UNSIGNED_VALUE;
    var MIN_VALUE = fromBits(0, 2147483648 | 0, false);
    Long2.MIN_VALUE = MIN_VALUE;
    var LongPrototype = Long2.prototype;
    LongPrototype.toInt = function toInt() {
      return this.unsigned ? this.low >>> 0 : this.low;
    };
    LongPrototype.toNumber = function toNumber() {
      if (this.unsigned)
        return (this.high >>> 0) * TWO_PWR_32_DBL + (this.low >>> 0);
      return this.high * TWO_PWR_32_DBL + (this.low >>> 0);
    };
    LongPrototype.toString = function toString(radix) {
      radix = radix || 10;
      if (radix < 2 || 36 < radix)
        throw RangeError("radix");
      if (this.isZero())
        return "0";
      if (this.isNegative()) {
        if (this.eq(MIN_VALUE)) {
          var radixLong = fromNumber(radix), div = this.div(radixLong), rem1 = div.mul(radixLong).sub(this);
          return div.toString(radix) + rem1.toInt().toString(radix);
        } else
          return "-" + this.neg().toString(radix);
      }
      var radixToPower = fromNumber(pow_dbl(radix, 6), this.unsigned), rem = this;
      var result = "";
      while (true) {
        var remDiv = rem.div(radixToPower), intval = rem.sub(remDiv.mul(radixToPower)).toInt() >>> 0, digits = intval.toString(radix);
        rem = remDiv;
        if (rem.isZero())
          return digits + result;
        else {
          while (digits.length < 6)
            digits = "0" + digits;
          result = "" + digits + result;
        }
      }
    };
    LongPrototype.getHighBits = function getHighBits() {
      return this.high;
    };
    LongPrototype.getHighBitsUnsigned = function getHighBitsUnsigned() {
      return this.high >>> 0;
    };
    LongPrototype.getLowBits = function getLowBits() {
      return this.low;
    };
    LongPrototype.getLowBitsUnsigned = function getLowBitsUnsigned() {
      return this.low >>> 0;
    };
    LongPrototype.getNumBitsAbs = function getNumBitsAbs() {
      if (this.isNegative())
        return this.eq(MIN_VALUE) ? 64 : this.neg().getNumBitsAbs();
      var val = this.high != 0 ? this.high : this.low;
      for (var bit = 31; bit > 0; bit--)
        if ((val & 1 << bit) != 0)
          break;
      return this.high != 0 ? bit + 33 : bit + 1;
    };
    LongPrototype.isZero = function isZero() {
      return this.high === 0 && this.low === 0;
    };
    LongPrototype.eqz = LongPrototype.isZero;
    LongPrototype.isNegative = function isNegative() {
      return !this.unsigned && this.high < 0;
    };
    LongPrototype.isPositive = function isPositive() {
      return this.unsigned || this.high >= 0;
    };
    LongPrototype.isOdd = function isOdd() {
      return (this.low & 1) === 1;
    };
    LongPrototype.isEven = function isEven() {
      return (this.low & 1) === 0;
    };
    LongPrototype.equals = function equals(other) {
      if (!isLong(other))
        other = fromValue(other);
      if (this.unsigned !== other.unsigned && this.high >>> 31 === 1 && other.high >>> 31 === 1)
        return false;
      return this.high === other.high && this.low === other.low;
    };
    LongPrototype.eq = LongPrototype.equals;
    LongPrototype.notEquals = function notEquals(other) {
      return !this.eq(
        /* validates */
        other
      );
    };
    LongPrototype.neq = LongPrototype.notEquals;
    LongPrototype.ne = LongPrototype.notEquals;
    LongPrototype.lessThan = function lessThan(other) {
      return this.comp(
        /* validates */
        other
      ) < 0;
    };
    LongPrototype.lt = LongPrototype.lessThan;
    LongPrototype.lessThanOrEqual = function lessThanOrEqual(other) {
      return this.comp(
        /* validates */
        other
      ) <= 0;
    };
    LongPrototype.lte = LongPrototype.lessThanOrEqual;
    LongPrototype.le = LongPrototype.lessThanOrEqual;
    LongPrototype.greaterThan = function greaterThan(other) {
      return this.comp(
        /* validates */
        other
      ) > 0;
    };
    LongPrototype.gt = LongPrototype.greaterThan;
    LongPrototype.greaterThanOrEqual = function greaterThanOrEqual(other) {
      return this.comp(
        /* validates */
        other
      ) >= 0;
    };
    LongPrototype.gte = LongPrototype.greaterThanOrEqual;
    LongPrototype.ge = LongPrototype.greaterThanOrEqual;
    LongPrototype.compare = function compare(other) {
      if (!isLong(other))
        other = fromValue(other);
      if (this.eq(other))
        return 0;
      var thisNeg = this.isNegative(), otherNeg = other.isNegative();
      if (thisNeg && !otherNeg)
        return -1;
      if (!thisNeg && otherNeg)
        return 1;
      if (!this.unsigned)
        return this.sub(other).isNegative() ? -1 : 1;
      return other.high >>> 0 > this.high >>> 0 || other.high === this.high && other.low >>> 0 > this.low >>> 0 ? -1 : 1;
    };
    LongPrototype.comp = LongPrototype.compare;
    LongPrototype.negate = function negate() {
      if (!this.unsigned && this.eq(MIN_VALUE))
        return MIN_VALUE;
      return this.not().add(ONE);
    };
    LongPrototype.neg = LongPrototype.negate;
    LongPrototype.add = function add(addend) {
      if (!isLong(addend))
        addend = fromValue(addend);
      var a48 = this.high >>> 16;
      var a32 = this.high & 65535;
      var a16 = this.low >>> 16;
      var a00 = this.low & 65535;
      var b48 = addend.high >>> 16;
      var b32 = addend.high & 65535;
      var b16 = addend.low >>> 16;
      var b00 = addend.low & 65535;
      var c48 = 0, c32 = 0, c16 = 0, c00 = 0;
      c00 += a00 + b00;
      c16 += c00 >>> 16;
      c00 &= 65535;
      c16 += a16 + b16;
      c32 += c16 >>> 16;
      c16 &= 65535;
      c32 += a32 + b32;
      c48 += c32 >>> 16;
      c32 &= 65535;
      c48 += a48 + b48;
      c48 &= 65535;
      return fromBits(c16 << 16 | c00, c48 << 16 | c32, this.unsigned);
    };
    LongPrototype.subtract = function subtract(subtrahend) {
      if (!isLong(subtrahend))
        subtrahend = fromValue(subtrahend);
      return this.add(subtrahend.neg());
    };
    LongPrototype.sub = LongPrototype.subtract;
    LongPrototype.multiply = function multiply(multiplier) {
      if (this.isZero())
        return ZERO;
      if (!isLong(multiplier))
        multiplier = fromValue(multiplier);
      if (wasm) {
        var low = wasm.mul(
          this.low,
          this.high,
          multiplier.low,
          multiplier.high
        );
        return fromBits(low, wasm.get_high(), this.unsigned);
      }
      if (multiplier.isZero())
        return ZERO;
      if (this.eq(MIN_VALUE))
        return multiplier.isOdd() ? MIN_VALUE : ZERO;
      if (multiplier.eq(MIN_VALUE))
        return this.isOdd() ? MIN_VALUE : ZERO;
      if (this.isNegative()) {
        if (multiplier.isNegative())
          return this.neg().mul(multiplier.neg());
        else
          return this.neg().mul(multiplier).neg();
      } else if (multiplier.isNegative())
        return this.mul(multiplier.neg()).neg();
      if (this.lt(TWO_PWR_24) && multiplier.lt(TWO_PWR_24))
        return fromNumber(this.toNumber() * multiplier.toNumber(), this.unsigned);
      var a48 = this.high >>> 16;
      var a32 = this.high & 65535;
      var a16 = this.low >>> 16;
      var a00 = this.low & 65535;
      var b48 = multiplier.high >>> 16;
      var b32 = multiplier.high & 65535;
      var b16 = multiplier.low >>> 16;
      var b00 = multiplier.low & 65535;
      var c48 = 0, c32 = 0, c16 = 0, c00 = 0;
      c00 += a00 * b00;
      c16 += c00 >>> 16;
      c00 &= 65535;
      c16 += a16 * b00;
      c32 += c16 >>> 16;
      c16 &= 65535;
      c16 += a00 * b16;
      c32 += c16 >>> 16;
      c16 &= 65535;
      c32 += a32 * b00;
      c48 += c32 >>> 16;
      c32 &= 65535;
      c32 += a16 * b16;
      c48 += c32 >>> 16;
      c32 &= 65535;
      c32 += a00 * b32;
      c48 += c32 >>> 16;
      c32 &= 65535;
      c48 += a48 * b00 + a32 * b16 + a16 * b32 + a00 * b48;
      c48 &= 65535;
      return fromBits(c16 << 16 | c00, c48 << 16 | c32, this.unsigned);
    };
    LongPrototype.mul = LongPrototype.multiply;
    LongPrototype.divide = function divide(divisor) {
      if (!isLong(divisor))
        divisor = fromValue(divisor);
      if (divisor.isZero())
        throw Error("division by zero");
      if (wasm) {
        if (!this.unsigned && this.high === -2147483648 && divisor.low === -1 && divisor.high === -1) {
          return this;
        }
        var low = (this.unsigned ? wasm.div_u : wasm.div_s)(
          this.low,
          this.high,
          divisor.low,
          divisor.high
        );
        return fromBits(low, wasm.get_high(), this.unsigned);
      }
      if (this.isZero())
        return this.unsigned ? UZERO : ZERO;
      var approx, rem, res;
      if (!this.unsigned) {
        if (this.eq(MIN_VALUE)) {
          if (divisor.eq(ONE) || divisor.eq(NEG_ONE))
            return MIN_VALUE;
          else if (divisor.eq(MIN_VALUE))
            return ONE;
          else {
            var halfThis = this.shr(1);
            approx = halfThis.div(divisor).shl(1);
            if (approx.eq(ZERO)) {
              return divisor.isNegative() ? ONE : NEG_ONE;
            } else {
              rem = this.sub(divisor.mul(approx));
              res = approx.add(rem.div(divisor));
              return res;
            }
          }
        } else if (divisor.eq(MIN_VALUE))
          return this.unsigned ? UZERO : ZERO;
        if (this.isNegative()) {
          if (divisor.isNegative())
            return this.neg().div(divisor.neg());
          return this.neg().div(divisor).neg();
        } else if (divisor.isNegative())
          return this.div(divisor.neg()).neg();
        res = ZERO;
      } else {
        if (!divisor.unsigned)
          divisor = divisor.toUnsigned();
        if (divisor.gt(this))
          return UZERO;
        if (divisor.gt(this.shru(1)))
          return UONE;
        res = UZERO;
      }
      rem = this;
      while (rem.gte(divisor)) {
        approx = Math.max(1, Math.floor(rem.toNumber() / divisor.toNumber()));
        var log2 = Math.ceil(Math.log(approx) / Math.LN2), delta = log2 <= 48 ? 1 : pow_dbl(2, log2 - 48), approxRes = fromNumber(approx), approxRem = approxRes.mul(divisor);
        while (approxRem.isNegative() || approxRem.gt(rem)) {
          approx -= delta;
          approxRes = fromNumber(approx, this.unsigned);
          approxRem = approxRes.mul(divisor);
        }
        if (approxRes.isZero())
          approxRes = ONE;
        res = res.add(approxRes);
        rem = rem.sub(approxRem);
      }
      return res;
    };
    LongPrototype.div = LongPrototype.divide;
    LongPrototype.modulo = function modulo(divisor) {
      if (!isLong(divisor))
        divisor = fromValue(divisor);
      if (wasm) {
        var low = (this.unsigned ? wasm.rem_u : wasm.rem_s)(
          this.low,
          this.high,
          divisor.low,
          divisor.high
        );
        return fromBits(low, wasm.get_high(), this.unsigned);
      }
      return this.sub(this.div(divisor).mul(divisor));
    };
    LongPrototype.mod = LongPrototype.modulo;
    LongPrototype.rem = LongPrototype.modulo;
    LongPrototype.not = function not() {
      return fromBits(~this.low, ~this.high, this.unsigned);
    };
    LongPrototype.and = function and(other) {
      if (!isLong(other))
        other = fromValue(other);
      return fromBits(this.low & other.low, this.high & other.high, this.unsigned);
    };
    LongPrototype.or = function or(other) {
      if (!isLong(other))
        other = fromValue(other);
      return fromBits(this.low | other.low, this.high | other.high, this.unsigned);
    };
    LongPrototype.xor = function xor(other) {
      if (!isLong(other))
        other = fromValue(other);
      return fromBits(this.low ^ other.low, this.high ^ other.high, this.unsigned);
    };
    LongPrototype.shiftLeft = function shiftLeft(numBits) {
      if (isLong(numBits))
        numBits = numBits.toInt();
      if ((numBits &= 63) === 0)
        return this;
      else if (numBits < 32)
        return fromBits(this.low << numBits, this.high << numBits | this.low >>> 32 - numBits, this.unsigned);
      else
        return fromBits(0, this.low << numBits - 32, this.unsigned);
    };
    LongPrototype.shl = LongPrototype.shiftLeft;
    LongPrototype.shiftRight = function shiftRight(numBits) {
      if (isLong(numBits))
        numBits = numBits.toInt();
      if ((numBits &= 63) === 0)
        return this;
      else if (numBits < 32)
        return fromBits(this.low >>> numBits | this.high << 32 - numBits, this.high >> numBits, this.unsigned);
      else
        return fromBits(this.high >> numBits - 32, this.high >= 0 ? 0 : -1, this.unsigned);
    };
    LongPrototype.shr = LongPrototype.shiftRight;
    LongPrototype.shiftRightUnsigned = function shiftRightUnsigned(numBits) {
      if (isLong(numBits))
        numBits = numBits.toInt();
      numBits &= 63;
      if (numBits === 0)
        return this;
      else {
        var high = this.high;
        if (numBits < 32) {
          var low = this.low;
          return fromBits(low >>> numBits | high << 32 - numBits, high >>> numBits, this.unsigned);
        } else if (numBits === 32)
          return fromBits(high, 0, this.unsigned);
        else
          return fromBits(high >>> numBits - 32, 0, this.unsigned);
      }
    };
    LongPrototype.shru = LongPrototype.shiftRightUnsigned;
    LongPrototype.shr_u = LongPrototype.shiftRightUnsigned;
    LongPrototype.toSigned = function toSigned() {
      if (!this.unsigned)
        return this;
      return fromBits(this.low, this.high, false);
    };
    LongPrototype.toUnsigned = function toUnsigned() {
      if (this.unsigned)
        return this;
      return fromBits(this.low, this.high, true);
    };
    LongPrototype.toBytes = function toBytes(le) {
      return le ? this.toBytesLE() : this.toBytesBE();
    };
    LongPrototype.toBytesLE = function toBytesLE() {
      var hi = this.high, lo = this.low;
      return [
        lo & 255,
        lo >>> 8 & 255,
        lo >>> 16 & 255,
        lo >>> 24,
        hi & 255,
        hi >>> 8 & 255,
        hi >>> 16 & 255,
        hi >>> 24
      ];
    };
    LongPrototype.toBytesBE = function toBytesBE() {
      var hi = this.high, lo = this.low;
      return [
        hi >>> 24,
        hi >>> 16 & 255,
        hi >>> 8 & 255,
        hi & 255,
        lo >>> 24,
        lo >>> 16 & 255,
        lo >>> 8 & 255,
        lo & 255
      ];
    };
    Long2.fromBytes = function fromBytes(bytes, unsigned, le) {
      return le ? Long2.fromBytesLE(bytes, unsigned) : Long2.fromBytesBE(bytes, unsigned);
    };
    Long2.fromBytesLE = function fromBytesLE(bytes, unsigned) {
      return new Long2(
        bytes[0] | bytes[1] << 8 | bytes[2] << 16 | bytes[3] << 24,
        bytes[4] | bytes[5] << 8 | bytes[6] << 16 | bytes[7] << 24,
        unsigned
      );
    };
    Long2.fromBytesBE = function fromBytesBE(bytes, unsigned) {
      return new Long2(
        bytes[4] << 24 | bytes[5] << 16 | bytes[6] << 8 | bytes[7],
        bytes[0] << 24 | bytes[1] << 16 | bytes[2] << 8 | bytes[3],
        unsigned
      );
    };
  }
});

// apps/max-game/source/stand-output/vendor/osc/src/osc.js
var require_osc = __commonJS({
  "apps/max-game/source/stand-output/vendor/osc/src/osc.js"(exports2, module2) {
    var osc2 = osc2 || {};
    (function() {
      "use strict";
      osc2.SECS_70YRS = 2208988800;
      osc2.TWO_32 = 4294967296;
      osc2.defaults = {
        metadata: false,
        unpackSingleArgs: true
      };
      osc2.isCommonJS = typeof module2 !== "undefined" && module2.exports ? true : false;
      osc2.isNode = osc2.isCommonJS && typeof window === "undefined";
      osc2.isElectron = typeof process !== "undefined" && process.versions && process.versions.electron ? true : false;
      osc2.isBufferEnv = osc2.isNode || osc2.isElectron;
      osc2.isArray = function(obj) {
        return obj && Object.prototype.toString.call(obj) === "[object Array]";
      };
      osc2.isTypedArrayView = function(obj) {
        return obj.buffer && obj.buffer instanceof ArrayBuffer;
      };
      osc2.isBuffer = function(obj) {
        return osc2.isBufferEnv && obj instanceof Buffer;
      };
      osc2.Long = typeof Long !== "undefined" ? Long : osc2.isNode ? require_long() : void 0;
      osc2.TextDecoder = typeof TextDecoder !== "undefined" ? new TextDecoder("utf-8") : typeof util !== "undefined" && typeof (util.TextDecoder !== "undefined") ? new util.TextDecoder("utf-8") : void 0;
      osc2.TextEncoder = typeof TextEncoder !== "undefined" ? new TextEncoder("utf-8") : typeof util !== "undefined" && typeof (util.TextEncoder !== "undefined") ? new util.TextEncoder("utf-8") : void 0;
      osc2.dataView = function(obj, offset, length) {
        if (obj.buffer) {
          return new DataView(obj.buffer, offset, length);
        }
        if (obj instanceof ArrayBuffer) {
          return new DataView(obj, offset, length);
        }
        return new DataView(new Uint8Array(obj), offset, length);
      };
      osc2.byteArray = function(obj) {
        if (obj instanceof Uint8Array) {
          return obj;
        }
        var buf = obj.buffer ? obj.buffer : obj;
        if (!(buf instanceof ArrayBuffer) && (typeof buf.length === "undefined" || typeof buf === "string")) {
          throw new Error("Can't wrap a non-array-like object as Uint8Array. Object was: " + JSON.stringify(obj, null, 2));
        }
        return new Uint8Array(buf);
      };
      osc2.nativeBuffer = function(obj) {
        if (osc2.isBufferEnv) {
          return osc2.isBuffer(obj) ? obj : Buffer.from(obj.buffer ? obj : new Uint8Array(obj));
        }
        return osc2.isTypedArrayView(obj) ? obj : new Uint8Array(obj);
      };
      osc2.copyByteArray = function(source, target, offset) {
        if (osc2.isTypedArrayView(source) && osc2.isTypedArrayView(target)) {
          target.set(source, offset);
        } else {
          var start = offset === void 0 ? 0 : offset, len = Math.min(target.length - offset, source.length);
          for (var i = 0, j = start; i < len; i++, j++) {
            target[j] = source[i];
          }
        }
        return target;
      };
      osc2.readString = function(dv, offsetState) {
        var charCodes = [], idx = offsetState.idx;
        for (; idx < dv.byteLength; idx++) {
          var charCode = dv.getUint8(idx);
          if (charCode !== 0) {
            charCodes.push(charCode);
          } else {
            idx++;
            break;
          }
        }
        idx = idx + 3 & ~3;
        offsetState.idx = idx;
        var decoder = osc2.isBufferEnv ? osc2.readString.withBuffer : osc2.TextDecoder ? osc2.readString.withTextDecoder : osc2.readString.raw;
        return decoder(charCodes);
      };
      osc2.readString.raw = function(charCodes) {
        var str = "";
        var sliceSize = 1e4;
        for (var i = 0; i < charCodes.length; i += sliceSize) {
          str += String.fromCharCode.apply(null, charCodes.slice(i, i + sliceSize));
        }
        return str;
      };
      osc2.readString.withTextDecoder = function(charCodes) {
        var data = new Int8Array(charCodes);
        return osc2.TextDecoder.decode(data);
      };
      osc2.readString.withBuffer = function(charCodes) {
        return Buffer.from(charCodes).toString("utf-8");
      };
      osc2.writeString = function(str) {
        var encoder = osc2.isBufferEnv ? osc2.writeString.withBuffer : osc2.TextEncoder ? osc2.writeString.withTextEncoder : null, terminated = str + "\0", encodedStr;
        if (encoder) {
          encodedStr = encoder(terminated);
        }
        var len = encoder ? encodedStr.length : terminated.length, paddedLen = len + 3 & ~3, arr = new Uint8Array(paddedLen);
        for (var i = 0; i < len - 1; i++) {
          var charCode = encoder ? encodedStr[i] : terminated.charCodeAt(i);
          arr[i] = charCode;
        }
        return arr;
      };
      osc2.writeString.withTextEncoder = function(str) {
        return osc2.TextEncoder.encode(str);
      };
      osc2.writeString.withBuffer = function(str) {
        return Buffer.from(str);
      };
      osc2.readPrimitive = function(dv, readerName, numBytes, offsetState) {
        var val = dv[readerName](offsetState.idx, false);
        offsetState.idx += numBytes;
        return val;
      };
      osc2.writePrimitive = function(val, dv, writerName, numBytes, offset) {
        offset = offset === void 0 ? 0 : offset;
        var arr;
        if (!dv) {
          arr = new Uint8Array(numBytes);
          dv = new DataView(arr.buffer);
        } else {
          arr = new Uint8Array(dv.buffer);
        }
        dv[writerName](offset, val, false);
        return arr;
      };
      osc2.readInt32 = function(dv, offsetState) {
        return osc2.readPrimitive(dv, "getInt32", 4, offsetState);
      };
      osc2.writeInt32 = function(val, dv, offset) {
        return osc2.writePrimitive(val, dv, "setInt32", 4, offset);
      };
      osc2.readInt64 = function(dv, offsetState) {
        var high = osc2.readPrimitive(dv, "getInt32", 4, offsetState), low = osc2.readPrimitive(dv, "getInt32", 4, offsetState);
        if (osc2.Long) {
          return new osc2.Long(low, high);
        } else {
          return {
            high,
            low,
            unsigned: false
          };
        }
      };
      osc2.writeInt64 = function(val, dv, offset) {
        var arr = new Uint8Array(8);
        arr.set(osc2.writePrimitive(val.high, dv, "setInt32", 4, offset), 0);
        arr.set(osc2.writePrimitive(val.low, dv, "setInt32", 4, offset + 4), 4);
        return arr;
      };
      osc2.readFloat32 = function(dv, offsetState) {
        return osc2.readPrimitive(dv, "getFloat32", 4, offsetState);
      };
      osc2.writeFloat32 = function(val, dv, offset) {
        return osc2.writePrimitive(val, dv, "setFloat32", 4, offset);
      };
      osc2.readFloat64 = function(dv, offsetState) {
        return osc2.readPrimitive(dv, "getFloat64", 8, offsetState);
      };
      osc2.writeFloat64 = function(val, dv, offset) {
        return osc2.writePrimitive(val, dv, "setFloat64", 8, offset);
      };
      osc2.readChar32 = function(dv, offsetState) {
        var charCode = osc2.readPrimitive(dv, "getUint32", 4, offsetState);
        return String.fromCharCode(charCode);
      };
      osc2.writeChar32 = function(str, dv, offset) {
        var charCode = str.charCodeAt(0);
        if (charCode === void 0 || charCode < -1) {
          return void 0;
        }
        return osc2.writePrimitive(charCode, dv, "setUint32", 4, offset);
      };
      osc2.readBlob = function(dv, offsetState) {
        var len = osc2.readInt32(dv, offsetState), paddedLen = len + 3 & ~3, blob = new Uint8Array(dv.buffer, offsetState.idx, len);
        offsetState.idx += paddedLen;
        return blob;
      };
      osc2.writeBlob = function(data) {
        data = osc2.byteArray(data);
        var len = data.byteLength, paddedLen = len + 3 & ~3, offset = 4, blobLen = paddedLen + offset, arr = new Uint8Array(blobLen), dv = new DataView(arr.buffer);
        osc2.writeInt32(len, dv);
        arr.set(data, offset);
        return arr;
      };
      osc2.readMIDIBytes = function(dv, offsetState) {
        var midi = new Uint8Array(dv.buffer, offsetState.idx, 4);
        offsetState.idx += 4;
        return midi;
      };
      osc2.writeMIDIBytes = function(bytes) {
        bytes = osc2.byteArray(bytes);
        var arr = new Uint8Array(4);
        arr.set(bytes);
        return arr;
      };
      osc2.readColor = function(dv, offsetState) {
        var bytes = new Uint8Array(dv.buffer, offsetState.idx, 4), alpha = bytes[3] / 255;
        offsetState.idx += 4;
        return {
          r: bytes[0],
          g: bytes[1],
          b: bytes[2],
          a: alpha
        };
      };
      osc2.writeColor = function(color) {
        var alpha = Math.round(color.a * 255), arr = new Uint8Array([color.r, color.g, color.b, alpha]);
        return arr;
      };
      osc2.readTrue = function() {
        return true;
      };
      osc2.readFalse = function() {
        return false;
      };
      osc2.readNull = function() {
        return null;
      };
      osc2.readImpulse = function() {
        return 1;
      };
      osc2.readTimeTag = function(dv, offsetState) {
        var secs1900 = osc2.readPrimitive(dv, "getUint32", 4, offsetState), frac = osc2.readPrimitive(dv, "getUint32", 4, offsetState), native = secs1900 === 0 && frac === 1 ? Date.now() : osc2.ntpToJSTime(secs1900, frac);
        return {
          raw: [secs1900, frac],
          native
        };
      };
      osc2.writeTimeTag = function(timeTag) {
        var raw = timeTag.raw ? timeTag.raw : osc2.jsToNTPTime(timeTag.native), arr = new Uint8Array(8), dv = new DataView(arr.buffer);
        osc2.writeInt32(raw[0], dv, 0);
        osc2.writeInt32(raw[1], dv, 4);
        return arr;
      };
      osc2.timeTag = function(secs, now) {
        secs = secs || 0;
        now = now || Date.now();
        var nowSecs = now / 1e3, nowWhole = Math.floor(nowSecs), nowFracs = nowSecs - nowWhole, secsWhole = Math.floor(secs), secsFracs = secs - secsWhole, fracs = nowFracs + secsFracs;
        if (fracs > 1) {
          var fracsWhole = Math.floor(fracs), fracsFracs = fracs - fracsWhole;
          secsWhole += fracsWhole;
          fracs = fracsFracs;
        }
        var ntpSecs = nowWhole + secsWhole + osc2.SECS_70YRS, ntpFracs = Math.round(osc2.TWO_32 * fracs);
        return {
          raw: [ntpSecs, ntpFracs]
        };
      };
      osc2.ntpToJSTime = function(secs1900, frac) {
        var secs1970 = secs1900 - osc2.SECS_70YRS, decimals = frac / osc2.TWO_32, msTime = (secs1970 + decimals) * 1e3;
        return msTime;
      };
      osc2.jsToNTPTime = function(jsTime) {
        var secs = jsTime / 1e3, secsWhole = Math.floor(secs), secsFrac = secs - secsWhole, ntpSecs = secsWhole + osc2.SECS_70YRS, ntpFracs = Math.round(osc2.TWO_32 * secsFrac);
        return [ntpSecs, ntpFracs];
      };
      osc2.readArguments = function(dv, options, offsetState) {
        var typeTagString = osc2.readString(dv, offsetState);
        if (typeTagString.indexOf(",") !== 0) {
          throw new Error("A malformed type tag string was found while reading the arguments of an OSC message. String was: " + typeTagString, " at offset: " + offsetState.idx);
        }
        var argTypes = typeTagString.substring(1).split(""), args = [];
        osc2.readArgumentsIntoArray(args, argTypes, typeTagString, dv, options, offsetState);
        return args;
      };
      osc2.readArgument = function(argType, typeTagString, dv, options, offsetState) {
        var typeSpec = osc2.argumentTypes[argType];
        if (!typeSpec) {
          throw new Error("'" + argType + "' is not a valid OSC type tag. Type tag string was: " + typeTagString);
        }
        var argReader = typeSpec.reader, arg = osc2[argReader](dv, offsetState);
        if (options.metadata) {
          arg = {
            type: argType,
            value: arg
          };
        }
        return arg;
      };
      osc2.readArgumentsIntoArray = function(arr, argTypes, typeTagString, dv, options, offsetState) {
        var i = 0;
        while (i < argTypes.length) {
          var argType = argTypes[i], arg;
          if (argType === "[") {
            var fromArrayOpen = argTypes.slice(i + 1), endArrayIdx = fromArrayOpen.indexOf("]");
            if (endArrayIdx < 0) {
              throw new Error("Invalid argument type tag: an open array type tag ('[') was found without a matching close array tag ('[]'). Type tag was: " + typeTagString);
            }
            var typesInArray = fromArrayOpen.slice(0, endArrayIdx);
            arg = osc2.readArgumentsIntoArray([], typesInArray, typeTagString, dv, options, offsetState);
            i += endArrayIdx + 2;
          } else {
            arg = osc2.readArgument(argType, typeTagString, dv, options, offsetState);
            i++;
          }
          arr.push(arg);
        }
        return arr;
      };
      osc2.writeArguments = function(args, options) {
        var argCollection = osc2.collectArguments(args, options);
        return osc2.joinParts(argCollection);
      };
      osc2.joinParts = function(dataCollection) {
        var buf = new Uint8Array(dataCollection.byteLength), parts = dataCollection.parts, offset = 0;
        for (var i = 0; i < parts.length; i++) {
          var part = parts[i];
          osc2.copyByteArray(part, buf, offset);
          offset += part.length;
        }
        return buf;
      };
      osc2.addDataPart = function(dataPart, dataCollection) {
        dataCollection.parts.push(dataPart);
        dataCollection.byteLength += dataPart.length;
      };
      osc2.writeArrayArguments = function(args, dataCollection) {
        var typeTag = "[";
        for (var i = 0; i < args.length; i++) {
          var arg = args[i];
          typeTag += osc2.writeArgument(arg, dataCollection);
        }
        typeTag += "]";
        return typeTag;
      };
      osc2.writeArgument = function(arg, dataCollection) {
        if (osc2.isArray(arg)) {
          return osc2.writeArrayArguments(arg, dataCollection);
        }
        var type = arg.type, writer = osc2.argumentTypes[type].writer;
        if (writer) {
          var data = osc2[writer](arg.value);
          osc2.addDataPart(data, dataCollection);
        }
        return arg.type;
      };
      osc2.collectArguments = function(args, options, dataCollection) {
        if (!osc2.isArray(args)) {
          args = typeof args === "undefined" ? [] : [args];
        }
        dataCollection = dataCollection || {
          byteLength: 0,
          parts: []
        };
        if (!options.metadata) {
          args = osc2.annotateArguments(args);
        }
        var typeTagString = ",", currPartIdx = dataCollection.parts.length;
        for (var i = 0; i < args.length; i++) {
          var arg = args[i];
          typeTagString += osc2.writeArgument(arg, dataCollection);
        }
        var typeData = osc2.writeString(typeTagString);
        dataCollection.byteLength += typeData.byteLength;
        dataCollection.parts.splice(currPartIdx, 0, typeData);
        return dataCollection;
      };
      osc2.readMessage = function(data, options, offsetState) {
        options = options || osc2.defaults;
        var dv = osc2.dataView(data, data.byteOffset, data.byteLength);
        offsetState = offsetState || {
          idx: 0
        };
        var address = osc2.readString(dv, offsetState);
        return osc2.readMessageContents(address, dv, options, offsetState);
      };
      osc2.readMessageContents = function(address, dv, options, offsetState) {
        if (address.indexOf("/") !== 0) {
          throw new Error("A malformed OSC address was found while reading an OSC message. String was: " + address);
        }
        var args = osc2.readArguments(dv, options, offsetState);
        return {
          address,
          args: args.length === 1 && options.unpackSingleArgs ? args[0] : args
        };
      };
      osc2.collectMessageParts = function(msg, options, dataCollection) {
        dataCollection = dataCollection || {
          byteLength: 0,
          parts: []
        };
        osc2.addDataPart(osc2.writeString(msg.address), dataCollection);
        return osc2.collectArguments(msg.args, options, dataCollection);
      };
      osc2.writeMessage = function(msg, options) {
        options = options || osc2.defaults;
        if (!osc2.isValidMessage(msg)) {
          throw new Error("An OSC message must contain a valid address. Message was: " + JSON.stringify(msg, null, 2));
        }
        var msgCollection = osc2.collectMessageParts(msg, options);
        return osc2.joinParts(msgCollection);
      };
      osc2.isValidMessage = function(msg) {
        return msg.address && msg.address.indexOf("/") === 0;
      };
      osc2.readBundle = function(dv, options, offsetState) {
        return osc2.readPacket(dv, options, offsetState);
      };
      osc2.collectBundlePackets = function(bundle, options, dataCollection) {
        dataCollection = dataCollection || {
          byteLength: 0,
          parts: []
        };
        osc2.addDataPart(osc2.writeString("#bundle"), dataCollection);
        osc2.addDataPart(osc2.writeTimeTag(bundle.timeTag), dataCollection);
        for (var i = 0; i < bundle.packets.length; i++) {
          var packet = bundle.packets[i], collector = packet.address ? osc2.collectMessageParts : osc2.collectBundlePackets, packetCollection = collector(packet, options);
          dataCollection.byteLength += packetCollection.byteLength;
          osc2.addDataPart(osc2.writeInt32(packetCollection.byteLength), dataCollection);
          dataCollection.parts = dataCollection.parts.concat(packetCollection.parts);
        }
        return dataCollection;
      };
      osc2.writeBundle = function(bundle, options) {
        if (!osc2.isValidBundle(bundle)) {
          throw new Error("An OSC bundle must contain 'timeTag' and 'packets' properties. Bundle was: " + JSON.stringify(bundle, null, 2));
        }
        options = options || osc2.defaults;
        var bundleCollection = osc2.collectBundlePackets(bundle, options);
        return osc2.joinParts(bundleCollection);
      };
      osc2.isValidBundle = function(bundle) {
        return bundle.timeTag !== void 0 && bundle.packets !== void 0;
      };
      osc2.readBundleContents = function(dv, options, offsetState, len) {
        var timeTag = osc2.readTimeTag(dv, offsetState), packets = [];
        while (offsetState.idx < len) {
          var packetSize = osc2.readInt32(dv, offsetState), packetLen = offsetState.idx + packetSize, packet = osc2.readPacket(dv, options, offsetState, packetLen);
          packets.push(packet);
        }
        return {
          timeTag,
          packets
        };
      };
      osc2.readPacket = function(data, options, offsetState, len) {
        var dv = osc2.dataView(data, data.byteOffset, data.byteLength);
        len = len === void 0 ? dv.byteLength : len;
        offsetState = offsetState || {
          idx: 0
        };
        var header = osc2.readString(dv, offsetState), firstChar = header[0];
        if (firstChar === "#") {
          return osc2.readBundleContents(dv, options, offsetState, len);
        } else if (firstChar === "/") {
          return osc2.readMessageContents(header, dv, options, offsetState);
        }
        throw new Error("The header of an OSC packet didn't contain an OSC address or a #bundle string. Header was: " + header);
      };
      osc2.writePacket = function(packet, options) {
        if (osc2.isValidMessage(packet)) {
          return osc2.writeMessage(packet, options);
        } else if (osc2.isValidBundle(packet)) {
          return osc2.writeBundle(packet, options);
        } else {
          throw new Error("The specified packet was not recognized as a valid OSC message or bundle. Packet was: " + JSON.stringify(packet, null, 2));
        }
      };
      osc2.argumentTypes = {
        i: {
          reader: "readInt32",
          writer: "writeInt32"
        },
        h: {
          reader: "readInt64",
          writer: "writeInt64"
        },
        f: {
          reader: "readFloat32",
          writer: "writeFloat32"
        },
        s: {
          reader: "readString",
          writer: "writeString"
        },
        S: {
          reader: "readString",
          writer: "writeString"
        },
        b: {
          reader: "readBlob",
          writer: "writeBlob"
        },
        t: {
          reader: "readTimeTag",
          writer: "writeTimeTag"
        },
        T: {
          reader: "readTrue"
        },
        F: {
          reader: "readFalse"
        },
        N: {
          reader: "readNull"
        },
        I: {
          reader: "readImpulse"
        },
        d: {
          reader: "readFloat64",
          writer: "writeFloat64"
        },
        c: {
          reader: "readChar32",
          writer: "writeChar32"
        },
        r: {
          reader: "readColor",
          writer: "writeColor"
        },
        m: {
          reader: "readMIDIBytes",
          writer: "writeMIDIBytes"
        }
        // [] are special cased within read/writeArguments()
      };
      osc2.inferTypeForArgument = function(arg) {
        var type = typeof arg;
        switch (type) {
          case "boolean":
            return arg ? "T" : "F";
          case "string":
            return "s";
          case "number":
            return "f";
          case "undefined":
            return "N";
          case "object":
            if (arg === null) {
              return "N";
            } else if (arg instanceof Uint8Array || arg instanceof ArrayBuffer) {
              return "b";
            } else if (typeof arg.high === "number" && typeof arg.low === "number") {
              return "h";
            }
            break;
        }
        throw new Error("Can't infer OSC argument type for value: " + JSON.stringify(arg, null, 2));
      };
      osc2.annotateArguments = function(args) {
        var annotated = [];
        for (var i = 0; i < args.length; i++) {
          var arg = args[i], msgArg;
          if (typeof arg === "object" && arg.type && arg.value !== void 0) {
            msgArg = arg;
          } else if (osc2.isArray(arg)) {
            msgArg = osc2.annotateArguments(arg);
          } else {
            var oscType = osc2.inferTypeForArgument(arg);
            msgArg = {
              type: oscType,
              value: arg
            };
          }
          annotated.push(msgArg);
        }
        return annotated;
      };
      if (osc2.isCommonJS) {
        module2.exports = osc2;
      }
    })();
  }
});

// apps/max-game/source/stand-output/vendor/slip/src/slip.js
var require_slip = __commonJS({
  "apps/max-game/source/stand-output/vendor/slip/src/slip.js"(exports2) {
    (function(root, factory) {
      "use strict";
      if (typeof exports2 === "object") {
        root.slip = exports2;
        factory(exports2);
      } else if (typeof define === "function" && define.amd) {
        define(["exports"], function(exports3) {
          root.slip = exports3;
          return root.slip, factory(exports3);
        });
      } else {
        root.slip = {};
        factory(root.slip);
      }
    })(exports2, function(exports3) {
      "use strict";
      var slip = exports3;
      slip.END = 192;
      slip.ESC = 219;
      slip.ESC_END = 220;
      slip.ESC_ESC = 221;
      slip.byteArray = function(data, offset, length) {
        return data instanceof ArrayBuffer ? new Uint8Array(data, offset, length) : data;
      };
      slip.expandByteArray = function(arr) {
        var expanded = new Uint8Array(arr.length * 2);
        expanded.set(arr);
        return expanded;
      };
      slip.sliceByteArray = function(arr, start, end) {
        var sliced = arr.buffer.slice ? arr.buffer.slice(start, end) : arr.subarray(start, end);
        return new Uint8Array(sliced);
      };
      slip.encode = function(data, o) {
        o = o || {};
        o.bufferPadding = o.bufferPadding || 4;
        data = slip.byteArray(data, o.offset, o.byteLength);
        var bufLen = data.length + o.bufferPadding + 3 & ~3, encoded = new Uint8Array(bufLen), j = 1;
        encoded[0] = slip.END;
        for (var i = 0; i < data.length; i++) {
          if (j > encoded.length - 3) {
            encoded = slip.expandByteArray(encoded);
          }
          var val = data[i];
          if (val === slip.END) {
            encoded[j++] = slip.ESC;
            val = slip.ESC_END;
          } else if (val === slip.ESC) {
            encoded[j++] = slip.ESC;
            val = slip.ESC_ESC;
          }
          encoded[j++] = val;
        }
        encoded[j] = slip.END;
        return slip.sliceByteArray(encoded, 0, j + 1);
      };
      slip.Decoder = function(o) {
        o = typeof o !== "function" ? o || {} : {
          onMessage: o
        };
        this.maxMessageSize = o.maxMessageSize || 10485760;
        this.bufferSize = o.bufferSize || 1024;
        this.msgBuffer = new Uint8Array(this.bufferSize);
        this.msgBufferIdx = 0;
        this.onMessage = o.onMessage;
        this.onError = o.onError;
        this.escape = false;
      };
      var p = slip.Decoder.prototype;
      p.decode = function(data) {
        data = slip.byteArray(data);
        var msg;
        for (var i = 0; i < data.length; i++) {
          var val = data[i];
          if (this.escape) {
            if (val === slip.ESC_ESC) {
              val = slip.ESC;
            } else if (val === slip.ESC_END) {
              val = slip.END;
            }
          } else {
            if (val === slip.ESC) {
              this.escape = true;
              continue;
            }
            if (val === slip.END) {
              msg = this.handleEnd();
              continue;
            }
          }
          var more = this.addByte(val);
          if (!more) {
            this.handleMessageMaxError();
          }
        }
        return msg;
      };
      p.handleMessageMaxError = function() {
        if (this.onError) {
          this.onError(
            this.msgBuffer.subarray(0),
            "The message is too large; the maximum message size is " + this.maxMessageSize / 1024 + "KB. Use a larger maxMessageSize if necessary."
          );
        }
        this.msgBufferIdx = 0;
        this.escape = false;
      };
      p.addByte = function(val) {
        if (this.msgBufferIdx > this.msgBuffer.length - 1) {
          this.msgBuffer = slip.expandByteArray(this.msgBuffer);
        }
        this.msgBuffer[this.msgBufferIdx++] = val;
        this.escape = false;
        return this.msgBuffer.length < this.maxMessageSize;
      };
      p.handleEnd = function() {
        if (this.msgBufferIdx === 0) {
          return;
        }
        var msg = slip.sliceByteArray(this.msgBuffer, 0, this.msgBufferIdx);
        if (this.onMessage) {
          this.onMessage(msg);
        }
        this.msgBufferIdx = 0;
        return msg;
      };
      return slip;
    });
  }
});

// apps/max-game/source/stand-output/vendor/osc/src/osc-transports.js
var require_osc_transports = __commonJS({
  "apps/max-game/source/stand-output/vendor/osc/src/osc-transports.js"(exports2, module2) {
    var osc2 = osc2 || require_osc();
    var slip = slip || require_slip();
    var EventEmitter = EventEmitter || require("events").EventEmitter;
    (function() {
      "use strict";
      osc2.supportsSerial = false;
      osc2.firePacketEvents = function(port, packet, timeTag, packetInfo) {
        if (packet.address) {
          port.emit("message", packet, timeTag, packetInfo);
        } else {
          osc2.fireBundleEvents(port, packet, timeTag, packetInfo);
        }
      };
      osc2.fireBundleEvents = function(port, bundle, timeTag, packetInfo) {
        port.emit("bundle", bundle, timeTag, packetInfo);
        for (var i = 0; i < bundle.packets.length; i++) {
          var packet = bundle.packets[i];
          osc2.firePacketEvents(port, packet, bundle.timeTag, packetInfo);
        }
      };
      osc2.fireClosedPortSendError = function(port, msg) {
        msg = msg || "Can't send packets on a closed osc.Port object. Please open (or reopen) this Port by calling open().";
        port.emit("error", msg);
      };
      osc2.Port = function(options) {
        this.options = options || {};
        this.on("data", this.decodeOSC.bind(this));
      };
      var p = osc2.Port.prototype = Object.create(EventEmitter.prototype);
      p.constructor = osc2.Port;
      p.send = function(oscPacket) {
        var args = Array.prototype.slice.call(arguments), encoded = this.encodeOSC(oscPacket), buf = osc2.nativeBuffer(encoded);
        args[0] = buf;
        this.sendRaw.apply(this, args);
      };
      p.encodeOSC = function(packet) {
        packet = packet.buffer ? packet.buffer : packet;
        var encoded;
        try {
          encoded = osc2.writePacket(packet, this.options);
        } catch (err) {
          this.emit("error", err);
        }
        return encoded;
      };
      p.decodeOSC = function(data, packetInfo) {
        data = osc2.byteArray(data);
        this.emit("raw", data, packetInfo);
        try {
          var packet = osc2.readPacket(data, this.options);
          this.emit("osc", packet, packetInfo);
          osc2.firePacketEvents(this, packet, void 0, packetInfo);
        } catch (err) {
          this.emit("error", err);
        }
      };
      osc2.SLIPPort = function(options) {
        var that = this;
        var o = this.options = options || {};
        o.useSLIP = o.useSLIP === void 0 ? true : o.useSLIP;
        this.decoder = new slip.Decoder({
          onMessage: this.decodeOSC.bind(this),
          onError: function(err) {
            that.emit("error", err);
          }
        });
        var decodeHandler = o.useSLIP ? this.decodeSLIPData : this.decodeOSC;
        this.on("data", decodeHandler.bind(this));
      };
      p = osc2.SLIPPort.prototype = Object.create(osc2.Port.prototype);
      p.constructor = osc2.SLIPPort;
      p.encodeOSC = function(packet) {
        packet = packet.buffer ? packet.buffer : packet;
        var framed;
        try {
          var encoded = osc2.writePacket(packet, this.options);
          framed = slip.encode(encoded);
        } catch (err) {
          this.emit("error", err);
        }
        return framed;
      };
      p.decodeSLIPData = function(data, packetInfo) {
        this.decoder.decode(data, packetInfo);
      };
      osc2.relay = function(from, to, eventName, sendFnName, transformFn, sendArgs) {
        eventName = eventName || "message";
        sendFnName = sendFnName || "send";
        transformFn = transformFn || function() {
        };
        sendArgs = sendArgs ? [null].concat(sendArgs) : [];
        var listener = function(data) {
          sendArgs[0] = data;
          data = transformFn(data);
          to[sendFnName].apply(to, sendArgs);
        };
        from.on(eventName, listener);
        return {
          eventName,
          listener
        };
      };
      osc2.relayPorts = function(from, to, o) {
        var eventName = o.raw ? "raw" : "osc", sendFnName = o.raw ? "sendRaw" : "send";
        return osc2.relay(from, to, eventName, sendFnName, o.transform);
      };
      osc2.stopRelaying = function(from, relaySpec) {
        from.removeListener(relaySpec.eventName, relaySpec.listener);
      };
      osc2.Relay = function(port1, port2, options) {
        var o = this.options = options || {};
        o.raw = false;
        this.port1 = port1;
        this.port2 = port2;
        this.listen();
      };
      p = osc2.Relay.prototype = Object.create(EventEmitter.prototype);
      p.constructor = osc2.Relay;
      p.open = function() {
        this.port1.open();
        this.port2.open();
      };
      p.listen = function() {
        if (this.port1Spec && this.port2Spec) {
          this.close();
        }
        this.port1Spec = osc2.relayPorts(this.port1, this.port2, this.options);
        this.port2Spec = osc2.relayPorts(this.port2, this.port1, this.options);
        var closeListener = this.close.bind(this);
        this.port1.on("close", closeListener);
        this.port2.on("close", closeListener);
      };
      p.close = function() {
        osc2.stopRelaying(this.port1, this.port1Spec);
        osc2.stopRelaying(this.port2, this.port2Spec);
        this.emit("close", this.port1, this.port2);
      };
      if (typeof module2 !== "undefined" && module2.exports) {
        module2.exports = osc2;
      }
    })();
  }
});

// apps/max-game/source/stand-output/vendor/osc/src/platforms/osc-websocket-client.js
var require_osc_websocket_client = __commonJS({
  "apps/max-game/source/stand-output/vendor/osc/src/platforms/osc-websocket-client.js"() {
    var osc2 = osc2 || require_osc();
    (function() {
      "use strict";
      osc2.WebSocket = typeof WebSocket !== "undefined" ? WebSocket : require_ws();
      osc2.WebSocketPort = function(options) {
        osc2.Port.call(this, options);
        this.on("open", this.listen.bind(this));
        this.socket = options.socket;
        if (this.socket) {
          if (this.socket.readyState === 1) {
            osc2.WebSocketPort.setupSocketForBinary(this.socket);
            this.emit("open", this.socket);
          } else {
            this.open();
          }
        }
      };
      var p = osc2.WebSocketPort.prototype = Object.create(osc2.Port.prototype);
      p.constructor = osc2.WebSocketPort;
      p.open = function() {
        if (!this.socket || this.socket.readyState > 1) {
          this.socket = new osc2.WebSocket(this.options.url);
        }
        osc2.WebSocketPort.setupSocketForBinary(this.socket);
        var that = this;
        this.socket.onopen = function() {
          that.emit("open", that.socket);
        };
        this.socket.onerror = function(err) {
          that.emit("error", err);
        };
      };
      p.listen = function() {
        var that = this;
        this.socket.onmessage = function(e) {
          that.emit("data", e.data, e);
        };
        this.socket.onclose = function(e) {
          that.emit("close", e);
        };
        that.emit("ready");
      };
      p.sendRaw = function(encoded) {
        if (!this.socket || this.socket.readyState !== 1) {
          osc2.fireClosedPortSendError(this);
          return;
        }
        this.socket.send(encoded);
      };
      p.close = function(code, reason) {
        this.socket.close(code, reason);
      };
      osc2.WebSocketPort.setupSocketForBinary = function(socket) {
        socket.binaryType = osc2.isNode ? "nodebuffer" : "arraybuffer";
      };
    })();
  }
});

// apps/max-game/source/stand-output/vendor/osc/src/platforms/osc-node-serialport.js
var require_osc_node_serialport = __commonJS({
  "apps/max-game/source/stand-output/vendor/osc/src/platforms/osc-node-serialport.js"() {
    var osc2 = osc2 || require_osc();
    var SerialPort = require("serialport").SerialPort;
    osc2.supportsSerial = true;
    osc2.SerialPort = function(options) {
      this.on("open", this.listen.bind(this));
      osc2.SLIPPort.call(this, options);
      this.options.bitrate = this.options.bitrate || 9600;
      this.serialPort = options.serialPort;
      if (this.serialPort) {
        this.emit("open", this.serialPort);
      }
    };
    var p = osc2.SerialPort.prototype = Object.create(osc2.SLIPPort.prototype);
    p.constructor = osc2.SerialPort;
    p.open = function() {
      if (this.serialPort) {
        this.once("close", this.open.bind(this));
        this.close();
        return;
      }
      var that = this;
      this.serialPort = new SerialPort({
        path: this.options.devicePath,
        baudRate: this.options.bitrate,
        autoOpen: false
      });
      this.serialPort.on("error", function(err) {
        that.emit("error", err);
      });
      this.serialPort.on("open", function() {
        that.emit("open", that.serialPort);
      });
      this.serialPort.open();
    };
    p.listen = function() {
      var that = this;
      this.serialPort.on("data", function(data) {
        that.emit("data", data, void 0);
      });
      this.serialPort.on("close", function() {
        that.emit("close");
      });
      that.emit("ready");
    };
    p.sendRaw = function(encoded) {
      if (!this.serialPort || !this.serialPort.isOpen) {
        osc2.fireClosedPortSendError(this);
        return;
      }
      var that = this;
      this.serialPort.write(encoded);
    };
    p.close = function() {
      if (this.serialPort) {
        this.serialPort.close();
      }
    };
  }
});

// apps/max-game/source/stand-output/vendor/osc/src/platforms/osc-node-serialport-loader.js
var require_osc_node_serialport_loader = __commonJS({
  "apps/max-game/source/stand-output/vendor/osc/src/platforms/osc-node-serialport-loader.js"() {
    var osc2 = osc2 || require_osc();
    try {
      SerialPort = require("serialport");
      require_osc_node_serialport();
    } catch (err) {
      osc2.SerialPort = function() {
        throw new Error("The Node.js SerialPort library is not installed. osc.js' serial transport is unavailable.");
      };
    }
    var SerialPort;
  }
});

// apps/max-game/source/stand-output/vendor/osc/src/platforms/osc-node.js
var require_osc_node = __commonJS({
  "apps/max-game/source/stand-output/vendor/osc/src/platforms/osc-node.js"(exports2, module2) {
    (function() {
      "use strict";
      var shallowMerge = function(target, toMerge) {
        target = target || {};
        if (toMerge.forEach === void 0) {
          toMerge = [toMerge];
        }
        toMerge.forEach(function(obj) {
          for (var prop in obj) {
            target[prop] = obj[prop];
          }
        });
        return target;
      };
      var dgram = require("dgram"), net = require("net"), WebSocket2 = require_ws(), modules = [
        require_osc(),
        require_osc_transports(),
        require_osc_websocket_client(),
        require_osc_node_serialport_loader()
      ], osc2 = shallowMerge({}, modules);
      osc2.UDPPort = function(options) {
        osc2.Port.call(this, options);
        this.options.localAddress = this.options.localAddress || "127.0.0.1";
        this.options.localPort = this.options.localPort !== void 0 ? this.options.localPort : 57121;
        this.options.remoteAddress = this.options.remoteAddress || "127.0.0.1";
        this.options.remotePort = this.options.remotePort !== void 0 ? this.options.remotePort : 57121;
        this.on("open", this.listen.bind(this));
        this.socket = options.socket;
        if (this.socket) {
          this.emit("open", this.socket);
        }
      };
      var p = osc2.UDPPort.prototype = Object.create(osc2.Port.prototype);
      p.constructor = osc2.UDPPort;
      p.open = function() {
        var that = this;
        if (this.socket) {
          return;
        }
        this.socket = dgram.createSocket("udp4");
        this.socket.on("error", function(error) {
          that.emit("error", error);
        });
        function onBound() {
          osc2.UDPPort.setupMulticast(that);
          if (that.options.broadcast) {
            that.socket.setBroadcast(that.options.broadcast);
          }
          that.emit("open", that.socket);
        }
        this.socket.bind(this.options.localPort, this.options.localAddress, onBound);
      };
      p.listen = function() {
        if (!this.socket) {
          return;
        }
        var that = this;
        this.socket.on("message", function(msg, rinfo) {
          that.emit("data", msg, rinfo);
        });
        this.socket.on("close", function() {
          that.emit("close");
        });
        that.emit("ready");
      };
      p.sendRaw = function(encoded, address, port) {
        if (!this.socket) {
          osc2.fireClosedPortSendError(this);
          return;
        }
        var length = encoded.byteLength !== void 0 ? encoded.byteLength : encoded.length, that = this;
        address = address || this.options.remoteAddress;
        port = port !== void 0 ? port : this.options.remotePort;
        this.socket.send(encoded, 0, length, port, address, function(err) {
          if (err) {
            that.emit("error", err);
          }
        });
      };
      p.close = function() {
        if (this.socket) {
          this.socket.close();
        }
      };
      osc2.UDPPort.setupMulticast = function(that) {
        if (that.options.multicastTTL !== void 0) {
          that.socket.setMulticastTTL(that.options.multicastTTL);
        }
        if (that.options.multicastMembership) {
          if (typeof that.options.multicastMembership === "string") {
            that.options.multicastMembership = [that.options.multicastMembership];
          }
          that.options.multicastMembership.forEach(function(addr) {
            if (typeof addr === "string") {
              that.socket.addMembership(addr);
            } else {
              that.socket.addMembership(addr.address, addr.interface);
            }
          });
        }
      };
      osc2.TCPSocketPort = function(options) {
        osc2.SLIPPort.call(this, options);
        var o = this.options;
        o.address = o.address || o.localAddress || "127.0.0.1";
        o.port = o.port !== void 0 ? o.port : o.localPort !== void 0 ? o.localPort : 57121;
        this.on("open", this.listen.bind(this));
        this.socket = options.socket;
        if (this.socket) {
          this.emit("open", this.socket);
        }
      };
      p = osc2.TCPSocketPort.prototype = Object.create(osc2.SLIPPort.prototype);
      p.constructor = osc2.TCPSocketPort;
      p.open = function(address, port) {
        var o = this.options;
        address = address || o.address;
        port = port !== void 0 ? port : o.port;
        if (!this.socket) {
          this.socket = net.connect({
            port,
            host: address
          });
        } else {
          this.socket.connect(port, address);
        }
        this.emit("open", this.socket);
      };
      p.listen = function() {
        var that = this;
        this.socket.on("data", function(msg) {
          that.emit("data", msg, void 0);
        });
        this.socket.on("error", function(err) {
          that.emit("error", err);
        });
        this.socket.on("close", function(hadError) {
          that.emit("close", hadError);
        });
        this.socket.on("connect", function() {
          that.emit("ready");
        });
      };
      p.sendRaw = function(encoded) {
        if (!this.socket) {
          return;
        }
        encoded = Buffer.from(encoded);
        try {
          this.socket.write(encoded);
        } catch (err) {
          this.emit("error", err);
        }
      };
      p.close = function() {
        this.socket.end();
      };
      module2.exports = osc2;
    })();
  }
});

// apps/max-game/source/stand-output/vendor/perspective-transform/dist/perspective-transform.js
var require_perspective_transform = __commonJS({
  "apps/max-game/source/stand-output/vendor/perspective-transform/dist/perspective-transform.js"(exports2, module2) {
    (function(root) {
      if (root.numeric) {
        return;
      } else {
        var numeric2 = {};
        numeric2.dim = function dim(x) {
          var y, z;
          if (typeof x === "object") {
            y = x[0];
            if (typeof y === "object") {
              z = y[0];
              if (typeof z === "object") {
                return numeric2._dim(x);
              }
              return [x.length, y.length];
            }
            return [x.length];
          }
          return [];
        };
        numeric2._foreach2 = (function _foreach2(x, s, k, f) {
          if (k === s.length - 1) {
            return f(x);
          }
          var i, n = s[k], ret = Array(n);
          for (i = n - 1; i >= 0; i--) {
            ret[i] = _foreach2(x[i], s, k + 1, f);
          }
          return ret;
        });
        numeric2.cloneV = function(x) {
          var _n = x.length;
          var i, ret = Array(_n);
          for (i = _n - 1; i !== -1; --i) {
            ret[i] = x[i];
          }
          return ret;
        };
        numeric2.clone = function(x) {
          if (typeof x !== "object") return x;
          var V = numeric2.cloneV;
          var s = numeric2.dim(x);
          return numeric2._foreach2(x, s, 0, V);
        };
        numeric2.diag = function diag(d) {
          var i, i1, j, n = d.length, A = Array(n), Ai;
          for (i = n - 1; i >= 0; i--) {
            Ai = Array(n);
            i1 = i + 2;
            for (j = n - 1; j >= i1; j -= 2) {
              Ai[j] = 0;
              Ai[j - 1] = 0;
            }
            if (j > i) {
              Ai[j] = 0;
            }
            Ai[i] = d[i];
            for (j = i - 1; j >= 1; j -= 2) {
              Ai[j] = 0;
              Ai[j - 1] = 0;
            }
            if (j === 0) {
              Ai[0] = 0;
            }
            A[i] = Ai;
          }
          return A;
        };
        numeric2.rep = function rep(s, v, k) {
          if (typeof k === "undefined") {
            k = 0;
          }
          var n = s[k], ret = Array(n), i;
          if (k === s.length - 1) {
            for (i = n - 2; i >= 0; i -= 2) {
              ret[i + 1] = v;
              ret[i] = v;
            }
            if (i === -1) {
              ret[0] = v;
            }
            return ret;
          }
          for (i = n - 1; i >= 0; i--) {
            ret[i] = numeric2.rep(s, v, k + 1);
          }
          return ret;
        };
        numeric2.identity = function(n) {
          return numeric2.diag(numeric2.rep([n], 1));
        };
        numeric2.inv = function inv(a) {
          var s = numeric2.dim(a), abs = Math.abs, m = s[0], n = s[1];
          var A = numeric2.clone(a), Ai, Aj;
          var I = numeric2.identity(m), Ii, Ij;
          var i, j, k, x;
          for (j = 0; j < n; ++j) {
            var i0 = -1;
            var v0 = -1;
            for (i = j; i !== m; ++i) {
              k = abs(A[i][j]);
              if (k > v0) {
                i0 = i;
                v0 = k;
              }
            }
            Aj = A[i0];
            A[i0] = A[j];
            A[j] = Aj;
            Ij = I[i0];
            I[i0] = I[j];
            I[j] = Ij;
            x = Aj[j];
            for (k = j; k !== n; ++k) Aj[k] /= x;
            for (k = n - 1; k !== -1; --k) Ij[k] /= x;
            for (i = m - 1; i !== -1; --i) {
              if (i !== j) {
                Ai = A[i];
                Ii = I[i];
                x = Ai[j];
                for (k = j + 1; k !== n; ++k) Ai[k] -= Aj[k] * x;
                for (k = n - 1; k > 0; --k) {
                  Ii[k] -= Ij[k] * x;
                  --k;
                  Ii[k] -= Ij[k] * x;
                }
                if (k === 0) Ii[0] -= Ij[0] * x;
              }
            }
          }
          return I;
        };
        numeric2.dotMMsmall = function dotMMsmall(x, y) {
          var i, j, k, p, q, r, ret, foo, bar, woo, i0;
          p = x.length;
          q = y.length;
          r = y[0].length;
          ret = Array(p);
          for (i = p - 1; i >= 0; i--) {
            foo = Array(r);
            bar = x[i];
            for (k = r - 1; k >= 0; k--) {
              woo = bar[q - 1] * y[q - 1][k];
              for (j = q - 2; j >= 1; j -= 2) {
                i0 = j - 1;
                woo += bar[j] * y[j][k] + bar[i0] * y[i0][k];
              }
              if (j === 0) {
                woo += bar[0] * y[0][k];
              }
              foo[k] = woo;
            }
            ret[i] = foo;
          }
          return ret;
        };
        numeric2.dotMV = function dotMV(x, y) {
          var p = x.length, i;
          var ret = Array(p), dotVV = numeric2.dotVV;
          for (i = p - 1; i >= 0; i--) {
            ret[i] = dotVV(x[i], y);
          }
          return ret;
        };
        numeric2.dotVV = function dotVV(x, y) {
          var i, n = x.length, i1, ret = x[n - 1] * y[n - 1];
          for (i = n - 2; i >= 1; i -= 2) {
            i1 = i - 1;
            ret += x[i] * y[i] + x[i1] * y[i1];
          }
          if (i === 0) {
            ret += x[0] * y[0];
          }
          return ret;
        };
        numeric2.transpose = function transpose(x) {
          var i, j, m = x.length, n = x[0].length, ret = Array(n), A0, A1, Bj;
          for (j = 0; j < n; j++) ret[j] = Array(m);
          for (i = m - 1; i >= 1; i -= 2) {
            A1 = x[i];
            A0 = x[i - 1];
            for (j = n - 1; j >= 1; --j) {
              Bj = ret[j];
              Bj[i] = A1[j];
              Bj[i - 1] = A0[j];
              --j;
              Bj = ret[j];
              Bj[i] = A1[j];
              Bj[i - 1] = A0[j];
            }
            if (j === 0) {
              Bj = ret[0];
              Bj[i] = A1[0];
              Bj[i - 1] = A0[0];
            }
          }
          if (i === 0) {
            A0 = x[0];
            for (j = n - 1; j >= 1; --j) {
              ret[j][0] = A0[j];
              --j;
              ret[j][0] = A0[j];
            }
            if (j === 0) {
              ret[0][0] = A0[0];
            }
          }
          return ret;
        };
        this.numeric = numeric2;
        root.numeric = numeric2;
      }
    })(exports2);
    (function(global, factory) {
      if (typeof exports2 === "object" && typeof module2 !== void 0) {
        module2.exports = factory();
      } else if (typeof define === "function" && define.amd) {
        define(factory);
      } else {
        global.PerspT = factory();
      }
    })(exports2, function() {
      "use strict";
      function round(num) {
        return Math.round(num * 1e10) / 1e10;
      }
      function getNormalizationCoefficients(srcPts, dstPts, isInverse) {
        if (isInverse) {
          var tmp = dstPts;
          dstPts = srcPts;
          srcPts = tmp;
        }
        var r1 = [srcPts[0], srcPts[1], 1, 0, 0, 0, -1 * dstPts[0] * srcPts[0], -1 * dstPts[0] * srcPts[1]];
        var r2 = [0, 0, 0, srcPts[0], srcPts[1], 1, -1 * dstPts[1] * srcPts[0], -1 * dstPts[1] * srcPts[1]];
        var r3 = [srcPts[2], srcPts[3], 1, 0, 0, 0, -1 * dstPts[2] * srcPts[2], -1 * dstPts[2] * srcPts[3]];
        var r4 = [0, 0, 0, srcPts[2], srcPts[3], 1, -1 * dstPts[3] * srcPts[2], -1 * dstPts[3] * srcPts[3]];
        var r5 = [srcPts[4], srcPts[5], 1, 0, 0, 0, -1 * dstPts[4] * srcPts[4], -1 * dstPts[4] * srcPts[5]];
        var r6 = [0, 0, 0, srcPts[4], srcPts[5], 1, -1 * dstPts[5] * srcPts[4], -1 * dstPts[5] * srcPts[5]];
        var r7 = [srcPts[6], srcPts[7], 1, 0, 0, 0, -1 * dstPts[6] * srcPts[6], -1 * dstPts[6] * srcPts[7]];
        var r8 = [0, 0, 0, srcPts[6], srcPts[7], 1, -1 * dstPts[7] * srcPts[6], -1 * dstPts[7] * srcPts[7]];
        var matA = [r1, r2, r3, r4, r5, r6, r7, r8];
        var matB = dstPts;
        var matC;
        try {
          matC = numeric.inv(numeric.dotMMsmall(numeric.transpose(matA), matA));
        } catch (e) {
          console.log(e);
          return [1, 0, 0, 0, 1, 0, 0, 0];
        }
        var matD = numeric.dotMMsmall(matC, numeric.transpose(matA));
        var matX = numeric.dotMV(matD, matB);
        for (var i = 0; i < matX.length; i++) {
          matX[i] = round(matX[i]);
        }
        matX[8] = 1;
        return matX;
      }
      function PerspT2(srcPts, dstPts) {
        if (typeof window !== "undefined" && window === this || this === void 0) {
          return new PerspT2(srcPts, dstPts);
        }
        this.srcPts = srcPts;
        this.dstPts = dstPts;
        this.coeffs = getNormalizationCoefficients(this.srcPts, this.dstPts, false);
        this.coeffsInv = getNormalizationCoefficients(this.srcPts, this.dstPts, true);
        return this;
      }
      PerspT2.prototype = {
        transform: function(x, y) {
          var coordinates = [];
          coordinates[0] = (this.coeffs[0] * x + this.coeffs[1] * y + this.coeffs[2]) / (this.coeffs[6] * x + this.coeffs[7] * y + 1);
          coordinates[1] = (this.coeffs[3] * x + this.coeffs[4] * y + this.coeffs[5]) / (this.coeffs[6] * x + this.coeffs[7] * y + 1);
          return coordinates;
        },
        transformInverse: function(x, y) {
          var coordinates = [];
          coordinates[0] = (this.coeffsInv[0] * x + this.coeffsInv[1] * y + this.coeffsInv[2]) / (this.coeffsInv[6] * x + this.coeffsInv[7] * y + 1);
          coordinates[1] = (this.coeffsInv[3] * x + this.coeffsInv[4] * y + this.coeffsInv[5]) / (this.coeffsInv[6] * x + this.coeffsInv[7] * y + 1);
          return coordinates;
        }
      };
      return PerspT2;
    });
  }
});

// apps/max-game/source/stand-output/lidar.mjs
var lidar_exports = {};
__export(lidar_exports, {
  solveCalibration: () => solveCalibration,
  startLidar: () => startLidar,
  validateLidarConfig: () => validateLidarConfig
});
module.exports = __toCommonJS(lidar_exports);

// apps/max-game/source/stand-output/hokuyo-osc.mjs
var import_osc = __toESM(require_osc_node(), 1);
function createHokuyoReceiver({ port = 9001, address = "0.0.0.0", sourceAddress = "10.0.0.11", now = Date.now, onContact = () => {
}, onDiagnostic = () => {
}, rankPoint = (p) => p.y, selectionSpace = "raw-y", makePort = (options) => new import_osc.default.UDPPort(options), timeoutMs = 350 } = {}) {
  let transport, closed = false, bound = false, lastPacketAt = 0, primary = null, gesture = null, lastPoint = null, sequence = 0, timer, selectedY = null;
  const contacts = /* @__PURE__ */ new Map(), addresses = /* @__PURE__ */ new Set(), quarantine = /* @__PURE__ */ new Set();
  const stats = { packetCount: 0, decodeErrors: 0, rejectedSources: 0, acceptedUpdates: 0, ignoredContacts: 0, selectionChanges: 0 };
  const emit = (id, phase, p) => onContact({ id, phase, sequence: ++sequence, at: now(), ...p });
  function finish(phase) {
    const id = gesture, p = lastPoint;
    primary = null;
    gesture = null;
    lastPoint = null;
    selectedY = null;
    if (id !== null) emit(id, phase, p ?? {});
  }
  const quarantineId = (id) => {
    quarantine.add(id);
    if (quarantine.size > 128) quarantine.delete(quarantine.values().next().value);
  };
  function prune() {
    let changed = false;
    for (const [id, p] of contacts) if (now() - p.seenAt > timeoutMs) {
      contacts.delete(id);
      quarantineId(id);
      changed = true;
    }
    return changed;
  }
  function select(emptyPhase = "up") {
    let best = null, y = Infinity;
    for (const [id, p] of contacts) {
      let rank;
      try {
        rank = rankPoint(p);
      } catch {
        continue;
      }
      if (!Number.isFinite(rank)) continue;
      if (rank < y || rank === y && (id === primary || best !== primary && id < best)) {
        best = id;
        y = rank;
      }
    }
    if (best === null) {
      finish(contacts.size ? "cancel" : emptyPhase);
      return;
    }
    const previous = primary;
    primary = best;
    selectedY = y;
    lastPoint = { ...contacts.get(best), sourceContactId: String(best), selectedY: y };
    if (gesture === null) {
      gesture = String(best);
      emit(gesture, "down", lastPoint);
    } else {
      if (previous !== best) stats.selectionChanges++;
      emit(gesture, "move", lastPoint);
    }
  }
  function message(m) {
    stats.packetCount++;
    if (addresses.size < 16) addresses.add(m.address);
    const args = m.args?.map((a) => a?.value), id = args?.[0];
    if (!Number.isSafeInteger(id) || id < 0 || id > 2147483647) {
      stats.decodeErrors++;
      return false;
    }
    if (m.address === "/delete" && args.length === 1) {
      const changed = contacts.delete(id);
      quarantine.delete(id);
      return changed;
    }
    if (!["/update", "/create"].includes(m.address) || ![3, 5].includes(args?.length) || !args.slice(1).every((v) => typeof v === "number" && Number.isFinite(v) && Math.abs(v) <= 1e4)) {
      stats.decodeErrors++;
      return false;
    }
    if (m.address === "/create") quarantine.delete(id);
    else if (quarantine.has(id)) {
      stats.ignoredContacts++;
      return false;
    }
    if (!contacts.has(id) && contacts.size >= 128) {
      stats.decodeErrors++;
      return false;
    }
    contacts.set(id, { x: args[1], y: args[2], seenAt: lastPacketAt });
    stats.acceptedUpdates++;
    return true;
  }
  function packet(p, info) {
    if (closed) return;
    if (info?.address !== sourceAddress) {
      stats.rejectedSources++;
      return;
    }
    lastPacketAt = now();
    const expired = prune();
    let changed = expired;
    if (expired && !contacts.size) finish("cancel");
    if (closed) return;
    const walk = (m) => {
      if (m.packets) m.packets.forEach(walk);
      else changed = message(m) || changed;
    };
    walk(p);
    if (changed) select(expired ? "cancel" : "up");
  }
  function expire() {
    if (prune()) select("cancel");
  }
  function reset() {
    for (const id of contacts.keys()) quarantineId(id);
    contacts.clear();
    finish("cancel");
  }
  return {
    async start() {
      transport = makePort({ localAddress: address, localPort: port, metadata: true });
      transport.on("osc", packet);
      transport.on("error", (e) => {
        stats.decodeErrors++;
        onDiagnostic("lidar-receiver-error", { code: e?.code ?? "OSC_DECODE_ERROR" });
      });
      transport.on("close", () => {
        bound = false;
        reset();
      });
      await new Promise((resolve, reject) => {
        transport.once("ready", () => {
          bound = true;
          resolve();
        });
        transport.once("error", reject);
        transport.open();
      });
      timer = setInterval(expire, 50);
      timer.unref?.();
      onDiagnostic("lidar-receiver-ready", { port, sourceAddress, selection: "topmost", selectionSpace });
      return this;
    },
    snapshot() {
      return { bound, port, sourceAddress, ...stats, lastPacketAgeMs: lastPacketAt ? Math.max(0, now() - lastPacketAt) : null, addresses: [...addresses], activeContactId: gesture, selectedContactId: primary === null ? null : String(primary), selection: "topmost", selectionSpace, selectedY, contactCount: contacts.size };
    },
    reset,
    close() {
      if (closed) return;
      closed = true;
      clearInterval(timer);
      reset();
      if (!transport) return;
      const wasBound = bound;
      return new Promise((resolve) => {
        transport.once("close", resolve);
        try {
          transport.close();
        } catch {
          resolve();
        }
        if (!wasBound) resolve();
      });
    },
    decodePacket(bytes, info) {
      packet(import_osc.default.readPacket(bytes, { metadata: true }), info);
    },
    expire
  };
}

// apps/max-game/source/stand-output/calibration.mjs
var import_perspective_transform = __toESM(require_perspective_transform(), 1);
var DEFAULT_LOGICAL_SIZE = Object.freeze([4096, 1280]);
var DEFAULT_TARGET_RECT = Object.freeze({ left: 2192.025, top: 614.9918510053234, right: 4096, bottom: 1020.5188384358148 });
var fail = (code) => {
  const error = new Error(code);
  error.code = code;
  throw error;
};
var copy = (value) => structuredClone(value);
var finitePoint = (p) => Array.isArray(p) && p.length === 2 && p.every(Number.isFinite);
function validateQuad(points) {
  if (!Array.isArray(points) || points.length !== 4 || !points.every(finitePoint)) fail("INVALID_QUADRILATERAL");
  const xs = points.map((p) => p[0]), ys = points.map((p) => p[1]), scale = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys));
  if (!(scale > 1e-8) || scale > 1e6) fail("DEGENERATE_QUADRILATERAL");
  let winding = 0;
  for (let i = 0; i < 4; i++) {
    const a = points[i], b = points[(i + 1) % 4], c = points[(i + 2) % 4];
    if (Math.hypot(b[0] - a[0], b[1] - a[1]) < scale * 1e-5) fail("DEGENERATE_QUADRILATERAL");
    const cross = (b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - b[0]);
    if (Math.abs(cross) < scale * scale * 1e-5 || winding && Math.sign(cross) !== winding) fail("NONCONVEX_QUADRILATERAL");
    winding = Math.sign(cross);
  }
  return copy(points);
}
function solveCalibration(rawPoints, targetPoints, logicalSize = DEFAULT_LOGICAL_SIZE) {
  validateQuad(rawPoints);
  validateQuad(targetPoints);
  if (!Array.isArray(logicalSize) || logicalSize.length !== 2 || !logicalSize.every((n) => Number.isFinite(n) && n > 0 && n <= 32768)) fail("INVALID_LOGICAL_SIZE");
  const destination = targetPoints.map(([x, y]) => [x / logicalSize[0], y / logicalSize[1]]), solver = (0, import_perspective_transform.default)(rawPoints.flat(), destination.flat());
  if (solver.coeffs.length !== 9 || !solver.coeffs.every(Number.isFinite) || !solver.coeffsInv.every(Number.isFinite)) fail("INVALID_TRANSFORM");
  const denominators = rawPoints.map(([x, y]) => solver.coeffs[6] * x + solver.coeffs[7] * y + 1);
  if (denominators.some((d) => Math.abs(d) < 1e-8) || denominators.some((d) => Math.sign(d) !== Math.sign(denominators[0]))) fail("PROJECTIVE_POLE");
  const map = (x, y) => {
    if (![x, y].every(Number.isFinite)) fail("INVALID_POINT");
    if (Math.abs(solver.coeffs[6] * x + solver.coeffs[7] * y + 1) < 1e-8) fail("PROJECTIVE_POLE");
    const [xNorm, yNorm] = solver.transform(x, y);
    if (![xNorm, yNorm].every(Number.isFinite)) fail("INVALID_TRANSFORM");
    return { x: xNorm * logicalSize[0], y: yNorm * logicalSize[1], xNorm, yNorm, inside: xNorm >= 0 && xNorm <= 1 && yNorm >= 0 && yNorm <= 1 };
  };
  const cornerErrorPx = Math.max(...rawPoints.map(([x, y], i) => {
    const p = map(x, y);
    return Math.hypot(p.x - targetPoints[i][0], p.y - targetPoints[i][1]);
  }));
  if (cornerErrorPx > 0.5) fail("CORNER_MAPPING_ERROR");
  return { map, coefficients: [...solver.coeffs], cornerErrorPx };
}

// apps/max-game/source/stand-output/lidar.mjs
var import_node_net = require("node:net");
function validateLidarConfig(value) {
  const keys = ["enabled", "bindAddress", "sourceAddress", "port", "timeoutMs", "width", "height", "rawPoints", "targetPoints"];
  if (!value || Object.keys(value).some((k) => !keys.includes(k)) || typeof value.enabled !== "boolean" || !(0, import_node_net.isIP)(value.bindAddress) || !(0, import_node_net.isIP)(value.sourceAddress) || value.sourceAddress === "0.0.0.0" || !Number.isInteger(value.port) || value.port < 1024 || value.port > 65535 || !Number.isFinite(value.timeoutMs) || value.timeoutMs < 100 || value.timeoutMs > 3e3 || value.width !== 3072 || value.height !== 1536) throw Error("\u041F\u0440\u043E\u0432\u0435\u0440\u044C\u0442\u0435 IP, \u043F\u043E\u0440\u0442, watchdog \u0438 \u0440\u0430\u0437\u043C\u0435\u0440 3072\xD71536");
  if (value.rawPoints !== null || value.targetPoints !== null) {
    solveCalibration(value.rawPoints, value.targetPoints, [value.width, value.height]);
    if (value.targetPoints.some(([x, y]) => x < 0 || x > value.width || y < 0 || y > value.height) || value.rawPoints.some((p) => p.some((n) => Math.abs(n) > 1e4))) throw Error("\u0422\u043E\u0447\u043A\u0438 \u0432\u043D\u0435 \u0434\u043E\u043F\u0443\u0441\u0442\u0438\u043C\u043E\u0433\u043E \u0434\u0438\u0430\u043F\u0430\u0437\u043E\u043D\u0430");
  } else if (value.enabled) throw Error("\u0421\u043D\u0430\u0447\u0430\u043B\u0430 \u0432\u044B\u043F\u043E\u043B\u043D\u0438\u0442\u0435 \u043A\u0430\u043B\u0438\u0431\u0440\u043E\u0432\u043A\u0443");
  return structuredClone(value);
}
async function startLidar({ config, contents, active, log, width = 3072, height = 1536, calibrating = false, onPoint = () => {
} }) {
  if (calibrating) {
    validateLidarConfig({ ...config, enabled: false });
    const receiver2 = createHokuyoReceiver({ port: config.port, address: config.bindAddress, sourceAddress: config.sourceAddress, timeoutMs: config.timeoutMs, onContact: onPoint, onDiagnostic: (event, details) => log({ event, ...details }) });
    try {
      await receiver2.start();
    } catch (error) {
      receiver2.close();
      throw error;
    }
    return { snapshot: () => ({ enabled: false, calibrating: true, ...receiver2.snapshot() }), reset: () => receiver2.reset(), close: () => receiver2.close() };
  }
  if (!config?.enabled) return { snapshot: () => ({ enabled: false }), reset() {
  }, close() {
  } };
  if (!config.sourceAddress || !config.bindAddress || !config.rawPoints || !config.targetPoints)
    throw Error("LiDAR requires an explicit source, bind address and measured calibration");
  if (config.width !== width || config.height !== height) throw Error("LiDAR calibration viewport mismatch");
  if (!Number.isFinite(config.timeoutMs) || config.timeoutMs < 100 || config.timeoutMs > 3e3) throw Error("Invalid LiDAR watchdog");
  const mapping = solveCalibration(config.rawPoints, config.targetPoints, [width, height]);
  if (!contents.debugger.isAttached()) contents.debugger.attach("1.3");
  let down = false, closed = false, chain = Promise.resolve(), pendingMove = null, moving = false;
  const send = (type, p) => {
    chain = chain.then(() => contents.debugger.sendCommand("Input.dispatchTouchEvent", {
      type,
      touchPoints: p ? [{ x: p.x, y: p.y, id: 1, radiusX: 2, radiusY: 2, force: 1 }] : []
    })).catch((error) => {
      log({ event: "lidar-input-error", message: error.message });
      throw error;
    });
    chain.catch(() => {
      closed = true;
    });
  };
  const cancel = () => {
    pendingMove = null;
    if (down) {
      down = false;
      send("touchCancel");
    }
  };
  const receiver = createHokuyoReceiver({
    port: config.port ?? 9001,
    address: config.bindAddress,
    sourceAddress: config.sourceAddress,
    timeoutMs: config.timeoutMs,
    rankPoint: (p) => mapping.map(p.x, p.y).y,
    selectionSpace: "calibrated-screen-y",
    onDiagnostic: (event, details) => log({ event, ...details }),
    onContact: (event) => {
      if (closed) return;
      let cursor = null;
      try {
        if (event.phase === "down" || event.phase === "move") cursor = mapping.map(event.x, event.y);
      } catch {
      }
      onPoint({ ...event, mapped: cursor });
      if (!active()) {
        cancel();
        return;
      }
      if (event.phase === "cancel") {
        cancel();
        return;
      }
      if (event.phase === "up") {
        pendingMove = null;
        if (down) {
          down = false;
          send("touchEnd");
        }
        return;
      }
      let p;
      try {
        p = mapping.map(event.x, event.y);
      } catch {
        cancel();
        return;
      }
      if (!p.inside || p.x < 560 || p.x > 2320) {
        cancel();
        return;
      }
      if (event.phase === "down") {
        if (down) cancel();
        down = true;
        send("touchStart", p);
      } else if (down) {
        pendingMove = p;
        if (!moving) {
          moving = true;
          setImmediate(() => {
            moving = false;
            const move = pendingMove;
            pendingMove = null;
            if (move && down && active()) send("touchMove", move);
          });
        }
      }
    }
  });
  await receiver.start();
  return {
    snapshot: () => ({ enabled: true, ...receiver.snapshot(), cornerErrorPx: mapping.cornerErrorPx }),
    reset() {
      cancel();
      receiver.reset();
    },
    async close() {
      cancel();
      await receiver.close();
      await chain.catch(() => {
      });
      closed = true;
    }
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  solveCalibration,
  startLidar,
  validateLidarConfig
});
