var d3 = require('d3');
var utils = require('../utils');


module.exports = require('./widget').extend()
  .prop('colors')

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

  .prop('value')
  .set(d3.functor)
  .default(function(d) { return d.value; })

  .prop('chartMargin')
  .default({
    top: 20,
    left: 20,
    right: 20,
    bottom: 20
  })

  .prop('innerRadius')
  .set(d3.functor)
  .default(0)

  .prop('valueFormat')
  .default(utils.formatValue()
    .int(d3.format(','))
    .float(d3.format(',.3f')))

  .prop('percentFormat')
  .default(d3.format('.0%'))

  .init(function() {
    this.colors(d3.scale.category10());
  })

  .draw(function(el) {
    var opts = this.props();
    normalize(el, opts);
    drawWidget(el, opts);
  });


function drawWidget(el, opts) {
  el.classed('sph-widget sph-pie', true);

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
    .classed('sph-title', true)
    .text(function(d) { return d.title; });
}


function drawChart(chart, opts) {
  chart
    .classed('sph-chart sph-chart-pie', true);

  chart
    .filter(utils.isEmptyNode)
    .call(initChart);

  var dims = utils.box()
    .margin(opts.chartMargin)
    .width(utils.innerWidth(chart))
    .height(utils.innerHeight(chart))
    .calc();

  dims.radius = Math.min(dims.innerWidth, dims.innerHeight) / 2;

  chart.select('svg')
    .call(drawSvg, dims, opts);
}


function initChart(chart) {
  chart.append('svg')
    .append('g');
}


function drawSvg(svg, dims, opts) {
  svg
    .attr('width', dims.width)
    .attr('height', dims.height)
    .select('g')
      .attr('transform', utils.translate(
        (dims.width / 2) - dims.radius,
        (dims.height / 2) - dims.radius))
      .call(drawSlices, dims, opts);
}


function drawSlices(svg, dims, opts) {
  var arc = d3.svg.arc()
    .innerRadius(opts.innerRadius(dims.radius))
    .outerRadius(dims.radius);

  var layout = d3.layout.pie()
    .value(function(d) { return d.value; });

  svg.selectAll('.sph-pie-slice')
    .data(function(d) { return layout(d); },
          function(d) { return d.data.key; })
    .call(drawSlice, dims, arc, opts);
}


function drawSlice(slice, dims, arc, opts) {
  slice.enter().append('g')
    .attr('class', 'sph-pie-slice')
    .append('path');

  slice
    .attr('transform', utils.translate(dims.radius, dims.radius));

  slice.select('path')
    .attr('d', arc)
    .style('fill', function(d) { return d.data.color; });

  slice.exit()
    .remove();
}


function drawLegend(legend, opts) {
  legend
    .filter(utils.isEmptyNode)
    .call(initLegend);

  var table = legend.select('.sph-table-pie');

  table.selectAll('.sph-row-pie-metric')
    .data(function(d) { return d; },
          function(d) { return d.key; })
    .call(drawLegendMetric, opts);

  table
    .datum(function(d) { return d; })
    .call(drawLegendTotal, opts);
}


function initLegend(legend) {
  var table = legend.append('table')
    .attr('class', 'sph-table sph-table-pie');

  var tfoot = table
    .append('tr')
    .attr('class', 'sph-row-tfoot');

  tfoot.append('td')
    .attr('class', 'sph-col-swatch sph-col-none');

  tfoot.append('td')
    .attr('class', 'sph-col-pie-title')
    .text('Total');

  tfoot.append('td')
    .attr('class', 'sph-col-pie-percent')
    .text('100%');

  tfoot.append('td')
    .attr('class', 'sph-col-pie-value sph-col-pie-value-total');
}


function drawLegendMetric(metric, opts) {
  metric.enter().insert('tr', '.sph-row-tfoot')
    .call(enterLegendMetric);

  metric.select('.sph-col-swatch')
    .style('background', function(d) { return d.color; });

  metric.select('.sph-col-pie-title')
    .text(function(d) { return d.title; });

  metric.select('.sph-col-pie-percent')
    .text(function(d) { return opts.percentFormat(d.percent); });

  metric.select('.sph-col-pie-value')
    .text(function(d) { return opts.valueFormat(d.value); });

  metric.exit()
    .remove();
}


function drawLegendTotal(tfoot, opts) {
  tfoot.select('.sph-col-pie-value-total')
    .datum(function(d) { return d3.sum(d, getValue); })
    .text(opts.valueFormat);
}


function enterLegendMetric(metric) {
  metric
    .attr('class', 'sph-row-pie-metric');

  metric.append('td')
    .attr('class', 'sph-col-swatch');

  metric.append('td')
    .attr('class', 'sph-col-pie-title');

  metric.append('td')
    .attr('class', 'sph-col-pie-percent');

  metric.append('td')
    .attr('class', 'sph-col-pie-value');
}


function normalize(el, opts) {
  var node = el.node();

  el.datum(function(d, i) {
    return {
      title: opts.title.call(node, d, i),
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
      value: opts.value.call(node, d, i)
    };
  }

  var sum = d3.sum(el.datum().metrics, function(d) { return d.value; });
  el.datum().metrics.forEach(function(d) { d.percent = d.value / sum; });
}


function getMetrics(d) {
  return d.metrics;
}


function getValue(d) {
  return d.value;
}
