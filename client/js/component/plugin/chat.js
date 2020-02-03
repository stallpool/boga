(function () {

   var system = {
      bundle: null,
      room: location.hash
   };

   function isTouchScreen() {
      return 'ontouchend' in document;
   }

   function to_string(uint) {
      var str = '';
      for (var i = 0, n = uint.length; i < n; i++) {
         str += String.fromCharCode(uint[i]);
      }
      return str;
   }
   function to_uint(str) {
      var n = str.length;
      var arr = new Uint8Array(n);
      for (var i = 0; i < n; i++) {
         arr[i] = str.charCodeAt(i);
      }
      return arr;
   }
   function to_arraybuffer(blob) {
      return new Promise(function (r, e) {
         var reader = new FileReader();
         reader.addEventListener('loadend', onData);
         reader.readAsArrayBuffer(blob);
         reader = null;
   
         function onData (evt) {
            evt.target.removeEventListener('loadend', onData);
            var result = evt.target.result;
            r(result);
         }
      });
   }

   function bogaAudioRecord(recorder) {
      recorder.onDataAvailable(onData);
      recorder.start();

      function onData(item) {
         var pr = item.data.arrayBuffer?item.data.arrayBuffer():to_arraybuffer(item.data);
         pr.then(function (buf) {
            system.bundle.client.request({
               cmd: 'chat.audio',
               room: system.room,
               audio: {
                  id: item.id,
                  data: to_string(new Uint8Array(buf)),
                  type: item.data.type,
                  from: env.user.username
               }
            });
         });
      }
   }

   function BogaChat(id, filename) {
      this.id = id;
      var div = document.createElement('div'), tmp;
      this.dom = {
         self: div,

         fbox: {
            self: document.createElement('div'),
            title: document.createElement('div'),
            fold: document.createElement('button'),
            body: document.createElement('div')
         },

         input: document.createElement('input'),
         talk: document.createElement('div'),

         onlineMark: document.createElement('button'),
         chatSpeaker: document.createElement('button'),
         chatListener: document.createElement('button'),
         chatCall: document.createElement('button'),

         roomSelect: document.createElement('select')
      };
      this.data = {
         filename: filename
      };
      system.bundle.view.appendChild(this.dom.self);

      div.style.width = '100%';
      div.style.height = '100%';
      this.hide();

      var _this = this;
      var status = {
         online: true,
         speak: false,
         listen: false
      };
      this.event = {
         chat: {
            inputEnter: function (evt) {
               if (evt.keyCode !== 13) return;
               if (!_this.dom.input.value) return;
               if (!status.online) return;
               _this.dom.input.classList.add('disabled');
               system.bundle.client.request({
                  cmd: 'chat.send',
                  room: system.room,
                  message: _this.dom.input.value
               }, function (data) {
                  _this.dom.input.classList.remove('disabled');
                  _this.dom.input.value = '';
                  _this.dom.input.focus();
               });
            } // inputEnter
         }, // chat
         chatbox: {
            offsetX: 0,
            offsetY: 0,
            mask: null,
            folded: false,
            foldClick: function (evt) {
               if (_this.event.chatbox.folded) {
                  evt.target.innerHTML = '-';
                  _this.dom.fbox.body.style.display = 'block';
               } else {
                  evt.target.innerHTML = '+';
                  _this.dom.fbox.body.style.display = 'none';
                  _this.dom.fbox.self.style.top = '60px';
               }
               _this.event.chatbox.folded = !_this.event.chatbox.folded;
            },
            titleMouseDown: function (evt) {
               if (evt.target.tagName.toLowerCase() !== 'div') return;
               var mask = document.createElement('div');
               mask.style.position = 'fixed';
               mask.style.width = '100%';
               mask.style.height = '100%';
               mask.style.top = '0px';
               mask.style.left = '0px';
               mask.style.zIndex = 9000;
               if (isTouchScreen()) {
                  document.body.addEventListener('touchmove', _this.event.chatbox.titleTouchMove);
                  document.body.addEventListener('touchend', _this.event.chatbox.titleTouchEnd);
               } else {
                  mask.addEventListener('mousemove', _this.event.chatbox.titleDrag);
                  mask.addEventListener('mouseup', _this.event.chatbox.titleDrop);
               }
               _this.event.chatbox.mask = mask;
               _this.event.chatbox.offsetX = evt.offsetX;
               _this.event.chatbox.offsetY = evt.offsetY;
               _this.dom.self.appendChild(mask);
            },
            titleDrag: function (evt) {
               var fbox = _this.dom.fbox.self;
               fbox.style.top = (evt.offsetY - _this.event.chatbox.offsetY) + 'px';
               fbox.style.left = (evt.offsetX - _this.event.chatbox.offsetX) + 'px';
            },
            titleDrop: function (evt) {
               var mask = _this.event.chatbox.mask;
               _this.event.chatbox.mask = null;
               _this.event.chatbox.offsetX = 0;
               _this.event.chatbox.offsetY = 0;
               if (isTouchScreen()) {
                  document.body.removeEventListener('touchmove', _this.event.chatbox.titleTouchMove);
                  document.body.removeEventListener('touchend', _this.event.chatbox.titleTouchEnd);
               } else {
                  mask.removeEventListener('mousemove', _this.event.chatbox.titleDrag);
                  mask.removeEventListener('mouseup', _this.event.chatbox.titleDrop);
               }
               mask.parentNode.removeChild(mask);
            },
            titleTouchStart: function (evt) {
               var fbox = _this.dom.fbox.self;
               var mevt = {
                  target: evt.target,
                  which: 1,
                  offsetX: evt.touches[0].clientX - fbox.offsetLeft,
                  offsetY: evt.touches[0].clientY - fbox.offsetTop
               };
               _this.event.chatbox.titleMouseDown(mevt);
            },
            titleTouchMove: function (evt) {
               var mevt = {
                  offsetX: evt.touches[0].clientX,
                  offsetY: evt.touches[0].clientY
               };
               _this.event.chatbox.titleDrag(mevt);
            },
            titleTouchEnd: function (evt) {
               _this.event.chatbox.titleDrop();
            }
         }, // chatbox
         room: {
            roomTypeList: [],
            roomTypeMap: {},
            roomChange: function (evt) {
               system.bundle.client.request({
                  cmd: 'chat.boardgame',
                  room: system.room,
                  boardgame: evt.target.value
               }, function (data) {});
            },
            roomSync: function () {
               system.bundle.client.request({
                  cmd: 'chat.boardgame',
                  room: system.room
               }, function (data) {
                  var list = Object.keys(data.list).sort(function (a, b) { return b>a?1:-1; });
                  list.unshift('---');
                  data.boardgame = data.boardgame || '---';
                  _this.event.room.roomTypeList = list;
                  _this.event.room.roomTypeMap = data.list;
                  while (_this.dom.roomSelect.children.length) {
                     _this.dom.roomSelect.removeChild(_this.dom.roomSelect.children[0]);
                  }
                  list.forEach(function (name) {
                     var option = document.createElement('option');
                     option.appendChild(document.createTextNode(name));
                     option.value = name;
                     if (name === data.boardgame) option.selected = true;
                     _this.dom.roomSelect.appendChild(option);
                  });

                  var roomObj = _this.event.room.roomTypeMap[data.boardgame];
                  if (!roomObj) {
                     _this._boardgame && _this._boardgame.dispose &&  _this._boardgame.dispose();
                     _this._boardgame = null;
                     return;
                  }
                  if (_this._boardgame && _this._boardgame.getName() === data.boardgame) return;

                  window.boga.loadScript(roomObj).then(function () {
                     if (!window.boga.boardgame) return;
                     var name = Object.keys(window.boga.boardgame)[0];
                     var klass = window.boga.boardgame[name]();
                     if (_this._boardgame) return;
                     _this._boardgame = new klass(system.bundle.client, system.room, _this.dom.self);
                     if (system.bundle.client.isOnline()) {
                        _this._boardgame.wsOnline();
                     }
                  });
               });
            }
         } // room
      };

      if (!system.room) {
         div.innerHTML = 'No Selected Room';
         return;
      }

      this.dom.fbox.self.style.position = 'fixed';
      this.dom.fbox.self.style.backgroundColor = 'white';
      this.dom.fbox.self.style.width = '240px';
      this.dom.fbox.self.style.top = '100px';
      this.dom.fbox.self.style.left = (window.innerWidth - 245) + 'px';
      this.dom.fbox.self.style.border = '1px solid black';
      this.dom.fbox.self.style.padding = '2px';
      this.dom.fbox.title.style.cursor = 'pointer';
      this.dom.fbox.title.style.marginBottom = '3px';
      this.dom.fbox.fold.style.border = '1px solid black';
      this.dom.fbox.fold.style.backgroundColor = '#eeeeee';
      this.dom.fbox.fold.style.marginRight = '3px';
      this.dom.fbox.fold.innerHTML = '-';
      this.dom.fbox.title.appendChild(this.dom.fbox.fold);
      this.dom.fbox.title.appendChild(document.createTextNode('ChatBox'));
      if (isTouchScreen()) {
         this.dom.fbox.title.addEventListener('touchstart', this.event.chatbox.titleTouchStart);
      } else {
         this.dom.fbox.title.addEventListener('mousedown', this.event.chatbox.titleMouseDown);
      }
      this.dom.fbox.fold.addEventListener('click', this.event.chatbox.foldClick);
      this.dom.fbox.self.appendChild(this.dom.fbox.title);
      this.dom.fbox.self.appendChild(this.dom.fbox.body);
      div.appendChild(this.dom.fbox.self);

      tmp = document.createElement('div');
      this.dom.onlineMark.innerHTML = 'Online';
      this.dom.chatCall.innerHTML = 'Call';
      this.dom.chatSpeaker.innerHTML = 'Speak';
      this.dom.chatListener.innerHTML = 'Listen';
      tmp.appendChild(this.dom.onlineMark);
      tmp.appendChild(this.dom.chatSpeaker);
      tmp.appendChild(this.dom.chatListener);
      tmp.appendChild(this.dom.chatCall);
      this.dom.fbox.body.appendChild(tmp);

      var _that = this;
      this.__audioR = null;
      this.__audioP = null;
      function updateUIByStatus() {
         if (status.online) {
            _this.dom.onlineMark.style.backgroundColor = '#99ff99';
            _this._boardgame && _this._boardgame.wsOnline();
         } else {
            _this.dom.onlineMark.style.backgroundColor = '#dddddd';
            _this._boardgame && _this._boardgame.wsOffline();
         }
         if (status.speak) {
            _this.dom.chatSpeaker.style.backgroundColor = '#99ff99';
         } else {
            _this.dom.chatSpeaker.style.backgroundColor = '#dddddd';
         }
         if (status.listen) {
            _this.dom.chatListener.style.backgroundColor = '#99ff99';
         } else {
            _this.dom.chatListener.style.backgroundColor = '#dddddd';
         }
         if (!status.speak && !status.listen) {
            _this.dom.chatCall.style.backgroundColor = '#dddddd';
         } else {
            _this.dom.chatCall.style.backgroundColor = '#99ff99';
         }
      }
      function startAudioR() {
         if (!_that.__audioR) _that.__audioR = new window.boga.audio.Recorder();
         bogaAudioRecord(_that.__audioR);
         status.speak = true;
      }
      function startAudioP() {
         if (!_that.__audioP) _that.__audioP = new window.boga.audio.MultiPlayer();
         _that.__audioP.resume();
         status.listen = true;
      }
      function stopAudioR() {
         if (_that.__audioR) _that.__audioR.stop();
         _that.__audioR = null;
         status.speak = false;
      }
      function stopAudioP() {
         if (_that.__audioP) _that.__audioP.stop();
         _that.__audioP = null;
         status.listen = false;
      }
      updateUIByStatus();
      system.bundle.client.onOnline(function () {
         status.online = true;
         updateUIByStatus();
         _that.event.room.roomSync();
      });
      system.bundle.client.onOffline(function () {
         status.online = false;
         stopAudioR();
         stopAudioP();
         updateUIByStatus();
      });
      this.dom.onlineMark.addEventListener('click', function () {
         if (status.online) {
            status.online = false;
            updateUIByStatus();
            system.bundle.client.disconnect();
         } else {
            system.bundle.client.connect(system.room);
            system.bundle.client.waitForConnected(10000).then(function () {
               status.online = true;
               updateUIByStatus();
               joinRoom(system.bundle.client, system.room);
            }, function () {
               status.online = false;
               updateUIByStatus();
               system.bundle.client.disconnect();
            });
         }
      });
      this.dom.chatSpeaker.addEventListener('click', function () {
         if (!status.online) return;
         if (status.speak) stopAudioR(); else startAudioR();
         updateUIByStatus();
      });
      this.dom.chatListener.addEventListener('click', function () {
         if (!status.online) return;
         if (status.listen) stopAudioP(); else startAudioP();
         updateUIByStatus();
      });
      this.dom.chatCall.addEventListener('click', function () {
         if (!status.online) return;
         if (!status.speak && !status.listen) {
            startAudioR();
            startAudioP();
         } else {
            if (status.speak) {
               stopAudioR();
            }
            if (status.listen) {
               stopAudioP();
            }
         }
         updateUIByStatus();
      });

      tmp = document.createElement('div');
      this.dom.roomSelect.style.width = '100%';
      tmp.appendChild(this.dom.roomSelect);
      this.dom.fbox.body.appendChild(tmp);
      this.dom.roomSelect.addEventListener('change', this.event.room.roomChange);

      tmp = document.createElement('div');
      tmp.appendChild(this.dom.input);
      tmp.appendChild(this.dom.talk);
      this.dom.fbox.body.appendChild(tmp);
      this.dom.input.style.width = '100%';
      this.dom.input.setAttribute('placeholder', 'type message and enter.');
      this.dom.input.addEventListener('keydown', this.event.chat.inputEnter);

      joinRoom(system.bundle.client, system.room);

      function joinRoom(client, room) {
         if (client.getReadyState() !== WebSocket.OPEN) {
            setTimeout(joinRoom, 0, client, room);
            return;
         }
         system.bundle.client.request({
            cmd: 'chat.create',
            room: room
         }, function (data) {
            _this.event.room.roomSync();
            system.bundle.client.request({
               cmd: 'chat.enter',
               room: room
            }, function (data) {
            });
         });

         system.bundle.client.onRoomMessage(function (obj) {
            if (_this._boardgame && _this._boardgame.wsProcessMessage(obj)) return;
            if (obj.set_boardgame) {
               _this.dom.roomSelect.value = obj.set_boardgame;
               _this.event.room.roomSync();
               return;
            }
            if (obj.audio) {
               if (_this.__audioP && obj.audio.from) {
                  obj.audio.data = new Blob(
                     [to_uint(obj.audio.data)],
                     obj.audio.type && { type: obj.audio.type }
                  );
                  _this.__audioP.push(obj.audio.from, obj.audio);
                  _this.__audioP.play();
               }
               return;
            }
            if (!obj.message) return;
            if (_this.dom.talk.children.length >= 10) {
               _this.dom.talk.removeChild(_this.dom.talk.children[_this.dom.talk.children.length-1]);
            }
            var div = document.createElement('div');
            div.appendChild(document.createTextNode(obj.message || '...'));
            _this.dom.talk.insertBefore(div, _this.dom.talk.children[0]);
         });
      }
   }
   BogaChat.prototype = {
      getPluginName: function () {
         return plugin.name;
      },
      getFileName: function () {
         return this.data.filename;
      },
      resize: function () {},
      show: function () {
         if (!this.dom.self.parentNode) {
            var view = system.bundle.view;
            view.appendChild(this.dom.self);
         }
         this.dom.self.style.display = 'block';
      },
      hide: function () {
         this.dom.self.style.display = 'none';
      },
      dispose: function () {
         if (isTouchScreen()) {
            this.dom.fbox.title.removeEventListener('touchstart', this.event.chatbox.titleTouchStart);
         } else {
            this.dom.fbox.title.removeEventListener('mousedown', this.event.chatbox.titleMouseDown);
         }
         this.dom.fbox.fold.removeEventListener('click', this.event.chatbox.foldClick);
         this.dom.roomSelect.removeEventListener('change', this.event.room.roomChange);
         this.dom.input.removeEventListener('keydown', this.event.chat.inputEnter);
         system.bundle.view.removeChild(this.dom.nav.dom.self);
      }
   };
   
   var api = {
      _instances: {},
      _ready: false,
      // initialize api on first load
      initialize: function (bundle) {
         system.bundle = bundle;
         boga.loadScript('./js/component/audio.js').then(function () {
            api._ready = true;
         });
      },
      // create a new file browser with an ID
      create: function (filename) {
         var id = 'lab.chat-' + generate_id();
         while (api._instances[id]) id = generate_id();
         var instance = new BogaChat(id, filename);
         api._instances[id] = instance;
         return id;
      },
      // get created file browser with an ID
      get: function (id) {
         return api._instances[id];
      },
      isReady: function () {
         return api._ready;
      },
      // render for file browser with a specified ID
      render: function (id) {},
      // close an instance
      close: function (id) {
         var instance = api._instances[id];
         delete api._instances[id];
         instance.dispose(id);
      }
   };
   
   var plugin = {
      name: 'lab.chat',
      version: '0.1',
      _create: function () { return api; }
   };
   window.boga.plugins[plugin.name] = plugin._create();
   
   
   })();
   
   