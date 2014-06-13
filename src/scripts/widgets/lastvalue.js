module.exports = require('./widget').extend()
  .confprop('title')
  .set(d3.functor)
  .title(function(d) { return d.title; })

  .confprop('values')
  .set(d3.functor)
  .values(function(d) { return d.values; })

  .confprop('x')
  .set(d3.functor)
  .x(function(d) { return d.x; })

  .confprop('y')
  .set(d3.functor)
  .y(function(d) { return d.y; })

  .confprop('format')
  .format(d3.format())

  .confprop('none')
  .none(0)

  .draw(function() {
    var self = this;

    var last = this.el().selectAll('.last')
      .data(function(d, i) {
        var values = self.values().call(this, d, i);
        return [values[values.length - 1]];
      });

    last
      .enter()
      .append('div');

    last
      .attr('class', 'last')
      .text(function(d, i) {
        var v = d
          ? self.y().call(this, d, i)
          : self.none();

          return self.format()(v);
      });
  });
