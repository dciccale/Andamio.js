Andamio.Application = function (options) {
  _.extend(this, options);
  this.vent = _.extend({}, Backbone.Events);
};

_.extend(Andamio.Application.prototype, Backbone.Events, Andamio.Region, {
  container: 'body',

  el: 'main',

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
    this.router = new this.router();
  },

  // initialize app view
  _initAppView: function () {
    this.appView = new this.appView({el: this.container});
    this.appView.render();
  },

  onShow: function () {
    this.appView.trigger('navigate', this.currentView);
  }
});

Andamio.Application.extend = Andamio.extend;
