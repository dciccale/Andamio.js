Andamio.Model = Backbone.Model.extend({
  constructor: function (attributes, options) {
    this.configure(options);
    Backbone.Model.apply(this, arguments);
  },

  configure: function (options) {
    var chain = [];
    var prototype = Object.getPrototypeOf(this);
    while (prototype) {
      if (Object.prototype.hasOwnProperty.call(prototype, 'defaults')) {
        var defaults = prototype.defaults;
        chain.unshift(_.isFunction(defaults) ? defaults.call(this) : defaults);
      }
      prototype = Object.getPrototypeOf(prototype);
    }
    this.defaults = _.extend.apply(_, [{}].concat(chain));
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

  // Computed functions read current attributes each time.
  get: function (name) {
    var computed = this.computedProperties;
    if (computed && Object.prototype.hasOwnProperty.call(computed, name)) {
      return _.isFunction(computed[name]) ? computed[name].call(this.attributes) : computed[name];
    }
    return Backbone.Model.prototype.get.call(this, name);
  },

  toJSON: function () {
    var data = Backbone.Model.prototype.toJSON.call(this);
    _.each(this.computedProperties, function (value, name) {
      data[name] = this.get(name);
    }, this);
    return data;
  },

  // Default function to be called from the router recieving url params
  // should be overridden by the model for example if params need to be parsed or
  // prepared and finally call the fetch method
  load: function () {}
});
