Andamio.Collection = Backbone.Collection.extend({
  model: Andamio.Model,

  // Default function to be called from the router recieving url params
  // should be overridden by the model for example if params need to be parsed or
  // prepared and finally call the fetch method
  load: function () {}
});
