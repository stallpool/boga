'use strict';

(function () {
   function isTouchScreen() {
      return 'ontouchend' in document;
   }

   function BogaSampleExtraGame(client, room, dom) {
      this._client = client;
      this._client.bindRoom(room);
      this._room = room;
      this.dom = dom;
      var w = 640, h = 640;
      if (w > window.innerWidth) w = window.innerWidth;
      if (h + 96 > window.innerHeight) h = window.innerHeight - 96;
   
      var canvas = document.createElement('canvas');
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      canvas.width = w;
      canvas.height = h;
      this.w = w; this.h = h;
      this.canvas = canvas;
      this.pen = canvas.getContext('2d');
      this.dom.appendChild(canvas);
      var _this = this;
      requestAnimationFrame(function () {
         _this.paint();
      });

      this.btn = document.createElement('button');
      this.btn.innerHTML = 'Echo!';
      this.btn.style.position = 'fixed';
      this.btn.style.top = (canvas.offsetTop + canvas.offsetHeight/2) + 'px';
      this.btn.style.left = (canvas.offsetLeft + canvas.offsetWidth/2) + 'px';
      this.dom.appendChild(this.btn);

      this.event = {
         click: function (evt) {
            _this.wsSendCommand();
         }
      };
      this.btn.addEventListener('click', this.event.click);
   }
   BogaSampleExtraGame.prototype = {
      dispose: function () {},
      paint: function () {
         this.pen.clearRect(0, 0, this.w, this.h);
   
         this.pen.strokeStyle = 'black';
         this.pen.rect(0, 0, this.w, this.h);
         this.pen.stroke();
      },
      wsProcessMessage: function (obj) {
         var _this = this;
         if (!this._client.isOnline()) {
            this.wsOffline();
            return false;
         }
         if (!obj.sample_extra_game) return false;
         // obj.action, ...
         if (obj.echo) {
            alert('Echo: ' + obj.echo);
         }
         requestAnimationFrame(function () {
            _this.paint();
         });
         return true;
      },
      wsOnline: function () {
         console.log('sync stats remotely and redraw ui ...');
      }, // wsOnline
      wsOffline: function () {
         console.log('disconnect from remote ...');
      }, // wsOffline
      wsSendCommand: function () {
         var _this = this;
         return new Promise(function (r, e) {
            _this._client.request({
               cmd: 'sample_extra_game.echo',
               room: _this._room,
               echo: 'Hello!'
            });
         });
      },
      getName: function () {
         return 'sample_extra_game';
      },
      dispose: function () {
         console.log('sample_extra_game dispose');
         this.btn.removeEventListener('click', this.event.click);
         this.dom.removeChild(this.canvas);
         this.dom.removeChild(this.btn);
      }
   };

   if (!window.boga) window.boga = {};
   if (!window.boga.boardgame) window.boga.boardgame = {};
   window.boga.boardgame['sample_extra_game'] = function () {
      return BogaSampleExtraGame;
   };
   
})();
