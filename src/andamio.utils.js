Andamio.Utils = {
  render: function (template, data) {
    if (!template) {
      throw new Error('Cannot render the template since it\'s false, null or undefined.');
    }

    return template(data);
  }
};
