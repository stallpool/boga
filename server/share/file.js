const i_fs = require('fs');

const api = {
   origin: i_fs,
   stat: (fname) => new Promise((r, e) => i_fs.stat(fname, (err, ret) => {
      if (err) return e(err);
      r(ret);
   })),
   readFile: (fname) => new Promise((r, e) => i_fs.readFile(fname, (err, ret) => {
      if (err) return e(err);
      r(ret);
   })),
   unlink: (fname) => new Promise((r, e) => i_fs.unlink(fname, (err) => {
      if (err) return e(err);
      r();
   })),
};

module.exports = api;
