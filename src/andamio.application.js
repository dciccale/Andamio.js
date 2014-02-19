Andamio.Application = function (options) {
  _.extend(this, options);
  this.vent = _.extend({}, Backbone.Events);
};

_.extend(Andamio.Application.prototype, Backbone.Events, {
  // Selector where the main appview will be rendered
  container: 'main',

  // data-region where every page will be displayed
  el: 'page',

  // Starts the app
  start: function (options) {
    if (options.appView) {
      this._initAppView(options.appView);
    }

    // Initialize the router
    if (options.router) {
      this._initRouter(options.router);
    }

    this.initialize.apply(this, arguments);
  },

  initialize: function () {},

  // Initialize app router
  _initRouter: function (router) {

    // Instantiate the Router
    this.router = _.isFunction(router) ? new router() : router;

    this._initAppRegion();

    Backbone.history.start();

    // Navigate to default route
    if (!Backbone.history.fragment) {
      var defaultRoute = _.findWhere(this.router.routes, {default: true});

      if (defaultRoute) {
        this.router.navigate(defaultRoute.url, {trigger: true});
      }
    }
  },

  // Application region that manages all requested views upon navigation
  _initAppRegion: function () {
    var app = this;

    this.appRegion = new Andamio.Region({
      el: this.el,
      initialize: function () {
        this.listenTo(app.router, 'navigate', this.show);
      },
      onShow: function () {
        app.vent.trigger('navigate', this.currentView);
      }
    });
  },

  // Initialize app view
  _initAppView: function (appView) {
    this.appView = _.isFunction(appView) ? new appView() : appView;

    $(this.container).empty().append(this.appView.render().el);
  }
});

Andamio.Application.extend = Andamio.extend;
