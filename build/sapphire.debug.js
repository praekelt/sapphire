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
  el.classed('bars widget', true);

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
    .classed('title', true)
    .text(function(d) { return d.title; });
}


function drawChart(chart, opts) {
  chart
    .classed('chart', true)
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
    .attr('class', 'bars');

  svg.append('g')
    .attr('class', 'y axis');

  svg.append('g')
    .attr('class', 'x axis');
}


function drawSvg(svg, dims, fx, fy, opts) {
  svg
    .attr('width', dims.width)
    .attr('height', dims.height)
    .select('g')
      .attr('transform', utils.translate(
        dims.margin.left,
        dims.margin.top));

  svg.select('.bars')
     .call(drawBars, dims, fx, fy, opts);

  svg.select('.x.axis')
    .call(drawXAxis, dims, fx, opts);

  svg.select('.y.axis')
    .call(drawYAxis, dims, fy, opts);
}


function drawBars(bars, dims, fx, fy, opts) {
  bars
    .selectAll('.bar')
    .data(function(d) { return d; },
          function(d) { return d.x; })
    .call(drawBar, dims, fx, fy, opts);
}


function drawBar(bar, dims, fx, fy, opts) {
  bar.enter().append('g')
    .attr('class', 'bar')
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

    opts.status = status(el.datum().values);
    drawWidget(el, opts);
  });


function drawWidget(el, opts) {
  el.classed('last widget', true);

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
    .classed('title', true)
    .text(function(d) { return d.title; });
}


function drawLastValue(value, opts) {
  value
    .classed('last value', true)
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
    .classed('sparkline chart', true)
    .classed('good bad neutral', false)
    .classed(opts.status, true);

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

  svg.select('.paths')
    .call(drawPaths, fx, fy);

  svg.selectAll('.dot')
    .data(function(d) { return d.slice(-1); })
    .call(drawDot, fx, fy);
}


function drawPaths(paths, fx, fy) {
  var line = d3.svg.line()
    .x(function(d) { return fx(d.x); })
    .y(function(d) { return fy(d.y); });

  paths.select('.rest.path')
    .attr('d', line);

  paths.select('.diff.path')
    .datum(function(d) { return d.slice(-2); })
    .attr('d', line);
}


function initSparkline(sparkline) {
  var svg = sparkline.append('svg')
    .append('g');

  var paths = svg.append('g')
    .attr('class', 'paths');

  paths.append('path')
    .attr('class', 'rest path');

  paths.append('path')
    .attr('class', 'diff path');
}


function drawDot(dot, fx, fy) {
  dot.enter().append('circle')
    .attr('class', 'dot')
    .attr('r', 4);

  dot
    .attr('cx', function(d) { return fx(d.x); })
    .attr('cy', function(d) { return fy(d.y); });

  dot.exit().remove();
}


function drawSummary(summary, opts) {
  summary
    .classed('summary', true)
    .classed('good bad neutral', false)
    .classed(opts.status, true);

  if (summary.datum().length < opts.summaryLimit) {
    // TODO something better than this
    summary.style('height', 0);
    return;
  }

  summary
    .filter(utils.isEmptyNode)
    .call(initSummary);

  summary.select('.diff')
    .datum(function(d) {
      d = d.slice(-2);
      return d[1].y - d[0].y;
    })
    .text(opts.diffFormat);

  summary.select('.time')
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
    .attr('class', 'diff');

  summary.append('span')
    .attr('class', 'time');
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


function status(values) {
  values = values.slice(-2);

  var diff = values.length > 1
    ? values[1].y - values[0].y
    : 0;

  if (diff > 0) return 'good';
  if (diff < 0) return 'bad';
  return 'neutral';
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
  el.classed('pie widget', true);

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

},{"../utils":2,"./widget":9}],9:[function(_dereq_,module,exports){
module.exports = _dereq_('../view').extend()
  .prop('explicitComponents')
  .default(false);

},{"../view":3}]},{},[1])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9ob21lL2p1c3Rpbi9wcmFla2VsdC9zYXBwaGlyZS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiL2hvbWUvanVzdGluL3ByYWVrZWx0L3NhcHBoaXJlL3NyYy9zY3JpcHRzL2luZGV4LmpzIiwiL2hvbWUvanVzdGluL3ByYWVrZWx0L3NhcHBoaXJlL3NyYy9zY3JpcHRzL3V0aWxzLmpzIiwiL2hvbWUvanVzdGluL3ByYWVrZWx0L3NhcHBoaXJlL3NyYy9zY3JpcHRzL3ZpZXcuanMiLCIvaG9tZS9qdXN0aW4vcHJhZWtlbHQvc2FwcGhpcmUvc3JjL3NjcmlwdHMvd2lkZ2V0cy9iYXJzLmpzIiwiL2hvbWUvanVzdGluL3ByYWVrZWx0L3NhcHBoaXJlL3NyYy9zY3JpcHRzL3dpZGdldHMvaW5kZXguanMiLCIvaG9tZS9qdXN0aW4vcHJhZWtlbHQvc2FwcGhpcmUvc3JjL3NjcmlwdHMvd2lkZ2V0cy9sYXN0LmpzIiwiL2hvbWUvanVzdGluL3ByYWVrZWx0L3NhcHBoaXJlL3NyYy9zY3JpcHRzL3dpZGdldHMvbGluZXMuanMiLCIvaG9tZS9qdXN0aW4vcHJhZWtlbHQvc2FwcGhpcmUvc3JjL3NjcmlwdHMvd2lkZ2V0cy9waWUuanMiLCIvaG9tZS9qdXN0aW4vcHJhZWtlbHQvc2FwcGhpcmUvc3JjL3NjcmlwdHMvd2lkZ2V0cy93aWRnZXQuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTs7QUNIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoU0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdXQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1UEE7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKX12YXIgZj1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwoZi5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxmLGYuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiZXhwb3J0cy51dGlscyA9IHJlcXVpcmUoJy4vdXRpbHMnKTtcbmV4cG9ydHMudmlldyA9IHJlcXVpcmUoJy4vdmlldycpO1xuZXhwb3J0cy53aWRnZXRzID0gcmVxdWlyZSgnLi93aWRnZXRzJyk7XG4iLCJ2YXIgdXRpbHMgPSBleHBvcnRzO1xuXG5cbnV0aWxzLmFjY2VzcyA9IGZ1bmN0aW9uKGQsIG5hbWUsIGRlZmF1bHR2YWwpIHtcbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPCAzKSB7XG4gICAgZGVmYXVsdHZhbCA9IG51bGw7XG4gIH1cblxuICBpZiAodHlwZW9mIGQgIT0gJ29iamVjdCcpIHtcbiAgICByZXR1cm4gZGVmYXVsdHZhbDtcbiAgfVxuXG4gIHZhciB2YWwgPSBkW25hbWVdO1xuICByZXR1cm4gdHlwZW9mIHZhbCA9PSAndW5kZWZpbmVkJ1xuICAgID8gZGVmYXVsdHZhbFxuICAgIDogdmFsO1xufTtcblxuXG51dGlscy5lbnN1cmUgPSBmdW5jdGlvbih2LCBkZWZhdWx0dmFsKSB7XG4gIHJldHVybiB2ID09PSBudWxsIHx8IHR5cGVvZiB2ID09ICd1bmRlZmluZWQnXG4gICAgPyBkZWZhdWx0dmFsXG4gICAgOiB2O1xufTtcblxuXG51dGlscy50cmFuc2xhdGUgPSBmdW5jdGlvbih4LCB5KSB7XG4gIHJldHVybiAndHJhbnNsYXRlKCcgKyB4ICsgJywgJyArIHkgKyAnKSc7XG59O1xuXG5cbnV0aWxzLmVuc3VyZUVsID0gZnVuY3Rpb24oZWwpIHtcbiAgcmV0dXJuICEoZWwgaW5zdGFuY2VvZiBkMy5zZWxlY3Rpb24pXG4gICAgPyBkMy5zZWxlY3QoZWwpXG4gICAgOiBlbDtcbn07XG5cblxudXRpbHMuZGF0ZSA9IGZ1bmN0aW9uKHQpIHtcbiAgcmV0dXJuIG5ldyBEYXRlKHQpO1xufTtcblxuXG51dGlscy5weCA9IGZ1bmN0aW9uKGZuKSB7XG4gIGZuID0gZDMuZnVuY3Rvcihmbik7XG5cbiAgcmV0dXJuIGZ1bmN0aW9uKGQsIGkpIHtcbiAgICByZXR1cm4gZm4uY2FsbCh0aGlzLCBkLCBpKSArICdweCc7XG4gIH07XG59O1xuXG5cbnV0aWxzLmJveCA9IHN0cmFpbigpXG4gIC5wcm9wKCd3aWR0aCcpXG4gIC5kZWZhdWx0KDApXG5cbiAgLnByb3AoJ2hlaWdodCcpXG4gIC5kZWZhdWx0KDApXG5cbiAgLnByb3AoJ21hcmdpbicpXG4gIC5kZWZhdWx0KHtcbiAgICB0b3A6IDAsXG4gICAgbGVmdDogMCxcbiAgICByaWdodDogMCxcbiAgICBib3R0b206IDBcbiAgfSlcblxuICAubWV0aCgnY2FsYycsIGZ1bmN0aW9uKCkge1xuICAgIHZhciBkID0ge307XG4gICAgZC5tYXJnaW4gPSB0aGlzLm1hcmdpbigpO1xuICAgIGQud2lkdGggPSB0aGlzLndpZHRoKCk7XG4gICAgZC5oZWlnaHQgPSB0aGlzLmhlaWdodCgpO1xuICAgIGQuaW5uZXJXaWR0aCA9IGQud2lkdGggLSBkLm1hcmdpbi5sZWZ0IC0gZC5tYXJnaW4ucmlnaHQ7XG4gICAgZC5pbm5lckhlaWdodCA9IGQuaGVpZ2h0IC0gZC5tYXJnaW4udG9wIC0gZC5tYXJnaW4uYm90dG9tO1xuICAgIHJldHVybiBkO1xuICB9KVxuXG4gIC5pbnZva2UoZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuY2FsYygpO1xuICB9KTtcblxuXG51dGlscy5pbm5lcldpZHRoID0gZnVuY3Rpb24oZWwpIHtcbiAgcmV0dXJuIHV0aWxzLm1lYXN1cmUoZWwsICd3aWR0aCcpXG4gICAgICAgLSB1dGlscy5tZWFzdXJlKGVsLCAncGFkZGluZy1sZWZ0JylcbiAgICAgICAtIHV0aWxzLm1lYXN1cmUoZWwsICdwYWRkaW5nLXJpZ2h0Jyk7XG59O1xuXG5cbnV0aWxzLmlubmVySGVpZ2h0ID0gZnVuY3Rpb24oZWwpIHtcbiAgcmV0dXJuIHV0aWxzLm1lYXN1cmUoZWwsICdoZWlnaHQnKVxuICAgICAgIC0gdXRpbHMubWVhc3VyZShlbCwgJ3BhZGRpbmctdG9wJylcbiAgICAgICAtIHV0aWxzLm1lYXN1cmUoZWwsICdwYWRkaW5nLWJvdHRvbScpO1xufTtcblxuXG51dGlscy5tZWFzdXJlID0gZnVuY3Rpb24oZWwsIG5hbWUpIHtcbiAgZWwgPSB1dGlscy5lbnN1cmVFbChlbCk7XG4gIHJldHVybiBwYXJzZUludChlbC5zdHlsZShuYW1lKSk7XG59O1xuXG5cbnV0aWxzLmlzRW1wdHlOb2RlID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiAhdGhpcy5oYXNDaGlsZE5vZGVzKCk7XG59O1xuIiwibW9kdWxlLmV4cG9ydHMgPSBzdHJhaW4oKVxuICAuc3RhdGljKCdkcmF3JywgZnVuY3Rpb24oZm4pIHtcbiAgICB0aGlzLm1ldGgoJ19kcmF3XycsIGZuKTtcbiAgfSlcbiAgLmRyYXcoZnVuY3Rpb24oKSB7fSlcblxuICAubWV0aCgnZHJhdycsIGZ1bmN0aW9uKGVsKSB7XG4gICAgZWwgPSBzYXBwaGlyZS51dGlscy5lbnN1cmVFbChlbCk7XG5cbiAgICB2YXIgZGF0dW07XG4gICAgaWYgKGVsLm5vZGUoKSkgZGF0dW0gPSBlbC5kYXR1bSgpO1xuICAgIHRoaXMuX2RyYXdfLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgaWYgKHR5cGVvZiBkYXR1bSAhPSAndW5kZWZpbmVkJykgZWwuZGF0dW0oZGF0dW0pO1xuICB9KVxuXG4gIC5pbnZva2UoZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuZHJhdy5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICB9KTtcbiIsInZhciB1dGlscyA9IHJlcXVpcmUoJy4uL3V0aWxzJyk7XG5cblxubW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKCcuL3dpZGdldCcpLmV4dGVuZCgpXG4gIC5wcm9wKCdiYXJQYWRkaW5nJylcbiAgLmRlZmF1bHQoMi41KVxuXG4gIC5wcm9wKCdjaGFydE1hcmdpbicpXG4gIC5kZWZhdWx0KHtcbiAgICB0b3A6IDEwLFxuICAgIGxlZnQ6IDM4LFxuICAgIHJpZ2h0OiAxNSxcbiAgICBib3R0b206IDQ1XG4gIH0pXG5cbiAgLnByb3AoJ3RpdGxlJylcbiAgLnNldChkMy5mdW5jdG9yKVxuICAuZGVmYXVsdChmdW5jdGlvbihkKSB7IHJldHVybiBkLnRpdGxlOyB9KVxuXG4gIC5wcm9wKCd2YWx1ZXMnKVxuICAuc2V0KGQzLmZ1bmN0b3IpXG4gIC5kZWZhdWx0KGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQudmFsdWVzOyB9KVxuXG4gIC5wcm9wKCd4JylcbiAgLnNldChkMy5mdW5jdG9yKVxuICAuZGVmYXVsdChmdW5jdGlvbihkKSB7IHJldHVybiBkLng7IH0pXG5cbiAgLnByb3AoJ3knKVxuICAuc2V0KGQzLmZ1bmN0b3IpXG4gIC5kZWZhdWx0KGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQueTsgfSlcblxuICAucHJvcCgnZHgnKVxuICAuc2V0KGQzLmZ1bmN0b3IpXG4gIC5kZWZhdWx0KG51bGwpXG5cbiAgLnByb3AoJ3hUaWNrRm9ybWF0JylcbiAgLmRlZmF1bHQobnVsbClcblxuICAucHJvcCgneFRpY2tzJylcbiAgLmRlZmF1bHQoOClcblxuICAucHJvcCgneVRpY2tGb3JtYXQnKVxuICAuZGVmYXVsdChkMy5mb3JtYXQoJy4ycycpKVxuXG4gIC5wcm9wKCd5VGlja3MnKVxuICAuZGVmYXVsdCg1KVxuXG4gIC5wcm9wKCd5TWF4JylcbiAgLnNldChkMy5mdW5jdG9yKVxuICAuZGVmYXVsdChkMy5tYXgpXG5cbiAgLnByb3AoJ2NvbG9ycycpXG5cbiAgLmluaXQoZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5jb2xvcnMoZDMuc2NhbGUuY2F0ZWdvcnkxMCgpKTtcbiAgfSlcblxuICAuZHJhdyhmdW5jdGlvbihlbCkge1xuICAgIHZhciBvcHRzID0gdGhpcy5wcm9wcygpO1xuICAgIG5vcm1hbGl6ZShlbCwgb3B0cyk7XG5cbiAgICBvcHRzLndpZHRoID0gdXRpbHMuaW5uZXJXaWR0aChlbCk7XG4gICAgb3B0cy5jb2xvciA9IG9wdHMuY29sb3JzKGVsLmRhdHVtKCkudGl0bGUpO1xuICAgIGRyYXdXaWRnZXQoZWwsIG9wdHMpO1xuICB9KTtcblxuXG5mdW5jdGlvbiBkcmF3V2lkZ2V0KGVsLCBvcHRzKSB7XG4gIGVsLmNsYXNzZWQoJ2JhcnMgd2lkZ2V0JywgdHJ1ZSk7XG5cbiAgaWYgKCFvcHRzLmV4cGxpY2l0Q29tcG9uZW50cykgaW5pdENvbXBvbmVudHMoZWwpO1xuXG4gIHZhciBjb21wb25lbnQgPSBlbC5zZWxlY3QoJ1tkYXRhLXdpZGdldC1jb21wb25lbnQ9XCJ0aXRsZVwiXScpO1xuICBpZiAoY29tcG9uZW50LnNpemUoKSkgY29tcG9uZW50LmNhbGwoZHJhd1RpdGxlKTtcblxuICBjb21wb25lbnQgPSBlbC5zZWxlY3QoJ1tkYXRhLXdpZGdldC1jb21wb25lbnQ9XCJjaGFydFwiXScpO1xuICBpZiAoY29tcG9uZW50LnNpemUoKSkgY29tcG9uZW50LmNhbGwoZHJhd0NoYXJ0LCBvcHRzKTtcbn1cblxuXG5mdW5jdGlvbiBpbml0Q29tcG9uZW50cyhlbCkge1xuICBlbC5hcHBlbmQoJ2RpdicpXG4gICAgLmF0dHIoJ2RhdGEtd2lkZ2V0LWNvbXBvbmVudCcsICd0aXRsZScpO1xuXG4gIGVsLmFwcGVuZCgnZGl2JylcbiAgICAuYXR0cignZGF0YS13aWRnZXQtY29tcG9uZW50JywgJ2NoYXJ0Jyk7XG59XG5cblxuZnVuY3Rpb24gZHJhd1RpdGxlKHRpdGxlKSB7XG4gIHRpdGxlXG4gICAgLmNsYXNzZWQoJ3RpdGxlJywgdHJ1ZSlcbiAgICAudGV4dChmdW5jdGlvbihkKSB7IHJldHVybiBkLnRpdGxlOyB9KTtcbn1cblxuXG5mdW5jdGlvbiBkcmF3Q2hhcnQoY2hhcnQsIG9wdHMpIHtcbiAgY2hhcnRcbiAgICAuY2xhc3NlZCgnY2hhcnQnLCB0cnVlKVxuICAgIC5kYXR1bShmdW5jdGlvbihkKSB7IHJldHVybiBkLnZhbHVlczsgfSk7XG5cbiAgdmFyIGRpbXMgPSB1dGlscy5ib3goKVxuICAgIC53aWR0aChvcHRzLndpZHRoKVxuICAgIC5oZWlnaHQodXRpbHMuaW5uZXJIZWlnaHQoY2hhcnQpKVxuICAgIC5tYXJnaW4ob3B0cy5jaGFydE1hcmdpbilcbiAgICAuY2FsYygpO1xuXG4gIHZhciBmeCA9IGQzLnRpbWUuc2NhbGUoKVxuICAgIC5kb21haW4oW1xuICAgICAgZDMubWluKGNoYXJ0LmRhdHVtKCksIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQueDsgfSksXG4gICAgICBkMy5tYXgoY2hhcnQuZGF0dW0oKSwgZnVuY3Rpb24oZCkgeyByZXR1cm4gZC54ICsgZC5keDsgfSldKTtcblxuICB2YXIgeXMgPSBjaGFydC5kYXR1bSgpXG4gICAgLm1hcChmdW5jdGlvbihkKSB7IHJldHVybiBkLnk7IH0pO1xuXG4gIHZhciBmeSA9IGQzLnNjYWxlLmxpbmVhcigpXG4gICAgLmRvbWFpbihbMCwgb3B0cy55TWF4KHlzKV0pO1xuXG4gIGZ4LnJhbmdlKFswLCBkaW1zLmlubmVyV2lkdGhdKTtcbiAgZnkucmFuZ2UoW2RpbXMuaW5uZXJIZWlnaHQsIDBdKTtcblxuICBjaGFydFxuICAgIC5maWx0ZXIodXRpbHMuaXNFbXB0eU5vZGUpXG4gICAgLmNhbGwoaW5pdENoYXJ0KTtcblxuICBjaGFydC5zZWxlY3QoJ3N2ZycpXG4gICAgLmNhbGwoZHJhd1N2ZywgZGltcywgZngsIGZ5LCBvcHRzKTtcbn1cblxuXG5mdW5jdGlvbiBpbml0Q2hhcnQoY2hhcnQpIHtcbiAgdmFyIHN2ZyA9IGNoYXJ0XG4gICAgLmFwcGVuZCgnc3ZnJylcbiAgICAuYXBwZW5kKCdnJyk7XG5cbiAgc3ZnLmFwcGVuZCgnZycpXG4gICAgLmF0dHIoJ2NsYXNzJywgJ2JhcnMnKTtcblxuICBzdmcuYXBwZW5kKCdnJylcbiAgICAuYXR0cignY2xhc3MnLCAneSBheGlzJyk7XG5cbiAgc3ZnLmFwcGVuZCgnZycpXG4gICAgLmF0dHIoJ2NsYXNzJywgJ3ggYXhpcycpO1xufVxuXG5cbmZ1bmN0aW9uIGRyYXdTdmcoc3ZnLCBkaW1zLCBmeCwgZnksIG9wdHMpIHtcbiAgc3ZnXG4gICAgLmF0dHIoJ3dpZHRoJywgZGltcy53aWR0aClcbiAgICAuYXR0cignaGVpZ2h0JywgZGltcy5oZWlnaHQpXG4gICAgLnNlbGVjdCgnZycpXG4gICAgICAuYXR0cigndHJhbnNmb3JtJywgdXRpbHMudHJhbnNsYXRlKFxuICAgICAgICBkaW1zLm1hcmdpbi5sZWZ0LFxuICAgICAgICBkaW1zLm1hcmdpbi50b3ApKTtcblxuICBzdmcuc2VsZWN0KCcuYmFycycpXG4gICAgIC5jYWxsKGRyYXdCYXJzLCBkaW1zLCBmeCwgZnksIG9wdHMpO1xuXG4gIHN2Zy5zZWxlY3QoJy54LmF4aXMnKVxuICAgIC5jYWxsKGRyYXdYQXhpcywgZGltcywgZngsIG9wdHMpO1xuXG4gIHN2Zy5zZWxlY3QoJy55LmF4aXMnKVxuICAgIC5jYWxsKGRyYXdZQXhpcywgZGltcywgZnksIG9wdHMpO1xufVxuXG5cbmZ1bmN0aW9uIGRyYXdCYXJzKGJhcnMsIGRpbXMsIGZ4LCBmeSwgb3B0cykge1xuICBiYXJzXG4gICAgLnNlbGVjdEFsbCgnLmJhcicpXG4gICAgLmRhdGEoZnVuY3Rpb24oZCkgeyByZXR1cm4gZDsgfSxcbiAgICAgICAgICBmdW5jdGlvbihkKSB7IHJldHVybiBkLng7IH0pXG4gICAgLmNhbGwoZHJhd0JhciwgZGltcywgZngsIGZ5LCBvcHRzKTtcbn1cblxuXG5mdW5jdGlvbiBkcmF3QmFyKGJhciwgZGltcywgZngsIGZ5LCBvcHRzKSB7XG4gIGJhci5lbnRlcigpLmFwcGVuZCgnZycpXG4gICAgLmF0dHIoJ2NsYXNzJywgJ2JhcicpXG4gICAgLmFwcGVuZCgncmVjdCcpO1xuXG4gIGJhclxuICAgIC5hdHRyKCd0cmFuc2Zvcm0nLCBmdW5jdGlvbihkKSB7XG4gICAgICByZXR1cm4gdXRpbHMudHJhbnNsYXRlKGZ4KGQueCksIGZ5KGQueSkpO1xuICAgIH0pO1xuXG4gIGJhci5zZWxlY3QoJ3JlY3QnKVxuICAgIC5zdHlsZSgnZmlsbCcsIG9wdHMuY29sb3IpXG4gICAgLmF0dHIoJ3dpZHRoJywgZnVuY3Rpb24oZCkge1xuICAgICAgdmFyIHdpZHRoID0gZngoZC54ICsgZC5keCkgLSBmeChkLngpO1xuICAgICAgd2lkdGggLT0gb3B0cy5iYXJQYWRkaW5nO1xuICAgICAgcmV0dXJuIE1hdGgubWF4KHdpZHRoLCAxKTtcbiAgICB9KVxuICAgIC5hdHRyKCdoZWlnaHQnLCBmdW5jdGlvbihkKSB7XG4gICAgICByZXR1cm4gZGltcy5pbm5lckhlaWdodCAtIGZ5KGQueSk7IFxuICAgIH0pO1xuXG4gIGJhci5leGl0KClcbiAgICAucmVtb3ZlKCk7XG59XG5cblxuZnVuY3Rpb24gZHJhd1hBeGlzKGF4aXMsIGRpbXMsIGZ4LCBvcHRzKSB7XG4gIGF4aXNcbiAgICAuYXR0cigndHJhbnNmb3JtJywgdXRpbHMudHJhbnNsYXRlKDAsIGRpbXMuaW5uZXJIZWlnaHQpKVxuICAgIC5jYWxsKGQzLnN2Zy5heGlzKClcbiAgICAgIC5zY2FsZShmeClcbiAgICAgIC50aWNrcyhvcHRzLnhUaWNrcylcbiAgICAgIC50aWNrRm9ybWF0KG9wdHMueFRpY2tGb3JtYXQpKTtcbn1cblxuXG5mdW5jdGlvbiBkcmF3WUF4aXMoYXhpcywgZGltcywgZnksIG9wdHMpIHtcbiAgYXhpcy5jYWxsKGQzLnN2Zy5heGlzKClcbiAgICAub3JpZW50KCdsZWZ0JylcbiAgICAuc2NhbGUoZnkpXG4gICAgLnRpY2tQYWRkaW5nKDgpXG4gICAgLnRpY2tTaXplKC1kaW1zLmlubmVyV2lkdGgpXG4gICAgLnRpY2tzKG9wdHMueVRpY2tzKVxuICAgIC50aWNrRm9ybWF0KG9wdHMueVRpY2tGb3JtYXQpKTtcbn1cblxuXG5mdW5jdGlvbiBub3JtYWxpemUoZWwsIG9wdHMpIHtcbiAgdmFyIG5vZGUgPSBlbC5ub2RlKCk7XG5cbiAgZWwuZGF0dW0oZnVuY3Rpb24oZCwgaSkge1xuICAgIHZhciB2YWx1ZXMgPSBvcHRzLnZhbHVlc1xuICAgICAgLmNhbGwobm9kZSwgZCwgaSlcbiAgICAgIC5tYXAodmFsdWUpO1xuXG4gICAgdmFyIGxlbiA9IHZhbHVlcy5sZW5ndGg7XG4gICAgdmFyIGR4QXZnID0gdmFsdWVzLmxlbmd0aFxuICAgICAgPyAodmFsdWVzW2xlbiAtIDFdLnggLSB2YWx1ZXNbMF0ueCkgLyBsZW5cbiAgICAgIDogMDtcblxuICAgIHZhbHVlcy5mb3JFYWNoKGZ1bmN0aW9uKGQpIHtcbiAgICAgIGQuZHggPSB1dGlscy5lbnN1cmUoZC5keCwgZHhBdmcpO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIHZhbHVlczogdmFsdWVzLFxuICAgICAgdGl0bGU6IG9wdHMudGl0bGUuY2FsbChub2RlLCBkLCBpKVxuICAgIH07XG4gIH0pO1xuXG4gIGZ1bmN0aW9uIHZhbHVlKGQsIGkpIHtcbiAgICByZXR1cm4ge1xuICAgICAgeDogb3B0cy54LmNhbGwobm9kZSwgZCwgaSksXG4gICAgICB5OiBvcHRzLnkuY2FsbChub2RlLCBkLCBpKSxcbiAgICAgIGR4OiBvcHRzLmR4LmNhbGwobm9kZSwgZCwgaSlcbiAgICB9O1xuICB9XG59XG4iLCJleHBvcnRzLnBpZSA9IHJlcXVpcmUoJy4vcGllJyk7XG5leHBvcnRzLmJhcnMgPSByZXF1aXJlKCcuL2JhcnMnKTtcbmV4cG9ydHMubGFzdCA9IHJlcXVpcmUoJy4vbGFzdCcpO1xuZXhwb3J0cy5saW5lcyA9IHJlcXVpcmUoJy4vbGluZXMnKTtcbmV4cG9ydHMud2lkZ2V0ID0gcmVxdWlyZSgnLi93aWRnZXQnKTtcbiIsInZhciB1dGlscyA9IHJlcXVpcmUoJy4uL3V0aWxzJyk7XG5cblxubW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKCcuL3dpZGdldCcpLmV4dGVuZCgpXG4gIC5wcm9wKCd0aXRsZScpXG4gIC5zZXQoZDMuZnVuY3RvcilcbiAgLmRlZmF1bHQoZnVuY3Rpb24oZCkgeyByZXR1cm4gZC50aXRsZTsgfSlcblxuICAucHJvcCgndmFsdWVzJylcbiAgLnNldChkMy5mdW5jdG9yKVxuICAuZGVmYXVsdChmdW5jdGlvbihkKSB7IHJldHVybiBkLnZhbHVlczsgfSlcblxuICAucHJvcCgneCcpXG4gIC5zZXQoZDMuZnVuY3RvcilcbiAgLmRlZmF1bHQoZnVuY3Rpb24oZCkgeyByZXR1cm4gZC54OyB9KVxuXG4gIC5wcm9wKCd5JylcbiAgLnNldChkMy5mdW5jdG9yKVxuICAuZGVmYXVsdChmdW5jdGlvbihkKSB7IHJldHVybiBkLnk7IH0pXG5cbiAgLnByb3AoJ3lGb3JtYXQnKVxuICAuZGVmYXVsdChkMy5mb3JtYXQoJywycycpKVxuXG4gIC5wcm9wKCdkaWZmRm9ybWF0JylcbiAgLmRlZmF1bHQoZDMuZm9ybWF0KCcrLDJzJykpXG5cbiAgLnByb3AoJ3hGb3JtYXQnKVxuICAuZGVmYXVsdChkMy50aW1lLmZvcm1hdCgnJS1kICViICUtSDolTScpKVxuXG4gIC5wcm9wKCdub25lJylcbiAgLmRlZmF1bHQoMClcblxuICAucHJvcCgnc3VtbWFyeUxpbWl0JylcbiAgLmRlZmF1bHQoMilcbiAgLnNldChmdW5jdGlvbih2KSB7IHJldHVybiBNYXRoLm1heCh1dGlscy5lbnN1cmUodiwgMiksIDIpOyB9KVxuXG4gIC5wcm9wKCdzcGFya2xpbmVMaW1pdCcpXG4gIC5kZWZhdWx0KDE1KVxuICAuc2V0KGZ1bmN0aW9uKHYpIHsgcmV0dXJuIE1hdGgubWF4KHV0aWxzLmVuc3VyZSh2LCAyKSwgMik7IH0pXG5cbiAgLnByb3AoJ3NwYXJrbGluZU1hcmdpbicpXG4gIC5kZWZhdWx0KHtcbiAgICB0b3A6IDQsXG4gICAgbGVmdDogNCxcbiAgICBib3R0b206IDQsXG4gICAgcmlnaHQ6IDQgXG4gIH0pXG5cbiAgLmRyYXcoZnVuY3Rpb24oZWwpIHtcbiAgICB2YXIgb3B0cyA9IHRoaXMucHJvcHMoKTtcbiAgICBub3JtYWxpemUoZWwsIG9wdHMpO1xuXG4gICAgb3B0cy5zdGF0dXMgPSBzdGF0dXMoZWwuZGF0dW0oKS52YWx1ZXMpO1xuICAgIGRyYXdXaWRnZXQoZWwsIG9wdHMpO1xuICB9KTtcblxuXG5mdW5jdGlvbiBkcmF3V2lkZ2V0KGVsLCBvcHRzKSB7XG4gIGVsLmNsYXNzZWQoJ2xhc3Qgd2lkZ2V0JywgdHJ1ZSk7XG5cbiAgaWYgKCFvcHRzLmV4cGxpY2l0Q29tcG9uZW50cykgaW5pdENvbXBvbmVudHMoZWwpO1xuXG4gIHZhciBjb21wb25lbnQgPSBlbC5zZWxlY3QoJ1tkYXRhLXdpZGdldC1jb21wb25lbnQ9XCJ0aXRsZVwiXScpO1xuICBpZiAoY29tcG9uZW50LnNpemUoKSkgY29tcG9uZW50LmNhbGwoZHJhd1RpdGxlKTtcblxuICBjb21wb25lbnQgPSBlbC5zZWxlY3QoJ1tkYXRhLXdpZGdldC1jb21wb25lbnQ9XCJsYXN0LXZhbHVlXCJdJyk7XG4gIGlmIChjb21wb25lbnQuc2l6ZSgpKSBjb21wb25lbnQuZGF0dW0oZ2V0VmFsdWVzKS5jYWxsKGRyYXdMYXN0VmFsdWUsIG9wdHMpO1xuXG4gIGNvbXBvbmVudCA9IGVsLnNlbGVjdCgnW2RhdGEtd2lkZ2V0LWNvbXBvbmVudD1cInNwYXJrbGluZVwiXScpO1xuICBpZiAoY29tcG9uZW50LnNpemUoKSkgY29tcG9uZW50LmRhdHVtKGdldFZhbHVlcykuY2FsbChkcmF3U3BhcmtsaW5lLCBvcHRzKTtcblxuICBjb21wb25lbnQgPSBlbC5zZWxlY3QoJ1tkYXRhLXdpZGdldC1jb21wb25lbnQ9XCJzdW1tYXJ5XCJdJyk7XG4gIGlmIChjb21wb25lbnQuc2l6ZSgpKSBjb21wb25lbnQuZGF0dW0oZ2V0VmFsdWVzKS5jYWxsKGRyYXdTdW1tYXJ5LCBvcHRzKTtcbn1cblxuXG5mdW5jdGlvbiBpbml0Q29tcG9uZW50cyhlbCkge1xuICBlbC5hcHBlbmQoJ2RpdicpXG4gICAgLmF0dHIoJ2RhdGEtd2lkZ2V0LWNvbXBvbmVudCcsICd0aXRsZScpO1xuXG4gIGVsLmFwcGVuZCgnZGl2JylcbiAgICAuYXR0cignZGF0YS13aWRnZXQtY29tcG9uZW50JywgJ2xhc3QtdmFsdWUnKTtcblxuICBlbC5hcHBlbmQoJ2RpdicpXG4gICAgLmF0dHIoJ2RhdGEtd2lkZ2V0LWNvbXBvbmVudCcsICdzcGFya2xpbmUnKTtcblxuICBlbC5hcHBlbmQoJ2RpdicpXG4gICAgLmF0dHIoJ2RhdGEtd2lkZ2V0LWNvbXBvbmVudCcsICdzdW1tYXJ5Jyk7XG59XG5cblxuZnVuY3Rpb24gZ2V0VmFsdWVzKGQpIHtcbiAgcmV0dXJuIGQudmFsdWVzO1xufVxuXG5cbmZ1bmN0aW9uIGRyYXdUaXRsZSh0aXRsZSkge1xuICB0aXRsZVxuICAgIC5jbGFzc2VkKCd0aXRsZScsIHRydWUpXG4gICAgLnRleHQoZnVuY3Rpb24oZCkgeyByZXR1cm4gZC50aXRsZTsgfSk7XG59XG5cblxuZnVuY3Rpb24gZHJhd0xhc3RWYWx1ZSh2YWx1ZSwgb3B0cykge1xuICB2YWx1ZVxuICAgIC5jbGFzc2VkKCdsYXN0IHZhbHVlJywgdHJ1ZSlcbiAgICAuZGF0dW0oZnVuY3Rpb24oZCwgaSkge1xuICAgICAgZCA9IGRbZC5sZW5ndGggLSAxXTtcblxuICAgICAgcmV0dXJuICFkXG4gICAgICAgID8gb3B0cy5ub25lXG4gICAgICAgIDogZC55O1xuICAgIH0pXG4gICAgLnRleHQob3B0cy55Rm9ybWF0KTtcbn1cblxuXG5mdW5jdGlvbiBkcmF3U3BhcmtsaW5lKHNwYXJrbGluZSwgb3B0cykge1xuICBzcGFya2xpbmVcbiAgICAuY2xhc3NlZCgnc3BhcmtsaW5lIGNoYXJ0JywgdHJ1ZSlcbiAgICAuY2xhc3NlZCgnZ29vZCBiYWQgbmV1dHJhbCcsIGZhbHNlKVxuICAgIC5jbGFzc2VkKG9wdHMuc3RhdHVzLCB0cnVlKTtcblxuICBpZiAoc3BhcmtsaW5lLmRhdHVtKCkubGVuZ3RoIDwgb3B0cy5zcGFya2xpbmVMaW1pdCkge1xuICAgIC8vIFRPRE8gc29tZXRoaW5nIGJldHRlciB0aGFuIHRoaXNcbiAgICBzcGFya2xpbmUuc3R5bGUoJ2hlaWdodCcsIDApO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIHZhciBkaW1zID0gdXRpbHMuYm94KClcbiAgICAubWFyZ2luKG9wdHMuc3BhcmtsaW5lTWFyZ2luKVxuICAgIC53aWR0aCh1dGlscy5pbm5lcldpZHRoKHNwYXJrbGluZSkpXG4gICAgLmhlaWdodCh1dGlscy5pbm5lckhlaWdodChzcGFya2xpbmUpKVxuICAgIC5jYWxjKCk7XG5cbiAgdmFyIGZ4ID0gZDMuc2NhbGUubGluZWFyKClcbiAgICAuZG9tYWluKGQzLmV4dGVudChzcGFya2xpbmUuZGF0dW0oKSwgZnVuY3Rpb24oZCkgeyByZXR1cm4gZC54OyB9KSlcbiAgICAucmFuZ2UoWzAsIGRpbXMuaW5uZXJXaWR0aF0pO1xuXG4gIHZhciBmeSA9IGQzLnNjYWxlLmxpbmVhcigpXG4gICAgLmRvbWFpbihkMy5leHRlbnQoc3BhcmtsaW5lLmRhdHVtKCksIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQueTsgfSkpXG4gICAgLnJhbmdlKFtkaW1zLmlubmVySGVpZ2h0LCAwXSk7XG5cbiAgc3BhcmtsaW5lXG4gICAgLmZpbHRlcih1dGlscy5pc0VtcHR5Tm9kZSlcbiAgICAuY2FsbChpbml0U3BhcmtsaW5lKTtcblxuICBzcGFya2xpbmUuc2VsZWN0KCdzdmcnKVxuICAgIC5jYWxsKGRyYXdTdmcsIGRpbXMsIGZ4LCBmeSk7XG59XG5cblxuZnVuY3Rpb24gZHJhd1N2ZyhzdmcsIGRpbXMsIGZ4LCBmeSkge1xuICBzdmcgPSBzdmdcbiAgICAuYXR0cignd2lkdGgnLCBkaW1zLndpZHRoKVxuICAgIC5hdHRyKCdoZWlnaHQnLCBkaW1zLmhlaWdodClcbiAgICAuc2VsZWN0KCdnJylcbiAgICAgIC5hdHRyKCd0cmFuc2Zvcm0nLCB1dGlscy50cmFuc2xhdGUoZGltcy5tYXJnaW4ubGVmdCwgZGltcy5tYXJnaW4udG9wKSk7XG5cbiAgc3ZnLnNlbGVjdCgnLnBhdGhzJylcbiAgICAuY2FsbChkcmF3UGF0aHMsIGZ4LCBmeSk7XG5cbiAgc3ZnLnNlbGVjdEFsbCgnLmRvdCcpXG4gICAgLmRhdGEoZnVuY3Rpb24oZCkgeyByZXR1cm4gZC5zbGljZSgtMSk7IH0pXG4gICAgLmNhbGwoZHJhd0RvdCwgZngsIGZ5KTtcbn1cblxuXG5mdW5jdGlvbiBkcmF3UGF0aHMocGF0aHMsIGZ4LCBmeSkge1xuICB2YXIgbGluZSA9IGQzLnN2Zy5saW5lKClcbiAgICAueChmdW5jdGlvbihkKSB7IHJldHVybiBmeChkLngpOyB9KVxuICAgIC55KGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGZ5KGQueSk7IH0pO1xuXG4gIHBhdGhzLnNlbGVjdCgnLnJlc3QucGF0aCcpXG4gICAgLmF0dHIoJ2QnLCBsaW5lKTtcblxuICBwYXRocy5zZWxlY3QoJy5kaWZmLnBhdGgnKVxuICAgIC5kYXR1bShmdW5jdGlvbihkKSB7IHJldHVybiBkLnNsaWNlKC0yKTsgfSlcbiAgICAuYXR0cignZCcsIGxpbmUpO1xufVxuXG5cbmZ1bmN0aW9uIGluaXRTcGFya2xpbmUoc3BhcmtsaW5lKSB7XG4gIHZhciBzdmcgPSBzcGFya2xpbmUuYXBwZW5kKCdzdmcnKVxuICAgIC5hcHBlbmQoJ2cnKTtcblxuICB2YXIgcGF0aHMgPSBzdmcuYXBwZW5kKCdnJylcbiAgICAuYXR0cignY2xhc3MnLCAncGF0aHMnKTtcblxuICBwYXRocy5hcHBlbmQoJ3BhdGgnKVxuICAgIC5hdHRyKCdjbGFzcycsICdyZXN0IHBhdGgnKTtcblxuICBwYXRocy5hcHBlbmQoJ3BhdGgnKVxuICAgIC5hdHRyKCdjbGFzcycsICdkaWZmIHBhdGgnKTtcbn1cblxuXG5mdW5jdGlvbiBkcmF3RG90KGRvdCwgZngsIGZ5KSB7XG4gIGRvdC5lbnRlcigpLmFwcGVuZCgnY2lyY2xlJylcbiAgICAuYXR0cignY2xhc3MnLCAnZG90JylcbiAgICAuYXR0cigncicsIDQpO1xuXG4gIGRvdFxuICAgIC5hdHRyKCdjeCcsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGZ4KGQueCk7IH0pXG4gICAgLmF0dHIoJ2N5JywgZnVuY3Rpb24oZCkgeyByZXR1cm4gZnkoZC55KTsgfSk7XG5cbiAgZG90LmV4aXQoKS5yZW1vdmUoKTtcbn1cblxuXG5mdW5jdGlvbiBkcmF3U3VtbWFyeShzdW1tYXJ5LCBvcHRzKSB7XG4gIHN1bW1hcnlcbiAgICAuY2xhc3NlZCgnc3VtbWFyeScsIHRydWUpXG4gICAgLmNsYXNzZWQoJ2dvb2QgYmFkIG5ldXRyYWwnLCBmYWxzZSlcbiAgICAuY2xhc3NlZChvcHRzLnN0YXR1cywgdHJ1ZSk7XG5cbiAgaWYgKHN1bW1hcnkuZGF0dW0oKS5sZW5ndGggPCBvcHRzLnN1bW1hcnlMaW1pdCkge1xuICAgIC8vIFRPRE8gc29tZXRoaW5nIGJldHRlciB0aGFuIHRoaXNcbiAgICBzdW1tYXJ5LnN0eWxlKCdoZWlnaHQnLCAwKTtcbiAgICByZXR1cm47XG4gIH1cblxuICBzdW1tYXJ5XG4gICAgLmZpbHRlcih1dGlscy5pc0VtcHR5Tm9kZSlcbiAgICAuY2FsbChpbml0U3VtbWFyeSk7XG5cbiAgc3VtbWFyeS5zZWxlY3QoJy5kaWZmJylcbiAgICAuZGF0dW0oZnVuY3Rpb24oZCkge1xuICAgICAgZCA9IGQuc2xpY2UoLTIpO1xuICAgICAgcmV0dXJuIGRbMV0ueSAtIGRbMF0ueTtcbiAgICB9KVxuICAgIC50ZXh0KG9wdHMuZGlmZkZvcm1hdCk7XG5cbiAgc3VtbWFyeS5zZWxlY3QoJy50aW1lJylcbiAgICAuZGF0dW0oZnVuY3Rpb24oZCkge1xuICAgICAgZCA9IGQuc2xpY2UoLTIpO1xuXG4gICAgICByZXR1cm4gW2RbMF0ueCwgZFsxXS54XVxuICAgICAgICAubWFwKHV0aWxzLmRhdGUpXG4gICAgICAgIC5tYXAob3B0cy54Rm9ybWF0KTtcbiAgICB9KVxuICAgIC50ZXh0KGZ1bmN0aW9uKGQpIHtcbiAgICAgIHJldHVybiBbJyBmcm9tJywgZFswXSwgJ3RvJywgZFsxXV0uam9pbignICcpO1xuICAgIH0pO1xufVxuXG5cbmZ1bmN0aW9uIGluaXRTdW1tYXJ5KHN1bW1hcnkpIHtcbiAgc3VtbWFyeS5hcHBlbmQoJ3NwYW4nKVxuICAgIC5hdHRyKCdjbGFzcycsICdkaWZmJyk7XG5cbiAgc3VtbWFyeS5hcHBlbmQoJ3NwYW4nKVxuICAgIC5hdHRyKCdjbGFzcycsICd0aW1lJyk7XG59XG5cblxuZnVuY3Rpb24gbm9ybWFsaXplKGVsLCBvcHRzKSB7XG4gIHZhciBub2RlID0gZWwubm9kZSgpO1xuXG4gIGVsLmRhdHVtKGZ1bmN0aW9uKGQsIGkpIHtcbiAgICByZXR1cm4ge1xuICAgICAgdGl0bGU6IG9wdHMudGl0bGUuY2FsbChub2RlLCBkLCBpKSxcbiAgICAgIHZhbHVlczogb3B0cy52YWx1ZXMuY2FsbChub2RlLCBkLCBpKVxuICAgICAgICAubWFwKHZhbHVlKVxuICAgIH07XG4gIH0pO1xuXG5cbiAgZnVuY3Rpb24gdmFsdWUoZCwgaSkge1xuICAgIHJldHVybiB7XG4gICAgICB4OiBvcHRzLnguY2FsbChub2RlLCBkLCBpKSxcbiAgICAgIHk6IG9wdHMueS5jYWxsKG5vZGUsIGQsIGkpXG4gICAgfTtcbiAgfVxufVxuXG5cbmZ1bmN0aW9uIHN0YXR1cyh2YWx1ZXMpIHtcbiAgdmFsdWVzID0gdmFsdWVzLnNsaWNlKC0yKTtcblxuICB2YXIgZGlmZiA9IHZhbHVlcy5sZW5ndGggPiAxXG4gICAgPyB2YWx1ZXNbMV0ueSAtIHZhbHVlc1swXS55XG4gICAgOiAwO1xuXG4gIGlmIChkaWZmID4gMCkgcmV0dXJuICdnb29kJztcbiAgaWYgKGRpZmYgPCAwKSByZXR1cm4gJ2JhZCc7XG4gIHJldHVybiAnbmV1dHJhbCc7XG59XG4iLCJ2YXIgdXRpbHMgPSByZXF1aXJlKCcuLi91dGlscycpO1xuXG5cbm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSgnLi93aWRnZXQnKS5leHRlbmQoKVxuICAucHJvcCgndGl0bGUnKVxuICAuc2V0KGQzLmZ1bmN0b3IpXG4gIC5kZWZhdWx0KGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQudGl0bGU7IH0pXG5cbiAgLnByb3AoJ21ldHJpY3MnKVxuICAuc2V0KGQzLmZ1bmN0b3IpXG4gIC5kZWZhdWx0KGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQubWV0cmljczsgfSlcblxuICAucHJvcCgna2V5JylcbiAgLnNldChkMy5mdW5jdG9yKVxuICAuZGVmYXVsdChmdW5jdGlvbihkLCBpKSB7IHJldHVybiBpOyB9KVxuXG4gIC5wcm9wKCdtZXRyaWNUaXRsZScpXG4gIC5zZXQoZDMuZnVuY3RvcilcbiAgLmRlZmF1bHQoZnVuY3Rpb24oZCkgeyByZXR1cm4gZC50aXRsZTsgfSlcblxuICAucHJvcCgndmFsdWVzJylcbiAgLnNldChkMy5mdW5jdG9yKVxuICAuZGVmYXVsdChmdW5jdGlvbihkKSB7IHJldHVybiBkLnZhbHVlczsgfSlcblxuICAucHJvcCgneCcpXG4gIC5zZXQoZDMuZnVuY3RvcilcbiAgLmRlZmF1bHQoZnVuY3Rpb24oZCkgeyByZXR1cm4gZC54OyB9KVxuXG4gIC5wcm9wKCd5JylcbiAgLnNldChkMy5mdW5jdG9yKVxuICAuZGVmYXVsdChmdW5jdGlvbihkKSB7IHJldHVybiBkLnk7IH0pXG5cbiAgLnByb3AoJ3hUaWNrRm9ybWF0JylcbiAgLmRlZmF1bHQobnVsbClcblxuICAucHJvcCgneFRpY2tzJylcbiAgLmRlZmF1bHQoOClcblxuICAucHJvcCgneUZvcm1hdCcpXG4gIC5kZWZhdWx0KGQzLmZvcm1hdCgnLDJzJykpXG5cbiAgLnByb3AoJ3lUaWNrcycpXG4gIC5kZWZhdWx0KDUpXG5cbiAgLnByb3AoJ3lUaWNrRm9ybWF0JylcbiAgLmRlZmF1bHQoZDMuZm9ybWF0KCcuMnMnKSlcblxuICAucHJvcCgneU1pbicpXG4gIC5zZXQoZDMuZnVuY3RvcilcbiAgLmRlZmF1bHQoZDMubWluKVxuXG4gIC5wcm9wKCd5TWF4JylcbiAgLnNldChkMy5mdW5jdG9yKVxuICAuZGVmYXVsdChkMy5tYXgpXG5cbiAgLnByb3AoJ25vbmUnKVxuICAuZGVmYXVsdCgwKVxuXG4gIC5wcm9wKCdjaGFydE1hcmdpbicpXG4gIC5kZWZhdWx0KHtcbiAgICB0b3A6IDEwLFxuICAgIGxlZnQ6IDM1LFxuICAgIHJpZ2h0OiAxNSxcbiAgICBib3R0b206IDIwXG4gIH0pXG5cbiAgLnByb3AoJ2NvbG9ycycpXG4gIC5wcm9wKCdjaGFydCcpXG4gIC5wcm9wKCdsZWdlbmQnKVxuXG4gIC5pbml0KGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuY29sb3JzKGQzLnNjYWxlLmNhdGVnb3J5MTAoKSk7XG4gIH0pXG5cbiAgLmRyYXcoZnVuY3Rpb24oZWwpIHtcbiAgICB2YXIgb3B0cyA9IHRoaXMucHJvcHMoKTtcbiAgICBub3JtYWxpemUoZWwsIG9wdHMpO1xuICAgIGRyYXdXaWRnZXQoZWwsIG9wdHMpO1xuICB9KTtcblxuXG5mdW5jdGlvbiBkcmF3V2lkZ2V0KGVsLCBvcHRzKSB7XG4gIGVsLmNsYXNzZWQoJ2xpbmVzIHdpZGdldCcsIHRydWUpO1xuXG4gIGlmICghb3B0cy5leHBsaWNpdENvbXBvbmVudHMpIGluaXRDb21wb25lbnRzKGVsKTtcblxuICB2YXIgY29tcG9uZW50ID0gZWwuc2VsZWN0KCdbZGF0YS13aWRnZXQtY29tcG9uZW50PVwidGl0bGVcIl0nKTtcbiAgaWYgKGNvbXBvbmVudC5zaXplKCkpIGNvbXBvbmVudC5jYWxsKGRyYXdUaXRsZSk7XG5cbiAgY29tcG9uZW50ID0gZWwuc2VsZWN0KCdbZGF0YS13aWRnZXQtY29tcG9uZW50PVwiY2hhcnRcIl0nKTtcbiAgaWYgKGNvbXBvbmVudC5zaXplKCkpIGNvbXBvbmVudC5kYXR1bShnZXRNZXRyaWNzKS5jYWxsKGRyYXdDaGFydCwgb3B0cyk7XG5cbiAgY29tcG9uZW50ID0gZWwuc2VsZWN0KCdbZGF0YS13aWRnZXQtY29tcG9uZW50PVwibGVnZW5kXCJdJyk7XG4gIGlmIChjb21wb25lbnQuc2l6ZSgpKSBjb21wb25lbnQuZGF0dW0oZ2V0TWV0cmljcykuY2FsbChkcmF3TGVnZW5kLCBvcHRzKTtcbn1cblxuXG5mdW5jdGlvbiBpbml0Q29tcG9uZW50cyhlbCkge1xuICBlbC5hcHBlbmQoJ2RpdicpXG4gICAgLmF0dHIoJ2RhdGEtd2lkZ2V0LWNvbXBvbmVudCcsICd0aXRsZScpO1xuXG4gIGVsLmFwcGVuZCgnZGl2JylcbiAgICAuYXR0cignZGF0YS13aWRnZXQtY29tcG9uZW50JywgJ2NoYXJ0Jyk7XG5cbiAgZWwuYXBwZW5kKCdkaXYnKVxuICAgIC5hdHRyKCdkYXRhLXdpZGdldC1jb21wb25lbnQnLCAnbGVnZW5kJyk7XG59XG5cblxuZnVuY3Rpb24gZHJhd1RpdGxlKHRpdGxlKSB7XG4gIHRpdGxlXG4gICAgLmNsYXNzZWQoJ3RpdGxlJywgdHJ1ZSlcbiAgICAudGV4dChmdW5jdGlvbihkKSB7IHJldHVybiBkLnRpdGxlOyB9KTtcbn1cblxuXG5mdW5jdGlvbiBkcmF3Q2hhcnQoY2hhcnQsIG9wdHMpIHtcbiAgY2hhcnRcbiAgICAuY2xhc3NlZCgnY2hhcnQnLCB0cnVlKTtcblxuICB2YXIgZGltcyA9IHV0aWxzLmJveCgpXG4gICAgLm1hcmdpbihvcHRzLmNoYXJ0TWFyZ2luKVxuICAgIC53aWR0aCh1dGlscy5pbm5lcldpZHRoKGNoYXJ0KSlcbiAgICAuaGVpZ2h0KHV0aWxzLmlubmVySGVpZ2h0KGNoYXJ0KSlcbiAgICAuY2FsYygpO1xuXG4gIHZhciBhbGxWYWx1ZXMgPSBjaGFydFxuICAgIC5kYXR1bSgpXG4gICAgLnJlZHVjZShmdW5jdGlvbihyZXN1bHRzLCBtZXRyaWMpIHtcbiAgICAgIHJlc3VsdHMucHVzaC5hcHBseShyZXN1bHRzLCBtZXRyaWMudmFsdWVzKTtcbiAgICAgIHJldHVybiByZXN1bHRzO1xuICAgIH0sIFtdKTtcblxuICB2YXIgZnggPSBkMy50aW1lLnNjYWxlKClcbiAgICAuZG9tYWluKGQzLmV4dGVudChhbGxWYWx1ZXMsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQueDsgfSkpXG4gICAgLnJhbmdlKFswLCBkaW1zLmlubmVyV2lkdGhdKTtcblxuICB2YXIgeXMgPSBhbGxWYWx1ZXNcbiAgICAubWFwKGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQueTsgfSk7XG5cbiAgdmFyIGZ5ID0gZDMuc2NhbGUubGluZWFyKClcbiAgICAuZG9tYWluKFtvcHRzLnlNaW4oeXMpLCBvcHRzLnlNYXgoeXMpXSlcbiAgICAucmFuZ2UoW2RpbXMuaW5uZXJIZWlnaHQsIDBdKTtcblxuICBjaGFydFxuICAgIC5maWx0ZXIodXRpbHMuaXNFbXB0eU5vZGUpXG4gICAgLmNhbGwoaW5pdENoYXJ0KTtcblxuICBjaGFydC5zZWxlY3QoJ3N2ZycpXG4gICAgLmNhbGwoZHJhd1N2ZywgZGltcywgZngsIGZ5LCBvcHRzKTtcbn1cblxuXG5mdW5jdGlvbiBpbml0Q2hhcnQoY2hhcnQpIHtcbiAgdmFyIHN2ZyA9IGNoYXJ0LmFwcGVuZCgnc3ZnJylcbiAgICAuYXBwZW5kKCdnJyk7XG5cbiAgc3ZnLmFwcGVuZCgnZycpXG4gICAgLmF0dHIoJ2NsYXNzJywgJ3ggYXhpcycpO1xuXG4gIHN2Zy5hcHBlbmQoJ2cnKVxuICAgIC5hdHRyKCdjbGFzcycsICd5IGF4aXMnKTtcblxuICBzdmcuYXBwZW5kKCdnJylcbiAgICAuYXR0cignY2xhc3MnLCAnbWV0cmljcycpO1xufVxuXG5cbmZ1bmN0aW9uIGRyYXdTdmcoc3ZnLCBkaW1zLCBmeCwgZnksIG9wdHMpIHtcbiAgc3ZnXG4gICAgLmF0dHIoJ3dpZHRoJywgZGltcy53aWR0aClcbiAgICAuYXR0cignaGVpZ2h0JywgZGltcy5oZWlnaHQpXG4gICAgLnNlbGVjdCgnZycpXG4gICAgICAuYXR0cigndHJhbnNmb3JtJywgdXRpbHMudHJhbnNsYXRlKGRpbXMubWFyZ2luLmxlZnQsIGRpbXMubWFyZ2luLnRvcCkpO1xuXG4gIHN2Zy5zZWxlY3QoJy5tZXRyaWNzJylcbiAgICAuY2FsbChkcmF3Q2hhcnRNZXRyaWNzLCBmeCwgZnkpO1xuXG4gIHN2Zy5zZWxlY3QoJy54LmF4aXMnKVxuICAgIC5jYWxsKGRyYXdYQXhpcywgZGltcywgZngsIG9wdHMpO1xuXG4gIHN2Zy5zZWxlY3QoJy55LmF4aXMnKVxuICAgIC5jYWxsKGRyYXdZQXhpcywgZGltcywgZnksIG9wdHMpO1xufVxuXG5cbmZ1bmN0aW9uIGRyYXdDaGFydE1ldHJpY3MobWV0cmljcywgZngsIGZ5KSB7XG4gIHZhciBsaW5lID0gZDMuc3ZnLmxpbmUoKVxuICAgIC54KGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGZ4KGQueCk7IH0pXG4gICAgLnkoZnVuY3Rpb24oZCkgeyByZXR1cm4gZnkoZC55KTsgfSk7XG5cbiAgbWV0cmljcy5zZWxlY3RBbGwoJy5tZXRyaWMnKVxuICAgIC5kYXRhKGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQ7IH0sXG4gICAgICAgICAgZnVuY3Rpb24oZCkgeyByZXR1cm4gZC5rZXk7IH0pXG4gICAgLmNhbGwoZHJhd0NoYXJ0TWV0cmljLCBmeCwgZnksIGxpbmUpO1xufVxuXG5cbmZ1bmN0aW9uIGRyYXdDaGFydE1ldHJpYyhtZXRyaWMsIGZ4LCBmeSwgbGluZSkge1xuICBtZXRyaWMuZW50ZXIoKS5hcHBlbmQoJ2cnKVxuICAgIC5hdHRyKCdjbGFzcycsICdtZXRyaWMnKVxuICAgIC5hdHRyKCdkYXRhLWtleScsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQua2V5OyB9KVxuICAgIC5hcHBlbmQoJ3BhdGgnKVxuICAgICAgLmF0dHIoJ2NsYXNzJywgJ2xpbmUnKTtcblxuICBtZXRyaWMuc2VsZWN0KCcubGluZScpXG4gICAgLmF0dHIoJ3N0cm9rZScsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQuY29sb3I7IH0pXG4gICAgLmF0dHIoJ2QnLCBmdW5jdGlvbihkKSB7IHJldHVybiBsaW5lKGQudmFsdWVzKTsgfSk7XG5cbiAgbWV0cmljLmV4aXQoKVxuICAgIC5yZW1vdmUoKTtcblxuICBtZXRyaWMuc2VsZWN0QWxsKCcuZG90JylcbiAgICAuZGF0YShmdW5jdGlvbihkKSB7XG4gICAgICBpZiAoIWQudmFsdWVzLmxlbmd0aCkgeyByZXR1cm4gW107IH1cbiAgICAgIHZhciBsYXN0ID0gZC52YWx1ZXNbZC52YWx1ZXMubGVuZ3RoIC0gMV07XG5cbiAgICAgIHJldHVybiBbe1xuICAgICAgICB4OiBsYXN0LngsXG4gICAgICAgIHk6IGxhc3QueSxcbiAgICAgICAgY29sb3I6IGQuY29sb3JcbiAgICAgIH1dO1xuICAgIH0pXG4gICAgLmNhbGwoZHJhd0RvdCwgZngsIGZ5KTtcbn1cblxuXG5mdW5jdGlvbiBkcmF3RG90KGRvdCwgZngsIGZ5KSB7XG4gIGRvdC5lbnRlcigpLmFwcGVuZCgnY2lyY2xlJylcbiAgICAuYXR0cignY2xhc3MnLCAnZG90JylcbiAgICAuYXR0cigncicsIDQpO1xuXG4gIGRvdFxuICAgIC5hdHRyKCdmaWxsJywgZnVuY3Rpb24oZCkgeyByZXR1cm4gZC5jb2xvcjsgfSlcbiAgICAuYXR0cignY3gnLCBmdW5jdGlvbihkKSB7IHJldHVybiBmeChkLngpOyB9KVxuICAgIC5hdHRyKCdjeScsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGZ5KGQueSk7IH0pO1xuXG4gIGRvdC5leGl0KClcbiAgICAucmVtb3ZlKCk7XG59XG5cblxuZnVuY3Rpb24gZHJhd1hBeGlzKGF4aXMsIGRpbXMsIGZ4LCBvcHRzKSB7XG4gIGF4aXNcbiAgICAuYXR0cigndHJhbnNmb3JtJywgdXRpbHMudHJhbnNsYXRlKDAsIGRpbXMuaW5uZXJIZWlnaHQpKVxuICAgIC5jYWxsKGQzLnN2Zy5heGlzKClcbiAgICAgIC5zY2FsZShmeClcbiAgICAgIC50aWNrUGFkZGluZyg4KVxuICAgICAgLnRpY2tzKG9wdHMueFRpY2tzKVxuICAgICAgLnRpY2tGb3JtYXQob3B0cy54VGlja0Zvcm1hdClcbiAgICAgIC50aWNrU2l6ZSgtZGltcy5pbm5lckhlaWdodCkpO1xufVxuXG5cbmZ1bmN0aW9uIGRyYXdZQXhpcyhheGlzLCBkaW1zLCBmeSwgb3B0cykge1xuICBheGlzLmNhbGwoZDMuc3ZnLmF4aXMoKVxuICAgIC5vcmllbnQoJ2xlZnQnKVxuICAgIC5zY2FsZShmeSlcbiAgICAudGlja1BhZGRpbmcoOClcbiAgICAudGlja3Mob3B0cy55VGlja3MpXG4gICAgLnRpY2tGb3JtYXQob3B0cy55VGlja0Zvcm1hdClcbiAgICAudGlja1NpemUoLWRpbXMuaW5uZXJXaWR0aCkpO1xufVxuXG5cbmZ1bmN0aW9uIGRyYXdMZWdlbmQobGVnZW5kLCBvcHRzKSB7XG4gIGxlZ2VuZFxuICAgIC5jbGFzc2VkKCdsZWdlbmQnLCB0cnVlKTtcblxuICBsZWdlbmRcbiAgICAuZmlsdGVyKHV0aWxzLmlzRW1wdHlOb2RlKVxuICAgIC5jYWxsKGluaXRMZWdlbmQpO1xuXG4gIGxlZ2VuZC5zZWxlY3QoJy50YWJsZScpLnNlbGVjdEFsbCgnLm1ldHJpYycpXG4gICAgLmRhdGEoZnVuY3Rpb24oZCkgeyByZXR1cm4gZDsgfSxcbiAgICAgICAgICBmdW5jdGlvbihkKSB7IHJldHVybiBkLmtleTsgfSlcbiAgICAuY2FsbChkcmF3TGVnZW5kTWV0cmljLCBvcHRzKTtcbn1cblxuXG5mdW5jdGlvbiBpbml0TGVnZW5kKGxlZ2VuZCkge1xuICBsZWdlbmQuYXBwZW5kKCd0YWJsZScpXG4gICAgLmF0dHIoJ2NsYXNzJywgJ3RhYmxlJyk7XG59XG5cblxuZnVuY3Rpb24gZHJhd0xlZ2VuZE1ldHJpYyhtZXRyaWMsIG9wdHMpIHtcbiAgdmFyIG5vbmUgPSBvcHRzLnlGb3JtYXQob3B0cy5ub25lKTtcblxuICBtZXRyaWMuZW50ZXIoKS5hcHBlbmQoJ3RyJylcbiAgICAuY2FsbChlbnRlckxlZ2VuZE1ldHJpYyk7XG5cbiAgbWV0cmljLnNlbGVjdCgnLnN3YXRjaCcpXG4gICAgLnN0eWxlKCdiYWNrZ3JvdW5kJywgZnVuY3Rpb24oZCkgeyByZXR1cm4gZC5jb2xvcjsgfSk7XG5cbiAgbWV0cmljLnNlbGVjdCgnLnRpdGxlJylcbiAgICAudGV4dChmdW5jdGlvbihkKSB7IHJldHVybiBkLnRpdGxlOyB9KTtcblxuICBtZXRyaWMuc2VsZWN0KCcudmFsdWUnKVxuICAgIC50ZXh0KGZ1bmN0aW9uKGQpIHtcbiAgICAgIGQgPSBkLnZhbHVlc1tkLnZhbHVlcy5sZW5ndGggLSAxXTtcblxuICAgICAgcmV0dXJuIGRcbiAgICAgICAgPyBvcHRzLnlGb3JtYXQoZC55KVxuICAgICAgICA6IG5vbmU7XG4gICAgfSk7XG5cbiAgbWV0cmljLmV4aXQoKVxuICAgIC5yZW1vdmUoKTtcbn1cblxuXG5mdW5jdGlvbiBlbnRlckxlZ2VuZE1ldHJpYyhtZXRyaWMpIHtcbiAgbWV0cmljXG4gICAgLmF0dHIoJ2RhdGEta2V5JywgZnVuY3Rpb24oZCkgeyByZXR1cm4gZC5rZXk7IH0pXG4gICAgLmF0dHIoJ2NsYXNzJywgJ21ldHJpYycpO1xuXG4gIG1ldHJpYy5hcHBlbmQoJ3RkJylcbiAgICAuYXR0cignY2xhc3MnLCAnc3dhdGNoJyk7XG5cbiAgbWV0cmljLmFwcGVuZCgndGQnKVxuICAgIC5hdHRyKCdjbGFzcycsICd0aXRsZScpO1xuXG4gIG1ldHJpYy5hcHBlbmQoJ3RkJylcbiAgICAuYXR0cignY2xhc3MnLCAndmFsdWUnKTtcbn1cblxuXG5mdW5jdGlvbiBub3JtYWxpemUoZWwsIG9wdHMpIHtcbiAgdmFyIG5vZGUgPSBlbC5ub2RlKCk7XG5cbiAgZWwuZGF0dW0oZnVuY3Rpb24oZCwgaSkge1xuICAgIHZhciB0aXRsZSA9IG9wdHMudGl0bGUuY2FsbChub2RlLCBkLCBpKTtcblxuICAgIHJldHVybiB7XG4gICAgICB0aXRsZTogdGl0bGUsXG4gICAgICBtZXRyaWNzOiBvcHRzLm1ldHJpY3MuY2FsbChub2RlLCBkLCBpKS5tYXAobWV0cmljKVxuICAgIH07XG4gIH0pO1xuXG4gIGZ1bmN0aW9uIG1ldHJpYyhkLCBpKSB7XG4gICAgdmFyIGtleSA9IG9wdHMua2V5XG4gICAgICAuY2FsbChub2RlLCBkLCBpKVxuICAgICAgLnRvU3RyaW5nKCk7XG5cbiAgICByZXR1cm4ge1xuICAgICAga2V5OiBrZXksXG4gICAgICBjb2xvcjogb3B0cy5jb2xvcnMoa2V5KSxcbiAgICAgIHRpdGxlOiBvcHRzLm1ldHJpY1RpdGxlLmNhbGwobm9kZSwgZCwgaSksXG4gICAgICB2YWx1ZXM6IG9wdHMudmFsdWVzLmNhbGwobm9kZSwgZCwgaSkubWFwKHZhbHVlKVxuICAgIH07XG4gIH1cblxuICBmdW5jdGlvbiB2YWx1ZShkLCBpKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHg6IG9wdHMueC5jYWxsKG5vZGUsIGQsIGkpLFxuICAgICAgeTogb3B0cy55LmNhbGwobm9kZSwgZCwgaSlcbiAgICB9O1xuICB9XG59XG5cblxuZnVuY3Rpb24gZ2V0TWV0cmljcyhkKSB7XG4gIHJldHVybiBkLm1ldHJpY3M7XG59XG4iLCJ2YXIgdXRpbHMgPSByZXF1aXJlKCcuLi91dGlscycpO1xuXG5cbm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSgnLi93aWRnZXQnKS5leHRlbmQoKVxuICAucHJvcCgnY29sb3JzJylcblxuICAucHJvcCgndGl0bGUnKVxuICAuc2V0KGQzLmZ1bmN0b3IpXG4gIC5kZWZhdWx0KGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQudGl0bGU7IH0pXG5cbiAgLnByb3AoJ21ldHJpY3MnKVxuICAuc2V0KGQzLmZ1bmN0b3IpXG4gIC5kZWZhdWx0KGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQubWV0cmljczsgfSlcblxuICAucHJvcCgna2V5JylcbiAgLnNldChkMy5mdW5jdG9yKVxuICAuZGVmYXVsdChmdW5jdGlvbihkLCBpKSB7IHJldHVybiBpOyB9KVxuXG4gIC5wcm9wKCdtZXRyaWNUaXRsZScpXG4gIC5zZXQoZDMuZnVuY3RvcilcbiAgLmRlZmF1bHQoZnVuY3Rpb24oZCkgeyByZXR1cm4gZC50aXRsZTsgfSlcblxuICAucHJvcCgndmFsdWUnKVxuICAuc2V0KGQzLmZ1bmN0b3IpXG4gIC5kZWZhdWx0KGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQudmFsdWU7IH0pXG5cbiAgLnByb3AoJ2NoYXJ0TWFyZ2luJylcbiAgLmRlZmF1bHQoe1xuICAgIHRvcDogMjAsXG4gICAgbGVmdDogMjAsXG4gICAgcmlnaHQ6IDIwLFxuICAgIGJvdHRvbTogMjBcbiAgfSlcblxuICAucHJvcCgnaW5uZXJSYWRpdXMnKVxuICAuc2V0KGQzLmZ1bmN0b3IpXG4gIC5kZWZhdWx0KDApXG5cbiAgLnByb3AoJ3ZhbHVlRm9ybWF0JylcbiAgLmRlZmF1bHQoZDMuZm9ybWF0KCcsMnMnKSlcblxuICAucHJvcCgncGVyY2VudEZvcm1hdCcpXG4gIC5kZWZhdWx0KGQzLmZvcm1hdCgnLjAlJykpXG5cbiAgLmluaXQoZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5jb2xvcnMoZDMuc2NhbGUuY2F0ZWdvcnkxMCgpKTtcbiAgfSlcblxuICAuZHJhdyhmdW5jdGlvbihlbCkge1xuICAgIHZhciBvcHRzID0gdGhpcy5wcm9wcygpO1xuICAgIG5vcm1hbGl6ZShlbCwgb3B0cyk7XG4gICAgZHJhd1dpZGdldChlbCwgb3B0cyk7XG4gIH0pO1xuXG5cbmZ1bmN0aW9uIGRyYXdXaWRnZXQoZWwsIG9wdHMpIHtcbiAgZWwuY2xhc3NlZCgncGllIHdpZGdldCcsIHRydWUpO1xuXG4gIGlmICghb3B0cy5leHBsaWNpdENvbXBvbmVudHMpIGluaXRDb21wb25lbnRzKGVsKTtcblxuICB2YXIgY29tcG9uZW50ID0gZWwuc2VsZWN0KCdbZGF0YS13aWRnZXQtY29tcG9uZW50PVwidGl0bGVcIl0nKTtcbiAgaWYgKGNvbXBvbmVudC5zaXplKCkpIGNvbXBvbmVudC5jYWxsKGRyYXdUaXRsZSk7XG5cbiAgY29tcG9uZW50ID0gZWwuc2VsZWN0KCdbZGF0YS13aWRnZXQtY29tcG9uZW50PVwiY2hhcnRcIl0nKTtcbiAgaWYgKGNvbXBvbmVudC5zaXplKCkpIGNvbXBvbmVudC5kYXR1bShnZXRNZXRyaWNzKS5jYWxsKGRyYXdDaGFydCwgb3B0cyk7XG5cbiAgY29tcG9uZW50ID0gZWwuc2VsZWN0KCdbZGF0YS13aWRnZXQtY29tcG9uZW50PVwibGVnZW5kXCJdJyk7XG4gIGlmIChjb21wb25lbnQuc2l6ZSgpKSBjb21wb25lbnQuZGF0dW0oZ2V0TWV0cmljcykuY2FsbChkcmF3TGVnZW5kLCBvcHRzKTtcbn1cblxuXG5mdW5jdGlvbiBpbml0Q29tcG9uZW50cyhlbCkge1xuICBlbC5hcHBlbmQoJ2RpdicpXG4gICAgLmF0dHIoJ2RhdGEtd2lkZ2V0LWNvbXBvbmVudCcsICd0aXRsZScpO1xuXG4gIGVsLmFwcGVuZCgnZGl2JylcbiAgICAuYXR0cignZGF0YS13aWRnZXQtY29tcG9uZW50JywgJ2NoYXJ0Jyk7XG5cbiAgZWwuYXBwZW5kKCdkaXYnKVxuICAgIC5hdHRyKCdkYXRhLXdpZGdldC1jb21wb25lbnQnLCAnbGVnZW5kJyk7XG59XG5cblxuZnVuY3Rpb24gZHJhd1RpdGxlKHRpdGxlKSB7XG4gIHRpdGxlXG4gICAgLmNsYXNzZWQoJ3RpdGxlJywgdHJ1ZSlcbiAgICAudGV4dChmdW5jdGlvbihkKSB7IHJldHVybiBkLnRpdGxlOyB9KTtcbn1cblxuXG5mdW5jdGlvbiBkcmF3Q2hhcnQoY2hhcnQsIG9wdHMpIHtcbiAgY2hhcnRcbiAgICAuY2xhc3NlZCgnY2hhcnQnLCB0cnVlKTtcblxuICBjaGFydFxuICAgIC5maWx0ZXIodXRpbHMuaXNFbXB0eU5vZGUpXG4gICAgLmNhbGwoaW5pdENoYXJ0KTtcblxuICB2YXIgZGltcyA9IHV0aWxzLmJveCgpXG4gICAgLm1hcmdpbihvcHRzLmNoYXJ0TWFyZ2luKVxuICAgIC53aWR0aCh1dGlscy5pbm5lcldpZHRoKGNoYXJ0KSlcbiAgICAuaGVpZ2h0KHV0aWxzLmlubmVySGVpZ2h0KGNoYXJ0KSlcbiAgICAuY2FsYygpO1xuXG4gIGRpbXMucmFkaXVzID0gTWF0aC5taW4oZGltcy5pbm5lcldpZHRoLCBkaW1zLmlubmVySGVpZ2h0KSAvIDI7XG5cbiAgY2hhcnQuc2VsZWN0KCdzdmcnKVxuICAgIC5jYWxsKGRyYXdTdmcsIGRpbXMsIG9wdHMpO1xufVxuXG5cbmZ1bmN0aW9uIGluaXRDaGFydChjaGFydCkge1xuICBjaGFydC5hcHBlbmQoJ3N2ZycpXG4gICAgLmFwcGVuZCgnZycpO1xufVxuXG5cbmZ1bmN0aW9uIGRyYXdTdmcoc3ZnLCBkaW1zLCBvcHRzKSB7XG4gIHN2Z1xuICAgIC5hdHRyKCd3aWR0aCcsIGRpbXMud2lkdGgpXG4gICAgLmF0dHIoJ2hlaWdodCcsIGRpbXMuaGVpZ2h0KVxuICAgIC5zZWxlY3QoJ2cnKVxuICAgICAgLmF0dHIoJ3RyYW5zZm9ybScsIHV0aWxzLnRyYW5zbGF0ZShcbiAgICAgICAgKGRpbXMud2lkdGggLyAyKSAtIGRpbXMucmFkaXVzLFxuICAgICAgICAoZGltcy5oZWlnaHQgLyAyKSAtIGRpbXMucmFkaXVzKSlcbiAgICAgIC5jYWxsKGRyYXdTbGljZXMsIGRpbXMsIG9wdHMpO1xufVxuXG5cbmZ1bmN0aW9uIGRyYXdTbGljZXMoc3ZnLCBkaW1zLCBvcHRzKSB7XG4gIHZhciBhcmMgPSBkMy5zdmcuYXJjKClcbiAgICAuaW5uZXJSYWRpdXMob3B0cy5pbm5lclJhZGl1cyhkaW1zLnJhZGl1cykpXG4gICAgLm91dGVyUmFkaXVzKGRpbXMucmFkaXVzKTtcblxuICB2YXIgbGF5b3V0ID0gZDMubGF5b3V0LnBpZSgpXG4gICAgLnZhbHVlKGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQudmFsdWU7IH0pO1xuXG4gIHN2Zy5zZWxlY3RBbGwoJy5zbGljZScpXG4gICAgLmRhdGEoZnVuY3Rpb24oZCkgeyByZXR1cm4gbGF5b3V0KGQpOyB9LFxuICAgICAgICAgIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQuZGF0YS5rZXk7IH0pXG4gICAgLmNhbGwoZHJhd1NsaWNlLCBkaW1zLCBhcmMsIG9wdHMpO1xufVxuXG5cbmZ1bmN0aW9uIGRyYXdTbGljZShzbGljZSwgZGltcywgYXJjLCBvcHRzKSB7XG4gIHNsaWNlLmVudGVyKCkuYXBwZW5kKCdnJylcbiAgICAuYXR0cignY2xhc3MnLCAnc2xpY2UnKVxuICAgIC5hcHBlbmQoJ3BhdGgnKTtcblxuICBzbGljZVxuICAgIC5hdHRyKCd0cmFuc2Zvcm0nLCB1dGlscy50cmFuc2xhdGUoZGltcy5yYWRpdXMsIGRpbXMucmFkaXVzKSk7XG5cbiAgc2xpY2Uuc2VsZWN0KCdwYXRoJylcbiAgICAuYXR0cignZCcsIGFyYylcbiAgICAuc3R5bGUoJ2ZpbGwnLCBmdW5jdGlvbihkKSB7IHJldHVybiBkLmRhdGEuY29sb3I7IH0pO1xuXG4gIHNsaWNlLmV4aXQoKVxuICAgIC5yZW1vdmUoKTtcbn1cblxuXG5mdW5jdGlvbiBkcmF3TGVnZW5kKGxlZ2VuZCwgb3B0cykge1xuICBsZWdlbmRcbiAgICAuY2xhc3NlZCgnbGVnZW5kJywgdHJ1ZSk7XG5cbiAgbGVnZW5kXG4gICAgLmZpbHRlcih1dGlscy5pc0VtcHR5Tm9kZSlcbiAgICAuY2FsbChpbml0TGVnZW5kKTtcblxuICBsZWdlbmQuc2VsZWN0KCcudGFibGUnKS5zZWxlY3RBbGwoJy5tZXRyaWMnKVxuICAgIC5kYXRhKGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQ7IH0sXG4gICAgICAgICAgZnVuY3Rpb24oZCkgeyByZXR1cm4gZC5rZXk7IH0pXG4gICAgLmNhbGwoZHJhd0xlZ2VuZE1ldHJpYywgb3B0cyk7XG59XG5cblxuZnVuY3Rpb24gaW5pdExlZ2VuZChsZWdlbmQpIHtcbiAgbGVnZW5kLmFwcGVuZCgndGFibGUnKVxuICAgIC5hdHRyKCdjbGFzcycsICd0YWJsZScpO1xufVxuXG5cbmZ1bmN0aW9uIGRyYXdMZWdlbmRNZXRyaWMobWV0cmljLCBvcHRzKSB7XG4gIG1ldHJpYy5lbnRlcigpLmFwcGVuZCgndHInKVxuICAgIC5jYWxsKGVudGVyTGVnZW5kTWV0cmljKTtcblxuICBtZXRyaWMuc2VsZWN0KCcuc3dhdGNoJylcbiAgICAuc3R5bGUoJ2JhY2tncm91bmQnLCBmdW5jdGlvbihkKSB7IHJldHVybiBkLmNvbG9yOyB9KTtcblxuICBtZXRyaWMuc2VsZWN0KCcudGl0bGUnKVxuICAgIC50ZXh0KGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQudGl0bGU7IH0pO1xuXG4gIG1ldHJpYy5zZWxlY3QoJy5wZXJjZW50JylcbiAgICAudGV4dChmdW5jdGlvbihkKSB7IHJldHVybiBvcHRzLnBlcmNlbnRGb3JtYXQoZC5wZXJjZW50KTsgfSk7XG5cbiAgbWV0cmljLnNlbGVjdCgnLnZhbHVlJylcbiAgICAudGV4dChmdW5jdGlvbihkKSB7IHJldHVybiBvcHRzLnZhbHVlRm9ybWF0KGQudmFsdWUpOyB9KTtcblxuICBtZXRyaWMuZXhpdCgpXG4gICAgLnJlbW92ZSgpO1xufVxuXG5cbmZ1bmN0aW9uIGVudGVyTGVnZW5kTWV0cmljKG1ldHJpYykge1xuICBtZXRyaWNcbiAgICAuYXR0cignY2xhc3MnLCAnbWV0cmljJyk7XG5cbiAgbWV0cmljLmFwcGVuZCgndGQnKVxuICAgIC5hdHRyKCdjbGFzcycsICdzd2F0Y2gnKTtcblxuICBtZXRyaWMuYXBwZW5kKCd0ZCcpXG4gICAgLmF0dHIoJ2NsYXNzJywgJ3RpdGxlJyk7XG5cbiAgbWV0cmljLmFwcGVuZCgndGQnKVxuICAgIC5hdHRyKCdjbGFzcycsICdwZXJjZW50Jyk7XG5cbiAgbWV0cmljLmFwcGVuZCgndGQnKVxuICAgIC5hdHRyKCdjbGFzcycsICd2YWx1ZScpO1xufVxuXG5cbmZ1bmN0aW9uIG5vcm1hbGl6ZShlbCwgb3B0cykge1xuICB2YXIgbm9kZSA9IGVsLm5vZGUoKTtcblxuICBlbC5kYXR1bShmdW5jdGlvbihkLCBpKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHRpdGxlOiBvcHRzLnRpdGxlLmNhbGwobm9kZSwgZCwgaSksXG4gICAgICBtZXRyaWNzOiBvcHRzLm1ldHJpY3MuY2FsbChub2RlLCBkLCBpKS5tYXAobWV0cmljKVxuICAgIH07XG4gIH0pO1xuXG4gIGZ1bmN0aW9uIG1ldHJpYyhkLCBpKSB7XG4gICAgdmFyIGtleSA9IG9wdHMua2V5XG4gICAgICAuY2FsbChub2RlLCBkLCBpKVxuICAgICAgLnRvU3RyaW5nKCk7XG5cbiAgICByZXR1cm4ge1xuICAgICAga2V5OiBrZXksXG4gICAgICBjb2xvcjogb3B0cy5jb2xvcnMoa2V5KSxcbiAgICAgIHRpdGxlOiBvcHRzLm1ldHJpY1RpdGxlLmNhbGwobm9kZSwgZCwgaSksXG4gICAgICB2YWx1ZTogb3B0cy52YWx1ZS5jYWxsKG5vZGUsIGQsIGkpXG4gICAgfTtcbiAgfVxuXG4gIHZhciBzdW0gPSBkMy5zdW0oZWwuZGF0dW0oKS5tZXRyaWNzLCBmdW5jdGlvbihkKSB7IHJldHVybiBkLnZhbHVlOyB9KTtcbiAgZWwuZGF0dW0oKS5tZXRyaWNzLmZvckVhY2goZnVuY3Rpb24oZCkgeyBkLnBlcmNlbnQgPSBkLnZhbHVlIC8gc3VtOyB9KTtcbn1cblxuXG5mdW5jdGlvbiBnZXRNZXRyaWNzKGQpIHtcbiAgcmV0dXJuIGQubWV0cmljcztcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSgnLi4vdmlldycpLmV4dGVuZCgpXG4gIC5wcm9wKCdleHBsaWNpdENvbXBvbmVudHMnKVxuICAuZGVmYXVsdChmYWxzZSk7XG4iXX0=
(1)
});
