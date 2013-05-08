/*!
 * backbone.andamio v1.2.3 - 2013-05-08
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

  // iterate the bindings and apply corresponding bidning method
  function iterateEvents(target, obj, bindings, method) {
    if (!obj || !bindings) {
      return;
    }

    // iterate the bindings and un/bind them
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

})(Andamio);

  Andamio.Region = function (options) {
  this.options = options || {};
  this.$el = this.options.$el;
};

_.extend(Andamio.Region, {
  show: function (view) {
    this._ensureEl();
    if (view !== this.currentView) {
      this.close();
      view.render();
      this.open(view);
    } else {
      view.render();
    }
    this.currentView = view;
    if (_.isFunction(this.onShow)) {
      this.onShow();
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
    view.close();
    delete this.currentView;
  },

  _ensureEl: function () {
    if (!this.$el || this.$el.length === 0) {
      this.$el = $('[data-region="' + this.el + '"]');
    }
  }
});

  Andamio.View = Backbone.View.extend({
  constructor: function () {
    _.bindAll(this);
    Backbone.View.apply(this, arguments);
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

    if (!$regions.length) {
      return;
    }

    // regions hash
    view.regions = {};

    // populate regions hash
    $regions.each(function (i, el) {
      var $el = $(el);
      var key = $el.attr('data-region');
      var Subview = view.subviews[key];
      // manage a new region
      view.regions[key] = new Andamio.Region({$el: $el});
      // find subview match to set the region
      if (Subview) {
        view.subviews[key] = new Subview({el: $el});
      }
    });
  },

  _unbindRegions: function () {
    if (!this.regions) {
      return;
    }

    // delete region bindings
    this._deleteProp('regions');
  },

  _bindUIElements: function () {
    if (!this.ui) {
      return;
    }

    if (!this._ui) {
      this._ui = this.ui;
    }

    this.ui = {};

    _.each(_.keys(this._ui), function (key) {
      this.ui[key] = this.$(this._ui[key]);
    }, this);
  },

  // this method unbinds the elements specified in the "ui" hash
  _unbindUIElements: function () {
    if (!this.ui) {
      return;
    }

    this._deleteProp('ui');
    this.ui = this._ui;
    delete this._ui;
  },

  _removeSubviews: function () {
    if (!this.subviews) {
      return;
    }
    _.invoke(this.subviews, 'close');
    this._deleteProp('subviews');
  },

  // clean up the view and remove from DOM
  close: function () {
    if (this.isClosed) {
      return;
    }
    this.isClosed = true;

    // remove subviews
    this._removeSubviews();
    // unbind regions and ui
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
  },

  // helper method to correctly delete properties
  _deleteProp: function (prop) {
    var obj = this[prop];
    _.each(obj, function (item, name) {
      delete obj[name];
    }, this);
    delete this[prop];
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

  // simple way to know if a model is raedy
  // usefule for showing a loading component
  isReady: function () {
    return true;
  },

  // shortcut for telling the model is ready
  _setReady: function () {
    this.set('ready', true);
  },

  /* extend model attributes with computed properties
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

  // default function to be called from the router recieving url params
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

_.extend(Andamio.Application.prototype, Backbone.Events, Andamio.Region, {
  container: 'body',

  el: 'main',

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
    this.router = new this.router();
  },

  // initialize app view
  _initAppView: function () {
    this.appView = new this.appView({el: this.container});
    this.appView.render();
  },

  onShow: function () {
    this.appView.trigger('navigate', this.currentView);
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
