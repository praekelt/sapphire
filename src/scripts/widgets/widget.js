module.exports = require('../view').extend()
  .confprop('width')
  .width(200)

  .confprop('height')
  .height(200)

  .draw(function() {
    var self = this;

    this.el()
      .style('width', function() { return self.width() + 'px'; })
      .style('height', function() { return self.height() + 'px'; });
  });
