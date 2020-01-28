const i_uuid = require('uuid');
const i_keyval = require('./keyval');
const i_env = require('./env');

const system = {
   otop_passpath: process.env.BOGA_PASS_DIR,
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
      const i_fs = require('fs');
      const i_path = require('path');
      let base = i_path.resolve(system.otop_passpath);
      if (!i_fs.existsSync(base)) return reject({username, error: 'system not ready'});
      let filename = i_path.join(base, username);
      if (!i_fs.existsSync(filename)) return reject({username, error: 'auth failed'});
      let stat = i_fs.statSync(filename);
      if (!stat.isFile()) return reject({username, error: 'auth failed'});
      let passphrase = i_fs.readFileSync(filename).toString().trim();
      if (password === passphrase) {
         resolve(keyval_setauth(username));
      } else {
         reject({username, error: 'auth failed'});
      }
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
