Andamio.Utils = {
  render: function (template, data) {
    if (!_.isFunction(template)) {
      throw new Error('A template must be a function.');
    }

    return template(data);
  }
};
