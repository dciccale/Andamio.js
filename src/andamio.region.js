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
