(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('underscore'), require('backbone'));
  } else if (typeof define === 'function' && define.amd) {
    define(['underscore', 'backbone'], factory);
  } else {
    root.Andamio = factory(root._, root.Backbone);
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function (_, Backbone) {
  'use strict';

  if (!_ || !Backbone) {
    throw new Error('Andamio requires Underscore and Backbone.');
  }

  var Andamio = {
    extend: Backbone.Model.extend
  };

  Object.defineProperty(Andamio, '$', {
    get: function () { return Backbone.$; },
    set: function (value) { Backbone.$ = value; }
  });

  Backbone.Andamio = Andamio;

  // @include andamio.utils.js
  // @include andamio.bindevents.js
  // @include andamio.region.js
  // @include andamio.view.js
  // @include andamio.itemview.js
  // @include andamio.collectionview.js
  // @include andamio.model.js
  // @include andamio.collection.js
  // @include andamio.router.js
  // @include andamio.application.js

  return Andamio;
}));
