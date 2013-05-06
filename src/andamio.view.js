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
