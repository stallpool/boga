'use strict';
//@include common.js

var ui = {
   login: {
      ing: false,
      type: dom('#login-auth-source-1'),
      username: dom('#login_username'),
      password: dom('#login_password'),
      error: dom('#login_error'),
      signin: dom('#btn_signin'),
   }
};

(function init(){
   var hash = window.location.hash;
   if (!hash) return;
   if (hash.indexOf('#/') === 0) return;
   var param = {};
   hash.substring(1).split('&').forEach(function (part) {
      var parts = part.split('=');
      var key = decodeURIComponent(parts[0] || '');
      var val = decodeURIComponent(parts[1] || '');
      param[key] = val;
   });
   ui.login.username.value = param.u;
   ui.login.password.value = param.p;
   if (param.r) {
      location.hash = '#' + param.r;
   } else {
      location.hash = '#';
   }
   if (param.u && param.p) {
      return login();
   }

   var cookie = get_cookie();
   if (cookie.boga_username) {
      ui.login.username.value = cookie.boga_username;
      ui.login.password.focus();
   } else {
      ui.login.username.focus();
   }
   ui.login.error.classList.add('hide');
})();

function get_redirect_path() {
   // login.html
   // login.html#question.html:/question/1
   // login.html#/test
   var hash = window.location.hash;
   if (!hash) return '/';
   var i = hash.indexOf(':');
   if (i >= 0) {
      var hashsharp = hash.substring(i+1);
      if (hashsharp && hashsharp.charAt(0) !== '?') {
         hashsharp = '#' + hashsharp;
      }
      hash = '/' + hash.substring(1, i) + hashsharp;
      if (hash.charAt(hash.length-1) === '#') {
         hash = hash.substring(0, hash.length-1);
      }
   } else {
      hash = '/' + hash;
   }
   hash += window.location.search;
   return hash;
}

function login() {
   var username = ui.login.username.value;
   var password = ui.login.password.value;
   ui.login.ing = true;
   ui.login.error.classList.add('hide');
   ajax({
      url: '/api/auth/login',
      json: {
         username: username,
         password: password
      }
   }, function (response) {
      response = JSON.parse(response);
      set_cookie('boga_username', username);
      set_cookie('boga_uuid', response.uuid);
      window.location = get_redirect_path();
   }, function (status) {
      ui.login.error.classList.remove('hide');
      ui.login.password.focus();
      ui.login.password.select();
      ui.login.ing = false;
   });
}

ui.login.signin.addEventListener('click', function () {
   if (!ui.login.ing) {
      login();
   }
});

ui.login.username.addEventListener('keyup', function (evt) {
   if (evt.keyCode === 13) {
      ui.login.password.focus();
   }
});

ui.login.password.addEventListener('keyup', function (evt) {
   if (evt.keyCode === 13 && !ui.login.ing) {
      login();
   }
});
