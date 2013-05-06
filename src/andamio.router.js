Andamio.Router = Backbone.Router.extend({
  constructor: function (options) {
    _.extend(this, options);
    if (!this.viewsPath) {
      throw new Error('Provide a correct path for the views in the "viewsPath" option.');
    }
    this._initRoutes();
    this.initialize.apply(this, arguments);
  },

  initialize: function () {},

  // default view files path
  viewsPath: 'views/',

  _initRoutes: function () {
    _.each(this.routes, function (route) {
      var url = route.url;
      var view = route.view;
      var callback = this._routeCallback(url, view);
      this.route(url, view, callback);
    }, this);
  },

  _routeCallback: function (url, view) {
    var router = this;
    var callback = function () {
      var urlParams = arguments;
      require([router.viewsPath + view], function (View) {
        var _view = new View;
        if (_view.model && _.isFunction(_view.model.load)) {
          _view.model.load.apply(_view.model, urlParams);
        }
        router.trigger('navigate', _view, url, urlParams);
      });
    };
    return callback;
  }
});
