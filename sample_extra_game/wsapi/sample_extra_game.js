const logger = {
   debug: (...args) => {
      if (!i_env.debug) return;
      process.stdout.write(`[${new Date().toISOString()}] `);
      console.debug(...args);
   },
   log: (...args) => {
      process.stdout.write(`[${new Date().toISOString()}] `);
      console.log(...args);
   }
};

const api = {
   initialize: () => {
      logger.log('[plugin] "sample_extra_game" plugin loaded ...');
   },
   process: (ws, m, env) => {
      let obj = {};
      switch(m.cmd) {
         case 'sample_extra_game.echo':
            obj.sample_extra_game = true;
            obj.id = m.id;
            obj.echo = m.echo;
            ws.send(JSON.stringify(obj));
            return 1;
      }
   },
};

module.exports = api;
