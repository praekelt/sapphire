module.exports = require('./widget').extend()
  .prop('title')
  .set(d3.functor)
  .default(function(d) { return d.title; })

  .prop('values')
  .set(d3.functor)
  .default(function(d) { return d.values; })

  .prop('x')
  .set(d3.functor)
  .default(function(d) { return d.x; })

  .prop('y')
  .set(d3.functor)
  .default(function(d) { return d.y; })

  .prop('format')
  .default(d3.format())

  .prop('none')
  .default(0)

  .enter(function(el) {
    el.append('class', 'lastvalue')
      .append('div')
        .attr('class', 'last');
  })

  .draw(function(el) {
    var self = this;

    el.select('.last')
      .datum(function(d, i) {
        var values = self.values().call(this, d, i);
        return values[values.length - 1];
      })
      .text(function(d, i) {
        var v = d
          ? self.y().call(this, d, i)
          : self.none();

          return self.format()(v);
      });
  });
