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
  .default(d3.format(',2s'))

  .prop('percentFormat')
  .default(d3.format('.0%'))

  .init(function() {
    this.colors(d3.scale.category10());
  })

  .meth('normalize', function(el) {
    var self = this;
    var node = el.node();

    el.datum(function(d, i) {
      return {
        title: self.title().call(node, d, i),
        metrics: self.metrics()
          .call(node, d, i)
          .map(metric)
      };
    });

    function metric(d, i) {
      var key = self.key()
        .call(node, d, i)
        .toString();

      return {
        key: key,
        color: self.colors()(key),
        title: self.metricTitle().call(node, d, i),
        value: self.value().call(node, d, i)
      };
    }

    var sum = d3.sum(el.datum().metrics, function(d) { return d.value; });
    el.datum().metrics.forEach(function(d) { d.percent = d.value / sum; });
  })

  .draw(function(el) {
    var opts = this.props();
    normalize(el, opts);
    drawWidget(el, opts);
  });


function drawWidget(el, opts) {
  el.classed('pie widget', true);

  el.select('[data-widget-component="title"]')
    .call(drawTitle);

  el.select('[data-widget-component="chart"]')
    .datum(getMetrics)
    .call(drawChart, opts);

  el.select('[data-widget-component="legend"]')
    .datum(getMetrics)
    .call(drawLegend, opts);
}


function drawTitle(title) {
  title
    .classed('title', true)
    .text(function(d) { return d.title; });
}


function drawChart(chart, opts) {
  chart
    .classed('chart', true);

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

  svg.selectAll('.slice')
    .data(function(d) { return layout(d); },
          function(d) { return d.data.key; })
    .call(drawSlice, dims, arc, opts);
}


function drawSlice(slice, dims, arc, opts) {
  slice.enter().append('g')
    .attr('class', 'slice')
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
  metric.enter().append('tr')
    .call(enterLegendMetric);

  metric.select('.swatch')
    .style('background', function(d) { return d.color; });

  metric.select('.title')
    .text(function(d) { return d.title; });

  metric.select('.percent')
    .text(function(d) { return opts.percentFormat(d.percent); });

  metric.select('.value')
    .text(function(d) { return opts.valueFormat(d.value); });

  metric.exit()
    .remove();
}


function enterLegendMetric(metric) {
  metric
    .attr('class', 'metric');

  metric.append('td')
    .attr('class', 'swatch');

  metric.append('td')
    .attr('class', 'title');

  metric.append('td')
    .attr('class', 'percent');

  metric.append('td')
    .attr('class', 'value');
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
