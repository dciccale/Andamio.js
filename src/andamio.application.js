Andamio.Application = function (options) {
  _.extend(this, options);
  this.vent = _.extend({}, Backbone.Events);
};

_.extend(Andamio.Application.prototype, Backbone.Events, Andamio.Region, {
  // selector where the main appview will be rendered
  container: 'main',

  // data-region where every page will be displayed
  el: 'page',

  // starts the app
  start: function (options) {
    _.extend(this, options);
    this._initAppView();
    this._initRouter();
    this.initialize.apply(this, arguments);
  },

  initialize: function () {},

  // initialize app router
  _initRouter: function () {
    this.router = new this.router();
    this.listenTo(this.router, 'navigate', this.show);
    Backbone.history.start();
    // navigate to default route
    var defaultRoute = _.findWhere(this.router.routes, {default: true});
    if (defaultRoute && !Backbone.history.fragment) {
      this.router.navigate(defaultRoute.url, {trigger: true, replace: true});
      // this.router._routeCallback(defaultRoute.url, defaultRoute.name, defaultRoute.view);
    }
  },

  // initialize app view
  _initAppView: function () {
    this.appView = new this.appView({el: this.container});
    this.appView.render();
  },

  onShow: function () {
    this.vent.trigger('navigate', this.currentView);
  }
});

Andamio.Application.extend = Andamio.extend;
