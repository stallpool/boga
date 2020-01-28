(function () {

   var system = {
      bundle: null
   };
   
   function BogaChat(id, filename) {
      this.id = id;
      var div = document.createElement('div');
      this.dom = {
         self: div,
         box1: document.createElement('div'),
         box2: document.createElement('div'),
         input: document.createElement('input'),
         talk: document.createElement('div')
      };
      this.data = {
         filename: filename
      };
      system.bundle.view.appendChild(this.dom.self);

      div.style.width = '100%';
      div.style.height = '100%';

      this.dom.box1.id = 'box1';
      this.dom.box1.setAttribute('draggable', 'true');
      this.dom.box1.style.width = '50px';
      this.dom.box1.style.height = '50px';
      this.dom.box1.style.margin = '2px';
      this.dom.box1.style.border = '1px solid black';
      this.dom.box1.style.backgroundColor = 'green';

      this.dom.box2.id = 'box2';
      this.dom.box2.style.width = '150px';
      this.dom.box2.style.height = '150px';
      this.dom.box2.style.margin = '2px';
      this.dom.box2.style.border = '1px solid black';
      this.dom.box2.style.backgroundColor = 'red';

      div.innerHTML = 'Drag and Drop!';
      div.appendChild(this.dom.box2);
      div.appendChild(this.dom.box1);

      div.appendChild(document.createTextNode('Chat'));
      var tmp = document.createElement('div');
      tmp.appendChild(this.dom.input);
      tmp.appendChild(this.dom.talk);
      div.appendChild(tmp);

      var _this = this;
      this.event = {
         obj: {
            _target: null,
            drag: function (evt) {
               _this.event.obj._target = evt.target;
               evt.target.style.opacity = 0.5;
            },
            drop: function (evt) {
               evt.target.style.opacity = '';
            }
         },
         container: {
            dragover: function (evt) {
               evt.preventDefault();
               evt.stopPropagation();
            },
            drop: function (evt) {
               evt.preventDefault();
               var elem = _this.event.obj._target;
               if (!elem) return;
               if (evt.target === elem) return;
               _this.event.obj._target = null;
               evt.target.appendChild(elem);
            }
         },
         chat: {
            inputEnter: function (evt) {
               if (evt.keyCode !== 13) return;
               if (!_this.dom.input.value) return;
               _this.dom.input.classList.add('disabled');
               system.bundle.client.request({
                  cmd: 'chat.send',
                  room: 'test',
                  message: _this.dom.input.value
               }, function (data) {
                  console.log('ack', data);
                  _this.dom.input.classList.remove('disabled');
                  _this.dom.input.value = '';
                  _this.dom.input.focus();
               });
            }
         }
      };

      this.dom.box1.addEventListener('dragstart', this.event.obj.drag);
      this.dom.box1.addEventListener('dragend', this.event.obj.drop);
      div.addEventListener('dragover', this.event.container.dragover);
      div.addEventListener('drop', this.event.container.drop);
      this.dom.input.addEventListener('keydown', this.event.chat.inputEnter);

      joinRoom(system.bundle.client, 'test');

      this.hide();

      function joinRoom(client, room) {
         if (client.getReadyState() !== WebSocket.OPEN) {
            setTimeout(joinRoom, 0, client, room);
            return;
         }
         system.bundle.client.request({
            cmd: 'chat.create',
            room: room
         }, function (data) {
            console.log('ack.create', data);
            system.bundle.client.request({
               cmd: 'chat.enter',
               room: room
            }, function (data) {
               console.log('ack.enter', data);
            });
         });

         system.bundle.client.onRoomMessage(function (obj) {
            console.log('room', obj);
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
         this.dom.box1.removeEventListener('dragstart', this.event.obj.drag);
         this.dom.box1.removeEventListener('dragend', this.event.obj.drop);
         this.dom.self.removeEventListener('dragover', this.event.container.dragover);
         this.dom.self.removeEventListener('drop', this.event.container.drop);
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
         api._ready = true;
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
   
   