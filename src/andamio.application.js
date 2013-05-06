Andamio.Application = function (options) {
  _.extend(this, options);
  this.vent = _.extend({}, Backbone.Events);
};

_.extend(Andamio.Application.prototype, Backbone.Events, {
  mainRegion: 'main',

  // starts the app
  start: function () {
    this._initRouter();
    this._initAppView();
    this.initialize.apply(this, arguments);
    this.listenTo(this.router, 'navigate', this.show);
  },

  initialize: function () {},

  // initialize app router
  _initRouter: function () {
    this.router = new this.router({app: this});
  },

  // initialize app view
  _initAppView: function () {
    this.appView = new this.appView;
    this.appView.render();
    $('body').empty().append(this.appView.el);
  },

  show: function (view, name, urlParams) {
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
    this.appView.trigger('navigate', view);
  },

  _ensureEl: function () {
    if (!this.$el || this.$el.length === 0) {
      this.$el = $('[data-region="' + this.mainRegion + '"]');
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
