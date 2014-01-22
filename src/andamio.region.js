Andamio.Region = function (options) {
  _.extend(this, options);

  if (!this.el && !this.$el) {
    throw new Error('An "el" or "$el" property must be specified for a region');
  }

  if (this.initialize) {
    this.initialize.apply(this, arguments);
  }
};

_.extend(Andamio.Region.prototype, Backbone.Events, {
  show: function (view) {
    var isDifferentView;

    this._ensureEl();

    isDifferentView = view !== this.currentView;

    if (isDifferentView) {
      this.close();
    }

    view.render();

    if (isDifferentView || view.isClosed) {
      this.open(view);
    }

    this.currentView = view;

    this.trigger.call(this, 'show', view);

    if (_.isFunction(this.onShow)) {
      this.onShow.apply(this, _.tail(arguments));
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

    if (view.close) {
      view.close();
    } else if (view.remove) {
      view.remove();
    }

    if (_.isFunction(this.onClose)) {
      this.onClose();
    }

    delete this.currentView;
  },

  _ensureEl: function () {
    if (!this.$el || this.$el.length === 0) {
      this.$el = $('[data-region="' + this.el + '"]');
    }
  },

  reset: function () {
    this.close();
    delete this.$el;
  }
});
