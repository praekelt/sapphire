// sapphire 0.2.0-dev


(function(factory) {
  if (typeof define === 'function' && define.amd) {
    define(["d3", "strain"], factory);
  } else if (typeof exports === 'object') {
    factory(["d3", "strain"].map(require));
  } else {
    factory(d3, strain);
  }
}(function(d3, strain) {
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


utils.formatValue = strain()
  .prop('int')
  .default(d3.format(','))

  .prop('float')
  .default(d3.format(',.3f'))

  .invoke(function(v) {
    return utils.isInteger(v)
      ? this.int()(v)
      : this.float()(v);
  });


utils.isInteger = function(v) {
  return +v === parseInt(v);
};


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
  .default(utils.formatValue()
    .int(d3.format(','))
    .float(d3.format(',.3f')))

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

},{"../utils":2,"./widget":9}],9:[function(_dereq_,module,exports){
module.exports = _dereq_('../view').extend()
  .prop('explicitComponents')
  .default(false);

},{"../view":3}]},{},[1])
(1)
});
}));
