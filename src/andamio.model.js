Andamio.Model = Backbone.Model.extend({
  constructor: function (attributes, options) {
    this.configure(options);
    Backbone.Model.apply(this, arguments);
    this._mixinComputedProperties();
  },

  configure: function (options) {
    _.extend(this.defaults, this.constructor.__super__.defaults);
    this.options = options || {};
  },

  defaults: {
    ready: false
  },

  // Simple way to know if a model is ready
  // Useful for showing a loading component
  // Should be overriden
  isReady: function () {
    return true;
  },

  // Shortcut to set the model as ready
  setReady: function () {
    this.set('ready', true);
  },

  /* Extend model attributes with computed properties
   * computedProperties: {
   *   fullName: function () {
   *     return this.name + ' ' + this.last;
   *   }
   * }
   */
  _mixinComputedProperties: function () {
    var attributes = this.attributes || {};

    return _.extend(attributes, this.computedProperties);
  },

  // Default function to be called from the router recieving url params
  // should be overridden by the model for example if params need to be parsed or
  // prepared and finally call the fetch method
  load: function () {}
});
