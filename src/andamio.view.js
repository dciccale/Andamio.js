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
