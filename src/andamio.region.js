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
