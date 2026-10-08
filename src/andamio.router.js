Andamio.Router = Backbone.Router.extend({

  // Override Backbone.Router._bindRoutes
  _bindRoutes: function () {
    if (!this.routes) {
      return;
    }

    this.routes = _.result(this, 'routes');
    this._routeHandlers = [];

    _.each(this.routes.slice().reverse(), function (route) {
      var urls = _.isArray(route.url) ? route.url : [route.url];

      _.each(urls, function (url) {

        // Register the same callback for the same route urls
        this.route(url, route.name, this._createCallback(url, route));
        this._routeHandlers.push(Backbone.history.handlers[0]);
      }, this);

    }, this);
  },

  close: function () {
    var handlers = this._routeHandlers;
    Backbone.history.handlers = _.filter(Backbone.history.handlers, function (handler) {
      return !_.contains(handlers, handler);
    });
    this._routeHandlers = [];
    this.stopListening();
  },

  _createCallback: function (url, route) {
    var router = this;
    var callback;

    if (route.redirectTo !== undefined) {
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
