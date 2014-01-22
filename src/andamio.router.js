Andamio.Router = Backbone.Router.extend({
  constructor: function (options) {
    _.extend(this, options);
    this._initRoutes();
    this.initialize.apply(this, arguments);
  },

  initialize: function () {},

  _initRoutes: function () {
    _.each(this.routes, function (route) {
      var callback = this._routeCallback(route.url, route.name, route.view);
      this.route(route.url, route.name, callback);
    }, this);
  },

  _routeCallback: function (url, name, View) {
    var router = this;
    var callback = function () {
      var urlParams = arguments;
      var view = new View();
      if (view.model && _.isFunction(view.model.load)) {
        view.model.load.apply(view.model, urlParams);
      }
      router.trigger('navigate', view, url, urlParams);
    };
    return callback;
  }
});
