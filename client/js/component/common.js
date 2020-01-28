'use strict';

(function () {

var _event = {
   preventDefault: function (evt) { evt.preventDefault(); },
   disableBodyKey: function () {
      document.body.addEventListener('keydown', _event.preventDefault);
      document.body.addEventListener('keyup', _event.preventDefault);
   },
   enableBodyKey: function () {
      document.body.removeEventListener('keydown', _event.preventDefault);
      document.body.removeEventListener('keyup', _event.preventDefault);
   }
};

function EdienilnoPseudoId(N) {
   var random = ~~(Math.random() * N)
   var timestamp = ~~(new Date().getTime());
   return (timestamp + '-') + random;
}

function EdienilnoSideItem(url, title, desc) {
   var a = document.createElement('a');
   var d1 = document.createElement('div');
   var d2 = document.createElement('div');
   a.classList.add('boga-side-item');
   d1.style.fontSize = '20px';
   d1.style.textOverflow = 'ellipsis';
   d1.style.whiteSpace = 'nowrap';
   d1.style.overflow = 'hidden';
   d2.style.textOverflow = 'ellipsis';
   d2.style.whiteSpace = 'nowrap';
   d2.style.overflow = 'hidden';
   if (title) {
      d1.appendChild(document.createTextNode(title));
      a.appendChild(d1);
   }
   if (desc) {
      d2.appendChild(document.createTextNode(desc));
      a.appendChild(d2);
   }
   if (url) a.href = url;
   this.dom = {
      self: a,
      title: d1,
      desc: d2,
      img: document.createElement('img')
   };
}
EdienilnoSideItem.prototype = {
   setTitle: function (title) {
      this.dom.title.innerHTML = '';
      this.dom.title.appendChild(document.createTextNode(title));
   },
   setDescription: function (desc) {
      this.dom.desc.innerHTML = '';
      this.dom.desc.appendChild(document.createTextNode(desc));
   }
};

function EdienilnoScrollableView(container) {
   var div = document.createElement('div');
   var view = document.createElement('div');
   this.dom = {
      container: container,
      self: div,
      view: view
   };
   div.appendChild(view);
   container.appendChild(div);
   this.hide();
   this.resize();
}
EdienilnoScrollableView.prototype = {
   resize: function () {
      this.dom.self.style.width = this.dom.container.offsetWidth + 'px';
      this.dom.self.style.height = this.dom.container.offsetHeight + 'px';
   },
   scrollableX: function () {
      this.dom.self.style.overflowX = 'auto';
   },
   unscrollableX: function () {
      this.dom.self.style.overflowX = 'hidden';
   },
   scrollableY: function () {
      this.dom.self.style.overflowY = 'auto';
   },
   unscrollableY: function () {
      this.dom.self.style.overflowY = 'hidden';
   },
   isVisible: function () {
      return this.displayed;
   },
   show: function () {
      this.dom.self.style.display = 'block';
      this.displayed = true;
   },
   hide: function () {
      this.dom.self.style.display = 'none';
      this.displayed = false;
   }
};

function EdienilnoDropdownView(stick_to) {
   var div = document.createElement('div');
   this.dom = {
      self: div,
      stick_to: stick_to,
      mask: null
   };
   div.style.backgroundColor = 'white';
   this.data = {
      cancelByMaskClick: true,
      maskOpacity: 1,
      maskColor: 'transparent'
   };

   var _this = this;
   this.event = {
      mouseDown: function (evt) {
         _this.hide();
      }
   };

   div.style.position = 'absolute';
   div.style.top = '0';
   div.style.left = '0';
   div.style.zIndex = '2001';
   this.dx = 0;
   this.dy = 0;
   document.body.appendChild(div);
   this.hide();
}
EdienilnoDropdownView.prototype = {
   dispose: function () {
      if (this.dom.mask) this.hide();
      if (this.dom.self.parentNode) {
         this.dom.self.parentNode.removeChild(this.dom.self);
      }
   },
   stick: function (stick_to) {
      if (stick_to) this.dom.stick_to = stick_to;
      if (!this.dom.stick_to) return;
      this.dom.self.style.top = (this.dom.stick_to.offsetTop + this.dom.stick_to.offsetHeight + this.dy) + 'px';
      this.dom.self.style.left = (this.dom.stick_to.offsetLeft + this.dx) + 'px';
   },
   offset: function (dx, dy) {
      this.dx = dx;
      this.dy = dy;
      this.stick();
   },
   getDom: function () {
      return this.dom.self;
   },
   isVisible: function () {
      return this.displayed;
   },
   maskStyle: function (color, opacity) {
      this.data.maskColor = color || 'transparent';
      this.data.maskOpacity = opacity;
   },
   disableCancelByMaskClick: function () {
      this.data.cancelByMaskClick = false;
   },
   enableCancelByMaskClick: function () {
      this.data.cancelByMaskClick = true;
   },
   show: function () {
      this.dom.self.style.display = 'block';
      if (!this.dom.mask) {
         this.dom.mask = document.createElement('div');
         this.dom.mask.style.position = 'fixed';
         this.dom.mask.style.width = '100%';
         this.dom.mask.style.height = '100%';
         this.dom.mask.style.top = '0px';
         this.dom.mask.style.left = '0px';
         this.dom.mask.style.backgroundColor = this.data.maskColor;
         if (this.data.maskOpacity !== undefined) this.dom.mask.style.opacity = this.data.maskOpacity;
         this.dom.mask.style.zIndex = '2000';
      }
      document.body.appendChild(this.dom.mask);
      document.activeElement.blur();
      if (this.data.cancelByMaskClick) this.dom.mask.addEventListener('mousedown', this.event.mouseDown);
      this.displayed = true;
   },
   hide: function () {
      this.dom.self.style.display = 'none';
      if (this.dom.mask) {
         this.dom.mask.removeEventListener('mousedown', this.event.mouseDown);
         if (this.dom.mask.parentNode) this.dom.mask.parentNode.removeChild(this.dom.mask);
         this.dom.mask = null;
      }
      this.displayed = false;
   }
};

function EdienilnoInputBox(options) {
   if (!options) options = {};

   this.dom = {
      self: new EdienilnoDropdownView(document.body),
      title: document.createElement('div'),
      body: document.createElement('div'),
      input: document.createElement('input'),
      btn: {
         ok: document.createElement('button'),
         cancel: options.cancelFn && document.createElement('button')
      }
   };

   var _this = this;
   this.event = {
      okFn: options.okFn || function (evt) {
         _this.dispose();
      },
      cancelFn: options.cancelFn
   };
   this.dom.self.maskStyle('white', '0.5');
   var container = this.dom.self.getDom();
   if (options.titleText) {
      this.dom.title.appendChild(document.createTextNode(options.titleText));
   } else if (options.titleHtml) {
      this.dom.title.innerHTML = options.titleHtml;
   } else {
      this.dom.title.innerHTML = 'Message';
   }
   container.appendChild(this.dom.title);
   if (options.bodyText) {
      this.dom.body.appendChild(document.createTextNode(options.bodyText));
   } else if (options.bodyHtml) {
      this.dom.body.innerHTML = options.bodyHtml;
   } else {
      this.dom.body.innerHTML = '';
   }
   container.appendChild(this.dom.body);
   var tmp = document.createElement('div');
   tmp.appendChild(this.dom.input);
   this.dom.input.value = options.inputValue || '';
   this.dom.input.className = options.inputStyle || 'input clr-input';
   if (options.inputType) this.dom.input.setAttribute('type', options.inputType);
   container.appendChild(tmp);
   this.dom.self.disableCancelByMaskClick();
   this.dom.btn.ok.addEventListener('click', this.event.okFn);
   this.dom.btn.ok.innerHTML = options.okTitle || 'OK';
   this.dom.btn.ok.className = options.okStyle || 'btn btn-default';
   container.appendChild(this.dom.btn.ok);
   if (this.event.cancelFn) {
      this.dom.btn.cancel.addEventListener('click', this.event.cancelFn);
      this.dom.btn.cancel.innerHTML = 'Cancel';
      this.dom.btn.cancel.className = options.cancelStyle || 'btn btn-default';
      container.appendChild(this.dom.btn.cancel);
   }
   container.style.maxWidth = '50%';
   container.style.border = '1px solid black';
   container.style.padding = '5px';
}
EdienilnoInputBox.prototype = {
   dispose: function () {
      this.dom.btn.ok.removeEventListener('click', this.event.okFn);
      this.event.cacnelFn && this.dom.btn.cancel.removeEventListener('click', this.event.cancelFn);
      this.dom.self.dispose();
   },
   getInputDom: function () {
      return this.dom.input;
   },
   getValue: function () {
      if (this.dom.input.getAttribute('type') === 'file') {
         return this.dom.input.files;
      }
      return this.dom.input.value;
   },
   center: function () {
      var w = window.innerWidth, h = window.innerHeight;
      var container = this.dom.self.getDom();
      container.style.left = (~~((w - container.offsetWidth) / 2)) + 'px';
      container.style.top = (~~((h - container.offsetHeight) / 2)) + 'px';
   },
   act: function () {
      document.body.appendChild(this.dom.self.getDom());
      this.dom.self.show();
      this.center();
      this.dom.input.focus();
   }
};

function EdienilnoYesNoCancelBox(options) {
   if (!options) options = {};

   this.dom = {
      self: new EdienilnoDropdownView(document.body),
      title: document.createElement('div'),
      body: document.createElement('div'),
      btn: {
         yes: document.createElement('button'),
         no: options.noFn && document.createElement('button'),
         cancel: options.cancelFn && document.createElement('button')
      }
   };

   var _this = this;
   this.event = {
      yesFn: options.yesFn || function (evt) {
         _this.dispose();
      },
      noFn: options.noFn,
      cancelFn: options.cancelFn
   };
   this.dom.self.maskStyle('white', '0.5');
   var container = this.dom.self.getDom();
   if (options.titleText) {
      this.dom.title.appendChild(document.createTextNode(options.titleText));
   } else if (options.titleHtml) {
      this.dom.title.innerHTML = options.titleHtml;
   } else {
      this.dom.title.innerHTML = 'Message';
   }
   container.appendChild(this.dom.title);
   if (options.bodyText) {
      this.dom.body.appendChild(document.createTextNode(options.bodyText));
   } else if (options.bodyHtml) {
      this.dom.body.innerHTML = options.bodyHtml;
   } else {
      this.dom.body.innerHTML = '';
   }
   container.appendChild(this.dom.body);
   this.dom.self.disableCancelByMaskClick();
   this.dom.btn.yes.addEventListener('click', this.event.yesFn);
   this.dom.btn.yes.innerHTML = options.yesTitle || 'Yes';
   this.dom.btn.yes.className = options.yesStyle || 'btn btn-default';
   if (!options.yesTitle && !options.yesFn) {
      this.dom.btn.yes.innerHTML = 'OK';
   }
   container.appendChild(this.dom.btn.yes);
   if (this.event.noFn) {
      this.dom.btn.no.addEventListener('click', this.event.noFn);
      this.dom.btn.no.innerHTML = 'No';
      this.dom.btn.no.className = options.noStyle || 'btn btn-default';
      container.appendChild(this.dom.btn.no);
   }
   if (this.event.cancelFn) {
      this.dom.btn.cancel.addEventListener('click', this.event.cancelFn);
      this.dom.btn.cancel.innerHTML = 'Cancel';
      this.dom.btn.cancel.className = options.cancelStyle || 'btn btn-default';
      container.appendChild(this.dom.btn.cancel);
   }
   container.style.maxWidth = '50%';
   container.style.border = '1px solid black';
   container.style.padding = '5px';
}
EdienilnoYesNoCancelBox.prototype = {
   dispose: function () {
      this.dom.btn.yes.removeEventListener('click', this.event.yesFn);
      this.event.noFn && this.dom.btn.no.removeEventListener('click', this.event.noFn);
      this.event.cacnelFn && this.dom.btn.cancel.removeEventListener('click', this.event.cancelFn);
      this.dom.self.dispose();
   },
   getBodyDom: function () {
      return this.dom.body;
   },
   center: function () {
      var w = window.innerWidth, h = window.innerHeight;
      var container = this.dom.self.getDom();
      container.style.left = (~~((w - container.offsetWidth) / 2)) + 'px';
      container.style.top = (~~((h - container.offsetHeight) / 2)) + 'px';
   },
   act: function () {
      document.body.appendChild(this.dom.self.getDom());
      this.dom.self.show();
      this.center();
   }
};

if (!window.boga) window.boga = {};
window.boga.pseudoId = EdienilnoPseudoId;
window.boga.SideItem = EdienilnoSideItem;
window.boga.ScrollableView = EdienilnoScrollableView;
window.boga.DropdownView = EdienilnoDropdownView;
window.boga.InputBox = EdienilnoInputBox;
window.boga.YesNoCancelBox = EdienilnoYesNoCancelBox;

})();
