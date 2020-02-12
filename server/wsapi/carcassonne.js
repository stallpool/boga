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

const CARDPILE = {
   common: [
      'c1r-', 'c1r-', 'c1r-', 'c1r-', // c = castle, r = road
      '2c4', 'r4', 'pr|', 'pr|', 'p', 'p', 'p', 'p', // p = church
      'r-', 'r-', 'r-', 'r-', 'r-', 'r-', 'r-', 'r-',
      'r/', 'r/', 'r/', 'r/', 'r/', 'r/', 'r/', 'r/',
      'r3', 'r3', 'r3', 'r3', 'c1r3', 'c1r3', 'c1r3',
      '2c/', '2c/', 'c/', 'c/', 'c/',
      'c1r\\', 'c1r\\', 'c1r\\', 'c1r/', 'c1r/', 'c1r/',
      'c><', 'c><', 'c><', 'c>v', 'c>v', 'c>v',
      '2c3', 'c3', 'c3', 'c3', '2c3r|', '2c3r|', 'c3r|',
      '2c/r/', '2c/r/', 'c/r/', 'c/r/', 'c/r/',
      'c1', 'c1', 'c1', 'c1', 'c1', '2c-', '2c-', 'c-',
   ],
   river: [ // R = river
      'Rs', 'cRc', 'R/r/', 'Rpr|', 'R/', 'R/', 'R-', 'R-', 'R/c/', 'Rcr|', 'Rr|', 'Rs',
   ]
};
const COLOR = ['red', 'green', 'blue', 'black', 'yellow'];

class CarcassonneDeck {
   constructor() {
      this.colorMap = {};
      this.players = [];
      this.deck = {};
      this.options = {
         riverExtension: true,
      };
   }

   setRiverExtension(enabled) {
      this.options.riverExtension = enabled;
      this.reset();
   }

   playerJoin(username, color) {
      if (COLOR.indexOf(color) < 0) return false;
      if (this.players.length >= 5) return false;
      let player = this.getPlayerByUsername(username);
      if (!player) {
         player = {};
         this.players.push(player);
      }
      player.username = username;
      player.color = color;
      this.colorMap[color] = username;
      return true;
   }

   playerLeave(username) {
      let player = this.getPlayerByUsername(username);
      if (!player) return;
      let index = this.players.indexOf(player);
      this.players.splice(index, 1);
      delete this.colorMap[player.color];
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

   _find(id, type, player) {
      if (!this.deck.cards) return;
      switch (type) {
         case 'tile':
            return this.deck.cards.filter((x) => x.id === id && x.type === 'tile')[0];
         case 'worker':
            return this.deck.cards.filter((x) => x.id === id && x.color === player.color && x.type === 'worker')[0];
      }
   }

   reset() {
      let cards = CARDPILE.common.slice(1);
      this._shuffle(cards);
      cards.unshift(CARDPILE.common[0]);
      if (this.options.riverExtension) {
         let Rcards = CARDPILE.river.slice();
         let Rhead = Rcards.shift(), Rtail = Rcards.pop();
         this._shuffle(Rcards);
         Rcards.unshift(Rhead);
         Rcards.push(Rtail);
         cards = Rcards.concat(cards);
      }
      this.players.forEach((player) => {
         player.privateCards = [];
         player.card = null;
         player.worker = 7;
         player.score = 0;
         player.workerId = [1, 1, 1, 1, 1, 1, 1];
      });
      if (this.players.length) {
         cards.forEach((val, i) => {
            let player = this.players[i % this.players.length];
            player.privateCards.push({
               id: i+1, val,
               rotation: 0,
               x: 0, y: 0,
            });
         });
      }
      this.deck.cards = [];
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

   collectPlayerInfo() {
      this.deck.players = this.players.map((player) => ({
         username: player.username,
         color: player.color,
         score: player.score,
         worker: player.worker,
         cardcount: (player.privateCards && player.privateCards.length || 0) + (player.card?1:0),
      }));
   }

   getDeckPlayerByUsername(username) {
      return this.deck.players.filter((x) => x.username === username)[0];
   }

   pullCard(username, card) {
      if (!this.deck.cards) return;
      let player = this.getPlayerByUsername(username);
      if (!player) return;
      let selected, index;
      if (card.type === 'worker') {
         if (card.color !== player.color) return;
         if (player.workerId[card.id] === 1) return;
         selected = this._find(card.id, 'worker', player);
         if (!selected) return;
         index = this.deck.cards.indexOf(selected);
         if (index < 0) return;
         this.deck.cards.splice(index, 1);
         player.workerId[card.id] = 1;
         player.worker ++;
         return;
      }
      if (player.card) return;
      selected = this._find(card.id, 'tile', player);
      if (!selected) return;
      index = this.deck.cards.indexOf(selected);
      if (index < 0) return;
      this.deck.cards.splice(index, 1);
      player.card = selected;
      selected.x = 0.5;
      selected.y = 0.5;
   }

   pushCard(username, card) {
      let player = this.getPlayerByUsername(username);
      if (!player) return;
      let selected, index;
      if (card.type === 'worker') {
         if (card.color !== player.color) return;
         index = player.workerId.indexOf(1);
         if (index < 0) return;
         selected = {
            x: card.x, y: card.y, layer: 1, type: 'worker',
            color: player.color, id: index,
         };
         this.deck.cards.push(selected);
         player.workerId[selected.id] = 0;
         player.worker --;
         return;
      }
      if (!player.card) return;
      selected = {
         x: card.x, y: card.y, layer: 0, type: 'tile',
         id: player.card.id,
         rotation: player.card.rotation,
         val: player.card.val,
      };
      this.deck.cards.push(selected);
      player.card = null;
   }

   pullNextPrivateCard(username) {
      let player = this.getPlayerByUsername(username);
      if (!player) return;
      if (player.card) return;
      let card = player.privateCards.shift();
      if (!card) return;
      card.x = 0.5;
      card.y = 0.5;
      card.rotation = ~~(Math.random() * 4);
      player.card = card;
   }

   moveCard(username, card) {
      let player = this.getPlayerByUsername(username);
      if (!player) return;
      if (!player.card) return;
      player.card.rotation = card.rotation;
   }

   moveCardOnDeck(username, card) {
      let player = this.getPlayerByUsername(username);
      if (!player) return;
      let selected = this._find(card.id, card.type, player);
      if (!selected) return;
      selected.x = card.x;
      selected.y = card.y;
      if (card.type === 'tile') {
         selected.rotation = card.rotation;
      }
   }

   updateScore(username, delta) {
      let player = this.getPlayerByUsername(username);
      if (!player) return;
      player.score = player.score || 0;
      player.score += delta;
   }
}

function buildPlayer(boardgame, player) {
   if (!player) return null;
   return Object.assign({
      card: player.card,
   }, boardgame.getDeckPlayerByUsername(player.username))
}

const api = {
   initialize: () => {
      i_logger.debug('[plugin] "carcassonne" plugin loaded ...');
   },
   process: (ws, m, env, type) => {
      let obj = { id: m.id, room: m.room }, room, player, selfobj;
      switch(m.cmd) {
         case 'carcassonne.check':
            room = rooms[m.room];
            if (!room) return 0;
            obj.carcassonne = 'check';
            obj.started = !!room._boardgame;
            ws.send(JSON.stringify(obj));
            return 1;
         case 'carcassonne.create':
            room = rooms[m.room];
            if (!room) return 0;
            room._boardgame = new CarcassonneDeck();
            obj.carcassonne = 'deck';
            obj.deck = room._boardgame.deck;
            obj.action = 'create';
            obj.id += '-deck';
            helper.broadcast(room, obj);
            return 1;
         case 'carcassonne.sit':
            if (COLOR.indexOf(m.color) < 0) return 0;
            room = rooms[m.room];
            if (!room) return 0;
            if (!room._boardgame) return 0;
            player = room._boardgame.getPlayerByUsername(env.username);
            room._boardgame.playerLeave(env.username);
            room._boardgame.playerJoin(env.username, m.color);
            player = room._boardgame.getPlayerByUsername(env.username);
            if (!player) return 0;
            room._boardgame.collectPlayerInfo();
            selfobj = Object.assign({}, obj);
            selfobj.carcassonne = 'player';
            selfobj.player = buildPlayer(room._boardgame, player);
            obj.carcassonne = 'deck';
            obj.deck = room._boardgame.deck;
            obj.action = 'sit';
            obj.id += '-deck';
            ws.send(JSON.stringify(selfobj));
            helper.broadcast(room, obj);
            return 1;
         case 'carcassonne.stand':
            room = rooms[m.room];
            if (!room) return 0;
            if (!room._boardgame) return 0;
            room._boardgame.playerLeave(env.username);
            room._boardgame.collectPlayerInfo();
            selfobj = Object.assign({}, obj);
            selfobj.carcassonne = 'player';
            selfobj.player = null;
            obj.carcassonne = 'deck';
            obj.deck = room._boardgame.deck;
            obj.action = 'stand';
            obj.id += '-deck';
            ws.send(JSON.stringify(selfobj));
            helper.broadcast(room, obj);
            return 1;
         case 'carcassonne.getplayer':
            room = rooms[m.room];
            if (!room) return 0;
            if (!room._boardgame) return 0;
            player = room._boardgame.getPlayerByUsername(env.username);
            obj.carcassonne = 'player&deck';
            obj.player = buildPlayer(room._boardgame, player);
            room._boardgame.collectPlayerInfo();
            obj.deck = room._boardgame.deck;
            ws.send(JSON.stringify(obj));
            return 1;
         case 'carcassonne.pull':
            if (!m.card) return 0;
            room = rooms[m.room];
            if (!room) return 0;
            if (!room._boardgame) return 0;
            player = room._boardgame.getPlayerByUsername(env.username);
            if (!player) return 0;
            room._boardgame.pullCard(env.username, m.card);
            room._boardgame.collectPlayerInfo();
            selfobj = Object.assign({}, obj);
            selfobj.carcassonne = 'player';
            selfobj.player = buildPlayer(room._boardgame, player);
            obj.carcassonne = 'deck';
            obj.deck = room._boardgame.deck;
            obj.action = 'pull';
            obj.id += '-deck';
            ws.send(JSON.stringify(selfobj));
            helper.broadcast(room, obj);
            return 1;
         case 'carcassonne.push':
            if (!m.card) return;
            room = rooms[m.room];
            if (!room) return 0;
            if (!room._boardgame) return 0;
            player = room._boardgame.getPlayerByUsername(env.username);
            if (!player) return 0;
            room._boardgame.pushCard(env.username, m.card);
            room._boardgame.collectPlayerInfo();
            selfobj = Object.assign({}, obj);
            selfobj.carcassonne = 'player';
            selfobj.player = buildPlayer(room._boardgame, player);
            obj.carcassonne = 'deck';
            obj.deck = room._boardgame.deck;
            obj.action = 'push';
            obj.id += '-deck';
            ws.send(JSON.stringify(selfobj));
            helper.broadcast(room, obj);
            return 1;
         case 'carcassonne.private':
            if (!m.action) return;
            room = rooms[m.room];
            if (!room) return 0;
            if (!room._boardgame) return 0;
            player = room._boardgame.getPlayerByUsername(env.username);
            if (!player) return 0;
            switch(m.action) {
               case 'move':
                  if (!m.card) return 0;
                  room._boardgame.moveCard(env.username, m.card);
                  break;
               case 'pull':
                  room._boardgame.pullNextPrivateCard(env.username);
                  break;
            }
            obj.carcassonne = 'player';
            obj.player = buildPlayer(room._boardgame, player);
            obj.action = 'private';
            ws.send(JSON.stringify(obj));
            return 1;
         case 'carcassonne.score':
            room = rooms[m.room];
            if (!room) return 0;
            if (!room._boardgame) return 0;
            player = room._boardgame.getPlayerByUsername(env.username);
            if (!player) return 0;
            if (!m.score) return 0;
            m.score = parseInt(m.score);
            if (m.score < -10) m.score = -10;
            else if (m.score > 10) m.score = 10;
            room._boardgame.updateScore(env.username, m.score);
            room._boardgame.collectPlayerInfo();
            obj.carcassonne = 'deck';
            obj.deck = room._boardgame.deck;
            obj.action = 'pull';
            obj.id += '-deck';
            helper.broadcast(room, obj);
            return 1;
         case 'carcassonne.move.public':
            if (!m.card) return 0;
            room = rooms[m.room];
            if (!room) return 0;
            if (!room._boardgame) return 0;
            player = room._boardgame.getPlayerByUsername(env.username);
            if (!player) return 0;
            room._boardgame.moveCardOnDeck(env.username, m.card);
            obj.carcassonne = 'deck';
            obj.deck = room._boardgame.deck;
            obj.action = 'move';
            obj.id += '-deck';
            helper.broadcast(room, obj);
            return 1;
         case 'carcassonne.reset':
            room = rooms[m.room];
            if (!room) return 0;
            if (!room._boardgame) return 0;
            room._boardgame.reset();
            room._boardgame.collectPlayerInfo();
            room._boardgame.players.forEach((player) => {
               let user_obj = room.clients[player.username];
               if (!user_obj) return;
               if (!user_obj.ws) return;
               if (user_obj.ws.readyState !== user_obj.ws.OPEN) return;
               selfobj = Object.assign({}, obj);
               selfobj.carcassonne = 'player';
               selfobj.player = buildPlayer(room._boardgame, player);
               user_obj.ws.send(JSON.stringify(selfobj));
            });
            obj.carcassonne = 'deck';
            obj.deck = room._boardgame.deck;
            obj.action = 'reset';
            obj.id += '-deck';
            helper.broadcast(room, obj);
            return 1;
      }
   },
};

module.exports = api;
