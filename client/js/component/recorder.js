'use strict';

(function () {

function BogaRecorder() {
   this._timeslice = 1000;
   this._sliceId = 0;
   this._recorder = null;
   this._stream = null;
   this._onDataAvailable = [];
}
BogaRecorder.prototype = {
   _buildProcessor: function (self) {
      if (!self) self = this;
      if (!self._stream) return;
      self._recorder = new window.MediaRecorder(self._stream);
      self._recorder.addEventListener('dataavailable', dataavailable);
      self._recorder.start(self._timeslice);

      function dataavailable(evt) {
         if (!self._recorder) return;
         if (self._recorder.state !== 'recording') return;
         self._recorder.removeEventListener('dataavailable', dataavailable);
         self._recorder.stop();
         self._recorder = null;
         self._onDataAvailable.forEach(function (fn) {
            fn && fn({ id: self._sliceId, data: evt.data});
         });
         self._sliceId ++;
         self._buildProcessor(self);
      }
   },
   start: function () {
      var _this = this;
      window.navigator.mediaDevices.getUserMedia({
         audio: true, video: false
      }).then(function (stream) {
         _this._stream = stream;
         _this._buildProcessor();
      });
   },
   stop: function () {
      if (this._recorder) this._recorder.stop();
      if (this._stream) this._stream.getTracks().forEach(function (track) { track.stop(); });
      this._recorder = null;
      this._stream = null;
      this._sliceId = 0;
   },
   onDataAvailable: function (fn) {
      this._onDataAvailable.indexOf(fn) < 0 && this._onDataAvailable.push(fn);
   },
   dispose: function () {
      this.stop();
   }
};

function BogaPlayer() {
   this._buf = [];
   this._bufLimit = 100;
   this._stopped = false;
   this._busy = false;
   this._context = new window.AudioContext();
}
BogaPlayer.prototype = {
   _positionOf: function (id) {
      var a = 0, b = this._buf.length-1, m = -1;
      while (a <= b) {
         m = ~~((a+b)/2);
         var o = this._buf[m];
         if (o.id === id) return m;
         if (o.id < id) {
            a = m+1;
         } else {
            b = m-1;
         }
      }
      return b;
   },
   push: function (item) {
      // item = { id, data<blobl> }
      if (!this._buf.length) {
         this._buf.push(item);
         return true;
      }
      var index = this._positionOf(item.id);
      if (index < 0) return false;
      this._buf.splice(index+1, 0, item);
      while (this._buf.length > this._bufLimit) this._buf.pop();
   },
   play: function (self) {
      if (!self) self = this;
      if (self._stopped) return;
      if (self._busy) return;
      var item = self._buf[0];
      if (!item) {
         self._buf.shift();
         setTimeout(self.play, 0, self);
         return;
      }
      self._busy = true;
      var src = self._context.createBufferSource();
      var blob = new FileReader();
      blob.addEventListener('loadend', blobLoadEnd);
      blob.readAsArrayBuffer(item.data);

      function blobLoadEnd() {
         var data = blob.result;
         blob.removeEventListener('loadend', blobLoadEnd);
         blob = null;
         self._context.decodeAudioData(data, function (buf) {
            src.buffer = buf;
            src.connect(self._context.destination);
            src.start();
            src.onended = function () {
               src.disconnect(self._context.destination);
               src.onended = null;
               src = null;
               self._busy = false;
               self._buf.shift();
               setTimeout(self.play, 0, self);
            }
         });
      }
   },
   resume: function () {
      this._stopped = false;
      this.play();
   },
   stop: function () {
      this._stopped = true;
   }
};

if (!window.boga) window.boga = {};
if (!window.boga.audio) window.boga.audio = {};
// TODO: check supported
window.boga.audio.Recorder = BogaRecorder;
window.boga.audio.Player = BogaPlayer;

})();