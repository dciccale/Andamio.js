Andamio.CollectionView = Andamio.View.extend({

  constructor: function () {

    // Allow passing a collection constructor to be automatically initialized
    if (_.isFunction(this.collection)) {
      this.collection = new this.collection();
    }

    this.children = [];

    Andamio.View.prototype.constructor.apply(this, arguments);

    this._initialEvents();
    this.initRenderBuffer();
  },

  initRenderBuffer: function() {
    this.elBuffer = document.createDocumentFragment();
    this._bufferedChildren = [];
  },

  startBuffering: function() {
    this.initRenderBuffer();
    this.isBuffering = true;
  },

  endBuffering: function() {
    this.isBuffering = false;
    this.appendBuffer(this, this.elBuffer);
    this._bufferedChildren = [];
    this.initRenderBuffer();
  },

  _initialEvents: function() {
    if (this.collection) {
      this.listenTo(this.collection, 'add', this.addChildView, this);
      this.listenTo(this.collection, 'remove', this.removeItemView, this);
      this.listenTo(this.collection, 'reset', this.render, this);
    }
  },

  addChildView: function (item, collection, options) {
    var ItemView = this._getItemView(item);
    var index = this.collection.indexOf(item);

    this.addItemView(item, ItemView, index);
  },

  _getItemView: function (item) {
    if (!this.itemView) {
      throw 'An `itemView` must be specified';
    }

    return this.itemView;
  },

  removeItemView: function (item) {
    var view = _.findWhere(this.children, {model: item});
    this.removeChildView(view);
  },

  // Remove the child view and close it
  removeChildView: function(view) {

    // shut down the child view properly,
    // including events that the collection has from it
    if (view) {
      this.stopListening(view);

      // call 'close' or 'remove', depending on which is found
      if (view.close) {
        view.close();
      } else if (view.remove) {
        view.remove();
      }

      this.children = _.without(this.children, view);
    }
  },

  render: function () {
    this.isClosed = false;

    this._renderChildren();

    if (_.isFunction(this.afterRender)) {
      this.afterRender();
    }

    return this;
  },

  // Render the child item's view and add it to the
  // HTML for the collection view.
  addItemView: function (item, ItemView, index) {

    // build the view
    var view = this.buildItemView(item, ItemView, this.itemViewOptions);

    // Store the child view itself so we can properly
    // remove and/or close it later
    this.children.push(view);

    // Render it and show it
    this.renderItemView(view, index);

    return view;
  },

  // render the item view
  renderItemView: function (view, index) {
    view.render();
    this.appendHtml(this, view, index);
  },

  // Build an `itemView` for every model in the collection.
  buildItemView: function (item, ItemView, itemViewOptions) {
    var options = _.extend({model: item}, itemViewOptions);

    return new ItemView(options);
  },

  appendBuffer: function(collectionView, buffer) {
    collectionView.$el.append(buffer);
  },

  // Append the HTML to the collection's `el`.
  // Override this method to do something other
  // then `.append`.
  appendHtml: function (collectionView, itemView, index) {
    if (collectionView.isBuffering) {

      // buffering happens on reset events and initial renders
      // in order to reduce the number of inserts into the
      // document, which are expensive.
      collectionView.elBuffer.appendChild(itemView.el);
      collectionView._bufferedChildren.push(itemView);
    } else {

      // If we've already rendered the main collection, just
      // append the new items directly into the element.
      collectionView.$el.append(itemView.el);
    }
  },

  isEmpty: function () {
    return !this.collection || this.collection.length === 0;
  },

  _renderChildren: function () {
    this.startBuffering();

    this.closeChildren();

    if (!this.isEmpty()) {
      this.showCollection();
    }

    this.endBuffering();
  },

  // Internal method to loop through each item in the
  // collection view and show it
  showCollection: function () {
    this.collection.each(function (item, index) {
      this.addItemView(item, this.itemView, index);
    }, this);
  },

  // Clean up the view and remove from DOM
  close: function () {
    if (this.isClosed) {
      return;
    }

    this.closeChildren();

    Andamio.View.prototype.close.apply(this, arguments);
  },

  closeChildren: function () {
    _.each(this.children, function (child) {
      this.removeChildView(child);
    }, this);
  }
});
