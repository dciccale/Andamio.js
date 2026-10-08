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
