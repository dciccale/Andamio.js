/*!
 * backbone.andamio v1.2.8 - 2014-02-19
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

  Andamio.Utils = {
  render: function (template, data) {
    if (!template) {
      throw new Error('Cannot render the template since it\'s false, null or undefined.');
    }

    return template(data);
  }
};

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

  Andamio.View = Backbone.View.extend({

  constructor: function () {
    _.bindAll(this, 'render');

    Backbone.View.prototype.constructor.apply(this, arguments);
  },

  // Look for dom elements with the attribute `data-region`
  // inside this view template and create regions automatically
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

  // Public method to track subviews
  addSubview: function (key, view) {
    if (!this.subviews) {
      this.subviews = {};
    }

    // Instantiate subviews if needed
    this.subviews[key] = _.isFunction(view) ? new view() : view;
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

      // Add subviews to stack
      this.addSubview(key, this._subviews[key]);
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

  // Helper method to correctly delete properties from the view
  _deleteProp: function (prop) {
    var obj = this[prop];

    _.each(obj, function (item, name) {
      delete obj[name];
    }, this);

    delete this[prop];
  }
});

  Andamio.ItemView = Andamio.View.extend({

  constructor: function () {
    var collectionView;

    // Allow passing a model or collection constructor to be automatically initialized
    if (_.isFunction(this.model)) {
      this.model = new this.model();
    }

    if (_.isFunction(this.collection)) {
      this.collection = new this.collection();
    }

    Andamio.View.prototype.constructor.apply(this, arguments);

    // Easy way to render a CollectionView inside an ItemView
    // Check if there is an actual collection to render
    if (this.collectionView && this.collection) {

      // Check if it's a constructor
      collectionView = new this.collectionView({collection: this.collection});

      // Track as a subview
      this.addSubview('collectionView', collectionView);
    }
  },

  render: function () {
    var data, html;

    this.isClosed = false;

    data = this.serializeData();

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

  // Serialize the model or collection. If both are found, it defaults to the model, you can
  // override this method to do a custom serialization.
  serializeData: function () {
    return this.model ?
      this.model.toJSON() : this.collection ? {items: this.collection.toJSON()} : {};
  }
});

  Andamio.CollectionView = Andamio.View.extend({

  constructor: function () {

    // Allow passing a collection constructor to be automatically initialized
    if (_.isFunction(this.collection)) {
      this.collection = new this.collection();
    }

    this.children = [];

    Andamio.View.prototype.constructor.apply(this, arguments);

    this._initialEvents();
    this.initRenderBuffer();
  },

  initRenderBuffer: function() {
    this.elBuffer = document.createDocumentFragment();
    this._bufferedChildren = [];
  },

  startBuffering: function() {
    this.initRenderBuffer();
    this.isBuffering = true;
  },

  endBuffering: function() {
    this.isBuffering = false;
    this.appendBuffer(this, this.elBuffer);
    this._bufferedChildren = [];
    this.initRenderBuffer();
  },

  _initialEvents: function() {
    if (this.collection) {
      this.listenTo(this.collection, 'add', this.addChildView, this);
      this.listenTo(this.collection, 'remove', this.removeItemView, this);
      this.listenTo(this.collection, 'reset', this.render, this);
    }
  },

  addChildView: function (item, collection, options) {
    var ItemView = this._getItemView(item);
    var index = this.collection.indexOf(item);

    this.addItemView(item, ItemView, index);
  },

  _getItemView: function (item) {
    if (!this.itemView) {
      throw 'An `itemView` must be specified';
    }

    return this.itemView;
  },

  removeItemView: function (item) {
    var view = _.findWhere(this.children, {model: item});
    this.removeChildView(view);
  },

  // Remove the child view and close it
  removeChildView: function(view) {

    // shut down the child view properly,
    // including events that the collection has from it
    if (view) {
      this.stopListening(view);

      // call 'close' or 'remove', depending on which is found
      if (view.close) {
        view.close();
      } else if (view.remove) {
        view.remove();
      }

      this.children = _.without(this.children, view);
    }
  },

  render: function () {
    this.isClosed = false;

    this._renderChildren();

    if (_.isFunction(this.afterRender)) {
      this.afterRender();
    }

    return this;
  },

  // Render the child item's view and add it to the
  // HTML for the collection view.
  addItemView: function (item, ItemView, index) {

    // build the view
    var view = this.buildItemView(item, ItemView, this.itemViewOptions);

    // Store the child view itself so we can properly
    // remove and/or close it later
    this.children.push(view);

    // Render it and show it
    this.renderItemView(view, index);

    return view;
  },

  // render the item view
  renderItemView: function (view, index) {
    view.render();
    this.appendHtml(this, view, index);
  },

  // Build an `itemView` for every model in the collection.
  buildItemView: function (item, ItemView, itemViewOptions) {
    var options = _.extend({model: item}, itemViewOptions);

    return new ItemView(options);
  },

  appendBuffer: function(collectionView, buffer) {
    collectionView.$el.append(buffer);
  },

  // Append the HTML to the collection's `el`.
  // Override this method to do something other
  // then `.append`.
  appendHtml: function (collectionView, itemView, index) {
    if (collectionView.isBuffering) {

      // buffering happens on reset events and initial renders
      // in order to reduce the number of inserts into the
      // document, which are expensive.
      collectionView.elBuffer.appendChild(itemView.el);
      collectionView._bufferedChildren.push(itemView);
    } else {

      // If we've already rendered the main collection, just
      // append the new items directly into the element.
      collectionView.$el.append(itemView.el);
    }
  },

  isEmpty: function () {
    return !this.collection || this.collection.length === 0;
  },

  _renderChildren: function () {
    this.startBuffering();

    this.closeChildren();

    if (!this.isEmpty()) {
      this.showCollection();
    }

    this.endBuffering();
  },

  // Internal method to loop through each item in the
  // collection view and show it
  showCollection: function () {
    this.collection.each(function (item, index) {
      this.addItemView(item, this.itemView, index);
    }, this);
  },

  // Clean up the view and remove from DOM
  close: function () {
    if (this.isClosed) {
      return;
    }

    this.closeChildren();

    Andamio.View.prototype.close.apply(this, arguments);
  },

  closeChildren: function () {
    _.each(this.children, function (child) {
      this.removeChildView(child);
    }, this);
  }
});

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

  Andamio.Collection = Backbone.Collection.extend({
  model: Andamio.Model,

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

    // Initialize the router
    if (options.router) {
      this._initRouter(options.router);
    }

    this.initialize.apply(this, arguments);
  },

  initialize: function () {},

  // Initialize app router
  _initRouter: function (router) {

    // Instantiate the Router
    this.router = _.isFunction(router) ? new router() : router;

    this._initAppRegion();

    Backbone.history.start();

    // Navigate to default route
    if (!Backbone.history.fragment) {
      var defaultRoute = _.findWhere(this.router.routes, {default: true});

      if (defaultRoute) {
        this.router.navigate(defaultRoute.url, {trigger: true});
      }
    }
  },

  // Application region that manages all requested views upon navigation
  _initAppRegion: function () {
    var app = this;

    this.appRegion = new Andamio.Region({
      el: this.el,
      initialize: function () {
        this.listenTo(app.router, 'navigate', this.show);
      },
      onShow: function () {
        app.vent.trigger('navigate', this.currentView);
      }
    });
  },

  // Initialize app view
  _initAppView: function (appView) {
    this.appView = _.isFunction(appView) ? new appView() : appView;

    $(this.container).empty().append(this.appView.render().el);
  }
});

Andamio.Application.extend = Andamio.extend;


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
    return Andamio;
  }));

}(this, _, Backbone));
