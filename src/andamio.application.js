Andamio.Application = function (options) {
  _.extend(this, options);
  this.listenTo(this.router, 'navigate', this.show);
  this.initialize.apply(this, arguments);
};

_.extend(Andamio.Application.prototype, Backbone.Events, {
  el: 'body',

  // starts the app
  start: function () {
    this.initialize.apply(this, arguments);
  },

  initialize: function () {},

  show: function (view, name, urlParams) {
    /* jshint unused: vars */
    this._ensureEl();
    if (view !== this.currentView) {
      this._close();
      view.render();
    } else {
      view.render();
    }
    this.currentView = view;
  },

  _ensureEl: function () {
    if (!this.$el || this.$el.length === 0) {
      this.$el = $(this.el);
    }
  },

  _open: function (view) {
    this.$el.empty().append(view.el);
  },

  _close: function () {
    if (this.currentView) {
      this.currentView.remove();
    }
  }
});

Andamio.Application.extend = Andamio.extend;
