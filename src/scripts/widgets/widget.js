module.exports = require('../view').extend()
  .prop('colspan')
  .default(1)
  .prop('rowspan')
  .default(1)

  .confprop('width')
  .set(d3.functor)
  .width(200)

  .confprop('height')
  .set(d3.functor)
  .height(200)

  .draw(function(el) {
    var self = this;

    el.style('width', function(d, i) {
        return self.width().call(this, d, i) + 'px';
      })
      .style('height', function(d, i) {
        return self.height().call(this, d, i) + 'px';
      });
  });
