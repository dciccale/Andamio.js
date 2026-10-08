/*! andamiojs v1.0.0 | https://github.com/dciccale/Andamio.js | MIT */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('underscore'), require('backbone'));
  } else if (typeof define === 'function' && define.amd) {
    define(['underscore', 'backbone'], factory);
  } else {
    root.Andamio = factory(root._, root.Backbone);
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function (_, Backbone) {
  'use strict';

  if (!_ || !Backbone) {
    throw new Error('Andamio requires Underscore and Backbone.');
  }

  var Andamio = {
    extend: Backbone.Model.extend
  };

  Object.defineProperty(Andamio, '$', {
    get: function () { return Backbone.$; },
    set: function (value) { Backbone.$ = value; }
  });

  Backbone.Andamio = Andamio;

  Andamio.Utils = {
  render: function (template, data) {
    if (!_.isFunction(template)) {
      throw new Error('A template must be a function.');
    }

    return template(data);
  }
};
  (function (Andamio) {
  var methodSplitter = /\s+/;

  function resolveBindings(target, obj, bindings, strict) {
    var resolved = [];
    if (!obj || !bindings) {
      return resolved;
    }
    _.each(bindings, function (methods, name) {
      var methodNames = _.isFunction(methods) ? [methods] : methods.trim().split(methodSplitter);
      _.each(methodNames, function (methodName) {
        var callback = _.isFunction(methodName) ? methodName : target[methodName];
        if (!_.isFunction(callback)) {
          if (strict) {
            throw new Error('Method "' + methodName + '" was configured as an event handler, but does not exist.');
          }
          return;
        }
        resolved.push({ obj: obj, name: name, callback: callback });
      });
    });
    return resolved;
  }

  Andamio.bindEvents = function (target, obj, bindings) {
    var resolved = resolveBindings(target, obj, bindings, true);
    _.each(resolved, function (binding) {
      target.listenTo(binding.obj, binding.name, binding.callback);
    });
    return resolved;
  };

  Andamio.unbindEvents = function (target, obj, bindings) {
    _.each(resolveBindings(target, obj, bindings, false), function (binding) {
      target.stopListening(binding.obj, binding.name, binding.callback);
    });
  };
}(Andamio));
  Andamio.Region = function (options) {
  _.extend(this, options);

  if (!this.el && !this.$el) {
    throw new Error('An "el" or "$el" property must be specified for a region');
  }

  if (!this.el && this.$el) {
    this.el = this.$el[0];
  }

  if (this.initialize) {
    this.initialize.apply(this, arguments);
  }
};

_.extend(Andamio.Region.prototype, Backbone.Events, {
  show: function (view) {
    var isDifferentView;

    if (!view || !_.isFunction(view.render)) {
      throw new Error('A region requires a view with a render method.');
    }

    this._ensureEl();

    isDifferentView = view !== this.currentView;

    if (isDifferentView) {
      this.close();
    }

    view.render();

    if (isDifferentView || view.el.parentNode !== this.$el[0]) {
      this.open(view);
    }

    this.currentView = view;

    this.trigger.call(this, 'show', view);

    if (_.isFunction(this.onShow)) {
      this.onShow.apply(this, arguments);
    }

    return this;
  },

  open: function (view) {
    this.$el.empty().append(view.el);
  },

  close: function () {
    var view = this.currentView;

    if (!view) {
      return;
    }

    if (view.close && !view.isClosed) {
      view.close();
    } else if (view.remove && !view.isClosed) {
      view.remove();
    }

    if (_.isFunction(this.onClose)) {
      this.onClose();
    }

    delete this.currentView;
  },

  _ensureEl: function () {
    if (!this.$el || this.$el.length === 0) {
      if (typeof this.el === 'string') {
        var name = this.el;
        this.$el = Andamio.$('[data-region]').filter(function () {
          return Andamio.$(this).attr('data-region') === name;
        });
      } else {
        this.$el = Andamio.$(this.el);
      }
    }
    if (this.$el.length !== 1) {
      throw new Error('A region must resolve to exactly one element.');
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
    this.subviews = _.extend(Object.create(null), _.result(this, 'subviews'));
    this._subviewDefinitions = _.extend(Object.create(null), this.subviews);

    Backbone.View.prototype.constructor.apply(this, arguments);
  },

  // Look for dom elements with the attribute `data-region`
  // inside this view template and create regions automatically
  _bindRegions: function () {
    var $regions = this.$('[data-region]');

    if (!$regions.length) {
      return;
    }

    this.regions = Object.create(null);

    // Populate regions
    _.each($regions, function (el) {
      var $el = Andamio.$(el);
      var regionName = $el.attr('data-region');

      if (this.regions[regionName]) {
        throw new Error('Region names must be unique within a view: ' + regionName);
      }

      // Create a new region
      this.regions[regionName] = new Andamio.Region({$el: $el});
    }, this);
  },

  _unbindRegions: function () {
    if (!this.regions) {
      return;
    }

    _.invoke(this.regions, 'close');
    _.invoke(this.regions, 'stopListening');
    delete this.regions;
  },

  // Track subviews on this instance, never on a shared prototype object.
  addSubview: function (key, view) {
    if (this.subviews[key] && this.subviews[key] !== view) {
      this._closeSubview(this.subviews[key]);
    }
    this._subviewDefinitions[key] = view;
    this.subviews[key] = _.isFunction(view) ? new view() : view;
    return this.subviews[key];
  },

  _createSubViews: function () {
    _.each(this.subviews, function (view, key) {
      if (_.isFunction(view)) {
        this.subviews[key] = new view();
      }
    }, this);
  },

  _closeSubview: function (view) {
    if (_.isFunction(view)) {
      return;
    }
    if (view.close) {
      view.close();
    } else {
      view.remove();
    }
  },

  _removeSubviews: function () {
    _.each(this.subviews, this._closeSubview, this);
    this.subviews = _.extend(Object.create(null), this._subviewDefinitions);
  },

  _reopen: function () {
    if (this.isClosed) {
      this.delegateEvents();
    }
    this.isClosed = false;
  },

  render: function () {
    this._reopen();
    return this;
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

    this.ui = this._ui || this.ui;
    delete this._ui;
  },

  // Clean up the view and remove from DOM
  close: function () {
    if (this.isClosed) {
      return this;
    }

    this.isClosed = true;

    // Remove subviews
    this._removeSubviews();

    // Unbind regions and ui
    this._unbindRegions();
    this._unbindUIElements();

    // Call backbone's remove
    Backbone.View.prototype.remove.call(this);
    return this;
  },

  remove: function () {
    return this.close();
  },

  _unbindDataEvents: function () {
    _.each(this._dataEventBindings, function (binding) {
      this.stopListening(binding.obj, binding.name, binding.callback);
    }, this);
    this._dataEventBindings = [];
  },

  // Keep the actual callbacks so function-valued maps can change safely.
  delegateEvents: function (events) {
    this._unbindDataEvents();
    Backbone.View.prototype.delegateEvents.call(this, events);
    this._dataEventBindings = Andamio.bindEvents(this, this.model, _.result(this, 'modelEvents'));
    this._dataEventBindings = this._dataEventBindings.concat(
      Andamio.bindEvents(this, this.collection, _.result(this, 'collectionEvents'))
    );
    return this;
  },

  undelegateEvents: function () {
    Backbone.View.prototype.undelegateEvents.apply(this, arguments);
    this._unbindDataEvents();
    return this;
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

    this._reopen();

    data = this.serializeData();

    html = Andamio.Utils.render(this.template, data);

    this._unbindRegions();
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
      this.listenTo(this.collection, 'add', this.addChildView);
      this.listenTo(this.collection, 'remove', this.removeItemView);
      this.listenTo(this.collection, 'reset sort', this.render);
    }
  },

  addChildView: function (item) {
    var ItemView = this._getItemView(item);
    var index = this.collection.indexOf(item);

    this.addItemView(item, ItemView, index);
  },

  _getItemView: function () {
    if (!this.itemView) {
      throw new Error('An `itemView` must be specified');
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
    if (this.isClosed) {
      this._initialEvents();
    }
    this._reopen();

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
    var options = _.isFunction(this.itemViewOptions) ? this.itemViewOptions(item, index) : this.itemViewOptions;
    var view = this.buildItemView(item, ItemView, options);

    // Store the child view itself so we can properly
    // remove and/or close it later
    this.children.splice(index, 0, view);

    // Render it and show it
    try {
      this.renderItemView(view, index);
    } catch (error) {
      this.removeChildView(view);
      throw error;
    }

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
      var nextView = collectionView.children[index + 1];
      if (nextView) {
        nextView.$el.before(itemView.el);
      } else {
        collectionView.$el.append(itemView.el);
      }
    }
  },

  isEmpty: function () {
    return !this.collection || this.collection.length === 0;
  },

  _renderChildren: function () {
    this.closeChildren();
    this.startBuffering();

    try {
      if (!this.isEmpty()) {
        this.showCollection();
      }
      this.endBuffering();
    } catch (error) {
      this.closeChildren();
      this.isBuffering = false;
      this.initRenderBuffer();
      throw error;
    }
  },

  // Internal method to loop through each item in the
  // collection view and show it
  showCollection: function () {
    this.collection.each(function (item, index) {
      this.addItemView(item, this._getItemView(item), index);
    }, this);
  },

  // Clean up the view and remove from DOM
  close: function () {
    if (this.isClosed) {
      return this;
    }

    this.closeChildren();

    return Andamio.View.prototype.close.apply(this, arguments);
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
  },

  configure: function (options) {
    var chain = [];
    var prototype = Object.getPrototypeOf(this);
    while (prototype) {
      if (Object.prototype.hasOwnProperty.call(prototype, 'defaults')) {
        var defaults = prototype.defaults;
        chain.unshift(_.isFunction(defaults) ? defaults.call(this) : defaults);
      }
      prototype = Object.getPrototypeOf(prototype);
    }
    this.defaults = _.extend.apply(_, [{}].concat(chain));
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

  // Computed functions read current attributes each time.
  get: function (name) {
    var computed = this.computedProperties;
    if (computed && Object.prototype.hasOwnProperty.call(computed, name)) {
      return _.isFunction(computed[name]) ? computed[name].call(this.attributes) : computed[name];
    }
    return Backbone.Model.prototype.get.call(this, name);
  },

  toJSON: function () {
    var data = Backbone.Model.prototype.toJSON.call(this);
    _.each(this.computedProperties, function (value, name) {
      data[name] = this.get(name);
    }, this);
    return data;
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
    options = options || {};
    if (options.router && Backbone.History.started) {
      throw new Error('Stop Backbone history before starting an application router.');
    }
    if (options.appView) {
      this._initAppView(options.appView);
    }

    // Initialize the router
    if (options.router) {
      this._initRouter(options.router);
    }

    this.initialize.apply(this, arguments);
    return this;
  },

  initialize: function () {},

  // Release views, listeners, and the history started by this application.
  stop: function () {
    if (this.appRegion) {
      this.appRegion.close();
      this.appRegion.stopListening();
      delete this.appRegion;
    }
    if (this.appView) {
      if (this.appView.close) {
        this.appView.close();
      } else {
        this.appView.remove();
      }
      delete this.appView;
    }
    if (this.router) {
      Backbone.history.stop();
      if (this.router.close) {
        this.router.close();
      } else {
        this.router.stopListening();
      }
      delete this.router;
    }
    this.stopListening();
    return this;
  },

  // Initialize app router
  _initRouter: function (router) {

    // Instantiate the Router
    this.router = _.isFunction(router) ? new router() : router;

    this._initAppRegion();

    Backbone.history.start(this.historyOptions);

    // Navigate to default route
    if (!Backbone.history.fragment) {
      var defaultRoute = _.findWhere(this.router.routes, {default: true});

      if (defaultRoute) {
        var url = _.isArray(defaultRoute.url) ? defaultRoute.url[0] : defaultRoute.url;
        this.router.navigate(url, {trigger: true});
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
    if (this.appView && this.appView !== appView) {
      if (this.appView.close) {
        this.appView.close();
      } else {
        this.appView.remove();
      }
    }
    this.appView = _.isFunction(appView) ? new appView() : appView;

    Andamio.$(this.container).empty().append(this.appView.render().el);
  }
});

Andamio.Application.extend = Andamio.extend;

  return Andamio;
}));
