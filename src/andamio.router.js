Andamio.Router = Backbone.Router.extend({
  constructor: function (options) {
    if (options.routes) {
      this.routes = options.routes;
    }
    this._initRoutes();
  },

  viewsPath: 'views/',

  _initRoutes: function () {
    _.each(this.routes, function (route) {
      var view = route.view;
      var callback = this._routeCallback(view);
      this.route(route.url, view, callback);
    }, this);
  },

  _routeCallback: function (view) {
    var router = this;
    var callback = function () {
      var urlParams = arguments;
      require([router.viewsPath + view], function (View) {
        var _view = new View;
        if (_.isFunction(_view.loadModel)) {
          _view.loadModel.apply(_view, urlParams);
        }
        router.trigger('navigate', _view, name, urlParams);
      });
    };
    return callback;
  }
});
