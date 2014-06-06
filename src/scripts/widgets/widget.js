module.exports = require('../view').extend()
  .confprop('colspan')
  .colspan(1)

  .confprop('rowspan')
  .rowspan(1)

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
