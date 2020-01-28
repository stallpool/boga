const i_logger = require('../logger');

const rooms = {
   // uuid: { clients: [] }
};

const helper = {
   cleanRoom: (room) => {
      if (!room.clients) return;
      room.clients = room.clients.filter((x) => {
         return x.readyState !== x.CLOSED || x.readyState !== x.CLOSING;
      });
   },
   pushClient: (room, ws) => {
      if (!room.clients) room.clients = [];
      if (room.clients.indexOf(ws) >= 0) return;
      helper.cleanRoom(room);
      room.clients.push(ws);
   },
   broadcast: (room, obj) => {
      if (!room.clients) return;
      room.clients.forEach((ws) => {
         if (ws.readyState !== ws.OPEN) return;
         ws.send(JSON.stringify(obj));
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
         let obj = { room: id, message: `[${new Date().toISOString()}] [${env.username}] left the room.` };
         helper.broadcast(room, obj);
      });
   },
   process: (ws, m, env, type) => {
      if (type === 'close') {
         return api._processClose(ws, env);
      }
      let obj = {}, room;
      switch(m.cmd) {
         case 'chat.create':
            // TODO: check admin
            obj.id = m.id;
            obj.room = m.room;
            if (!rooms[m.room]) rooms[m.room] = {};
            room = rooms[m.room];
            helper.pushClient(room, ws);
            helper.broadcast(room, obj);
            return 1;
         case 'chat.enter':
            obj.id = m.id;
            obj.room = m.room;
            obj.message = `[${new Date().toISOString()}] [${env.username}] entered the room.`;
            i_logger.debug(`[plugin] "chat" room=${obj.room} <- user=${env.username} ...`);
            room = rooms[m.room];
            if (!room) return 0;
            if (!room.clients) room.clients = [];
            helper.pushClient(room, ws);
            helper.broadcast(room, obj);
            return 1;
         case 'chat.send':
            obj.id = m.id;
            obj.room = m.room;
            obj.message = `[${new Date().toISOString()}] [${env.username}] ${m.message}`;
            i_logger.debug(`[plugin] "chat" room=${obj.room} <- user=${env.username} message=${obj.message} ...`);
            room = rooms[m.room];
            if (!room) return 0;
            if (!room.clients) room.clients = [];
            helper.broadcast(room, obj);
            return 1;
      }
   },
};

module.exports = api;