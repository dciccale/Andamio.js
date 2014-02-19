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
        callback = callback || this._createCallback(url, route);
        this.route(url, route.name, callback);
      }, this);

    }, this);
  },

  _createCallback: function (url, route) {
    var router = this;
    var callback;

    if (route.redirectTo) {
      callback = function () {
        Backbone.history.navigate(route.redirectTo, {trigger: true, replace: true});
      };
    } else {
      callback = function () {
        var urlParams = [].slice.call(arguments);
        var view = new route.view();
        var model = view.model || view.collection;

        // Execute view's model or collection load method
        if (model && _.isFunction(model.load)) {
          model.urlParams = urlParams;
          model.load.apply(model, urlParams);
        }

        router.trigger('navigate', view, url, urlParams);
      };
    }

    return callback;
  }
});
