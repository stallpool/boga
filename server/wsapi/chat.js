const i_env = require('../env');
const i_logger = require('../logger');
const i_path = require('path');
const i_fs = require('fs');

function getBoardGameList() {
   let map = {};
   let base = i_path.join(__dirname, '..', '..', 'client', 'js', 'component', 'boardgame');
   let file_list = i_fs.readdirSync(base);
   file_list.forEach((name) => {
      if (i_path.extname(name) !== '.js') return;
      let stat = i_fs.lstatSync(i_path.join(base, name));
      if (!stat.isFile()) return;
      map[name.substring(0, name.length-3)] = './js/component/boardgame/' + name;
   });

   Object.keys(i_env.config.extra_game).forEach((name) => {
      map[name] = `/_eg_/${name}/index.js`
   });

   return map;
}
const BOARD_GAME_LIST = getBoardGameList();

const rooms = {
   // uuid: { clients: { username: { username, ws } } }
};

const helper = {
   cleanRoom: (room) => {
      if (!room.clients) return;
      Object.keys((username) => {
         let user_obj = room.clients[username];
         let ws = user_obj.ws;
         if (ws.readyState === ws.CLOSED || ws.readyState === ws.CLOSING) {
            delete room.clients[username];
         }
      });
   },
   pushClient: (room, username, ws) => {
      if (!room.clients) room.clients = {};
      if (!room.clients[username]) room.clients[username] = {};
      var user_obj = room.clients[username];
      user_obj.username = username;
      user_obj.ws = ws;
      helper.cleanRoom(room);
   },
   broadcast: (room, obj, filterFn) => {
      if (!room.clients) return;
      var users = filterFn?filterFn(room.clients):Object.values(room.clients);
      users.forEach((user_obj) => {
         if (user_obj.ws.readyState !== user_obj.ws.OPEN) return;
         user_obj.ws.send(JSON.stringify(obj));
      });
   },
};

const api = {
   initialize: () => {
      i_logger.debug('[plugin] "chat" plugin loaded ...');
   },
   _processClose: (ws, env) => {
      Object.keys(rooms).forEach((id) => {
         let room = rooms[id];
         if (!room.clients) return;
         delete room.clients[env.username];
         let usernames = Object.keys(room.clients).filter((username) => {
            let user_obj = room.clients[username];
            let ws = user_obj.ws;
            return ws.readyState === ws.OPEN || ws.readyState === ws.CONNECTING;
         });
         if (!usernames.length) {
            delete rooms[id];
            return;
         }
         let obj = { room: id, message: `[${new Date().toISOString()}] [${env.username}] left the room.` };
         helper.broadcast(room, obj);
      });
   },
   process: (ws, m, env, type) => {
      if (type === 'close') {
         return api._processClose(ws, env);
      }
      let obj = { id: m.id, room: m.room }, room;
      switch(m.cmd) {
         case 'chat.create':
            // TODO: check admin
            if (!rooms[m.room]) rooms[m.room] = {};
            room = rooms[m.room];
            helper.pushClient(room, env.username, ws);
            helper.broadcast(room, obj);
            return 1;
         case 'chat.enter':
            obj.message = `[${new Date().toISOString()}] [${env.username}] entered the room.`;
            i_logger.debug(`[plugin] "chat" room=${obj.room} <- user=${env.username} ...`);
            room = rooms[m.room];
            if (!room) return 0;
            if (!room.clients) room.clients = [];
            helper.pushClient(room, env.username, ws);
            helper.broadcast(room, obj);
            return 1;
         case 'chat.send':
            obj.message = `[${new Date().toISOString()}] [${env.username}] ${m.message}`;
            i_logger.debug(`[plugin] "chat" room=${obj.room} <- user=${env.username} message=${obj.message} ...`);
            room = rooms[m.room];
            if (!room) return 0;
            if (!room.clients) room.clients = [];
            helper.broadcast(room, obj);
            return 1;
         case 'chat.audio':
            if (!m.audio) return 0;
            if (!m.audio.from) return 0;
            obj.audio = m.audio;
            room = rooms[m.room];
            if (!room) return 0;
            if (!room.clients) room.clients = [];
            helper.broadcast(room, obj, (clients) => {
               return Object.values(clients).filter((user_obj) => {
                  return m.audio.from !== user_obj.username;
               });
            });
            return 1;
         case 'chat.emotion':
            if (!m.value) return;
            room = rooms[m.room];
            if (!room) return 0;
            if (!room.clients) room.clients = [];
            obj.emotion = m.emotion || 'text';
            switch (obj.emotion) {
               case 'text':
                  obj.value = m.value.substring && m.value.substring(0, 10);
                  break;
            }
            obj.from = env.username;
            helper.broadcast(room, obj);
            return;
         case 'chat.boardgame':
            room = rooms[m.room];
            if (!room) return 0;
            if (!room.clients) room.clients = [];
            if (m.boardgame) {
               room.boardgame = m.boardgame;
               if (room._boardgame && room._boardgame.dispose) {
                  room._boardgame.dispose();
               }
               room._boardgame = null;
               obj.set_boardgame = room.boardgame;
               obj.list = BOARD_GAME_LIST;
               helper.broadcast(room, obj);
            } else {
               obj.boardgame = room.boardgame;
               obj.list = BOARD_GAME_LIST;
               ws.send(JSON.stringify(obj));
            }
            return 1;
      }
   },
   getRooms: () => {
      return rooms;
   }
};

module.exports = api;
