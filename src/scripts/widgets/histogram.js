var utils = require('../utils');
var view = require('../view');


module.exports = require('./widget').extend()
  .prop('width')
  .default(400)

  .prop('colspan')
  .default(4)

  .prop('rowspan')
  .default(2)

  .prop('height')
  .default(200)

  .prop('barPadding')
  .default(5)

  .prop('margin')
  .default({
    top: 10,
    left: 35,
    right: 15,
    bottom: 20
  })

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

  .prop('dx')
  .set(d3.functor)
  .default(null)

  .prop('colors')

  .prop('xAxis')
  .prop('yAxis')

  .init(function() {
    this.colors(d3.scale.category10());
    this.xAxis(xAxis());
    this.yAxis(yAxis());
  })

  .meth(function normalize(el) {
    var self = this;
    var node = el.node();

    el.datum(function(d, i) {
      var values = self.values()
        .call(node, d, i)
        .map(value);

      var len = values.length;
      var dxAvg = values.length
        ? (values[len - 1].x - values[0].x) / len
        : 0;

      values.forEach(function(d) {
        d.dx = utils.ensure(d.dx, dxAvg);
      });

      return {
        values: values,
        title: self.title().call(node, d, i)
      };
    });

    function value(d, i) {
      return {
        x: self.x().call(node, d, i),
        y: self.y().call(node, d, i),
        dx: self.dx().call(node, d, i)
      };
    }
  })

  .enter(function(el) {
    el.attr('class', 'histogram widget');

    el.append('div')
      .attr('class', 'title');

    var svg = el.append('div')
      .attr('class', 'chart')
      .append('svg')
      .append('g');

    svg.append('g')
      .attr('class', 'bars');

    svg.append('g')
      .attr('class', 'y axis');

    svg.append('g')
      .attr('class', 'x axis');
  })

  .draw(function(el) {
    var self = this;
    this.normalize(el);

    el.style('height', el.style('min-height'));

    el.select('.widget .title')
      .text(function(d) { return d.title; });

    var chart = el.select('.chart')
      .datum(function(d) { return d.values; });

    var fx = d3.time.scale()
      .domain([
        d3.min(chart.datum(), function(d) { return d.x; }),
        d3.max(chart.datum(), function(d) { return d.x + d.dx; })]);

    var fy = d3.scale.linear()
      .domain([0, d3.max(chart.datum(), function(d) { return d.y; })]);

    var dims = utils.box()
      .width(parseInt(chart.style('width')))
      .height(parseInt(chart.style('height')))
      .margin(this.margin())
      .calc();

    chart
      .style('width', dims.width + 'px')
      .style('height', dims.height + 'px');

    fx.range([0, dims.innerWidth]);
    fy.range([dims.innerHeight, 0]);

    var svg = chart.select('svg')
      .attr('width', dims.width)
      .attr('height', dims.height)
      .select('g')
        .attr('transform', utils.translate(dims.margin.left, dims.margin.top));

    var bar = svg.select('.bars')
      .selectAll('.bar')
      .data(function(d) { return d; },
            function(d) { return d.x; });

    bar.enter().append('g')
      .attr('class', 'bar')
      .append('rect');

    bar
      .attr('transform', function(d) {
        return utils.translate(fx(d.x), fy(d.y));
      });

    bar.select('rect')
      .style('fill', this.colors()(el.datum().title))
      .attr('width', function(d) {
        var width = fx(d.x + d.dx) - fx(d.x);
        width -= self.barPadding() / 2;
        return Math.max(width, 1);
      })
      .attr('height', function(d) {
        return dims.innerHeight - fy(d.y); 
      });

    bar.exit()
      .remove();

    this.xAxis()(svg.select('.x.axis'), {
      fx: fx,
      dims: dims
    });

    this.yAxis()(svg.select('.y.axis'), {
      fy: fy,
      dims: dims
    });
  });


var xAxis = view.extend()
  .prop('widget')

  .prop('tickFormat')
  .default(null)

  .prop('ticks')
  .default(8)

  .init(function(widget) {
    this.widget(widget);
  })

  .enter(function(el) {
    el.attr('class', 'x axis');
  })

  .draw(function(el, params) {
    axis = d3.svg.axis()
      .scale(params.fx)
      .ticks(this.ticks())
      .tickFormat(this.tickFormat());

    el
      .attr('transform', utils.translate(0, params.dims.innerHeight))
      .call(axis);
  });


var yAxis = view.extend()
  .prop('widget')

  .prop('tickFormat')
  .default(d3.format('.2s'))

  .prop('ticks')
  .default(5)

  .init(function(widget) {
    this.widget(widget);
  })

  .enter(function(el) {
    el.attr('class', 'y axis');
  })

  .draw(function(el, params) {
    var axis = d3.svg.axis()
      .orient('left')
      .scale(params.fy)
      .tickPadding(8)
      .tickSize(-params.dims.innerWidth)
      .ticks(this.ticks())
      .tickFormat(this.tickFormat());
    
    el.call(axis);
  });
