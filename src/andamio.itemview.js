Andamio.ItemView = Andamio.View.extend({

  constructor: function () {
    var collectionView;

    // Allow passing a model or collection constructor to be automatically initialized
    if (_.isFunction(this.model)) {
      this.model = new this.model();
    }

    if (_.isFunction(this.collection)) {
      this.collection = new this.collection();
    }

    Andamio.View.prototype.constructor.apply(this, arguments);

    // Easy way to render a CollectionView inside an ItemView
    // Check if there is an actual collection to render
    if (this.collectionView && this.collection) {

      // Check if it's a constructor
      collectionView = new this.collectionView({collection: this.collection});

      // Track as a subview
      this.addSubview('collectionView', collectionView);
    }
  },

  render: function () {
    var data, html;

    this.isClosed = false;

    data = this.serializeData();

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

  // Serialize the model or collection. If both are found, it defaults to the model, you can
  // override this method to do a custom serialization.
  serializeData: function () {
    return this.model ?
      this.model.toJSON() : this.collection ? {items: this.collection.toJSON()} : {};
  }
});
