var utils = require('../utils');


module.exports = require('./widget').extend()
  .prop('barPadding')
  .default(2.5)

  .prop('chartMargin')
  .default({
    top: 10,
    left: 38,
    right: 15,
    bottom: 45
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

  .prop('xTickFormat')
  .default(null)

  .prop('xTicks')
  .default(8)

  .prop('yTickFormat')
  .default(d3.format('.2s'))

  .prop('yTicks')
  .default(5)

  .prop('yMax')
  .set(d3.functor)
  .default(d3.max)

  .prop('colors')

  .init(function() {
    this.colors(d3.scale.category10());
  })

  .draw(function(el) {
    var opts = this.props();
    normalize(el, opts);

    opts.width = utils.innerWidth(el);
    opts.color = opts.colors(el.datum().title);
    drawWidget(el, opts);
  });


function drawWidget(el, opts) {
  el.classed('sph-widget sph-widget-bars', true);

  if (!opts.explicitComponents) initComponents(el);

  var component = el.select('[data-widget-component="title"]');
  if (component.size()) component.call(drawTitle);

  component = el.select('[data-widget-component="chart"]');
  if (component.size()) component.call(drawChart, opts);
}


function initComponents(el) {
  el.append('div')
    .attr('data-widget-component', 'title');

  el.append('div')
    .attr('data-widget-component', 'chart');
}


function drawTitle(title) {
  title
    .classed('sph-title', true)
    .text(function(d) { return d.title; });
}


function drawChart(chart, opts) {
  chart
    .classed('sph-chart sph-chart-bars', true)
    .datum(function(d) { return d.values; });

  var dims = utils.box()
    .width(opts.width)
    .height(utils.innerHeight(chart))
    .margin(opts.chartMargin)
    .calc();

  var fx = d3.time.scale()
    .domain([
      d3.min(chart.datum(), function(d) { return d.x; }),
      d3.max(chart.datum(), function(d) { return d.x + d.dx; })]);

  var ys = chart.datum()
    .map(function(d) { return d.y; });

  var fy = d3.scale.linear()
    .domain([0, opts.yMax(ys)]);

  fx.range([0, dims.innerWidth]);
  fy.range([dims.innerHeight, 0]);

  chart
    .filter(utils.isEmptyNode)
    .call(initChart);

  chart.select('svg')
    .call(drawSvg, dims, fx, fy, opts);
}


function initChart(chart) {
  var svg = chart
    .append('svg')
    .append('g');

  svg.append('g')
    .attr('class', 'sph-bars');

  svg.append('g')
    .attr('class', 'sph-axis sph-axis-bars-x');

  svg.append('g')
    .attr('class', 'sph-axis sph-axis-bars-y');
}


function drawSvg(svg, dims, fx, fy, opts) {
  svg
    .attr('width', dims.width)
    .attr('height', dims.height)
    .select('g')
      .attr('transform', utils.translate(
        dims.margin.left,
        dims.margin.top));

  svg.select('.sph-bars')
     .call(drawBars, dims, fx, fy, opts);

  svg.select('.sph-axis-bars-x')
    .call(drawXAxis, dims, fx, opts);

  svg.select('.sph-axis-bars-y')
    .call(drawYAxis, dims, fy, opts);
}


function drawBars(bars, dims, fx, fy, opts) {
  bars
    .selectAll('.sph-bar')
    .data(function(d) { return d; },
          function(d) { return d.x; })
    .call(drawBar, dims, fx, fy, opts);
}


function drawBar(bar, dims, fx, fy, opts) {
  bar.enter().append('g')
    .attr('class', 'sph-bar')
    .append('rect');

  bar
    .attr('transform', function(d) {
      return utils.translate(fx(d.x), fy(d.y));
    });

  bar.select('rect')
    .style('fill', opts.color)
    .attr('width', function(d) {
      var width = fx(d.x + d.dx) - fx(d.x);
      width -= opts.barPadding;
      return Math.max(width, 1);
    })
    .attr('height', function(d) {
      return dims.innerHeight - fy(d.y); 
    });

  bar.exit()
    .remove();
}


function drawXAxis(axis, dims, fx, opts) {
  axis
    .attr('transform', utils.translate(0, dims.innerHeight))
    .call(d3.svg.axis()
      .scale(fx)
      .ticks(opts.xTicks)
      .tickFormat(opts.xTickFormat));
}


function drawYAxis(axis, dims, fy, opts) {
  axis.call(d3.svg.axis()
    .orient('left')
    .scale(fy)
    .tickPadding(8)
    .tickSize(-dims.innerWidth)
    .ticks(opts.yTicks)
    .tickFormat(opts.yTickFormat));
}


function normalize(el, opts) {
  var node = el.node();

  el.datum(function(d, i) {
    var values = opts.values
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
      title: opts.title.call(node, d, i)
    };
  });

  function value(d, i) {
    return {
      x: opts.x.call(node, d, i),
      y: opts.y.call(node, d, i),
      dx: opts.dx.call(node, d, i)
    };
  }
}
