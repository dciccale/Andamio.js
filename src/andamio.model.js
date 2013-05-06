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

  isReady: function () {
    return true;
  },

  _setReady: function () {
    this.set('ready', true);
  },

  _mixinComputedProperties: function () {
    var attributes = this.attributes || {};
    return _.extend(attributes, this.computedProperties);
  },

  load: function () {}
});
