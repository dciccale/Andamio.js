(function (Andamio) {
  var methodSplitter = /\s+/;

  function resolveBindings(target, obj, bindings, strict) {
    var resolved = [];
    if (!obj || !bindings) {
      return resolved;
    }
    _.each(bindings, function (methods, name) {
      var methodNames = _.isFunction(methods) ? [methods] : methods.trim().split(methodSplitter);
      _.each(methodNames, function (methodName) {
        var callback = _.isFunction(methodName) ? methodName : target[methodName];
        if (!_.isFunction(callback)) {
          if (strict) {
            throw new Error('Method "' + methodName + '" was configured as an event handler, but does not exist.');
          }
          return;
        }
        resolved.push({ obj: obj, name: name, callback: callback });
      });
    });
    return resolved;
  }

  Andamio.bindEvents = function (target, obj, bindings) {
    var resolved = resolveBindings(target, obj, bindings, true);
    _.each(resolved, function (binding) {
      target.listenTo(binding.obj, binding.name, binding.callback);
    });
    return resolved;
  };

  Andamio.unbindEvents = function (target, obj, bindings) {
    _.each(resolveBindings(target, obj, bindings, false), function (binding) {
      target.stopListening(binding.obj, binding.name, binding.callback);
    });
  };
}(Andamio));
