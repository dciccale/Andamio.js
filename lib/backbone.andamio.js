/*!
 * backbone.andamio v1.1.0 - 2013-05-06
 * http://andamiojs.com
 * Copyright (c) 2013 Denis Ciccale (@tdecs)
 * Released under the MIT license
 * https://github.com/dciccale/Andamio.js/blob/master/LICENSE.txt
 */
(function (global, Backbone, _) {
  'use strict';

  var Andamio = {
    // use default DOM library
    $: Backbone.$,

    extend: Backbone.Model.extend
  };

  (function (Andamio) {
  // Bind the event to handlers specified as a string of
  // handler names on the target object
  function bindFromStrings(target, entity, evt, methods) {
    var methodNames = methods.split(/\s+/);

    _.each(methodNames,function (methodName) {

      var method = target[methodName];
      if(!method) {
        throw new Error('Method "' + methodName + '" was configured as an event handler, but does not exist.');
      }

      target.listenTo(entity, evt, method, target);
    });
  }

  // Bind the event to handlers specified as a string of
  // handler names on the target object
  function unbindFromStrings(target, entity, evt, methods) {
    var methodNames = methods.split(/\s+/);

    _.each(methodNames,function (methodName) {
      /* jshint unused: vars */
      var method = target[method];
      target.stopListening(entity, evt, method, target);
    });
  }

  // generic looping function
  function iterateEvents(target, entity, bindings, stringCallback) {
    if (!entity || !bindings) {
      return;
    }

    // allow the bindings to be a function
    if (_.isFunction(bindings)) {
      bindings = bindings.call(target);
    }

    // iterate the bindings and bind them
    _.each(bindings, function (methods, evt) {

      // allow for a function as the handler,
      // or a list of event names as a string
      stringCallback(target, entity, evt, methods);

    });
  }

  // Export Public API
  Andamio.bindEvents = function (target, entity, bindings) {
    iterateEvents(target, entity, bindings, bindFromStrings);
  };

  Andamio.unbindEvents = function (target, entity, bindings) {
    iterateEvents(target, entity, bindings, unbindFromStrings);
  };

})(Andamio);

  Andamio.View = Backbone.View.extend({
  constructor: function () {
    _.bindAll(this);
    Backbone.View.apply(this, arguments);
    this._bindSubviews();
  },

  render: function () {
    this.isClosed = false;

    var data = this._serializeData(data);
    this.$el.html(this.template(data));

    this._bindRegions();
    this._bindUIElements();

    if (_.isFunction(this.afterRender)) {
      this.afterRender();
    }

    return this;
  },

  _serializeData: function (data) {
    return this.model ? this.model.toJSON() : this.collection ? {items: this.collection.toJSON()} : data;
  },

  _bindRegions: function () {
    var view = this;
    var $regions = view.$('[data-region]');
    var show;

    if (!$regions.length) {
      return;
    }

    show = function (view) {
      this.$el.html(view.render().el);
    };

    // regions hash
    view.regions = {};

    // populate regions hash
    $regions.each(function (i, el) {
      var $el = $(el);
      var key = $el.attr('data-region');
      var Subview = view.subviews[key];
      view.regions[key] = {$el: $el, show: show};
      if (Subview) {
        view.subviews[key] = new Subview({el: $el});
      }
    });
  },

  _unbindRegions: function () {
    if (!this.regions) {
      return;
    }

    // delete all of the existing ui bindings
    this._deleteProp('regions');
    this.regions = {};
  },

  _bindUIElements: function () {
    this._bindProp('ui', function (bindings, prop, key) {
      this[prop][key] = this.$(bindings[key]);
    });
  },

  // this method unbinds the elements specified in the "ui" hash
  _unbindUIElements: function () {
    this._unbindProp('ui');
  },

  _bindSubviews: function () {
    this._bindProp('subviews', function (bindings, prop, key) {
      this[prop][key] = bindings[key];
    });
  },

  _unbindSubviews: function () {
    this._unbindProp('subviews');
  },

  _unbindProp: function (prop) {
    var _prop = '_' + prop;
    if (!this[prop]) {
      return;
    }

    this._deleteProp(prop);
    this[prop] = this[_prop];
    delete this[_prop];
  },

  // bind property hash saving default config
  _bindProp: function (prop, callback) {
    var _prop = '_' + prop;

    if (!this[prop]) {
      return;
    }

    if (!this[_prop]) {
      this[_prop] = this[prop];
    }

    var bindings = _.result(this, _prop);

    this[prop] = {};

    _.each(_.keys(bindings), function (key) {
      callback.call(this, bindings, prop, key);
    }, this);
  },

  _removeSubviews: function () {
    _.each(this.subviews, function (view) {
      view.close();
    });
  },

  _deleteProp: function (prop, callback) {
    var obj = this[prop];
    _.each(obj, function (item, name) {
      if (callback) {
        callback.call(this, item, name);
      }
      delete obj[name];
    }, this);
    delete this[prop];
  },

  close: function () {
    if (this.isClosed) {
      return;
    }
    this.isClosed = true;

    // remove sub views
    this._removeSubviews();

    // unbind region and ui elements
    this._unbindSubviews();
    this._unbindRegions();
    this._unbindUIElements();

    // call backbone's remove
    this.remove();
  },

  // override Backbone's delegateEvents to bind model and collection events
  delegateEvents: function (events) {
    Andamio.bindEvents(this, this.model, this.modelEvents);
    Andamio.bindEvents(this, this.collection, this.collectionEvents);
    Backbone.View.prototype.delegateEvents.call(this, events);
  },

  // override Backbone's undelegateEvents to unbind model and collection events
  undelegateEvents: function () {
    Backbone.View.prototype.undelegateEvents.apply(this, arguments);
    Andamio.unbindEvents(this, this.model, this.modelEvents);
    Andamio.unbindEvents(this, this.collection, this.collectionEvents);
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
    _.bindAll(this);
  },

  defaults: {
    ready: false
  },

  isReady: function () {
    return true;
  },

  _setReady: function () {
    this.set('ready', true);
  },

  _mixinComputedProperties: function () {
    var attributes = this.attributes || {};
    return _.extend(attributes, this.computedProperties);
  },

  load: function () {}
});

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

  Andamio.Application = function (options) {
  _.extend(this, options);
  this.vent = _.extend({}, Backbone.Events);
};

_.extend(Andamio.Application.prototype, Backbone.Events, {
  mainRegion: 'main',

  // starts the app
  start: function () {
    this._initRouter();
    this._initAppView();
    this.initialize.apply(this, arguments);
    this.listenTo(this.router, 'navigate', this.show);
  },

  initialize: function () {},

  // initialize app router
  _initRouter: function () {
    this.router = new this.router({app: this});
  },

  // initialize app view
  _initAppView: function () {
    this.appView = new this.appView;
    this.appView.render();
    $('body').empty().append(this.appView.el);
  },

  show: function (view, name, urlParams) {
    /* jshint unused: vars */
    this._ensureEl();
    if (view !== this.currentView) {
      this._close();
      view.render();
      this._open(view);
    } else {
      view.render();
    }
    this.currentView = view;
    this.appView.trigger('navigate', view);
  },

  _ensureEl: function () {
    if (!this.$el || this.$el.length === 0) {
      this.$el = $('[data-region="' + this.mainRegion + '"]');
    }
  },

  _open: function (view) {
    this.$el.empty().append(view.el);
  },

  _close: function () {
    if (this.currentView) {
      this.currentView.remove();
    }
  }
});

Andamio.Application.extend = Andamio.extend;


  // expose Andamio
  global.Andamio = Backbone.Andamio = Andamio;

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

}(this, Backbone, _));
