Andamio.View = Backbone.View.extend({
  constructor: function () {
    _.bindAll(this);
    this._bindSubviews();
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
    data = this.model ? this.model.toJSON() : this.collection ? this.collection.toJSON() : data;
    return this._mixinTemplateHelpers(data);
  },

  _bindRegions: function () {
    var view = this;
    var $regions = view.$('[data-region]');
    var show = function ($el) {
      return function (view) {
        view.$el = $el;
        view.render();
      };
    };

    if (!$regions.length) {
      return;
    }

    // regions hash
    view.regions = {};

    // populate regions hash
    $regions.each(function (i, el) {
      var $el = $(el);
      var key = $el.attr('data-region');
      view.regions[key] = {$el: $el, show: show($el)};
      // if a region matches with a subview, set view el for the view
      if (view.subviews[key]) {
        view.subviews[key].$el = $el;
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
    // create hash of subviews (name: view)
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
    this._deleteProp('subviews', function (view) {
      view.remove();
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

  remove: function () {
    if (this.isClosed) {
      return;
    }
    this.isClosed = true;

    // remove sub views
    this._removeSubviews();

    // unbind region and ui elements
    this._unbindRegions();
    this._unbindUIElements();

    // remove the view from the dom
    this.remove();
  },

  _mixinTemplateHelpers: function (target) {
    target = target || {};
    var templateHelpers = this.templateHelpers;
    if (_.isFunction(templateHelpers)) {
      templateHelpers = templateHelpers.call(this);
    }
    return _.extend(target, templateHelpers);
  }
});
