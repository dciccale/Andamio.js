Andamio.Router = Backbone.Router.extend({

  // Override Backbone.Router._bindRoutes
  _bindRoutes: function () {
    if (!this.routes) {
      return;
    }

    this.routes = _.result(this, 'routes');

    _.each(this.routes, function (route) {
      var urls = _.isArray(route.url) ? route.url : [route.url];
      var callback;

      _.each(urls, function (url) {

        // Register the same callback for the same route urls
        callback = callback || this._createCallback(url, route.name, route.view);
        this.route(url, route.name, callback);
      }, this);

    }, this);
  },

  _createCallback: function (url, name, View) {
    var router = this;

    var callback = function () {
      var urlParams = arguments;
      var view = new View();

      // Execute view's model load method
      if (view.model && _.isFunction(view.model.load)) {
        view.model.load.apply(view.model, urlParams);
      }

      router.trigger('navigate', view, url, urlParams);
    };

    return callback;
  }
});
