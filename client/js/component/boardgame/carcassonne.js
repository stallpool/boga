'use strict';

(function () {
   function isTouchScreen() {
      return 'ontouchend' in document;
   }

   function polyfillOffset(evt, _this) {
      var r = {
         x: evt.clientX,
         y: evt.clientY - 96
      };
      if (r.y < _this.public_h) {
         r.x -= _this.offsetX;
         r.y -= _this.offsetY;
         r.area = 'public';
      } else {
         r.area = 'private';
      }
      return r;
   }

   function actContextMenu(_this, evt) {
      var x = evt.clientX, y = evt.clientY;
      _this._ui.control.style.display = 'block';
      if (x + _this._ui.control.offsetWidth > window.innerWidth) {
         x = window.innerWidth - _this._ui.control.offsetWidth;
      }
      if (y + _this._ui.control.offsetHeight > window.innerHeight) {
         y = window.innerHeight - _this._ui.control.offsetHeight;
      }
      if (x < 0) x = 0;
      if (y < 0) y = 0;
      _this._ui.control.style.left = x + 'px';
      _this._ui.control.style.top = y + 'px';
      _this._ui.mask = document.createElement('div');
      _this._ui.control.parentNode.appendChild(_this._ui.mask);
      _this._ui.mask.style.position = 'fixed';
      _this._ui.mask.style.zIndex = 2000;
      _this._ui.mask.style.backgroundColor = 'white';
      _this._ui.mask.style.opacity = 0.5;
      _this._ui.mask.style.width = '100%';
      _this._ui.mask.style.height = '100%';
      _this._ui.mask.style.left = '0px';
      _this._ui.mask.style.top = '0px';
      _this._ui.control.style.zIndex = 2001;
      _this._ui.mask.addEventListener('click', maskClick);

      function maskClick() {
         _this._ui.mask.removeEventListener('click', maskClick);
         _this._ui.control.style.display = 'none';
         _this._ui.control.parentNode.removeChild(_this._ui.mask);
         _this._ui.mask = null;
      }
   }

   function BogaCarcassonneGame(client, room, dom) {
      this._client = client;
      this._client.bindRoom(room);
      this._room = room;
      this.dom = dom;
      var w = 640, h = 640;
      if (w > window.innerWidth) w = window.innerWidth;
      if (h + 96 > window.innerHeight) h = window.innerHeight - 96;
   
      var canvas = document.createElement('canvas');
      this.w = w; this.h = h;
      this.offsetX = 0; this.offsetY = 0;
      this.private_w = w; this.private_h = 140;
      this.public_w = w; this.public_h = h - this.private_h;
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      canvas.width = w;
      canvas.height = h;
      this.canvas = canvas;
      this.pen = canvas.getContext('2d');
      this.dom.appendChild(canvas);
      this.visualObjs = {
         public: [],
         private: [],
         static: []
      };
      this.imageBuf = {};
      this._init();
      var _this = this;
      this.wsSync();
      requestAnimationFrame(function () {
         _this.paint();
      });
   
      this.event = {
         canvas: {
            selected: null,
            dragOffset: { px: 0, py: 0 },
            dragImageBuffer: null,
            dragStableObject: false,
            mouseClickCount: 0,
            mouseDownTimer: null,
            mouseUpTimer: null,
            touchCache: { x: 0, y: 0 },
            drop: function (evt) {
               var cur = polyfillOffset(evt, _this);
               var selected = _this.event.canvas.selected;
               if (!selected) {
                  if (_this.event.canvas.dragOffset.py >= _this.public_h) return;
                  _this.offsetY += cur.y - _this.event.canvas.dragOffset.py;
                  _this.offsetX += cur.x - _this.event.canvas.dragOffset.px;
                  requestAnimationFrame(function () {
                     _this.paint();
                     _this.event.canvas.dragImageBuffer = null;
                  });
                  return;
               }
               if (_this.event.canvas.dragStableObject) return;
               var area, areaName, moveMode;
               if (cur.area === 'private') {
                  area = _this.visualObjs.private;
                  areaName = 'private';
               } else {
                  area = _this.visualObjs.public;
                  areaName = 'public';
               }
               if (selected) {
                  if (areaName === 'private' && selected.area === 'private') {
                     moveMode = 'p-p';
                  } else if (areaName === 'private' && selected.area === 'public') {
                     moveMode = 'P-p';
                  } else if (areaName === 'public' && selected.area === 'private') {
                     moveMode = 'p-P';
                  } else if (areaName === 'public' && selected.area === 'public') {
                     moveMode = 'P-P';
                  }
               }
               selected.y += cur.y - _this.event.canvas.dragOffset.py;
               selected.x += cur.x - _this.event.canvas.dragOffset.px;
               if (selected.area !== areaName) {
                  selected.area = areaName;
                  if (areaName === 'private') {
                     selected.y -= _this.public_h
                  } else {
                     selected.y += _this.public_h
                  }
               }
               area.push(selected);
               area.sort(function (a, b) { return (a.layer - b.layer) || 0; });
               var card_obj;
               switch(moveMode) {
                  case 'p-p':
                     if (selected.type !== 'tile') break;
                     card_obj = {
                        id: selected.id, val: selected.val, type: selected.type,
                        x: selected.x, y: selected.y,
                        rotation: selected.rotation
                     };
                     _this.wsMovePrivate(card_obj);
                     break;
                  case 'P-p':
                     card_obj = {
                        id: selected.id, type: selected.type,
                        x: selected.x, y: selected.y,
                        rotation: selected.rotation
                     };
                     if (selected.val) card_obj.val = selected.val;
                     if (selected.color) card_obj.color = selected.color;
                     _this.wsPull(card_obj);
                     break;
                  case 'p-P':
                     card_obj = {
                        id: selected.id, type: selected.type,
                        x: selected.x, y: selected.y,
                        rotation: selected.rotation,
                     };
                     if (selected.val) card_obj.val = selected.val;
                     if (selected.color) card_obj.color = selected.color;
                     _this.wsPush(card_obj);
                     break;
                  case 'P-P':
                     card_obj = {
                        id: selected.id, type: selected.type,
                        x: selected.x, y: selected.y,
                        rotation: selected.rotation,
                     };
                     if (selected.val) card_obj.val = selected.val;
                     if (selected.color) card_obj.color = selected.color;
                     _this.wsMovePublic(card_obj);
                     break;
               }
               requestAnimationFrame(function () {
                  _this.paint();
                  _this.event.canvas.dragImageBuffer = null;
               });
            },
            drag: function (evt) {
               // drag start -> mousemove
               var cur = polyfillOffset(evt, _this);
               var selected = _this._select(cur);
               if (selected) {
                  _this.event.canvas.selected = selected;
               } else {
                  _this.event.canvas.selected = null;
               }
               if (_this.event.canvas.selected) {
                  _this.event.canvas.dragStableObject = _this.event.canvas.selected.stable;
               } else {
                  _this.event.canvas.dragStableObject = true;
               }
               if (!_this.event.canvas.dragStableObject) {
                  var objs = _this._selectArea(cur);
                  var index = objs.indexOf(selected);
                  objs.splice(index, 1);
               }
               _this.event.canvas.dragOffset.px = cur.x;
               _this.event.canvas.dragOffset.py = cur.y;
               requestAnimationFrame(function () {
                  _this.paint();
                  _this.event.canvas.dragImageBuffer = _this._to_img(_this.canvas);
               });
            },
            click: function (evt) {
               var cur = polyfillOffset(evt, _this);
               var selected = _this._select(cur);
               if (selected) {
                  if (selected.type === 'button') {
                     if (selected.text === 'Next') {
                        _this.wsPullNextPrivateCard();
                        var index = _this.visualObjs.private.indexOf(selected);
                        if (index >=0 ) _this.visualObjs.private.splice(index, 1);
                     } else if (selected.text === '+1') {
                        _this.wsUpdateScore(1);
                     } else if (selected.text === '-1') {
                        _this.wsUpdateScore(-1);
                     } else if (selected.text === 'Refresh') {
                        _this.wsSync();
                     }
                     return;
                  }
                  if (selected.area === 'private') {
                     selected.rotation = ((selected.rotation || 0) + 1) % 4;
                     _this.wsMovePrivate(selected);
                     return;
                  }
                  _this.event.canvas.selected = selected;
               } else {
                  _this.event.canvas.selected = null;
               }
               requestAnimationFrame(function () {
                  _this.paint();
               });
            },
            doubleClick: function (evt) {
               var cur = polyfillOffset(evt, _this);
               var selected = _this._select(cur);
               if (!selected) {
                  _this.event.canvas.selected = null;
                  requestAnimationFrame(function () {
                     _this.paint();
                  });
                  if (isTouchScreen()) {
                     actContextMenu(_this, evt);
                  }
                  return;
               }
               if (selected.type === 'tile') {
                  selected.rotation = ((selected.rotation || 0) + 1) % 4;
                  _this.wsMovePublic(selected);
               }
               _this.event.canvas.selected = selected;
               requestAnimationFrame(function () {
                  _this.paint();
               });
            },
            mouseDown: function (evt) {
               if (_this.event.canvas.mouseUpTimer) {
                  clearTimeout(_this.event.canvas.mouseUpTimer);
                  _this.event.canvas.mouseUpTimer = null;
               }
               _this.event.canvas.mouseDownTimer = setTimeout(function () {
                  _this.event.canvas.mouseDownTimer = null;
                  _this.event.canvas.drag(evt);
               }, 200);
            },
            mouseUp: function (evt) {
               if (_this.event.canvas.mouseDownTimer) {
                  clearTimeout(_this.event.canvas.mouseDownTimer);
                  _this.event.canvas.mouseDownTimer = null;
                  _this.event.canvas.mouseClickCount ++;
                  _this.event.canvas.mouseUpTimer = setTimeout(function () {
                     _this.event.canvas.mouseUpTimer = null;
                     if (_this.event.canvas.mouseClickCount === 1) {
                        // click
                        _this.event.canvas.click(evt);
                     } else {
                        // double click, comboclick
                        _this.event.canvas.doubleClick(evt);
                     }
                     _this.event.canvas.mouseClickCount = 0;
                  }, 200);
               } else {
                  _this.event.canvas.drop(evt);
               }
            },
            mouseMove: function (evt) {
               var cur = polyfillOffset(evt, _this);
               // dragmove + evt.button === 1
               if (evt.which === 1) {
                  // drag move
                  var selected = _this.event.canvas.selected;
                  if (selected) {
                     if (_this.event.canvas.dragStableObject) return;
                     if (!_this.event.canvas.dragImageBuffer) return;
                     requestAnimationFrame(function () {
                        if (!selected) return;
                        _this.pen.clearRect(0, 0, _this.w, _this.h);
                        _this.pen.fillStyle = 'white';
                        _this.pen.fillRect(0, 0, _this.w, _this.h);
                        if (_this.event.canvas.dragImageBuffer) {
                           _this.pen.drawImage(_this.event.canvas.dragImageBuffer, 0, 0);
                        }
                        _this.pen.save();
                        var x = selected.x, y = selected.y;
                        selected.y += cur.y - _this.event.canvas.dragOffset.py;
                        selected.x += cur.x - _this.event.canvas.dragOffset.px;
                        if (selected.area === 'public') {
                           if (cur.area === 'public') {
                              selected.y += _this.offsetY;
                              selected.x += _this.offsetX;
                           }
                        } else {
                           if (cur.area === 'public') {
                              selected.x += _this.offsetX;
                              selected.y += _this.public_h + _this.offsetY;
                           } else {
                              _this.pen.translate(0, _this.public_h);
                           }
                        }
                        _this._paintElement(selected);
                        selected.y = y; selected.x = x;
                        _this.pen.restore();
                     });
                  }
               }
            },
            mouseLeave: function (evt) {
               // drop + evt.button === 1
            },
            contextMenu: function (evt) {
               evt.preventDefault();
               actContextMenu(_this, evt);
            },
            touchStart: function (evt) {
               evt.preventDefault();
               var mevt = {
                  which: 1,
                  clientX: evt.touches[0].clientX,
                  clientY: evt.touches[0].clientY
               };
               _this.event.canvas.touchCache.x = mevt.clientX;
               _this.event.canvas.touchCache.y = mevt.clientY;
               _this.event.canvas.mouseDown(mevt);
            },
            touchMove: function (evt) {
               evt.preventDefault();
               var mevt = {
                  which: 1,
                  clientX: evt.touches[0].clientX,
                  clientY: evt.touches[0].clientY
               };
               _this.event.canvas.touchCache.x = mevt.clientX;
               _this.event.canvas.touchCache.y = mevt.clientY;
               _this.event.canvas.mouseMove(mevt);
            },
            touchEnd: function (evt) {
               evt.preventDefault();
               var mevt = {
                  clientX: _this.event.canvas.touchCache.x,
                  clientY: _this.event.canvas.touchCache.y
               };
               _this.event.canvas.mouseUp(mevt);
            }
         } // canvas
      };
      if (isTouchScreen()) {
         canvas.addEventListener('touchstart', this.event.canvas.touchStart);
         canvas.addEventListener('touchmove', this.event.canvas.touchMove);
         canvas.addEventListener('touchend', this.event.canvas.touchEnd);
      } else {
         canvas.addEventListener('contextmenu', this.event.canvas.contextMenu);
         canvas.addEventListener('mousedown', this.event.canvas.mouseDown);
         canvas.addEventListener('mouseup', this.event.canvas.mouseUp);
         canvas.addEventListener('mousemove', this.event.canvas.mouseMove);
         canvas.addEventListener('mouseleave', this.event.canvas.mouseLeave);
      }
   
      var ui = {
         _flag: {
            started: false,
            p: [false, false, false, false],
            active: false
         },
         refresh: function () {
            if (ui._flag.started) {
               ui.btn.start.style.backgroundColor = '#99ff99';
            } else {
               ui.btn.start.style.backgroundColor = '#dddddd';
            }
            ui.btn.shuffle.style.backgroundColor = '#dddddd';
            var colors = [
               { val: 'red', index: 0 },
               { val: 'green', index: 1 },
               { val: 'blue', index: 2 },
               { val: 'yellow', index: 3 },
               { val: 'black', index: 4 }
            ];
            if (ui._flag.players) {
               ui._flag.players.forEach(function (player_obj, i) {
                  var obj = colors.filter(function (x) { return x.val === player_obj.color; })[0];
                  obj.index = i - 4;
                  obj.occuppied = true;
                  obj.active = player_obj.username === env.user.username;
               });
               colors = colors.sort(function (a, b) { return a.index - b.index });
               colors.forEach(function (color_obj, i) {
                  var btn = ui.btn['p' + i];
                  btn.setAttribute('data-color', color_obj.val);
                  btn.style.backgroundColor = color_obj.val;
                  if (color_obj.active) {
                     btn.style.opacity = 1;
                  } else if (color_obj.occuppied) {
                     btn.style.opacity = 0.8;
                  } else {
                     btn.style.opacity = 0.1;
                  }
               });
            }
         },
         control: document.createElement('div'),
         btn: {
            start: document.createElement('button'),
            shuffle: document.createElement('button'),
            p0: document.createElement('button'),
            p1: document.createElement('button'),
            p2: document.createElement('button'),
            p3: document.createElement('button'),
            p4: document.createElement('button')
         }
      };
      this._ui = ui;
      ui.control.style.border = '1px solid black';
      ui.control.style.position = 'fixed';
      ui.control.style.top = '96px';
      ui.control.style.display = 'none';
      ui.control.style.position = 'fixed';
      ui.control.style.backgroundColor = 'white';
      ui.control.style.width = '120px';
      ui.control.style.height = '200px';
      ui.control.style.padding = '5px';
      ui.btn.start.innerHTML = 'Start';
      ui.btn.start.style.width = '100%';
      ui.btn.shuffle.innerHTML = 'Reset';
      ui.btn.shuffle.style.width = '100%';
      ui.btn.p0.innerHTML = '&nbsp;';
      ui.btn.p1.innerHTML = '&nbsp;';
      ui.btn.p2.innerHTML = '&nbsp;';
      ui.btn.p3.innerHTML = '&nbsp;';
      ui.btn.p4.innerHTML = '&nbsp;';
      ui.btn.p0.style.backgroundColor = 'red';
      ui.btn.p1.style.backgroundColor = 'green';
      ui.btn.p2.style.backgroundColor = 'blue';
      ui.btn.p3.style.backgroundColor = 'yellow';
      ui.btn.p4.style.backgroundColor = 'black';
      ui.btn.p0.setAttribute('data-color', 'red');
      ui.btn.p1.setAttribute('data-color', 'green');
      ui.btn.p2.setAttribute('data-color', 'blue');
      ui.btn.p3.setAttribute('data-color', 'yello');
      ui.btn.p4.setAttribute('data-color', 'black');
      ui.btn.p0.setAttribute('data-id', '0');
      ui.btn.p1.setAttribute('data-id', '1');
      ui.btn.p2.setAttribute('data-id', '2');
      ui.btn.p3.setAttribute('data-id', '3');
      ui.btn.p4.setAttribute('data-id', '4');
      var tmp = document.createElement('div');
      tmp.appendChild(ui.btn.start); ui.control.appendChild(tmp);
      tmp = document.createElement('div');
      tmp.appendChild(ui.btn.shuffle); ui.control.appendChild(tmp);
      ui.control.appendChild(document.createTextNode('Seats:'))
      tmp = document.createElement('div');
      tmp.appendChild(ui.btn.p0);
      tmp.appendChild(ui.btn.p1);
      tmp.appendChild(ui.btn.p2);
      tmp.appendChild(ui.btn.p3);
      tmp.appendChild(ui.btn.p4);
      ui.control.appendChild(tmp);
      ui.refresh();
      this.dom.appendChild(ui.control);
      this.uiEvent = {
         click: {
            btnStart: function () {
               _this.wsIsStarted().then(function (is_started) {
                  if (is_started) return;
                  _this.wsStart();
               });
            },
            btnShffule: function () {
               _this.wsReset();
            },
            btnPx: function (evt) {
               var id = parseInt(evt.target.getAttribute('data-id'));
               var color = evt.target.getAttribute('data-color');
               _this.wsToggleUser(color);
            }
         } // click
      };
      ui.btn.start.addEventListener('click', this.uiEvent.click.btnStart);
      ui.btn.shuffle.addEventListener('click', this.uiEvent.click.btnShffule);
      ui.btn.p0.addEventListener('click', this.uiEvent.click.btnPx);
      ui.btn.p1.addEventListener('click', this.uiEvent.click.btnPx);
      ui.btn.p2.addEventListener('click', this.uiEvent.click.btnPx);
      ui.btn.p3.addEventListener('click', this.uiEvent.click.btnPx);
      ui.btn.p4.addEventListener('click', this.uiEvent.click.btnPx);
      this.wsOnline();
   }
   BogaCarcassonneGame.prototype = {
      _to_img: function (canvas) {
         var img = new Image();
         img.src = canvas.toDataURL('image/png');
         return img;
      },
      _random_pick: function (objOrArr) {
         var n;
         if (Array.isArray(objOrArr)) {
            n = objOrArr.length;
            return objOrArr[~~(Math.random()*n)];
         } else {
            var keys = Object.keys(objOrArr);
            n = keys.length;
            return objOrArr[keys[~~(Math.random()*n)]];
         }
      },
      _outerRect: function (group) {
         if (!group || !group.length) return { x: 0, y: 0, w: 0, h: 0, type: 'rect' };
         var one = group[0];
         var L = one.x, R = one.x + one.w, T = one.y, B = one.y + one.h;
         group.forEach(function (one) {
            if (one.x < L) L = one.x;
            if (one.w && one.x + one.w > R) R = one.x + one.w;
            if (one.y < T) T = one.y;
            if (one.h && one.y + one.h > B) B = one.y + one.h;
         });
         return { x: L, y: T, w: R - L, h: B - T };
      },
      _init: function () {
         if (this.imageBuf._initialized === 1) {
            return Promise.resolve(true);
         }
         var _this = this;
         return new Promise(function (r, e) {
            var times = 0;
            if (_this.imageBuf._initialized === -1) {
               setTimeout(waitForInit, 1000);

               function waitForInit() {
                  if (_this.imageBuf._initialized === 1) {
                     r(true);
                  }
                  times ++;
                  if (times > 10) return e('timeout');
                  setTimeout(waitForInit, 1000);
               }
               return;
            }
            var img, loaded = 0;
            _this.imageBuf._initialized = -1;
            img = new Image();
            img.addEventListener('load', function () {
               loaded ++;
               after_load();
            });
            img.src = 'images/carcassonne_common.png';
            _this.imageBuf.carcassonneCommon = img;
            img = new Image();
            img.addEventListener('load', function () {
               loaded ++;
               after_load();
            });
            img.src = 'images/carcassonne_river.png';
            _this.imageBuf.carcassonneRiver = img;

            function after_load() {
               if (loaded < 2) return;
               loaded = 0;
               _this.imageBuf._initialized = 1;
               _this.makeElementBuffer();
               r();
            }
         });
      },
      _selectArea: function (x, y) {
         if (y === 'private') {
            return this.visualObjs.private;
         } else {
            return this.visualObjs.public;
         }
      },
      _select: function (cur) {
         if (cur.area === 'private') {
            return this._selectInArea(cur.x, cur.y - this.public_h, this.visualObjs.private);
         } else {
            return this._selectInArea(cur.x, cur.y, this.visualObjs.public);
         }
      },
      _selectInArea: function (x, y, objs) {
         var point = { x: x, y: y };
         for (var i = objs.length-1; i >= 0; i--) {
            var obj = objs[i];
            if (this._cross(point, obj)) {
               return obj;
            }
         }
         return null;
      },
      _cross: function (obj1, obj2) {
         var t1, t2;
         t1 = get_type(obj1), t2 = get_type(obj2);
         if (t1 === 'point') {
            if (t2 === 'point') {
               return pointPoint(obj1, obj2);
            } else if (t2 === 'rect') {
               return pointRect(obj1, obj2);
            }
         } else if (t1 === 'rect') {
            if (t2 === 'point') {
               return pointRect(obj2, obj1);
            } else if (t2 === 'rect') {
               return rectRect(obj1, obj2);
            }
         }
         return false;
         function get_type(obj) {
            switch(obj.type) {
               case 'rect':
               case 'tile':
               case 'worker':
               case 'button':
                  return 'rect';
               case 'point':
               default:
                  return 'point';
            }
         }
         function pointPoint(p1, p2) {
            return p1.x === p2.x && p1.y === p2.y;
         }
         function pointRect(point, rect) {
            return (
               rect.x <= point.x &&
               rect.x + rect.w >= point.x &&
               rect.y <= point.y &&
               rect.y + rect.h >= point.y
            );
         }
         function rectRect(rect1, rect2) {
            var a1 = rect1.x, b1 = rect1.x + rect1.w;
            var a2 = rect2.x, b2 = rect2.x + rect2.w;
            if (a1 >= b2 || a2 >= b1) return false;
            a1 = rect1.y, b1 = rect1.y + rect1.h;
            a2 = rect2.y, b2 = rect2.y + rect2.h;
            if (a1 >= b2 || a2 >= b1) return false;
            return true;
         }
      },
      dispose: function () {},
      makeElementBuffer: function () {
         if (!this.imageBuf) return;
         var tc, w, h, p;
         tc = document.createElement('canvas');
         p = tc.getContext('2d');

         w = 50; h = 50;
         tc.style.width = w + 'px';
         tc.style.height = h + 'px';
         tc.width = w; tc.height = h;

         p.drawImage(this.imageBuf.carcassonneCommon, 0, 0);
         this.imageBuf['c1r-'] = this._to_img(tc);
         p.drawImage(this.imageBuf.carcassonneCommon, -50, 0);
         this.imageBuf['r-'] = this._to_img(tc);
         p.drawImage(this.imageBuf.carcassonneCommon, -100, 0);
         this.imageBuf['r/'] = this._to_img(tc);
         p.drawImage(this.imageBuf.carcassonneCommon, -150, 0);
         this.imageBuf['r4'] = this._to_img(tc);
         p.drawImage(this.imageBuf.carcassonneCommon, -200, 0);
         this.imageBuf['pr|'] = this._to_img(tc);
         p.drawImage(this.imageBuf.carcassonneCommon, 0, -50);
         this.imageBuf['c1r3'] = this._to_img(tc);
         p.drawImage(this.imageBuf.carcassonneCommon, -50, -50);
         this.imageBuf['r3'] = this._to_img(tc);
         p.drawImage(this.imageBuf.carcassonneCommon, -100, -50);
         this.imageBuf['c1r\\'] = this._to_img(tc);
         p.save();
         p.rotate(-Math.PI/2);
         p.translate(-200, -50);
         p.drawImage(this.imageBuf.carcassonneCommon, 0, 0);
         p.restore();
         this.imageBuf['c1r/'] = this._to_img(tc);
         p.save();
         p.rotate(-Math.PI/2);
         p.translate(-250, -50);
         p.drawImage(this.imageBuf.carcassonneCommon, 0, 0);
         p.restore();
         this.imageBuf['c3r|'] = this._to_img(tc);
         p.drawImage(this.imageBuf.carcassonneCommon, 0, -100);
         this.imageBuf['c/r/'] = this._to_img(tc);
         p.drawImage(this.imageBuf.carcassonneCommon, -50, -100);
         this.imageBuf['p'] = this._to_img(tc);
         p.drawImage(this.imageBuf.carcassonneCommon, -100, -100);
         this.imageBuf['c/'] = this._to_img(tc);
         p.drawImage(this.imageBuf.carcassonneCommon, -150, -100);
         this.imageBuf['c><'] = this._to_img(tc);
         p.drawImage(this.imageBuf.carcassonneCommon, -200, -100);
         this.imageBuf['c>v'] = this._to_img(tc);
         p.save();
         p.rotate(-Math.PI/2);
         p.translate(-50, -150);
         p.drawImage(this.imageBuf.carcassonneCommon, 0, 0);
         p.restore();
         this.imageBuf['c3'] = this._to_img(tc);
         p.drawImage(this.imageBuf.carcassonneCommon, -50, -150);
         this.imageBuf['c1'] = this._to_img(tc);
         p.drawImage(this.imageBuf.carcassonneCommon, -100, -150);
         this.imageBuf['c-'] = this._to_img(tc);
         p.drawImage(this.imageBuf.carcassonneCommon, -150, -150);
         this.imageBuf['c4'] = this._to_img(tc);
         p.drawImage(this.imageBuf.carcassonneRiver, 0, 0);

         this.imageBuf['Rs'] = this._to_img(tc);
         p.drawImage(this.imageBuf.carcassonneRiver, -50, 0);
         this.imageBuf['cRc'] = this._to_img(tc);
         p.drawImage(this.imageBuf.carcassonneRiver, -100, 0);
         this.imageBuf['R/'] = this._to_img(tc);
         p.drawImage(this.imageBuf.carcassonneRiver, -150, 0);
         this.imageBuf['R/c/'] = this._to_img(tc);
         p.drawImage(this.imageBuf.carcassonneRiver, 0, -50);
         this.imageBuf['Rpr|'] = this._to_img(tc);
         p.drawImage(this.imageBuf.carcassonneRiver, -50, -50);
         this.imageBuf['R-'] = this._to_img(tc);
         p.drawImage(this.imageBuf.carcassonneRiver, -100, -50);
         this.imageBuf['R/r/'] = this._to_img(tc);
         p.drawImage(this.imageBuf.carcassonneRiver, -150, -50);
         this.imageBuf['Rr|'] = this._to_img(tc);
         p.drawImage(this.imageBuf.carcassonneRiver, -200, -50);
         this.imageBuf['Rcr|'] = this._to_img(tc);
      },
      paint: function () {
         this.pen.save();
         this.pen.clearRect(0, 0, this.w, this.h);
         this.pen.fillStyle = 'white';
         this.pen.fillRect(0, 0, this.w, this.h);

         this._paintPublic();
         this._paintPrivate();
         this.pen.strokeStyle = 'black';
         this.pen.rect(0, 0, this.w, this.h);
         this.pen.stroke();
         this.pen.restore();
      },
      _paintPublic: function () {
         var _this = this;
         var public_objs = this.visualObjs.public;
         this.pen.save();
         this.pen.strokeStyle = 'black';
         this.pen.fillStyle = 'white';
         this.pen.fillRect(0, 0, this.public_w, this.public_h);
         this.pen.rect(0, 0, this.public_w, this.public_h);
         this.pen.restore();
         this.pen.save();
         this.pen.translate(this.offsetX, this.offsetY);
         public_objs.forEach(function (obj) {
            _this._paintElement(obj);
         });
         this.pen.restore();
         this.pen.save();
         this._paintStatic();
         this.pen.restore();
      },
      _paintPrivate: function () {
         var _this = this;
         var private_objs = this.visualObjs.private;
         this.pen.save();
         this.pen.translate(0, this.public_h);
         this.pen.strokeStyle = 'black';
         this.pen.fillStyle = 'white';
         this.pen.fillRect(0, 0, this.private_w, this.private_h);
         this.pen.rect(0, 0, this.private_w, this.private_h);
         private_objs.forEach(function (obj) {
            _this._paintElement(obj);
         });
         this.pen.restore();
      },
      _paintStatic: function () {
         var _this = this;
         var static_objs = this.visualObjs.static;
         this.pen.save();
         this.pen.fillStyle = 'green';
         static_objs.forEach(function (obj) {
            return _this._paintElement(obj);
         });
         this.pen.restore();
      },
      _paintElement: function (obj) {
         this.pen.save();
         this.pen.translate(obj.x, obj.y);
         var elem, rect, x, y;
         switch(obj.type) {
            case 'worker':
               this.pen.fillStyle = obj.color;
               this.pen.strokeStyle = 'black';
               this.pen.fillRect(0, 0, obj.w, obj.h);
               this.pen.strokeRect(0, 0, obj.w, obj.h);
               break;
            case 'tile':
               this.pen.save();
               var doubleScored = obj.val.charAt(0) === '2';
               var val = doubleScored?obj.val.substring(1):obj.val;
               switch(obj.rotation) {
                  case 1:
                     this.pen.translate(obj.w, 0);
                     this.pen.rotate(Math.PI/2);
                     break;
                  case 2:
                     this.pen.translate(obj.w, obj.h);
                     this.pen.rotate(Math.PI);
                     break;
                  case 3:
                     this.pen.translate(0, obj.h);
                     this.pen.rotate(-Math.PI/2);
                     break;
               }
               elem = this.imageBuf[val];
               if (!elem) {
                  this.pen.restore();
                  break;
               }
               this.pen.drawImage(elem, 0, 0);
               if (doubleScored) {
                  this.pen.fillStyle = 'rgba(0,0,255,0.5)';
                  this.pen.beginPath();
                  this.pen.arc(5, 15, 3, 0, Math.PI*2);
                  this.pen.fill();
               }
               this.pen.restore();
               break;
            case 'button':
               this.pen.fillStyle = 'black';
               this.pen.strokeStyle = 'black';
               rect = this.pen.measureText(obj.text);
               this.pen.fillText(obj.text, 5, 12);
               this.pen.rect(0, 0, obj.w, obj.h);
               break;
            case 'text':
               rect = this.pen.measureText(obj.text);
               x = obj.x;
               y = obj.y;
               if (x < 5) x = 5;
               if (x + rect.width + 5 > this.public_w) x = this.public_w - rect.width - 5;
               if (y < 5) y = 5;
               if (y + 15 + 5 > this.public_h) y = this.public_h - 15 - 5;
               this.pen.fillStyle = 'green';
               this.pen.fillText(obj.text, x, y);   
               break;
            case 'rect':
               this.pen.fillStyle = obj.color;
               this.pen.strokeStyle = 'black';
               this.pen.fillRect(obj.x, obj.y, obj.w, obj.h);
               this.pen.strokeRect(obj.x, obj.y, obj.w, obj.h);
               break;
         }
         this.pen.restore();
      },
      wsProcessMessage: function (obj) {
         var _this = this;
         if (!this._client.isOnline()) {
            this.wsOffline();
            return false;
         }
         if (!obj.carcassonne) return false;
         if (obj.action) {
            switch (obj.action) {
               case 'create':
                  this._ui._flag.started = true;
                  break;
               case 'reset':
                  this.offsetX = 0;
                  this.offsetY = 0;
               case 'push':
               case 'pull':
               case 'move':
                  this.wsSync();
                  return;
            }
         }
         if (obj.deck) {
            if (obj.deck.players) {
               this._ui._flag.players = obj.deck.players;
               this._ui._flag.p = obj.deck.players.map(function (player, i) {
                  return player.username === env.user.username;
               });
   
               this.visualObjs.static = [];
               this._ui._flag.players.forEach(function (player_obj, i) {
                  var text = '( score=' + player_obj.score + ', worker=' + player_obj.worker + ', card=' + player_obj.cardcount + ' )';
                  if (player_obj.username) text = player_obj.username + ': ' + text;
                  _this.visualObjs.static.push({ type: 'text', text: text, x: 10, y: 8 + i * 8 });
                  _this.visualObjs.static.push({ type: 'rect', x: 2, y: 3 + i * 8, w: 13, h: 13, color: player_obj.color });
               });

               var active_player = !!this._ui._flag.p.length && this._ui._flag.p.reduce(function (a, b) { return a || b; });
               this._ui._flag.active = active_player;

            }
            if (obj.deck.cards) {
               this._ui._flag.cards = obj.deck.cards;
               this.visualObjs.public = obj.deck.cards && obj.deck.cards.map(function (card) {
                  var r = {
                     id: card.id, type: card.type,
                     val: card.val, layer: card.layer, w: 50, h: 50,
                     area: 'public', x: card.x, y: card.y
                  };
                  if (card.type === 'worker') {
                     r.w = 10; r.h = 10;
                  } else {
                     r.rotation = card.rotation;
                  }
                  if (card.color) r.color = card.color;
                  return r;
               }) || [];
               this.visualObjs.public = this.visualObjs.public.sort(function (a, b) {
                  return (a.layer - b.layer) || 0;
               });
            }
         }
         if (this._ui._flag.active && obj.player) {
            this.visualObjs.private = [];
            if (obj.player.card) {
               this.visualObjs.private.push({
                  area: 'private', type: 'tile',
                  val: obj.player.card.val, layer: 1,
                  x: 0.5 * this.private_w - 25,
                  y: 0.5 * this.private_h,
                  w: 50, h: 50,
                  rotation: obj.player.card.rotation
               });
            } else {
               this.visualObjs.private.push({
                  type: 'button',
                  text: 'Next',
                  area: 'private', layer: -1,
                  stable: true,
                  x: 0.5 * this.private_w - 25,
                  y: 0.5 * this.private_h,
                  w: 50, h: 50
               });
            }
            this.visualObjs.private.push({
               type: 'button',
               text: '+1',
               area: 'private', layer: -1,
               stable: true,
               x: 10, y: 10, w: 50, h: 20
            });
            this.visualObjs.private.push({
               type: 'button',
               text: '-1',
               area: 'private', layer: -1,
               stable: true,
               x: 10, y: 40, w: 50, h: 20
            });
            var index = 0, count = 7, basex;
            var workerUsed = [0, 0, 0, 0, 0, 0, 0];
            this._ui._flag.cards && this._ui._flag.cards.forEach(function (card) {
               if (card.color !== obj.player.color) return;
               if (card.id < 0 || card.id >= 7) return;
               workerUsed[card.id] = 1;
               count --;
            });
            basex = (this.private_w - 40*count + 10)/2
            workerUsed.forEach(function (used, i) {
               if (used) return;
               _this.visualObjs.private.push({
                  type: 'worker', id: i,
                  color: obj.player.color,
                  x: index * 40 + basex, y: 5, w: 30, h: 30,
                  layer: 1, area: 'private'
               });
               index ++;
            });
         } else {
            this.visualObjs.private = [];
         }
         this.visualObjs.private.push({
            type: 'button',
            text: 'Refresh',
            area: 'private', layer: -1,
            stable: true, x: 10, y: this.private_h - 30,
            w: 50, h: 20
         });
         this._ui.refresh();
         requestAnimationFrame(function () {
            _this.paint();
         });
         return true;
      }, // wsProcessMessage
      wsIsStarted: function () {
         var _this = this;
         return new Promise(function (r, e) {
            if (!_this._client.isOnline()) return r(false);

            _this._client.request({
               cmd: 'carcassonne.check',
               room: _this._room
            }, function (data) {
               if (data.started) {
                  _this._ui._flag.started = true;
               } else {
                  _this._ui._flag.started = false;
               }
               _this._ui.refresh();
               return r(_this._ui._flag.started);
            });
         });
      }, // wsIsStarted
      wsStart: function () {
         if (!this._client.isOnline()) return Promise.resolve(false);
         var _this = this;
         return new Promise(function (r, e) {
            _this._client.request({
               cmd: 'carcassonne.create',
               room: _this._room
            }, function (data) {});
            r(true);
         });
      }, // wsPokeStart
      wsOnline: function () {
         var _this = this;
         this.wsIsStarted().then(function () {
            _this.wsSync();
         });
      }, // wsOnline
      wsOffline: function () {
         this._ui._flag.started = false;
         this._ui._flag.p = [false, false, false, false];
         this._ui.refresh();
      }, // wsOffline
      wsReset: function () {
         if (!this._client.isOnline()) return Promise.resolve(false);
         var _this = this;
         return new Promise(function (r, e) {
            _this._client.request({
               cmd: 'carcassonne.reset',
               room: _this._room
            }, function (data) {});
            r(true);
         });
      }, // wsReset
      wsToggleUser: function (color) {
         if (!this._client.isOnline()) return Promise.resolve(false);
         var _this = this;
         return new Promise(function (r, e) {
            if (_this._ui._flag.players && _this._ui._flag.players.filter(function (x) {
               return x.color === color;
            })[0]) {
               _this._client.request({
                  cmd: 'carcassonne.stand',
                  room: _this._room,
                  color: color
               }, function (data) {
                  _this.wsReset();
               });
            } else {
               _this._client.request({
                  cmd: 'carcassonne.sit',
                  room: _this._room,
                  color: color
               }, function (data) {
                  _this.wsReset();
               });
            }
            r(true);
         });
      }, // wsToggleUser
      wsSync: function () {
         if (!this._client.isOnline()) return Promise.resolve(false);
         var _this = this;
         return new Promise(function (r, e) {
            _this._client.request({
               cmd: 'carcassonne.getplayer',
               room: _this._room
            }, function (data) {});
            r(true);
         });
      }, // wsSync
      wsMovePrivate: function (card) {
         if (!this._client.isOnline()) return Promise.resolve(false);
         var _this = this;
         return new Promise(function (r, e) {
            _this._client.request({
               cmd: 'carcassonne.private',
               room: _this._room,
               action: 'move',
               card: card
            }, function (data) {});
            r(true);
         });
      }, // wsPokeMovePrivate
      wsUpdateScore: function (score) {
         if (!this._client.isOnline()) return Promise.resolve(false);
         var _this = this;
         return new Promise(function (r, e) {
            _this._client.request({
               cmd: 'carcassonne.score',
               room: _this._room,
               score: score
            }, function (data) {});
            r(true);
         });
      }, // wsUpdateScore
      wsPullNextPrivateCard: function () {
         if (!this._client.isOnline()) return Promise.resolve(false);
         var _this = this;
         return new Promise(function (r, e) {
            _this._client.request({
               cmd: 'carcassonne.private',
               action: 'pull',
               room: _this._room
            }, function (data) {});
            r(true);
         });
      }, // wsPullNextPrivateCard
      wsMovePublic: function (card) {
         if (!this._client.isOnline()) return Promise.resolve(false);
         var _this = this;
         return new Promise(function (r, e) {
            _this._client.request({
               cmd: 'carcassonne.move.public',
               room: _this._room,
               card: card
            }, function (data) {});
            r(true);
         });
      }, // wsMovePublic
      wsPush: function (card) {
         if (!this._client.isOnline()) return Promise.resolve(false);
         var _this = this;
         return new Promise(function (r, e) {
            _this._client.request({
               cmd: 'carcassonne.push',
               room: _this._room,
               card: card
            }, function (data) {});
            r(true);
         });
      }, // wsPush
      wsPull: function (card) {
         if (!this._client.isOnline()) return Promise.resolve(false);
         var _this = this;
         return new Promise(function (r, e) {
            _this._client.request({
               cmd: 'carcassonne.pull',
               room: _this._room,
               card: card
            }, function (data) {});
            r(true);
         });
      }, // wsPull
      getName: function () {
         return 'carcassonne';
      },
      dispose: function () {
         console.log('carcassonne dispose');
         if (isTouchScreen()) {
            this.canvas.removeEventListener('touchstart', this.event.canvas.touchStart);
            this.canvas.removeEventListener('touchmove', this.event.canvas.touchMove);
            this.canvas.removeEventListener('touchend', this.event.canvas.touchEnd);
         } else {
            this.canvas.removeEventListener('contextmenu', this.event.canvas.contextMenu);
            this.canvas.removeEventListener('mousedown', this.event.canvas.mouseDown);
            this.canvas.removeEventListener('mouseup', this.event.canvas.mouseUp);
            this.canvas.removeEventListener('mousemove', this.event.canvas.mouseMove);
            this.canvas.removeEventListener('mouseleave', this.event.canvas.mouseLeave);
         }
         this._ui.btn.start.removeEventListener('click', this.uiEvent.click.btnStart);
         this._ui.btn.shuffle.removeEventListener('click', this.uiEvent.click.btnShffule);
         this._ui.btn.p0.removeEventListener('click', this.uiEvent.click.btnPx);
         this._ui.btn.p1.removeEventListener('click', this.uiEvent.click.btnPx);
         this._ui.btn.p2.removeEventListener('click', this.uiEvent.click.btnPx);
         this._ui.btn.p3.removeEventListener('click', this.uiEvent.click.btnPx);
         this._ui.btn.p4.removeEventListener('click', this.uiEvent.click.btnPx);

         this.dom.removeChild(this.canvas);
         this.dom.removeChild(this._ui.control);
      }
   };

   if (!window.boga) window.boga = {};
   if (!window.boga.boardgame) window.boga.boardgame = {};
   window.boga.boardgame['carcassonne'] = function () {
      return BogaCarcassonneGame;
   };
   
})();