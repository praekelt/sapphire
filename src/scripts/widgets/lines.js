var utils = require('../utils');


module.exports = require('./widget').extend()
  .prop('title')
  .set(d3.functor)
  .default(function(d) { return d.title; })

  .prop('metrics')
  .set(d3.functor)
  .default(function(d) { return d.metrics; })

  .prop('key')
  .set(d3.functor)
  .default(function(d, i) { return i; })

  .prop('metricTitle')
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

  .prop('xTickFormat')
  .default(null)

  .prop('xTicks')
  .default(8)

  .prop('yFormat')
  .default(d3.format(',2s'))

  .prop('yTicks')
  .default(5)

  .prop('yTickFormat')
  .default(d3.format('.2s'))

  .prop('yMin')
  .set(d3.functor)
  .default(d3.min)

  .prop('yMax')
  .set(d3.functor)
  .default(d3.max)

  .prop('none')
  .default(0)

  .prop('chartMargin')
  .default({
    top: 10,
    left: 35,
    right: 15,
    bottom: 20
  })

  .prop('colors')
  .prop('chart')
  .prop('legend')

  .init(function() {
    this.colors(d3.scale.category10());
  })

  .draw(function(el) {
    var opts = this.props();
    normalize(el, opts);
    drawWidget(el, opts);
  });


function drawWidget(el, opts) {
  el.classed('lines widget', true);

  if (!opts.explicitComponents) initComponents(el);

  var component = el.select('[data-widget-component="title"]');
  if (component.size()) component.call(drawTitle);

  component = el.select('[data-widget-component="chart"]');
  if (component.size()) component.datum(getMetrics).call(drawChart, opts);

  component = el.select('[data-widget-component="legend"]');
  if (component.size()) component.datum(getMetrics).call(drawLegend, opts);
}


function initComponents(el) {
  el.append('div')
    .attr('data-widget-component', 'title');

  el.append('div')
    .attr('data-widget-component', 'chart');

  el.append('div')
    .attr('data-widget-component', 'legend');
}


function drawTitle(title) {
  title
    .classed('title', true)
    .text(function(d) { return d.title; });
}


function drawChart(chart, opts) {
  chart
    .classed('chart', true);

  var dims = utils.box()
    .margin(opts.chartMargin)
    .width(utils.innerWidth(chart))
    .height(utils.innerHeight(chart))
    .calc();

  var allValues = chart
    .datum()
    .reduce(function(results, metric) {
      results.push.apply(results, metric.values);
      return results;
    }, []);

  var fx = d3.time.scale()
    .domain(d3.extent(allValues, function(d) { return d.x; }))
    .range([0, dims.innerWidth]);

  var ys = allValues
    .map(function(d) { return d.y; });

  var fy = d3.scale.linear()
    .domain([opts.yMin(ys), opts.yMax(ys)])
    .range([dims.innerHeight, 0]);

  chart
    .filter(utils.isEmptyNode)
    .call(initChart);

  chart.select('svg')
    .call(drawSvg, dims, fx, fy, opts);
}


function initChart(chart) {
  var svg = chart.append('svg')
    .append('g');

  svg.append('g')
    .attr('class', 'x axis');

  svg.append('g')
    .attr('class', 'y axis');

  svg.append('g')
    .attr('class', 'metrics');
}


function drawSvg(svg, dims, fx, fy, opts) {
  svg
    .attr('width', dims.width)
    .attr('height', dims.height)
    .select('g')
      .attr('transform', utils.translate(dims.margin.left, dims.margin.top));

  svg.select('.metrics')
    .call(drawChartMetrics, fx, fy);

  svg.select('.x.axis')
    .call(drawXAxis, dims, fx, opts);

  svg.select('.y.axis')
    .call(drawYAxis, dims, fy, opts);
}


function drawChartMetrics(metrics, fx, fy) {
  var line = d3.svg.line()
    .x(function(d) { return fx(d.x); })
    .y(function(d) { return fy(d.y); });

  metrics.selectAll('.metric')
    .data(function(d) { return d; },
          function(d) { return d.key; })
    .call(drawChartMetric, fx, fy, line);
}


function drawChartMetric(metric, fx, fy, line) {
  metric.enter().append('g')
    .attr('class', 'metric')
    .attr('data-key', function(d) { return d.key; })
    .append('path')
      .attr('class', 'line');

  metric.select('.line')
    .attr('stroke', function(d) { return d.color; })
    .attr('d', function(d) { return line(d.values); });

  metric.exit()
    .remove();

  metric.selectAll('.dot')
    .data(function(d) {
      if (!d.values.length) { return []; }
      var last = d.values[d.values.length - 1];

      return [{
        x: last.x,
        y: last.y,
        color: d.color
      }];
    })
    .call(drawDot, fx, fy);
}


function drawDot(dot, fx, fy) {
  dot.enter().append('circle')
    .attr('class', 'dot')
    .attr('r', 4);

  dot
    .attr('fill', function(d) { return d.color; })
    .attr('cx', function(d) { return fx(d.x); })
    .attr('cy', function(d) { return fy(d.y); });

  dot.exit()
    .remove();
}


function drawXAxis(axis, dims, fx, opts) {
  axis
    .attr('transform', utils.translate(0, dims.innerHeight))
    .call(d3.svg.axis()
      .scale(fx)
      .tickPadding(8)
      .ticks(opts.xTicks)
      .tickFormat(opts.xTickFormat)
      .tickSize(-dims.innerHeight));
}


function drawYAxis(axis, dims, fy, opts) {
  axis.call(d3.svg.axis()
    .orient('left')
    .scale(fy)
    .tickPadding(8)
    .ticks(opts.yTicks)
    .tickFormat(opts.yTickFormat)
    .tickSize(-dims.innerWidth));
}


function drawLegend(legend, opts) {
  legend
    .classed('legend', true);

  legend
    .filter(utils.isEmptyNode)
    .call(initLegend);

  legend.select('.table').selectAll('.metric')
    .data(function(d) { return d; },
          function(d) { return d.key; })
    .call(drawLegendMetric, opts);
}


function initLegend(legend) {
  legend.append('table')
    .attr('class', 'table');
}


function drawLegendMetric(metric, opts) {
  var none = opts.yFormat(opts.none);

  metric.enter().append('tr')
    .call(enterLegendMetric);

  metric.select('.swatch')
    .style('background', function(d) { return d.color; });

  metric.select('.title')
    .text(function(d) { return d.title; });

  metric.select('.value')
    .text(function(d) {
      d = d.values[d.values.length - 1];

      return d
        ? opts.yFormat(d.y)
        : none;
    });

  metric.exit()
    .remove();
}


function enterLegendMetric(metric) {
  metric
    .attr('data-key', function(d) { return d.key; })
    .attr('class', 'metric');

  metric.append('td')
    .attr('class', 'swatch');

  metric.append('td')
    .attr('class', 'title');

  metric.append('td')
    .attr('class', 'value');
}


function normalize(el, opts) {
  var node = el.node();

  el.datum(function(d, i) {
    var title = opts.title.call(node, d, i);

    return {
      title: title,
      metrics: opts.metrics.call(node, d, i).map(metric)
    };
  });

  function metric(d, i) {
    var key = opts.key
      .call(node, d, i)
      .toString();

    return {
      key: key,
      color: opts.colors(key),
      title: opts.metricTitle.call(node, d, i),
      values: opts.values.call(node, d, i).map(value)
    };
  }

  function value(d, i) {
    return {
      x: opts.x.call(node, d, i),
      y: opts.y.call(node, d, i)
    };
  }
}


function getMetrics(d) {
  return d.metrics;
}
