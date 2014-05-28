module.exports = require('./widget').extend()
  .confprop('title')
  .set(d3.functor)

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

  .confprop('noval')
  .noval(0)

  .draw(function() {
    var self = this;

    this.el()
      .html(null)
      .append('div')
        .datum(this.values())
        .attr('class', 'values')
        .append('text')
          .datum(function(d) {
            return d[d.length - 1];
          })
          .attr('class', 'last')
          .text(function(d) {
            var v = d
              ? self.y().call(this, d)
              : self.noval();

              return self.format()(v);
          });
  });
