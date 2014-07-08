module.exports = require('../view').extend()
  .prop('colspan')
  .default(1)

  .prop('width')
  .set(d3.functor)
  .default(200)

  .draw(function(el) {
    var self = this;

    el.style('width', function(d, i) {
        return self.width().call(this, d, i) + 'px';
      });
  });
