module.exports = require('../view').extend()
  .static('colspan', 1)
  .static('rowspan', 1)

  .confprop('width')
  .set(d3.functor)
  .width(200)

  .confprop('height')
  .set(d3.functor)
  .height(200)

  .draw(function() {
    var self = this;

    this.el()
      .style('width', function(d, i) {
        return self.width().call(this, d, i) + 'px';
      })
      .style('height', function(d, i) {
        return self.height().call(this, d, i) + 'px';
      });
  });
