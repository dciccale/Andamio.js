Andamio.Router = Backbone.Router.extend({
  constructor: function (options) {
    _.extend(this, options);
    if (!this.views) {
      throw new Error('Provide a correct path for the views in the "views" option.');
    }
    this._initRoutes();
    this.initialize.apply(this, arguments);
  },

  initialize: function () {},

  views: '',

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
      require([router.views + view], function (View) {
        var _view = new View;
        if (_.isFunction(_view.loadModel)) {
          _view.loadModel.apply(_view, urlParams);
        }
        router.trigger('navigate', url, _view, urlParams);
      });
    };
    return callback;
  }
});
