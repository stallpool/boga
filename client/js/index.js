'use strict';
//@include common.js
//@include component/common.js
//@include component/client.js

var ui = {
   loading: dom('#p_loading'),
   app: dom('#p_app'),
   view: dom('#p_view')
};

var _controller = {
   _online: false
};

function init_ui() {
   _controller.client = new boga.WwbsocketClient('/ws');
   _controller.client.onOnline(function () {
      console.log('online');
      _controller._online = true;
   });
   _controller.client.onOffline(function () {
      console.log('offline');
      _controller._online = false;
   });
}

function before_app() {
   ui_loading();
}

function resize() {
}

function register_events() {
   window.addEventListener('resize', resize);
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
login_and_start(env, before_app, init_app);
