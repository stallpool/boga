'use strict';
//@include common.js
//@include component/common.js
//@include component/client.js

var ui = {
   loading: dom('#p_loading'),
   app: dom('#p_app'),
   view: dom('#p_view')
};

var _boga = {
   _client: null,
   _pluginer: null,
   _online: false
};

function init_ui() {
   _boga._client = new boga.WwbsocketClient('/ws');
   _boga._client.onOnline(function () {
      console.log('online');
      _boga._online = true;
   });
   _boga._client.onOffline(function () {
      console.log('offline');
      _boga._online = false;
   });
   _boga._pluginer = new boga.PluginManager({
      client: _boga._client,
      view: ui.view
   });
   _boga._pluginer.register('lab.chat', './js/component/plugin/chat.js');
   _boga._pluginer.open('@chat', 'lab.chat');
}

function before_app() {
   ui_loading();
}

function resize() {
}

function register_events() {
   window.addEventListener('resize', resize);
   window.addEventListener('hashchange', function () {
      window.location.reload(true);
   });
}

function init_app() {
   ui_loaded();
   register_events();
   resize();
}

function ui_loading() {
   ui.app.classList.add('hide');
   ui.loading.classList.remove('hide');
}

function ui_loaded() {
   ui.loading.classList.add('hide');
   ui.app.classList.remove('hide');
   init_ui();
}

var env = {};
login_and_start(env, before_app, init_app, 'login.html#r=' + location.href.split('/').slice(3).join('/').replace('#', ':'));
