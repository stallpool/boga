const i_utils = require('./utils');
const i_worker = require('./worker');
const i_ws = require('./websocket');
const i_api = require('./api');

const server = i_utils.WebServer.create(
   { api: i_api, }, { httpsDir: process.env.BOGA_HTTPS }
);

i_worker.cronCleanAuthToken();
i_ws.init(server, '/ws');
i_ws.init_plugins();

const server_port = parseInt(process.env.BOGA_PORT || 20203);
const server_host = process.env.BOGA_HOST || '127.0.0.1';

const instance = server.listen(server_port, server_host, () => {
   console.log(`Boga is listening at ${server_host}:${server_port}`);
})
