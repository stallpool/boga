const base = __dirname;

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
};

module.exports = env;
