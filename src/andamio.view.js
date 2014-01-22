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
      this.subviews[key] = new this._subviews[key]();
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

    if (!this._ui) {
      this._ui = this.ui;
    }

    this.ui = {};

    _.each(_.keys(this._ui), function (key) {
      this.ui[key] = this.$(this._ui[key]);
    }, this);
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
