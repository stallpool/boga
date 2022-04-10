const i_fs = require('fs');
const i_path = require('path');
const i_uuid = require('uuid');

const base = __dirname;

class ExtraGame {
   constructor(path) {
      this.base = i_path.resolve(path);
      this.config = JSON.parse(
         i_fs.readFileSync(i_path.join(this.base, 'config.json'))
      );
      if (!this.config) this.config = {};
      const wsapi_path = i_path.join(this.base, 'wsapi');
      this.wsapi_loaded = false;
      this.wsapi = i_fs.readdirSync(wsapi_path).map((x) => {
         const filename = i_path.join(wsapi_path, x);
         const stat = i_fs.statSync(filename);
         if (!stat.isFile()) return null;
         const extname = i_path.extname(x);
         if (extname !== '.js') return null;
         return filename;
      }).filter((x) => !!x);
      this.plugin = [];
   }

   name() {
      if (!this.config.name) this.config.name = uuid.v4();
      return this.config.name;
   }

   staticfile(path) {
      const filename = i_path.resolve(
         i_path.join(this.base, 'static', path)
      );
      if (!filename.startsWith(this.base)) return null;
      try {
         return i_fs.readFileSync(filename);
      } catch(e) {
         return null;
      }
   }

   load() {
      if (this.wsapi_loaded) return;
      this.wsapi_loaded = true;
      this.wsapi.forEach((path) => {
         const modpath = path.substring(0, path.length-3);
         const plugin = require(modpath);
         if (!plugin.process) {
            delete require.cache[require.resolve(path)];
            return;
         }
         this.plugin.push(plugin);
         plugin.initialize && plugin.initialize();
         plugin.__filename__ = path;
      });
      return this.plugin;
   }
}

const env = {
   base: base,
   debug: !!process.env.BOGA_DEBUG,
   auth_internal: false,
   search_path: process.env.BOGA_SEARCH_PATH,
   ldap_server: process.env.BOGA_LDAP_SERVER,
   keyval: {
      // store key value into file;
      // if null, only in memory
      filename: process.env.BOGA_KEYVAL_FILENAME || null
   },
   admins: process.env.BOGA_ADMINS?process.env.BOGA_ADMINS.split(','):[],
   config: {
      max_user: parseInt(process.env.BOGA_MAX_USER || '10'),
      // define extra game to make sure we can have multiple repos
      // for example we build some game in private repo and it can
      // be loaded in boga
      extra_game: {},
   },
};
if (process.env.BOGA_EXTRA_GAME) {
   process.env.BOGA_EXTRA_GAME.split(':').forEach((path) => {
      const one = new ExtraGame(path);
      env.config.extra_game[one.name()] = one;
   });
}

module.exports = env;
