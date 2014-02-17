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

    if (this.router) {
      this._initRouter();
    }

    this.initialize.apply(this, arguments);
  },

  initialize: function () {},

  // Initialize app router
  _initRouter: function () {
    var that = this;

    // Instantiate the Router if it's the constructor
    if (_.isFunction(this.router)) {
      this.router = new this.router();
    }

    // Application region manages all views that are requested upon navigation
    this.appRegion = new Andamio.Region({
      el: this.el,
      initialize: function () {
        this.listenTo(that.router, 'navigate', this.show);
      },
      onShow: function () {
        that.vent.trigger('navigate', this.currentView);
      }
    });

    Backbone.history.start();

    // Navigate to default route
    if (!Backbone.history.fragment) {
      var defaultRoute = _.findWhere(this.router.routes, {default: true});

      if (defaultRoute) {
        this.router.navigate(defaultRoute.url, {trigger: true});
      }
    }
  },

  // Initialize app view
  _initAppView: function (appView) {
    $(this.container).empty().append(appView.render().el);
    this.appView = appView;
  }
});

Andamio.Application.extend = Andamio.extend;
