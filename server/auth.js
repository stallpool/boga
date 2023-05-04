const i_path = require('path');
const i_uuid = require('uuid');
const i_keyval = require('./keyval');
const i_env = require('./env');
const i_fsutil = require('./share/file');

const system = {
   otop_passpath: process.env.BOGA_PASS_DIR,
   otop_oncecode: !!process.env.BOGA_PASS_ONCE,
   otop_oncecode_except: process.env.BOGA_PASS_ONCE_EXCEPT ? process.env.BOGA_PASS_ONCE_EXCEPT.split(',') : [],
};

const api = {
   authenticate: (username, password) => new Promise((resolve, reject) => {
      if (system.otop_passpath) {
         api.authenticate_for_otop(username, password).then(resolve, reject);
         return;
      }
      // no auth
      resolve(keyval_setauth(username));
   }),
   check_login: (username, uuid) => {
      let meta = i_keyval.get(keyval_authkey(username, uuid));
      if (!meta) return null;
      return meta;
   },
   authenticate_for_otop: async (username, password) => new Promise((resolve, reject) => {
      (async () => { try {
         // XXX: security / still has race condition to allow auth for 2 parallel connections
         if (!username || username.indexOf('..') >= 0) return reject({username, error: 'auth failed'});
         const base = i_path.resolve(system.otop_passpath);
         const filename = i_path.join(base, username);
         const stat = await i_fsutil.stat(filename);
         if (!stat.isFile()) return reject({username, error: 'auth failed'});
         const passphrase = (await i_fsutil.readFile(filename)).toString().trim();
         if (passphrase && password === passphrase) {
            if (system.otop_oncecode && !system.otop_oncecode_except.includes(username)) i_fsutil.origin.unlink(filename, () => {});
            resolve(keyval_setauth(username));
         } else {
            reject({username, error: 'auth failed'});
         }
      } catch (err) {
         reject({username, error: 'auth failed'});
      } })();
   }),
   clear: (username, uuid) => {
      return i_keyval.set(keyval_authkey(username, uuid));
   },
   keyval_setauth,
   keyval_authkey,
};

function keyval_authkey(username, uuid) {
   return `auth.${username}.${uuid}`;
}

function keyval_setauth(username, login_timestamp) {
   let keys = i_keyval.keys(`auth.${username}.*`);
   keys.forEach((key) => {
      i_keyval.set(key, null);
   });
   let meta = {
      login: login_timestamp || new Date().getTime()
   };
   let uuid = i_uuid.v4();
   i_keyval.set(keyval_authkey(username, uuid), meta);
   return {username, uuid};
}

module.exports = api;
