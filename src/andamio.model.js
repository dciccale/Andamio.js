Andamio.Model = Backbone.Model.extend({
  constructor: function (attributes, options) {
    this.configure(options);
    Backbone.Model.apply(this, arguments);
    this._mixinComputedProperties();
  },

  configure: function (options) {
    _.extend(this.defaults, this.constructor.__super__.defaults);
    this.options = options || {};
    _.bindAll(this);
  },

  defaults: {
    ready: false
  },

  // simple way to know if a model is raedy
  // usefule for showing a loading component
  isReady: function () {
    return true;
  },

  // shortcut for telling the model is ready
  _setReady: function () {
    this.set('ready', true);
  },

  /* extend model attributes with computed properties
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

  // default function to be called from the router recieving url params
  load: function () {}
});
