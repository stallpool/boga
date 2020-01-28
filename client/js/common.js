'use strict';

var system = {
   hostname: window.location.hostname
};

function dom(selector) {
   return document.querySelector(selector);
}

function generate_id() {
   var timesamp = new Date().getTime();
   var rnd = ~~(Math.random() * 100);
   return timesamp + '-' + rnd;
}

function ajax(options, done_fn, fail_fn) {
   var xhr = new XMLHttpRequest(), payload = null;
   xhr.open(options.method || 'POST', options.url + (options.data ? uriencode(options.data) : ''), true);
   xhr.addEventListener('readystatechange', function (evt) {
      if (evt.target.readyState === 4 /*XMLHttpRequest.DONE*/) {
         if (~~(evt.target.status / 100) === 2) {
            done_fn && done_fn(evt.target.response);
         } else {
            fail_fn && fail_fn(evt.target.status);
         }
      }
   });
   if (options.json) {
      xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
      payload = JSON.stringify(options.json);
   }
   xhr.send(payload);
}

function html(url, done_fn, fail_fn) {
   var xhr = new XMLHttpRequest();
   xhr.open('GET', url, true);
   xhr.addEventListener('readystatechange', function (evt) {
      if (evt.target.readyState === 4 /*XMLHttpRequest.DONE*/) {
         if (~~(evt.target.status / 100) === 2) {
            done_fn && done_fn(evt.target.response || '<!-- empty -->');
         } else {
            fail_fn && fail_fn(evt.target.status);
         }
      }
   });
   xhr.send(null);
}

function wait_for(key, val, fn) {
   if (key && (val in key)) return fn && fn(key, val);
   setTimeout(wait_for, 0, key, val, fn);
}

function get_cookie() {
   var items = document.cookie;
   var r = {};
   if (!items) return r;
   items.split(';').forEach(function (one) {
      var p = one.indexOf('=');
      if (p < 0) r[one.trim()] = null;
      else r[one.substring(0, p).trim()] = one.substring(p + 1).trim();
   });
   return r;
}

function set_cookie(key, value) {
   document.cookie = key + '=' + escape(value) + ';domain=' + system.hostname;
}

function erase_cookie(key) {
   document.cookie = key + '=0;expires=Thu, 01 Jan 1970 00:00:01 GMT';
}

function is_wechat_browser() {
   return /micromessenger/i.test(navigator.userAgent);
}

function reload_on_hashchange() {
   window.addEventListener('hashchange', function () {
      window.location.reload(true);
   });
}

function encode_url_for_login(path) {
   var r = '/login.html#' + path + ':';
   if (window.location.hash) {
      r += window.location.hash.substring(1);
   }
   if (window.location.search) {
      r += window.location.search;
   }
   return r;
}

function remove_elem(elem) {
   elem.parentNode.removeChild(elem);
}

function dispose_component(component) {
   var elem = component.dom;
   remove_elem(elem);
   component.dom = null;
   component.ui = null;
}

function login_and_start(env, before_init, init_app, redirect_url) {
   if (!redirect_url) redirect_url = 'login.html';
   before_init && before_init();
   var cookie = get_cookie();
   env.user = {
      username: cookie.boga_username,
      uuid: cookie.boga_uuid
   };
   if (!env.user.username || !env.user.uuid) {
      window.location = redirect_url;
      return;
   }
   ajax({
      url: '/api/auth/check',
      json: {
         username: env.user.username,
         uuid: env.user.uuid
      }
   }, function () {
      init_app();
   }, function () {
      window.location = redirect_url;
   });
}

// copy from: https://github.com/anonyco/FastestSmallestTextEncoderDecoder/blob/master/EncoderDecoderTogether.src.js
if (!window.TextDecoder) {
   (function (window) {
      "use strict";
      var log = Math.log;
      var LN2 = Math.LN2;
      var clz32 = Math.clz32 || function (x) { return 31 - log(x >>> 0) / LN2 | 0 };
      var fromCharCode = String.fromCharCode;
      var Object_prototype_toString = ({}).toString;
      var NativeSharedArrayBuffer = window["SharedArrayBuffer"];
      var sharedArrayBufferString = NativeSharedArrayBuffer ? Object_prototype_toString.call(NativeSharedArrayBuffer) : "";
      var NativeUint8Array = window.Uint8Array;
      var patchedU8Array = NativeUint8Array || Array;
      var arrayBufferString = Object_prototype_toString.call((NativeUint8Array ? ArrayBuffer : patchedU8Array).prototype);
      function decoderReplacer(encoded) {
         var codePoint = encoded.charCodeAt(0) << 24;
         var leadingOnes = clz32(~codePoint) | 0;
         var endPos = 0, stringLen = encoded.length | 0;
         var result = "";
         if (leadingOnes < 5 && stringLen >= leadingOnes) {
            codePoint = (codePoint << leadingOnes) >>> (24 + leadingOnes);
            for (endPos = 1; endPos < leadingOnes; endPos = endPos + 1 | 0)
               codePoint = (codePoint << 6) | (encoded.charCodeAt(endPos) & 0x3f/*0b00111111*/);
            if (codePoint <= 0xFFFF) { // BMP code point
               result += fromCharCode(codePoint);
            } else if (codePoint <= 0x10FFFF) {
               // https://mathiasbynens.be/notes/javascript-encoding#surrogate-formulae
               codePoint = codePoint - 0x10000 | 0;
               result += fromCharCode(
                  (codePoint >> 10) + 0xD800 | 0,  // highSurrogate
                  (codePoint & 0x3ff) + 0xDC00 | 0 // lowSurrogate
               );
            } else endPos = 0; // to fill it in with INVALIDs
         }
         for (; endPos < stringLen; endPos = endPos + 1 | 0) result += "\ufffd"; // replacement character
         return result;
      }
      function TextDecoder() { };
      TextDecoder["prototype"]["decode"] = function (inputArrayOrBuffer) {
         var buffer = (inputArrayOrBuffer && inputArrayOrBuffer.buffer) || inputArrayOrBuffer;
         var asObjectString = Object_prototype_toString.call(buffer);
         if (asObjectString !== arrayBufferString && asObjectString !== sharedArrayBufferString)
            throw Error("Failed to execute 'decode' on 'TextDecoder': The provided value is not of type '(ArrayBuffer or ArrayBufferView)'");
         var inputAs8 = NativeUint8Array ? new patchedU8Array(buffer) : buffer;
         var resultingString = "";
         for (var index = 0, len = inputAs8.length | 0; index < len; index = index + 32768 | 0)
            resultingString += fromCharCode.apply(0, inputAs8[NativeUint8Array ? "subarray" : "slice"](index, index + 32768 | 0));
         return resultingString.replace(/[\xc0-\xff][\x80-\xbf]*/g, decoderReplacer);
      }
      if (!window["TextDecoder"]) window["TextDecoder"] = TextDecoder;
   })(window);
}
if (!window.TextEncoder) {
   (function (window) {
      "use strict";
      //////////////////////////////////////////////////////////////////////////////////////
      function encoderReplacer(nonAsciiChars) {
         // make the UTF string into a binary UTF-8 encoded string
         var point = nonAsciiChars.charCodeAt(0) | 0;
         if (point >= 0xD800 && point <= 0xDBFF) {
            var nextcode = nonAsciiChars.charCodeAt(1) | 0;
            if (nextcode !== nextcode) // NaN because string is 1 code point long
               return fromCharCode(0xef/*11101111*/, 0xbf/*10111111*/, 0xbd/*10111101*/);
            // https://mathiasbynens.be/notes/javascript-encoding#surrogate-formulae
            if (nextcode >= 0xDC00 && nextcode <= 0xDFFF) {
               point = ((point - 0xD800) << 10) + nextcode - 0xDC00 + 0x10000 | 0;
               if (point > 0xffff)
                  return fromCharCode(
                     (0x1e/*0b11110*/ << 3) | (point >>> 18),
                     (0x2/*0b10*/ << 6) | ((point >>> 12) & 0x3f/*0b00111111*/),
                     (0x2/*0b10*/ << 6) | ((point >>> 6) & 0x3f/*0b00111111*/),
                     (0x2/*0b10*/ << 6) | (point & 0x3f/*0b00111111*/)
                  );
            } else return fromCharCode(0xef, 0xbf, 0xbd);
         }
         if (point <= 0x007f) return nonAsciiChars;
         else if (point <= 0x07ff) {
            return fromCharCode((0x6 << 5) | (point >>> 6), (0x2 << 6) | (point & 0x3f));
         } else return fromCharCode(
            (0xe/*0b1110*/ << 4) | (point >>> 12),
            (0x2/*0b10*/ << 6) | ((point >>> 6) & 0x3f/*0b00111111*/),
            (0x2/*0b10*/ << 6) | (point & 0x3f/*0b00111111*/)
         );
      }
      function TextEncoder() { };
      TextEncoder["prototype"]["encode"] = function (inputString) {
         // 0xc0 => 0b11000000; 0xff => 0b11111111; 0xc0-0xff => 0b11xxxxxx
         // 0x80 => 0b10000000; 0xbf => 0b10111111; 0x80-0xbf => 0b10xxxxxx
         var encodedString = inputString === void 0 ? "" : ("" + inputString).replace(/[\x80-\uD7ff\uDC00-\uFFFF]|[\uD800-\uDBFF][\uDC00-\uDFFF]?/g, encoderReplacer);
         var len = encodedString.length | 0, result = new patchedU8Array(len);
         for (var i = 0; i < len; i = i + 1 | 0)
            result[i] = encodedString.charCodeAt(i);
         return result;
      };
      if (!window["TextEncoder"]) window["TextEncoder"] = TextEncoder;
   })(window);
}

if (!String.prototype.endsWith) {
   String.prototype.endsWith = function (str) {
      if (str === '') return true;
      if (!str) return false;
      var i = this.lastIndexOf(str);
      if (i < 0) return false;
      return i + str.length === this.length;
   }
}

if (!window.Map) {
   window.Map = function () {
      this._keys = [];
      this._values = [];
      this.size = 0;
   }
   window.Map.prototype = {
      get: function (key) {
         var index = this._keys.indexOf(key);
         if (index < 0) return undefined;
         return this._values[index];
      },
      set: function (key, value) {
         var index = this._keys.indexOf(key);
         if (index < 0) {
            this._keys.push(key);
            this._values.push(value);
            this.size = this.keys.length;
         } else {
            this._values[index] = value;
         }
      },
      delete: function (key) {
         var index = this.keys.indexOf(key);
         if (index < 0) return undefined;
         var del = this.values[index];
         this._keys.splice(index, 1);
         this._values.splice(index, 1);
         this.size = this.keys.length;
         return del;
      },
      clear: function () {
         this._keys = [];
         this.values = [];
         this.size = 0;
      },
      keys: function () {
         return this._keys;
      },
      values: function () {
         return this._values;
      },
      entries: function () {
         var _this = this;
         return this._keys.map(function (key, i) {
            return [key, _this._values[i]];
         });
      },
      has: function (key) {
         return this._keys.indexOf(key) >= 0;
      },
      forEach: function (fn, thisArg) {
         for (var i = 0, n = this.size; i < n; i++) {
            var key = this._keys[i];
            var val = this._values[i];
            fn && fn.call(thisArg, val, key, this);
         }
      }
   };
}

if (!Object.assign) {
   Object.assign = function () {
      var a = arguments[0];
      if (!a) return a;
      for (var i = 1, n = arguments.length; i < n; i++) {
         var x = arguments[i];
         if (!x) continue;
         for (var key in x) {
            a[key] = x[key];
         }
      }
      return a;
   };
}
