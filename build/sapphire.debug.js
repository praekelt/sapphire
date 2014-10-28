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
  .default(d3.format('s'))

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
  .default(d3.format('s'))

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
    right: 5,
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

},{"../utils":2,"./widget":9}],9:[function(_dereq_,module,exports){
module.exports = _dereq_('../view').extend()
  .prop('explicitComponents')
  .default(false);

},{"../view":3}]},{},[1])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9ob21lL2p1c3Rpbi9wcmFla2VsdC9zYXBwaGlyZS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiL2hvbWUvanVzdGluL3ByYWVrZWx0L3NhcHBoaXJlL3NyYy9zY3JpcHRzL2luZGV4LmpzIiwiL2hvbWUvanVzdGluL3ByYWVrZWx0L3NhcHBoaXJlL3NyYy9zY3JpcHRzL3V0aWxzLmpzIiwiL2hvbWUvanVzdGluL3ByYWVrZWx0L3NhcHBoaXJlL3NyYy9zY3JpcHRzL3ZpZXcuanMiLCIvaG9tZS9qdXN0aW4vcHJhZWtlbHQvc2FwcGhpcmUvc3JjL3NjcmlwdHMvd2lkZ2V0cy9iYXJzLmpzIiwiL2hvbWUvanVzdGluL3ByYWVrZWx0L3NhcHBoaXJlL3NyYy9zY3JpcHRzL3dpZGdldHMvaW5kZXguanMiLCIvaG9tZS9qdXN0aW4vcHJhZWtlbHQvc2FwcGhpcmUvc3JjL3NjcmlwdHMvd2lkZ2V0cy9sYXN0LmpzIiwiL2hvbWUvanVzdGluL3ByYWVrZWx0L3NhcHBoaXJlL3NyYy9zY3JpcHRzL3dpZGdldHMvbGluZXMuanMiLCIvaG9tZS9qdXN0aW4vcHJhZWtlbHQvc2FwcGhpcmUvc3JjL3NjcmlwdHMvd2lkZ2V0cy9waWUuanMiLCIvaG9tZS9qdXN0aW4vcHJhZWtlbHQvc2FwcGhpcmUvc3JjL3NjcmlwdHMvd2lkZ2V0cy93aWRnZXQuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTs7QUNIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlSQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMVdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdSQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpfXZhciBmPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChmLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGYsZi5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJleHBvcnRzLnV0aWxzID0gcmVxdWlyZSgnLi91dGlscycpO1xuZXhwb3J0cy52aWV3ID0gcmVxdWlyZSgnLi92aWV3Jyk7XG5leHBvcnRzLndpZGdldHMgPSByZXF1aXJlKCcuL3dpZGdldHMnKTtcbiIsInZhciB1dGlscyA9IGV4cG9ydHM7XG5cblxudXRpbHMuYWNjZXNzID0gZnVuY3Rpb24oZCwgbmFtZSwgZGVmYXVsdHZhbCkge1xuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA8IDMpIHtcbiAgICBkZWZhdWx0dmFsID0gbnVsbDtcbiAgfVxuXG4gIGlmICh0eXBlb2YgZCAhPSAnb2JqZWN0Jykge1xuICAgIHJldHVybiBkZWZhdWx0dmFsO1xuICB9XG5cbiAgdmFyIHZhbCA9IGRbbmFtZV07XG4gIHJldHVybiB0eXBlb2YgdmFsID09ICd1bmRlZmluZWQnXG4gICAgPyBkZWZhdWx0dmFsXG4gICAgOiB2YWw7XG59O1xuXG5cbnV0aWxzLmVuc3VyZSA9IGZ1bmN0aW9uKHYsIGRlZmF1bHR2YWwpIHtcbiAgcmV0dXJuIHYgPT09IG51bGwgfHwgdHlwZW9mIHYgPT0gJ3VuZGVmaW5lZCdcbiAgICA/IGRlZmF1bHR2YWxcbiAgICA6IHY7XG59O1xuXG5cbnV0aWxzLnRyYW5zbGF0ZSA9IGZ1bmN0aW9uKHgsIHkpIHtcbiAgcmV0dXJuICd0cmFuc2xhdGUoJyArIHggKyAnLCAnICsgeSArICcpJztcbn07XG5cblxudXRpbHMuZW5zdXJlRWwgPSBmdW5jdGlvbihlbCkge1xuICByZXR1cm4gIShlbCBpbnN0YW5jZW9mIGQzLnNlbGVjdGlvbilcbiAgICA/IGQzLnNlbGVjdChlbClcbiAgICA6IGVsO1xufTtcblxuXG51dGlscy5kYXRlID0gZnVuY3Rpb24odCkge1xuICByZXR1cm4gbmV3IERhdGUodCk7XG59O1xuXG5cbnV0aWxzLnB4ID0gZnVuY3Rpb24oZm4pIHtcbiAgZm4gPSBkMy5mdW5jdG9yKGZuKTtcblxuICByZXR1cm4gZnVuY3Rpb24oZCwgaSkge1xuICAgIHJldHVybiBmbi5jYWxsKHRoaXMsIGQsIGkpICsgJ3B4JztcbiAgfTtcbn07XG5cblxudXRpbHMuYm94ID0gc3RyYWluKClcbiAgLnByb3AoJ3dpZHRoJylcbiAgLmRlZmF1bHQoMClcblxuICAucHJvcCgnaGVpZ2h0JylcbiAgLmRlZmF1bHQoMClcblxuICAucHJvcCgnbWFyZ2luJylcbiAgLmRlZmF1bHQoe1xuICAgIHRvcDogMCxcbiAgICBsZWZ0OiAwLFxuICAgIHJpZ2h0OiAwLFxuICAgIGJvdHRvbTogMFxuICB9KVxuXG4gIC5tZXRoKCdjYWxjJywgZnVuY3Rpb24oKSB7XG4gICAgdmFyIGQgPSB7fTtcbiAgICBkLm1hcmdpbiA9IHRoaXMubWFyZ2luKCk7XG4gICAgZC53aWR0aCA9IHRoaXMud2lkdGgoKTtcbiAgICBkLmhlaWdodCA9IHRoaXMuaGVpZ2h0KCk7XG4gICAgZC5pbm5lcldpZHRoID0gZC53aWR0aCAtIGQubWFyZ2luLmxlZnQgLSBkLm1hcmdpbi5yaWdodDtcbiAgICBkLmlubmVySGVpZ2h0ID0gZC5oZWlnaHQgLSBkLm1hcmdpbi50b3AgLSBkLm1hcmdpbi5ib3R0b207XG4gICAgcmV0dXJuIGQ7XG4gIH0pXG5cbiAgLmludm9rZShmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5jYWxjKCk7XG4gIH0pO1xuXG5cbnV0aWxzLmlubmVyV2lkdGggPSBmdW5jdGlvbihlbCkge1xuICByZXR1cm4gdXRpbHMubWVhc3VyZShlbCwgJ3dpZHRoJylcbiAgICAgICAtIHV0aWxzLm1lYXN1cmUoZWwsICdwYWRkaW5nLWxlZnQnKVxuICAgICAgIC0gdXRpbHMubWVhc3VyZShlbCwgJ3BhZGRpbmctcmlnaHQnKTtcbn07XG5cblxudXRpbHMuaW5uZXJIZWlnaHQgPSBmdW5jdGlvbihlbCkge1xuICByZXR1cm4gdXRpbHMubWVhc3VyZShlbCwgJ2hlaWdodCcpXG4gICAgICAgLSB1dGlscy5tZWFzdXJlKGVsLCAncGFkZGluZy10b3AnKVxuICAgICAgIC0gdXRpbHMubWVhc3VyZShlbCwgJ3BhZGRpbmctYm90dG9tJyk7XG59O1xuXG5cbnV0aWxzLm1lYXN1cmUgPSBmdW5jdGlvbihlbCwgbmFtZSkge1xuICBlbCA9IHV0aWxzLmVuc3VyZUVsKGVsKTtcbiAgcmV0dXJuIHBhcnNlSW50KGVsLnN0eWxlKG5hbWUpKTtcbn07XG5cblxudXRpbHMuaXNFbXB0eU5vZGUgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuICF0aGlzLmhhc0NoaWxkTm9kZXMoKTtcbn07XG4iLCJtb2R1bGUuZXhwb3J0cyA9IHN0cmFpbigpXG4gIC5zdGF0aWMoJ2RyYXcnLCBmdW5jdGlvbihmbikge1xuICAgIHRoaXMubWV0aCgnX2RyYXdfJywgZm4pO1xuICB9KVxuICAuZHJhdyhmdW5jdGlvbigpIHt9KVxuXG4gIC5tZXRoKCdkcmF3JywgZnVuY3Rpb24oZWwpIHtcbiAgICBlbCA9IHNhcHBoaXJlLnV0aWxzLmVuc3VyZUVsKGVsKTtcblxuICAgIHZhciBkYXR1bTtcbiAgICBpZiAoZWwubm9kZSgpKSBkYXR1bSA9IGVsLmRhdHVtKCk7XG4gICAgdGhpcy5fZHJhd18uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICBpZiAodHlwZW9mIGRhdHVtICE9ICd1bmRlZmluZWQnKSBlbC5kYXR1bShkYXR1bSk7XG4gIH0pXG5cbiAgLmludm9rZShmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5kcmF3LmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gIH0pO1xuIiwidmFyIHV0aWxzID0gcmVxdWlyZSgnLi4vdXRpbHMnKTtcblxuXG5tb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoJy4vd2lkZ2V0JykuZXh0ZW5kKClcbiAgLnByb3AoJ2JhclBhZGRpbmcnKVxuICAuZGVmYXVsdCgyLjUpXG5cbiAgLnByb3AoJ2NoYXJ0TWFyZ2luJylcbiAgLmRlZmF1bHQoe1xuICAgIHRvcDogMTAsXG4gICAgbGVmdDogMzgsXG4gICAgcmlnaHQ6IDE1LFxuICAgIGJvdHRvbTogNDVcbiAgfSlcblxuICAucHJvcCgndGl0bGUnKVxuICAuc2V0KGQzLmZ1bmN0b3IpXG4gIC5kZWZhdWx0KGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQudGl0bGU7IH0pXG5cbiAgLnByb3AoJ3ZhbHVlcycpXG4gIC5zZXQoZDMuZnVuY3RvcilcbiAgLmRlZmF1bHQoZnVuY3Rpb24oZCkgeyByZXR1cm4gZC52YWx1ZXM7IH0pXG5cbiAgLnByb3AoJ3gnKVxuICAuc2V0KGQzLmZ1bmN0b3IpXG4gIC5kZWZhdWx0KGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQueDsgfSlcblxuICAucHJvcCgneScpXG4gIC5zZXQoZDMuZnVuY3RvcilcbiAgLmRlZmF1bHQoZnVuY3Rpb24oZCkgeyByZXR1cm4gZC55OyB9KVxuXG4gIC5wcm9wKCdkeCcpXG4gIC5zZXQoZDMuZnVuY3RvcilcbiAgLmRlZmF1bHQobnVsbClcblxuICAucHJvcCgneFRpY2tGb3JtYXQnKVxuICAuZGVmYXVsdChudWxsKVxuXG4gIC5wcm9wKCd4VGlja3MnKVxuICAuZGVmYXVsdCg4KVxuXG4gIC5wcm9wKCd5VGlja0Zvcm1hdCcpXG4gIC5kZWZhdWx0KGQzLmZvcm1hdCgncycpKVxuXG4gIC5wcm9wKCd5VGlja3MnKVxuICAuZGVmYXVsdCg1KVxuXG4gIC5wcm9wKCd5TWF4JylcbiAgLnNldChkMy5mdW5jdG9yKVxuICAuZGVmYXVsdChkMy5tYXgpXG5cbiAgLnByb3AoJ2NvbG9ycycpXG5cbiAgLmluaXQoZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5jb2xvcnMoZDMuc2NhbGUuY2F0ZWdvcnkxMCgpKTtcbiAgfSlcblxuICAuZHJhdyhmdW5jdGlvbihlbCkge1xuICAgIHZhciBvcHRzID0gdGhpcy5wcm9wcygpO1xuICAgIG5vcm1hbGl6ZShlbCwgb3B0cyk7XG5cbiAgICBvcHRzLndpZHRoID0gdXRpbHMuaW5uZXJXaWR0aChlbCk7XG4gICAgb3B0cy5jb2xvciA9IG9wdHMuY29sb3JzKGVsLmRhdHVtKCkudGl0bGUpO1xuICAgIGRyYXdXaWRnZXQoZWwsIG9wdHMpO1xuICB9KTtcblxuXG5mdW5jdGlvbiBkcmF3V2lkZ2V0KGVsLCBvcHRzKSB7XG4gIGVsLmNsYXNzZWQoJ3NwaC13aWRnZXQgc3BoLWJhcnMnLCB0cnVlKTtcblxuICBpZiAoIW9wdHMuZXhwbGljaXRDb21wb25lbnRzKSBpbml0Q29tcG9uZW50cyhlbCk7XG5cbiAgdmFyIGNvbXBvbmVudCA9IGVsLnNlbGVjdCgnW2RhdGEtd2lkZ2V0LWNvbXBvbmVudD1cInRpdGxlXCJdJyk7XG4gIGlmIChjb21wb25lbnQuc2l6ZSgpKSBjb21wb25lbnQuY2FsbChkcmF3VGl0bGUpO1xuXG4gIGNvbXBvbmVudCA9IGVsLnNlbGVjdCgnW2RhdGEtd2lkZ2V0LWNvbXBvbmVudD1cImNoYXJ0XCJdJyk7XG4gIGlmIChjb21wb25lbnQuc2l6ZSgpKSBjb21wb25lbnQuY2FsbChkcmF3Q2hhcnQsIG9wdHMpO1xufVxuXG5cbmZ1bmN0aW9uIGluaXRDb21wb25lbnRzKGVsKSB7XG4gIGVsLmFwcGVuZCgnZGl2JylcbiAgICAuYXR0cignZGF0YS13aWRnZXQtY29tcG9uZW50JywgJ3RpdGxlJyk7XG5cbiAgZWwuYXBwZW5kKCdkaXYnKVxuICAgIC5hdHRyKCdkYXRhLXdpZGdldC1jb21wb25lbnQnLCAnY2hhcnQnKTtcbn1cblxuXG5mdW5jdGlvbiBkcmF3VGl0bGUodGl0bGUpIHtcbiAgdGl0bGVcbiAgICAuY2xhc3NlZCgnc3BoLXRpdGxlJywgdHJ1ZSlcbiAgICAudGV4dChmdW5jdGlvbihkKSB7IHJldHVybiBkLnRpdGxlOyB9KTtcbn1cblxuXG5mdW5jdGlvbiBkcmF3Q2hhcnQoY2hhcnQsIG9wdHMpIHtcbiAgY2hhcnRcbiAgICAuY2xhc3NlZCgnc3BoLWNoYXJ0IHNwaC1jaGFydC1iYXJzJywgdHJ1ZSlcbiAgICAuZGF0dW0oZnVuY3Rpb24oZCkgeyByZXR1cm4gZC52YWx1ZXM7IH0pO1xuXG4gIHZhciBkaW1zID0gdXRpbHMuYm94KClcbiAgICAud2lkdGgob3B0cy53aWR0aClcbiAgICAuaGVpZ2h0KHV0aWxzLmlubmVySGVpZ2h0KGNoYXJ0KSlcbiAgICAubWFyZ2luKG9wdHMuY2hhcnRNYXJnaW4pXG4gICAgLmNhbGMoKTtcblxuICB2YXIgZnggPSBkMy50aW1lLnNjYWxlKClcbiAgICAuZG9tYWluKFtcbiAgICAgIGQzLm1pbihjaGFydC5kYXR1bSgpLCBmdW5jdGlvbihkKSB7IHJldHVybiBkLng7IH0pLFxuICAgICAgZDMubWF4KGNoYXJ0LmRhdHVtKCksIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQueCArIGQuZHg7IH0pXSk7XG5cbiAgdmFyIHlzID0gY2hhcnQuZGF0dW0oKVxuICAgIC5tYXAoZnVuY3Rpb24oZCkgeyByZXR1cm4gZC55OyB9KTtcblxuICB2YXIgZnkgPSBkMy5zY2FsZS5saW5lYXIoKVxuICAgIC5kb21haW4oWzAsIG9wdHMueU1heCh5cyldKTtcblxuICBmeC5yYW5nZShbMCwgZGltcy5pbm5lcldpZHRoXSk7XG4gIGZ5LnJhbmdlKFtkaW1zLmlubmVySGVpZ2h0LCAwXSk7XG5cbiAgY2hhcnRcbiAgICAuZmlsdGVyKHV0aWxzLmlzRW1wdHlOb2RlKVxuICAgIC5jYWxsKGluaXRDaGFydCk7XG5cbiAgY2hhcnQuc2VsZWN0KCdzdmcnKVxuICAgIC5jYWxsKGRyYXdTdmcsIGRpbXMsIGZ4LCBmeSwgb3B0cyk7XG59XG5cblxuZnVuY3Rpb24gaW5pdENoYXJ0KGNoYXJ0KSB7XG4gIHZhciBzdmcgPSBjaGFydFxuICAgIC5hcHBlbmQoJ3N2ZycpXG4gICAgLmFwcGVuZCgnZycpO1xuXG4gIHN2Zy5hcHBlbmQoJ2cnKVxuICAgIC5hdHRyKCdjbGFzcycsICdzcGgtYmFycy1iYXJzJyk7XG5cbiAgc3ZnLmFwcGVuZCgnZycpXG4gICAgLmF0dHIoJ2NsYXNzJywgJ3NwaC1heGlzIHNwaC1heGlzLWJhcnMteScpO1xuXG4gIHN2Zy5hcHBlbmQoJ2cnKVxuICAgIC5hdHRyKCdjbGFzcycsICdzcGgtYXhpcyBzcGgtYXhpcy1iYXJzLXgnKTtcbn1cblxuXG5mdW5jdGlvbiBkcmF3U3ZnKHN2ZywgZGltcywgZngsIGZ5LCBvcHRzKSB7XG4gIHN2Z1xuICAgIC5hdHRyKCd3aWR0aCcsIGRpbXMud2lkdGgpXG4gICAgLmF0dHIoJ2hlaWdodCcsIGRpbXMuaGVpZ2h0KVxuICAgIC5zZWxlY3QoJ2cnKVxuICAgICAgLmF0dHIoJ3RyYW5zZm9ybScsIHV0aWxzLnRyYW5zbGF0ZShcbiAgICAgICAgZGltcy5tYXJnaW4ubGVmdCxcbiAgICAgICAgZGltcy5tYXJnaW4udG9wKSk7XG5cbiAgc3ZnLnNlbGVjdCgnLnNwaC1iYXJzLWJhcnMnKVxuICAgICAuY2FsbChkcmF3QmFycywgZGltcywgZngsIGZ5LCBvcHRzKTtcblxuICBzdmcuc2VsZWN0KCcuc3BoLWF4aXMtYmFycy14JylcbiAgICAuY2FsbChkcmF3WEF4aXMsIGRpbXMsIGZ4LCBvcHRzKTtcblxuICBzdmcuc2VsZWN0KCcuc3BoLWF4aXMtYmFycy15JylcbiAgICAuY2FsbChkcmF3WUF4aXMsIGRpbXMsIGZ5LCBvcHRzKTtcbn1cblxuXG5mdW5jdGlvbiBkcmF3QmFycyhiYXJzLCBkaW1zLCBmeCwgZnksIG9wdHMpIHtcbiAgYmFyc1xuICAgIC5zZWxlY3RBbGwoJy5zcGgtYmFycy1iYXInKVxuICAgIC5kYXRhKGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQ7IH0sXG4gICAgICAgICAgZnVuY3Rpb24oZCkgeyByZXR1cm4gZC54OyB9KVxuICAgIC5jYWxsKGRyYXdCYXIsIGRpbXMsIGZ4LCBmeSwgb3B0cyk7XG59XG5cblxuZnVuY3Rpb24gZHJhd0JhcihiYXIsIGRpbXMsIGZ4LCBmeSwgb3B0cykge1xuICBiYXIuZW50ZXIoKS5hcHBlbmQoJ2cnKVxuICAgIC5hdHRyKCdjbGFzcycsICdzcGgtYmFycy1iYXInKVxuICAgIC5hcHBlbmQoJ3JlY3QnKTtcblxuICBiYXJcbiAgICAuYXR0cigndHJhbnNmb3JtJywgZnVuY3Rpb24oZCkge1xuICAgICAgcmV0dXJuIHV0aWxzLnRyYW5zbGF0ZShmeChkLngpLCBmeShkLnkpKTtcbiAgICB9KTtcblxuICBiYXIuc2VsZWN0KCdyZWN0JylcbiAgICAuc3R5bGUoJ2ZpbGwnLCBvcHRzLmNvbG9yKVxuICAgIC5hdHRyKCd3aWR0aCcsIGZ1bmN0aW9uKGQpIHtcbiAgICAgIHZhciB3aWR0aCA9IGZ4KGQueCArIGQuZHgpIC0gZngoZC54KTtcbiAgICAgIHdpZHRoIC09IG9wdHMuYmFyUGFkZGluZztcbiAgICAgIHJldHVybiBNYXRoLm1heCh3aWR0aCwgMSk7XG4gICAgfSlcbiAgICAuYXR0cignaGVpZ2h0JywgZnVuY3Rpb24oZCkge1xuICAgICAgcmV0dXJuIGRpbXMuaW5uZXJIZWlnaHQgLSBmeShkLnkpOyBcbiAgICB9KTtcblxuICBiYXIuZXhpdCgpXG4gICAgLnJlbW92ZSgpO1xufVxuXG5cbmZ1bmN0aW9uIGRyYXdYQXhpcyhheGlzLCBkaW1zLCBmeCwgb3B0cykge1xuICBheGlzXG4gICAgLmF0dHIoJ3RyYW5zZm9ybScsIHV0aWxzLnRyYW5zbGF0ZSgwLCBkaW1zLmlubmVySGVpZ2h0KSlcbiAgICAuY2FsbChkMy5zdmcuYXhpcygpXG4gICAgICAuc2NhbGUoZngpXG4gICAgICAudGlja3Mob3B0cy54VGlja3MpXG4gICAgICAudGlja0Zvcm1hdChvcHRzLnhUaWNrRm9ybWF0KSk7XG59XG5cblxuZnVuY3Rpb24gZHJhd1lBeGlzKGF4aXMsIGRpbXMsIGZ5LCBvcHRzKSB7XG4gIGF4aXMuY2FsbChkMy5zdmcuYXhpcygpXG4gICAgLm9yaWVudCgnbGVmdCcpXG4gICAgLnNjYWxlKGZ5KVxuICAgIC50aWNrUGFkZGluZyg4KVxuICAgIC50aWNrU2l6ZSgtZGltcy5pbm5lcldpZHRoKVxuICAgIC50aWNrcyhvcHRzLnlUaWNrcylcbiAgICAudGlja0Zvcm1hdChvcHRzLnlUaWNrRm9ybWF0KSk7XG59XG5cblxuZnVuY3Rpb24gbm9ybWFsaXplKGVsLCBvcHRzKSB7XG4gIHZhciBub2RlID0gZWwubm9kZSgpO1xuXG4gIGVsLmRhdHVtKGZ1bmN0aW9uKGQsIGkpIHtcbiAgICB2YXIgdmFsdWVzID0gb3B0cy52YWx1ZXNcbiAgICAgIC5jYWxsKG5vZGUsIGQsIGkpXG4gICAgICAubWFwKHZhbHVlKTtcblxuICAgIHZhciBsZW4gPSB2YWx1ZXMubGVuZ3RoO1xuICAgIHZhciBkeEF2ZyA9IHZhbHVlcy5sZW5ndGhcbiAgICAgID8gKHZhbHVlc1tsZW4gLSAxXS54IC0gdmFsdWVzWzBdLngpIC8gbGVuXG4gICAgICA6IDA7XG5cbiAgICB2YWx1ZXMuZm9yRWFjaChmdW5jdGlvbihkKSB7XG4gICAgICBkLmR4ID0gdXRpbHMuZW5zdXJlKGQuZHgsIGR4QXZnKTtcbiAgICB9KTtcblxuICAgIHJldHVybiB7XG4gICAgICB2YWx1ZXM6IHZhbHVlcyxcbiAgICAgIHRpdGxlOiBvcHRzLnRpdGxlLmNhbGwobm9kZSwgZCwgaSlcbiAgICB9O1xuICB9KTtcblxuICBmdW5jdGlvbiB2YWx1ZShkLCBpKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHg6IG9wdHMueC5jYWxsKG5vZGUsIGQsIGkpLFxuICAgICAgeTogb3B0cy55LmNhbGwobm9kZSwgZCwgaSksXG4gICAgICBkeDogb3B0cy5keC5jYWxsKG5vZGUsIGQsIGkpXG4gICAgfTtcbiAgfVxufVxuIiwiZXhwb3J0cy5waWUgPSByZXF1aXJlKCcuL3BpZScpO1xuZXhwb3J0cy5iYXJzID0gcmVxdWlyZSgnLi9iYXJzJyk7XG5leHBvcnRzLmxhc3QgPSByZXF1aXJlKCcuL2xhc3QnKTtcbmV4cG9ydHMubGluZXMgPSByZXF1aXJlKCcuL2xpbmVzJyk7XG5leHBvcnRzLndpZGdldCA9IHJlcXVpcmUoJy4vd2lkZ2V0Jyk7XG4iLCJ2YXIgdXRpbHMgPSByZXF1aXJlKCcuLi91dGlscycpO1xuXG5cbm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSgnLi93aWRnZXQnKS5leHRlbmQoKVxuICAucHJvcCgndGl0bGUnKVxuICAuc2V0KGQzLmZ1bmN0b3IpXG4gIC5kZWZhdWx0KGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQudGl0bGU7IH0pXG5cbiAgLnByb3AoJ3ZhbHVlcycpXG4gIC5zZXQoZDMuZnVuY3RvcilcbiAgLmRlZmF1bHQoZnVuY3Rpb24oZCkgeyByZXR1cm4gZC52YWx1ZXM7IH0pXG5cbiAgLnByb3AoJ3gnKVxuICAuc2V0KGQzLmZ1bmN0b3IpXG4gIC5kZWZhdWx0KGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQueDsgfSlcblxuICAucHJvcCgneScpXG4gIC5zZXQoZDMuZnVuY3RvcilcbiAgLmRlZmF1bHQoZnVuY3Rpb24oZCkgeyByZXR1cm4gZC55OyB9KVxuXG4gIC5wcm9wKCd5Rm9ybWF0JylcbiAgLmRlZmF1bHQoZDMuZm9ybWF0KCcsMnMnKSlcblxuICAucHJvcCgnZGlmZkZvcm1hdCcpXG4gIC5kZWZhdWx0KGQzLmZvcm1hdCgnKywycycpKVxuXG4gIC5wcm9wKCd4Rm9ybWF0JylcbiAgLmRlZmF1bHQoZDMudGltZS5mb3JtYXQoJyUtZCAlYiAlLUg6JU0nKSlcblxuICAucHJvcCgnbm9uZScpXG4gIC5kZWZhdWx0KDApXG5cbiAgLnByb3AoJ3N1bW1hcnlMaW1pdCcpXG4gIC5kZWZhdWx0KDIpXG4gIC5zZXQoZnVuY3Rpb24odikgeyByZXR1cm4gTWF0aC5tYXgodXRpbHMuZW5zdXJlKHYsIDIpLCAyKTsgfSlcblxuICAucHJvcCgnc3BhcmtsaW5lTGltaXQnKVxuICAuZGVmYXVsdCgxNSlcbiAgLnNldChmdW5jdGlvbih2KSB7IHJldHVybiBNYXRoLm1heCh1dGlscy5lbnN1cmUodiwgMiksIDIpOyB9KVxuXG4gIC5wcm9wKCdzcGFya2xpbmVNYXJnaW4nKVxuICAuZGVmYXVsdCh7XG4gICAgdG9wOiA0LFxuICAgIGxlZnQ6IDQsXG4gICAgYm90dG9tOiA0LFxuICAgIHJpZ2h0OiA0IFxuICB9KVxuXG4gIC5kcmF3KGZ1bmN0aW9uKGVsKSB7XG4gICAgdmFyIG9wdHMgPSB0aGlzLnByb3BzKCk7XG4gICAgbm9ybWFsaXplKGVsLCBvcHRzKTtcbiAgICBkcmF3V2lkZ2V0KGVsLCBvcHRzKTtcbiAgfSk7XG5cblxuZnVuY3Rpb24gZHJhd1dpZGdldChlbCwgb3B0cykge1xuICBlbC5jbGFzc2VkKCdzcGgtd2lkZ2V0IHNwaC1sYXN0JywgdHJ1ZSlcbiAgICAuY2xhc3NlZCgnc3BoLWlzLXN0YXR1cy1nb29kJywgZmFsc2UpXG4gICAgLmNsYXNzZWQoJ3NwaC1pcy1zdGF0dXMtYmFkJywgZmFsc2UpXG4gICAgLmNsYXNzZWQoJ3NwaC1pcy1zdGF0dXMtbmV1dHJhbCcsIGZhbHNlKVxuICAgIC5jbGFzc2VkKGdldFN0YXR1cyhlbC5kYXR1bSgpLnZhbHVlcyksIHRydWUpO1xuXG4gIGlmICghb3B0cy5leHBsaWNpdENvbXBvbmVudHMpIGluaXRDb21wb25lbnRzKGVsKTtcblxuICB2YXIgY29tcG9uZW50ID0gZWwuc2VsZWN0KCdbZGF0YS13aWRnZXQtY29tcG9uZW50PVwidGl0bGVcIl0nKTtcbiAgaWYgKGNvbXBvbmVudC5zaXplKCkpIGNvbXBvbmVudC5jYWxsKGRyYXdUaXRsZSk7XG5cbiAgY29tcG9uZW50ID0gZWwuc2VsZWN0KCdbZGF0YS13aWRnZXQtY29tcG9uZW50PVwibGFzdC12YWx1ZVwiXScpO1xuICBpZiAoY29tcG9uZW50LnNpemUoKSkgY29tcG9uZW50LmRhdHVtKGdldFZhbHVlcykuY2FsbChkcmF3TGFzdFZhbHVlLCBvcHRzKTtcblxuICBjb21wb25lbnQgPSBlbC5zZWxlY3QoJ1tkYXRhLXdpZGdldC1jb21wb25lbnQ9XCJzcGFya2xpbmVcIl0nKTtcbiAgaWYgKGNvbXBvbmVudC5zaXplKCkpIGNvbXBvbmVudC5kYXR1bShnZXRWYWx1ZXMpLmNhbGwoZHJhd1NwYXJrbGluZSwgb3B0cyk7XG5cbiAgY29tcG9uZW50ID0gZWwuc2VsZWN0KCdbZGF0YS13aWRnZXQtY29tcG9uZW50PVwic3VtbWFyeVwiXScpO1xuICBpZiAoY29tcG9uZW50LnNpemUoKSkgY29tcG9uZW50LmRhdHVtKGdldFZhbHVlcykuY2FsbChkcmF3U3VtbWFyeSwgb3B0cyk7XG59XG5cblxuZnVuY3Rpb24gaW5pdENvbXBvbmVudHMoZWwpIHtcbiAgZWwuYXBwZW5kKCdkaXYnKVxuICAgIC5hdHRyKCdkYXRhLXdpZGdldC1jb21wb25lbnQnLCAndGl0bGUnKTtcblxuICBlbC5hcHBlbmQoJ2RpdicpXG4gICAgLmF0dHIoJ2RhdGEtd2lkZ2V0LWNvbXBvbmVudCcsICdsYXN0LXZhbHVlJyk7XG5cbiAgZWwuYXBwZW5kKCdkaXYnKVxuICAgIC5hdHRyKCdkYXRhLXdpZGdldC1jb21wb25lbnQnLCAnc3BhcmtsaW5lJyk7XG5cbiAgZWwuYXBwZW5kKCdkaXYnKVxuICAgIC5hdHRyKCdkYXRhLXdpZGdldC1jb21wb25lbnQnLCAnc3VtbWFyeScpO1xufVxuXG5cbmZ1bmN0aW9uIGdldFZhbHVlcyhkKSB7XG4gIHJldHVybiBkLnZhbHVlcztcbn1cblxuXG5mdW5jdGlvbiBkcmF3VGl0bGUodGl0bGUpIHtcbiAgdGl0bGVcbiAgICAuY2xhc3NlZCgnc3BoLXRpdGxlJywgdHJ1ZSlcbiAgICAudGV4dChmdW5jdGlvbihkKSB7IHJldHVybiBkLnRpdGxlOyB9KTtcbn1cblxuXG5mdW5jdGlvbiBkcmF3TGFzdFZhbHVlKHZhbHVlLCBvcHRzKSB7XG4gIHZhbHVlXG4gICAgLmNsYXNzZWQoJ3NwaC1sYXN0LXZhbHVlJywgdHJ1ZSlcbiAgICAuZGF0dW0oZnVuY3Rpb24oZCwgaSkge1xuICAgICAgZCA9IGRbZC5sZW5ndGggLSAxXTtcblxuICAgICAgcmV0dXJuICFkXG4gICAgICAgID8gb3B0cy5ub25lXG4gICAgICAgIDogZC55O1xuICAgIH0pXG4gICAgLnRleHQob3B0cy55Rm9ybWF0KTtcbn1cblxuXG5mdW5jdGlvbiBkcmF3U3BhcmtsaW5lKHNwYXJrbGluZSwgb3B0cykge1xuICBzcGFya2xpbmVcbiAgICAuY2xhc3NlZCgnc3BoLWNoYXJ0IHNwaC1jaGFydC1zcGFya2xpbmUnLCB0cnVlKTtcblxuICBpZiAoc3BhcmtsaW5lLmRhdHVtKCkubGVuZ3RoIDwgb3B0cy5zcGFya2xpbmVMaW1pdCkge1xuICAgIC8vIFRPRE8gc29tZXRoaW5nIGJldHRlciB0aGFuIHRoaXNcbiAgICBzcGFya2xpbmUuc3R5bGUoJ2hlaWdodCcsIDApO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIHZhciBkaW1zID0gdXRpbHMuYm94KClcbiAgICAubWFyZ2luKG9wdHMuc3BhcmtsaW5lTWFyZ2luKVxuICAgIC53aWR0aCh1dGlscy5pbm5lcldpZHRoKHNwYXJrbGluZSkpXG4gICAgLmhlaWdodCh1dGlscy5pbm5lckhlaWdodChzcGFya2xpbmUpKVxuICAgIC5jYWxjKCk7XG5cbiAgdmFyIGZ4ID0gZDMuc2NhbGUubGluZWFyKClcbiAgICAuZG9tYWluKGQzLmV4dGVudChzcGFya2xpbmUuZGF0dW0oKSwgZnVuY3Rpb24oZCkgeyByZXR1cm4gZC54OyB9KSlcbiAgICAucmFuZ2UoWzAsIGRpbXMuaW5uZXJXaWR0aF0pO1xuXG4gIHZhciBmeSA9IGQzLnNjYWxlLmxpbmVhcigpXG4gICAgLmRvbWFpbihkMy5leHRlbnQoc3BhcmtsaW5lLmRhdHVtKCksIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQueTsgfSkpXG4gICAgLnJhbmdlKFtkaW1zLmlubmVySGVpZ2h0LCAwXSk7XG5cbiAgc3BhcmtsaW5lXG4gICAgLmZpbHRlcih1dGlscy5pc0VtcHR5Tm9kZSlcbiAgICAuY2FsbChpbml0U3BhcmtsaW5lKTtcblxuICBzcGFya2xpbmUuc2VsZWN0KCdzdmcnKVxuICAgIC5jYWxsKGRyYXdTdmcsIGRpbXMsIGZ4LCBmeSk7XG59XG5cblxuZnVuY3Rpb24gZHJhd1N2ZyhzdmcsIGRpbXMsIGZ4LCBmeSkge1xuICBzdmcgPSBzdmdcbiAgICAuYXR0cignd2lkdGgnLCBkaW1zLndpZHRoKVxuICAgIC5hdHRyKCdoZWlnaHQnLCBkaW1zLmhlaWdodClcbiAgICAuc2VsZWN0KCdnJylcbiAgICAgIC5hdHRyKCd0cmFuc2Zvcm0nLCB1dGlscy50cmFuc2xhdGUoZGltcy5tYXJnaW4ubGVmdCwgZGltcy5tYXJnaW4udG9wKSk7XG5cbiAgc3ZnLnNlbGVjdCgnLnNwaC1zcGFya2xpbmUtcGF0aHMnKVxuICAgIC5jYWxsKGRyYXdQYXRocywgZngsIGZ5KTtcblxuICBzdmcuc2VsZWN0QWxsKCcuc3BoLXNwYXJrbGluZS1kb3QnKVxuICAgIC5kYXRhKGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQuc2xpY2UoLTEpOyB9KVxuICAgIC5jYWxsKGRyYXdEb3QsIGZ4LCBmeSk7XG59XG5cblxuZnVuY3Rpb24gZHJhd1BhdGhzKHBhdGhzLCBmeCwgZnkpIHtcbiAgdmFyIGxpbmUgPSBkMy5zdmcubGluZSgpXG4gICAgLngoZnVuY3Rpb24oZCkgeyByZXR1cm4gZngoZC54KTsgfSlcbiAgICAueShmdW5jdGlvbihkKSB7IHJldHVybiBmeShkLnkpOyB9KTtcblxuICBwYXRocy5zZWxlY3QoJy5zcGgtc3BhcmtsaW5lLXBhdGgtcmVzdCcpXG4gICAgLmF0dHIoJ2QnLCBsaW5lKTtcblxuICBwYXRocy5zZWxlY3QoJy5zcGgtc3BhcmtsaW5lLXBhdGgtZGlmZicpXG4gICAgLmRhdHVtKGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQuc2xpY2UoLTIpOyB9KVxuICAgIC5hdHRyKCdkJywgbGluZSk7XG59XG5cblxuZnVuY3Rpb24gaW5pdFNwYXJrbGluZShzcGFya2xpbmUpIHtcbiAgdmFyIHN2ZyA9IHNwYXJrbGluZS5hcHBlbmQoJ3N2ZycpXG4gICAgLmFwcGVuZCgnZycpO1xuXG4gIHZhciBwYXRocyA9IHN2Zy5hcHBlbmQoJ2cnKVxuICAgIC5hdHRyKCdjbGFzcycsICdzcGgtc3BhcmtsaW5lLXBhdGhzJyk7XG5cbiAgcGF0aHMuYXBwZW5kKCdwYXRoJylcbiAgICAuYXR0cignY2xhc3MnLCAnc3BoLXNwYXJrbGluZS1wYXRoIHNwaC1zcGFya2xpbmUtcGF0aC1yZXN0Jyk7XG5cbiAgcGF0aHMuYXBwZW5kKCdwYXRoJylcbiAgICAuYXR0cignY2xhc3MnLCAnc3BoLXNwYXJrbGluZS1wYXRoIHNwaC1zcGFya2xpbmUtcGF0aC1kaWZmJyk7XG59XG5cblxuZnVuY3Rpb24gZHJhd0RvdChkb3QsIGZ4LCBmeSkge1xuICBkb3QuZW50ZXIoKS5hcHBlbmQoJ2NpcmNsZScpXG4gICAgLmF0dHIoJ2NsYXNzJywgJ3NwaC1zcGFya2xpbmUtZG90JylcbiAgICAuYXR0cigncicsIDQpO1xuXG4gIGRvdFxuICAgIC5hdHRyKCdjeCcsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGZ4KGQueCk7IH0pXG4gICAgLmF0dHIoJ2N5JywgZnVuY3Rpb24oZCkgeyByZXR1cm4gZnkoZC55KTsgfSk7XG5cbiAgZG90LmV4aXQoKS5yZW1vdmUoKTtcbn1cblxuXG5mdW5jdGlvbiBkcmF3U3VtbWFyeShzdW1tYXJ5LCBvcHRzKSB7XG4gIHN1bW1hcnlcbiAgICAuY2xhc3NlZCgnc3BoLXN1bW1hcnknLCB0cnVlKTtcblxuICBpZiAoc3VtbWFyeS5kYXR1bSgpLmxlbmd0aCA8IG9wdHMuc3VtbWFyeUxpbWl0KSB7XG4gICAgLy8gVE9ETyBzb21ldGhpbmcgYmV0dGVyIHRoYW4gdGhpc1xuICAgIHN1bW1hcnkuc3R5bGUoJ2hlaWdodCcsIDApO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIHN1bW1hcnlcbiAgICAuZmlsdGVyKHV0aWxzLmlzRW1wdHlOb2RlKVxuICAgIC5jYWxsKGluaXRTdW1tYXJ5KTtcblxuICBzdW1tYXJ5LnNlbGVjdCgnLnNwaC1zdW1tYXJ5LWRpZmYnKVxuICAgIC5kYXR1bShmdW5jdGlvbihkKSB7XG4gICAgICBkID0gZC5zbGljZSgtMik7XG4gICAgICByZXR1cm4gZFsxXS55IC0gZFswXS55O1xuICAgIH0pXG4gICAgLnRleHQob3B0cy5kaWZmRm9ybWF0KTtcblxuICBzdW1tYXJ5LnNlbGVjdCgnLnNwaC1zdW1tYXJ5LXRpbWUnKVxuICAgIC5kYXR1bShmdW5jdGlvbihkKSB7XG4gICAgICBkID0gZC5zbGljZSgtMik7XG5cbiAgICAgIHJldHVybiBbZFswXS54LCBkWzFdLnhdXG4gICAgICAgIC5tYXAodXRpbHMuZGF0ZSlcbiAgICAgICAgLm1hcChvcHRzLnhGb3JtYXQpO1xuICAgIH0pXG4gICAgLnRleHQoZnVuY3Rpb24oZCkge1xuICAgICAgcmV0dXJuIFsnIGZyb20nLCBkWzBdLCAndG8nLCBkWzFdXS5qb2luKCcgJyk7XG4gICAgfSk7XG59XG5cblxuZnVuY3Rpb24gaW5pdFN1bW1hcnkoc3VtbWFyeSkge1xuICBzdW1tYXJ5LmFwcGVuZCgnc3BhbicpXG4gICAgLmF0dHIoJ2NsYXNzJywgJ3NwaC1zdW1tYXJ5LWRpZmYnKTtcblxuICBzdW1tYXJ5LmFwcGVuZCgnc3BhbicpXG4gICAgLmF0dHIoJ2NsYXNzJywgJ3NwaC1zdW1tYXJ5LXRpbWUnKTtcbn1cblxuXG5mdW5jdGlvbiBub3JtYWxpemUoZWwsIG9wdHMpIHtcbiAgdmFyIG5vZGUgPSBlbC5ub2RlKCk7XG5cbiAgZWwuZGF0dW0oZnVuY3Rpb24oZCwgaSkge1xuICAgIHJldHVybiB7XG4gICAgICB0aXRsZTogb3B0cy50aXRsZS5jYWxsKG5vZGUsIGQsIGkpLFxuICAgICAgdmFsdWVzOiBvcHRzLnZhbHVlcy5jYWxsKG5vZGUsIGQsIGkpXG4gICAgICAgIC5tYXAodmFsdWUpXG4gICAgfTtcbiAgfSk7XG5cblxuICBmdW5jdGlvbiB2YWx1ZShkLCBpKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHg6IG9wdHMueC5jYWxsKG5vZGUsIGQsIGkpLFxuICAgICAgeTogb3B0cy55LmNhbGwobm9kZSwgZCwgaSlcbiAgICB9O1xuICB9XG59XG5cblxuZnVuY3Rpb24gZ2V0U3RhdHVzKHZhbHVlcykge1xuICB2YWx1ZXMgPSB2YWx1ZXMuc2xpY2UoLTIpO1xuXG4gIHZhciBkaWZmID0gdmFsdWVzLmxlbmd0aCA+IDFcbiAgICA/IHZhbHVlc1sxXS55IC0gdmFsdWVzWzBdLnlcbiAgICA6IDA7XG5cbiAgaWYgKGRpZmYgPiAwKSByZXR1cm4gJ3NwaC1pcy1zdGF0dXMtZ29vZCc7XG4gIGlmIChkaWZmIDwgMCkgcmV0dXJuICdzcGgtaXMtc3RhdHVzLWJhZCc7XG4gIHJldHVybiAnc3BoLWlzLXN0YXR1cy1uZXV0cmFsJztcbn1cbiIsInZhciB1dGlscyA9IHJlcXVpcmUoJy4uL3V0aWxzJyk7XG5cblxubW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKCcuL3dpZGdldCcpLmV4dGVuZCgpXG4gIC5wcm9wKCd0aXRsZScpXG4gIC5zZXQoZDMuZnVuY3RvcilcbiAgLmRlZmF1bHQoZnVuY3Rpb24oZCkgeyByZXR1cm4gZC50aXRsZTsgfSlcblxuICAucHJvcCgnbWV0cmljcycpXG4gIC5zZXQoZDMuZnVuY3RvcilcbiAgLmRlZmF1bHQoZnVuY3Rpb24oZCkgeyByZXR1cm4gZC5tZXRyaWNzOyB9KVxuXG4gIC5wcm9wKCdrZXknKVxuICAuc2V0KGQzLmZ1bmN0b3IpXG4gIC5kZWZhdWx0KGZ1bmN0aW9uKGQsIGkpIHsgcmV0dXJuIGk7IH0pXG5cbiAgLnByb3AoJ21ldHJpY1RpdGxlJylcbiAgLnNldChkMy5mdW5jdG9yKVxuICAuZGVmYXVsdChmdW5jdGlvbihkKSB7IHJldHVybiBkLnRpdGxlOyB9KVxuXG4gIC5wcm9wKCd2YWx1ZXMnKVxuICAuc2V0KGQzLmZ1bmN0b3IpXG4gIC5kZWZhdWx0KGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQudmFsdWVzOyB9KVxuXG4gIC5wcm9wKCd4JylcbiAgLnNldChkMy5mdW5jdG9yKVxuICAuZGVmYXVsdChmdW5jdGlvbihkKSB7IHJldHVybiBkLng7IH0pXG5cbiAgLnByb3AoJ3knKVxuICAuc2V0KGQzLmZ1bmN0b3IpXG4gIC5kZWZhdWx0KGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQueTsgfSlcblxuICAucHJvcCgneFRpY2tGb3JtYXQnKVxuICAuZGVmYXVsdChudWxsKVxuXG4gIC5wcm9wKCd4VGlja3MnKVxuICAuZGVmYXVsdCg4KVxuXG4gIC5wcm9wKCd5Rm9ybWF0JylcbiAgLmRlZmF1bHQoZDMuZm9ybWF0KCcsMnMnKSlcblxuICAucHJvcCgneVRpY2tzJylcbiAgLmRlZmF1bHQoNSlcblxuICAucHJvcCgneVRpY2tGb3JtYXQnKVxuICAuZGVmYXVsdChkMy5mb3JtYXQoJ3MnKSlcblxuICAucHJvcCgneU1pbicpXG4gIC5zZXQoZDMuZnVuY3RvcilcbiAgLmRlZmF1bHQoZDMubWluKVxuXG4gIC5wcm9wKCd5TWF4JylcbiAgLnNldChkMy5mdW5jdG9yKVxuICAuZGVmYXVsdChkMy5tYXgpXG5cbiAgLnByb3AoJ25vbmUnKVxuICAuZGVmYXVsdCgwKVxuXG4gIC5wcm9wKCdjaGFydE1hcmdpbicpXG4gIC5kZWZhdWx0KHtcbiAgICB0b3A6IDEwLFxuICAgIGxlZnQ6IDM1LFxuICAgIHJpZ2h0OiA1LFxuICAgIGJvdHRvbTogMjBcbiAgfSlcblxuICAucHJvcCgnY29sb3JzJylcbiAgLnByb3AoJ2NoYXJ0JylcbiAgLnByb3AoJ2xlZ2VuZCcpXG5cbiAgLmluaXQoZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5jb2xvcnMoZDMuc2NhbGUuY2F0ZWdvcnkxMCgpKTtcbiAgfSlcblxuICAuZHJhdyhmdW5jdGlvbihlbCkge1xuICAgIHZhciBvcHRzID0gdGhpcy5wcm9wcygpO1xuICAgIG5vcm1hbGl6ZShlbCwgb3B0cyk7XG4gICAgZHJhd1dpZGdldChlbCwgb3B0cyk7XG4gIH0pO1xuXG5cbmZ1bmN0aW9uIGRyYXdXaWRnZXQoZWwsIG9wdHMpIHtcbiAgZWwuY2xhc3NlZCgnc3BoLXdpZGdldCBzcGgtbGluZXMnLCB0cnVlKTtcblxuICBpZiAoIW9wdHMuZXhwbGljaXRDb21wb25lbnRzKSBpbml0Q29tcG9uZW50cyhlbCk7XG5cbiAgdmFyIGNvbXBvbmVudCA9IGVsLnNlbGVjdCgnW2RhdGEtd2lkZ2V0LWNvbXBvbmVudD1cInRpdGxlXCJdJyk7XG4gIGlmIChjb21wb25lbnQuc2l6ZSgpKSBjb21wb25lbnQuY2FsbChkcmF3VGl0bGUpO1xuXG4gIGNvbXBvbmVudCA9IGVsLnNlbGVjdCgnW2RhdGEtd2lkZ2V0LWNvbXBvbmVudD1cImNoYXJ0XCJdJyk7XG4gIGlmIChjb21wb25lbnQuc2l6ZSgpKSBjb21wb25lbnQuZGF0dW0oZ2V0TWV0cmljcykuY2FsbChkcmF3Q2hhcnQsIG9wdHMpO1xuXG4gIGNvbXBvbmVudCA9IGVsLnNlbGVjdCgnW2RhdGEtd2lkZ2V0LWNvbXBvbmVudD1cImxlZ2VuZFwiXScpO1xuICBpZiAoY29tcG9uZW50LnNpemUoKSkgY29tcG9uZW50LmRhdHVtKGdldE1ldHJpY3MpLmNhbGwoZHJhd0xlZ2VuZCwgb3B0cyk7XG59XG5cblxuZnVuY3Rpb24gaW5pdENvbXBvbmVudHMoZWwpIHtcbiAgZWwuYXBwZW5kKCdkaXYnKVxuICAgIC5hdHRyKCdkYXRhLXdpZGdldC1jb21wb25lbnQnLCAndGl0bGUnKTtcblxuICBlbC5hcHBlbmQoJ2RpdicpXG4gICAgLmF0dHIoJ2RhdGEtd2lkZ2V0LWNvbXBvbmVudCcsICdjaGFydCcpO1xuXG4gIGVsLmFwcGVuZCgnZGl2JylcbiAgICAuYXR0cignZGF0YS13aWRnZXQtY29tcG9uZW50JywgJ2xlZ2VuZCcpO1xufVxuXG5cbmZ1bmN0aW9uIGRyYXdUaXRsZSh0aXRsZSkge1xuICB0aXRsZVxuICAgIC5jbGFzc2VkKCdzcGgtdGl0bGUnLCB0cnVlKVxuICAgIC50ZXh0KGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQudGl0bGU7IH0pO1xufVxuXG5cbmZ1bmN0aW9uIGRyYXdDaGFydChjaGFydCwgb3B0cykge1xuICBjaGFydFxuICAgIC5jbGFzc2VkKCdzcGgtY2hhcnQgc3BoLWNoYXJ0LWxpbmVzJywgdHJ1ZSk7XG5cbiAgdmFyIGRpbXMgPSB1dGlscy5ib3goKVxuICAgIC5tYXJnaW4ob3B0cy5jaGFydE1hcmdpbilcbiAgICAud2lkdGgodXRpbHMuaW5uZXJXaWR0aChjaGFydCkpXG4gICAgLmhlaWdodCh1dGlscy5pbm5lckhlaWdodChjaGFydCkpXG4gICAgLmNhbGMoKTtcblxuICB2YXIgYWxsVmFsdWVzID0gY2hhcnRcbiAgICAuZGF0dW0oKVxuICAgIC5yZWR1Y2UoZnVuY3Rpb24ocmVzdWx0cywgbWV0cmljKSB7XG4gICAgICByZXN1bHRzLnB1c2guYXBwbHkocmVzdWx0cywgbWV0cmljLnZhbHVlcyk7XG4gICAgICByZXR1cm4gcmVzdWx0cztcbiAgICB9LCBbXSk7XG5cbiAgdmFyIGZ4ID0gZDMudGltZS5zY2FsZSgpXG4gICAgLmRvbWFpbihkMy5leHRlbnQoYWxsVmFsdWVzLCBmdW5jdGlvbihkKSB7IHJldHVybiBkLng7IH0pKVxuICAgIC5yYW5nZShbMCwgZGltcy5pbm5lcldpZHRoXSk7XG5cbiAgdmFyIHlzID0gYWxsVmFsdWVzXG4gICAgLm1hcChmdW5jdGlvbihkKSB7IHJldHVybiBkLnk7IH0pO1xuXG4gIHZhciBmeSA9IGQzLnNjYWxlLmxpbmVhcigpXG4gICAgLmRvbWFpbihbb3B0cy55TWluKHlzKSwgb3B0cy55TWF4KHlzKV0pXG4gICAgLnJhbmdlKFtkaW1zLmlubmVySGVpZ2h0LCAwXSk7XG5cbiAgY2hhcnRcbiAgICAuZmlsdGVyKHV0aWxzLmlzRW1wdHlOb2RlKVxuICAgIC5jYWxsKGluaXRDaGFydCk7XG5cbiAgY2hhcnQuc2VsZWN0KCdzdmcnKVxuICAgIC5jYWxsKGRyYXdTdmcsIGRpbXMsIGZ4LCBmeSwgb3B0cyk7XG59XG5cblxuZnVuY3Rpb24gaW5pdENoYXJ0KGNoYXJ0KSB7XG4gIHZhciBzdmcgPSBjaGFydC5hcHBlbmQoJ3N2ZycpXG4gICAgLmFwcGVuZCgnZycpO1xuXG4gIHN2Zy5hcHBlbmQoJ2cnKVxuICAgIC5hdHRyKCdjbGFzcycsICdzcGgtYXhpcyBzcGgtYXhpcy1saW5lcyBzcGgtYXhpcy1saW5lcy14Jyk7XG5cbiAgc3ZnLmFwcGVuZCgnZycpXG4gICAgLmF0dHIoJ2NsYXNzJywgJ3NwaC1heGlzIHNwaC1heGlzLWxpbmVzIHNwaC1heGlzLWxpbmVzLXknKTtcblxuICBzdmcuYXBwZW5kKCdnJylcbiAgICAuYXR0cignY2xhc3MnLCAnc3BoLWxpbmVzLW1ldHJpY3MnKTtcbn1cblxuXG5mdW5jdGlvbiBkcmF3U3ZnKHN2ZywgZGltcywgZngsIGZ5LCBvcHRzKSB7XG4gIHN2Z1xuICAgIC5hdHRyKCd3aWR0aCcsIGRpbXMud2lkdGgpXG4gICAgLmF0dHIoJ2hlaWdodCcsIGRpbXMuaGVpZ2h0KVxuICAgIC5zZWxlY3QoJ2cnKVxuICAgICAgLmF0dHIoJ3RyYW5zZm9ybScsIHV0aWxzLnRyYW5zbGF0ZShkaW1zLm1hcmdpbi5sZWZ0LCBkaW1zLm1hcmdpbi50b3ApKTtcblxuICBzdmcuc2VsZWN0KCcuc3BoLWxpbmVzLW1ldHJpY3MnKVxuICAgIC5jYWxsKGRyYXdDaGFydE1ldHJpY3MsIGZ4LCBmeSk7XG5cbiAgc3ZnLnNlbGVjdCgnLnNwaC1heGlzLWxpbmVzLXgnKVxuICAgIC5jYWxsKGRyYXdYQXhpcywgZGltcywgZngsIG9wdHMpO1xuXG4gIHN2Zy5zZWxlY3QoJy5zcGgtYXhpcy1saW5lcy15JylcbiAgICAuY2FsbChkcmF3WUF4aXMsIGRpbXMsIGZ5LCBvcHRzKTtcbn1cblxuXG5mdW5jdGlvbiBkcmF3Q2hhcnRNZXRyaWNzKG1ldHJpY3MsIGZ4LCBmeSkge1xuICB2YXIgbGluZSA9IGQzLnN2Zy5saW5lKClcbiAgICAueChmdW5jdGlvbihkKSB7IHJldHVybiBmeChkLngpOyB9KVxuICAgIC55KGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGZ5KGQueSk7IH0pO1xuXG4gIG1ldHJpY3Muc2VsZWN0QWxsKCcuc3BoLWxpbmVzLW1ldHJpYycpXG4gICAgLmRhdGEoZnVuY3Rpb24oZCkgeyByZXR1cm4gZDsgfSxcbiAgICAgICAgICBmdW5jdGlvbihkKSB7IHJldHVybiBkLmtleTsgfSlcbiAgICAuY2FsbChkcmF3Q2hhcnRNZXRyaWMsIGZ4LCBmeSwgbGluZSk7XG59XG5cblxuZnVuY3Rpb24gZHJhd0NoYXJ0TWV0cmljKG1ldHJpYywgZngsIGZ5LCBsaW5lKSB7XG4gIG1ldHJpYy5lbnRlcigpLmFwcGVuZCgnZycpXG4gICAgLmF0dHIoJ2NsYXNzJywgJ3NwaC1saW5lcy1tZXRyaWMnKVxuICAgIC5hdHRyKCdkYXRhLWtleScsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQua2V5OyB9KVxuICAgIC5hcHBlbmQoJ3BhdGgnKVxuICAgICAgLmF0dHIoJ2NsYXNzJywgJ3NwaC1saW5lcy1saW5lJyk7XG5cbiAgbWV0cmljLnNlbGVjdCgnLnNwaC1saW5lcy1saW5lJylcbiAgICAuYXR0cignc3Ryb2tlJywgZnVuY3Rpb24oZCkgeyByZXR1cm4gZC5jb2xvcjsgfSlcbiAgICAuYXR0cignZCcsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGxpbmUoZC52YWx1ZXMpOyB9KTtcblxuICBtZXRyaWMuZXhpdCgpXG4gICAgLnJlbW92ZSgpO1xuXG4gIG1ldHJpYy5zZWxlY3RBbGwoJy5zcGgtbGluZXMtZG90JylcbiAgICAuZGF0YShmdW5jdGlvbihkKSB7XG4gICAgICBpZiAoIWQudmFsdWVzLmxlbmd0aCkgeyByZXR1cm4gW107IH1cbiAgICAgIHZhciBsYXN0ID0gZC52YWx1ZXNbZC52YWx1ZXMubGVuZ3RoIC0gMV07XG5cbiAgICAgIHJldHVybiBbe1xuICAgICAgICB4OiBsYXN0LngsXG4gICAgICAgIHk6IGxhc3QueSxcbiAgICAgICAgY29sb3I6IGQuY29sb3JcbiAgICAgIH1dO1xuICAgIH0pXG4gICAgLmNhbGwoZHJhd0RvdCwgZngsIGZ5KTtcbn1cblxuXG5mdW5jdGlvbiBkcmF3RG90KGRvdCwgZngsIGZ5KSB7XG4gIGRvdC5lbnRlcigpLmFwcGVuZCgnY2lyY2xlJylcbiAgICAuYXR0cignY2xhc3MnLCAnc3BoLWxpbmVzLWRvdCcpXG4gICAgLmF0dHIoJ3InLCA0KTtcblxuICBkb3RcbiAgICAuYXR0cignZmlsbCcsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQuY29sb3I7IH0pXG4gICAgLmF0dHIoJ2N4JywgZnVuY3Rpb24oZCkgeyByZXR1cm4gZngoZC54KTsgfSlcbiAgICAuYXR0cignY3knLCBmdW5jdGlvbihkKSB7IHJldHVybiBmeShkLnkpOyB9KTtcblxuICBkb3QuZXhpdCgpXG4gICAgLnJlbW92ZSgpO1xufVxuXG5cbmZ1bmN0aW9uIGRyYXdYQXhpcyhheGlzLCBkaW1zLCBmeCwgb3B0cykge1xuICBheGlzXG4gICAgLmF0dHIoJ3RyYW5zZm9ybScsIHV0aWxzLnRyYW5zbGF0ZSgwLCBkaW1zLmlubmVySGVpZ2h0KSlcbiAgICAuY2FsbChkMy5zdmcuYXhpcygpXG4gICAgICAuc2NhbGUoZngpXG4gICAgICAudGlja1BhZGRpbmcoOClcbiAgICAgIC50aWNrcyhvcHRzLnhUaWNrcylcbiAgICAgIC50aWNrRm9ybWF0KG9wdHMueFRpY2tGb3JtYXQpXG4gICAgICAudGlja1NpemUoLWRpbXMuaW5uZXJIZWlnaHQpKTtcbn1cblxuXG5mdW5jdGlvbiBkcmF3WUF4aXMoYXhpcywgZGltcywgZnksIG9wdHMpIHtcbiAgYXhpcy5jYWxsKGQzLnN2Zy5heGlzKClcbiAgICAub3JpZW50KCdsZWZ0JylcbiAgICAuc2NhbGUoZnkpXG4gICAgLnRpY2tQYWRkaW5nKDgpXG4gICAgLnRpY2tzKG9wdHMueVRpY2tzKVxuICAgIC50aWNrRm9ybWF0KG9wdHMueVRpY2tGb3JtYXQpXG4gICAgLnRpY2tTaXplKC1kaW1zLmlubmVyV2lkdGgpKTtcbn1cblxuXG5mdW5jdGlvbiBkcmF3TGVnZW5kKGxlZ2VuZCwgb3B0cykge1xuICBsZWdlbmRcbiAgICAuZmlsdGVyKHV0aWxzLmlzRW1wdHlOb2RlKVxuICAgIC5jYWxsKGluaXRMZWdlbmQpO1xuXG4gIGxlZ2VuZC5zZWxlY3QoJy5zcGgtdGFibGUtbGluZXMnKS5zZWxlY3RBbGwoJy5zcGgtcm93LWxpbmVzLW1ldHJpYycpXG4gICAgLmRhdGEoZnVuY3Rpb24oZCkgeyByZXR1cm4gZDsgfSxcbiAgICAgICAgICBmdW5jdGlvbihkKSB7IHJldHVybiBkLmtleTsgfSlcbiAgICAuY2FsbChkcmF3TGVnZW5kTWV0cmljLCBvcHRzKTtcbn1cblxuXG5mdW5jdGlvbiBpbml0TGVnZW5kKGxlZ2VuZCkge1xuICBsZWdlbmQuYXBwZW5kKCd0YWJsZScpXG4gICAgLmNsYXNzZWQoJ3NwaC10YWJsZSBzcGgtdGFibGUtbGluZXMnLCB0cnVlKTtcbn1cblxuXG5mdW5jdGlvbiBkcmF3TGVnZW5kTWV0cmljKG1ldHJpYywgb3B0cykge1xuICB2YXIgbm9uZSA9IG9wdHMueUZvcm1hdChvcHRzLm5vbmUpO1xuXG4gIG1ldHJpYy5lbnRlcigpLmFwcGVuZCgndHInKVxuICAgIC5jYWxsKGVudGVyTGVnZW5kTWV0cmljKTtcblxuICBtZXRyaWMuc2VsZWN0KCcuc3BoLWNvbC1zd2F0Y2gnKVxuICAgIC5zdHlsZSgnYmFja2dyb3VuZCcsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQuY29sb3I7IH0pO1xuXG4gIG1ldHJpYy5zZWxlY3QoJy5zcGgtY29sLWxpbmVzLXRpdGxlJylcbiAgICAudGV4dChmdW5jdGlvbihkKSB7IHJldHVybiBkLnRpdGxlOyB9KTtcblxuICBtZXRyaWMuc2VsZWN0KCcuc3BoLWNvbC1saW5lcy12YWx1ZScpXG4gICAgLnRleHQoZnVuY3Rpb24oZCkge1xuICAgICAgZCA9IGQudmFsdWVzW2QudmFsdWVzLmxlbmd0aCAtIDFdO1xuXG4gICAgICByZXR1cm4gZFxuICAgICAgICA/IG9wdHMueUZvcm1hdChkLnkpXG4gICAgICAgIDogbm9uZTtcbiAgICB9KTtcblxuICBtZXRyaWMuZXhpdCgpXG4gICAgLnJlbW92ZSgpO1xufVxuXG5cbmZ1bmN0aW9uIGVudGVyTGVnZW5kTWV0cmljKG1ldHJpYykge1xuICBtZXRyaWNcbiAgICAuYXR0cignZGF0YS1rZXknLCBmdW5jdGlvbihkKSB7IHJldHVybiBkLmtleTsgfSlcbiAgICAuYXR0cignY2xhc3MnLCAnc3BoLXJvdy1saW5lcy1tZXRyaWMnKTtcblxuICBtZXRyaWMuYXBwZW5kKCd0ZCcpXG4gICAgLmF0dHIoJ2NsYXNzJywgJ3NwaC1jb2wtc3dhdGNoJyk7XG5cbiAgbWV0cmljLmFwcGVuZCgndGQnKVxuICAgIC5hdHRyKCdjbGFzcycsICdzcGgtY29sLWxpbmVzLXRpdGxlJyk7XG5cbiAgbWV0cmljLmFwcGVuZCgndGQnKVxuICAgIC5hdHRyKCdjbGFzcycsICdzcGgtY29sLWxpbmVzLXZhbHVlJyk7XG59XG5cblxuZnVuY3Rpb24gbm9ybWFsaXplKGVsLCBvcHRzKSB7XG4gIHZhciBub2RlID0gZWwubm9kZSgpO1xuXG4gIGVsLmRhdHVtKGZ1bmN0aW9uKGQsIGkpIHtcbiAgICB2YXIgdGl0bGUgPSBvcHRzLnRpdGxlLmNhbGwobm9kZSwgZCwgaSk7XG5cbiAgICByZXR1cm4ge1xuICAgICAgdGl0bGU6IHRpdGxlLFxuICAgICAgbWV0cmljczogb3B0cy5tZXRyaWNzLmNhbGwobm9kZSwgZCwgaSkubWFwKG1ldHJpYylcbiAgICB9O1xuICB9KTtcblxuICBmdW5jdGlvbiBtZXRyaWMoZCwgaSkge1xuICAgIHZhciBrZXkgPSBvcHRzLmtleVxuICAgICAgLmNhbGwobm9kZSwgZCwgaSlcbiAgICAgIC50b1N0cmluZygpO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIGtleToga2V5LFxuICAgICAgY29sb3I6IG9wdHMuY29sb3JzKGtleSksXG4gICAgICB0aXRsZTogb3B0cy5tZXRyaWNUaXRsZS5jYWxsKG5vZGUsIGQsIGkpLFxuICAgICAgdmFsdWVzOiBvcHRzLnZhbHVlcy5jYWxsKG5vZGUsIGQsIGkpLm1hcCh2YWx1ZSlcbiAgICB9O1xuICB9XG5cbiAgZnVuY3Rpb24gdmFsdWUoZCwgaSkge1xuICAgIHJldHVybiB7XG4gICAgICB4OiBvcHRzLnguY2FsbChub2RlLCBkLCBpKSxcbiAgICAgIHk6IG9wdHMueS5jYWxsKG5vZGUsIGQsIGkpXG4gICAgfTtcbiAgfVxufVxuXG5cbmZ1bmN0aW9uIGdldE1ldHJpY3MoZCkge1xuICByZXR1cm4gZC5tZXRyaWNzO1xufVxuIiwidmFyIHV0aWxzID0gcmVxdWlyZSgnLi4vdXRpbHMnKTtcblxuXG5tb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoJy4vd2lkZ2V0JykuZXh0ZW5kKClcbiAgLnByb3AoJ2NvbG9ycycpXG5cbiAgLnByb3AoJ3RpdGxlJylcbiAgLnNldChkMy5mdW5jdG9yKVxuICAuZGVmYXVsdChmdW5jdGlvbihkKSB7IHJldHVybiBkLnRpdGxlOyB9KVxuXG4gIC5wcm9wKCdtZXRyaWNzJylcbiAgLnNldChkMy5mdW5jdG9yKVxuICAuZGVmYXVsdChmdW5jdGlvbihkKSB7IHJldHVybiBkLm1ldHJpY3M7IH0pXG5cbiAgLnByb3AoJ2tleScpXG4gIC5zZXQoZDMuZnVuY3RvcilcbiAgLmRlZmF1bHQoZnVuY3Rpb24oZCwgaSkgeyByZXR1cm4gaTsgfSlcblxuICAucHJvcCgnbWV0cmljVGl0bGUnKVxuICAuc2V0KGQzLmZ1bmN0b3IpXG4gIC5kZWZhdWx0KGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQudGl0bGU7IH0pXG5cbiAgLnByb3AoJ3ZhbHVlJylcbiAgLnNldChkMy5mdW5jdG9yKVxuICAuZGVmYXVsdChmdW5jdGlvbihkKSB7IHJldHVybiBkLnZhbHVlOyB9KVxuXG4gIC5wcm9wKCdjaGFydE1hcmdpbicpXG4gIC5kZWZhdWx0KHtcbiAgICB0b3A6IDIwLFxuICAgIGxlZnQ6IDIwLFxuICAgIHJpZ2h0OiAyMCxcbiAgICBib3R0b206IDIwXG4gIH0pXG5cbiAgLnByb3AoJ2lubmVyUmFkaXVzJylcbiAgLnNldChkMy5mdW5jdG9yKVxuICAuZGVmYXVsdCgwKVxuXG4gIC5wcm9wKCd2YWx1ZUZvcm1hdCcpXG4gIC5kZWZhdWx0KGQzLmZvcm1hdCgnLDJzJykpXG5cbiAgLnByb3AoJ3BlcmNlbnRGb3JtYXQnKVxuICAuZGVmYXVsdChkMy5mb3JtYXQoJy4wJScpKVxuXG4gIC5pbml0KGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuY29sb3JzKGQzLnNjYWxlLmNhdGVnb3J5MTAoKSk7XG4gIH0pXG5cbiAgLmRyYXcoZnVuY3Rpb24oZWwpIHtcbiAgICB2YXIgb3B0cyA9IHRoaXMucHJvcHMoKTtcbiAgICBub3JtYWxpemUoZWwsIG9wdHMpO1xuICAgIGRyYXdXaWRnZXQoZWwsIG9wdHMpO1xuICB9KTtcblxuXG5mdW5jdGlvbiBkcmF3V2lkZ2V0KGVsLCBvcHRzKSB7XG4gIGVsLmNsYXNzZWQoJ3NwaC13aWRnZXQgc3BoLXBpZScsIHRydWUpO1xuXG4gIGlmICghb3B0cy5leHBsaWNpdENvbXBvbmVudHMpIGluaXRDb21wb25lbnRzKGVsKTtcblxuICB2YXIgY29tcG9uZW50ID0gZWwuc2VsZWN0KCdbZGF0YS13aWRnZXQtY29tcG9uZW50PVwidGl0bGVcIl0nKTtcbiAgaWYgKGNvbXBvbmVudC5zaXplKCkpIGNvbXBvbmVudC5jYWxsKGRyYXdUaXRsZSk7XG5cbiAgY29tcG9uZW50ID0gZWwuc2VsZWN0KCdbZGF0YS13aWRnZXQtY29tcG9uZW50PVwiY2hhcnRcIl0nKTtcbiAgaWYgKGNvbXBvbmVudC5zaXplKCkpIGNvbXBvbmVudC5kYXR1bShnZXRNZXRyaWNzKS5jYWxsKGRyYXdDaGFydCwgb3B0cyk7XG5cbiAgY29tcG9uZW50ID0gZWwuc2VsZWN0KCdbZGF0YS13aWRnZXQtY29tcG9uZW50PVwibGVnZW5kXCJdJyk7XG4gIGlmIChjb21wb25lbnQuc2l6ZSgpKSBjb21wb25lbnQuZGF0dW0oZ2V0TWV0cmljcykuY2FsbChkcmF3TGVnZW5kLCBvcHRzKTtcbn1cblxuXG5mdW5jdGlvbiBpbml0Q29tcG9uZW50cyhlbCkge1xuICBlbC5hcHBlbmQoJ2RpdicpXG4gICAgLmF0dHIoJ2RhdGEtd2lkZ2V0LWNvbXBvbmVudCcsICd0aXRsZScpO1xuXG4gIGVsLmFwcGVuZCgnZGl2JylcbiAgICAuYXR0cignZGF0YS13aWRnZXQtY29tcG9uZW50JywgJ2NoYXJ0Jyk7XG5cbiAgZWwuYXBwZW5kKCdkaXYnKVxuICAgIC5hdHRyKCdkYXRhLXdpZGdldC1jb21wb25lbnQnLCAnbGVnZW5kJyk7XG59XG5cblxuZnVuY3Rpb24gZHJhd1RpdGxlKHRpdGxlKSB7XG4gIHRpdGxlXG4gICAgLmNsYXNzZWQoJ3NwaC10aXRsZScsIHRydWUpXG4gICAgLnRleHQoZnVuY3Rpb24oZCkgeyByZXR1cm4gZC50aXRsZTsgfSk7XG59XG5cblxuZnVuY3Rpb24gZHJhd0NoYXJ0KGNoYXJ0LCBvcHRzKSB7XG4gIGNoYXJ0XG4gICAgLmNsYXNzZWQoJ3NwaC1jaGFydCBzcGgtY2hhcnQtcGllJywgdHJ1ZSk7XG5cbiAgY2hhcnRcbiAgICAuZmlsdGVyKHV0aWxzLmlzRW1wdHlOb2RlKVxuICAgIC5jYWxsKGluaXRDaGFydCk7XG5cbiAgdmFyIGRpbXMgPSB1dGlscy5ib3goKVxuICAgIC5tYXJnaW4ob3B0cy5jaGFydE1hcmdpbilcbiAgICAud2lkdGgodXRpbHMuaW5uZXJXaWR0aChjaGFydCkpXG4gICAgLmhlaWdodCh1dGlscy5pbm5lckhlaWdodChjaGFydCkpXG4gICAgLmNhbGMoKTtcblxuICBkaW1zLnJhZGl1cyA9IE1hdGgubWluKGRpbXMuaW5uZXJXaWR0aCwgZGltcy5pbm5lckhlaWdodCkgLyAyO1xuXG4gIGNoYXJ0LnNlbGVjdCgnc3ZnJylcbiAgICAuY2FsbChkcmF3U3ZnLCBkaW1zLCBvcHRzKTtcbn1cblxuXG5mdW5jdGlvbiBpbml0Q2hhcnQoY2hhcnQpIHtcbiAgY2hhcnQuYXBwZW5kKCdzdmcnKVxuICAgIC5hcHBlbmQoJ2cnKTtcbn1cblxuXG5mdW5jdGlvbiBkcmF3U3ZnKHN2ZywgZGltcywgb3B0cykge1xuICBzdmdcbiAgICAuYXR0cignd2lkdGgnLCBkaW1zLndpZHRoKVxuICAgIC5hdHRyKCdoZWlnaHQnLCBkaW1zLmhlaWdodClcbiAgICAuc2VsZWN0KCdnJylcbiAgICAgIC5hdHRyKCd0cmFuc2Zvcm0nLCB1dGlscy50cmFuc2xhdGUoXG4gICAgICAgIChkaW1zLndpZHRoIC8gMikgLSBkaW1zLnJhZGl1cyxcbiAgICAgICAgKGRpbXMuaGVpZ2h0IC8gMikgLSBkaW1zLnJhZGl1cykpXG4gICAgICAuY2FsbChkcmF3U2xpY2VzLCBkaW1zLCBvcHRzKTtcbn1cblxuXG5mdW5jdGlvbiBkcmF3U2xpY2VzKHN2ZywgZGltcywgb3B0cykge1xuICB2YXIgYXJjID0gZDMuc3ZnLmFyYygpXG4gICAgLmlubmVyUmFkaXVzKG9wdHMuaW5uZXJSYWRpdXMoZGltcy5yYWRpdXMpKVxuICAgIC5vdXRlclJhZGl1cyhkaW1zLnJhZGl1cyk7XG5cbiAgdmFyIGxheW91dCA9IGQzLmxheW91dC5waWUoKVxuICAgIC52YWx1ZShmdW5jdGlvbihkKSB7IHJldHVybiBkLnZhbHVlOyB9KTtcblxuICBzdmcuc2VsZWN0QWxsKCcuc3BoLXBpZS1zbGljZScpXG4gICAgLmRhdGEoZnVuY3Rpb24oZCkgeyByZXR1cm4gbGF5b3V0KGQpOyB9LFxuICAgICAgICAgIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQuZGF0YS5rZXk7IH0pXG4gICAgLmNhbGwoZHJhd1NsaWNlLCBkaW1zLCBhcmMsIG9wdHMpO1xufVxuXG5cbmZ1bmN0aW9uIGRyYXdTbGljZShzbGljZSwgZGltcywgYXJjLCBvcHRzKSB7XG4gIHNsaWNlLmVudGVyKCkuYXBwZW5kKCdnJylcbiAgICAuYXR0cignY2xhc3MnLCAnc3BoLXBpZS1zbGljZScpXG4gICAgLmFwcGVuZCgncGF0aCcpO1xuXG4gIHNsaWNlXG4gICAgLmF0dHIoJ3RyYW5zZm9ybScsIHV0aWxzLnRyYW5zbGF0ZShkaW1zLnJhZGl1cywgZGltcy5yYWRpdXMpKTtcblxuICBzbGljZS5zZWxlY3QoJ3BhdGgnKVxuICAgIC5hdHRyKCdkJywgYXJjKVxuICAgIC5zdHlsZSgnZmlsbCcsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQuZGF0YS5jb2xvcjsgfSk7XG5cbiAgc2xpY2UuZXhpdCgpXG4gICAgLnJlbW92ZSgpO1xufVxuXG5cbmZ1bmN0aW9uIGRyYXdMZWdlbmQobGVnZW5kLCBvcHRzKSB7XG4gIGxlZ2VuZFxuICAgIC5maWx0ZXIodXRpbHMuaXNFbXB0eU5vZGUpXG4gICAgLmNhbGwoaW5pdExlZ2VuZCk7XG5cbiAgdmFyIHRhYmxlID0gbGVnZW5kLnNlbGVjdCgnLnNwaC10YWJsZS1waWUnKTtcblxuICB0YWJsZS5zZWxlY3RBbGwoJy5zcGgtcm93LXBpZS1tZXRyaWMnKVxuICAgIC5kYXRhKGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQ7IH0sXG4gICAgICAgICAgZnVuY3Rpb24oZCkgeyByZXR1cm4gZC5rZXk7IH0pXG4gICAgLmNhbGwoZHJhd0xlZ2VuZE1ldHJpYywgb3B0cyk7XG5cbiAgdGFibGVcbiAgICAuZGF0dW0oZnVuY3Rpb24oZCkgeyByZXR1cm4gZDsgfSlcbiAgICAuY2FsbChkcmF3TGVnZW5kVG90YWwsIG9wdHMpO1xufVxuXG5cbmZ1bmN0aW9uIGluaXRMZWdlbmQobGVnZW5kKSB7XG4gIHZhciB0YWJsZSA9IGxlZ2VuZC5hcHBlbmQoJ3RhYmxlJylcbiAgICAuYXR0cignY2xhc3MnLCAnc3BoLXRhYmxlIHNwaC10YWJsZS1waWUnKTtcblxuICB2YXIgdGZvb3QgPSB0YWJsZVxuICAgIC5hcHBlbmQoJ3RyJylcbiAgICAuYXR0cignY2xhc3MnLCAnc3BoLXJvdy10Zm9vdCcpO1xuXG4gIHRmb290LmFwcGVuZCgndGQnKVxuICAgIC5hdHRyKCdjbGFzcycsICdzcGgtY29sLXN3YXRjaCBzcGgtY29sLW5vbmUnKTtcblxuICB0Zm9vdC5hcHBlbmQoJ3RkJylcbiAgICAuYXR0cignY2xhc3MnLCAnc3BoLWNvbC1waWUtdGl0bGUnKVxuICAgIC50ZXh0KCdUb3RhbCcpO1xuXG4gIHRmb290LmFwcGVuZCgndGQnKVxuICAgIC5hdHRyKCdjbGFzcycsICdzcGgtY29sLXBpZS1wZXJjZW50JylcbiAgICAudGV4dCgnMTAwJScpO1xuXG4gIHRmb290LmFwcGVuZCgndGQnKVxuICAgIC5hdHRyKCdjbGFzcycsICdzcGgtY29sLXBpZS12YWx1ZSBzcGgtY29sLXBpZS12YWx1ZS10b3RhbCcpO1xufVxuXG5cbmZ1bmN0aW9uIGRyYXdMZWdlbmRNZXRyaWMobWV0cmljLCBvcHRzKSB7XG4gIG1ldHJpYy5lbnRlcigpLmluc2VydCgndHInLCAnLnNwaC1yb3ctdGZvb3QnKVxuICAgIC5jYWxsKGVudGVyTGVnZW5kTWV0cmljKTtcblxuICBtZXRyaWMuc2VsZWN0KCcuc3BoLWNvbC1zd2F0Y2gnKVxuICAgIC5zdHlsZSgnYmFja2dyb3VuZCcsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQuY29sb3I7IH0pO1xuXG4gIG1ldHJpYy5zZWxlY3QoJy5zcGgtY29sLXBpZS10aXRsZScpXG4gICAgLnRleHQoZnVuY3Rpb24oZCkgeyByZXR1cm4gZC50aXRsZTsgfSk7XG5cbiAgbWV0cmljLnNlbGVjdCgnLnNwaC1jb2wtcGllLXBlcmNlbnQnKVxuICAgIC50ZXh0KGZ1bmN0aW9uKGQpIHsgcmV0dXJuIG9wdHMucGVyY2VudEZvcm1hdChkLnBlcmNlbnQpOyB9KTtcblxuICBtZXRyaWMuc2VsZWN0KCcuc3BoLWNvbC1waWUtdmFsdWUnKVxuICAgIC50ZXh0KGZ1bmN0aW9uKGQpIHsgcmV0dXJuIG9wdHMudmFsdWVGb3JtYXQoZC52YWx1ZSk7IH0pO1xuXG4gIG1ldHJpYy5leGl0KClcbiAgICAucmVtb3ZlKCk7XG59XG5cblxuZnVuY3Rpb24gZHJhd0xlZ2VuZFRvdGFsKHRmb290LCBvcHRzKSB7XG4gIHRmb290LnNlbGVjdCgnLnNwaC1jb2wtcGllLXZhbHVlLXRvdGFsJylcbiAgICAuZGF0dW0oZnVuY3Rpb24oZCkgeyByZXR1cm4gZDMuc3VtKGQsIGdldFZhbHVlKTsgfSlcbiAgICAudGV4dChvcHRzLnZhbHVlRm9ybWF0KTtcbn1cblxuXG5mdW5jdGlvbiBlbnRlckxlZ2VuZE1ldHJpYyhtZXRyaWMpIHtcbiAgbWV0cmljXG4gICAgLmF0dHIoJ2NsYXNzJywgJ3NwaC1yb3ctcGllLW1ldHJpYycpO1xuXG4gIG1ldHJpYy5hcHBlbmQoJ3RkJylcbiAgICAuYXR0cignY2xhc3MnLCAnc3BoLWNvbC1zd2F0Y2gnKTtcblxuICBtZXRyaWMuYXBwZW5kKCd0ZCcpXG4gICAgLmF0dHIoJ2NsYXNzJywgJ3NwaC1jb2wtcGllLXRpdGxlJyk7XG5cbiAgbWV0cmljLmFwcGVuZCgndGQnKVxuICAgIC5hdHRyKCdjbGFzcycsICdzcGgtY29sLXBpZS1wZXJjZW50Jyk7XG5cbiAgbWV0cmljLmFwcGVuZCgndGQnKVxuICAgIC5hdHRyKCdjbGFzcycsICdzcGgtY29sLXBpZS12YWx1ZScpO1xufVxuXG5cbmZ1bmN0aW9uIG5vcm1hbGl6ZShlbCwgb3B0cykge1xuICB2YXIgbm9kZSA9IGVsLm5vZGUoKTtcblxuICBlbC5kYXR1bShmdW5jdGlvbihkLCBpKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHRpdGxlOiBvcHRzLnRpdGxlLmNhbGwobm9kZSwgZCwgaSksXG4gICAgICBtZXRyaWNzOiBvcHRzLm1ldHJpY3MuY2FsbChub2RlLCBkLCBpKS5tYXAobWV0cmljKVxuICAgIH07XG4gIH0pO1xuXG4gIGZ1bmN0aW9uIG1ldHJpYyhkLCBpKSB7XG4gICAgdmFyIGtleSA9IG9wdHMua2V5XG4gICAgICAuY2FsbChub2RlLCBkLCBpKVxuICAgICAgLnRvU3RyaW5nKCk7XG5cbiAgICByZXR1cm4ge1xuICAgICAga2V5OiBrZXksXG4gICAgICBjb2xvcjogb3B0cy5jb2xvcnMoa2V5KSxcbiAgICAgIHRpdGxlOiBvcHRzLm1ldHJpY1RpdGxlLmNhbGwobm9kZSwgZCwgaSksXG4gICAgICB2YWx1ZTogb3B0cy52YWx1ZS5jYWxsKG5vZGUsIGQsIGkpXG4gICAgfTtcbiAgfVxuXG4gIHZhciBzdW0gPSBkMy5zdW0oZWwuZGF0dW0oKS5tZXRyaWNzLCBmdW5jdGlvbihkKSB7IHJldHVybiBkLnZhbHVlOyB9KTtcbiAgZWwuZGF0dW0oKS5tZXRyaWNzLmZvckVhY2goZnVuY3Rpb24oZCkgeyBkLnBlcmNlbnQgPSBkLnZhbHVlIC8gc3VtOyB9KTtcbn1cblxuXG5mdW5jdGlvbiBnZXRNZXRyaWNzKGQpIHtcbiAgcmV0dXJuIGQubWV0cmljcztcbn1cblxuXG5mdW5jdGlvbiBnZXRWYWx1ZShkKSB7XG4gIHJldHVybiBkLnZhbHVlO1xufVxuIiwibW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKCcuLi92aWV3JykuZXh0ZW5kKClcbiAgLnByb3AoJ2V4cGxpY2l0Q29tcG9uZW50cycpXG4gIC5kZWZhdWx0KGZhbHNlKTtcbiJdfQ==
(1)
});
