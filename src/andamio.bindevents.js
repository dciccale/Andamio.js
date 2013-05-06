(function (Andamio) {
  // Bind the event to handlers specified as a string of
  // handler names on the target object
  function bindFromStrings(target, entity, evt, methods) {
    var methodNames = methods.split(/\s+/);

    _.each(methodNames,function (methodName) {

      var method = target[methodName];
      if(!method) {
        throw new Error('Method "' + methodName + '" was configured as an event handler, but does not exist.');
      }

      target.listenTo(entity, evt, method, target);
    });
  }

  // Bind the event to handlers specified as a string of
  // handler names on the target object
  function unbindFromStrings(target, entity, evt, methods) {
    var methodNames = methods.split(/\s+/);

    _.each(methodNames,function (methodName) {
      /* jshint unused: vars */
      var method = target[method];
      target.stopListening(entity, evt, method, target);
    });
  }

  // generic looping function
  function iterateEvents(target, entity, bindings, stringCallback) {
    if (!entity || !bindings) {
      return;
    }

    // allow the bindings to be a function
    if (_.isFunction(bindings)) {
      bindings = bindings.call(target);
    }

    // iterate the bindings and bind them
    _.each(bindings, function (methods, evt) {

      // allow for a function as the handler,
      // or a list of event names as a string
      stringCallback(target, entity, evt, methods);

    });
  }

  // Export Public API
  Andamio.bindEvents = function (target, entity, bindings) {
    iterateEvents(target, entity, bindings, bindFromStrings);
  };

  Andamio.unbindEvents = function (target, entity, bindings) {
    iterateEvents(target, entity, bindings, unbindFromStrings);
  };

})(Andamio);
