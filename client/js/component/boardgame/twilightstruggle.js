(function () {

var _style = '' +
   'body { margin: 0; padding: 0; width: 100vw; height: 100vh; overflow: hidden; } ' +
   '.flex { display: flex; flex-direction: column; } ' +
   '.onecenter { display: flex; justify-content: center; align-items: center; } ' +
   '.flex-cell { height: 0; flex: 1 0 auto; } ' +
   '.fitp { width: 100%; height: 100%; } ' +
   '.scrollable { overflow: auto; } ' +
   '.scrollable-y { overflow-y: auto; overflow-x: hidden; } ' +
   '.fixed { overflow: hidden; } ' +
   '.float { position: absolute; } ' +
   '.mask { z-index: 9990; display: block; position: fixed; top: 0; left: 0; bottom: 0; right: 0; background-color: white; opacity: 0; } ' +
   '.mask-content { z-index: 9989; display: block; position: fixed; top: 0; left: 0; bottom: 0; right: 0; } ' +
   '.hidden { display: none; } ' +
   '.dropbox { position: fixed; height: 100%; border: 1px solid black; background-color: #999; text-align: center; opacity: 0.4; } ' +
   '.dropbox > img { vertical-align: middle; } ' +
   '.menubox { position: fixed; max-width: 400px; width: 400px; background-color: white; top: 0; left: 0; bottom: 0; border: 1px solid black; } ' +
   '#menubox-mask.mask { z-index: -1; } ' +
   '.menuitem { display: block; margin-top: 2px; padding: 10px 0px 10px 10px; text-decoration: none; color: black; user-select: none; } ' +
   'a.menuitem:hover { opacity: 0.5; cursor: pointer; text-decoration: none; color: black; } ' +
   '.menuitem.grey   { background-color: #e2e2e2; } ' +
   '.menuitem.red    { background-color: #f5cdcd; } ' +
   '.menuitem.green  { background-color: #cff5cd; } ' +
   '.menuitem.blue   { background-color: #cdebf5; } ' +
   '.menuitem.yellow { background-color: #fbf59f; } ' +
   '.menuitem.orange { background-color: #ffe6cc; } ' +
   '.menuitem.pink   { background-color: #f5cde8; } ' +
   '.menuitem.purple { background-color: #dfcdf5; } ' +
   '.menuitem.gray-1 { background-color: #ddd; } ' +
   '.menuitem.gray-2 { background-color: #aaa; } ' +
   '.menuitem.gray-3 { background-color: #777; } ' +
   '.menuitem > p { margin: 0 }' +
   '.dr { user-select: none; } ' +
   '.dice { border: 1px black solid; width: 100px; height: 100px; position: absolute; background-color: white; } ' +
   '.dice > .onecenter { font-size: 5em; } ' +
   '.cardx { border: 1px black solid; width: 200px; position: absolute; background-color: white; } ' +
   '.cardx > .head > .title { font-weight: bold; } ' +
   '.info { border: 1px black solid; width: 30px; height: 30px; position: absolute; } ' +
   '.info.red { background-color: red; } ' +
   '.info.blue { background-color: blue; } ' +
   '.info.green { background-color: green; } ' +
   '.info.yellow { background-color: yellow; } ' +
   '.inf { border: 1px black solid; width: 50px; height: 50px; position: absolute; font-size: 2.3em; text-align: center; line-height: 2rem; } ' +
   '.inf.red { background-color: #f5cdcd; }' +
   '.inf.blue { background-color: #cdebf5; }';

var _html = '' +
   '<div class="flex fitp">' +
   '<div class="flex-cell"><div id="worldmap" class="fitp scrollable"><div>' +
   '  <div id="panel-card" style="position:relative;width:0;height:0;">' +
   '    <div id="dice" style="top:300px;left:350px;" class="dr dice"><div class="fitp onecenter">骰</div></div>' +
   '    <div style="top:2025px;left:1066px;" cname="def" class="dr info yellow">&nbsp;</div><!-- 核危机等级 -->' +
   '    <div style="top:1614px;left:100px;" cname="umo" class="dr info blue">&nbsp;</div> <!-- 美方军事需求 -->' +
   '    <div style="top:276px;left:1893px;" cname="smo" class="dr info red">&nbsp;</div> <!-- 苏方军事需求 -->' +
   '    <div style="top:1853px;left:2448px;" cname="scr" class="dr info green">&nbsp;</div> <!-- VP -->' +
   '    <div style="top:183px;left:669px;" cname="actturn" class="dr info green">&nbsp;</div> <!-- 回合行动轮 -->' +
   '    <div style="top:181px;left:2330px;" cname="turn" class="dr info green">&nbsp;</div> <!-- 回合 -->' +
   '    <div style="top:359px;left:2453px;" cname="usp" class="dr info blue">&nbsp;</div> <!-- 美方太空 -->' +
   '    <div style="top:414px;left:2453px;" cname="ssp" class="dr info red">&nbsp;</div> <!-- 苏方太空 -->' +
   '  </div>' +
   '  <img id="worldmap_img" src="/ts/worldmap.webp"/>' +
   '</div></div></div>' +
   '</div>' +
   '<div id="mask" class="mask hidden"></div>' +
   '<div id="mask-content" class="mask-content hidden">' +
   '  <div id="mask-hand" class="dropbox onecenter" style="top:0;left:0;width:100px;"><div><img src="/ts/hand.svg" style="width:50px;"/></div></div>' +
   '  <div id="mask-trash" class="dropbox onecenter" style="top:0;right:0;width:100px;"><div><img src="/ts/trash.svg" style="width:50px;"/></div></div>' +
   '</div>' +
   '<div id="menubox" class="menubox hidden">' +
   '<div id="menubox-mask" class="mask"></div>' +
   '  <div class="fitp scrollable-y">' +
   '    <div class="menuitem yellow">快速导航</div>' +
   '    <div><a id="btn-to-score" class="menuitem green">分数</a></div>' +
   '    <div><a id="btn-to-defcon" class="menuitem green">核危机状态</a></div>' +
   '    <div><a id="btn-to-space" class="menuitem green">太空竞赛</a></div>' +
   '    <div><a id="btn-to-umreq" class="menuitem green">美方军事需求</a></div>' +
   '    <div><a id="btn-to-smreq" class="menuitem green">苏方军事需求</a></div>' +
   '    <div><a id="btn-to-round" class="menuitem green">回合轮次</a></div>' +
   '    <div><a id="btn-to-act" class="menuitem green">回合行动轮次</a></div>' +
   '    <div><a id="btn-to-dice" class="menuitem green">骰子</a></div>' +
   '    <div><a id="btn-to-eu" class="menuitem green">欧洲</a></div>' +
   '    <div><a id="btn-to-me" class="menuitem green">中东地区</a></div>' +
   '    <div><a id="btn-to-as" class="menuitem green">亚洲</a></div>' +
   '    <div><a id="btn-to-es" class="menuitem green">东南亚地区</a></div>' +
   '    <div><a id="btn-to-sa" class="menuitem green">南美洲</a></div>' +
   '    <div><a id="btn-to-ma" class="menuitem green">中美洲</a></div>' +
   '    <div><a id="btn-to-af" class="menuitem green">非洲</a></div>' +
   '    <div class="menuitem yellow">手牌</div>' +
   '    <div>' +
   '      <a id="btn-gen-usinf" class="menuitem green">美方影响力</a>' +
   '      <a id="btn-gen-ussrinf" class="menuitem green">苏方影响力</a>' +
   '    </div>' +
   '    <div id="list-card-hand"></div>' +
   '    <div id="title-card-draw" class="menuitem yellow">抽牌堆</div>' +
   '    <div><a id="btn-card-draw" class="menuitem green">抽牌</a></div>' +
   '    <div><a id="btn-card-undraw" class="menuitem green">放回</a></div>' +
   '    <div><a id="btn-card-shuffle" class="menuitem green">洗牌</a></div>' +
   '    <div><a id="btn-card-merge" class="menuitem green">混合弃牌堆</a></div>' +
   '    <div><a id="btn-card-toggleM" class="menuitem gray-1">加入/移除冷战中期牌</a></div>' +
   '    <div><a id="btn-card-toggleL" class="menuitem gray-1">加入/移除冷战后期牌</a></div>' +
   '    <div class="menuitem yellow">弃牌堆</div>' +
   '    <div id="list-card-discard"></div>' +
   '    <div class="menuitem yellow">事件堆</div>' +
   '    <div id="list-card-event"></div>' +
   '    <div class="menuitem yellow">选边</div>' +
   '    <div><a id="btn-select-us" class="menuitem gray-1">美国</a></div>' +
   '    <div><a id="btn-select-ussr" class="menuitem gray-1">苏联</a></div>' +
   '  </div>' +
   '</div>';


var env = {
   user: window.env,
   script: null,
   CARDPILE: [],
   ui: {},
   stat: {
      worldmap: {},
      mask: {}
   }
};

function EventEmitter() { this.L = {}; }
EventEmitter.prototype = {
   addEventListener: function (name, fn) {
      if (!fn || typeof(fn) !== 'function') return;
      if (!this.L[name]) this.L[name] = [];
      this.L[name].push(fn);
   },
   removeEventListener: function (name, fn) {
      if (!fn || typeof(fn) !== 'function') return;
      var L = this.L[name];
      if (!L) return;
      var i = L.indexOf(fn);
      if (i < 0) return;
      L.splice(i, 1);
   },
   emit: function (evt) {
      if (!evt) return;
      var L = this.L[evt.type];
      if (!L) return;
      L.forEach(function (fn) { fn(evt); });
   }
};

function TsDeck() {
   this.reset();
}
TsDeck.prototype = {
   reset: function () {
      this.side = 'N';
      this.hasE = true;
      this.hasM = false;
      this.hasL = false;
      this.remainCards = env.CARDPILE.filter(function(x) { return x.stage === 'E'; });
      var cncard = this.remainCards.shift();
      this.shuffle();
      this.discardCards = [];
      this.eventCards = [];
      this.uCards = []; // US hand card
      this.sCards = [cncard]; // USSR hand card
   },
   discardCard: function (card) {
      if (this.discardCards.indexOf(card) >= 0) return;
      this.discardCards.push(card);
   },
   drawCard: function () {
      if (this.side === 'U') {
         this.drawCardForU();
      } else if (this.side === 'S') {
         this.drawCardForS();
      }
   },
   drawCardForU: function () {
      if (!this.remainCards.length) return;
      var card = this.remainCards.shift();
      this.uCards.push(card);
   },
   drawCardForS: function () {
      if (!this.remainCards.length) return;
      var card = this.remainCards.shift();
      this.sCards.push(card);
   },
   undrawCard: function (card) {
      this.remainCards.unshift(card);
   },
   toggleM: function () {
      if (this.hasM) {
         this.remainCards = this.remainCards.filter(function(x) { return x.stage !== 'M'; });
         this.discardCards = this.remainCards.filter(function(x) { return x.stage !== 'M'; });
         this.uCardsCards = this.remainCards.filter(function(x) { return x.stage !== 'M'; });
         this.sCardsCards = this.remainCards.filter(function(x) { return x.stage !== 'M'; });
      } else {
         var mcards = env.CARDPILE.filter(function(x) { return x.stage === 'M'; });
         for (var i = 0, n = mcards.length; i < n; i++) this.remainCards.push(mcards[i]);
         this.shuffle();
      }
      this.hasM = !this.hasM;
   },
   toggleL: function () {
      if (this.hasL) {
         this.remainCards = this.remainCards.filter(function(x) { return x.stage !== 'L'; });
         this.discardCards = this.remainCards.filter(function(x) { return x.stage !== 'L'; });
         this.uCardsCards = this.remainCards.filter(function(x) { return x.stage !== 'L'; });
         this.sCardsCards = this.remainCards.filter(function(x) { return x.stage !== 'L'; });
      } else {
         var lcards = env.CARDPILE.filter(function(x) { return x.stage === 'L'; });
         for (var i = 0, n = lcards.length; i < n; i++) this.remainCards.push(lcards[i]);
         this.shuffle();
      }
      this.hasL = !this.hasL;
   },
   merge: function () {
      // merge remain and discard cards
      var newlist = this.remainCards.slice();
      newlist = newlist.concat(this.discardCards);
      this.discardCards = [];
      this.remainCards = newlist;
   },
   shuffle: function () {
      var newlist = this.remainCards;
      var n = newlist.length, m = newlist.length, tmp, p1, p2;
      for (var i = 0; i < n; i++) {
         p1 = ~~(Math.random() * m);
         p2 = ~~(Math.random() * m);
         if (p1 !== p2) {
            tmp = newlist[p1];
            newlist[p1] = newlist[p2];
            newlist[p2] = tmp;
         }
      }
   }
};

var eventbus = new EventEmitter();
var deck = new TsDeck();

function on(el, name, fn) { el.addEventListener(name, fn); }
function off(el, name, fn) { el.removeEventListener(name, fn); }
function dom(sl) { return document.querySelector(sl); }
function text(txt) { return document.createTextNode(txt); };
function empty(el) { while (el.children.length) el.removeChild(el.children[0]); el.innerHTML = ''; };
function swapKlass(el, a, b) { el.classList.add(a); el.classList.remove(b); }
function move(el, x, y) {
   el.style.top = y + 'px';
   el.style.left = x + 'px';
}
function find_parent_with_klass(el, klass) {
   while (el && el.parentNode) {
      if (el.classList.contains(klass)) return el;
      el = el.parentNode;
   }
   return null;
}
function is_mobile_browser() {
   var userAgent = (navigator.userAgent || navigator.vendor || window.opera || '').toLowerCase();
   if (/android|iphone|ipod|kindle/.test(userAgent)) return true;
   return false;
}
function find_dr_parent(el) { return find_parent_with_klass(el, 'dr'); }
function find_actcard_parent(el) { return find_parent_with_klass(el, 'actcard'); }
function maskOn() {
   env.ui.mask.classList.remove('hidden');
   env.ui.maskcontent.classList.remove('hidden');
}
function maskOff() {
   env.ui.mask.classList.add('hidden');
   env.ui.maskcontent.classList.add('hidden');
}
function run_dice(el, times, interval) {
   if (!times || times <= 0) {
      env.stat.dice = 0;
      return;
   }
   clearTimeout(env.stat.dice);
   var rotate = Math.random() * 360;
   var val = Math.floor(Math.random() * 6 + 1);
   if (times === 1) {
      rotate = Math.random() * 90 - 45;
      env.stat.dicer = rotate;
      env.stat.dicev = val;
      env._client.request({
         room: env._room,
         cmd: 'twilightstruggle.act',
         act: 'dice',
         card: { x: el.offsetLeft, y: el.offsetTop, r: rotate, v: val }
      });
   }
   el.children[0].innerHTML = '' + val;
   el.style.transform = 'rotate(' + rotate + 'deg)';
   env.stat.dice = setTimeout(run_dice, interval, el, times-1, interval);
}

function build_card_on_worldmap(card) {
   var div = build_card_on_sidebar(card);
   div.className = 'actcard dr cardx';
   return div;
}
function build_card_on_sidebar(card) {
   var div = document.createElement('div');
   div.className = 'actcard';
   var side = card.type.charAt(1);
   var actval = card.type.charAt(0);
   var kcolor = side === 's' ? 'red' : (side === 'u' ? 'blue' : 'gray-1');
   var stage = card.stage === 'E' ? '冷战早期' : (card.stage === 'M' ? '冷战中期' : '冷战晚期');
   div.innerHTML = '<div class="menuitem ' + kcolor +'"><a class="menuitem ' + kcolor +'"></a><div class="menuitem purple"></div></div>';
   div.setAttribute('cid', card.id);
   div.children[0].children[0].appendChild(text(card.name));
   var body = div.children[0].children[1];
   var lines = card.desc.split('\n');
   lines.unshift((actval !== '0' ? (' (' + actval + ') / ') : '') + stage);
   lines.forEach(function (line) {
      var p = document.createElement('p');
      p.appendChild(text(line));
      body.appendChild(p);
   });
   return div;
}
function update_card_hand() {
   if (!env.ui.list_handcard) return;
   var cards = deck.side === 'U' ? deck.uCards : (deck.side === 'S' ? deck.sCards : []);
   empty(env.ui.list_handcard);
   cards.forEach(function (card) {
      var div = build_card_on_sidebar(card);
      env.ui.list_handcard.appendChild(div);
   });
}
function update_card_discard() {
   if (!env.ui.list_discardcard) return;
   var cards = deck.discardCards;
   empty(env.ui.list_discardcard);
   cards.forEach(function (card) {
      var div = build_card_on_sidebar(card);
      env.ui.list_discardcard.appendChild(div);
   });
}
function update_card_event() {
   if (!env.ui.list_eventcard) return;
   var cards = deck.eventCards;
   empty(env.ui.list_eventcard);
   cards.forEach(function (card) {
      var div = build_card_on_sidebar(card);
      env.ui.list_eventcard.appendChild(div);
   });
}
function update_card_remain_title() {
   if (!env.ui.tle_carddraw) return;
   env.ui.tle_carddraw.innerHTML = '抽牌堆 (' + deck.remainCards.length + ')';
}

function remove_worldmap_infcard(cardel) {
   var p = cardel.parentNode;
   if (!p) return;
   p.removeChild(cardel);
   env._client.request({
      room: env._room,
      cmd: 'twilightstruggle.act',
      act: '-i',
      card: { iid: parseInt(cardel.getAttribute('iid')) }
   });
}
function get_card_source(cid) {
   var one = deck.discardCards.find(function (z) { return z.id === cid; });
   if (one) return 'd';
   one = deck.uCards.find(function (z) { return z.id === cid; });
   if (one) return 'u';
   one = deck.sCards.find(function (z) { return z.id === cid; });
   if (one) return 's';
   one = deck.eventCards.find(function (z) { return z.id === cid; });
   if (one) return 'e';
   one = deck.remainCards.find(function (z) { return z.id === cid; });
   if (one) return 'r';
   return null;
}
function update_card_and_remove_virtualcard(el) {
   update_card_hand();
   update_card_discard();
   update_card_event();
   if (el.parentNode) el.parentNode.removeChild(el);
}
function picktohand_worldmap_actcard(cardel) {
   if (deck.side === 'N') return;
   var p = cardel.parentNode;
   if (!p) return;
   var cid = parseInt(cardel.getAttribute('cid'));
   var src = get_card_source(cid);
   if (!src) return update_card_and_remove_virtualcard(cardel);
   if (deck.side === 'U') {
      if (src === 'u') return update_card_and_remove_virtualcard(cardel);
      env._client.request({
         room: env._room,
         cmd: 'twilightstruggle.act',
         act: src + '->u',
         card: { cid: cid }
      });
   } else if (deck.side === 'S') {
      if (src === 's') return update_card_and_remove_virtualcard(cardel);
      env._client.request({
         room: env._room,
         cmd: 'twilightstruggle.act',
         act: src + '->s',
         card: { cid: cid }
      });
   }
}
function remove_worldmap_actcard(cardel) {
   var p = cardel.parentNode;
   if (!p) return;
   var cid = parseInt(cardel.getAttribute('cid'));
   var src = get_card_source(cid);
   if (src === 'd') return update_card_and_remove_virtualcard(cardel);
   env._client.request({
      room: env._room,
      cmd: 'twilightstruggle.act',
      act: src + '->d',
      card: { cid: cid }
   });
}

function evt_sidebar_touch_start(evt) {
   evt_sidebar_mousedown(evt);
}
function evt_sidebar_touch_move(evt) {
   var t = evt.touches[0];
   if (env.stat.sidebarDrag) {
      evt_sidebar_mousemove({ clientX: t.clientX, clientY: t.clientY });
   } else if (env.stat.selected && env.stat.touchpx) {
      var tpx = env.stat.touchpx;
      tpx.clientX = t.clientX; tpx.clientY = t.clientY;
      evt_selected_move(tpx);
   }
}
function evt_sidebar_touch_end(evt) {
   if (env.stat.sidebarDrag) {
      evt_sidebar_mouseup(evt);
   } else if (env.stat.selected) {
      if (Math.abs(evt.clientX - tpx) < 50 && Math.abs(evt.clientY - tpy) < 50) return;
      var tpx = env.stat.touchpx;
      evt_selected_move_stop(tpx);
   }
}
function evt_sidebar_mousedown(evt) {
   if (deck.side === 'N') return;
   var target = find_actcard_parent(evt.target);
   if (!target) return;
   if (evt.target.tagName.toLowerCase() !== 'a') return;
   var p = target.parentNode;
   if (p === env.ui.cardpanel) return;
   env.stat.sidebarDrag = {
      p: p,
      t: target,
      px: null
   };
}
function evt_sidebar_mousemove(evt) {
   if (!env.stat.sidebarDrag) return;
   var d = env.stat.sidebarDrag;
   var pid = d.p.getAttribute('id');
   var cid = parseInt(d.t.getAttribute('cid'));
   if (!pid || !cid) return evt_sidebar_mouseup(evt);
   if (!d.px) d.px = [evt.clientX, evt.clientY];
   var tpx = d.px[0], tpy = d.px[1];
   if (Math.abs(evt.clientX - tpx) < 50 && Math.abs(evt.clientY - tpy) < 50) return;
   env.stat.sidebarDrag = null;
   var card = env.CARDPILE.find(function (x) { return x.id === cid; });
   var cardel, x, y;
   switch (pid) {
   case 'list-card-hand':
   case 'list-card-discard':
      var cards = pid === 'list-card-discard' ? deck.discardCards : (deck.side === 'U' ? deck.uCards : (deck.side === 'S' ? deck.sCards : []));
      var update_card_fn = pid === 'list-card-discard' ? update_card_discard:update_card_hand;
      var c = cards.find(function (x) { return x.id === cid; });
      if (!c) return evt_sidebar_mouseup(evt);
      d.t.classList.add('hidden');
      document.body.appendChild(d.t);
      cardel = build_card_on_worldmap(card);
      env.ui.cardpanel.appendChild(cardel);
      x = env.ui.worldmap.scrollLeft + evt.clientX - cardel.offsetWidth / 2;
      y = env.ui.worldmap.scrollTop + evt.clientY - cardel.offsetHeight / 2;
      move(cardel, x, y);
      evt_menubox_hide();
      process_start_drag(cardel);
      env.stat.touchpx = { screenX: evt.screenX, screenY: evt.screenY, clientX: evt.clientX, clientY: evt.clientY };
      return;
   case 'list-card-event': // search in env.ui.cardpanel
      for (var i = 0, n = env.ui.cardpanel.children.length; i < n; i++) {
         var el = env.ui.cardpanel.children[i];
         if (!el.classList.contains('actcard')) continue;
         var elcid = parseInt(el.getAttribute('cid'));
         if (elcid !== cid) continue;
         cardel = el;
         x = env.ui.worldmap.scrollLeft + evt.clientX - cardel.offsetWidth / 2;
         y = env.ui.worldmap.scrollTop + evt.clientY - cardel.offsetHeight / 2;
         move(cardel, x, y);
         evt_menubox_hide();
         process_start_drag(cardel);
         env.stat.touchpx = { screenX: evt.screenX, screenY: evt.screenY, clientX: evt.clientX, clientY: evt.clientY };
         return;
      }
      // not find, invalid card actually.
   }
}
function evt_sidebar_mouseup(evt) {
   if (env.stat.sidebarDrag) {
      var d = env.stat.sidebarDrag;
      if (d.t.parentNode === document.body) d.t.parentNode.removeChild(d.t);
      env.stat.sidebarDrag = null;
   }
}

function evt_touch_start(evt) {
   var t = evt.touches[0];
   if (!t) return;
   env.stat.touchpx = {
      screenX: t.screenX,
      screenY: t.screenY,
      clientX: t.clientX,
      clientY: t.clientY,
   };
   var target = find_dr_parent(evt.target);
   if (target) {
      process_start_drag(target);
      return;
   } else {
      target = evt.target;
   }
   var m = new MouseEvent('mousedown', env.stat.touchpx);
   target.dispatchEvent(m);
}
function evt_touch_move(evt) {
   evt_menubox_show(evt);
   var tpx = env.stat.touchpx;
   var t = evt.touches[0];
   if (env.stat.selected && tpx && t) {
      tpx.screenX = t.screenX;
      tpx.screenY = t.screenY;
      tpx.clientX = t.clientX;
      tpx.clientY = t.clientY;
      var m = new MouseEvent('mousemove', tpx);
      env.ui.mask.dispatchEvent(m);
   }
}
function evt_touch_end(evt) {
   env.stat.touchdrawpx = null;
   if (!env.stat.touchpx) return;
   var m = new MouseEvent('mouseup', env.stat.touchpx);
   env.ui.mask.dispatchEvent(m);
   env.stat.touchpx = null;
}

function process_start_drag(target) {
   env.stat.mask.cmd = 'selected_drag';
   env.stat.selected = target;
   maskOn();
}
function evt_dice_move_start(evt) {
   evt.preventDefault();
   if (env.stat.selected) return;
   process_start_drag(env.ui.dice);
}
function evt_dice_run() {
   run_dice(env.ui.dice, 5, 100);
}
function evt_selected_dblclick_dispatch(evt) {
   var target = evt.detail && evt.detail.target;
   if (target.classList.contains('inf')) {
      var val = parseInt(target.getAttribute('val'));
      if (val <= 0) return;
      val --;
      env._client.request({
         room: env._room,
         cmd: 'twilightstruggle.act',
         act: 'i->',
         card: { iid: target.getAttribute('iid'), x: target.offsetLeft, y: target.offsetTop, v: val }
      });
      target.setAttribute('val', val);
      target.innerHTML = '' + val;
   }
}
function evt_selected_click_dispatch(evt) {
   var target = evt.detail && evt.detail.target;
   if (target === env.ui.dice) return evt_dice_run();
   else if (target.classList.contains('inf')) {
      var val = parseInt(target.getAttribute('val'));
      if (val >= 25) return;
      val ++;
      env._client.request({
         room: env._room,
         cmd: 'twilightstruggle.act',
         act: 'i->',
         card: { iid: target.getAttribute('iid'), x: target.offsetLeft, y: target.offsetTop, v: val }
      });
      target.setAttribute('val', val);
      target.innerHTML = '' + val;
   }
}
function moved_worldmap_card(target) {
   var cname, cid, iid, cmd, val;
   cname = target.getAttribute('cname');
   if (cname) {
      env._client.request({
         room: env._room,
         cmd: 'twilightstruggle.act',
         act: '->',
         card: { name: cname, x: target.offsetLeft, y: target.offsetTop }
      });
   } else if (target.classList.contains('inf')) {
      iid = parseInt(target.getAttribute('iid'));
      val = parseInt(target.getAttribute('val'));
      if (iid) {
         env._client.request({
            room: env._room,
            cmd: 'twilightstruggle.act',
            act: 'i->',
            card: { iid: iid, x: target.offsetLeft, y: target.offsetTop, v: val }
         });
      }
   } else if (target.classList.contains('dice')) {
      env._client.request({
         room: env._room,
         cmd: 'twilightstruggle.act',
         act: 'dice',
         card: {
            x: target.offsetLeft, y: target.offsetTop,
            r: env.stat.dicer || 0, v: env.stat.dicev || 1
         }
      });
   } else if (target.classList.contains('actcard')) {
      cid = parseInt(target.getAttribute('cid'));
      val = deck.uCards.find(function (z) { return z.id === cid; });
      if (val) {
         env._client.request({
            room: env._room,
            cmd: 'twilightstruggle.act',
            act: 'u->e',
            card: { cid: cid, x: target.offsetLeft, y: target.offsetTop }
         });
         return;
      }
      if (val = deck.sCards.find(function (z) { return z.id === cid; })) {
         env._client.request({
            room: env._room,
            cmd: 'twilightstruggle.act',
            act: 's->e',
            card: { cid: cid, x: target.offsetLeft, y: target.offsetTop }
         });
         return;
      }
      if (val = deck.discardCards.find(function (z) { return z.id === cid; })) {
         env._client.request({
            room: env._room,
            cmd: 'twilightstruggle.act',
            act: 'd->e',
            card: { cid: cid, x: target.offsetLeft, y: target.offsetTop }
         });
         return;
      }
      env._client.request({
         room: env._room,
         cmd: 'twilightstruggle.act',
         act: 'e->',
         card: { cid: cid, x: target.offsetLeft, y: target.offsetTop }
      });
   }
}
function evt_selected_move_stop(evt) {
   var target = env.stat.selected;
   if (!target) return;
   if (env.stat.selectedpx) {
      var x = evt.clientX, y = evt.clientY;
      var tx = env.stat.selectedpx[2], ty = env.stat.selectedpx[3];
      if (evt.clientX < env.ui.mask_hand.offsetWidth) { // want to put into hand card
         if (target.classList.contains('actcard') && deck.side !== 'N') {
            picktohand_worldmap_actcard(target);
         } else {
            move(target, target.offsetLeft + tx - x, target.offsetTop + ty - y);
         }
      } else if (evt.clientX > env.ui.mask.offsetWidth - env.ui.mask_trash.offsetWidth) { // want to put into discard card
         if (target.classList.contains('inf')) {
            remove_worldmap_infcard(target);
         } else if (target.classList.contains('actcard')) {
            remove_worldmap_actcard(target);
         } else {
            move(target, target.offsetLeft + tx - x, target.offsetTop + ty - y);
         }
      } else {
         moved_worldmap_card(target);
      }
   } else {
      clearTimeout(env.stat.dblclick && env.stat.dblclick.timer);
      if (env.stat.dblclick && env.stat.dblclick.target === target) {
         env.stat.dblclick.combo ++;
      } else {
         env.stat.dblclick = { timer: 0, target: target, combo: 1 };
      }
      env.stat.dblclick.timer = setTimeout(function () {
         if (!env.stat.dblclick) return;
         var obj = env.stat.dblclick;
         env.stat.dblclick = null;
         if (obj.combo === 1) {
            var newevt = new CustomEvent('click', { detail: { target: obj.target } });
            eventbus.emit(newevt);
         } else {
            var newevt = new CustomEvent('dblclick', { detail: { target: obj.target } });
            eventbus.emit(newevt);
         }
      }, 300);
   }

   env.stat.selected = null;
   env.stat.selectedpx = null;
   maskOff();
}
function evt_selected_move(evt) {
   var target = env.stat.selected
   if (!target) return;
   if (!env.stat.selectedpx) {
      env.stat.selectedpx = [evt.clientX, evt.clientY, evt.clientX, evt.clientY];
   }
   var ox = env.stat.selectedpx[0];
   var oy = env.stat.selectedpx[1];
   var x = evt.clientX, y = evt.clientY;
   env.stat.selectedpx[0] = x;
   env.stat.selectedpx[1] = y;
   var tx = target.offsetLeft + x - ox;
   var ty =  target.offsetTop + y - oy;
   var maxx = env.ui.worldmap_img.offsetWidth - target.offsetWidth;
   var maxy = env.ui.worldmap_img.offsetHeight - target.offsetHeight;
   if (tx < 0) tx = 0; else if (tx > maxx) tx = maxx;
   if (ty < 0) ty = 0; else if (ty > maxy) ty = maxy;
   if (tx === target.offsetLeft && ty === target.offsetTOp) return;
   move(target, tx, ty);
}
function evt_worldmap_pan_start(evt) {
   var target = find_dr_parent(evt.target);
   if (target) process_start_drag(target);
   if (env.stat.worldmap.pan) return;
   if (env.stat.selected) return;
   env.stat.mask.cmd = 'worldmap_pan';
   env.stat.worldmap.pan = true;
   maskOn();
}
function evt_worldmap_pan_stop(evt) {
   if (!env.stat.worldmap.pan) return;
   var px = env.stat.worldmap.panpx;
   delete env.stat.worldmap.panpx;
   env.stat.worldmap.pan = false;
   env.stat.mask.cmd = null;
   maskOff();
}
function evt_worldmap_pan_move(evt) {
   if (!env.stat.worldmap.pan) return;
   if (!env.stat.worldmap.panpx) {
      env.stat.worldmap.panpx = [evt.offsetX, evt.offsetY];
   }
   var ox = env.stat.worldmap.panpx[0];
   var oy = env.stat.worldmap.panpx[1];
   var ax = 50; var ay = ax;
   var x = evt.offsetX, y = evt.offsetY;
   if (Math.abs(x - ox) < 5 || Math.abs(y - oy) < 2) return;
   env.stat.worldmap.panpx[0] = x;
   env.stat.worldmap.panpx[1] = y;
   var w = env.ui.worldmap.offsetWidth;
   var w0 = env.ui.worldmap_img.offsetWidth; // img-worldmap
   var h = env.ui.worldmap.offsetHeight;
   var h0 = env.ui.worldmap_img.offsetHeight; // img-worldmap
   var dw = w0 - w, dh = h0 - h;
   var sx = env.ui.worldmap.scrollLeft, sy = env.ui.worldmap.scrollTop;
   if (x < ox && sx > 0) {
      ax = -ax;
   } else if (x > ox && sx < dw) {
   } else {
      ax = 0;
   }
   if (y < oy && sy > 0) {
      ay = -ay
   } else if (y > oy && sy < dh) {
   } else {
      ay = 0;
   }
   env.ui.worldmap.scrollTo(sx + ax, sy + ay);
}
function evt_mask_mouseleave(evt) {
   if (!env.stat.mask.cmd) return;
   var host = env.stat.mask[env.stat.mask.cmd];
   var fn = host && host.mouseleave;
   fn && fn(evt);
}
function evt_mask_mouseup(evt) {
   if (!env.stat.mask.cmd) return;
   var host = env.stat.mask[env.stat.mask.cmd];
   var fn = host && host.mouseup;
   fn && fn(evt);
}
function evt_mask_mousemove(evt) {
   if (!env.stat.mask.cmd) return;
   var host = env.stat.mask[env.stat.mask.cmd];
   var fn = host && host.mousemove;
   fn && fn(evt);
}
function show_menubox() {
   env.stat.displayedMenubox = true;
   env.ui.menubox.classList.remove('hidden');
}
function evt_menubox_show(evt) {
   if (env.stat.displayedMenubox) return;
   if (env.is_mobile) {
      var t = evt.touches[0];
      if (!env.stat.touchdrawpx) env.stat.touchdrawpx = [t.clientX, t.clientY];
      var tpx = env.stat.touchdrawpx;
      if (tpx[0] < 30) show_menubox();
   } else {
      // mousemove
      if (evt.clientX < 10) show_menubox();
   }
}
function evt_menubox_hide(evt) {
   env.stat.displayedMenubox = false;
   env.ui.menubox.classList.add('hidden');
}

function gen_evt_scrollto(x, y) {
   return function () {
      var w = env.ui.worldmap.offsetWidth;
      var h = env.ui.worldmap.offsetHeight;
      env.ui.worldmap.scrollTo(x - w/2, y - h/2);
   };
}
function evt_scrollto_dice(evt) {
   var w = env.ui.worldmap.offsetWidth;
   var h = env.ui.worldmap.offsetHeight;
   var w_ = env.ui.dice.offsetWidth;
   var h_ = env.ui.dice.offsetHeight;
   env.ui.worldmap.scrollTo(env.ui.dice.offsetLeft - (w-w_)/2, env.ui.dice.offsetTop - (h-h_)/2);
}

function evt_select_us(evt) {
   deck.side = 'U';
   update_card_hand();
   swapKlass(env.ui.btn_selectus, 'green', 'gray-1');
   swapKlass(env.ui.btn_selectussr, 'gray-1', 'green');
}
function evt_select_ussr(evt) {
   deck.side = 'S';
   update_card_hand();
   swapKlass(env.ui.btn_selectus, 'gray-1', 'green');
   swapKlass(env.ui.btn_selectussr, 'green', 'gray-1');
}
function evt_draw_card(evt) {
   if (deck.side === 'U') {
      env._client.request({
         room: env._room,
         cmd: 'twilightstruggle.act',
         act: 'r->u'
      });
   } else if (deck.side === 'S') {
      env._client.request({
         room: env._room,
         cmd: 'twilightstruggle.act',
         act: 'r->s'
      });
   }
}
function evt_undraw_card(evt) {
   if (deck.side === 'U') {
      env._client.request({
         room: env._room,
         cmd: 'twilightstruggle.act',
         act: 'u->r'
      });
   } else if (deck.side === 'S') {
      env._client.request({
         room: env._room,
         cmd: 'twilightstruggle.act',
         act: 's->r'
      });
   }
}
function evt_shuffle_card(evt) {
   env._client.request({
      room: env._room,
      cmd: 'twilightstruggle.act',
      act: 'r-r'
   });
}
function evt_merge_card(evt) {
   env._client.request({
      room: env._room,
      cmd: 'twilightstruggle.act',
      act: 'd=>r'
   });
}
function evt_toggleMto_card(evt) {
   if (deck.hasM) {
      env._client.request({
         room: env._room,
         cmd: 'twilightstruggle.act',
         act: 'rM=>'
      });
   } else {
      env._client.request({
         room: env._room,
         cmd: 'twilightstruggle.act',
         act: 'M=>r'
      });
   }
}
function evt_toggleLto_card(evt) {
   if (deck.hasL) {
      env._client.request({
         room: env._room,
         cmd: 'twilightstruggle.act',
         act: 'rL=>'
      });
   } else {
      env._client.request({
         room: env._room,
         cmd: 'twilightstruggle.act',
         act: 'L=>r'
      });
   }
}
function gen_inf(side, val, iid) {
   var kcolor = side === 'U' ? 'blue' : 'red';
   var div = document.createElement('div');
   div.className = 'dr inf ' + kcolor;
   div.innerHTML = '1';
   var x = env.ui.worldmap.scrollLeft + env.ui.worldmap.offsetWidth / 2;
   var y = env.ui.worldmap.scrollTop + env.ui.worldmap.offsetHeight / 2;
   div.style.left = x + 'px';
   div.style.top = y + 'px';
   div.setAttribute('val', val || '1');
   if (iid) div.setAttribute('iid', '' + iid);
   env.ui.cardpanel.appendChild(div);
   return div;
}
function evt_gen_usinf(evt) {
   var div = gen_inf('U');
   env._client.request({
      room: env._room,
      cmd: 'twilightstruggle.act',
      act: '+i',
      card: { t: 0, x: div.offsetLeft, y: div.offsetTop }
   });
   div.parentNode.removeChild(div);
}
function evt_gen_ussrinf(evt) {
   var div = gen_inf('S');
   env._client.request({
      room: env._room,
      cmd: 'twilightstruggle.act',
      act: '+i',
      card: { t: 1, x: div.offsetLeft, y: div.offsetTop }
   });
   div.parentNode.removeChild(div);
}

function register_events() {
   env.stat.mask.selected_drag = {
      mousemove: evt_selected_move,
      mouseup: evt_selected_move_stop,
      mouseleave: evt_selected_move_stop
   };
   if (env.is_mobile) {
      on(env.ui.worldmap, 'touchstart', evt_touch_start);
      on(env.ui.worldmap, 'touchmove', evt_touch_move);
      on(env.ui.worldmap, 'touchend', evt_touch_end);
      on(document.body, 'touchstart', evt_sidebar_touch_start);
      on(document.body, 'touchmove', evt_sidebar_touch_move);
      on(document.body, 'touchend', evt_sidebar_touch_end);
   } else {
      env.stat.mask.worldmap_pan = {
         mousemove: evt_worldmap_pan_move,
         mouseup: evt_worldmap_pan_stop,
         mouseleave: evt_worldmap_pan_stop
      };
      on(env.ui.worldmap, 'mousedown', evt_worldmap_pan_start);
      on(env.ui.worldmap, 'mousemove', evt_menubox_show);
      on(env.ui.menubox, 'mousedown', evt_sidebar_mousedown);
      on(env.ui.menubox, 'mousemove', evt_sidebar_mousemove);
      on(env.ui.menubox, 'mouseup', evt_sidebar_mouseup);
      on(env.ui.menubox, 'mouseleave', evt_sidebar_mouseup);
   }
   on(dom('#nav_mline'), 'click', show_menubox);
   on(eventbus, 'dblclick', evt_selected_dblclick_dispatch);
   on(eventbus, 'click', evt_selected_click_dispatch);
   on(env.ui.mask, 'mouseleave', evt_mask_mouseleave);
   on(env.ui.mask, 'mouseup', evt_mask_mouseup);
   on(env.ui.mask, 'mousemove', evt_mask_mousemove);
   on(env.ui.menubox_mask, 'click', evt_menubox_hide);

   on(env.ui.btn_toscore, 'click', gen_evt_scrollto(2448, 1853));
   on(env.ui.btn_todefcon, 'click', gen_evt_scrollto(1066, 2025));
   on(env.ui.btn_tospace, 'click', gen_evt_scrollto(2453, 387));
   on(env.ui.btn_toumreq, 'click', gen_evt_scrollto(100, 1614));
   on(env.ui.btn_tosmreq, 'click', gen_evt_scrollto(1893, 276));
   on(env.ui.btn_toround, 'click', gen_evt_scrollto(2330, 181));
   on(env.ui.btn_toact, 'click', gen_evt_scrollto(669, 183));
   on(env.ui.btn_todice, 'click', evt_scrollto_dice);
   on(env.ui.btn_toareaeu, 'click', gen_evt_scrollto(1449, 524));
   on(env.ui.btn_toareame, 'click', gen_evt_scrollto(1967, 927));
   on(env.ui.btn_toareaas, 'click', gen_evt_scrollto(3012, 909));
   on(env.ui.btn_toareaes, 'click', gen_evt_scrollto(2763, 1230));
   on(env.ui.btn_toareama, 'click', gen_evt_scrollto(511, 1146));
   on(env.ui.btn_toareasa, 'click', gen_evt_scrollto(780, 1608));
   on(env.ui.btn_toareaaf, 'click', gen_evt_scrollto(1570, 1296));

   on(env.ui.btn_selectus, 'click', evt_select_us);
   on(env.ui.btn_selectussr, 'click', evt_select_ussr);
   on(env.ui.btn_carddraw, 'click', evt_draw_card);
   on(env.ui.btn_cardundraw, 'click', evt_undraw_card);
   on(env.ui.btn_cardshuffle, 'click', evt_shuffle_card);
   on(env.ui.btn_cardmerge, 'click', evt_merge_card);
   on(env.ui.btn_cardtoggleM, 'click', evt_toggleMto_card);
   on(env.ui.btn_cardtoggleL, 'click', evt_toggleLto_card);
   on(env.ui.btn_geninfus, 'click', evt_gen_usinf);
   on(env.ui.btn_geninfussr, 'click', evt_gen_ussrinf);
}

function dispose() {
   env.stat.mask.selected_drag = null;
   if (env.is_mobile) {
      off(env.ui.worldmap, 'touchstart', evt_touch_start);
      off(env.ui.worldmap, 'touchmove', evt_touch_move);
      off(env.ui.worldmap, 'touchend', evt_touch_end);
      off(document.body, 'touchstart', evt_sidebar_touch_start);
      off(document.body, 'touchmove', evt_sidebar_touch_move);
      off(document.body, 'touchend', evt_sidebar_touch_end);
   } else {
      env.stat.mask.worldmap_pan = null;
      off(env.ui.worldmap, 'mousedown', evt_worldmap_pan_start);
      off(env.ui.worldmap, 'mousemove', evt_menubox_show);
      off(env.ui.menubox, 'mousedown', evt_sidebar_mousedown);
      off(env.ui.menubox, 'mousemove', evt_sidebar_mousemove);
      off(env.ui.menubox, 'mouseup', evt_sidebar_mouseup);
      off(env.ui.menubox, 'mouseleave', evt_sidebar_mouseup);
   }
   off(dom('#nav_mline'), 'click', show_menubox);
   off(eventbus, 'dblclick', evt_selected_dblclick_dispatch);
   off(eventbus, 'click', evt_selected_click_dispatch);
   off(env.ui.mask, 'mouseleave', evt_mask_mouseleave);
   off(env.ui.mask, 'mouseup', evt_mask_mouseup);
   off(env.ui.mask, 'mousemove', evt_mask_mousemove);
   off(env.ui.menubox_mask, 'click', evt_menubox_hide);

   off(env.ui.btn_todice, 'click', evt_scrollto_dice);

   off(env.ui.btn_selectus, 'click', evt_select_us);
   off(env.ui.btn_selectussr, 'click', evt_select_ussr);
   off(env.ui.btn_carddraw, 'click', evt_draw_card);
   off(env.ui.btn_cardundraw, 'click', evt_undraw_card);
   off(env.ui.btn_cardshuffle, 'click', evt_shuffle_card);
   off(env.ui.btn_cardmerge, 'click', evt_merge_card);
   off(env.ui.btn_cardtoggleM, 'click', evt_toggleMto_card);
   off(env.ui.btn_cardtoggleL, 'click', evt_toggleLto_card);
   off(env.ui.btn_geninfus, 'click', evt_gen_usinf);
   off(env.ui.btn_geninfussr, 'click', evt_gen_ussrinf);

   delete window.TS_CARDPILE;
}

function init() {
   env.CARDPILE = window.TS_CARDPILE;

   env.is_mobile = is_mobile_browser();
   env.ui.worldmap = dom('#worldmap');
   env.ui.worldmap_img = dom('#worldmap_img');
   env.ui.cardpanel = dom('#panel-card');
   env.ui.dice = dom('#dice');
   env.ui.mask = dom('#mask');
   env.ui.maskcontent = dom('#mask-content');
   env.ui.mask_hand = dom('#mask-hand');
   env.ui.mask_trash = dom('#mask-trash');
   env.ui.menubox = dom('#menubox');
   env.ui.menubox_mask = dom('#menubox-mask');

   env.ui.btn_toscore = dom('#btn-to-score');
   env.ui.btn_todefcon = dom('#btn-to-defcon');
   env.ui.btn_tospace = dom('#btn-to-space');
   env.ui.btn_toumreq = dom('#btn-to-umreq');
   env.ui.btn_tosmreq = dom('#btn-to-smreq');
   env.ui.btn_toround = dom('#btn-to-round');
   env.ui.btn_toact = dom('#btn-to-act');
   env.ui.btn_todice = dom('#btn-to-dice');
   env.ui.btn_toareaeu = dom('#btn-to-eu');
   env.ui.btn_toareame = dom('#btn-to-me');
   env.ui.btn_toareaas = dom('#btn-to-as');
   env.ui.btn_toareaes = dom('#btn-to-es');
   env.ui.btn_toareama = dom('#btn-to-ma');
   env.ui.btn_toareasa = dom('#btn-to-sa');
   env.ui.btn_toareaaf = dom('#btn-to-af');
   env.ui.btn_carddraw = dom('#btn-card-draw');
   env.ui.btn_cardundraw = dom('#btn-card-undraw');
   env.ui.btn_cardmerge = dom('#btn-card-merge');
   env.ui.btn_cardshuffle = dom('#btn-card-shuffle');
   env.ui.btn_cardtoggleM = dom('#btn-card-toggleM');
   env.ui.btn_cardtoggleL = dom('#btn-card-toggleL');
   env.ui.btn_geninfus = dom('#btn-gen-usinf');
   env.ui.btn_geninfussr = dom('#btn-gen-ussrinf');
   env.ui.btn_selectus = dom('#btn-select-us');
   env.ui.btn_selectussr = dom('#btn-select-ussr');

   env.ui.tle_carddraw = dom('#title-card-draw');
   env.ui.list_handcard = dom('#list-card-hand');
   env.ui.list_discardcard = dom('#list-card-discard');
   env.ui.list_eventcard = dom('#list-card-event');

   if (env.ui.worldmap.offsetWidth < 1000) {
      var sidew = env.ui.worldmap.offsetWidth / 10;
      env.ui.mask_hand.style.width = sidew + 'px';
      env.ui.mask_hand.children[0].children[0].style.width = (sidew/2) + 'px';
      env.ui.mask_trash.style.width = sidew + 'px';
      env.ui.mask_trash.children[0].children[0].style.width = (sidew/2) + 'px';
      env.ui.menubox.style.width = '300px';
   }
   register_events();
}

function ui_sync(deck0) {
console.log('[D]', deck, deck0);
   if (!env.ui.worldmap) return;
   deck.hasE = deck0.hasE;
   deck.hasM = deck0.hasM;
   deck.hasL = deck0.hasL;
   deck.remainCards = deck0.r.map(function (cid) { return env.CARDPILE.find(function (z) { return z.id === cid; }); }).filter(function(z) { return !!z; });
   deck.uCards = deck0.u.map(function (cid) { return env.CARDPILE.find(function (z) { return z.id === cid; }); }).filter(function(z) { return !!z; });
   deck.sCards = deck0.s.map(function (cid) { return env.CARDPILE.find(function (z) { return z.id === cid; }); }).filter(function(z) { return !!z; });
   deck.discardCards = deck0.d.map(function (cid) { return env.CARDPILE.find(function (z) { return z.id === cid; }); }).filter(function(z) { return !!z; });
   deck.eventCards = deck0.e.map(function (one) { return env.CARDPILE.find(function (z) { return z.id === one.cid; }); }).filter(function(z) { return !!z; });
   if (deck0.dice.v) {
      env.stat.dicev = deck0.dice.v;
      env.stat.dicer = deck0.dice.r;
      move(env.ui.dice, deck0.dice.x, deck0.dice.y);
      env.ui.dice.style.transform = 'rotate(' + deck0.dice.r + 'deg)';
      empty(env.ui.dice.children[0]);
      env.ui.dice.children[0].appendChild(text('' + deck0.dice.v));
   }
   var oldactcard = {}, oldinf = {};
   for (var i = 0, n = env.ui.cardpanel.children.length; i < n; i++) {
      var oneel = env.ui.cardpanel.children[i], one;
      var cname = oneel.getAttribute('cname');
      if (cname) {
         one = deck0.o[cname];
         if (one && one.x) {
            oneel.style.left = one.x + 'px';
            oneel.style.top = one.y + 'px';
         }
      } else if (oneel.classList.contains('inf')) {
         var iid = oneel.getAttribute('iid');
         if (oldinf[iid]) env.ui.cardpanel.removeChild(oldinf[iid]);
         oldinf[iid] = oneel;
      } else if (oneel.classList.contains('actcard')) {
         var cid = oneel.getAttribute('iid');
         if (oldactcard[cid]) env.ui.cardpanel.removeChild(oldactcard[cid]);
         oldactcard[cid] = oneel;
      }
   }
   deck0.i.forEach(function (one0) {
      var iid0 = one0.iid;
      var oneel = oldinf[iid0];
      if (oneel) {
         delete oldinf[iid0];
         empty(oneel); oneel.appendChild(text('' + one0.v));
         oneel.setAttribute('val', one0.v);
         move(oneel, one0.x, one0.y);
      } else {
         var cardel = gen_inf(one0.t === 0?'U':'S', one0.v, one0.iid);
         move(cardel, one0.x, one0.y);
      }
   });
   Object.keys(oldinf).forEach(function (k) { env.ui.cardpanel.removeChild(oldinf[k]); });
   deck0.e.forEach(function (one0) {
      var cid0 = one0.cid;
      var oneel = oldactcard[cid0];
      if (oneel) {
         delete oldactcard[cid0];
         move(oneel, one0.x, one0.y);
      } else {
         var card = env.CARDPILE.find(function (z) { return z.id === cid0; });
         var cardel = build_card_on_worldmap(card);
         env.ui.cardpanel.appendChild(cardel);
         move(cardel, one0.x, one0.y);
      }
   });
   Object.keys(oldactcard).forEach(function (k) { env.ui.cardpanel.removeChild(oldactcard[k]); });
   if (deck.hasM) swapKlass(env.ui.btn_cardtoggleM, 'green', 'gray-1');
             else swapKlass(env.ui.btn_cardtoggleM, 'gray-1', 'green');
   if (deck.hasL) swapKlass(env.ui.btn_cardtoggleL, 'green', 'gray-1');
             else swapKlass(env.ui.btn_cardtoggleL, 'gray-1', 'green');
   update_card_remain_title();
   update_card_discard();
   update_card_hand();
   update_card_event();
}

function load_card() {
   var script = document.createElement('script');
   script.src = '/ts/card.js';
   env.script = script;
   document.body.appendChild(script);
}

function wait_card_loading(n, i, r, e) {
   if (!r) {
      return new Promise(function (r, e) { wait_card_loading(n, i || 0, r, e); });
   }
   if (i >= n) {
      return e('timeout');
   }
   if (window.TS_CARDPILE) return r();
   setTimeout(wait_card_loading, 100, n, i+1, r, e);
}

// client.request({ cmd: 'ws...', room }, (data) => {});
function TsGame(client, room, dom) {
   env._client = client;
   env._room = room;
   client.bindRoom(room);
   this._self = dom;
   load_card();
   var that = this;
   wait_card_loading(50).then(function () {
      console.log('[I] card loaded ...');
      that.init();
      env._client.request({ room: env._room, cmd: 'twilightstruggle.get' });
   }, function () {
      console.log('[E] cannot load card info');
   });
}
TsGame.prototype = {
   init: function () {
      var p = this._self.parentNode;
      var pp = p.parentNode;
      var ppp = pp.parentNode;
      ppp.classList.add('flex');
      pp.classList.add('flex-cell');
      p.classList.add('fitp');
      env.style = document.createElement('style');
      env.style.innerHTML = _style;
      document.body.insertBefore(env.style, document.body.children[0]);
      this._div = document.createElement('div');
      this._div.classList.add('fitp');
      this._div.innerHTML = _html;
      this._self.appendChild(this._div);
      init();
      this.reset();
   },
   reset: function () {
      deck.reset();
      update_card_remain_title();
   },
   wsProcessMessage: function (obj) {
      if (obj.set_boardgame === '---') return false;
      if (obj.act === 'get' && obj.deck && obj.twilightstruggle) {
         ui_sync(obj.deck);
         return true;
      }
      return false;
   },
   wsOnline: function () {
   }, // wsOnline
   wsOffline: function () {
   }, // wsOffline
   getName: function () { return 'twilightstruggle' },
   dispose: function () {
      dispose();
      env.script.parentNode.removeChild(env.script);
      env.style.parentNode.removeChild(env.style);
      var p = this._self.parentNode;
      var pp = p.parentNode;
      var ppp = pp.parentNode;
      this._self.removeChild(this._div);
      p.classList.remove('fitp');
      pp.classList.remove('flex-cell');
      ppp.classList.remove('flex');
   }
};

function gen_ts_game_klass() {
   return TsGame;
}

if (!window.boga) window.boga = {};
if (!window.boga.boardgame) window.boga.boardgame = {};
window.boga.boardgame['twilightstruggle'] = gen_ts_game_klass;

})();
