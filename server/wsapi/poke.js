const i_logger = require('../logger');
const i_chat = require('./chat');
const rooms = i_chat.getRooms();

const helper = {
   broadcast: (room, obj, filterFn) => {
      if (!room.clients) return;
      var users = filterFn?filterFn(room.clients):Object.values(room.clients);
      users.forEach((user_obj) => {
         if (user_obj.ws.readyState !== user_obj.ws.OPEN) return;
         user_obj.ws.send(JSON.stringify(obj));
      });
   },
};

const CARDPILE = [
   'a1', 'a2', 'a3', 'a4', 'a5', 'a6', 'a7', 'a8', 'a9', 'a10', 'a11', 'a12', 'a13',
   'b1', 'b2', 'b3', 'b4', 'b5', 'b6', 'b7', 'b8', 'b9', 'b10', 'b11', 'b12', 'b13',
   'c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7', 'c8', 'c9', 'c10', 'c11', 'c12', 'c13',
   'd1', 'd2', 'd3', 'd4', 'd5', 'd6', 'd7', 'd8', 'd9', 'd10', 'd11', 'd12', 'd13',
   'j', 'J',
];

class PokeDeck {
   constructor(options) {
      this.N = 2; // 2 piles of cards; 1 pile has 54 cards
      this.players = [{}, {}, {}, {}]; // 4 players
      this.deck = {};
   }

   setPlayer(index, username) {
      let player = this.players[index];
      if (!player) return;
      player.username = username;
   }

   getPlayerByUsername(username) {
      return this.players.filter((x) => x.username === username)[0];
   }

   _confineCard(card) {
      if (card.x < 0) card.x = 0;
      if (card.x > 1) card.x = 1;
      if (card.x < 0) card.x = 0;
      if (card.x > 1) card.x = 1;
   }

   /*      p2
         ------
      p3 |    | p1
         ------
           p0
    */
   _rotateCards(username, cards) {
      let player_index = -1;
      for (let i = 0, n = this.players.length; i < n; i++) {
         if (this.players[i].username === username) {
            player_index = i;
            break;
         }
      }
      if (player_index < 0) return null;
      switch (player_index) {
         case 0: break;
         case 1:
            cards.forEach((card) => {
               var x = card.x, y = card.y;
               card.x = y; card.y = 1 - x;
            });
            break;
         case 2:
            cards.forEach((card) => {
               var x = card.x, y = card.y;
               card.x = 1 - x; card.y = y;
            });
            break;
         case 3:
            cards.forEach((card) => {
               var x = card.x, y = card.y;
               card.x = 1 - y; card.y = 1 - x;
            });
            break;
         default: return null;
      }
      return cards;
   }

   pushCards(username, cards) {
      let player = this.getPlayerByUsername(username);
      if (!player) return;
      if (!player.cards) return;
      cards.forEach((card) => this._confineCard(card));
      let map = {};
      cards.forEach((card) => { map[card.id] = card; card._ = false; });
      let filterin = [];
      player.cards.forEach((card) => {
         if (map[card.id]) {
            map[card.id]._ = true;
         } else {
            filterin.push(card);
         }
      });
      player.cards = filterin;
      cards = this._rotateCards(username, cards);
      cards = cards && cards.filter((card) => { let r = card._; delete card._; return r; });
      cards && cards.forEach((card) => this.deck.cards.push(card));
   }

   pullCards(username, cards) {
      let player = this.getPlayerByUsername(username);
      if (!player) return;
      if (!player.cards) return;
      cards.forEach((card) => this._confineCard(card));
      let map = {};
      cards.forEach((card) => { map[card.id] = card; card._ = false; });
      let filterin = [];
      this.deck.cards.forEach((card) => {
         if (map[card.id]) {
            map[card.id]._ = true;
         } else {
            filterin.push(card);
         }
      });
      this.deck.cards = filterin;
      cards = cards.filter((card) => { let r = card._; delete card._; return r; });
      cards.forEach((card) => player.cards.push(card));
   }

   moveCards(username, cards) {
      let player = this.getPlayerByUsername(username);
      if (!player) return;
      if (!player.cards) return;
      cards.forEach((card) => this._confineCard(card));
      let map = {};
      player.cards.forEach((card) => { map[card.id] = card; });
      cards.forEach((card) => {
         let mapcard = map[card.id];
         if (!mapcard) return;
         let index = player.cards.indexOf(mapcard);
         player.cards.splice(index, 1);
         player.cards.push(mapcard);
         mapcard.x = card.x;
         mapcard.y = card.y;
      });
   }

   moveCardOnDeck(username, cards) {
      let player = this.getPlayerByUsername(username);
      if (!player) return;
      cards.forEach((card) => this._confineCard(card));
      let map = {};
      this.deck.cards.forEach((card) => { map[card.id] = card; });
      cards = this._rotateCards(username, cards);
      cards && cards.forEach((card) => {
         let mapcard = map[card.id];
         if (!mapcard) return;
         let index = this.deck.cards.indexOf(mapcard);
         this.deck.cards.splice(index, 1);
         this.deck.cards.push(mapcard);
         mapcard.x = card.x;
         mapcard.y = card.y;
      });
   }

   shuffle(type) {
      switch(type) {
         case 'guandan':
            return this._shuffleGuanDan();
      }
   }

   _shuffle(list) {
      let n = ~~(list.length/2), m = list.length, tmp, p1, p2;
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

   _shuffleGuanDan() {
      let cards = [];
      for (let i = 0; i < this.N; i++) {
         cards = cards.concat(CARDPILE);
      }
      let n = cards.length, part = n / 4;
      this._shuffle(cards);
      for (let i = 0; i < 4; i++) {
         this.players[i].cards = cards.slice(i*part, i*part+part).map(
            (x, index) => ({
               id: index + i*part,
               val: x,
               x: Math.random(),
               y: Math.random(),
            })
         );
      }
      this.deck = {};
      this.deck.cards = [];
      this.collectPlayerInfo();
   }

   collectPlayerInfo() {
      this.deck.players = this.players.map((player) => ({
         username: player.username,
         cardcount: player.cards && player.cards.length || 0,
      }));
   }
}

const api = {
   initialize: () => {
      i_logger.debug('[plugin] "poke" plugin loaded ...');
   },
   process: (ws, m, env, type) => {
      let obj = { id: m.id, room: m.room }, room, player, selfobj;
      switch(m.cmd) {
         case 'poke.check':
            room = rooms[m.room];
            if (!room) return 0;
            obj.poke = 'check';
            obj.started = !!room._poke;
            ws.send(JSON.stringify(obj));
            return 1;
         case 'poke.create':
            room = rooms[m.room];
            if (!room) return 0;
            room._poke = new PokeDeck();
            obj.poke = 'deck';
            obj.deck = room._poke.deck;
            obj.action = 'create';
            obj.id += '-deck';
            helper.broadcast(room, obj);
            return 1;
         case 'poke.sit':
            room = rooms[m.room];
            if (!room) return 0;
            if (!room._poke) return 0;
            player = room._poke.getPlayerByUsername(env.username);
            if (player) {
               player.username = null;
            }
            room._poke.setPlayer(m.index, env.username);
            player = room._poke.getPlayerByUsername(env.username);
            if (!player) return 0;
            room._poke.collectPlayerInfo();
            selfobj = Object.assign({}, obj);
            selfobj.poke = 'player';
            selfobj.player = player;
            obj.poke = 'deck';
            obj.deck = room._poke.deck;
            obj.action = 'stand';
            obj.id += '-deck';
            ws.send(JSON.stringify(selfobj));
            helper.broadcast(room, obj);
            return 1;
         case 'poke.stand':
            room = rooms[m.room];
            if (!room) return 0;
            if (!room._poke) return 0;
            room._poke.setPlayer(m.index, undefined);
            player = room._poke.players[m.index];
            if (!player) return 0;
            room._poke.collectPlayerInfo();
            selfobj = Object.assign({}, obj);
            selfobj.poke = 'player';
            selfobj.player = null;
            obj.poke = 'deck';
            obj.deck = room._poke.deck;
            obj.action = 'stand';
            obj.id += '-deck';
            ws.send(JSON.stringify(selfobj));
            helper.broadcast(room, obj);
            return 1;
         case 'poke.getplayer':
            room = rooms[m.room];
            if (!room) return 0;
            if (!room._poke) return 0;
            player = room._poke.getPlayerByUsername(env.username);
            obj.poke = 'player&deck';
            obj.player = player;
            obj.deck = room._poke.deck;
            ws.send(JSON.stringify(obj));
            return 1;
         case 'poke.pull':
            room = rooms[m.room];
            if (!room) return 0;
            if (!room._poke) return 0;
            player = room._poke.getPlayerByUsername(env.username);
            if (!player) return 0;
            if (!Array.isArray(m.cards)) return 0;
            room._poke.pullCards(env.username, m.cards);
            room._poke.collectPlayerInfo();
            selfobj = Object.assign({}, obj);
            selfobj.poke = 'player';
            selfobj.player = player;
            obj.poke = 'deck';
            obj.deck = room._poke.deck;
            obj.action = 'pull';
            obj.id += '-deck';
            ws.send(JSON.stringify(selfobj));
            helper.broadcast(room, obj);
            return 1;
         case 'poke.push':
            room = rooms[m.room];
            if (!room) return 0;
            if (!room._poke) return 0;
            player = room._poke.getPlayerByUsername(env.username);
            if (!player) return 0;
            if (!Array.isArray(m.cards)) return 0;
            room._poke.pushCards(env.username, m.cards);
            room._poke.collectPlayerInfo();
            selfobj = Object.assign({}, obj);
            selfobj.poke = 'player';
            selfobj.player = player;
            obj.poke = 'deck';
            obj.deck = room._poke.deck;
            obj.action = 'push';
            obj.id += '-deck';
            ws.send(JSON.stringify(selfobj));
            helper.broadcast(room, obj);
            return 1;
         case 'poke.move.private':
            room = rooms[m.room];
            if (!room) return 0;
            if (!room._poke) return 0;
            player = room._poke.getPlayerByUsername(env.username);
            if (!player) return 0;
            if (!Array.isArray(m.cards)) return 0;
            room._poke.moveCards(env.username, m.cards);
            obj.poke = 'player';
            obj.player = player;
            obj.action = 'move';
            ws.send(JSON.stringify(obj));
            return 1;
         case 'poke.move.public':
            room = rooms[m.room];
            if (!room) return 0;
            if (!room._poke) return 0;
            player = room._poke.getPlayerByUsername(env.username);
            if (!player) return 0;
            if (!Array.isArray(m.cards)) return 0;
            room._poke.moveCardOnDeck(env.username, m.cards);
            obj.poke = 'deck';
            obj.deck = room._poke.deck;
            obj.action = 'move';
            obj.id += '-deck';
            helper.broadcast(room, obj);
            return 1;
         case 'poke.shuffle':
            room = rooms[m.room];
            if (!room) return 0;
            if (!room._poke) return 0;
            room._poke.shuffle(m.poketype || 'guandan');
            room._poke.collectPlayerInfo();
            room._poke.players.forEach((player) => {
               let user_obj = room.clients[player.username];
               if (!user_obj) return;
               if (!user_obj.ws) return;
               if (user_obj.ws.readyState !== user_obj.ws.OPEN) return;
               selfobj = Object.assign({}, obj);
               selfobj.poke = 'player';
               selfobj.player = player;
               user_obj.ws.send(JSON.stringify(selfobj));
            });
            obj.poke = 'deck';
            obj.deck = room._poke.deck;
            obj.action = 'shuffle';
            obj.id += '-deck';
            helper.broadcast(room, obj);
            return 1;
      }
   },
};

module.exports = api;