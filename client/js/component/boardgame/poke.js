'use strict';

(function () {
   function isTouchScreen() {
      return 'ontouchend' in document;
   }

   function polyfillOffset(evt) {
      return {
         x: evt.clientX,
         y: evt.clientY - 96
      };
   }

   function actContextMenu(_this, evt) {
      var x = evt.clientX, y = evt.clientY;
      _this._ui.control.style.left = x + 'px';
      _this._ui.control.style.top = y + 'px';
      _this._ui.control.style.display = 'block';
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

   function BogaPokeGame(client, room, dom) {
      this._client = client;
      this._client.bindRoom(room);
      this._room = room;
      this.dom = dom;
      var w = 640, h = 640;
      if (w > window.innerWidth) w = window.innerWidth;
      if (h + 96 > window.innerHeight) h = window.innerHeight - 96;
   
      var canvas = document.createElement('canvas');
      this.w = w; this.h = h;
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
      this.makeElementBuffer();
      var _this = this;
      requestAnimationFrame(function () {
         _this.paint();
      });
   
      this.event = {
         canvas: {
            selected: [],
            dragOffset: { px: 0, py: 0 },
            dragImageBuffer: null,
            dragStableObject: false,
            mouseClickCount: 0,
            mouseDownTimer: null,
            mouseUpTimer: null,
            touchCache: { x: 0, y: 0 },
            drop: function (evt) {
               var cur = polyfillOffset(evt);
               var selected = _this.event.canvas.selected.slice();
               if (!selected || !selected.length) return;
               if (_this.event.canvas.dragStableObject) return;
               var area, areaName;
               if (cur.y > _this.public_h) {
                  area = _this.visualObjs.private;
                  areaName = 'private';
               } else {
                  area = _this.visualObjs.public;
                  areaName = 'public';
               }
               var selectedFirst = selected[0];
               var moveMode = null;
               if (selectedFirst) {
                  if (areaName === 'private' && selectedFirst.area === 'private') {
                     moveMode = 'p-p';
                  } else if (areaName === 'private' && selectedFirst.area === 'public') {
                     moveMode = 'P-p';
                  } else if (areaName === 'public' && selectedFirst.area === 'private') {
                     moveMode = 'p-P';
                  } else if (areaName === 'public' && selectedFirst.area === 'public') {
                     moveMode = 'P-P';
                  }
               }
               selected.reverse().forEach(function (one) {
                  one.y += cur.y - _this.event.canvas.dragOffset.py;
                  one.x += cur.x - _this.event.canvas.dragOffset.px;
                  if (one.area !== areaName) {
                     one.area = areaName;
                     if (areaName === 'private') {
                        one.y -= _this.public_h
                     } else {
                        one.y += _this.public_h
                     }
                  }
                  area.push(one);
               });
               switch(moveMode) {
                  case 'p-p':
                     _this.wsPokeMovePrivate(selected.map(function (card) {
                        return {
                           id: card.id,
                           val: card.val,
                           x: card.x / _this.private_w,
                           y: card.y / _this.private_h
                        };
                     }));
                     break;
                  case 'P-p':
                     _this.wsPokePull(selected.map(function (card) {
                        return {
                           id: card.id,
                           val: card.val,
                           x: card.x / _this.private_w,
                           y: card.y / _this.private_h
                        };
                     }));
                     break;
                  case 'p-P':
                     _this.wsPokePush(selected.map(function (card) {
                        return {
                           id: card.id,
                           val: card.val,
                           x: card.x / _this.public_w,
                           y: card.y / _this.public_h
                        };
                     }));
                     break;
                  case 'P-P':
                     _this.wsPokeMovePublic(selected.map(function (card) {
                        return {
                           id: card.id,
                           val: card.val,
                           x: card.x / _this.public_w,
                           y: card.y / _this.public_h
                        };
                     }));
                     break;
               }
               requestAnimationFrame(function () {
                  _this.paint();
                  _this.event.canvas.dragImageBuffer = null;
               });
            },
            drag: function (evt) {
               // drag start -> mousemove
               var cur = polyfillOffset(evt);
               var selected = _this._select(cur.x, cur.y);
               if (!selected) {
                  _this.event.canvas.selected = [];
               } else if (_this.event.canvas.selected.indexOf(selected) < 0) {
                  _this.event.canvas.selected = [selected];
               }
               if (_this.event.canvas.selected && _this.event.canvas.selected.length) {
                  _this.event.canvas.dragStableObject = !_this.event.canvas.selected.map(
                     function (x) { return !x.stable; }
                  ).reduce(
                     function (a, b) { return a && b; }
                  );
               } else {
                  _this.event.canvas.dragStableObject = true;
               }
               if (!_this.event.canvas.dragStableObject) {
                  var objs = _this._selectArea(cur.x, cur.y);
                  _this.event.canvas.selected.forEach(function (selected) {
                     var index = objs.indexOf(selected);
                     objs.splice(index, 1);
                  });
                  _this.event.canvas.dragOffset.px = cur.x;
                  _this.event.canvas.dragOffset.py = cur.y;
               }
               requestAnimationFrame(function () {
                  _this.paint();
                  _this.event.canvas.dragImageBuffer = _this._to_img(_this.canvas);
               });
            },
            click: function (evt) {
               var cur = polyfillOffset(evt);
               var selected = _this._select(cur.x, cur.y);
               if (selected) {
                  var objs = _this._selectArea(cur.x, cur.y);
                  var index = objs.indexOf(selected);
                  objs.splice(index, 1);
                  objs.push(selected);
                  _this.event.canvas.selected = [selected];
               } else {
                  _this.event.canvas.selected = [];
               }
               requestAnimationFrame(function () {
                  _this.paint();
               });
            },
            doubleClick: function (evt) {
               var cur = polyfillOffset(evt);
               var selected = _this._select(cur.x, cur.y);
               if (!selected) {
                  _this.event.canvas.selected = [];
                  requestAnimationFrame(function () {
                     _this.paint();
                  });
                  if (isTouchScreen()) {
                     actContextMenu(_this, evt);
                  }
                  return;
               }
               var objs = _this._selectArea(cur.x, cur.y);
               var group = [{ index: objs.indexOf(selected), elem: selected }];
               if (objs === _this.visualObjs.private) {
                  objs = objs.slice();
                  objs.splice(objs.indexOf(selected), 1);
                  objs = objs.map(function (x, i) { return { index: i, elem: x }; });
                  var changed = false;
                  do {
                     var filterin = [], filterout = [], pushed = false;
                     objs.forEach(function (one) {
                        pushed = false;
                        for(var i = 0, n = group.length; i < n; i++) {
                           if (_this._cross(one.elem, group[i].elem)) {
                              filterin.push(one);
                              pushed = true;
                              break;
                           }
                        }
                        if (!pushed) filterout.push(one);
                     });
                     objs = filterout;
                     filterin.forEach(function (x) { group.push(x); });
                     changed = !!filterin.length;
                  } while (changed);
               }
               group = group.sort(function (a, b) { return b.index - a.index; });
               _this.event.canvas.selected = group.map(function (one) { return one.elem; });
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
               var cur = polyfillOffset(evt);
               // dragmove + evt.button === 1
               if (evt.which === 1) {
                  // drag move
                  var selected = _this.event.canvas.selected.slice();
                  if (selected && selected.length) {
                     if (_this.event.canvas.dragStableObject) return;
                     if (!_this.event.canvas.dragImageBuffer) return;
                     requestAnimationFrame(function () {
                        if (!selected || !selected.length) return;
                        _this.pen.clearRect(0, 0, _this.w, _this.h);
                        if (_this.event.canvas.dragImageBuffer) {
                           _this.pen.drawImage(_this.event.canvas.dragImageBuffer, 0, 0);
                        }
                        _this.pen.save();
                        if (selected[0].area === 'private') {
                           _this.pen.translate(0, _this.public_h);
                        }
                        selected.reverse().forEach(function (one) {
                           var x = one.x, y = one.y;
                           one.y += cur.y - _this.event.canvas.dragOffset.py;
                           one.x += cur.x - _this.event.canvas.dragOffset.px;
                           _this._paintElement(one);
                           one.y = y; one.x = x;
                        });
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
            p: [false, false, false, false]
         },
         refresh: function () {
            if (ui._flag.started) {
               ui.btn.start.style.backgroundColor = '#99ff99';
            } else {
               ui.btn.start.style.backgroundColor = '#dddddd';
            }
            ui.btn.shuffle.style.backgroundColor = '#dddddd';
            if (ui._flag.p[0]) {
               ui.btn.p0.style.backgroundColor = '#99ff99';
            } else if (ui._flag.players && ui._flag.players[0].username) {
               ui.btn.p0.style.backgroundColor = '#ffdddd';
            } else {
               ui.btn.p0.style.backgroundColor = '#dddddd';
            }
            if (ui._flag.p[1]) {
               ui.btn.p1.style.backgroundColor = '#99ff99';
            } else if (ui._flag.players && ui._flag.players[1].username) {
               ui.btn.p1.style.backgroundColor = '#ffdddd';
            } else {
               ui.btn.p1.style.backgroundColor = '#dddddd';
            }
            if (ui._flag.p[2]) {
               ui.btn.p2.style.backgroundColor = '#99ff99';
            } else if (ui._flag.players && ui._flag.players[2].username) {
               ui.btn.p2.style.backgroundColor = '#ffdddd';
            } else {
               ui.btn.p2.style.backgroundColor = '#dddddd';
            }
            if (ui._flag.p[3]) {
               ui.btn.p3.style.backgroundColor = '#99ff99';
            } else if (ui._flag.players && ui._flag.players[3].username) {
               ui.btn.p3.style.backgroundColor = '#ffdddd';
            } else {
               ui.btn.p3.style.backgroundColor = '#dddddd';
            }
         },
         control: document.createElement('div'),
         btn: {
            start: document.createElement('button'),
            shuffle: document.createElement('button'),
            p0: document.createElement('button'),
            p1: document.createElement('button'),
            p2: document.createElement('button'),
            p3: document.createElement('button')
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
      ui.btn.shuffle.innerHTML = 'Shuffle';
      ui.btn.shuffle.style.width = '100%';
      ui.btn.p0.innerHTML = 'A';
      ui.btn.p1.innerHTML = 'B';
      ui.btn.p2.innerHTML = 'C';
      ui.btn.p3.innerHTML = 'D';
      ui.btn.p0.style.display = 'block';
      ui.btn.p1.style.display = 'block';
      ui.btn.p2.style.display = 'block';
      ui.btn.p3.style.display = 'block';
      ui.btn.p0.style.position = 'relative';
      ui.btn.p1.style.position = 'relative';
      ui.btn.p2.style.position = 'relative';
      ui.btn.p3.style.position = 'relative';
      ui.btn.p0.style.top = '61px';
      ui.btn.p0.style.left = '40px';
      ui.btn.p1.style.top = '3px';
      ui.btn.p1.style.left = '69px';
      ui.btn.p2.style.top = '-55px';
      ui.btn.p2.style.left = '40px';
      ui.btn.p3.style.top = '-55px';
      ui.btn.p3.style.left = '10px';
      ui.btn.p0.setAttribute('data-id', '0');
      ui.btn.p1.setAttribute('data-id', '1');
      ui.btn.p2.setAttribute('data-id', '2');
      ui.btn.p3.setAttribute('data-id', '3');
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
      ui.control.appendChild(tmp);
      ui.refresh();
      this.dom.appendChild(ui.control);
      this.uiEvent = {
         click: {
            btnStart: function () {
               _this.wsIsPokeStarted().then(function (is_started) {
                  if (is_started) return;
                  _this.wsPokeStart();
               });
            },
            btnShffule: function () {
               _this.wsPokeShuffle();
            },
            btnPx: function (evt) {
               var id = parseInt(evt.target.getAttribute('data-id'));
               _this.wsPokeToggleUser(id);
            }
         } // click
      };
      ui.btn.start.addEventListener('click', this.uiEvent.click.btnStart);
      ui.btn.shuffle.addEventListener('click', this.uiEvent.click.btnShffule);
      ui.btn.p0.addEventListener('click', this.uiEvent.click.btnPx);
      ui.btn.p1.addEventListener('click', this.uiEvent.click.btnPx);
      ui.btn.p2.addEventListener('click', this.uiEvent.click.btnPx);
      ui.btn.p3.addEventListener('click', this.uiEvent.click.btnPx);
      this.wsIsPokeStarted().then(function (isStarted) {
         if (isStarted) _this.wsPokeSync();
      });
   }
   BogaPokeGame.prototype = {
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
      _selectArea: function (x, y) {
         if (y > this.public_h) {
            return this.visualObjs.private;
         } else {
            return this.visualObjs.public;
         }
      },
      _select: function (x, y) {
         if (y > this.public_h) {
            return this._selectInArea(x, y - this.public_h, this.visualObjs.private);
         } else {
            return this._selectInArea(x, y, this.visualObjs.public);
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
               case 'card':
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
         this.imageBuf = {};
         var tc = document.createElement('canvas');
         var w = 30, h = 40;
         tc.width = w; tc.height = h;
         var p = tc.getContext('2d');
         var t = [
            ['♠', 'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'],
            ['♥', 'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'],
            ['♣', 'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'],
            ['♦', 'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']
         ];
         for (var i = 1; i < t[0].length; i++) {
            p.clearRect(0, 0, w, h);
            p.strokeStyle = 'black';
            p.fillStyle = 'white';
            p.rect(0, 0, w, h);
            p.fill();
            p.stroke();
            p.fillStyle = 'black';
            p.fillText(t[0][i], 5, 12);
            p.fillText(t[0][0], 4, 24);
            this.imageBuf['a' + i] = this._to_img(tc);
         }
         for (var i = 1; i < t[1].length; i++) {
            p.clearRect(0, 0, w, h);
            p.strokeStyle = 'black';
            p.fillStyle = 'white';
            p.rect(0, 0, w, h);
            p.fill();
            p.stroke();
            p.fillStyle = 'red';
            p.fillText(t[1][i], 5, 12);
            p.fillText(t[1][0], 4, 24);
            this.imageBuf['b' + i] = this._to_img(tc);
         }
         for (var i = 1; i < t[2].length; i++) {
            p.clearRect(0, 0, w, h);
            p.strokeStyle = 'black';
            p.fillStyle = 'white';
            p.rect(0, 0, w, h);
            p.fill();
            p.stroke();
            p.fillStyle = 'black';
            p.fillText(t[2][i], 5, 12);
            p.fillText(t[2][0], 4, 24);
            this.imageBuf['c' + i] = this._to_img(tc);
         }
         for (var i = 1; i < t[3].length; i++) {
            p.clearRect(0, 0, w, h);
            p.strokeStyle = 'black';
            p.fillStyle = 'white';
            p.rect(0, 0, w, h);
            p.fill();
            p.stroke();
            p.fillStyle = 'red';
            p.fillText(t[3][i], 5, 12);
            p.fillText(t[3][0], 4, 24);
            this.imageBuf['d' + i] = this._to_img(tc);
         }
         {
            p.clearRect(0, 0, w, h);
            p.strokeStyle = 'black';
            p.fillStyle = 'white';
            p.rect(0, 0, w, h);
            p.fill();
            p.stroke();
            p.fillStyle = 'black';
            p.fillText('Joker', 2, 12);
            this.imageBuf['j'] = this._to_img(tc);
            p.fillStyle = 'red';
            p.fillText('Joker', 2, 12);
            this.imageBuf['J'] = this._to_img(tc);
         }
      },
      paint: function () {
         this.pen.clearRect(0, 0, this.w, this.h);
   
         this._paintPublic();
         this._paintPrivate();
         this.pen.strokeStyle = 'black';
         this.pen.rect(0, 0, this.w, this.h);
         this.pen.stroke();
      },
      _paintPublic: function () {
         var _this = this;
         var public_objs = this.visualObjs.public;
         this.pen.save();
         this.pen.strokeStyle = 'black';
         this.pen.fillStyle = 'white';
         this.pen.fillRect(0, 0, this.public_w, this.public_h);
         this.pen.rect(0, 0, this.public_w, this.public_h);
         this._paintStatic();
         public_objs.forEach(function (obj) {
            _this._paintElement(obj);
         });
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
            var rect = _this.pen.measureText(obj.text);
            var x = obj.x * _this.public_w, y = obj.y * _this.public_h;
            if (x - rect.width/2 - 1 < 0) x = rect.width/2 + 1;
            if (x + rect.width + 5 > _this.public_w) x = _this.public_w - rect.width - 5;
            if (y - 18 < 0) y = 18;
            if (y + 9 > _this.public_h) y = _this.public_h - 9;
            _this.pen.fillText(obj.text, x, y);
         });
         this.pen.restore();
      },
      _paintElement: function (obj) {
         this.pen.save();
         this.pen.translate(obj.x, obj.y);
         var elem;
         switch(obj.type) {
            case 'card':
               elem = this.imageBuf[obj.val];
               this.pen.drawImage(elem, 0, 0);
               if (this.event.canvas.selected.indexOf(obj) >= 0) {
                  this.pen.fillStyle = 'rgba(255,255,255,0.5)';
                  this.pen.fillRect(0, 0, obj.w, obj.h);
               }
               break;
         }
         this.pen.restore();
      },
      _rotateCards: function(cards, index) {
         if (index <= 0) return;
         if (index === 2) {
            cards.forEach(function (card) {
               var x = card.x, y = card.y;
               card.x = 1 - x; card.y = 1 - y;
            });
            return;
         }
         if (index === 1) {
            cards.forEach(function (card) {
               var x = card.x, y = card.y;
               card.x = 1 - y; card.y = x;
            });
            return;
         }
         if (index === 3) {
            cards.forEach(function (card) {
               var x = card.x, y = card.y;
               card.x = y; card.y = 1 - x;
            });
            return;
         }
      },
      wsProcessMessage: function (obj) {
         var _this = this;
         if (!this._client.isOnline()) {
            this.wsOffline();
            return false;
         }
         if (!obj.poke) return false;
         if (obj.action) {
            switch (obj.action) {
               case 'create':
                  this._ui._flag.started = true;
                  break;
            }
         }
         if (obj.deck) {
            if (obj.deck.players) {
               this._ui._flag.players = obj.deck.players;
               this._ui._flag.p = obj.deck.players.map(function (player, i) {
                  return player.username === env.user.username;
               });
   
               this.visualObjs.static = [];
               var text, player_obj;
               player_obj = obj.deck.players[0];
               text = '( ' + player_obj.cardcount + ' )';
               if (player_obj.username) text = player_obj.username + ': ' + text;
               this.visualObjs.static.push({ type: 'text', text: text, x: 0.5, y: 1 });
               player_obj = obj.deck.players[1];
               text = '( ' + player_obj.cardcount + ' )';
               if (player_obj.username) text = player_obj.username + ': ' + text;
               this.visualObjs.static.push({ type: 'text', text: text, x: 1, y: 0.5 });
               player_obj = obj.deck.players[2];
               text = '( ' + player_obj.cardcount + ' )';
               if (player_obj.username) text = player_obj.username + ': ' + text;
               this.visualObjs.static.push({ type: 'text', text: text, x: 0.5, y: 0 });
               player_obj = obj.deck.players[3];
               text = '( ' + player_obj.cardcount + ' )';
               if (player_obj.username) text = player_obj.username + ': ' + text;
               this.visualObjs.static.push({ type: 'text', text: text, x: 0, y: 0.5 });
               this._rotateCards(this.visualObjs.static, this._ui._flag.p.indexOf(true));
            }
            if (obj.deck.cards) {
               obj.deck.cards && _this._rotateCards(obj.deck.cards, _this._ui._flag.p.indexOf(true));
               this.visualObjs.public = obj.deck.cards && obj.deck.cards.map(function (card) {
                  var r = {
                     id: card.id,
                     type: 'card',
                     val: card.val,
                     layer: 0, w: 30, h: 40,
                     area: 'public',
                     x: ~~(card.x * _this.public_w),
                     y: ~~(card.y * _this.public_h)
                  };
                  if (r.x + r.w >= _this.public_w) r.x = _this.public_w - r.w;
                  if (r.y + r.h >= _this.public_h) r.y = _this.public_h - r.h;
                  return r;
               }) || [];
            }
         }
         if (obj.player) {
            this.visualObjs.private = obj.player.cards && obj.player.cards.map(function (card) {
               var r = {
                  id: card.id,
                  type: 'card',
                  val: card.val,
                  layer: 0, w: 30, h: 40,
                  area: 'private',
                  x: ~~(card.x * _this.private_w),
                  y: ~~(card.y * _this.private_h)
               };
               if (r.x + r.w >= _this.private_w) r.x = _this.private_w - r.w;
               if (r.y + r.h >= _this.private_h) r.y = _this.private_h - r.h;
               return r;
            }) || [];
         } else if (!this._ui._flag.p.reduce(function (a, b) { return a || b; })) {
            this.visualObjs.private = [];
         }
         this._ui.refresh();
         requestAnimationFrame(function () {
            _this.paint();
         });
         return true;
      },
      wsIsPokeStarted: function () {
         var _this = this;
         return new Promise(function (r, e) {
            if (!_this._client.isOnline()) return r(false);

            _this._client.request({
               cmd: 'poke.check',
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
      }, // wsIsPokeStarted
      wsPokeStart: function () {
         if (!this._client.isOnline()) return Promise.resolve(false);
         var _this = this;
         return new Promise(function (r, e) {
            _this._client.request({
               cmd: 'poke.create',
               room: _this._room
            }, function (data) {});
            r(true);
         });
      }, // wsPokeStart
      wsOnline: function () {
         var _this = this;
         this.wsIsPokeStarted().then(function () {
            _this.wsPokeSync();
         });
      },
      wsOffline: function () {
         this._ui._flag.started = false;
         this._ui._flag.p = [false, false, false, false];
         this._ui.refresh();
      }, // wsOffline
      wsPokeShuffle: function () {
         if (!this._client.isOnline()) return Promise.resolve(false);
         var _this = this;
         return new Promise(function (r, e) {
            _this._client.request({
               cmd: 'poke.shuffle',
               room: _this._room
            }, function (data) {});
            r(true);
         });
      },
      wsPokeToggleUser: function (id) {
         if (!this._client.isOnline()) return Promise.resolve(false);
         var _this = this;
         return new Promise(function (r, e) {
            if (_this._ui._flag.p[id]) {
               _this._client.request({
                  cmd: 'poke.stand',
                  room: _this._room,
                  index: id
               }, function (data) {});
            } else {
               _this._client.request({
                  cmd: 'poke.sit',
                  room: _this._room,
                  index: id
               }, function (data) {});
            }
            r(true);
         });
      }, // wsPokeToggleUser
      wsPokeSync: function () {
         if (!this._client.isOnline()) return Promise.resolve(false);
         var _this = this;
         return new Promise(function (r, e) {
            _this._client.request({
               cmd: 'poke.getplayer',
               room: _this._room
            }, function (data) {});
            r(true);
         });
      },
      wsPokeMovePrivate: function (cards) {
         if (!this._client.isOnline()) return Promise.resolve(false);
         var _this = this;
         return new Promise(function (r, e) {
            _this._client.request({
               cmd: 'poke.move.private',
               room: _this._room,
               cards: cards
            }, function (data) {});
            r(true);
         });
      }, // wsPokeMovePrivate
      wsPokeMovePublic: function (cards) {
         if (!this._client.isOnline()) return Promise.resolve(false);
         var _this = this;
         return new Promise(function (r, e) {
            _this._client.request({
               cmd: 'poke.move.public',
               room: _this._room,
               cards: cards
            }, function (data) {});
            r(true);
         });
      }, // wsPokeMovePrivate
      wsPokePush: function (cards) {
         if (!this._client.isOnline()) return Promise.resolve(false);
         var _this = this;
         return new Promise(function (r, e) {
            _this._client.request({
               cmd: 'poke.push',
               room: _this._room,
               cards: cards
            }, function (data) {});
            r(true);
         });
      }, // wsPokeMovePrivate
      wsPokePull: function (cards) {
         if (!this._client.isOnline()) return Promise.resolve(false);
         var _this = this;
         return new Promise(function (r, e) {
            _this._client.request({
               cmd: 'poke.pull',
               room: _this._room,
               cards: cards
            }, function (data) {});
            r(true);
         });
      }, // wsPokeMovePrivate
      getName: function () {
         return 'poke';
      },
      dispose: function () {
         console.log('poke dispose');
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

         this.dom.removeChild(this.canvas);
         this.dom.removeChild(this._ui.control);
      }
   };

   if (!window.boga) window.boga = {};
   if (!window.boga.boardgame) window.boga.boardgame = {};
   window.boga.boardgame['poke'] = function () {
      return BogaPokeGame;
   };
   
})();