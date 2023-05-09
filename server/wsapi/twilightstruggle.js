const i_logger = require('../logger');
const i_chat = require('./chat');
const rooms = i_chat.getRooms();

const helper = {
   broadcast: (room, obj, filterFn) => {
      if (!room.clients) return;
      var users = filterFn?filterFn(room.clients):Object.values(room.clients);
      users.forEach((user_obj) => helper.safeSendJson(user_obj.ws, obj));
   },
   safeSendJson: (ws, json) => { try { ws.send(JSON.stringify(json)); } catch(err) {} },
};

const CARDPILE = [
   1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,
   24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,
   101,102,103,104,105,106,107,108,109,110,111,112,113,114,115,
   116,117,118,119,120,121,122,123,124,125,126,127,128,129,130,
   131,132,133,134,135,136,137,138,139,140,141,142,143,144,145,
   146,147,148,149,
   201,202,203,204,205,206,207,208,209,210,211,212,213,214,215,
   216,217,218,219,220,221,222,223,
];
const COLOR = ['red', 'green', 'blue', 'black', 'yellow', 'orange'];

class TsDeck {
   constructor() {
      this.reset();
   }

   reset() {
      this.autoid = 1;
      this.deck = {
         hasE: true,
         hasM: false,
         hasL: false,
         r: [], // remain
         d: [], // discarded
         u: [], // us hand
         s: [], // ussr hand
         e: [], // event
         i: [], // influence blocks
         dice: { x: 0, y: 0, r: 0, v: 0 },
         o: {
            turn: { x: 0, y: 0 },
            actturn: { x: 0, y: 0 },
            umo: { x: 0, y: 0 }, // us mo
            smo: { x: 0, y: 0 }, // ussr mo
            usp: { x: 0, y: 0 }, // us space
            ssp: { x: 0, y: 0 }, // ussr space
            def: { x: 0, y: 0 }, // defcon status
            scr: { x: 0, y: 0 },
         },
      };
      const cards = CARDPILE.slice().filter(x => x < 100 && x > 1);
      this.deck.s.push(1);
      this.deck.r = cards;
      this._shuffle(cards);
   }

   addM() {
      this.deck.hasM = true;
      const cards = CARDPILE.slice().filter(x => x < 200 && x > 100);
      const r = this.deck.r;
      cards.forEach(x => r.push(x));
   }
   delM() {
      this.deck.hasM = false;
      this.deck.r = this.deck.r.filter(x => x < 100 || x > 200);
   }
   addL() {
      this.deck.hasL = true;
      const cards = CARDPILE.slice().filter(x => x < 300 && x > 200);
      const r = this.deck.r;
      cards.forEach(x => r.push(x));
   }
   delL() {
      this.deck.hasL = false;
      this.deck.r = this.deck.r.filter(x => x < 200 || x > 300);
   }

   iadd(t, x, y) { // t = 0:us, 1:ussr
      if (this.deck.i.length >= 100) return null;
      const obj = { iid: this.autoid++, x, y, t, v: 1 };
      this.deck.i.push(obj);
      return obj;
   }
   iupdate(iid, x, y, v) {
      const obj = this.deck.i.find(z => z.iid === iid);
      if (!obj) return null;
      obj.v = v;
      obj.x = x;
      obj.y = y;
      return obj;
   }
   idel(iid) {
      const obj = this.deck.i.find(z => z.iid === iid);
      if (!obj) return null;
      this.deck.i.splice(this.deck.i.indexOf(obj), 1);
      return obj;
   }
   eadd(cid, x, y) {
      const item = this.deck.e.find(z => z.cid === cid);
      if (item) return this.eupdate(item.cid, x, y);
      if (this.deck.e.length >= 100) return null;
      const obj = { cid, x, y };
      this.deck.e.push(obj);
      return obj;
   }
   eupdate(cid, x, y) {
      const obj = this.deck.e.find(z => z.cid === cid);
      if (!obj) return null;
      obj.x = x;
      obj.y = y;
      return obj;
   }
   edel(cid) {
      const obj = this.deck.e.find(z => z.cid === cid);
      if (!obj) return null;
      this.deck.e.splice(this.deck.e.indexOf(obj), 1);
      return obj;
   }

   udel(cid) {
      const i = this.deck.u.indexOf(cid);
      if (i < 0) return;
      this.deck.u.splice(i, 1);
      return cid;
   }
   sdel(cid) {
      const i = this.deck.s.indexOf(cid);
      if (i < 0) return;
      this.deck.s.splice(i, 1);
      return cid;
   }
   ddel(cid) {
      const i = this.deck.d.indexOf(cid);
      if (i < 0) return;
      this.deck.d.splice(i, 1);
      return cid;
   }
   rdel(cid) {
      const i = this.deck.r.indexOf(cid);
      if (i < 0) return;
      this.deck.r.splice(i, 1);
      return cid;
   }
   uadd(cid) {
      const i = this.deck.u.indexOf(cid);
      if (i >= 0) return;
      this.deck.u.push(cid);
      return cid;
   }
   sadd(cid) {
      const i = this.deck.s.indexOf(cid);
      if (i >= 0) return;
      this.deck.s.push(cid);
      return cid;
   }
   dadd(cid) {
      const i = this.deck.d.indexOf(cid);
      if (i >= 0) return;
      this.deck.d.push(cid);
      return cid;
   }

   movedice(x, y, r, v) {
      this.deck.dice.x = x;
      this.deck.dice.y = y;
      this.deck.dice.r = r;
      this.deck.dice.v = v;
   }

   move(name, x, y) {
      const item = this.deck.o[name];
      if (!item) return;
      item.x = x;
      item.y = y;
   }

   udraw() {
      if (!this.deck.r.length) return;
      this.deck.u.push(this.deck.r.shift());
   }
   sdraw() {
      if (!this.deck.r.length) return;
      this.deck.s.push(this.deck.r.shift());
   }
   uundraw() {
      if (!this.deck.u.length) return;
      this.deck.r.unshift(this.deck.u.pop());
   }
   sundraw() {
      if (!this.deck.s.length) return;
      this.deck.r.unshift(this.deck.s.pop());
   }
   merge() {
      const r = this.deck.r;
      const d = this.deck.d;
      d.forEach(x => r.push(x));
      this.deck.d = [];
   }
   shuffle() {
      this._shuffle(this.deck.r);
   }

   _shuffle(list) {
      let n = list.length, m = list.length, tmp, p1, p2;
      for (let i = 0; i < n; i++) {
         p1 = ~~(Math.random() * m);
         p2 = ~~(Math.random() * m);
         if (p1 !== p2) {
            tmp = list[p1];
            list[p1] = list[p2];
            list[p2] = tmp;
         }
      }
   }
}

const api = {
   initialize: () => {
      i_logger.debug('[plugin] "twilight struggle" plugin loaded ...');
   },
   process: (ws, m, env, type) => {
      let obj = { id: m.id, room: m.room }, room, card;
      switch(m.cmd) {
      case 'twilightstruggle.get':
         room = rooms[m.room];
         if (!room) return 0;
         if (!room._boardgame) {
            room._boardgame = new TsDeck();
            obj = buildDeckObj(room, obj, 'get');
            helper.broadcast(room, obj);
            return 1;
         }
         obj = buildDeckObj(room, obj, 'get');
         helper.safeSendJson(ws, JSON.stringify(obj));
         return 1;
      case 'twilightstruggle.act':
         room = rooms[m.room];
         if (!room) return 0;
         if (!room._boardgame) return 1;
         switch(m.act) {
         case 'd=>r': room._boardgame.merge(); /* fallthrough */
         case 'r-r':  room._boardgame.shuffle(); break;
         case 'M=>r': room._boardgame.addM(); break;
         case 'rM=>': room._boardgame.delM(); break;
         case 'L=>r': room._boardgame.addL(); break;
         case 'rL=>': room._boardgame.delL(); break;
         case 'r->u': room._boardgame.udraw(); break;
         case 'u->r': room._boardgame.uundraw(); break;
         case 'r->s': room._boardgame.sdraw(); break;
         case 's->r': room._boardgame.sundraw(); break;
         case 'u->e': {
            card = m.card;
            if (!card) return 1;
            const cid = parseInt(card.cid);
            if (!cid) return 1;
            room._boardgame.udel(cid);
            room._boardgame.eadd(cid, parseInt(card.x), parseInt(card.y));
            break;
            }
         case 'e->u': {
            card = m.card;
            if (!card) return 1;
            const cid = parseInt(card.cid);
            if (!cid) return 1;
            room._boardgame.edel(cid);
            room._boardgame.uadd(cid);
            break;
            }
         case 's->e': {
            card = m.card;
            if (!card) return 1;
            const cid = parseInt(card.cid);
            if (!cid) return 1;
            room._boardgame.sdel(cid);
            room._boardgame.eadd(cid, parseInt(card.x), parseInt(card.y));
            break;
            }
         case 'e->s': {
            card = m.card;
            if (!card) return 1;
            const cid = parseInt(card.cid);
            if (!cid) return 1;
            room._boardgame.edel(cid);
            room._boardgame.sadd(cid);
            break;
            }
         case 'u->d': {
            card = m.card;
            if (!card) return 1;
            const cid = parseInt(card.cid);
            if (!cid) return 1;
            room._boardgame.udel(cid);
            room._boardgame.dadd(cid);
            break;
            }
         case 'd->u': {
            card = m.card;
            if (!card) return 1;
            const cid = parseInt(card.cid);
            if (!cid) return 1;
            room._boardgame.ddel(cid);
            room._boardgame.uadd(cid);
            break;
            }
         case 's->d': {
            card = m.card;
            if (!card) return 1;
            const cid = parseInt(card.cid);
            if (!cid) return 1;
            room._boardgame.sdel(cid);
            room._boardgame.dadd(cid);
            break;
            }
         case 'd->s': {
            card = m.card;
            if (!card) return 1;
            const cid = parseInt(card.cid);
            if (!cid) return 1;
            room._boardgame.ddel(cid);
            room._boardgame.sadd(cid);
            break;
            }
         case 'e->d': {
            card = m.card;
            if (!card) return 1;
            const cid = parseInt(card.cid);
            if (!cid) return 1;
            room._boardgame.edel(cid);
            room._boardgame.dadd(cid);
            break;
            }
         case 'd->e': {
            card = m.card;
            if (!card) return 1;
            const cid = parseInt(card.cid);
            if (!cid) return 1;
            room._boardgame.ddel(cid);
            room._boardgame.eadd(cid, parseInt(card.x), parseInt(card.y));
            break;
            }
         case 'e->': {
            card = m.card;
            if (!card) return 1;
            const cid = parseInt(card.cid);
            if (!cid) return 1;
            room._boardgame.eupdate(cid, card.x, card.y);
            break;
            }
         case '+i': {
            card = m.card;
            if (!card) return 1;
            room._boardgame.iadd(card.t, card.x, card.y);
            break;
            }
         case 'i->': {
            card = m.card;
            if (!card) return 1;
            const iid = parseInt(card.iid);
            if (!iid) return 1;
            room._boardgame.iupdate(iid, card.x, card.y, card.v);
            break;
            }
         case '-i': {
            card = m.card;
            if (!card) return 1;
            const iid = parseInt(card.iid);
            if (!iid) return 1;
            room._boardgame.idel(iid);
            break;
            }
         case 'dice': {
            card = m.card;
            if (!card) return 1;
            room._boardgame.movedice(card.x, card.y, card.r, card.v);
            break;
            }
         case '->': {
            card = m.card;
            if (!card) return 1;
            room._boardgame.move(card.name, card.x, card.y);
            break;
            }
         default: return 1;
         }
         obj = buildDeckObj(room, obj, 'get');
         helper.broadcast(room, obj);
         return 1;
      }

      function buildDeckObj(room, obj, name) {
         if (!room) return null;
         if (!room._boardgame) return null;
         obj.twilightstruggle = 'deck';
         obj.deck = room._boardgame.deck;
         obj.act = name;
         obj.id += '-deck';
         return obj;
      }
   },
};

module.exports = api;
