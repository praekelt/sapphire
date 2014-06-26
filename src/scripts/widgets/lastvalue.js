var utils = require('../utils');


module.exports = require('./widget').extend()
  .prop('width')
  .default(400)

  .prop('colspan')
  .default(2)

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
  .default(d3.format(',2s'))

  .prop('none')
  .default(0)

  .prop('sparkline')

  .init(function() {
    this.sparkline(sparkline());
  })

  .enter(function(el) {
    el.attr('class', 'lastvalue');

    el.append('div')
      .attr('class', 'title');

    var body = el.append('div')
      .attr('class', 'body');

    body.append('div')
      .attr('class', 'last');

    body.append('div')
      .attr('class', 'sparkline');
  })

  .draw(function(el) {
    var self = this;

    el.select('.title')
      .text(this.title());

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

    var spark = this.sparkline()
      .width(parseInt(el.select('.body').style('width')))
      .x(this.x())
      .y(this.y());

    el.select('.sparkline')
      .datum(this.values())
      .call(spark);
  });


var sparkline = require('../view').extend()
  .prop('x')
  .prop('y')

  .prop('height').default(30)
  .prop('width').default(200)

  .prop('margin').default({
    top: 6,
    left: 30,
    bottom: 6,
    right: 30 
  })

  .enter(function(el) {
    el.append('svg')
      .append('g')
      .append('path');
  })

  .draw(function(el) {
    var self = this;
    var margin = this.margin();

    var fx = d3.scale.linear()
      .domain(d3.extent(el.datum(), this.x()))
      .range([0, this.width() - (margin.left + margin.right)]);

    var fy = d3.scale.linear()
      .domain(d3.extent(el.datum(), this.y()))
      .range([this.height() - (margin.top + margin.bottom), 0]);

    var line = d3.svg.line()
      .x(function(d, i) {
        return fx(self.x().call(this, d, i));
      })
      .y(function(d, i) {
        return fy(self.y().call(this, d, i));
      });

    el.select('svg')
      .attr('width', this.width())
      .attr('height', this.height())
      .select('g')
        .attr('transform', utils.translate(margin.left, margin.top))
        .select('path')
          .attr('d', line);
  });
