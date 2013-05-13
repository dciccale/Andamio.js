Andamio.View = Backbone.View.extend({
  constructor: function () {
    _.bindAll(this);
    if (this.model) {
      this.model = new this.model;
    }
    Backbone.View.apply(this, arguments);
  },

  render: function () {
    this.isClosed = false;

    var data = this._serializeData();
    this.$el.html(this.template(data));

    this._bindRegions();
    this._bindUIElements();

    if (_.isFunction(this.afterRender)) {
      this.afterRender();
    }

    return this;
  },

  _serializeData: function () {
    return this.model ? this.model.toJSON() : this.collection ? {items: this.collection.toJSON()} : {};
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
      if (Subview && _.isFunction(Subview)) {
        view.subviews[key] = new Subview({el: $el});
      } else if (Subview) {
        Subview.setElement($el).render();
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
