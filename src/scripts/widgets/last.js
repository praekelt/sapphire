var d3 = require('d3');
var utils = require('../utils');


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

  .prop('yFormat')
  .default(utils.formatValue()
    .int(d3.format(','))
    .float(d3.format(',.3f')))

  .prop('diffFormat')
  .default(utils.formatValue()
    .int(d3.format('+,'))
    .float(d3.format('+,.3f')))

  .prop('xFormat')
  .default(d3.time.format('%-d %b %-H:%M'))

  .prop('none')
  .default(0)

  .prop('summaryLimit')
  .default(2)
  .set(function(v) { return Math.max(utils.ensure(v, 2), 2); })

  .prop('sparklineLimit')
  .default(15)
  .set(function(v) { return Math.max(utils.ensure(v, 2), 2); })

  .prop('sparklineMargin')
  .default({
    top: 4,
    left: 4,
    bottom: 4,
    right: 4 
  })

  .draw(function(el) {
    var opts = this.props();
    normalize(el, opts);
    drawWidget(el, opts);
  });


function drawWidget(el, opts) {
  el.classed('sph-widget sph-last', true)
    .classed('sph-is-status-good', false)
    .classed('sph-is-status-bad', false)
    .classed('sph-is-status-neutral', false)
    .classed(getStatus(el.datum().values), true);

  if (!opts.explicitComponents) initComponents(el);

  var component = el.select('[data-widget-component="title"]');
  if (component.size()) component.call(drawTitle);

  component = el.select('[data-widget-component="last-value"]');
  if (component.size()) component.datum(getValues).call(drawLastValue, opts);

  component = el.select('[data-widget-component="sparkline"]');
  if (component.size()) component.datum(getValues).call(drawSparkline, opts);

  component = el.select('[data-widget-component="summary"]');
  if (component.size()) component.datum(getValues).call(drawSummary, opts);
}


function initComponents(el) {
  el.append('div')
    .attr('data-widget-component', 'title');

  el.append('div')
    .attr('data-widget-component', 'last-value');

  el.append('div')
    .attr('data-widget-component', 'sparkline');

  el.append('div')
    .attr('data-widget-component', 'summary');
}


function getValues(d) {
  return d.values;
}


function drawTitle(title) {
  title
    .classed('sph-title', true)
    .text(function(d) { return d.title; });
}


function drawLastValue(value, opts) {
  value
    .classed('sph-last-value', true)
    .datum(function(d, i) {
      d = d[d.length - 1];

      return !d
        ? opts.none
        : d.y;
    })
    .text(opts.yFormat);
}


function drawSparkline(sparkline, opts) {
  sparkline
    .classed('sph-chart sph-chart-sparkline', true);

  if (sparkline.datum().length < opts.sparklineLimit) {
    // TODO something better than this
    sparkline.style('height', 0);
    return;
  }

  var dims = utils.box()
    .margin(opts.sparklineMargin)
    .width(utils.innerWidth(sparkline))
    .height(utils.innerHeight(sparkline))
    .calc();

  var fx = d3.scale.linear()
    .domain(d3.extent(sparkline.datum(), function(d) { return d.x; }))
    .range([0, dims.innerWidth]);

  var fy = d3.scale.linear()
    .domain(d3.extent(sparkline.datum(), function(d) { return d.y; }))
    .range([dims.innerHeight, 0]);

  sparkline
    .filter(utils.isEmptyNode)
    .call(initSparkline);

  sparkline.select('svg')
    .call(drawSvg, dims, fx, fy);
}


function drawSvg(svg, dims, fx, fy) {
  svg = svg
    .attr('width', dims.width)
    .attr('height', dims.height)
    .select('g')
      .attr('transform', utils.translate(dims.margin.left, dims.margin.top));

  svg.select('.sph-sparkline-paths')
    .call(drawPaths, fx, fy);

  svg.selectAll('.sph-sparkline-dot')
    .data(function(d) { return d.slice(-1); })
    .call(drawDot, fx, fy);
}


function drawPaths(paths, fx, fy) {
  var line = d3.svg.line()
    .x(function(d) { return fx(d.x); })
    .y(function(d) { return fy(d.y); });

  paths.select('.sph-sparkline-path-rest')
    .attr('d', line);

  paths.select('.sph-sparkline-path-diff')
    .datum(function(d) { return d.slice(-2); })
    .attr('d', line);
}


function initSparkline(sparkline) {
  var svg = sparkline.append('svg')
    .append('g');

  var paths = svg.append('g')
    .attr('class', 'sph-sparkline-paths');

  paths.append('path')
    .attr('class', 'sph-sparkline-path sph-sparkline-path-rest');

  paths.append('path')
    .attr('class', 'sph-sparkline-path sph-sparkline-path-diff');
}


function drawDot(dot, fx, fy) {
  dot.enter().append('circle')
    .attr('class', 'sph-sparkline-dot')
    .attr('r', 4);

  dot
    .attr('cx', function(d) { return fx(d.x); })
    .attr('cy', function(d) { return fy(d.y); });

  dot.exit().remove();
}


function drawSummary(summary, opts) {
  summary
    .classed('sph-summary', true);

  if (summary.datum().length < opts.summaryLimit) {
    // TODO something better than this
    summary.style('height', 0);
    return;
  }

  summary
    .filter(utils.isEmptyNode)
    .call(initSummary);

  summary.select('.sph-summary-diff')
    .datum(function(d) {
      d = d.slice(-2);
      return d[1].y - d[0].y;
    })
    .text(opts.diffFormat);

  summary.select('.sph-summary-time')
    .datum(function(d) {
      d = d.slice(-2);

      return [d[0].x, d[1].x]
        .map(utils.date)
        .map(opts.xFormat);
    })
    .text(function(d) {
      return [' from', d[0], 'to', d[1]].join(' ');
    });
}


function initSummary(summary) {
  summary.append('span')
    .attr('class', 'sph-summary-diff');

  summary.append('span')
    .attr('class', 'sph-summary-time');
}


function normalize(el, opts) {
  var node = el.node();

  el.datum(function(d, i) {
    return {
      title: opts.title.call(node, d, i),
      values: opts.values.call(node, d, i)
        .map(value)
    };
  });


  function value(d, i) {
    return {
      x: opts.x.call(node, d, i),
      y: opts.y.call(node, d, i)
    };
  }
}


function getStatus(values) {
  values = values.slice(-2);

  var diff = values.length > 1
    ? values[1].y - values[0].y
    : 0;

  if (diff > 0) return 'sph-is-status-good';
  if (diff < 0) return 'sph-is-status-bad';
  return 'sph-is-status-neutral';
}
