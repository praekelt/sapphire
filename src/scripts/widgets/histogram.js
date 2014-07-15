var utils = require('../utils');


module.exports = require('./widget').extend()
  .prop('width')
  .default(400)

  .prop('colspan')
  .default(4)

  .prop('height')
  .default(150)

  .prop('barPadding')
  .default(5)

  .prop('tickFormat')
  .default(null)

  .prop('ticks')
  .default(7)

  .prop('margin')
  .default({
    top: 4,
    left: 25,
    right: 25,
    bottom: 25
  })

  .prop('values')
  .set(d3.functor)
  .default(function(d) { return d.values; })

  .prop('x')
  .set(d3.functor)
  .default(function(d) { return d.x; })

  .prop('y')
  .set(d3.functor)
  .default(function(d) { return d.y; })

  .enter(function(el) {
    el.attr('class', 'histogram widget');

    var svg = el.append('div')
      .attr('class', 'chart')
      .append('svg')
      .append('g');

    svg.append('g')
      .attr('class', 'bars');

    svg.append('g')
      .attr('class', 'axis');
  })

  .draw(function(el) {
    var self = this;
    var node = el.node();

    el.datum(function(d, i) {
        return {
          values: self.values()
            .call(node, d, i)
            .map(value),
          height: self.height()
            .call(node, d, i)
        };
      })
      .style('height', function(d) { return d.height + 'px'; });

    var values = el.datum().values;
    var margin = this.margin();
    var chart = el.select('.chart');
    var width = chart.style('width');
    var height = chart.style('height');
    chart.style('width', width);
    chart.style('height', height);
    width = parseInt(width) - (margin.left + margin.right);
    height = parseInt(height) - (margin.top + margin.bottom);
    var barWidth = (width / values.length) - (this.barPadding() / 2);

    var fx = d3.time.scale()
      .domain(d3.extent(values, function(d) { return d.x; }))
      .range([0, width]);

    var fy = d3.scale.linear()
      .domain([0, d3.max(values, function(d) { return d.y; })])
      .range([height, 0]);

    var svg = el.select('svg')
      .attr('width', width + (margin.left + margin.right))
      .attr('height', height + (margin.top + margin.bottom))
      .select('g')
        .attr('transform', utils.translate(margin.left, margin.top));

    var bar = svg.select('.bars')
      .selectAll('.bar')
      .data(values, function(d) { return d.x; });

    bar.enter().append('g')
      .attr('class', 'bar')
      .append('rect');

    bar
      .attr('transform', function(d) {
        return utils.translate(fx(d.x) - (barWidth / 2), fy(d.y));
      });

    bar.select('rect')
      .attr('width', barWidth)
      .attr('height', function(d) { return height - fy(d.y); });

    bar.exit()
      .remove();

    var axis = d3.svg.axis()
      .scale(fx)
      .ticks(this.ticks())
      .tickFormat(this.tickFormat());

    svg.select('.axis')
      .attr('transform', utils.translate(0, height))
      .call(axis);

    function value(d, i) {
      return {
        x: self.x().call(node, d, i),
        y: self.y().call(node, d, i)
      };
    }
  });
