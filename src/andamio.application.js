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
    options = options || {};
    if (options.router && Backbone.History.started) {
      throw new Error('Stop Backbone history before starting an application router.');
    }
    if (options.appView) {
      this._initAppView(options.appView);
    }

    // Initialize the router
    if (options.router) {
      this._initRouter(options.router);
    }

    this.initialize.apply(this, arguments);
    return this;
  },

  initialize: function () {},

  // Release views, listeners, and the history started by this application.
  stop: function () {
    if (this.appRegion) {
      this.appRegion.close();
      this.appRegion.stopListening();
      delete this.appRegion;
    }
    if (this.appView) {
      if (this.appView.close) {
        this.appView.close();
      } else {
        this.appView.remove();
      }
      delete this.appView;
    }
    if (this.router) {
      Backbone.history.stop();
      if (this.router.close) {
        this.router.close();
      } else {
        this.router.stopListening();
      }
      delete this.router;
    }
    this.stopListening();
    return this;
  },

  // Initialize app router
  _initRouter: function (router) {

    // Instantiate the Router
    this.router = _.isFunction(router) ? new router() : router;

    this._initAppRegion();

    Backbone.history.start(this.historyOptions);

    // Navigate to default route
    if (!Backbone.history.fragment) {
      var defaultRoute = _.findWhere(this.router.routes, {default: true});

      if (defaultRoute) {
        var url = _.isArray(defaultRoute.url) ? defaultRoute.url[0] : defaultRoute.url;
        this.router.navigate(url, {trigger: true});
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
    if (this.appView && this.appView !== appView) {
      if (this.appView.close) {
        this.appView.close();
      } else {
        this.appView.remove();
      }
    }
    this.appView = _.isFunction(appView) ? new appView() : appView;

    Andamio.$(this.container).empty().append(this.appView.render().el);
  }
});

Andamio.Application.extend = Andamio.extend;
