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

  .draw(function(el) {
    var self = this;

    el.html(null)
      .append('div')
        .datum(this.values())
        .attr('class', 'values')
        .append('text')
          .datum(function(d, i) {
            return d[d.length - 1];
          })
          .attr('class', 'last')
          .text(function(d, i) {
            var v = d
              ? self.y().call(this, d, i)
              : self.none();

              return self.format()(v);
          });
  });
