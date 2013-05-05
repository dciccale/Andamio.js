Andamio.Application = function (options) {
  _.extend(this, options);
};

_.extend(Andamio.Application.prototype, Backbone.Events, {
  el: 'body',

  // starts the app
  start: function () {
    this.initialize.apply(this, arguments);
    this.listenTo(this.router, 'navigate', this.show);
  },

  initialize: function () {},

  show: function (name, view, urlParams) {
    /* jshint unused: vars */
    this._ensureEl();
    if (view !== this.currentView) {
      this._close();
      view.render();
      this._open(view);
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
