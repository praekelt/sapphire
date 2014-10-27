!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.sapphire=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
exports.utils = _dereq_('./utils');
exports.view = _dereq_('./view');
exports.widgets = _dereq_('./widgets');

},{"./utils":2,"./view":3,"./widgets":5}],2:[function(_dereq_,module,exports){
var utils = exports;


utils.access = function(d, name, defaultval) {
  if (arguments.length < 3) {
    defaultval = null;
  }

  if (typeof d != 'object') {
    return defaultval;
  }

  var val = d[name];
  return typeof val == 'undefined'
    ? defaultval
    : val;
};


utils.ensure = function(v, defaultval) {
  return v === null || typeof v == 'undefined'
    ? defaultval
    : v;
};


utils.translate = function(x, y) {
  return 'translate(' + x + ', ' + y + ')';
};


utils.ensureEl = function(el) {
  return !(el instanceof d3.selection)
    ? d3.select(el)
    : el;
};


utils.date = function(t) {
  return new Date(t);
};


utils.px = function(fn) {
  fn = d3.functor(fn);

  return function(d, i) {
    return fn.call(this, d, i) + 'px';
  };
};


utils.box = strain()
  .prop('width')
  .default(0)

  .prop('height')
  .default(0)

  .prop('margin')
  .default({
    top: 0,
    left: 0,
    right: 0,
    bottom: 0
  })

  .meth('calc', function() {
    var d = {};
    d.margin = this.margin();
    d.width = this.width();
    d.height = this.height();
    d.innerWidth = d.width - d.margin.left - d.margin.right;
    d.innerHeight = d.height - d.margin.top - d.margin.bottom;
    return d;
  })

  .invoke(function() {
    return this.calc();
  });


utils.innerWidth = function(el) {
  return utils.measure(el, 'width')
       - utils.measure(el, 'padding-left')
       - utils.measure(el, 'padding-right');
};


utils.innerHeight = function(el) {
  return utils.measure(el, 'height')
       - utils.measure(el, 'padding-top')
       - utils.measure(el, 'padding-bottom');
};


utils.measure = function(el, name) {
  el = utils.ensureEl(el);
  return parseInt(el.style(name));
};


utils.isEmptyNode = function() {
  return !this.hasChildNodes();
};

},{}],3:[function(_dereq_,module,exports){
module.exports = strain()
  .static('draw', function(fn) {
    this.meth('_draw_', fn);
  })
  .draw(function() {})

  .meth('draw', function(el) {
    el = sapphire.utils.ensureEl(el);

    var datum;
    if (el.node()) datum = el.datum();
    this._draw_.apply(this, arguments);
    if (typeof datum != 'undefined') el.datum(datum);
  })

  .invoke(function() {
    return this.draw.apply(this, arguments);
  });

},{}],4:[function(_dereq_,module,exports){
var utils = _dereq_('../utils');


module.exports = _dereq_('./widget').extend()
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
  el.classed('sph-widget sph-bars', true);

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
    .attr('class', 'sph-bars-bars');

  svg.append('g')
    .attr('class', 'sph-axis sph-axis-bars-y');

  svg.append('g')
    .attr('class', 'sph-axis sph-axis-bars-x');
}


function drawSvg(svg, dims, fx, fy, opts) {
  svg
    .attr('width', dims.width)
    .attr('height', dims.height)
    .select('g')
      .attr('transform', utils.translate(
        dims.margin.left,
        dims.margin.top));

  svg.select('.sph-bars-bars')
     .call(drawBars, dims, fx, fy, opts);

  svg.select('.sph-axis-bars-x')
    .call(drawXAxis, dims, fx, opts);

  svg.select('.sph-axis-bars-y')
    .call(drawYAxis, dims, fy, opts);
}


function drawBars(bars, dims, fx, fy, opts) {
  bars
    .selectAll('.sph-bars-bar')
    .data(function(d) { return d; },
          function(d) { return d.x; })
    .call(drawBar, dims, fx, fy, opts);
}


function drawBar(bar, dims, fx, fy, opts) {
  bar.enter().append('g')
    .attr('class', 'sph-bars-bar')
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

},{"../utils":2,"./widget":9}],5:[function(_dereq_,module,exports){
exports.pie = _dereq_('./pie');
exports.bars = _dereq_('./bars');
exports.last = _dereq_('./last');
exports.lines = _dereq_('./lines');
exports.widget = _dereq_('./widget');

},{"./bars":4,"./last":6,"./lines":7,"./pie":8,"./widget":9}],6:[function(_dereq_,module,exports){
var utils = _dereq_('../utils');


module.exports = _dereq_('./widget').extend()
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
  .default(d3.format(',2s'))

  .prop('diffFormat')
  .default(d3.format('+,2s'))

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

},{"../utils":2,"./widget":9}],7:[function(_dereq_,module,exports){
var utils = _dereq_('../utils');


module.exports = _dereq_('./widget').extend()
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
  el.classed('sph-widget sph-lines', true);

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
    .classed('sph-chart sph-chart-lines', true);

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
    .attr('class', 'sph-axis sph-axis-lines sph-axis-lines-x');

  svg.append('g')
    .attr('class', 'sph-axis sph-axis-lines sph-axis-lines-y');

  svg.append('g')
    .attr('class', 'sph-lines-metrics');
}


function drawSvg(svg, dims, fx, fy, opts) {
  svg
    .attr('width', dims.width)
    .attr('height', dims.height)
    .select('g')
      .attr('transform', utils.translate(dims.margin.left, dims.margin.top));

  svg.select('.sph-lines-metrics')
    .call(drawChartMetrics, fx, fy);

  svg.select('.sph-axis-lines-x')
    .call(drawXAxis, dims, fx, opts);

  svg.select('.sph-axis-lines-y')
    .call(drawYAxis, dims, fy, opts);
}


function drawChartMetrics(metrics, fx, fy) {
  var line = d3.svg.line()
    .x(function(d) { return fx(d.x); })
    .y(function(d) { return fy(d.y); });

  metrics.selectAll('.sph-lines-metric')
    .data(function(d) { return d; },
          function(d) { return d.key; })
    .call(drawChartMetric, fx, fy, line);
}


function drawChartMetric(metric, fx, fy, line) {
  metric.enter().append('g')
    .attr('class', 'sph-lines-metric')
    .attr('data-key', function(d) { return d.key; })
    .append('path')
      .attr('class', 'sph-lines-line');

  metric.select('.sph-lines-line')
    .attr('stroke', function(d) { return d.color; })
    .attr('d', function(d) { return line(d.values); });

  metric.exit()
    .remove();

  metric.selectAll('.sph-lines-dot')
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
    .attr('class', 'sph-lines-dot')
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
    .filter(utils.isEmptyNode)
    .call(initLegend);

  legend.select('.sph-table-lines').selectAll('.sph-row-lines-metric')
    .data(function(d) { return d; },
          function(d) { return d.key; })
    .call(drawLegendMetric, opts);
}


function initLegend(legend) {
  legend.append('table')
    .classed('sph-table sph-table-lines', true);
}


function drawLegendMetric(metric, opts) {
  var none = opts.yFormat(opts.none);

  metric.enter().append('tr')
    .call(enterLegendMetric);

  metric.select('.sph-col-swatch')
    .style('background', function(d) { return d.color; });

  metric.select('.sph-col-lines-title')
    .text(function(d) { return d.title; });

  metric.select('.sph-col-lines-value')
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
    .attr('class', 'sph-row-lines-metric');

  metric.append('td')
    .attr('class', 'sph-col-swatch');

  metric.append('td')
    .attr('class', 'sph-col-lines-title');

  metric.append('td')
    .attr('class', 'sph-col-lines-value');
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

},{"../utils":2,"./widget":9}],8:[function(_dereq_,module,exports){
var utils = _dereq_('../utils');


module.exports = _dereq_('./widget').extend()
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

  legend.select('.sph-table-pie').selectAll('.sph-row-pie-metric')
    .data(function(d) { return d; },
          function(d) { return d.key; })
    .call(drawLegendMetric, opts);
}


function initLegend(legend) {
  legend.append('table')
    .attr('class', 'sph-table sph-table-pie');
}


function drawLegendMetric(metric, opts) {
  metric.enter().append('tr')
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

},{"../utils":2,"./widget":9}],9:[function(_dereq_,module,exports){
module.exports = _dereq_('../view').extend()
  .prop('explicitComponents')
  .default(false);

},{"../view":3}]},{},[1])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9ob21lL2p1c3Rpbi9wcmFla2VsdC9zYXBwaGlyZS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiL2hvbWUvanVzdGluL3ByYWVrZWx0L3NhcHBoaXJlL3NyYy9zY3JpcHRzL2luZGV4LmpzIiwiL2hvbWUvanVzdGluL3ByYWVrZWx0L3NhcHBoaXJlL3NyYy9zY3JpcHRzL3V0aWxzLmpzIiwiL2hvbWUvanVzdGluL3ByYWVrZWx0L3NhcHBoaXJlL3NyYy9zY3JpcHRzL3ZpZXcuanMiLCIvaG9tZS9qdXN0aW4vcHJhZWtlbHQvc2FwcGhpcmUvc3JjL3NjcmlwdHMvd2lkZ2V0cy9iYXJzLmpzIiwiL2hvbWUvanVzdGluL3ByYWVrZWx0L3NhcHBoaXJlL3NyYy9zY3JpcHRzL3dpZGdldHMvaW5kZXguanMiLCIvaG9tZS9qdXN0aW4vcHJhZWtlbHQvc2FwcGhpcmUvc3JjL3NjcmlwdHMvd2lkZ2V0cy9sYXN0LmpzIiwiL2hvbWUvanVzdGluL3ByYWVrZWx0L3NhcHBoaXJlL3NyYy9zY3JpcHRzL3dpZGdldHMvbGluZXMuanMiLCIvaG9tZS9qdXN0aW4vcHJhZWtlbHQvc2FwcGhpcmUvc3JjL3NjcmlwdHMvd2lkZ2V0cy9waWUuanMiLCIvaG9tZS9qdXN0aW4vcHJhZWtlbHQvc2FwcGhpcmUvc3JjL3NjcmlwdHMvd2lkZ2V0cy93aWRnZXQuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTs7QUNIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlSQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMVdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pQQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpfXZhciBmPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChmLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGYsZi5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJleHBvcnRzLnV0aWxzID0gcmVxdWlyZSgnLi91dGlscycpO1xuZXhwb3J0cy52aWV3ID0gcmVxdWlyZSgnLi92aWV3Jyk7XG5leHBvcnRzLndpZGdldHMgPSByZXF1aXJlKCcuL3dpZGdldHMnKTtcbiIsInZhciB1dGlscyA9IGV4cG9ydHM7XG5cblxudXRpbHMuYWNjZXNzID0gZnVuY3Rpb24oZCwgbmFtZSwgZGVmYXVsdHZhbCkge1xuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA8IDMpIHtcbiAgICBkZWZhdWx0dmFsID0gbnVsbDtcbiAgfVxuXG4gIGlmICh0eXBlb2YgZCAhPSAnb2JqZWN0Jykge1xuICAgIHJldHVybiBkZWZhdWx0dmFsO1xuICB9XG5cbiAgdmFyIHZhbCA9IGRbbmFtZV07XG4gIHJldHVybiB0eXBlb2YgdmFsID09ICd1bmRlZmluZWQnXG4gICAgPyBkZWZhdWx0dmFsXG4gICAgOiB2YWw7XG59O1xuXG5cbnV0aWxzLmVuc3VyZSA9IGZ1bmN0aW9uKHYsIGRlZmF1bHR2YWwpIHtcbiAgcmV0dXJuIHYgPT09IG51bGwgfHwgdHlwZW9mIHYgPT0gJ3VuZGVmaW5lZCdcbiAgICA/IGRlZmF1bHR2YWxcbiAgICA6IHY7XG59O1xuXG5cbnV0aWxzLnRyYW5zbGF0ZSA9IGZ1bmN0aW9uKHgsIHkpIHtcbiAgcmV0dXJuICd0cmFuc2xhdGUoJyArIHggKyAnLCAnICsgeSArICcpJztcbn07XG5cblxudXRpbHMuZW5zdXJlRWwgPSBmdW5jdGlvbihlbCkge1xuICByZXR1cm4gIShlbCBpbnN0YW5jZW9mIGQzLnNlbGVjdGlvbilcbiAgICA/IGQzLnNlbGVjdChlbClcbiAgICA6IGVsO1xufTtcblxuXG51dGlscy5kYXRlID0gZnVuY3Rpb24odCkge1xuICByZXR1cm4gbmV3IERhdGUodCk7XG59O1xuXG5cbnV0aWxzLnB4ID0gZnVuY3Rpb24oZm4pIHtcbiAgZm4gPSBkMy5mdW5jdG9yKGZuKTtcblxuICByZXR1cm4gZnVuY3Rpb24oZCwgaSkge1xuICAgIHJldHVybiBmbi5jYWxsKHRoaXMsIGQsIGkpICsgJ3B4JztcbiAgfTtcbn07XG5cblxudXRpbHMuYm94ID0gc3RyYWluKClcbiAgLnByb3AoJ3dpZHRoJylcbiAgLmRlZmF1bHQoMClcblxuICAucHJvcCgnaGVpZ2h0JylcbiAgLmRlZmF1bHQoMClcblxuICAucHJvcCgnbWFyZ2luJylcbiAgLmRlZmF1bHQoe1xuICAgIHRvcDogMCxcbiAgICBsZWZ0OiAwLFxuICAgIHJpZ2h0OiAwLFxuICAgIGJvdHRvbTogMFxuICB9KVxuXG4gIC5tZXRoKCdjYWxjJywgZnVuY3Rpb24oKSB7XG4gICAgdmFyIGQgPSB7fTtcbiAgICBkLm1hcmdpbiA9IHRoaXMubWFyZ2luKCk7XG4gICAgZC53aWR0aCA9IHRoaXMud2lkdGgoKTtcbiAgICBkLmhlaWdodCA9IHRoaXMuaGVpZ2h0KCk7XG4gICAgZC5pbm5lcldpZHRoID0gZC53aWR0aCAtIGQubWFyZ2luLmxlZnQgLSBkLm1hcmdpbi5yaWdodDtcbiAgICBkLmlubmVySGVpZ2h0ID0gZC5oZWlnaHQgLSBkLm1hcmdpbi50b3AgLSBkLm1hcmdpbi5ib3R0b207XG4gICAgcmV0dXJuIGQ7XG4gIH0pXG5cbiAgLmludm9rZShmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5jYWxjKCk7XG4gIH0pO1xuXG5cbnV0aWxzLmlubmVyV2lkdGggPSBmdW5jdGlvbihlbCkge1xuICByZXR1cm4gdXRpbHMubWVhc3VyZShlbCwgJ3dpZHRoJylcbiAgICAgICAtIHV0aWxzLm1lYXN1cmUoZWwsICdwYWRkaW5nLWxlZnQnKVxuICAgICAgIC0gdXRpbHMubWVhc3VyZShlbCwgJ3BhZGRpbmctcmlnaHQnKTtcbn07XG5cblxudXRpbHMuaW5uZXJIZWlnaHQgPSBmdW5jdGlvbihlbCkge1xuICByZXR1cm4gdXRpbHMubWVhc3VyZShlbCwgJ2hlaWdodCcpXG4gICAgICAgLSB1dGlscy5tZWFzdXJlKGVsLCAncGFkZGluZy10b3AnKVxuICAgICAgIC0gdXRpbHMubWVhc3VyZShlbCwgJ3BhZGRpbmctYm90dG9tJyk7XG59O1xuXG5cbnV0aWxzLm1lYXN1cmUgPSBmdW5jdGlvbihlbCwgbmFtZSkge1xuICBlbCA9IHV0aWxzLmVuc3VyZUVsKGVsKTtcbiAgcmV0dXJuIHBhcnNlSW50KGVsLnN0eWxlKG5hbWUpKTtcbn07XG5cblxudXRpbHMuaXNFbXB0eU5vZGUgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuICF0aGlzLmhhc0NoaWxkTm9kZXMoKTtcbn07XG4iLCJtb2R1bGUuZXhwb3J0cyA9IHN0cmFpbigpXG4gIC5zdGF0aWMoJ2RyYXcnLCBmdW5jdGlvbihmbikge1xuICAgIHRoaXMubWV0aCgnX2RyYXdfJywgZm4pO1xuICB9KVxuICAuZHJhdyhmdW5jdGlvbigpIHt9KVxuXG4gIC5tZXRoKCdkcmF3JywgZnVuY3Rpb24oZWwpIHtcbiAgICBlbCA9IHNhcHBoaXJlLnV0aWxzLmVuc3VyZUVsKGVsKTtcblxuICAgIHZhciBkYXR1bTtcbiAgICBpZiAoZWwubm9kZSgpKSBkYXR1bSA9IGVsLmRhdHVtKCk7XG4gICAgdGhpcy5fZHJhd18uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICBpZiAodHlwZW9mIGRhdHVtICE9ICd1bmRlZmluZWQnKSBlbC5kYXR1bShkYXR1bSk7XG4gIH0pXG5cbiAgLmludm9rZShmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5kcmF3LmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gIH0pO1xuIiwidmFyIHV0aWxzID0gcmVxdWlyZSgnLi4vdXRpbHMnKTtcblxuXG5tb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoJy4vd2lkZ2V0JykuZXh0ZW5kKClcbiAgLnByb3AoJ2JhclBhZGRpbmcnKVxuICAuZGVmYXVsdCgyLjUpXG5cbiAgLnByb3AoJ2NoYXJ0TWFyZ2luJylcbiAgLmRlZmF1bHQoe1xuICAgIHRvcDogMTAsXG4gICAgbGVmdDogMzgsXG4gICAgcmlnaHQ6IDE1LFxuICAgIGJvdHRvbTogNDVcbiAgfSlcblxuICAucHJvcCgndGl0bGUnKVxuICAuc2V0KGQzLmZ1bmN0b3IpXG4gIC5kZWZhdWx0KGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQudGl0bGU7IH0pXG5cbiAgLnByb3AoJ3ZhbHVlcycpXG4gIC5zZXQoZDMuZnVuY3RvcilcbiAgLmRlZmF1bHQoZnVuY3Rpb24oZCkgeyByZXR1cm4gZC52YWx1ZXM7IH0pXG5cbiAgLnByb3AoJ3gnKVxuICAuc2V0KGQzLmZ1bmN0b3IpXG4gIC5kZWZhdWx0KGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQueDsgfSlcblxuICAucHJvcCgneScpXG4gIC5zZXQoZDMuZnVuY3RvcilcbiAgLmRlZmF1bHQoZnVuY3Rpb24oZCkgeyByZXR1cm4gZC55OyB9KVxuXG4gIC5wcm9wKCdkeCcpXG4gIC5zZXQoZDMuZnVuY3RvcilcbiAgLmRlZmF1bHQobnVsbClcblxuICAucHJvcCgneFRpY2tGb3JtYXQnKVxuICAuZGVmYXVsdChudWxsKVxuXG4gIC5wcm9wKCd4VGlja3MnKVxuICAuZGVmYXVsdCg4KVxuXG4gIC5wcm9wKCd5VGlja0Zvcm1hdCcpXG4gIC5kZWZhdWx0KGQzLmZvcm1hdCgnLjJzJykpXG5cbiAgLnByb3AoJ3lUaWNrcycpXG4gIC5kZWZhdWx0KDUpXG5cbiAgLnByb3AoJ3lNYXgnKVxuICAuc2V0KGQzLmZ1bmN0b3IpXG4gIC5kZWZhdWx0KGQzLm1heClcblxuICAucHJvcCgnY29sb3JzJylcblxuICAuaW5pdChmdW5jdGlvbigpIHtcbiAgICB0aGlzLmNvbG9ycyhkMy5zY2FsZS5jYXRlZ29yeTEwKCkpO1xuICB9KVxuXG4gIC5kcmF3KGZ1bmN0aW9uKGVsKSB7XG4gICAgdmFyIG9wdHMgPSB0aGlzLnByb3BzKCk7XG4gICAgbm9ybWFsaXplKGVsLCBvcHRzKTtcblxuICAgIG9wdHMud2lkdGggPSB1dGlscy5pbm5lcldpZHRoKGVsKTtcbiAgICBvcHRzLmNvbG9yID0gb3B0cy5jb2xvcnMoZWwuZGF0dW0oKS50aXRsZSk7XG4gICAgZHJhd1dpZGdldChlbCwgb3B0cyk7XG4gIH0pO1xuXG5cbmZ1bmN0aW9uIGRyYXdXaWRnZXQoZWwsIG9wdHMpIHtcbiAgZWwuY2xhc3NlZCgnc3BoLXdpZGdldCBzcGgtYmFycycsIHRydWUpO1xuXG4gIGlmICghb3B0cy5leHBsaWNpdENvbXBvbmVudHMpIGluaXRDb21wb25lbnRzKGVsKTtcblxuICB2YXIgY29tcG9uZW50ID0gZWwuc2VsZWN0KCdbZGF0YS13aWRnZXQtY29tcG9uZW50PVwidGl0bGVcIl0nKTtcbiAgaWYgKGNvbXBvbmVudC5zaXplKCkpIGNvbXBvbmVudC5jYWxsKGRyYXdUaXRsZSk7XG5cbiAgY29tcG9uZW50ID0gZWwuc2VsZWN0KCdbZGF0YS13aWRnZXQtY29tcG9uZW50PVwiY2hhcnRcIl0nKTtcbiAgaWYgKGNvbXBvbmVudC5zaXplKCkpIGNvbXBvbmVudC5jYWxsKGRyYXdDaGFydCwgb3B0cyk7XG59XG5cblxuZnVuY3Rpb24gaW5pdENvbXBvbmVudHMoZWwpIHtcbiAgZWwuYXBwZW5kKCdkaXYnKVxuICAgIC5hdHRyKCdkYXRhLXdpZGdldC1jb21wb25lbnQnLCAndGl0bGUnKTtcblxuICBlbC5hcHBlbmQoJ2RpdicpXG4gICAgLmF0dHIoJ2RhdGEtd2lkZ2V0LWNvbXBvbmVudCcsICdjaGFydCcpO1xufVxuXG5cbmZ1bmN0aW9uIGRyYXdUaXRsZSh0aXRsZSkge1xuICB0aXRsZVxuICAgIC5jbGFzc2VkKCdzcGgtdGl0bGUnLCB0cnVlKVxuICAgIC50ZXh0KGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQudGl0bGU7IH0pO1xufVxuXG5cbmZ1bmN0aW9uIGRyYXdDaGFydChjaGFydCwgb3B0cykge1xuICBjaGFydFxuICAgIC5jbGFzc2VkKCdzcGgtY2hhcnQgc3BoLWNoYXJ0LWJhcnMnLCB0cnVlKVxuICAgIC5kYXR1bShmdW5jdGlvbihkKSB7IHJldHVybiBkLnZhbHVlczsgfSk7XG5cbiAgdmFyIGRpbXMgPSB1dGlscy5ib3goKVxuICAgIC53aWR0aChvcHRzLndpZHRoKVxuICAgIC5oZWlnaHQodXRpbHMuaW5uZXJIZWlnaHQoY2hhcnQpKVxuICAgIC5tYXJnaW4ob3B0cy5jaGFydE1hcmdpbilcbiAgICAuY2FsYygpO1xuXG4gIHZhciBmeCA9IGQzLnRpbWUuc2NhbGUoKVxuICAgIC5kb21haW4oW1xuICAgICAgZDMubWluKGNoYXJ0LmRhdHVtKCksIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQueDsgfSksXG4gICAgICBkMy5tYXgoY2hhcnQuZGF0dW0oKSwgZnVuY3Rpb24oZCkgeyByZXR1cm4gZC54ICsgZC5keDsgfSldKTtcblxuICB2YXIgeXMgPSBjaGFydC5kYXR1bSgpXG4gICAgLm1hcChmdW5jdGlvbihkKSB7IHJldHVybiBkLnk7IH0pO1xuXG4gIHZhciBmeSA9IGQzLnNjYWxlLmxpbmVhcigpXG4gICAgLmRvbWFpbihbMCwgb3B0cy55TWF4KHlzKV0pO1xuXG4gIGZ4LnJhbmdlKFswLCBkaW1zLmlubmVyV2lkdGhdKTtcbiAgZnkucmFuZ2UoW2RpbXMuaW5uZXJIZWlnaHQsIDBdKTtcblxuICBjaGFydFxuICAgIC5maWx0ZXIodXRpbHMuaXNFbXB0eU5vZGUpXG4gICAgLmNhbGwoaW5pdENoYXJ0KTtcblxuICBjaGFydC5zZWxlY3QoJ3N2ZycpXG4gICAgLmNhbGwoZHJhd1N2ZywgZGltcywgZngsIGZ5LCBvcHRzKTtcbn1cblxuXG5mdW5jdGlvbiBpbml0Q2hhcnQoY2hhcnQpIHtcbiAgdmFyIHN2ZyA9IGNoYXJ0XG4gICAgLmFwcGVuZCgnc3ZnJylcbiAgICAuYXBwZW5kKCdnJyk7XG5cbiAgc3ZnLmFwcGVuZCgnZycpXG4gICAgLmF0dHIoJ2NsYXNzJywgJ3NwaC1iYXJzLWJhcnMnKTtcblxuICBzdmcuYXBwZW5kKCdnJylcbiAgICAuYXR0cignY2xhc3MnLCAnc3BoLWF4aXMgc3BoLWF4aXMtYmFycy15Jyk7XG5cbiAgc3ZnLmFwcGVuZCgnZycpXG4gICAgLmF0dHIoJ2NsYXNzJywgJ3NwaC1heGlzIHNwaC1heGlzLWJhcnMteCcpO1xufVxuXG5cbmZ1bmN0aW9uIGRyYXdTdmcoc3ZnLCBkaW1zLCBmeCwgZnksIG9wdHMpIHtcbiAgc3ZnXG4gICAgLmF0dHIoJ3dpZHRoJywgZGltcy53aWR0aClcbiAgICAuYXR0cignaGVpZ2h0JywgZGltcy5oZWlnaHQpXG4gICAgLnNlbGVjdCgnZycpXG4gICAgICAuYXR0cigndHJhbnNmb3JtJywgdXRpbHMudHJhbnNsYXRlKFxuICAgICAgICBkaW1zLm1hcmdpbi5sZWZ0LFxuICAgICAgICBkaW1zLm1hcmdpbi50b3ApKTtcblxuICBzdmcuc2VsZWN0KCcuc3BoLWJhcnMtYmFycycpXG4gICAgIC5jYWxsKGRyYXdCYXJzLCBkaW1zLCBmeCwgZnksIG9wdHMpO1xuXG4gIHN2Zy5zZWxlY3QoJy5zcGgtYXhpcy1iYXJzLXgnKVxuICAgIC5jYWxsKGRyYXdYQXhpcywgZGltcywgZngsIG9wdHMpO1xuXG4gIHN2Zy5zZWxlY3QoJy5zcGgtYXhpcy1iYXJzLXknKVxuICAgIC5jYWxsKGRyYXdZQXhpcywgZGltcywgZnksIG9wdHMpO1xufVxuXG5cbmZ1bmN0aW9uIGRyYXdCYXJzKGJhcnMsIGRpbXMsIGZ4LCBmeSwgb3B0cykge1xuICBiYXJzXG4gICAgLnNlbGVjdEFsbCgnLnNwaC1iYXJzLWJhcicpXG4gICAgLmRhdGEoZnVuY3Rpb24oZCkgeyByZXR1cm4gZDsgfSxcbiAgICAgICAgICBmdW5jdGlvbihkKSB7IHJldHVybiBkLng7IH0pXG4gICAgLmNhbGwoZHJhd0JhciwgZGltcywgZngsIGZ5LCBvcHRzKTtcbn1cblxuXG5mdW5jdGlvbiBkcmF3QmFyKGJhciwgZGltcywgZngsIGZ5LCBvcHRzKSB7XG4gIGJhci5lbnRlcigpLmFwcGVuZCgnZycpXG4gICAgLmF0dHIoJ2NsYXNzJywgJ3NwaC1iYXJzLWJhcicpXG4gICAgLmFwcGVuZCgncmVjdCcpO1xuXG4gIGJhclxuICAgIC5hdHRyKCd0cmFuc2Zvcm0nLCBmdW5jdGlvbihkKSB7XG4gICAgICByZXR1cm4gdXRpbHMudHJhbnNsYXRlKGZ4KGQueCksIGZ5KGQueSkpO1xuICAgIH0pO1xuXG4gIGJhci5zZWxlY3QoJ3JlY3QnKVxuICAgIC5zdHlsZSgnZmlsbCcsIG9wdHMuY29sb3IpXG4gICAgLmF0dHIoJ3dpZHRoJywgZnVuY3Rpb24oZCkge1xuICAgICAgdmFyIHdpZHRoID0gZngoZC54ICsgZC5keCkgLSBmeChkLngpO1xuICAgICAgd2lkdGggLT0gb3B0cy5iYXJQYWRkaW5nO1xuICAgICAgcmV0dXJuIE1hdGgubWF4KHdpZHRoLCAxKTtcbiAgICB9KVxuICAgIC5hdHRyKCdoZWlnaHQnLCBmdW5jdGlvbihkKSB7XG4gICAgICByZXR1cm4gZGltcy5pbm5lckhlaWdodCAtIGZ5KGQueSk7IFxuICAgIH0pO1xuXG4gIGJhci5leGl0KClcbiAgICAucmVtb3ZlKCk7XG59XG5cblxuZnVuY3Rpb24gZHJhd1hBeGlzKGF4aXMsIGRpbXMsIGZ4LCBvcHRzKSB7XG4gIGF4aXNcbiAgICAuYXR0cigndHJhbnNmb3JtJywgdXRpbHMudHJhbnNsYXRlKDAsIGRpbXMuaW5uZXJIZWlnaHQpKVxuICAgIC5jYWxsKGQzLnN2Zy5heGlzKClcbiAgICAgIC5zY2FsZShmeClcbiAgICAgIC50aWNrcyhvcHRzLnhUaWNrcylcbiAgICAgIC50aWNrRm9ybWF0KG9wdHMueFRpY2tGb3JtYXQpKTtcbn1cblxuXG5mdW5jdGlvbiBkcmF3WUF4aXMoYXhpcywgZGltcywgZnksIG9wdHMpIHtcbiAgYXhpcy5jYWxsKGQzLnN2Zy5heGlzKClcbiAgICAub3JpZW50KCdsZWZ0JylcbiAgICAuc2NhbGUoZnkpXG4gICAgLnRpY2tQYWRkaW5nKDgpXG4gICAgLnRpY2tTaXplKC1kaW1zLmlubmVyV2lkdGgpXG4gICAgLnRpY2tzKG9wdHMueVRpY2tzKVxuICAgIC50aWNrRm9ybWF0KG9wdHMueVRpY2tGb3JtYXQpKTtcbn1cblxuXG5mdW5jdGlvbiBub3JtYWxpemUoZWwsIG9wdHMpIHtcbiAgdmFyIG5vZGUgPSBlbC5ub2RlKCk7XG5cbiAgZWwuZGF0dW0oZnVuY3Rpb24oZCwgaSkge1xuICAgIHZhciB2YWx1ZXMgPSBvcHRzLnZhbHVlc1xuICAgICAgLmNhbGwobm9kZSwgZCwgaSlcbiAgICAgIC5tYXAodmFsdWUpO1xuXG4gICAgdmFyIGxlbiA9IHZhbHVlcy5sZW5ndGg7XG4gICAgdmFyIGR4QXZnID0gdmFsdWVzLmxlbmd0aFxuICAgICAgPyAodmFsdWVzW2xlbiAtIDFdLnggLSB2YWx1ZXNbMF0ueCkgLyBsZW5cbiAgICAgIDogMDtcblxuICAgIHZhbHVlcy5mb3JFYWNoKGZ1bmN0aW9uKGQpIHtcbiAgICAgIGQuZHggPSB1dGlscy5lbnN1cmUoZC5keCwgZHhBdmcpO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIHZhbHVlczogdmFsdWVzLFxuICAgICAgdGl0bGU6IG9wdHMudGl0bGUuY2FsbChub2RlLCBkLCBpKVxuICAgIH07XG4gIH0pO1xuXG4gIGZ1bmN0aW9uIHZhbHVlKGQsIGkpIHtcbiAgICByZXR1cm4ge1xuICAgICAgeDogb3B0cy54LmNhbGwobm9kZSwgZCwgaSksXG4gICAgICB5OiBvcHRzLnkuY2FsbChub2RlLCBkLCBpKSxcbiAgICAgIGR4OiBvcHRzLmR4LmNhbGwobm9kZSwgZCwgaSlcbiAgICB9O1xuICB9XG59XG4iLCJleHBvcnRzLnBpZSA9IHJlcXVpcmUoJy4vcGllJyk7XG5leHBvcnRzLmJhcnMgPSByZXF1aXJlKCcuL2JhcnMnKTtcbmV4cG9ydHMubGFzdCA9IHJlcXVpcmUoJy4vbGFzdCcpO1xuZXhwb3J0cy5saW5lcyA9IHJlcXVpcmUoJy4vbGluZXMnKTtcbmV4cG9ydHMud2lkZ2V0ID0gcmVxdWlyZSgnLi93aWRnZXQnKTtcbiIsInZhciB1dGlscyA9IHJlcXVpcmUoJy4uL3V0aWxzJyk7XG5cblxubW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKCcuL3dpZGdldCcpLmV4dGVuZCgpXG4gIC5wcm9wKCd0aXRsZScpXG4gIC5zZXQoZDMuZnVuY3RvcilcbiAgLmRlZmF1bHQoZnVuY3Rpb24oZCkgeyByZXR1cm4gZC50aXRsZTsgfSlcblxuICAucHJvcCgndmFsdWVzJylcbiAgLnNldChkMy5mdW5jdG9yKVxuICAuZGVmYXVsdChmdW5jdGlvbihkKSB7IHJldHVybiBkLnZhbHVlczsgfSlcblxuICAucHJvcCgneCcpXG4gIC5zZXQoZDMuZnVuY3RvcilcbiAgLmRlZmF1bHQoZnVuY3Rpb24oZCkgeyByZXR1cm4gZC54OyB9KVxuXG4gIC5wcm9wKCd5JylcbiAgLnNldChkMy5mdW5jdG9yKVxuICAuZGVmYXVsdChmdW5jdGlvbihkKSB7IHJldHVybiBkLnk7IH0pXG5cbiAgLnByb3AoJ3lGb3JtYXQnKVxuICAuZGVmYXVsdChkMy5mb3JtYXQoJywycycpKVxuXG4gIC5wcm9wKCdkaWZmRm9ybWF0JylcbiAgLmRlZmF1bHQoZDMuZm9ybWF0KCcrLDJzJykpXG5cbiAgLnByb3AoJ3hGb3JtYXQnKVxuICAuZGVmYXVsdChkMy50aW1lLmZvcm1hdCgnJS1kICViICUtSDolTScpKVxuXG4gIC5wcm9wKCdub25lJylcbiAgLmRlZmF1bHQoMClcblxuICAucHJvcCgnc3VtbWFyeUxpbWl0JylcbiAgLmRlZmF1bHQoMilcbiAgLnNldChmdW5jdGlvbih2KSB7IHJldHVybiBNYXRoLm1heCh1dGlscy5lbnN1cmUodiwgMiksIDIpOyB9KVxuXG4gIC5wcm9wKCdzcGFya2xpbmVMaW1pdCcpXG4gIC5kZWZhdWx0KDE1KVxuICAuc2V0KGZ1bmN0aW9uKHYpIHsgcmV0dXJuIE1hdGgubWF4KHV0aWxzLmVuc3VyZSh2LCAyKSwgMik7IH0pXG5cbiAgLnByb3AoJ3NwYXJrbGluZU1hcmdpbicpXG4gIC5kZWZhdWx0KHtcbiAgICB0b3A6IDQsXG4gICAgbGVmdDogNCxcbiAgICBib3R0b206IDQsXG4gICAgcmlnaHQ6IDQgXG4gIH0pXG5cbiAgLmRyYXcoZnVuY3Rpb24oZWwpIHtcbiAgICB2YXIgb3B0cyA9IHRoaXMucHJvcHMoKTtcbiAgICBub3JtYWxpemUoZWwsIG9wdHMpO1xuICAgIGRyYXdXaWRnZXQoZWwsIG9wdHMpO1xuICB9KTtcblxuXG5mdW5jdGlvbiBkcmF3V2lkZ2V0KGVsLCBvcHRzKSB7XG4gIGVsLmNsYXNzZWQoJ3NwaC13aWRnZXQgc3BoLWxhc3QnLCB0cnVlKVxuICAgIC5jbGFzc2VkKCdzcGgtaXMtc3RhdHVzLWdvb2QnLCBmYWxzZSlcbiAgICAuY2xhc3NlZCgnc3BoLWlzLXN0YXR1cy1iYWQnLCBmYWxzZSlcbiAgICAuY2xhc3NlZCgnc3BoLWlzLXN0YXR1cy1uZXV0cmFsJywgZmFsc2UpXG4gICAgLmNsYXNzZWQoZ2V0U3RhdHVzKGVsLmRhdHVtKCkudmFsdWVzKSwgdHJ1ZSk7XG5cbiAgaWYgKCFvcHRzLmV4cGxpY2l0Q29tcG9uZW50cykgaW5pdENvbXBvbmVudHMoZWwpO1xuXG4gIHZhciBjb21wb25lbnQgPSBlbC5zZWxlY3QoJ1tkYXRhLXdpZGdldC1jb21wb25lbnQ9XCJ0aXRsZVwiXScpO1xuICBpZiAoY29tcG9uZW50LnNpemUoKSkgY29tcG9uZW50LmNhbGwoZHJhd1RpdGxlKTtcblxuICBjb21wb25lbnQgPSBlbC5zZWxlY3QoJ1tkYXRhLXdpZGdldC1jb21wb25lbnQ9XCJsYXN0LXZhbHVlXCJdJyk7XG4gIGlmIChjb21wb25lbnQuc2l6ZSgpKSBjb21wb25lbnQuZGF0dW0oZ2V0VmFsdWVzKS5jYWxsKGRyYXdMYXN0VmFsdWUsIG9wdHMpO1xuXG4gIGNvbXBvbmVudCA9IGVsLnNlbGVjdCgnW2RhdGEtd2lkZ2V0LWNvbXBvbmVudD1cInNwYXJrbGluZVwiXScpO1xuICBpZiAoY29tcG9uZW50LnNpemUoKSkgY29tcG9uZW50LmRhdHVtKGdldFZhbHVlcykuY2FsbChkcmF3U3BhcmtsaW5lLCBvcHRzKTtcblxuICBjb21wb25lbnQgPSBlbC5zZWxlY3QoJ1tkYXRhLXdpZGdldC1jb21wb25lbnQ9XCJzdW1tYXJ5XCJdJyk7XG4gIGlmIChjb21wb25lbnQuc2l6ZSgpKSBjb21wb25lbnQuZGF0dW0oZ2V0VmFsdWVzKS5jYWxsKGRyYXdTdW1tYXJ5LCBvcHRzKTtcbn1cblxuXG5mdW5jdGlvbiBpbml0Q29tcG9uZW50cyhlbCkge1xuICBlbC5hcHBlbmQoJ2RpdicpXG4gICAgLmF0dHIoJ2RhdGEtd2lkZ2V0LWNvbXBvbmVudCcsICd0aXRsZScpO1xuXG4gIGVsLmFwcGVuZCgnZGl2JylcbiAgICAuYXR0cignZGF0YS13aWRnZXQtY29tcG9uZW50JywgJ2xhc3QtdmFsdWUnKTtcblxuICBlbC5hcHBlbmQoJ2RpdicpXG4gICAgLmF0dHIoJ2RhdGEtd2lkZ2V0LWNvbXBvbmVudCcsICdzcGFya2xpbmUnKTtcblxuICBlbC5hcHBlbmQoJ2RpdicpXG4gICAgLmF0dHIoJ2RhdGEtd2lkZ2V0LWNvbXBvbmVudCcsICdzdW1tYXJ5Jyk7XG59XG5cblxuZnVuY3Rpb24gZ2V0VmFsdWVzKGQpIHtcbiAgcmV0dXJuIGQudmFsdWVzO1xufVxuXG5cbmZ1bmN0aW9uIGRyYXdUaXRsZSh0aXRsZSkge1xuICB0aXRsZVxuICAgIC5jbGFzc2VkKCdzcGgtdGl0bGUnLCB0cnVlKVxuICAgIC50ZXh0KGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQudGl0bGU7IH0pO1xufVxuXG5cbmZ1bmN0aW9uIGRyYXdMYXN0VmFsdWUodmFsdWUsIG9wdHMpIHtcbiAgdmFsdWVcbiAgICAuY2xhc3NlZCgnc3BoLWxhc3QtdmFsdWUnLCB0cnVlKVxuICAgIC5kYXR1bShmdW5jdGlvbihkLCBpKSB7XG4gICAgICBkID0gZFtkLmxlbmd0aCAtIDFdO1xuXG4gICAgICByZXR1cm4gIWRcbiAgICAgICAgPyBvcHRzLm5vbmVcbiAgICAgICAgOiBkLnk7XG4gICAgfSlcbiAgICAudGV4dChvcHRzLnlGb3JtYXQpO1xufVxuXG5cbmZ1bmN0aW9uIGRyYXdTcGFya2xpbmUoc3BhcmtsaW5lLCBvcHRzKSB7XG4gIHNwYXJrbGluZVxuICAgIC5jbGFzc2VkKCdzcGgtY2hhcnQgc3BoLWNoYXJ0LXNwYXJrbGluZScsIHRydWUpO1xuXG4gIGlmIChzcGFya2xpbmUuZGF0dW0oKS5sZW5ndGggPCBvcHRzLnNwYXJrbGluZUxpbWl0KSB7XG4gICAgLy8gVE9ETyBzb21ldGhpbmcgYmV0dGVyIHRoYW4gdGhpc1xuICAgIHNwYXJrbGluZS5zdHlsZSgnaGVpZ2h0JywgMCk7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgdmFyIGRpbXMgPSB1dGlscy5ib3goKVxuICAgIC5tYXJnaW4ob3B0cy5zcGFya2xpbmVNYXJnaW4pXG4gICAgLndpZHRoKHV0aWxzLmlubmVyV2lkdGgoc3BhcmtsaW5lKSlcbiAgICAuaGVpZ2h0KHV0aWxzLmlubmVySGVpZ2h0KHNwYXJrbGluZSkpXG4gICAgLmNhbGMoKTtcblxuICB2YXIgZnggPSBkMy5zY2FsZS5saW5lYXIoKVxuICAgIC5kb21haW4oZDMuZXh0ZW50KHNwYXJrbGluZS5kYXR1bSgpLCBmdW5jdGlvbihkKSB7IHJldHVybiBkLng7IH0pKVxuICAgIC5yYW5nZShbMCwgZGltcy5pbm5lcldpZHRoXSk7XG5cbiAgdmFyIGZ5ID0gZDMuc2NhbGUubGluZWFyKClcbiAgICAuZG9tYWluKGQzLmV4dGVudChzcGFya2xpbmUuZGF0dW0oKSwgZnVuY3Rpb24oZCkgeyByZXR1cm4gZC55OyB9KSlcbiAgICAucmFuZ2UoW2RpbXMuaW5uZXJIZWlnaHQsIDBdKTtcblxuICBzcGFya2xpbmVcbiAgICAuZmlsdGVyKHV0aWxzLmlzRW1wdHlOb2RlKVxuICAgIC5jYWxsKGluaXRTcGFya2xpbmUpO1xuXG4gIHNwYXJrbGluZS5zZWxlY3QoJ3N2ZycpXG4gICAgLmNhbGwoZHJhd1N2ZywgZGltcywgZngsIGZ5KTtcbn1cblxuXG5mdW5jdGlvbiBkcmF3U3ZnKHN2ZywgZGltcywgZngsIGZ5KSB7XG4gIHN2ZyA9IHN2Z1xuICAgIC5hdHRyKCd3aWR0aCcsIGRpbXMud2lkdGgpXG4gICAgLmF0dHIoJ2hlaWdodCcsIGRpbXMuaGVpZ2h0KVxuICAgIC5zZWxlY3QoJ2cnKVxuICAgICAgLmF0dHIoJ3RyYW5zZm9ybScsIHV0aWxzLnRyYW5zbGF0ZShkaW1zLm1hcmdpbi5sZWZ0LCBkaW1zLm1hcmdpbi50b3ApKTtcblxuICBzdmcuc2VsZWN0KCcuc3BoLXNwYXJrbGluZS1wYXRocycpXG4gICAgLmNhbGwoZHJhd1BhdGhzLCBmeCwgZnkpO1xuXG4gIHN2Zy5zZWxlY3RBbGwoJy5zcGgtc3BhcmtsaW5lLWRvdCcpXG4gICAgLmRhdGEoZnVuY3Rpb24oZCkgeyByZXR1cm4gZC5zbGljZSgtMSk7IH0pXG4gICAgLmNhbGwoZHJhd0RvdCwgZngsIGZ5KTtcbn1cblxuXG5mdW5jdGlvbiBkcmF3UGF0aHMocGF0aHMsIGZ4LCBmeSkge1xuICB2YXIgbGluZSA9IGQzLnN2Zy5saW5lKClcbiAgICAueChmdW5jdGlvbihkKSB7IHJldHVybiBmeChkLngpOyB9KVxuICAgIC55KGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGZ5KGQueSk7IH0pO1xuXG4gIHBhdGhzLnNlbGVjdCgnLnNwaC1zcGFya2xpbmUtcGF0aC1yZXN0JylcbiAgICAuYXR0cignZCcsIGxpbmUpO1xuXG4gIHBhdGhzLnNlbGVjdCgnLnNwaC1zcGFya2xpbmUtcGF0aC1kaWZmJylcbiAgICAuZGF0dW0oZnVuY3Rpb24oZCkgeyByZXR1cm4gZC5zbGljZSgtMik7IH0pXG4gICAgLmF0dHIoJ2QnLCBsaW5lKTtcbn1cblxuXG5mdW5jdGlvbiBpbml0U3BhcmtsaW5lKHNwYXJrbGluZSkge1xuICB2YXIgc3ZnID0gc3BhcmtsaW5lLmFwcGVuZCgnc3ZnJylcbiAgICAuYXBwZW5kKCdnJyk7XG5cbiAgdmFyIHBhdGhzID0gc3ZnLmFwcGVuZCgnZycpXG4gICAgLmF0dHIoJ2NsYXNzJywgJ3NwaC1zcGFya2xpbmUtcGF0aHMnKTtcblxuICBwYXRocy5hcHBlbmQoJ3BhdGgnKVxuICAgIC5hdHRyKCdjbGFzcycsICdzcGgtc3BhcmtsaW5lLXBhdGggc3BoLXNwYXJrbGluZS1wYXRoLXJlc3QnKTtcblxuICBwYXRocy5hcHBlbmQoJ3BhdGgnKVxuICAgIC5hdHRyKCdjbGFzcycsICdzcGgtc3BhcmtsaW5lLXBhdGggc3BoLXNwYXJrbGluZS1wYXRoLWRpZmYnKTtcbn1cblxuXG5mdW5jdGlvbiBkcmF3RG90KGRvdCwgZngsIGZ5KSB7XG4gIGRvdC5lbnRlcigpLmFwcGVuZCgnY2lyY2xlJylcbiAgICAuYXR0cignY2xhc3MnLCAnc3BoLXNwYXJrbGluZS1kb3QnKVxuICAgIC5hdHRyKCdyJywgNCk7XG5cbiAgZG90XG4gICAgLmF0dHIoJ2N4JywgZnVuY3Rpb24oZCkgeyByZXR1cm4gZngoZC54KTsgfSlcbiAgICAuYXR0cignY3knLCBmdW5jdGlvbihkKSB7IHJldHVybiBmeShkLnkpOyB9KTtcblxuICBkb3QuZXhpdCgpLnJlbW92ZSgpO1xufVxuXG5cbmZ1bmN0aW9uIGRyYXdTdW1tYXJ5KHN1bW1hcnksIG9wdHMpIHtcbiAgc3VtbWFyeVxuICAgIC5jbGFzc2VkKCdzcGgtc3VtbWFyeScsIHRydWUpO1xuXG4gIGlmIChzdW1tYXJ5LmRhdHVtKCkubGVuZ3RoIDwgb3B0cy5zdW1tYXJ5TGltaXQpIHtcbiAgICAvLyBUT0RPIHNvbWV0aGluZyBiZXR0ZXIgdGhhbiB0aGlzXG4gICAgc3VtbWFyeS5zdHlsZSgnaGVpZ2h0JywgMCk7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgc3VtbWFyeVxuICAgIC5maWx0ZXIodXRpbHMuaXNFbXB0eU5vZGUpXG4gICAgLmNhbGwoaW5pdFN1bW1hcnkpO1xuXG4gIHN1bW1hcnkuc2VsZWN0KCcuc3BoLXN1bW1hcnktZGlmZicpXG4gICAgLmRhdHVtKGZ1bmN0aW9uKGQpIHtcbiAgICAgIGQgPSBkLnNsaWNlKC0yKTtcbiAgICAgIHJldHVybiBkWzFdLnkgLSBkWzBdLnk7XG4gICAgfSlcbiAgICAudGV4dChvcHRzLmRpZmZGb3JtYXQpO1xuXG4gIHN1bW1hcnkuc2VsZWN0KCcuc3BoLXN1bW1hcnktdGltZScpXG4gICAgLmRhdHVtKGZ1bmN0aW9uKGQpIHtcbiAgICAgIGQgPSBkLnNsaWNlKC0yKTtcblxuICAgICAgcmV0dXJuIFtkWzBdLngsIGRbMV0ueF1cbiAgICAgICAgLm1hcCh1dGlscy5kYXRlKVxuICAgICAgICAubWFwKG9wdHMueEZvcm1hdCk7XG4gICAgfSlcbiAgICAudGV4dChmdW5jdGlvbihkKSB7XG4gICAgICByZXR1cm4gWycgZnJvbScsIGRbMF0sICd0bycsIGRbMV1dLmpvaW4oJyAnKTtcbiAgICB9KTtcbn1cblxuXG5mdW5jdGlvbiBpbml0U3VtbWFyeShzdW1tYXJ5KSB7XG4gIHN1bW1hcnkuYXBwZW5kKCdzcGFuJylcbiAgICAuYXR0cignY2xhc3MnLCAnc3BoLXN1bW1hcnktZGlmZicpO1xuXG4gIHN1bW1hcnkuYXBwZW5kKCdzcGFuJylcbiAgICAuYXR0cignY2xhc3MnLCAnc3BoLXN1bW1hcnktdGltZScpO1xufVxuXG5cbmZ1bmN0aW9uIG5vcm1hbGl6ZShlbCwgb3B0cykge1xuICB2YXIgbm9kZSA9IGVsLm5vZGUoKTtcblxuICBlbC5kYXR1bShmdW5jdGlvbihkLCBpKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHRpdGxlOiBvcHRzLnRpdGxlLmNhbGwobm9kZSwgZCwgaSksXG4gICAgICB2YWx1ZXM6IG9wdHMudmFsdWVzLmNhbGwobm9kZSwgZCwgaSlcbiAgICAgICAgLm1hcCh2YWx1ZSlcbiAgICB9O1xuICB9KTtcblxuXG4gIGZ1bmN0aW9uIHZhbHVlKGQsIGkpIHtcbiAgICByZXR1cm4ge1xuICAgICAgeDogb3B0cy54LmNhbGwobm9kZSwgZCwgaSksXG4gICAgICB5OiBvcHRzLnkuY2FsbChub2RlLCBkLCBpKVxuICAgIH07XG4gIH1cbn1cblxuXG5mdW5jdGlvbiBnZXRTdGF0dXModmFsdWVzKSB7XG4gIHZhbHVlcyA9IHZhbHVlcy5zbGljZSgtMik7XG5cbiAgdmFyIGRpZmYgPSB2YWx1ZXMubGVuZ3RoID4gMVxuICAgID8gdmFsdWVzWzFdLnkgLSB2YWx1ZXNbMF0ueVxuICAgIDogMDtcblxuICBpZiAoZGlmZiA+IDApIHJldHVybiAnc3BoLWlzLXN0YXR1cy1nb29kJztcbiAgaWYgKGRpZmYgPCAwKSByZXR1cm4gJ3NwaC1pcy1zdGF0dXMtYmFkJztcbiAgcmV0dXJuICdzcGgtaXMtc3RhdHVzLW5ldXRyYWwnO1xufVxuIiwidmFyIHV0aWxzID0gcmVxdWlyZSgnLi4vdXRpbHMnKTtcblxuXG5tb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoJy4vd2lkZ2V0JykuZXh0ZW5kKClcbiAgLnByb3AoJ3RpdGxlJylcbiAgLnNldChkMy5mdW5jdG9yKVxuICAuZGVmYXVsdChmdW5jdGlvbihkKSB7IHJldHVybiBkLnRpdGxlOyB9KVxuXG4gIC5wcm9wKCdtZXRyaWNzJylcbiAgLnNldChkMy5mdW5jdG9yKVxuICAuZGVmYXVsdChmdW5jdGlvbihkKSB7IHJldHVybiBkLm1ldHJpY3M7IH0pXG5cbiAgLnByb3AoJ2tleScpXG4gIC5zZXQoZDMuZnVuY3RvcilcbiAgLmRlZmF1bHQoZnVuY3Rpb24oZCwgaSkgeyByZXR1cm4gaTsgfSlcblxuICAucHJvcCgnbWV0cmljVGl0bGUnKVxuICAuc2V0KGQzLmZ1bmN0b3IpXG4gIC5kZWZhdWx0KGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQudGl0bGU7IH0pXG5cbiAgLnByb3AoJ3ZhbHVlcycpXG4gIC5zZXQoZDMuZnVuY3RvcilcbiAgLmRlZmF1bHQoZnVuY3Rpb24oZCkgeyByZXR1cm4gZC52YWx1ZXM7IH0pXG5cbiAgLnByb3AoJ3gnKVxuICAuc2V0KGQzLmZ1bmN0b3IpXG4gIC5kZWZhdWx0KGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQueDsgfSlcblxuICAucHJvcCgneScpXG4gIC5zZXQoZDMuZnVuY3RvcilcbiAgLmRlZmF1bHQoZnVuY3Rpb24oZCkgeyByZXR1cm4gZC55OyB9KVxuXG4gIC5wcm9wKCd4VGlja0Zvcm1hdCcpXG4gIC5kZWZhdWx0KG51bGwpXG5cbiAgLnByb3AoJ3hUaWNrcycpXG4gIC5kZWZhdWx0KDgpXG5cbiAgLnByb3AoJ3lGb3JtYXQnKVxuICAuZGVmYXVsdChkMy5mb3JtYXQoJywycycpKVxuXG4gIC5wcm9wKCd5VGlja3MnKVxuICAuZGVmYXVsdCg1KVxuXG4gIC5wcm9wKCd5VGlja0Zvcm1hdCcpXG4gIC5kZWZhdWx0KGQzLmZvcm1hdCgnLjJzJykpXG5cbiAgLnByb3AoJ3lNaW4nKVxuICAuc2V0KGQzLmZ1bmN0b3IpXG4gIC5kZWZhdWx0KGQzLm1pbilcblxuICAucHJvcCgneU1heCcpXG4gIC5zZXQoZDMuZnVuY3RvcilcbiAgLmRlZmF1bHQoZDMubWF4KVxuXG4gIC5wcm9wKCdub25lJylcbiAgLmRlZmF1bHQoMClcblxuICAucHJvcCgnY2hhcnRNYXJnaW4nKVxuICAuZGVmYXVsdCh7XG4gICAgdG9wOiAxMCxcbiAgICBsZWZ0OiAzNSxcbiAgICByaWdodDogMTUsXG4gICAgYm90dG9tOiAyMFxuICB9KVxuXG4gIC5wcm9wKCdjb2xvcnMnKVxuICAucHJvcCgnY2hhcnQnKVxuICAucHJvcCgnbGVnZW5kJylcblxuICAuaW5pdChmdW5jdGlvbigpIHtcbiAgICB0aGlzLmNvbG9ycyhkMy5zY2FsZS5jYXRlZ29yeTEwKCkpO1xuICB9KVxuXG4gIC5kcmF3KGZ1bmN0aW9uKGVsKSB7XG4gICAgdmFyIG9wdHMgPSB0aGlzLnByb3BzKCk7XG4gICAgbm9ybWFsaXplKGVsLCBvcHRzKTtcbiAgICBkcmF3V2lkZ2V0KGVsLCBvcHRzKTtcbiAgfSk7XG5cblxuZnVuY3Rpb24gZHJhd1dpZGdldChlbCwgb3B0cykge1xuICBlbC5jbGFzc2VkKCdzcGgtd2lkZ2V0IHNwaC1saW5lcycsIHRydWUpO1xuXG4gIGlmICghb3B0cy5leHBsaWNpdENvbXBvbmVudHMpIGluaXRDb21wb25lbnRzKGVsKTtcblxuICB2YXIgY29tcG9uZW50ID0gZWwuc2VsZWN0KCdbZGF0YS13aWRnZXQtY29tcG9uZW50PVwidGl0bGVcIl0nKTtcbiAgaWYgKGNvbXBvbmVudC5zaXplKCkpIGNvbXBvbmVudC5jYWxsKGRyYXdUaXRsZSk7XG5cbiAgY29tcG9uZW50ID0gZWwuc2VsZWN0KCdbZGF0YS13aWRnZXQtY29tcG9uZW50PVwiY2hhcnRcIl0nKTtcbiAgaWYgKGNvbXBvbmVudC5zaXplKCkpIGNvbXBvbmVudC5kYXR1bShnZXRNZXRyaWNzKS5jYWxsKGRyYXdDaGFydCwgb3B0cyk7XG5cbiAgY29tcG9uZW50ID0gZWwuc2VsZWN0KCdbZGF0YS13aWRnZXQtY29tcG9uZW50PVwibGVnZW5kXCJdJyk7XG4gIGlmIChjb21wb25lbnQuc2l6ZSgpKSBjb21wb25lbnQuZGF0dW0oZ2V0TWV0cmljcykuY2FsbChkcmF3TGVnZW5kLCBvcHRzKTtcbn1cblxuXG5mdW5jdGlvbiBpbml0Q29tcG9uZW50cyhlbCkge1xuICBlbC5hcHBlbmQoJ2RpdicpXG4gICAgLmF0dHIoJ2RhdGEtd2lkZ2V0LWNvbXBvbmVudCcsICd0aXRsZScpO1xuXG4gIGVsLmFwcGVuZCgnZGl2JylcbiAgICAuYXR0cignZGF0YS13aWRnZXQtY29tcG9uZW50JywgJ2NoYXJ0Jyk7XG5cbiAgZWwuYXBwZW5kKCdkaXYnKVxuICAgIC5hdHRyKCdkYXRhLXdpZGdldC1jb21wb25lbnQnLCAnbGVnZW5kJyk7XG59XG5cblxuZnVuY3Rpb24gZHJhd1RpdGxlKHRpdGxlKSB7XG4gIHRpdGxlXG4gICAgLmNsYXNzZWQoJ3NwaC10aXRsZScsIHRydWUpXG4gICAgLnRleHQoZnVuY3Rpb24oZCkgeyByZXR1cm4gZC50aXRsZTsgfSk7XG59XG5cblxuZnVuY3Rpb24gZHJhd0NoYXJ0KGNoYXJ0LCBvcHRzKSB7XG4gIGNoYXJ0XG4gICAgLmNsYXNzZWQoJ3NwaC1jaGFydCBzcGgtY2hhcnQtbGluZXMnLCB0cnVlKTtcblxuICB2YXIgZGltcyA9IHV0aWxzLmJveCgpXG4gICAgLm1hcmdpbihvcHRzLmNoYXJ0TWFyZ2luKVxuICAgIC53aWR0aCh1dGlscy5pbm5lcldpZHRoKGNoYXJ0KSlcbiAgICAuaGVpZ2h0KHV0aWxzLmlubmVySGVpZ2h0KGNoYXJ0KSlcbiAgICAuY2FsYygpO1xuXG4gIHZhciBhbGxWYWx1ZXMgPSBjaGFydFxuICAgIC5kYXR1bSgpXG4gICAgLnJlZHVjZShmdW5jdGlvbihyZXN1bHRzLCBtZXRyaWMpIHtcbiAgICAgIHJlc3VsdHMucHVzaC5hcHBseShyZXN1bHRzLCBtZXRyaWMudmFsdWVzKTtcbiAgICAgIHJldHVybiByZXN1bHRzO1xuICAgIH0sIFtdKTtcblxuICB2YXIgZnggPSBkMy50aW1lLnNjYWxlKClcbiAgICAuZG9tYWluKGQzLmV4dGVudChhbGxWYWx1ZXMsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQueDsgfSkpXG4gICAgLnJhbmdlKFswLCBkaW1zLmlubmVyV2lkdGhdKTtcblxuICB2YXIgeXMgPSBhbGxWYWx1ZXNcbiAgICAubWFwKGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQueTsgfSk7XG5cbiAgdmFyIGZ5ID0gZDMuc2NhbGUubGluZWFyKClcbiAgICAuZG9tYWluKFtvcHRzLnlNaW4oeXMpLCBvcHRzLnlNYXgoeXMpXSlcbiAgICAucmFuZ2UoW2RpbXMuaW5uZXJIZWlnaHQsIDBdKTtcblxuICBjaGFydFxuICAgIC5maWx0ZXIodXRpbHMuaXNFbXB0eU5vZGUpXG4gICAgLmNhbGwoaW5pdENoYXJ0KTtcblxuICBjaGFydC5zZWxlY3QoJ3N2ZycpXG4gICAgLmNhbGwoZHJhd1N2ZywgZGltcywgZngsIGZ5LCBvcHRzKTtcbn1cblxuXG5mdW5jdGlvbiBpbml0Q2hhcnQoY2hhcnQpIHtcbiAgdmFyIHN2ZyA9IGNoYXJ0LmFwcGVuZCgnc3ZnJylcbiAgICAuYXBwZW5kKCdnJyk7XG5cbiAgc3ZnLmFwcGVuZCgnZycpXG4gICAgLmF0dHIoJ2NsYXNzJywgJ3NwaC1heGlzIHNwaC1heGlzLWxpbmVzIHNwaC1heGlzLWxpbmVzLXgnKTtcblxuICBzdmcuYXBwZW5kKCdnJylcbiAgICAuYXR0cignY2xhc3MnLCAnc3BoLWF4aXMgc3BoLWF4aXMtbGluZXMgc3BoLWF4aXMtbGluZXMteScpO1xuXG4gIHN2Zy5hcHBlbmQoJ2cnKVxuICAgIC5hdHRyKCdjbGFzcycsICdzcGgtbGluZXMtbWV0cmljcycpO1xufVxuXG5cbmZ1bmN0aW9uIGRyYXdTdmcoc3ZnLCBkaW1zLCBmeCwgZnksIG9wdHMpIHtcbiAgc3ZnXG4gICAgLmF0dHIoJ3dpZHRoJywgZGltcy53aWR0aClcbiAgICAuYXR0cignaGVpZ2h0JywgZGltcy5oZWlnaHQpXG4gICAgLnNlbGVjdCgnZycpXG4gICAgICAuYXR0cigndHJhbnNmb3JtJywgdXRpbHMudHJhbnNsYXRlKGRpbXMubWFyZ2luLmxlZnQsIGRpbXMubWFyZ2luLnRvcCkpO1xuXG4gIHN2Zy5zZWxlY3QoJy5zcGgtbGluZXMtbWV0cmljcycpXG4gICAgLmNhbGwoZHJhd0NoYXJ0TWV0cmljcywgZngsIGZ5KTtcblxuICBzdmcuc2VsZWN0KCcuc3BoLWF4aXMtbGluZXMteCcpXG4gICAgLmNhbGwoZHJhd1hBeGlzLCBkaW1zLCBmeCwgb3B0cyk7XG5cbiAgc3ZnLnNlbGVjdCgnLnNwaC1heGlzLWxpbmVzLXknKVxuICAgIC5jYWxsKGRyYXdZQXhpcywgZGltcywgZnksIG9wdHMpO1xufVxuXG5cbmZ1bmN0aW9uIGRyYXdDaGFydE1ldHJpY3MobWV0cmljcywgZngsIGZ5KSB7XG4gIHZhciBsaW5lID0gZDMuc3ZnLmxpbmUoKVxuICAgIC54KGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGZ4KGQueCk7IH0pXG4gICAgLnkoZnVuY3Rpb24oZCkgeyByZXR1cm4gZnkoZC55KTsgfSk7XG5cbiAgbWV0cmljcy5zZWxlY3RBbGwoJy5zcGgtbGluZXMtbWV0cmljJylcbiAgICAuZGF0YShmdW5jdGlvbihkKSB7IHJldHVybiBkOyB9LFxuICAgICAgICAgIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQua2V5OyB9KVxuICAgIC5jYWxsKGRyYXdDaGFydE1ldHJpYywgZngsIGZ5LCBsaW5lKTtcbn1cblxuXG5mdW5jdGlvbiBkcmF3Q2hhcnRNZXRyaWMobWV0cmljLCBmeCwgZnksIGxpbmUpIHtcbiAgbWV0cmljLmVudGVyKCkuYXBwZW5kKCdnJylcbiAgICAuYXR0cignY2xhc3MnLCAnc3BoLWxpbmVzLW1ldHJpYycpXG4gICAgLmF0dHIoJ2RhdGEta2V5JywgZnVuY3Rpb24oZCkgeyByZXR1cm4gZC5rZXk7IH0pXG4gICAgLmFwcGVuZCgncGF0aCcpXG4gICAgICAuYXR0cignY2xhc3MnLCAnc3BoLWxpbmVzLWxpbmUnKTtcblxuICBtZXRyaWMuc2VsZWN0KCcuc3BoLWxpbmVzLWxpbmUnKVxuICAgIC5hdHRyKCdzdHJva2UnLCBmdW5jdGlvbihkKSB7IHJldHVybiBkLmNvbG9yOyB9KVxuICAgIC5hdHRyKCdkJywgZnVuY3Rpb24oZCkgeyByZXR1cm4gbGluZShkLnZhbHVlcyk7IH0pO1xuXG4gIG1ldHJpYy5leGl0KClcbiAgICAucmVtb3ZlKCk7XG5cbiAgbWV0cmljLnNlbGVjdEFsbCgnLnNwaC1saW5lcy1kb3QnKVxuICAgIC5kYXRhKGZ1bmN0aW9uKGQpIHtcbiAgICAgIGlmICghZC52YWx1ZXMubGVuZ3RoKSB7IHJldHVybiBbXTsgfVxuICAgICAgdmFyIGxhc3QgPSBkLnZhbHVlc1tkLnZhbHVlcy5sZW5ndGggLSAxXTtcblxuICAgICAgcmV0dXJuIFt7XG4gICAgICAgIHg6IGxhc3QueCxcbiAgICAgICAgeTogbGFzdC55LFxuICAgICAgICBjb2xvcjogZC5jb2xvclxuICAgICAgfV07XG4gICAgfSlcbiAgICAuY2FsbChkcmF3RG90LCBmeCwgZnkpO1xufVxuXG5cbmZ1bmN0aW9uIGRyYXdEb3QoZG90LCBmeCwgZnkpIHtcbiAgZG90LmVudGVyKCkuYXBwZW5kKCdjaXJjbGUnKVxuICAgIC5hdHRyKCdjbGFzcycsICdzcGgtbGluZXMtZG90JylcbiAgICAuYXR0cigncicsIDQpO1xuXG4gIGRvdFxuICAgIC5hdHRyKCdmaWxsJywgZnVuY3Rpb24oZCkgeyByZXR1cm4gZC5jb2xvcjsgfSlcbiAgICAuYXR0cignY3gnLCBmdW5jdGlvbihkKSB7IHJldHVybiBmeChkLngpOyB9KVxuICAgIC5hdHRyKCdjeScsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGZ5KGQueSk7IH0pO1xuXG4gIGRvdC5leGl0KClcbiAgICAucmVtb3ZlKCk7XG59XG5cblxuZnVuY3Rpb24gZHJhd1hBeGlzKGF4aXMsIGRpbXMsIGZ4LCBvcHRzKSB7XG4gIGF4aXNcbiAgICAuYXR0cigndHJhbnNmb3JtJywgdXRpbHMudHJhbnNsYXRlKDAsIGRpbXMuaW5uZXJIZWlnaHQpKVxuICAgIC5jYWxsKGQzLnN2Zy5heGlzKClcbiAgICAgIC5zY2FsZShmeClcbiAgICAgIC50aWNrUGFkZGluZyg4KVxuICAgICAgLnRpY2tzKG9wdHMueFRpY2tzKVxuICAgICAgLnRpY2tGb3JtYXQob3B0cy54VGlja0Zvcm1hdClcbiAgICAgIC50aWNrU2l6ZSgtZGltcy5pbm5lckhlaWdodCkpO1xufVxuXG5cbmZ1bmN0aW9uIGRyYXdZQXhpcyhheGlzLCBkaW1zLCBmeSwgb3B0cykge1xuICBheGlzLmNhbGwoZDMuc3ZnLmF4aXMoKVxuICAgIC5vcmllbnQoJ2xlZnQnKVxuICAgIC5zY2FsZShmeSlcbiAgICAudGlja1BhZGRpbmcoOClcbiAgICAudGlja3Mob3B0cy55VGlja3MpXG4gICAgLnRpY2tGb3JtYXQob3B0cy55VGlja0Zvcm1hdClcbiAgICAudGlja1NpemUoLWRpbXMuaW5uZXJXaWR0aCkpO1xufVxuXG5cbmZ1bmN0aW9uIGRyYXdMZWdlbmQobGVnZW5kLCBvcHRzKSB7XG4gIGxlZ2VuZFxuICAgIC5maWx0ZXIodXRpbHMuaXNFbXB0eU5vZGUpXG4gICAgLmNhbGwoaW5pdExlZ2VuZCk7XG5cbiAgbGVnZW5kLnNlbGVjdCgnLnNwaC10YWJsZS1saW5lcycpLnNlbGVjdEFsbCgnLnNwaC1yb3ctbGluZXMtbWV0cmljJylcbiAgICAuZGF0YShmdW5jdGlvbihkKSB7IHJldHVybiBkOyB9LFxuICAgICAgICAgIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQua2V5OyB9KVxuICAgIC5jYWxsKGRyYXdMZWdlbmRNZXRyaWMsIG9wdHMpO1xufVxuXG5cbmZ1bmN0aW9uIGluaXRMZWdlbmQobGVnZW5kKSB7XG4gIGxlZ2VuZC5hcHBlbmQoJ3RhYmxlJylcbiAgICAuY2xhc3NlZCgnc3BoLXRhYmxlIHNwaC10YWJsZS1saW5lcycsIHRydWUpO1xufVxuXG5cbmZ1bmN0aW9uIGRyYXdMZWdlbmRNZXRyaWMobWV0cmljLCBvcHRzKSB7XG4gIHZhciBub25lID0gb3B0cy55Rm9ybWF0KG9wdHMubm9uZSk7XG5cbiAgbWV0cmljLmVudGVyKCkuYXBwZW5kKCd0cicpXG4gICAgLmNhbGwoZW50ZXJMZWdlbmRNZXRyaWMpO1xuXG4gIG1ldHJpYy5zZWxlY3QoJy5zcGgtY29sLXN3YXRjaCcpXG4gICAgLnN0eWxlKCdiYWNrZ3JvdW5kJywgZnVuY3Rpb24oZCkgeyByZXR1cm4gZC5jb2xvcjsgfSk7XG5cbiAgbWV0cmljLnNlbGVjdCgnLnNwaC1jb2wtbGluZXMtdGl0bGUnKVxuICAgIC50ZXh0KGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQudGl0bGU7IH0pO1xuXG4gIG1ldHJpYy5zZWxlY3QoJy5zcGgtY29sLWxpbmVzLXZhbHVlJylcbiAgICAudGV4dChmdW5jdGlvbihkKSB7XG4gICAgICBkID0gZC52YWx1ZXNbZC52YWx1ZXMubGVuZ3RoIC0gMV07XG5cbiAgICAgIHJldHVybiBkXG4gICAgICAgID8gb3B0cy55Rm9ybWF0KGQueSlcbiAgICAgICAgOiBub25lO1xuICAgIH0pO1xuXG4gIG1ldHJpYy5leGl0KClcbiAgICAucmVtb3ZlKCk7XG59XG5cblxuZnVuY3Rpb24gZW50ZXJMZWdlbmRNZXRyaWMobWV0cmljKSB7XG4gIG1ldHJpY1xuICAgIC5hdHRyKCdkYXRhLWtleScsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQua2V5OyB9KVxuICAgIC5hdHRyKCdjbGFzcycsICdzcGgtcm93LWxpbmVzLW1ldHJpYycpO1xuXG4gIG1ldHJpYy5hcHBlbmQoJ3RkJylcbiAgICAuYXR0cignY2xhc3MnLCAnc3BoLWNvbC1zd2F0Y2gnKTtcblxuICBtZXRyaWMuYXBwZW5kKCd0ZCcpXG4gICAgLmF0dHIoJ2NsYXNzJywgJ3NwaC1jb2wtbGluZXMtdGl0bGUnKTtcblxuICBtZXRyaWMuYXBwZW5kKCd0ZCcpXG4gICAgLmF0dHIoJ2NsYXNzJywgJ3NwaC1jb2wtbGluZXMtdmFsdWUnKTtcbn1cblxuXG5mdW5jdGlvbiBub3JtYWxpemUoZWwsIG9wdHMpIHtcbiAgdmFyIG5vZGUgPSBlbC5ub2RlKCk7XG5cbiAgZWwuZGF0dW0oZnVuY3Rpb24oZCwgaSkge1xuICAgIHZhciB0aXRsZSA9IG9wdHMudGl0bGUuY2FsbChub2RlLCBkLCBpKTtcblxuICAgIHJldHVybiB7XG4gICAgICB0aXRsZTogdGl0bGUsXG4gICAgICBtZXRyaWNzOiBvcHRzLm1ldHJpY3MuY2FsbChub2RlLCBkLCBpKS5tYXAobWV0cmljKVxuICAgIH07XG4gIH0pO1xuXG4gIGZ1bmN0aW9uIG1ldHJpYyhkLCBpKSB7XG4gICAgdmFyIGtleSA9IG9wdHMua2V5XG4gICAgICAuY2FsbChub2RlLCBkLCBpKVxuICAgICAgLnRvU3RyaW5nKCk7XG5cbiAgICByZXR1cm4ge1xuICAgICAga2V5OiBrZXksXG4gICAgICBjb2xvcjogb3B0cy5jb2xvcnMoa2V5KSxcbiAgICAgIHRpdGxlOiBvcHRzLm1ldHJpY1RpdGxlLmNhbGwobm9kZSwgZCwgaSksXG4gICAgICB2YWx1ZXM6IG9wdHMudmFsdWVzLmNhbGwobm9kZSwgZCwgaSkubWFwKHZhbHVlKVxuICAgIH07XG4gIH1cblxuICBmdW5jdGlvbiB2YWx1ZShkLCBpKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHg6IG9wdHMueC5jYWxsKG5vZGUsIGQsIGkpLFxuICAgICAgeTogb3B0cy55LmNhbGwobm9kZSwgZCwgaSlcbiAgICB9O1xuICB9XG59XG5cblxuZnVuY3Rpb24gZ2V0TWV0cmljcyhkKSB7XG4gIHJldHVybiBkLm1ldHJpY3M7XG59XG4iLCJ2YXIgdXRpbHMgPSByZXF1aXJlKCcuLi91dGlscycpO1xuXG5cbm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSgnLi93aWRnZXQnKS5leHRlbmQoKVxuICAucHJvcCgnY29sb3JzJylcblxuICAucHJvcCgndGl0bGUnKVxuICAuc2V0KGQzLmZ1bmN0b3IpXG4gIC5kZWZhdWx0KGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQudGl0bGU7IH0pXG5cbiAgLnByb3AoJ21ldHJpY3MnKVxuICAuc2V0KGQzLmZ1bmN0b3IpXG4gIC5kZWZhdWx0KGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQubWV0cmljczsgfSlcblxuICAucHJvcCgna2V5JylcbiAgLnNldChkMy5mdW5jdG9yKVxuICAuZGVmYXVsdChmdW5jdGlvbihkLCBpKSB7IHJldHVybiBpOyB9KVxuXG4gIC5wcm9wKCdtZXRyaWNUaXRsZScpXG4gIC5zZXQoZDMuZnVuY3RvcilcbiAgLmRlZmF1bHQoZnVuY3Rpb24oZCkgeyByZXR1cm4gZC50aXRsZTsgfSlcblxuICAucHJvcCgndmFsdWUnKVxuICAuc2V0KGQzLmZ1bmN0b3IpXG4gIC5kZWZhdWx0KGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQudmFsdWU7IH0pXG5cbiAgLnByb3AoJ2NoYXJ0TWFyZ2luJylcbiAgLmRlZmF1bHQoe1xuICAgIHRvcDogMjAsXG4gICAgbGVmdDogMjAsXG4gICAgcmlnaHQ6IDIwLFxuICAgIGJvdHRvbTogMjBcbiAgfSlcblxuICAucHJvcCgnaW5uZXJSYWRpdXMnKVxuICAuc2V0KGQzLmZ1bmN0b3IpXG4gIC5kZWZhdWx0KDApXG5cbiAgLnByb3AoJ3ZhbHVlRm9ybWF0JylcbiAgLmRlZmF1bHQoZDMuZm9ybWF0KCcsMnMnKSlcblxuICAucHJvcCgncGVyY2VudEZvcm1hdCcpXG4gIC5kZWZhdWx0KGQzLmZvcm1hdCgnLjAlJykpXG5cbiAgLmluaXQoZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5jb2xvcnMoZDMuc2NhbGUuY2F0ZWdvcnkxMCgpKTtcbiAgfSlcblxuICAuZHJhdyhmdW5jdGlvbihlbCkge1xuICAgIHZhciBvcHRzID0gdGhpcy5wcm9wcygpO1xuICAgIG5vcm1hbGl6ZShlbCwgb3B0cyk7XG4gICAgZHJhd1dpZGdldChlbCwgb3B0cyk7XG4gIH0pO1xuXG5cbmZ1bmN0aW9uIGRyYXdXaWRnZXQoZWwsIG9wdHMpIHtcbiAgZWwuY2xhc3NlZCgnc3BoLXdpZGdldCBzcGgtcGllJywgdHJ1ZSk7XG5cbiAgaWYgKCFvcHRzLmV4cGxpY2l0Q29tcG9uZW50cykgaW5pdENvbXBvbmVudHMoZWwpO1xuXG4gIHZhciBjb21wb25lbnQgPSBlbC5zZWxlY3QoJ1tkYXRhLXdpZGdldC1jb21wb25lbnQ9XCJ0aXRsZVwiXScpO1xuICBpZiAoY29tcG9uZW50LnNpemUoKSkgY29tcG9uZW50LmNhbGwoZHJhd1RpdGxlKTtcblxuICBjb21wb25lbnQgPSBlbC5zZWxlY3QoJ1tkYXRhLXdpZGdldC1jb21wb25lbnQ9XCJjaGFydFwiXScpO1xuICBpZiAoY29tcG9uZW50LnNpemUoKSkgY29tcG9uZW50LmRhdHVtKGdldE1ldHJpY3MpLmNhbGwoZHJhd0NoYXJ0LCBvcHRzKTtcblxuICBjb21wb25lbnQgPSBlbC5zZWxlY3QoJ1tkYXRhLXdpZGdldC1jb21wb25lbnQ9XCJsZWdlbmRcIl0nKTtcbiAgaWYgKGNvbXBvbmVudC5zaXplKCkpIGNvbXBvbmVudC5kYXR1bShnZXRNZXRyaWNzKS5jYWxsKGRyYXdMZWdlbmQsIG9wdHMpO1xufVxuXG5cbmZ1bmN0aW9uIGluaXRDb21wb25lbnRzKGVsKSB7XG4gIGVsLmFwcGVuZCgnZGl2JylcbiAgICAuYXR0cignZGF0YS13aWRnZXQtY29tcG9uZW50JywgJ3RpdGxlJyk7XG5cbiAgZWwuYXBwZW5kKCdkaXYnKVxuICAgIC5hdHRyKCdkYXRhLXdpZGdldC1jb21wb25lbnQnLCAnY2hhcnQnKTtcblxuICBlbC5hcHBlbmQoJ2RpdicpXG4gICAgLmF0dHIoJ2RhdGEtd2lkZ2V0LWNvbXBvbmVudCcsICdsZWdlbmQnKTtcbn1cblxuXG5mdW5jdGlvbiBkcmF3VGl0bGUodGl0bGUpIHtcbiAgdGl0bGVcbiAgICAuY2xhc3NlZCgnc3BoLXRpdGxlJywgdHJ1ZSlcbiAgICAudGV4dChmdW5jdGlvbihkKSB7IHJldHVybiBkLnRpdGxlOyB9KTtcbn1cblxuXG5mdW5jdGlvbiBkcmF3Q2hhcnQoY2hhcnQsIG9wdHMpIHtcbiAgY2hhcnRcbiAgICAuY2xhc3NlZCgnc3BoLWNoYXJ0IHNwaC1jaGFydC1waWUnLCB0cnVlKTtcblxuICBjaGFydFxuICAgIC5maWx0ZXIodXRpbHMuaXNFbXB0eU5vZGUpXG4gICAgLmNhbGwoaW5pdENoYXJ0KTtcblxuICB2YXIgZGltcyA9IHV0aWxzLmJveCgpXG4gICAgLm1hcmdpbihvcHRzLmNoYXJ0TWFyZ2luKVxuICAgIC53aWR0aCh1dGlscy5pbm5lcldpZHRoKGNoYXJ0KSlcbiAgICAuaGVpZ2h0KHV0aWxzLmlubmVySGVpZ2h0KGNoYXJ0KSlcbiAgICAuY2FsYygpO1xuXG4gIGRpbXMucmFkaXVzID0gTWF0aC5taW4oZGltcy5pbm5lcldpZHRoLCBkaW1zLmlubmVySGVpZ2h0KSAvIDI7XG5cbiAgY2hhcnQuc2VsZWN0KCdzdmcnKVxuICAgIC5jYWxsKGRyYXdTdmcsIGRpbXMsIG9wdHMpO1xufVxuXG5cbmZ1bmN0aW9uIGluaXRDaGFydChjaGFydCkge1xuICBjaGFydC5hcHBlbmQoJ3N2ZycpXG4gICAgLmFwcGVuZCgnZycpO1xufVxuXG5cbmZ1bmN0aW9uIGRyYXdTdmcoc3ZnLCBkaW1zLCBvcHRzKSB7XG4gIHN2Z1xuICAgIC5hdHRyKCd3aWR0aCcsIGRpbXMud2lkdGgpXG4gICAgLmF0dHIoJ2hlaWdodCcsIGRpbXMuaGVpZ2h0KVxuICAgIC5zZWxlY3QoJ2cnKVxuICAgICAgLmF0dHIoJ3RyYW5zZm9ybScsIHV0aWxzLnRyYW5zbGF0ZShcbiAgICAgICAgKGRpbXMud2lkdGggLyAyKSAtIGRpbXMucmFkaXVzLFxuICAgICAgICAoZGltcy5oZWlnaHQgLyAyKSAtIGRpbXMucmFkaXVzKSlcbiAgICAgIC5jYWxsKGRyYXdTbGljZXMsIGRpbXMsIG9wdHMpO1xufVxuXG5cbmZ1bmN0aW9uIGRyYXdTbGljZXMoc3ZnLCBkaW1zLCBvcHRzKSB7XG4gIHZhciBhcmMgPSBkMy5zdmcuYXJjKClcbiAgICAuaW5uZXJSYWRpdXMob3B0cy5pbm5lclJhZGl1cyhkaW1zLnJhZGl1cykpXG4gICAgLm91dGVyUmFkaXVzKGRpbXMucmFkaXVzKTtcblxuICB2YXIgbGF5b3V0ID0gZDMubGF5b3V0LnBpZSgpXG4gICAgLnZhbHVlKGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQudmFsdWU7IH0pO1xuXG4gIHN2Zy5zZWxlY3RBbGwoJy5zcGgtcGllLXNsaWNlJylcbiAgICAuZGF0YShmdW5jdGlvbihkKSB7IHJldHVybiBsYXlvdXQoZCk7IH0sXG4gICAgICAgICAgZnVuY3Rpb24oZCkgeyByZXR1cm4gZC5kYXRhLmtleTsgfSlcbiAgICAuY2FsbChkcmF3U2xpY2UsIGRpbXMsIGFyYywgb3B0cyk7XG59XG5cblxuZnVuY3Rpb24gZHJhd1NsaWNlKHNsaWNlLCBkaW1zLCBhcmMsIG9wdHMpIHtcbiAgc2xpY2UuZW50ZXIoKS5hcHBlbmQoJ2cnKVxuICAgIC5hdHRyKCdjbGFzcycsICdzcGgtcGllLXNsaWNlJylcbiAgICAuYXBwZW5kKCdwYXRoJyk7XG5cbiAgc2xpY2VcbiAgICAuYXR0cigndHJhbnNmb3JtJywgdXRpbHMudHJhbnNsYXRlKGRpbXMucmFkaXVzLCBkaW1zLnJhZGl1cykpO1xuXG4gIHNsaWNlLnNlbGVjdCgncGF0aCcpXG4gICAgLmF0dHIoJ2QnLCBhcmMpXG4gICAgLnN0eWxlKCdmaWxsJywgZnVuY3Rpb24oZCkgeyByZXR1cm4gZC5kYXRhLmNvbG9yOyB9KTtcblxuICBzbGljZS5leGl0KClcbiAgICAucmVtb3ZlKCk7XG59XG5cblxuZnVuY3Rpb24gZHJhd0xlZ2VuZChsZWdlbmQsIG9wdHMpIHtcbiAgbGVnZW5kXG4gICAgLmZpbHRlcih1dGlscy5pc0VtcHR5Tm9kZSlcbiAgICAuY2FsbChpbml0TGVnZW5kKTtcblxuICBsZWdlbmQuc2VsZWN0KCcuc3BoLXRhYmxlLXBpZScpLnNlbGVjdEFsbCgnLnNwaC1yb3ctcGllLW1ldHJpYycpXG4gICAgLmRhdGEoZnVuY3Rpb24oZCkgeyByZXR1cm4gZDsgfSxcbiAgICAgICAgICBmdW5jdGlvbihkKSB7IHJldHVybiBkLmtleTsgfSlcbiAgICAuY2FsbChkcmF3TGVnZW5kTWV0cmljLCBvcHRzKTtcbn1cblxuXG5mdW5jdGlvbiBpbml0TGVnZW5kKGxlZ2VuZCkge1xuICBsZWdlbmQuYXBwZW5kKCd0YWJsZScpXG4gICAgLmF0dHIoJ2NsYXNzJywgJ3NwaC10YWJsZSBzcGgtdGFibGUtcGllJyk7XG59XG5cblxuZnVuY3Rpb24gZHJhd0xlZ2VuZE1ldHJpYyhtZXRyaWMsIG9wdHMpIHtcbiAgbWV0cmljLmVudGVyKCkuYXBwZW5kKCd0cicpXG4gICAgLmNhbGwoZW50ZXJMZWdlbmRNZXRyaWMpO1xuXG4gIG1ldHJpYy5zZWxlY3QoJy5zcGgtY29sLXN3YXRjaCcpXG4gICAgLnN0eWxlKCdiYWNrZ3JvdW5kJywgZnVuY3Rpb24oZCkgeyByZXR1cm4gZC5jb2xvcjsgfSk7XG5cbiAgbWV0cmljLnNlbGVjdCgnLnNwaC1jb2wtcGllLXRpdGxlJylcbiAgICAudGV4dChmdW5jdGlvbihkKSB7IHJldHVybiBkLnRpdGxlOyB9KTtcblxuICBtZXRyaWMuc2VsZWN0KCcuc3BoLWNvbC1waWUtcGVyY2VudCcpXG4gICAgLnRleHQoZnVuY3Rpb24oZCkgeyByZXR1cm4gb3B0cy5wZXJjZW50Rm9ybWF0KGQucGVyY2VudCk7IH0pO1xuXG4gIG1ldHJpYy5zZWxlY3QoJy5zcGgtY29sLXBpZS12YWx1ZScpXG4gICAgLnRleHQoZnVuY3Rpb24oZCkgeyByZXR1cm4gb3B0cy52YWx1ZUZvcm1hdChkLnZhbHVlKTsgfSk7XG5cbiAgbWV0cmljLmV4aXQoKVxuICAgIC5yZW1vdmUoKTtcbn1cblxuXG5mdW5jdGlvbiBlbnRlckxlZ2VuZE1ldHJpYyhtZXRyaWMpIHtcbiAgbWV0cmljXG4gICAgLmF0dHIoJ2NsYXNzJywgJ3NwaC1yb3ctcGllLW1ldHJpYycpO1xuXG4gIG1ldHJpYy5hcHBlbmQoJ3RkJylcbiAgICAuYXR0cignY2xhc3MnLCAnc3BoLWNvbC1zd2F0Y2gnKTtcblxuICBtZXRyaWMuYXBwZW5kKCd0ZCcpXG4gICAgLmF0dHIoJ2NsYXNzJywgJ3NwaC1jb2wtcGllLXRpdGxlJyk7XG5cbiAgbWV0cmljLmFwcGVuZCgndGQnKVxuICAgIC5hdHRyKCdjbGFzcycsICdzcGgtY29sLXBpZS1wZXJjZW50Jyk7XG5cbiAgbWV0cmljLmFwcGVuZCgndGQnKVxuICAgIC5hdHRyKCdjbGFzcycsICdzcGgtY29sLXBpZS12YWx1ZScpO1xufVxuXG5cbmZ1bmN0aW9uIG5vcm1hbGl6ZShlbCwgb3B0cykge1xuICB2YXIgbm9kZSA9IGVsLm5vZGUoKTtcblxuICBlbC5kYXR1bShmdW5jdGlvbihkLCBpKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHRpdGxlOiBvcHRzLnRpdGxlLmNhbGwobm9kZSwgZCwgaSksXG4gICAgICBtZXRyaWNzOiBvcHRzLm1ldHJpY3MuY2FsbChub2RlLCBkLCBpKS5tYXAobWV0cmljKVxuICAgIH07XG4gIH0pO1xuXG4gIGZ1bmN0aW9uIG1ldHJpYyhkLCBpKSB7XG4gICAgdmFyIGtleSA9IG9wdHMua2V5XG4gICAgICAuY2FsbChub2RlLCBkLCBpKVxuICAgICAgLnRvU3RyaW5nKCk7XG5cbiAgICByZXR1cm4ge1xuICAgICAga2V5OiBrZXksXG4gICAgICBjb2xvcjogb3B0cy5jb2xvcnMoa2V5KSxcbiAgICAgIHRpdGxlOiBvcHRzLm1ldHJpY1RpdGxlLmNhbGwobm9kZSwgZCwgaSksXG4gICAgICB2YWx1ZTogb3B0cy52YWx1ZS5jYWxsKG5vZGUsIGQsIGkpXG4gICAgfTtcbiAgfVxuXG4gIHZhciBzdW0gPSBkMy5zdW0oZWwuZGF0dW0oKS5tZXRyaWNzLCBmdW5jdGlvbihkKSB7IHJldHVybiBkLnZhbHVlOyB9KTtcbiAgZWwuZGF0dW0oKS5tZXRyaWNzLmZvckVhY2goZnVuY3Rpb24oZCkgeyBkLnBlcmNlbnQgPSBkLnZhbHVlIC8gc3VtOyB9KTtcbn1cblxuXG5mdW5jdGlvbiBnZXRNZXRyaWNzKGQpIHtcbiAgcmV0dXJuIGQubWV0cmljcztcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSgnLi4vdmlldycpLmV4dGVuZCgpXG4gIC5wcm9wKCdleHBsaWNpdENvbXBvbmVudHMnKVxuICAuZGVmYXVsdChmYWxzZSk7XG4iXX0=
(1)
});
