(function () {

   var system = {
      bundle: null,
      room: location.hash
   };

   function polyfillOffset(evt) {
      return {
         x: evt.clientX,
         y: evt.clientY - 96
      };
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

   function BogaPokeGame(client, dom, w, h) {
      this._client = client;
      this.dom = dom;
      w = w || 640;
      h = h || 640;
      if (w > window.innerWidth) w = window.innerWidth;

      var canvas = document.createElement('canvas');
      this.w = w; this.h = h;
      this.public_w = w; this.public_h = 500;
      this.private_w = w; this.private_h = 140;
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      canvas.width = w;
      canvas.height = h;
      this.canvas = canvas;
      this.pen = canvas.getContext('2d');
      this.dom.appendChild(canvas);
      this.visualObjs = {
         public: [],
         private: []
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
            touchStart: function (evt) {
               var mevt = {
                  which: 1,
                  clientX: evt.touches[0].clientX,
                  clientY: evt.touches[0].clientY
               };
               _this.event.canvas.mouseDown(mevt);
            },
            touchMove: function (evt) {
               var mevt = {
                  which: 1,
                  clientX: evt.touches[0].clientX,
                  clientY: evt.touches[0].clientY
               };
               _this.event.canvas.mouseMove(mevt);
            },
            touchEnd: function (evt) {
               var mevt = {
                  clientX: evt.touches[0].clientX,
                  clientY: evt.touches[0].clientY
               };
               _this.event.canvas.mouseUp(mevt);
            }
         } // canvas
      };
      canvas.addEventListener('mousedown', this.event.canvas.mouseDown);
      canvas.addEventListener('mouseup', this.event.canvas.mouseUp);
      canvas.addEventListener('mousemove', this.event.canvas.mouseMove);
      canvas.addEventListener('mouseleave', this.event.canvas.mouseLeave);
      canvas.addEventListener('touchstart', this.event.canvas.touchStart);
      canvas.addEventListener('touchmove', this.event.canvas.touchMove);
      canvas.addEventListener('touchend', this.event.canvas.touchEnd);

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
            } else {
               ui.btn.p0.style.backgroundColor = '#dddddd';
            }
            if (ui._flag.p[1]) {
               ui.btn.p1.style.backgroundColor = '#99ff99';
            } else {
               ui.btn.p1.style.backgroundColor = '#dddddd';
            }
            if (ui._flag.p[2]) {
               ui.btn.p2.style.backgroundColor = '#99ff99';
            } else {
               ui.btn.p2.style.backgroundColor = '#dddddd';
            }
            if (ui._flag.p[3]) {
               ui.btn.p3.style.backgroundColor = '#99ff99';
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
      if (window.innerWidth < 760) {
         ui.control.style.left = (window.innerWidth - 120) + 'px';
      } else {
         ui.control.style.left = '640px';
      }
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
      ui.btn.p0.style.position = 'absolute';
      ui.btn.p1.style.position = 'absolute';
      ui.btn.p2.style.position = 'absolute';
      ui.btn.p3.style.position = 'absolute';
      ui.btn.p0.style.top = '150px';
      ui.btn.p0.style.left = '40px';
      ui.btn.p1.style.top = '120px';
      ui.btn.p1.style.left = '70px';
      ui.btn.p2.style.top = '90px';
      ui.btn.p2.style.left = '40px';
      ui.btn.p3.style.top = '120px';
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
      processWebsocketMessage: function (obj) {
         var _this = this;
         if (!this._client.isOnline()) {
            this.wsOffline();
            return;
         }
         if (obj.action) {
            switch (obj.action) {
               case 'create':
                  this._ui._flag.started = true;
                  break;
            }
         }
         if (obj.deck) {
            if (obj.deck.players) {
               this._ui._flag.p = obj.deck.players.map(function (player) {
                  return player.username === env.user.username;
               });
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
      },
      wsIsPokeStarted: function () {
         var _this = this;
         return new Promise(function (r, e) {
            if (!_this._client.isOnline()) return r(false);
            _this._client.request({
               cmd: 'poke.check',
               room: system.room
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
               room: system.room
            }, function (data) {});
            r(true);
         });
      }, // wsPokeStart
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
               room: system.room
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
                  room: system.room,
                  index: id
               }, function (data) {});
            } else {
               _this._client.request({
                  cmd: 'poke.sit',
                  room: system.room,
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
               room: system.room
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
               room: system.room,
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
               room: system.room,
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
               room: system.room,
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
               room: system.room,
               cards: cards
            }, function (data) {});
            r(true);
         });
      }, // wsPokeMovePrivate
      nop: function () {}
   };

   function BogaChat(id, filename) {
      this.id = id;
      var div = document.createElement('div');
      this.dom = {
         self: div,

         fbox: {
            self: document.createElement('div'),
            title: document.createElement('div'),
            body: document.createElement('div')
         },

         input: document.createElement('input'),
         talk: document.createElement('div'),

         onlineMark: document.createElement('button'),
         chatSpeaker: document.createElement('button'),
         chatListener: document.createElement('button'),
         chatCall: document.createElement('button')
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
            titleMouseDown: function (evt) {
               var mask = document.createElement('div');
               mask.style.position = 'fixed';
               mask.style.width = '100%';
               mask.style.height = '100%';
               mask.style.top = '0px';
               mask.style.left = '0px';
               mask.style.zIndex = 9000;
               mask.addEventListener('mousemove', _this.event.chatbox.titleDrag);
               mask.addEventListener('mouseup', _this.event.chatbox.titleDrop);
               mask.addEventListener('touchmove', _this.event.chatbox.titleTouchMove);
               mask.addEventListener('touchend', _this.event.chatbox.titleTouchEnd);
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
               mask.removeEventListener('mousemove', _this.event.chatbox.titleDrag);
               mask.removeEventListener('mouseup', _this.event.chatbox.titleDrop);
               mask.removeEventListener('touchmove', _this.event.chatbox.titleTouchMove);
               mask.removeEventListener('touchend', _this.event.chatbox.titleTouchEnd);
               mask.parentNode.removeChild(mask);
            },
            titleTouchStart: function (evt) {
               var fbox = _this.dom.fbox.self;
               var mevt = {
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
         } // chatbox
      };

      if (!system.room) {
         div.innerHTML = 'No Selected Room';
         return;
      }

      this._poke = new BogaPokeGame(system.bundle.client, this.dom.self);

      this.dom.fbox.self.style.position = 'fixed';
      this.dom.fbox.self.style.backgroundColor = 'white';
      this.dom.fbox.self.style.width = '240px';
      this.dom.fbox.self.style.top = '100px';
      this.dom.fbox.self.style.left = (window.innerWidth - 245) + 'px';
      this.dom.fbox.self.style.border = '1px solid black';
      this.dom.fbox.self.style.padding = '2px';
      this.dom.fbox.title.style.cursor = 'pointer';
      this.dom.fbox.title.innerHTML = 'ChatBox';
      this.dom.fbox.title.addEventListener('mousedown', this.event.chatbox.titleMouseDown);
      this.dom.fbox.title.addEventListener('touchstart', this.event.chatbox.titleTouchStart);
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
            _this._poke && _this._poke.wsIsPokeStarted().then(function (isStarted) {
               _this._poke.wsPokeSync();
            });
         } else {
            _this.dom.onlineMark.style.backgroundColor = '#dddddd';
            _this._poke && _this._poke.wsOffline();
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

      var tmp = document.createElement('div');
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
            system.bundle.client.request({
               cmd: 'chat.enter',
               room: room
            }, function (data) {
            });
         });

         system.bundle.client.onRoomMessage(function (obj) {
            if (obj.poke) {
               _this._poke.processWebsocketMessage(obj);
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
         this.dom.fbox.title.removeEventListener('mousedown', this.event.chatbox.titleMouseDown);
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
   
   