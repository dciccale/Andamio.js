/*!
 * backbone.andamio v1.2.7 - 2014-02-17
 * http://andamiojs.com
 * Copyright (c) 2014 Denis Ciccale (@tdecs)
 * Released under the MIT license
 * https://github.com/dciccale/Andamio.js/blob/master/LICENSE.txt
 */
(function (global, _, Backbone) {
  'use strict';

  // global namespace
  var Andamio = {
    // use default DOM library
    $: Backbone.$,

    extend: Backbone.Model.extend
  };

  // expose Andamio
  global.Andamio = Backbone.Andamio = Andamio;

  (function (Andamio) {

  var methodSplitter = /\s+/;

  function _bind(target, obj, name, callback, methodName) {
    if (!callback) {
      throw new Error('Method "' + methodName + '" was configured as an event handler, but does not exist.');
    }

    target.listenTo(obj, name, callback);
  }

  function _unbind(target, obj, name, callback) {
    target.stopListening(obj, name, callback);
  }

  function handler(target, obj, name, methodNames, method) {
    _.each(methodNames, function (methodName) {
      var callback = target[methodName];
      method(target, obj, name, callback, methodName);
    });
  }

  // Iterate the bindings and apply corresponding bidning method
  function iterateEvents(target, obj, bindings, method) {
    if (!obj || !bindings) {
      return;
    }

    // Iterate the bindings and bind/unbind them
    _.each(bindings, function (methods, name) {
      var methodNames = methods.split(methodSplitter);
      handler(target, obj, name, methodNames, method);
    });
  }

  Andamio.bindEvents = function (target, obj, bindings) {
    iterateEvents(target, obj, bindings, _bind);
  };

  Andamio.unbindEvents = function (target, obj, bindings) {
    iterateEvents(target, obj, bindings, _unbind);
  };

}(Andamio));

  Andamio.Region = function (options) {
  _.extend(this, options);

  if (!this.el && !this.$el) {
    throw new Error('An "el" or "$el" property must be specified for a region');
  }

  if (this.initialize) {
    this.initialize.apply(this, arguments);
  }
};

_.extend(Andamio.Region.prototype, Backbone.Events, {
  show: function (view) {
    var isDifferentView;

    this._ensureEl();

    isDifferentView = view !== this.currentView;

    if (isDifferentView) {
      this.close();
    }

    view.render();

    if (isDifferentView || view.isClosed) {
      this.open(view);
    }

    this.currentView = view;

    this.trigger.call(this, 'show', view);

    if (_.isFunction(this.onShow)) {
      this.onShow.apply(this, _.tail(arguments));
    }
  },

  open: function (view) {
    this.$el.empty().append(view.el);
  },

  close: function () {
    var view = this.currentView;

    if (!view || view.isClosed) {
      return;
    }

    if (view.close) {
      view.close();
    } else if (view.remove) {
      view.remove();
    }

    if (_.isFunction(this.onClose)) {
      this.onClose();
    }

    delete this.currentView;
  },

  _ensureEl: function () {
    if (!this.$el || this.$el.length === 0) {
      this.$el = $('[data-region="' + this.el + '"]');
    }
  },

  reset: function () {
    this.close();
    delete this.$el;
  }
});

  Andamio.View = function () {
  _.bindAll(this, 'render');

  // Allow passing a model or collection constructor to be automatically initialized

  if (this.model) {
    this.model = new this.model();
  }

  if (this.collection) {
    this.collection = new this.collection();
  }

  Backbone.View.prototype.constructor.apply(this, arguments);
};

_.extend(Andamio.View.prototype, Backbone.View.prototype, {

  render: function () {
    var data, html;

    this.isClosed = false;

    data = this._serializeData();

    html = Andamio.Utils.render(this.template, data);

    this.$el.html(html);

    this._createSubViews();
    this._bindRegions();
    this._bindUIElements();

    if (_.isFunction(this.afterRender)) {
      this.afterRender();
    }

    return this;
  },

  _serializeData: function () {
    return this.model ?
      this.model.toJSON() : this.collection ? {items: this.collection.toJSON()} : {};
  },

  // Look for dom elements with the attribute `data-region`
  // inside this view and create regions.
  //
  // Also if a `subviews` property is provided in this view
  // try to match them to a region by its name
  _bindRegions: function () {
    var $regions = this.$('[data-region]');

    if (!$regions.length) {
      return;
    }

    this.regions = {};

    // Populate regions
    _.each($regions, function (el) {
      var $el = $(el);
      var regionName = $el.attr('data-region');

      // Create a new region
      this.regions[regionName] = new Andamio.Region({$el: $el});
    }, this);
  },

  _unbindRegions: function () {
    if (!this.regions) {
      return;
    }

    this._deleteProp('regions');
  },

  _createSubViews: function () {
    if (!this.subviews) {
      return;
    }

    if (!this._subviews) {
      this._subviews = this.subviews;
    }

    this.subviews = {};

    _.each(_.keys(this._subviews), function (key) {

      // Instantiate subviews if needed
      this.subviews[key] = _.isFunction(this._subviews[key]) ? new this._subviews[key]() : this._subviews[key];
    }, this);
  },

  _removeSubviews: function () {
    if (!this.subviews) {
      return;
    }

    _.invoke(this.subviews, 'close');

    this._deleteProp('subviews');
    this.subviews = this._subviews;
    delete this._subviews;
  },


  _bindUIElements: function () {
    if (!this.ui) {
      return;
    }

    // Save ui selectors
    if (!this._ui) {
      this._ui = this.ui;
    }

    // Remap ui to DOM elements
    this.ui = _.object(_.map(this._ui, function(selector, key) {
      return [key, this.$(selector)];
    }, this));
  },

  // This method unbinds the elements specified in the "ui" hash
  _unbindUIElements: function () {
    if (!this.ui) {
      return;
    }

    this._deleteProp('ui');
    this.ui = this._ui;
    delete this._ui;
  },

  // Clean up the view and remove from DOM
  close: function () {
    if (this.isClosed) {
      return;
    }

    this.isClosed = true;

    // Remove subviews
    this._removeSubviews();

    // Unbind regions and ui
    this._unbindRegions();
    this._unbindUIElements();

    // Call backbone's remove
    this.remove();
  },

  // Override Backbone's delegateEvents to bind model and collection events
  delegateEvents: function (events) {
    Backbone.View.prototype.delegateEvents.call(this, events);
    Andamio.bindEvents(this, this.model, this.modelEvents);
    Andamio.bindEvents(this, this.collection, this.collectionEvents);
  },

  // Override Backbone's undelegateEvents to unbind model and collection events
  undelegateEvents: function () {
    Backbone.View.prototype.undelegateEvents.apply(this, arguments);
    Andamio.unbindEvents(this, this.model, this.modelEvents);
    Andamio.unbindEvents(this, this.collection, this.collectionEvents);
  },

  // Helper method to correctly delete properties
  _deleteProp: function (prop) {
    var obj = this[prop];

    _.each(obj, function (item, name) {
      delete obj[name];
    }, this);

    delete this[prop];
  }
});

Andamio.View.extend = Backbone.View.extend;

  Andamio.Model = Backbone.Model.extend({
  constructor: function (attributes, options) {
    this.configure(options);
    Backbone.Model.apply(this, arguments);
    this._mixinComputedProperties();
  },

  configure: function (options) {
    _.extend(this.defaults, this.constructor.__super__.defaults);
    this.options = options || {};
  },

  defaults: {
    ready: false
  },

  // Simple way to know if a model is ready
  // Useful for showing a loading component
  // Should be overriden
  isReady: function () {
    return true;
  },

  // Shortcut to set the model as ready
  setReady: function () {
    this.set('ready', true);
  },

  /* Extend model attributes with computed properties
   * computedProperties: {
   *   fullName: function () {
   *     return this.name + ' ' + this.last;
   *   }
   * }
   */
  _mixinComputedProperties: function () {
    var attributes = this.attributes || {};

    return _.extend(attributes, this.computedProperties);
  },

  // Default function to be called from the router recieving url params
  // should be overridden by the model for example if params need to be parsed or
  // prepared and finally call the fetch method
  load: function () {}
});

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

  Andamio.Utils = {
  render: function (template, data) {
    if (!template) {
      throw new Error('Cannot render the template since it\'s false, null or undefined.');
    }

    return template(data);
  }
};


  // exports
  (function (root, factory) {
    if (typeof exports === 'object') {
      var underscore = require('underscore');
      var backbone = require('backbone');
      module.exports = factory(underscore, backbone);

    } else if (typeof define === 'function' && define.amd) {
      define(['underscore', 'backbone'], factory);
    }
  }(this, function (_, Backbone) {
    /* jshint unused: vars */
    return Andamio;
  }));

}(this, _, Backbone));
