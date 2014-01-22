Andamio.Router = Backbone.Router.extend({
  _bindRoutes: function () {
    if (!this.routes) {
      return;
    }

    _.each(this.routes, function (route) {
      var callback = this._createCallback(route.url, route.name, route.view);
      this.route(route.url, route.name, callback);
    }, this);
  },

  _createCallback: function (url, name, View) {
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
