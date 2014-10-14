!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.sapphire=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
var utils = _dereq_('./utils');
var layout = _dereq_('./grid');
var widgets = _dereq_('./widgets');


module.exports = _dereq_('./view').extend()
  .prop('scale')
  .default(100)

  .prop('types')

  .prop('title')
  .set(d3.functor)
  .default(function(d) { return d.title; })

  .prop('key')
  .set(d3.functor)
  .default(function(d, i) { return i; })

  .prop('type')
  .set(d3.functor)
  .default(function(d) { return d.type; })

  .prop('widgets')
  .set(d3.functor)
  .default(function(d) { return d.widgets; })

  .prop('col')
  .set(d3.functor)
  .default(function(d) {
    return utils.access(d, 'col');
  })

  .prop('row')
  .set(d3.functor)
  .default(function(d) {
    return utils.access(d, 'row');
  })

  .prop('colspan')
  .set(d3.functor)
  .default(function(d) {
    return utils.access(d, 'colspan');
  })

  .prop('rowspan')
  .set(d3.functor)
  .default(function(d) {
    return utils.access(d, 'rowspan');
  })

  .prop('numcols')
  .default(8)

  .prop('padding')
  .default(5)

  .init(function() {
    var types = d3.map();

    d3.keys(widgets).forEach(function(k) {
      types.set(k, widgets[k].new());
    });

    this.types(types);
  })

  .enter(function(el) {
    el.attr('class', 'dashboard')
      .append('div')
        .attr('class', 'widgets');
  })

  .meth('normalize', function(el) {
    var self = this;
    var node = el.node();

    el.datum(function(d, i) {
      return {
        title: self.title()
          .call(node, d, i),
        widgets: self.widgets()
          .call(node, d, i)
          .map(widgetDatum)
      };
    });

    function widgetDatum(d, i) {
      var typename = self.type().call(node, d, i);
      var type = self.types().get(typename);

      if (!type) {
        throw new Error("Unrecognised dashboard widget type '" + typename + "'");
      }

      var colspan = self.colspan().call(node, d, i);
      colspan = utils.ensure(colspan, type.colspan());
      var rowspan = self.rowspan().call(node, d, i);
      rowspan = utils.ensure(rowspan, type.rowspan());

      return {
        data: d,
        type: type,
        colspan: colspan,
        rowspan: rowspan,
        key: self.key().call(node, d, i),
        col: self.col().call(node, d, i),
        row: self.row().call(node, d, i)
      };
    }
  })

  .draw(function(el) {
    this.normalize(el);
    var widgetData = el.datum().widgets;

    this.types()
      .forEach(function(name, type) {
        type.width(widgetWidth);
        type.height(widgetHeight);
      });

    var grid = layout()
      .scale(this.scale())
      .numcols(this.numcols())
      .padding(this.padding())
      .col(function(d) { return d.col; })
      .row(function(d) { return d.row; })
      .colspan(function(d) { return d.colspan; })
      .rowspan(function(d) { return d.rowspan; });
    
    el.style('width', utils.px(grid.scale() * grid.numcols()));

    var widget = el.select('.widgets').selectAll('.widget')
      .data(widgetData, function(d) { return d.key; });

    widget.enter().append('div');
    utils.meta(widget, function(d) { return d; });

    widget
      .classed('widget', true)
      .each(function(d) {
        var widgetEl = d3.select(this)
          .datum(d.data)
          .call(d.type);

        var width = parseInt(widgetEl.style('width'));
        d.colspan = Math.max(d.colspan, grid.lengthSpan(width));

        var height = parseInt(widgetEl.style('height'));
        d.rowspan = Math.max(d.rowspan, grid.lengthSpan(height));
      });

    var gridEls = grid(widgetData);

    widget
      .style('left', utils.px(function(d, i) { return gridEls[i].x; }))
      .style('top', utils.px(function(d, i) { return gridEls[i].y; }));

    widget.exit().remove();

    function widgetWidth() {
      return grid.spanLength(utils.meta(this).colspan);
    }

    function widgetHeight() {
      return grid.spanLength(utils.meta(this).rowspan);
    }
  });

},{"./grid":2,"./utils":4,"./view":5,"./widgets":7}],2:[function(_dereq_,module,exports){
var utils = _dereq_('./utils');


var grid = module.exports = strain()
  .prop('col')
  .set(d3.functor)
  .default(function(d) {
    return utils.access(d, 'col');
  })

  .prop('row')
  .set(d3.functor)
  .default(function(d) {
    return utils.access(d, 'row');
  })

  .prop('numcols')
  .default(8)

  .prop('scale')
  .default(10)

  .prop('padding')
  .default(5)

  .prop('colspan')
  .set(d3.functor)
  .default(function(d) {
    return utils.access(d, 'colspan', 1);
  })

  .prop('rowspan')
  .set(d3.functor)
  .default(function(d) {
    return utils.access(d, 'rowspan', 1);
  })

  .invoke(function(data) {
    var self = this;
    var best = counter().numcols(this.numcols());

    data = (data || [])
      .map(function(d, i) {
        return {
          data: d,
          col: self.col().call(self, d, i), 
          row: self.row().call(self, d, i),
          rowspan: self.rowspan().call(self, d, i),
          colspan: self.colspan().call(self, d, i)
        };
      })
      .map(best);

    var quadtree = d3.geom.quadtree()
      .x(function(d) { return d.col; })
      .y(function(d) { return d.row; });

    var root = quadtree(data);

    data.forEach(function(d) {
      root.visit(grid.uncollide(d));
      d.x = self.indexOffset(d.col);
      d.y = self.indexOffset(d.row);
      d.width = self.spanLength(d.colspan);
      d.height = self.spanLength(d.rowspan);
    });

    return data;
  })

  .meth('indexOffset', function(index) {
    return (index * this.scale()) + this.padding();
  })

  .meth('spanLength', function(span) {
    return (span * this.scale()) - (this.padding() * 2);
  })

  .meth('offsetIndex', function(offset) {
    return Math.ceil((offset - this.padding()) / this.scale());
  })

  .meth('lengthSpan', function(len) {
    return Math.ceil((len + (this.padding() * 2)) / this.scale());
  })

  .static('box', function(d) {
    return {
      x1: d.col,
      x2: d.col + d.colspan - 1,
      y1: d.row,
      y2: d.row + d.rowspan - 1
    };
  })

  .static('uncollide', function(a) {
    var boxA = grid.box(a);
    
    return function(node, x1, y1, x2, y2) {
      var b = node.point;

      if (b && a !== b && grid.intersection(boxA, grid.box(b))) {
        b.row = boxA.y2 + 1;
      }

      return !grid.intersection(boxA, {
        x1: x1, 
        y1: y1, 
        x2: x2,
        y2: y2
      });
    };
  })

  .static('intersection', function(a, b) {
    return ((a.x1 <= b.x1 && b.x1 <= a.x2) && (a.y1 <= b.y1 && b.y1 <= a.y2))
        || ((b.x1 <= a.x1 && a.x1 <= b.x2) && (b.y1 <= a.y1 && a.y1 <= b.y2))
        || ((a.x1 <= b.x2 && b.x2 <= a.x2) && (a.y1 <= b.y1 && b.y1 <= a.y2))
        || ((b.x1 <= a.x2 && a.x2 <= b.x2) && (b.y1 <= a.y1 && a.y1 <= b.y2));
  });


var counter = strain()
  .prop('numcols')

  .prop('rowspan')
  .default(0)

  .prop('col')
  .default(0)

  .prop('row')
  .default(0)

  .invoke(function(d) {
    d.col = utils.ensure(d.col, this.col());
    d.row = utils.ensure(d.row, this.row());

    if (d.col + d.colspan > this.numcols()) {
      d.col = 0;
      d.row += this.rowspan();
      this.rowspan(0);
    }

    this
      .col(d.col + d.colspan)
      .row(d.row)
      .rowspan(Math.max(this.rowspan(), d.rowspan));

    return d;
  });

},{"./utils":4}],3:[function(_dereq_,module,exports){
exports.utils = _dereq_('./utils');
exports.view = _dereq_('./view');
exports.grid = _dereq_('./grid');
exports.widgets = _dereq_('./widgets');
exports.dashboard = _dereq_('./dashboard');

},{"./dashboard":1,"./grid":2,"./utils":4,"./view":5,"./widgets":7}],4:[function(_dereq_,module,exports){
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


utils.meta = function(el, fn) {
  el = utils.ensureEl(el);

  return arguments.length > 1
    ? el.property('__sapphire_meta__', fn)
    : el.property('__sapphire_meta__');
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

},{}],5:[function(_dereq_,module,exports){
module.exports = strain()
  .static('draw', function(fn) {
    this.meth('_draw_', fn);
  })
  .draw(function() {})

  .static('enter', function(fn) {
    this.meth('_enter_', fn);
  })
  .enter(function() {})

  .meth('draw', function(el) {
    var datum;
    el = sapphire.utils.ensureEl(el);

    if (el.node()) {
      datum = el.datum();
    }

    if (el.node() && !el.node().hasChildNodes()) {
      this.enter.apply(this, arguments);
    }

    var parent = this._type_._super_.prototype;
    if ('_draw_' in parent) {
      parent._draw_.apply(this, arguments);
    }

    this._draw_.apply(this, arguments);

    if (typeof datum != 'undefined') {
      el.datum(datum);
    }
  })

  .meth('enter', function(el) {
    el = sapphire.utils.ensureEl(el);

    var parent = this._type_._super_.prototype;
    if ('_enter_' in parent) {
      parent._enter_.apply(this, arguments);
    }

    this._enter_.apply(this, arguments);
  })

  .invoke(function() {
    return this.draw.apply(this, arguments);
  });

},{}],6:[function(_dereq_,module,exports){
var utils = _dereq_('../utils');


module.exports = _dereq_('./widget').extend()
  .prop('width')
  .default(400)

  .prop('colspan')
  .default(4)

  .prop('rowspan')
  .default(2)

  .prop('height')
  .default(200)

  .prop('barPadding')
  .default(2.5)

  .prop('margin')
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

  .meth('normalize', function(el) {
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
        dx: self.dx().call(node, d, i),
        width: self.width().call(node, d, i),
        height: self.height().call(node, d, i)
      };
    }
  })

  .enter(function(el) {
    el.attr('class', 'bars widget');

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

    el.style('width', utils.px(this.width()))
      .style('height', utils.px(this.height()));

    el.select('.widget .title')
      .text(function(d) { return d.title; });

    var chart = el.select('.chart')
      .datum(function(d) { return d.values; });

    var fx = d3.time.scale()
      .domain([
        d3.min(chart.datum(), function(d) { return d.x; }),
        d3.max(chart.datum(), function(d) { return d.x + d.dx; })]);

    var ys = chart.datum()
      .map(function(d) { return d.y; });

    var fy = d3.scale.linear()
      .domain([0, this.yMax()(ys)]);

    var dims = utils.box()
      .width(utils.innerWidth(chart))
      .height(utils.innerHeight(chart))
      .margin(this.margin())
      .calc();

    chart
      .style('width', utils.px(dims.width))
      .style('height', utils.px(dims.height));

    fx.range([0, dims.innerWidth]);
    fy.range([dims.innerHeight, 0]);

    var svg = chart.select('svg')
      .attr('width', dims.width)
      .attr('height', dims.height)
      .select('g')
        .attr('transform', utils.translate(
          dims.margin.left,
          dims.margin.top));

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
        width -= self.barPadding();
        return Math.max(width, 1);
      })
      .attr('height', function(d) {
        return dims.innerHeight - fy(d.y); 
      });

    bar.exit()
      .remove();

    var axis = d3.svg.axis()
      .scale(fx)
      .ticks(this.xTicks())
      .tickFormat(this.xTickFormat());

    svg.select('.x.axis')
      .attr('transform', utils.translate(0, dims.innerHeight))
      .call(axis);

    axis = d3.svg.axis()
      .orient('left')
      .scale(fy)
      .tickPadding(8)
      .tickSize(-dims.innerWidth)
      .ticks(this.yTicks())
      .tickFormat(this.yTickFormat());
    
    svg.select('.y.axis')
      .call(axis);
  });

},{"../utils":4,"./widget":11}],7:[function(_dereq_,module,exports){
exports.pie = _dereq_('./pie');
exports.bars = _dereq_('./bars');
exports.last = _dereq_('./last');
exports.lines = _dereq_('./lines');
exports.widget = _dereq_('./widget');

},{"./bars":6,"./last":8,"./lines":9,"./pie":10,"./widget":11}],8:[function(_dereq_,module,exports){
var utils = _dereq_('../utils');


module.exports = _dereq_('./widget').extend()
  .prop('width')
  .default(400)

  .prop('colspan')
  .default(4)

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

  .prop('sparkline')
  .prop('summary')

  .init(function() {
    this.sparkline(sparkline(this));
    this.summary(summary(this));
  })

  .enter(function(el) {
    el.attr('class', 'last widget');

    el.append('div')
      .attr('class', 'title');

    var values = el.append('div')
      .attr('class', 'values');

    values.append('div')
      .attr('class', 'last value');

    values.append('div')
      .attr('class', 'sparkline');

    values.append('div')
      .attr('class', 'summary');
  })

  .draw(function(el) {
    var self = this;
    var node = el.node();

    el.style('width', utils.px(this.width()));

    el.select('.title')
      .text(function(d, i) {
        return self.title().call(node, d, i);
      });

    var values = el.select('.values')
      .datum(function(d, i) {
        return self.values()
          .call(node, d, i)
          .map(function(d, i) {
            return {
              x: self.x().call(node, d, i),
              y: self.y().call(node, d, i)
            };
          });
      })
      .attr('class', function(d) {
        d = d.slice(-2);

        d = d.length > 1
          ? d[1].y - d[0].y
          : 0;

        if (d > 0) { return 'good values'; }
        if (d < 0) { return 'bad values'; }
        return 'neutral values';
      });

    values.select('.last.value')
      .datum(function(d, i) {
        d = d[d.length - 1];

        return !d
          ? self.none()
          : d.y;
      })
      .text(this.yFormat());

    values.select('.sparkline')
      .call(this.sparkline());

    values.select('.summary')
      .call(this.summary());
  });


var summary = _dereq_('../view').extend()
  .prop('widget')

  .init(function(widget) {
    this.widget(widget);
  })

  .enter(function(el) {
    el.append('span')
      .attr('class', 'diff');

    el.append('span')
      .attr('class', 'time');
  })

  .draw(function(el) {
    var widget = this.widget();

    if (el.datum().length < this.widget().summaryLimit()) {
      el.style('height', 0);
      return;
    }

    el.select('.diff')
      .datum(function(d) {
        d = d.slice(-2);
        return d[1].y - d[0].y;
      })
      .text(widget.diffFormat());

    el.select('.time')
      .datum(function(d) {
        d = d.slice(-2);

        return [d[0].x, d[1].x]
          .map(utils.date)
          .map(widget.xFormat());
      })
      .text(function(d) {
        return [' from', d[0], 'to', d[1]].join(' ');
      });
  });


var sparkline = _dereq_('../view').extend()
  .prop('widget')

  .prop('height')
  .default(25)

  .prop('margin')
  .default({
    top: 4,
    left: 4,
    bottom: 4,
    right: 4 
  })

  .init(function(widget) {
    this.widget(widget);
  })

  .enter(function(el) {
    var svg = el.append('svg')
      .append('g');

    svg.append('path')
      .attr('class', 'rest path');

    svg.append('path')
      .attr('class', 'diff path');
  })

  .draw(function(el) {
    if (el.datum().length < this.widget().sparklineLimit()) {
      el.style('height', 0);
      return;
    }

    var dims = utils.box()
      .margin(this.margin())
      .width(utils.innerWidth(el))
      .height(this.height())
      .calc();

    var fx = d3.scale.linear()
      .domain(d3.extent(el.datum(), function(d) { return d.x; }))
      .range([0, dims.innerWidth]);

    var fy = d3.scale.linear()
      .domain(d3.extent(el.datum(), function(d) { return d.y; }))
      .range([dims.innerHeight, 0]);

    var line = d3.svg.line()
      .x(function(d) { return fx(d.x); })
      .y(function(d) { return fy(d.y); });

    var svg = el.select('svg')
      .attr('width', dims.width)
      .attr('height', dims.height)
      .select('g')
        .attr('transform', utils.translate(dims.margin.left, dims.margin.top));

    svg.select('.rest.path')
      .attr('d', line);

    svg.select('.diff.path')
      .datum(function(d) { return d.slice(-2); })
      .attr('d', line);

    var dot = svg.selectAll('.dot')
      .data(function(d) { return d.slice(-1); });

    dot.enter().append('circle')
      .attr('class', 'dot')
      .attr('r', 4);

    dot
      .attr('cx', function(d) { return fx(d.x); })
      .attr('cy', function(d) { return fy(d.y); });

    dot.exit().remove();
  });

},{"../utils":4,"../view":5,"./widget":11}],9:[function(_dereq_,module,exports){
var utils = _dereq_('../utils');


module.exports = _dereq_('./widget').extend()
  .prop('width')
  .default(400)

  .prop('colspan')
  .default(4)

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

  .prop('colors')
  .prop('chart')
  .prop('legend')

  .init(function() {
    this.chart(chart(this));
    this.legend(legend(this));
    this.colors(d3.scale.category10());
  })

  .enter(function(el) {
    el.attr('class', 'lines widget');

    el.append('div')
      .attr('class', 'title');

    var values = el.append('div')
      .attr('class', 'values');

    values.append('div')
      .attr('class', 'chart');

    values.append('div')
      .attr('class', 'legend');
  })

  .meth('normalize', function(el) {
    var self = this;
    var node = el.node();

    el.datum(function(d, i) {
      var title = self.title().call(node, d, i);

      return {
        title: title,
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
        values: self.values()
          .call(node, d, i)
          .map(value)
      };
    }

    function value(d, i) {
      return {
        x: self.x().call(node, d, i),
        y: self.y().call(node, d, i)
      };
    }
  })

  .draw(function(el) {
    this.normalize(el);

    el.style('width', utils.px(this.width()));

    el.select('.widget .title')
      .text(function(d) { return d.title; });

    var values = el.select('.values')
      .datum(function(d, i) { return d.metrics; });

    values.select('.chart')
      .call(this.chart());

    values.select('.legend')
      .call(this.legend());
  });


var chart = _dereq_('../view').extend()
  .prop('height')
  .default(150)

  .prop('margin')
  .default({
    top: 10,
    left: 35,
    right: 15,
    bottom: 20
  })

  .prop('widget')

  .init(function(widget) {
    this.widget(widget);
  })

  .enter(function(el) {
    var svg = el.append('svg')
      .append('g');

    svg.append('g')
      .attr('class', 'x axis');

    svg.append('g')
      .attr('class', 'y axis');

    svg.append('g')
      .attr('class', 'lines');
  })

  .draw(function(el) {
    var widget = this.widget();

    var dims = utils.box()
      .margin(this.margin())
      .width(utils.innerWidth(el))
      .height(this.height())
      .calc();

    var allValues = el
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
      .domain([widget.yMin()(ys), widget.yMax()(ys)])
      .range([dims.innerHeight, 0]);

    var line = d3.svg.line()
      .x(function(d) { return fx(d.x); })
      .y(function(d) { return fy(d.y); });

    var svg = el.select('svg')
      .attr('width', dims.width)
      .attr('height', dims.height)
      .select('g')
        .attr('transform', utils.translate(dims.margin.left, dims.margin.top));

    var metric = svg.select('.lines').selectAll('.metric')
      .data(function(d) { return d; },
            function(d) { return d.key; });

    metric.enter().append('g')
      .attr('class', 'metric')
      .attr('data-key', function(d) { return d.key; })
      .append('path')
        .attr('class', 'line');

    metric.select('.line')
      .attr('stroke', function(d) { return d.color; })
      .attr('d', function(d) { return line(d.values); });

    var dot = metric.selectAll('.dot')
      .data(function(d) {
        if (!d.values.length) { return []; }
        var last = d.values[d.values.length - 1];

        return [{
          x: last.x,
          y: last.y,
          color: d.color
        }];
      });

    dot.enter().append('circle')
      .attr('class', 'dot')
      .attr('r', 4);

    dot
      .attr('fill', function(d) { return d.color; })
      .attr('cx', function(d) { return fx(d.x); })
      .attr('cy', function(d) { return fy(d.y); });

    dot.exit()
      .remove();

    metric.exit()
      .remove();

    var axis = d3.svg.axis()
      .scale(fx)
      .tickPadding(8)
      .ticks(widget.xTicks())
      .tickFormat(widget.xTickFormat())
      .tickSize(-dims.innerHeight);

    svg.select('.x.axis')
      .attr('transform', utils.translate(0, dims.innerHeight))
      .call(axis);

    axis = d3.svg.axis()
      .orient('left')
      .scale(fy)
      .tickPadding(8)
      .ticks(widget.yTicks())
      .tickFormat(widget.yTickFormat())
      .tickSize(-dims.innerWidth);
    
    svg.select('.y.axis')
      .call(axis);
  });


var legend = _dereq_('../view').extend()
  .prop('widget')

  .init(function(widget) {
    this.widget(widget);
  })

  .enter(function(el) {
    el.append('table')
      .attr('class', 'table');
  })

  .draw(function(el) {
    var none = this.widget().none();
    var yFormat = this.widget().yFormat();

    var metric = el.select('.table').selectAll('.metric')
      .data(function(d) { return d; },
            function(d) { return d.key; });

    var enterMetric = metric.enter().append('tr')
      .attr('data-key', function(d) { return d.key; })
      .attr('class', 'metric');

    enterMetric.append('td')
      .attr('class', 'swatch');

    enterMetric.append('td')
      .attr('class', 'title');

    enterMetric.append('td')
      .attr('class', 'value');

    metric.select('.swatch')
      .style('background', function(d) { return d.color; });

    metric.select('.title')
      .text(function(d) { return d.title; });

    metric.select('.value')
      .text(function(d) {
        d = d.values[d.values.length - 1];

        return d
          ? yFormat(d.y)
          : yFormat(none);
      });

    metric.exit()
      .remove();
  });

},{"../utils":4,"../view":5,"./widget":11}],10:[function(_dereq_,module,exports){
var utils = _dereq_('../utils');


module.exports = _dereq_('./widget').extend()
  .prop('width')
  .default(400)

  .prop('colspan')
  .default(4)

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

  .prop('margin')
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

  .enter(function(el) {
    el.attr('class', 'pie widget');

    el.append('div')
      .attr('class', 'title');

    el.append('div')
      .attr('class', 'chart');

    el.append('div')
      .attr('class', 'legend');
  })

  .draw(function(el) {
    this.normalize(el);

    el.style('width', utils.px(this.width()));

    el.select('.widget .title')
      .text(function(d) { return d.title; });

    el.select('.legend')
      .call(legend(this));

    el.select('.chart')
      .call(chart(this));
  });


var chart = _dereq_('../view').extend()
  .prop('widget')

  .init(function(widget) {
    this.widget(widget);
  })

  .enter(function(el) {
    el.append('svg')
      .append('g');
  })

  .draw(function(el) {
    var width = utils.innerWidth(el);

    var dims = utils.box()
      .margin(this.widget().margin())
      .width(width)
      .height(width)
      .calc();

    var radius = Math.min(dims.innerWidth, dims.innerHeight) / 2;

    var svg = el.select('svg')
      .attr('width', dims.width)
      .attr('height', dims.height)
      .select('g')
        .attr('transform', utils.translate(
          (dims.width / 2) - radius,
          (dims.height / 2) - radius));

    var arc = d3.svg.arc()
      .innerRadius(this.widget().innerRadius()(radius))
      .outerRadius(radius);

    var layout = d3.layout.pie()
      .value(function(d) { return d.value; });

    var slice = svg.selectAll('.slice')
      .data(function(d) { return layout(d.metrics); },
            function(d) { return d.data.key; });

    slice.enter().append('g')
      .attr('class', 'slice')
      .append('path');

    slice
      .attr('transform', utils.translate(radius, radius));

    slice.select('path')
      .attr('d', arc)
      .style('fill', function(d) { return d.data.color; });

    slice.exit()
      .remove();
  });


var legend = _dereq_('../view').extend()
  .prop('widget')

  .init(function(widget) {
    this.widget(widget);
  })

  .enter(function(el) {
    el.append('table')
      .attr('class', 'table');
  })

  .draw(function(el) {
    var valueFormat = this.widget().valueFormat();
    var percentFormat = this.widget().percentFormat();

    var metric = el.select('.table').selectAll('.metric')
      .data(function(d) { return d.metrics; },
            function(d) { return d.key; });

    var enterMetric = metric.enter().append('tr')
      .attr('class', 'metric');

    enterMetric.append('td')
      .attr('class', 'swatch');

    enterMetric.append('td')
      .attr('class', 'title');

    enterMetric.append('td')
      .attr('class', 'percent');

    enterMetric.append('td')
      .attr('class', 'value');

    metric.select('.swatch')
      .style('background', function(d) { return d.color; });

    metric.select('.title')
      .text(function(d) { return d.title; });

    metric.select('.percent')
      .text(function(d) { return percentFormat(d.percent); });

    metric.select('.value')
      .text(function(d) { return valueFormat(d.value); });

    metric.exit()
      .remove();
  });

},{"../utils":4,"../view":5,"./widget":11}],11:[function(_dereq_,module,exports){
module.exports = _dereq_('../view').extend()
  .prop('colspan')
  .default(0)

  .prop('rowspan')
  .default(0)

  .prop('width')
  .set(d3.functor)
  .default(0)

  .prop('height')
  .set(d3.functor)
  .default(0);

},{"../view":5}]},{},[3])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9ob21lL2p1c3Rpbi9wcmFla2VsdC9zYXBwaGlyZS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiL2hvbWUvanVzdGluL3ByYWVrZWx0L3NhcHBoaXJlL3NyYy9zY3JpcHRzL2Rhc2hib2FyZC5qcyIsIi9ob21lL2p1c3Rpbi9wcmFla2VsdC9zYXBwaGlyZS9zcmMvc2NyaXB0cy9ncmlkLmpzIiwiL2hvbWUvanVzdGluL3ByYWVrZWx0L3NhcHBoaXJlL3NyYy9zY3JpcHRzL2luZGV4LmpzIiwiL2hvbWUvanVzdGluL3ByYWVrZWx0L3NhcHBoaXJlL3NyYy9zY3JpcHRzL3V0aWxzLmpzIiwiL2hvbWUvanVzdGluL3ByYWVrZWx0L3NhcHBoaXJlL3NyYy9zY3JpcHRzL3ZpZXcuanMiLCIvaG9tZS9qdXN0aW4vcHJhZWtlbHQvc2FwcGhpcmUvc3JjL3NjcmlwdHMvd2lkZ2V0cy9iYXJzLmpzIiwiL2hvbWUvanVzdGluL3ByYWVrZWx0L3NhcHBoaXJlL3NyYy9zY3JpcHRzL3dpZGdldHMvaW5kZXguanMiLCIvaG9tZS9qdXN0aW4vcHJhZWtlbHQvc2FwcGhpcmUvc3JjL3NjcmlwdHMvd2lkZ2V0cy9sYXN0LmpzIiwiL2hvbWUvanVzdGluL3ByYWVrZWx0L3NhcHBoaXJlL3NyYy9zY3JpcHRzL3dpZGdldHMvbGluZXMuanMiLCIvaG9tZS9qdXN0aW4vcHJhZWtlbHQvc2FwcGhpcmUvc3JjL3NjcmlwdHMvd2lkZ2V0cy9waWUuanMiLCIvaG9tZS9qdXN0aW4vcHJhZWtlbHQvc2FwcGhpcmUvc3JjL3NjcmlwdHMvd2lkZ2V0cy93aWRnZXQuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNVVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3TkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3Rocm93IG5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIil9dmFyIGY9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGYuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sZixmLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsInZhciB1dGlscyA9IHJlcXVpcmUoJy4vdXRpbHMnKTtcbnZhciBsYXlvdXQgPSByZXF1aXJlKCcuL2dyaWQnKTtcbnZhciB3aWRnZXRzID0gcmVxdWlyZSgnLi93aWRnZXRzJyk7XG5cblxubW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKCcuL3ZpZXcnKS5leHRlbmQoKVxuICAucHJvcCgnc2NhbGUnKVxuICAuZGVmYXVsdCgxMDApXG5cbiAgLnByb3AoJ3R5cGVzJylcblxuICAucHJvcCgndGl0bGUnKVxuICAuc2V0KGQzLmZ1bmN0b3IpXG4gIC5kZWZhdWx0KGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQudGl0bGU7IH0pXG5cbiAgLnByb3AoJ2tleScpXG4gIC5zZXQoZDMuZnVuY3RvcilcbiAgLmRlZmF1bHQoZnVuY3Rpb24oZCwgaSkgeyByZXR1cm4gaTsgfSlcblxuICAucHJvcCgndHlwZScpXG4gIC5zZXQoZDMuZnVuY3RvcilcbiAgLmRlZmF1bHQoZnVuY3Rpb24oZCkgeyByZXR1cm4gZC50eXBlOyB9KVxuXG4gIC5wcm9wKCd3aWRnZXRzJylcbiAgLnNldChkMy5mdW5jdG9yKVxuICAuZGVmYXVsdChmdW5jdGlvbihkKSB7IHJldHVybiBkLndpZGdldHM7IH0pXG5cbiAgLnByb3AoJ2NvbCcpXG4gIC5zZXQoZDMuZnVuY3RvcilcbiAgLmRlZmF1bHQoZnVuY3Rpb24oZCkge1xuICAgIHJldHVybiB1dGlscy5hY2Nlc3MoZCwgJ2NvbCcpO1xuICB9KVxuXG4gIC5wcm9wKCdyb3cnKVxuICAuc2V0KGQzLmZ1bmN0b3IpXG4gIC5kZWZhdWx0KGZ1bmN0aW9uKGQpIHtcbiAgICByZXR1cm4gdXRpbHMuYWNjZXNzKGQsICdyb3cnKTtcbiAgfSlcblxuICAucHJvcCgnY29sc3BhbicpXG4gIC5zZXQoZDMuZnVuY3RvcilcbiAgLmRlZmF1bHQoZnVuY3Rpb24oZCkge1xuICAgIHJldHVybiB1dGlscy5hY2Nlc3MoZCwgJ2NvbHNwYW4nKTtcbiAgfSlcblxuICAucHJvcCgncm93c3BhbicpXG4gIC5zZXQoZDMuZnVuY3RvcilcbiAgLmRlZmF1bHQoZnVuY3Rpb24oZCkge1xuICAgIHJldHVybiB1dGlscy5hY2Nlc3MoZCwgJ3Jvd3NwYW4nKTtcbiAgfSlcblxuICAucHJvcCgnbnVtY29scycpXG4gIC5kZWZhdWx0KDgpXG5cbiAgLnByb3AoJ3BhZGRpbmcnKVxuICAuZGVmYXVsdCg1KVxuXG4gIC5pbml0KGZ1bmN0aW9uKCkge1xuICAgIHZhciB0eXBlcyA9IGQzLm1hcCgpO1xuXG4gICAgZDMua2V5cyh3aWRnZXRzKS5mb3JFYWNoKGZ1bmN0aW9uKGspIHtcbiAgICAgIHR5cGVzLnNldChrLCB3aWRnZXRzW2tdLm5ldygpKTtcbiAgICB9KTtcblxuICAgIHRoaXMudHlwZXModHlwZXMpO1xuICB9KVxuXG4gIC5lbnRlcihmdW5jdGlvbihlbCkge1xuICAgIGVsLmF0dHIoJ2NsYXNzJywgJ2Rhc2hib2FyZCcpXG4gICAgICAuYXBwZW5kKCdkaXYnKVxuICAgICAgICAuYXR0cignY2xhc3MnLCAnd2lkZ2V0cycpO1xuICB9KVxuXG4gIC5tZXRoKCdub3JtYWxpemUnLCBmdW5jdGlvbihlbCkge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICB2YXIgbm9kZSA9IGVsLm5vZGUoKTtcblxuICAgIGVsLmRhdHVtKGZ1bmN0aW9uKGQsIGkpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHRpdGxlOiBzZWxmLnRpdGxlKClcbiAgICAgICAgICAuY2FsbChub2RlLCBkLCBpKSxcbiAgICAgICAgd2lkZ2V0czogc2VsZi53aWRnZXRzKClcbiAgICAgICAgICAuY2FsbChub2RlLCBkLCBpKVxuICAgICAgICAgIC5tYXAod2lkZ2V0RGF0dW0pXG4gICAgICB9O1xuICAgIH0pO1xuXG4gICAgZnVuY3Rpb24gd2lkZ2V0RGF0dW0oZCwgaSkge1xuICAgICAgdmFyIHR5cGVuYW1lID0gc2VsZi50eXBlKCkuY2FsbChub2RlLCBkLCBpKTtcbiAgICAgIHZhciB0eXBlID0gc2VsZi50eXBlcygpLmdldCh0eXBlbmFtZSk7XG5cbiAgICAgIGlmICghdHlwZSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJVbnJlY29nbmlzZWQgZGFzaGJvYXJkIHdpZGdldCB0eXBlICdcIiArIHR5cGVuYW1lICsgXCInXCIpO1xuICAgICAgfVxuXG4gICAgICB2YXIgY29sc3BhbiA9IHNlbGYuY29sc3BhbigpLmNhbGwobm9kZSwgZCwgaSk7XG4gICAgICBjb2xzcGFuID0gdXRpbHMuZW5zdXJlKGNvbHNwYW4sIHR5cGUuY29sc3BhbigpKTtcbiAgICAgIHZhciByb3dzcGFuID0gc2VsZi5yb3dzcGFuKCkuY2FsbChub2RlLCBkLCBpKTtcbiAgICAgIHJvd3NwYW4gPSB1dGlscy5lbnN1cmUocm93c3BhbiwgdHlwZS5yb3dzcGFuKCkpO1xuXG4gICAgICByZXR1cm4ge1xuICAgICAgICBkYXRhOiBkLFxuICAgICAgICB0eXBlOiB0eXBlLFxuICAgICAgICBjb2xzcGFuOiBjb2xzcGFuLFxuICAgICAgICByb3dzcGFuOiByb3dzcGFuLFxuICAgICAgICBrZXk6IHNlbGYua2V5KCkuY2FsbChub2RlLCBkLCBpKSxcbiAgICAgICAgY29sOiBzZWxmLmNvbCgpLmNhbGwobm9kZSwgZCwgaSksXG4gICAgICAgIHJvdzogc2VsZi5yb3coKS5jYWxsKG5vZGUsIGQsIGkpXG4gICAgICB9O1xuICAgIH1cbiAgfSlcblxuICAuZHJhdyhmdW5jdGlvbihlbCkge1xuICAgIHRoaXMubm9ybWFsaXplKGVsKTtcbiAgICB2YXIgd2lkZ2V0RGF0YSA9IGVsLmRhdHVtKCkud2lkZ2V0cztcblxuICAgIHRoaXMudHlwZXMoKVxuICAgICAgLmZvckVhY2goZnVuY3Rpb24obmFtZSwgdHlwZSkge1xuICAgICAgICB0eXBlLndpZHRoKHdpZGdldFdpZHRoKTtcbiAgICAgICAgdHlwZS5oZWlnaHQod2lkZ2V0SGVpZ2h0KTtcbiAgICAgIH0pO1xuXG4gICAgdmFyIGdyaWQgPSBsYXlvdXQoKVxuICAgICAgLnNjYWxlKHRoaXMuc2NhbGUoKSlcbiAgICAgIC5udW1jb2xzKHRoaXMubnVtY29scygpKVxuICAgICAgLnBhZGRpbmcodGhpcy5wYWRkaW5nKCkpXG4gICAgICAuY29sKGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQuY29sOyB9KVxuICAgICAgLnJvdyhmdW5jdGlvbihkKSB7IHJldHVybiBkLnJvdzsgfSlcbiAgICAgIC5jb2xzcGFuKGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQuY29sc3BhbjsgfSlcbiAgICAgIC5yb3dzcGFuKGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQucm93c3BhbjsgfSk7XG4gICAgXG4gICAgZWwuc3R5bGUoJ3dpZHRoJywgdXRpbHMucHgoZ3JpZC5zY2FsZSgpICogZ3JpZC5udW1jb2xzKCkpKTtcblxuICAgIHZhciB3aWRnZXQgPSBlbC5zZWxlY3QoJy53aWRnZXRzJykuc2VsZWN0QWxsKCcud2lkZ2V0JylcbiAgICAgIC5kYXRhKHdpZGdldERhdGEsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQua2V5OyB9KTtcblxuICAgIHdpZGdldC5lbnRlcigpLmFwcGVuZCgnZGl2Jyk7XG4gICAgdXRpbHMubWV0YSh3aWRnZXQsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQ7IH0pO1xuXG4gICAgd2lkZ2V0XG4gICAgICAuY2xhc3NlZCgnd2lkZ2V0JywgdHJ1ZSlcbiAgICAgIC5lYWNoKGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgdmFyIHdpZGdldEVsID0gZDMuc2VsZWN0KHRoaXMpXG4gICAgICAgICAgLmRhdHVtKGQuZGF0YSlcbiAgICAgICAgICAuY2FsbChkLnR5cGUpO1xuXG4gICAgICAgIHZhciB3aWR0aCA9IHBhcnNlSW50KHdpZGdldEVsLnN0eWxlKCd3aWR0aCcpKTtcbiAgICAgICAgZC5jb2xzcGFuID0gTWF0aC5tYXgoZC5jb2xzcGFuLCBncmlkLmxlbmd0aFNwYW4od2lkdGgpKTtcblxuICAgICAgICB2YXIgaGVpZ2h0ID0gcGFyc2VJbnQod2lkZ2V0RWwuc3R5bGUoJ2hlaWdodCcpKTtcbiAgICAgICAgZC5yb3dzcGFuID0gTWF0aC5tYXgoZC5yb3dzcGFuLCBncmlkLmxlbmd0aFNwYW4oaGVpZ2h0KSk7XG4gICAgICB9KTtcblxuICAgIHZhciBncmlkRWxzID0gZ3JpZCh3aWRnZXREYXRhKTtcblxuICAgIHdpZGdldFxuICAgICAgLnN0eWxlKCdsZWZ0JywgdXRpbHMucHgoZnVuY3Rpb24oZCwgaSkgeyByZXR1cm4gZ3JpZEVsc1tpXS54OyB9KSlcbiAgICAgIC5zdHlsZSgndG9wJywgdXRpbHMucHgoZnVuY3Rpb24oZCwgaSkgeyByZXR1cm4gZ3JpZEVsc1tpXS55OyB9KSk7XG5cbiAgICB3aWRnZXQuZXhpdCgpLnJlbW92ZSgpO1xuXG4gICAgZnVuY3Rpb24gd2lkZ2V0V2lkdGgoKSB7XG4gICAgICByZXR1cm4gZ3JpZC5zcGFuTGVuZ3RoKHV0aWxzLm1ldGEodGhpcykuY29sc3Bhbik7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gd2lkZ2V0SGVpZ2h0KCkge1xuICAgICAgcmV0dXJuIGdyaWQuc3Bhbkxlbmd0aCh1dGlscy5tZXRhKHRoaXMpLnJvd3NwYW4pO1xuICAgIH1cbiAgfSk7XG4iLCJ2YXIgdXRpbHMgPSByZXF1aXJlKCcuL3V0aWxzJyk7XG5cblxudmFyIGdyaWQgPSBtb2R1bGUuZXhwb3J0cyA9IHN0cmFpbigpXG4gIC5wcm9wKCdjb2wnKVxuICAuc2V0KGQzLmZ1bmN0b3IpXG4gIC5kZWZhdWx0KGZ1bmN0aW9uKGQpIHtcbiAgICByZXR1cm4gdXRpbHMuYWNjZXNzKGQsICdjb2wnKTtcbiAgfSlcblxuICAucHJvcCgncm93JylcbiAgLnNldChkMy5mdW5jdG9yKVxuICAuZGVmYXVsdChmdW5jdGlvbihkKSB7XG4gICAgcmV0dXJuIHV0aWxzLmFjY2VzcyhkLCAncm93Jyk7XG4gIH0pXG5cbiAgLnByb3AoJ251bWNvbHMnKVxuICAuZGVmYXVsdCg4KVxuXG4gIC5wcm9wKCdzY2FsZScpXG4gIC5kZWZhdWx0KDEwKVxuXG4gIC5wcm9wKCdwYWRkaW5nJylcbiAgLmRlZmF1bHQoNSlcblxuICAucHJvcCgnY29sc3BhbicpXG4gIC5zZXQoZDMuZnVuY3RvcilcbiAgLmRlZmF1bHQoZnVuY3Rpb24oZCkge1xuICAgIHJldHVybiB1dGlscy5hY2Nlc3MoZCwgJ2NvbHNwYW4nLCAxKTtcbiAgfSlcblxuICAucHJvcCgncm93c3BhbicpXG4gIC5zZXQoZDMuZnVuY3RvcilcbiAgLmRlZmF1bHQoZnVuY3Rpb24oZCkge1xuICAgIHJldHVybiB1dGlscy5hY2Nlc3MoZCwgJ3Jvd3NwYW4nLCAxKTtcbiAgfSlcblxuICAuaW52b2tlKGZ1bmN0aW9uKGRhdGEpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgdmFyIGJlc3QgPSBjb3VudGVyKCkubnVtY29scyh0aGlzLm51bWNvbHMoKSk7XG5cbiAgICBkYXRhID0gKGRhdGEgfHwgW10pXG4gICAgICAubWFwKGZ1bmN0aW9uKGQsIGkpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBkYXRhOiBkLFxuICAgICAgICAgIGNvbDogc2VsZi5jb2woKS5jYWxsKHNlbGYsIGQsIGkpLCBcbiAgICAgICAgICByb3c6IHNlbGYucm93KCkuY2FsbChzZWxmLCBkLCBpKSxcbiAgICAgICAgICByb3dzcGFuOiBzZWxmLnJvd3NwYW4oKS5jYWxsKHNlbGYsIGQsIGkpLFxuICAgICAgICAgIGNvbHNwYW46IHNlbGYuY29sc3BhbigpLmNhbGwoc2VsZiwgZCwgaSlcbiAgICAgICAgfTtcbiAgICAgIH0pXG4gICAgICAubWFwKGJlc3QpO1xuXG4gICAgdmFyIHF1YWR0cmVlID0gZDMuZ2VvbS5xdWFkdHJlZSgpXG4gICAgICAueChmdW5jdGlvbihkKSB7IHJldHVybiBkLmNvbDsgfSlcbiAgICAgIC55KGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQucm93OyB9KTtcblxuICAgIHZhciByb290ID0gcXVhZHRyZWUoZGF0YSk7XG5cbiAgICBkYXRhLmZvckVhY2goZnVuY3Rpb24oZCkge1xuICAgICAgcm9vdC52aXNpdChncmlkLnVuY29sbGlkZShkKSk7XG4gICAgICBkLnggPSBzZWxmLmluZGV4T2Zmc2V0KGQuY29sKTtcbiAgICAgIGQueSA9IHNlbGYuaW5kZXhPZmZzZXQoZC5yb3cpO1xuICAgICAgZC53aWR0aCA9IHNlbGYuc3Bhbkxlbmd0aChkLmNvbHNwYW4pO1xuICAgICAgZC5oZWlnaHQgPSBzZWxmLnNwYW5MZW5ndGgoZC5yb3dzcGFuKTtcbiAgICB9KTtcblxuICAgIHJldHVybiBkYXRhO1xuICB9KVxuXG4gIC5tZXRoKCdpbmRleE9mZnNldCcsIGZ1bmN0aW9uKGluZGV4KSB7XG4gICAgcmV0dXJuIChpbmRleCAqIHRoaXMuc2NhbGUoKSkgKyB0aGlzLnBhZGRpbmcoKTtcbiAgfSlcblxuICAubWV0aCgnc3Bhbkxlbmd0aCcsIGZ1bmN0aW9uKHNwYW4pIHtcbiAgICByZXR1cm4gKHNwYW4gKiB0aGlzLnNjYWxlKCkpIC0gKHRoaXMucGFkZGluZygpICogMik7XG4gIH0pXG5cbiAgLm1ldGgoJ29mZnNldEluZGV4JywgZnVuY3Rpb24ob2Zmc2V0KSB7XG4gICAgcmV0dXJuIE1hdGguY2VpbCgob2Zmc2V0IC0gdGhpcy5wYWRkaW5nKCkpIC8gdGhpcy5zY2FsZSgpKTtcbiAgfSlcblxuICAubWV0aCgnbGVuZ3RoU3BhbicsIGZ1bmN0aW9uKGxlbikge1xuICAgIHJldHVybiBNYXRoLmNlaWwoKGxlbiArICh0aGlzLnBhZGRpbmcoKSAqIDIpKSAvIHRoaXMuc2NhbGUoKSk7XG4gIH0pXG5cbiAgLnN0YXRpYygnYm94JywgZnVuY3Rpb24oZCkge1xuICAgIHJldHVybiB7XG4gICAgICB4MTogZC5jb2wsXG4gICAgICB4MjogZC5jb2wgKyBkLmNvbHNwYW4gLSAxLFxuICAgICAgeTE6IGQucm93LFxuICAgICAgeTI6IGQucm93ICsgZC5yb3dzcGFuIC0gMVxuICAgIH07XG4gIH0pXG5cbiAgLnN0YXRpYygndW5jb2xsaWRlJywgZnVuY3Rpb24oYSkge1xuICAgIHZhciBib3hBID0gZ3JpZC5ib3goYSk7XG4gICAgXG4gICAgcmV0dXJuIGZ1bmN0aW9uKG5vZGUsIHgxLCB5MSwgeDIsIHkyKSB7XG4gICAgICB2YXIgYiA9IG5vZGUucG9pbnQ7XG5cbiAgICAgIGlmIChiICYmIGEgIT09IGIgJiYgZ3JpZC5pbnRlcnNlY3Rpb24oYm94QSwgZ3JpZC5ib3goYikpKSB7XG4gICAgICAgIGIucm93ID0gYm94QS55MiArIDE7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiAhZ3JpZC5pbnRlcnNlY3Rpb24oYm94QSwge1xuICAgICAgICB4MTogeDEsIFxuICAgICAgICB5MTogeTEsIFxuICAgICAgICB4MjogeDIsXG4gICAgICAgIHkyOiB5MlxuICAgICAgfSk7XG4gICAgfTtcbiAgfSlcblxuICAuc3RhdGljKCdpbnRlcnNlY3Rpb24nLCBmdW5jdGlvbihhLCBiKSB7XG4gICAgcmV0dXJuICgoYS54MSA8PSBiLngxICYmIGIueDEgPD0gYS54MikgJiYgKGEueTEgPD0gYi55MSAmJiBiLnkxIDw9IGEueTIpKVxuICAgICAgICB8fCAoKGIueDEgPD0gYS54MSAmJiBhLngxIDw9IGIueDIpICYmIChiLnkxIDw9IGEueTEgJiYgYS55MSA8PSBiLnkyKSlcbiAgICAgICAgfHwgKChhLngxIDw9IGIueDIgJiYgYi54MiA8PSBhLngyKSAmJiAoYS55MSA8PSBiLnkxICYmIGIueTEgPD0gYS55MikpXG4gICAgICAgIHx8ICgoYi54MSA8PSBhLngyICYmIGEueDIgPD0gYi54MikgJiYgKGIueTEgPD0gYS55MSAmJiBhLnkxIDw9IGIueTIpKTtcbiAgfSk7XG5cblxudmFyIGNvdW50ZXIgPSBzdHJhaW4oKVxuICAucHJvcCgnbnVtY29scycpXG5cbiAgLnByb3AoJ3Jvd3NwYW4nKVxuICAuZGVmYXVsdCgwKVxuXG4gIC5wcm9wKCdjb2wnKVxuICAuZGVmYXVsdCgwKVxuXG4gIC5wcm9wKCdyb3cnKVxuICAuZGVmYXVsdCgwKVxuXG4gIC5pbnZva2UoZnVuY3Rpb24oZCkge1xuICAgIGQuY29sID0gdXRpbHMuZW5zdXJlKGQuY29sLCB0aGlzLmNvbCgpKTtcbiAgICBkLnJvdyA9IHV0aWxzLmVuc3VyZShkLnJvdywgdGhpcy5yb3coKSk7XG5cbiAgICBpZiAoZC5jb2wgKyBkLmNvbHNwYW4gPiB0aGlzLm51bWNvbHMoKSkge1xuICAgICAgZC5jb2wgPSAwO1xuICAgICAgZC5yb3cgKz0gdGhpcy5yb3dzcGFuKCk7XG4gICAgICB0aGlzLnJvd3NwYW4oMCk7XG4gICAgfVxuXG4gICAgdGhpc1xuICAgICAgLmNvbChkLmNvbCArIGQuY29sc3BhbilcbiAgICAgIC5yb3coZC5yb3cpXG4gICAgICAucm93c3BhbihNYXRoLm1heCh0aGlzLnJvd3NwYW4oKSwgZC5yb3dzcGFuKSk7XG5cbiAgICByZXR1cm4gZDtcbiAgfSk7XG4iLCJleHBvcnRzLnV0aWxzID0gcmVxdWlyZSgnLi91dGlscycpO1xuZXhwb3J0cy52aWV3ID0gcmVxdWlyZSgnLi92aWV3Jyk7XG5leHBvcnRzLmdyaWQgPSByZXF1aXJlKCcuL2dyaWQnKTtcbmV4cG9ydHMud2lkZ2V0cyA9IHJlcXVpcmUoJy4vd2lkZ2V0cycpO1xuZXhwb3J0cy5kYXNoYm9hcmQgPSByZXF1aXJlKCcuL2Rhc2hib2FyZCcpO1xuIiwidmFyIHV0aWxzID0gZXhwb3J0cztcblxuXG51dGlscy5hY2Nlc3MgPSBmdW5jdGlvbihkLCBuYW1lLCBkZWZhdWx0dmFsKSB7XG4gIGlmIChhcmd1bWVudHMubGVuZ3RoIDwgMykge1xuICAgIGRlZmF1bHR2YWwgPSBudWxsO1xuICB9XG5cbiAgaWYgKHR5cGVvZiBkICE9ICdvYmplY3QnKSB7XG4gICAgcmV0dXJuIGRlZmF1bHR2YWw7XG4gIH1cblxuICB2YXIgdmFsID0gZFtuYW1lXTtcbiAgcmV0dXJuIHR5cGVvZiB2YWwgPT0gJ3VuZGVmaW5lZCdcbiAgICA/IGRlZmF1bHR2YWxcbiAgICA6IHZhbDtcbn07XG5cblxudXRpbHMuZW5zdXJlID0gZnVuY3Rpb24odiwgZGVmYXVsdHZhbCkge1xuICByZXR1cm4gdiA9PT0gbnVsbCB8fCB0eXBlb2YgdiA9PSAndW5kZWZpbmVkJ1xuICAgID8gZGVmYXVsdHZhbFxuICAgIDogdjtcbn07XG5cblxudXRpbHMudHJhbnNsYXRlID0gZnVuY3Rpb24oeCwgeSkge1xuICByZXR1cm4gJ3RyYW5zbGF0ZSgnICsgeCArICcsICcgKyB5ICsgJyknO1xufTtcblxuXG51dGlscy5lbnN1cmVFbCA9IGZ1bmN0aW9uKGVsKSB7XG4gIHJldHVybiAhKGVsIGluc3RhbmNlb2YgZDMuc2VsZWN0aW9uKVxuICAgID8gZDMuc2VsZWN0KGVsKVxuICAgIDogZWw7XG59O1xuXG5cbnV0aWxzLmRhdGUgPSBmdW5jdGlvbih0KSB7XG4gIHJldHVybiBuZXcgRGF0ZSh0KTtcbn07XG5cblxudXRpbHMucHggPSBmdW5jdGlvbihmbikge1xuICBmbiA9IGQzLmZ1bmN0b3IoZm4pO1xuXG4gIHJldHVybiBmdW5jdGlvbihkLCBpKSB7XG4gICAgcmV0dXJuIGZuLmNhbGwodGhpcywgZCwgaSkgKyAncHgnO1xuICB9O1xufTtcblxuXG51dGlscy5tZXRhID0gZnVuY3Rpb24oZWwsIGZuKSB7XG4gIGVsID0gdXRpbHMuZW5zdXJlRWwoZWwpO1xuXG4gIHJldHVybiBhcmd1bWVudHMubGVuZ3RoID4gMVxuICAgID8gZWwucHJvcGVydHkoJ19fc2FwcGhpcmVfbWV0YV9fJywgZm4pXG4gICAgOiBlbC5wcm9wZXJ0eSgnX19zYXBwaGlyZV9tZXRhX18nKTtcbn07XG5cblxudXRpbHMuYm94ID0gc3RyYWluKClcbiAgLnByb3AoJ3dpZHRoJylcbiAgLmRlZmF1bHQoMClcblxuICAucHJvcCgnaGVpZ2h0JylcbiAgLmRlZmF1bHQoMClcblxuICAucHJvcCgnbWFyZ2luJylcbiAgLmRlZmF1bHQoe1xuICAgIHRvcDogMCxcbiAgICBsZWZ0OiAwLFxuICAgIHJpZ2h0OiAwLFxuICAgIGJvdHRvbTogMFxuICB9KVxuXG4gIC5tZXRoKCdjYWxjJywgZnVuY3Rpb24oKSB7XG4gICAgdmFyIGQgPSB7fTtcbiAgICBkLm1hcmdpbiA9IHRoaXMubWFyZ2luKCk7XG4gICAgZC53aWR0aCA9IHRoaXMud2lkdGgoKTtcbiAgICBkLmhlaWdodCA9IHRoaXMuaGVpZ2h0KCk7XG4gICAgZC5pbm5lcldpZHRoID0gZC53aWR0aCAtIGQubWFyZ2luLmxlZnQgLSBkLm1hcmdpbi5yaWdodDtcbiAgICBkLmlubmVySGVpZ2h0ID0gZC5oZWlnaHQgLSBkLm1hcmdpbi50b3AgLSBkLm1hcmdpbi5ib3R0b207XG4gICAgcmV0dXJuIGQ7XG4gIH0pXG5cbiAgLmludm9rZShmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5jYWxjKCk7XG4gIH0pO1xuXG5cbnV0aWxzLmlubmVyV2lkdGggPSBmdW5jdGlvbihlbCkge1xuICByZXR1cm4gdXRpbHMubWVhc3VyZShlbCwgJ3dpZHRoJylcbiAgICAgICAtIHV0aWxzLm1lYXN1cmUoZWwsICdwYWRkaW5nLWxlZnQnKVxuICAgICAgIC0gdXRpbHMubWVhc3VyZShlbCwgJ3BhZGRpbmctcmlnaHQnKTtcbn07XG5cblxudXRpbHMuaW5uZXJIZWlnaHQgPSBmdW5jdGlvbihlbCkge1xuICByZXR1cm4gdXRpbHMubWVhc3VyZShlbCwgJ2hlaWdodCcpXG4gICAgICAgLSB1dGlscy5tZWFzdXJlKGVsLCAncGFkZGluZy10b3AnKVxuICAgICAgIC0gdXRpbHMubWVhc3VyZShlbCwgJ3BhZGRpbmctYm90dG9tJyk7XG59O1xuXG5cbnV0aWxzLm1lYXN1cmUgPSBmdW5jdGlvbihlbCwgbmFtZSkge1xuICBlbCA9IHV0aWxzLmVuc3VyZUVsKGVsKTtcbiAgcmV0dXJuIHBhcnNlSW50KGVsLnN0eWxlKG5hbWUpKTtcbn07XG4iLCJtb2R1bGUuZXhwb3J0cyA9IHN0cmFpbigpXG4gIC5zdGF0aWMoJ2RyYXcnLCBmdW5jdGlvbihmbikge1xuICAgIHRoaXMubWV0aCgnX2RyYXdfJywgZm4pO1xuICB9KVxuICAuZHJhdyhmdW5jdGlvbigpIHt9KVxuXG4gIC5zdGF0aWMoJ2VudGVyJywgZnVuY3Rpb24oZm4pIHtcbiAgICB0aGlzLm1ldGgoJ19lbnRlcl8nLCBmbik7XG4gIH0pXG4gIC5lbnRlcihmdW5jdGlvbigpIHt9KVxuXG4gIC5tZXRoKCdkcmF3JywgZnVuY3Rpb24oZWwpIHtcbiAgICB2YXIgZGF0dW07XG4gICAgZWwgPSBzYXBwaGlyZS51dGlscy5lbnN1cmVFbChlbCk7XG5cbiAgICBpZiAoZWwubm9kZSgpKSB7XG4gICAgICBkYXR1bSA9IGVsLmRhdHVtKCk7XG4gICAgfVxuXG4gICAgaWYgKGVsLm5vZGUoKSAmJiAhZWwubm9kZSgpLmhhc0NoaWxkTm9kZXMoKSkge1xuICAgICAgdGhpcy5lbnRlci5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIH1cblxuICAgIHZhciBwYXJlbnQgPSB0aGlzLl90eXBlXy5fc3VwZXJfLnByb3RvdHlwZTtcbiAgICBpZiAoJ19kcmF3XycgaW4gcGFyZW50KSB7XG4gICAgICBwYXJlbnQuX2RyYXdfLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfVxuXG4gICAgdGhpcy5fZHJhd18uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcblxuICAgIGlmICh0eXBlb2YgZGF0dW0gIT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIGVsLmRhdHVtKGRhdHVtKTtcbiAgICB9XG4gIH0pXG5cbiAgLm1ldGgoJ2VudGVyJywgZnVuY3Rpb24oZWwpIHtcbiAgICBlbCA9IHNhcHBoaXJlLnV0aWxzLmVuc3VyZUVsKGVsKTtcblxuICAgIHZhciBwYXJlbnQgPSB0aGlzLl90eXBlXy5fc3VwZXJfLnByb3RvdHlwZTtcbiAgICBpZiAoJ19lbnRlcl8nIGluIHBhcmVudCkge1xuICAgICAgcGFyZW50Ll9lbnRlcl8uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9XG5cbiAgICB0aGlzLl9lbnRlcl8uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgfSlcblxuICAuaW52b2tlKGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLmRyYXcuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgfSk7XG4iLCJ2YXIgdXRpbHMgPSByZXF1aXJlKCcuLi91dGlscycpO1xuXG5cbm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSgnLi93aWRnZXQnKS5leHRlbmQoKVxuICAucHJvcCgnd2lkdGgnKVxuICAuZGVmYXVsdCg0MDApXG5cbiAgLnByb3AoJ2NvbHNwYW4nKVxuICAuZGVmYXVsdCg0KVxuXG4gIC5wcm9wKCdyb3dzcGFuJylcbiAgLmRlZmF1bHQoMilcblxuICAucHJvcCgnaGVpZ2h0JylcbiAgLmRlZmF1bHQoMjAwKVxuXG4gIC5wcm9wKCdiYXJQYWRkaW5nJylcbiAgLmRlZmF1bHQoMi41KVxuXG4gIC5wcm9wKCdtYXJnaW4nKVxuICAuZGVmYXVsdCh7XG4gICAgdG9wOiAxMCxcbiAgICBsZWZ0OiAzOCxcbiAgICByaWdodDogMTUsXG4gICAgYm90dG9tOiA0NVxuICB9KVxuXG4gIC5wcm9wKCd0aXRsZScpXG4gIC5zZXQoZDMuZnVuY3RvcilcbiAgLmRlZmF1bHQoZnVuY3Rpb24oZCkgeyByZXR1cm4gZC50aXRsZTsgfSlcblxuICAucHJvcCgndmFsdWVzJylcbiAgLnNldChkMy5mdW5jdG9yKVxuICAuZGVmYXVsdChmdW5jdGlvbihkKSB7IHJldHVybiBkLnZhbHVlczsgfSlcblxuICAucHJvcCgneCcpXG4gIC5zZXQoZDMuZnVuY3RvcilcbiAgLmRlZmF1bHQoZnVuY3Rpb24oZCkgeyByZXR1cm4gZC54OyB9KVxuXG4gIC5wcm9wKCd5JylcbiAgLnNldChkMy5mdW5jdG9yKVxuICAuZGVmYXVsdChmdW5jdGlvbihkKSB7IHJldHVybiBkLnk7IH0pXG5cbiAgLnByb3AoJ2R4JylcbiAgLnNldChkMy5mdW5jdG9yKVxuICAuZGVmYXVsdChudWxsKVxuXG4gIC5wcm9wKCd4VGlja0Zvcm1hdCcpXG4gIC5kZWZhdWx0KG51bGwpXG5cbiAgLnByb3AoJ3hUaWNrcycpXG4gIC5kZWZhdWx0KDgpXG5cbiAgLnByb3AoJ3lUaWNrRm9ybWF0JylcbiAgLmRlZmF1bHQoZDMuZm9ybWF0KCcuMnMnKSlcblxuICAucHJvcCgneVRpY2tzJylcbiAgLmRlZmF1bHQoNSlcblxuICAucHJvcCgneU1heCcpXG4gIC5zZXQoZDMuZnVuY3RvcilcbiAgLmRlZmF1bHQoZDMubWF4KVxuXG4gIC5wcm9wKCdjb2xvcnMnKVxuXG4gIC5pbml0KGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuY29sb3JzKGQzLnNjYWxlLmNhdGVnb3J5MTAoKSk7XG4gIH0pXG5cbiAgLm1ldGgoJ25vcm1hbGl6ZScsIGZ1bmN0aW9uKGVsKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIHZhciBub2RlID0gZWwubm9kZSgpO1xuXG4gICAgZWwuZGF0dW0oZnVuY3Rpb24oZCwgaSkge1xuICAgICAgdmFyIHZhbHVlcyA9IHNlbGYudmFsdWVzKClcbiAgICAgICAgLmNhbGwobm9kZSwgZCwgaSlcbiAgICAgICAgLm1hcCh2YWx1ZSk7XG5cbiAgICAgIHZhciBsZW4gPSB2YWx1ZXMubGVuZ3RoO1xuICAgICAgdmFyIGR4QXZnID0gdmFsdWVzLmxlbmd0aFxuICAgICAgICA/ICh2YWx1ZXNbbGVuIC0gMV0ueCAtIHZhbHVlc1swXS54KSAvIGxlblxuICAgICAgICA6IDA7XG5cbiAgICAgIHZhbHVlcy5mb3JFYWNoKGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgZC5keCA9IHV0aWxzLmVuc3VyZShkLmR4LCBkeEF2Zyk7XG4gICAgICB9KTtcblxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgdmFsdWVzOiB2YWx1ZXMsXG4gICAgICAgIHRpdGxlOiBzZWxmLnRpdGxlKCkuY2FsbChub2RlLCBkLCBpKVxuICAgICAgfTtcbiAgICB9KTtcblxuICAgIGZ1bmN0aW9uIHZhbHVlKGQsIGkpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHg6IHNlbGYueCgpLmNhbGwobm9kZSwgZCwgaSksXG4gICAgICAgIHk6IHNlbGYueSgpLmNhbGwobm9kZSwgZCwgaSksXG4gICAgICAgIGR4OiBzZWxmLmR4KCkuY2FsbChub2RlLCBkLCBpKSxcbiAgICAgICAgd2lkdGg6IHNlbGYud2lkdGgoKS5jYWxsKG5vZGUsIGQsIGkpLFxuICAgICAgICBoZWlnaHQ6IHNlbGYuaGVpZ2h0KCkuY2FsbChub2RlLCBkLCBpKVxuICAgICAgfTtcbiAgICB9XG4gIH0pXG5cbiAgLmVudGVyKGZ1bmN0aW9uKGVsKSB7XG4gICAgZWwuYXR0cignY2xhc3MnLCAnYmFycyB3aWRnZXQnKTtcblxuICAgIGVsLmFwcGVuZCgnZGl2JylcbiAgICAgIC5hdHRyKCdjbGFzcycsICd0aXRsZScpO1xuXG4gICAgdmFyIHN2ZyA9IGVsLmFwcGVuZCgnZGl2JylcbiAgICAgIC5hdHRyKCdjbGFzcycsICdjaGFydCcpXG4gICAgICAuYXBwZW5kKCdzdmcnKVxuICAgICAgLmFwcGVuZCgnZycpO1xuXG4gICAgc3ZnLmFwcGVuZCgnZycpXG4gICAgICAuYXR0cignY2xhc3MnLCAnYmFycycpO1xuXG4gICAgc3ZnLmFwcGVuZCgnZycpXG4gICAgICAuYXR0cignY2xhc3MnLCAneSBheGlzJyk7XG5cbiAgICBzdmcuYXBwZW5kKCdnJylcbiAgICAgIC5hdHRyKCdjbGFzcycsICd4IGF4aXMnKTtcbiAgfSlcblxuICAuZHJhdyhmdW5jdGlvbihlbCkge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICB0aGlzLm5vcm1hbGl6ZShlbCk7XG5cbiAgICBlbC5zdHlsZSgnd2lkdGgnLCB1dGlscy5weCh0aGlzLndpZHRoKCkpKVxuICAgICAgLnN0eWxlKCdoZWlnaHQnLCB1dGlscy5weCh0aGlzLmhlaWdodCgpKSk7XG5cbiAgICBlbC5zZWxlY3QoJy53aWRnZXQgLnRpdGxlJylcbiAgICAgIC50ZXh0KGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQudGl0bGU7IH0pO1xuXG4gICAgdmFyIGNoYXJ0ID0gZWwuc2VsZWN0KCcuY2hhcnQnKVxuICAgICAgLmRhdHVtKGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQudmFsdWVzOyB9KTtcblxuICAgIHZhciBmeCA9IGQzLnRpbWUuc2NhbGUoKVxuICAgICAgLmRvbWFpbihbXG4gICAgICAgIGQzLm1pbihjaGFydC5kYXR1bSgpLCBmdW5jdGlvbihkKSB7IHJldHVybiBkLng7IH0pLFxuICAgICAgICBkMy5tYXgoY2hhcnQuZGF0dW0oKSwgZnVuY3Rpb24oZCkgeyByZXR1cm4gZC54ICsgZC5keDsgfSldKTtcblxuICAgIHZhciB5cyA9IGNoYXJ0LmRhdHVtKClcbiAgICAgIC5tYXAoZnVuY3Rpb24oZCkgeyByZXR1cm4gZC55OyB9KTtcblxuICAgIHZhciBmeSA9IGQzLnNjYWxlLmxpbmVhcigpXG4gICAgICAuZG9tYWluKFswLCB0aGlzLnlNYXgoKSh5cyldKTtcblxuICAgIHZhciBkaW1zID0gdXRpbHMuYm94KClcbiAgICAgIC53aWR0aCh1dGlscy5pbm5lcldpZHRoKGNoYXJ0KSlcbiAgICAgIC5oZWlnaHQodXRpbHMuaW5uZXJIZWlnaHQoY2hhcnQpKVxuICAgICAgLm1hcmdpbih0aGlzLm1hcmdpbigpKVxuICAgICAgLmNhbGMoKTtcblxuICAgIGNoYXJ0XG4gICAgICAuc3R5bGUoJ3dpZHRoJywgdXRpbHMucHgoZGltcy53aWR0aCkpXG4gICAgICAuc3R5bGUoJ2hlaWdodCcsIHV0aWxzLnB4KGRpbXMuaGVpZ2h0KSk7XG5cbiAgICBmeC5yYW5nZShbMCwgZGltcy5pbm5lcldpZHRoXSk7XG4gICAgZnkucmFuZ2UoW2RpbXMuaW5uZXJIZWlnaHQsIDBdKTtcblxuICAgIHZhciBzdmcgPSBjaGFydC5zZWxlY3QoJ3N2ZycpXG4gICAgICAuYXR0cignd2lkdGgnLCBkaW1zLndpZHRoKVxuICAgICAgLmF0dHIoJ2hlaWdodCcsIGRpbXMuaGVpZ2h0KVxuICAgICAgLnNlbGVjdCgnZycpXG4gICAgICAgIC5hdHRyKCd0cmFuc2Zvcm0nLCB1dGlscy50cmFuc2xhdGUoXG4gICAgICAgICAgZGltcy5tYXJnaW4ubGVmdCxcbiAgICAgICAgICBkaW1zLm1hcmdpbi50b3ApKTtcblxuICAgIHZhciBiYXIgPSBzdmcuc2VsZWN0KCcuYmFycycpXG4gICAgICAuc2VsZWN0QWxsKCcuYmFyJylcbiAgICAgIC5kYXRhKGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQ7IH0sXG4gICAgICAgICAgICBmdW5jdGlvbihkKSB7IHJldHVybiBkLng7IH0pO1xuXG4gICAgYmFyLmVudGVyKCkuYXBwZW5kKCdnJylcbiAgICAgIC5hdHRyKCdjbGFzcycsICdiYXInKVxuICAgICAgLmFwcGVuZCgncmVjdCcpO1xuXG4gICAgYmFyXG4gICAgICAuYXR0cigndHJhbnNmb3JtJywgZnVuY3Rpb24oZCkge1xuICAgICAgICByZXR1cm4gdXRpbHMudHJhbnNsYXRlKGZ4KGQueCksIGZ5KGQueSkpO1xuICAgICAgfSk7XG5cbiAgICBiYXIuc2VsZWN0KCdyZWN0JylcbiAgICAgIC5zdHlsZSgnZmlsbCcsIHRoaXMuY29sb3JzKCkoZWwuZGF0dW0oKS50aXRsZSkpXG4gICAgICAuYXR0cignd2lkdGgnLCBmdW5jdGlvbihkKSB7XG4gICAgICAgIHZhciB3aWR0aCA9IGZ4KGQueCArIGQuZHgpIC0gZngoZC54KTtcbiAgICAgICAgd2lkdGggLT0gc2VsZi5iYXJQYWRkaW5nKCk7XG4gICAgICAgIHJldHVybiBNYXRoLm1heCh3aWR0aCwgMSk7XG4gICAgICB9KVxuICAgICAgLmF0dHIoJ2hlaWdodCcsIGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgcmV0dXJuIGRpbXMuaW5uZXJIZWlnaHQgLSBmeShkLnkpOyBcbiAgICAgIH0pO1xuXG4gICAgYmFyLmV4aXQoKVxuICAgICAgLnJlbW92ZSgpO1xuXG4gICAgdmFyIGF4aXMgPSBkMy5zdmcuYXhpcygpXG4gICAgICAuc2NhbGUoZngpXG4gICAgICAudGlja3ModGhpcy54VGlja3MoKSlcbiAgICAgIC50aWNrRm9ybWF0KHRoaXMueFRpY2tGb3JtYXQoKSk7XG5cbiAgICBzdmcuc2VsZWN0KCcueC5heGlzJylcbiAgICAgIC5hdHRyKCd0cmFuc2Zvcm0nLCB1dGlscy50cmFuc2xhdGUoMCwgZGltcy5pbm5lckhlaWdodCkpXG4gICAgICAuY2FsbChheGlzKTtcblxuICAgIGF4aXMgPSBkMy5zdmcuYXhpcygpXG4gICAgICAub3JpZW50KCdsZWZ0JylcbiAgICAgIC5zY2FsZShmeSlcbiAgICAgIC50aWNrUGFkZGluZyg4KVxuICAgICAgLnRpY2tTaXplKC1kaW1zLmlubmVyV2lkdGgpXG4gICAgICAudGlja3ModGhpcy55VGlja3MoKSlcbiAgICAgIC50aWNrRm9ybWF0KHRoaXMueVRpY2tGb3JtYXQoKSk7XG4gICAgXG4gICAgc3ZnLnNlbGVjdCgnLnkuYXhpcycpXG4gICAgICAuY2FsbChheGlzKTtcbiAgfSk7XG4iLCJleHBvcnRzLnBpZSA9IHJlcXVpcmUoJy4vcGllJyk7XG5leHBvcnRzLmJhcnMgPSByZXF1aXJlKCcuL2JhcnMnKTtcbmV4cG9ydHMubGFzdCA9IHJlcXVpcmUoJy4vbGFzdCcpO1xuZXhwb3J0cy5saW5lcyA9IHJlcXVpcmUoJy4vbGluZXMnKTtcbmV4cG9ydHMud2lkZ2V0ID0gcmVxdWlyZSgnLi93aWRnZXQnKTtcbiIsInZhciB1dGlscyA9IHJlcXVpcmUoJy4uL3V0aWxzJyk7XG5cblxubW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKCcuL3dpZGdldCcpLmV4dGVuZCgpXG4gIC5wcm9wKCd3aWR0aCcpXG4gIC5kZWZhdWx0KDQwMClcblxuICAucHJvcCgnY29sc3BhbicpXG4gIC5kZWZhdWx0KDQpXG5cbiAgLnByb3AoJ3RpdGxlJylcbiAgLnNldChkMy5mdW5jdG9yKVxuICAuZGVmYXVsdChmdW5jdGlvbihkKSB7IHJldHVybiBkLnRpdGxlOyB9KVxuXG4gIC5wcm9wKCd2YWx1ZXMnKVxuICAuc2V0KGQzLmZ1bmN0b3IpXG4gIC5kZWZhdWx0KGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQudmFsdWVzOyB9KVxuXG4gIC5wcm9wKCd4JylcbiAgLnNldChkMy5mdW5jdG9yKVxuICAuZGVmYXVsdChmdW5jdGlvbihkKSB7IHJldHVybiBkLng7IH0pXG5cbiAgLnByb3AoJ3knKVxuICAuc2V0KGQzLmZ1bmN0b3IpXG4gIC5kZWZhdWx0KGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQueTsgfSlcblxuICAucHJvcCgneUZvcm1hdCcpXG4gIC5kZWZhdWx0KGQzLmZvcm1hdCgnLDJzJykpXG5cbiAgLnByb3AoJ2RpZmZGb3JtYXQnKVxuICAuZGVmYXVsdChkMy5mb3JtYXQoJyssMnMnKSlcblxuICAucHJvcCgneEZvcm1hdCcpXG4gIC5kZWZhdWx0KGQzLnRpbWUuZm9ybWF0KCclLWQgJWIgJS1IOiVNJykpXG5cbiAgLnByb3AoJ25vbmUnKVxuICAuZGVmYXVsdCgwKVxuXG4gIC5wcm9wKCdzdW1tYXJ5TGltaXQnKVxuICAuZGVmYXVsdCgyKVxuICAuc2V0KGZ1bmN0aW9uKHYpIHsgcmV0dXJuIE1hdGgubWF4KHV0aWxzLmVuc3VyZSh2LCAyKSwgMik7IH0pXG5cbiAgLnByb3AoJ3NwYXJrbGluZUxpbWl0JylcbiAgLmRlZmF1bHQoMTUpXG4gIC5zZXQoZnVuY3Rpb24odikgeyByZXR1cm4gTWF0aC5tYXgodXRpbHMuZW5zdXJlKHYsIDIpLCAyKTsgfSlcblxuICAucHJvcCgnc3BhcmtsaW5lJylcbiAgLnByb3AoJ3N1bW1hcnknKVxuXG4gIC5pbml0KGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuc3BhcmtsaW5lKHNwYXJrbGluZSh0aGlzKSk7XG4gICAgdGhpcy5zdW1tYXJ5KHN1bW1hcnkodGhpcykpO1xuICB9KVxuXG4gIC5lbnRlcihmdW5jdGlvbihlbCkge1xuICAgIGVsLmF0dHIoJ2NsYXNzJywgJ2xhc3Qgd2lkZ2V0Jyk7XG5cbiAgICBlbC5hcHBlbmQoJ2RpdicpXG4gICAgICAuYXR0cignY2xhc3MnLCAndGl0bGUnKTtcblxuICAgIHZhciB2YWx1ZXMgPSBlbC5hcHBlbmQoJ2RpdicpXG4gICAgICAuYXR0cignY2xhc3MnLCAndmFsdWVzJyk7XG5cbiAgICB2YWx1ZXMuYXBwZW5kKCdkaXYnKVxuICAgICAgLmF0dHIoJ2NsYXNzJywgJ2xhc3QgdmFsdWUnKTtcblxuICAgIHZhbHVlcy5hcHBlbmQoJ2RpdicpXG4gICAgICAuYXR0cignY2xhc3MnLCAnc3BhcmtsaW5lJyk7XG5cbiAgICB2YWx1ZXMuYXBwZW5kKCdkaXYnKVxuICAgICAgLmF0dHIoJ2NsYXNzJywgJ3N1bW1hcnknKTtcbiAgfSlcblxuICAuZHJhdyhmdW5jdGlvbihlbCkge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICB2YXIgbm9kZSA9IGVsLm5vZGUoKTtcblxuICAgIGVsLnN0eWxlKCd3aWR0aCcsIHV0aWxzLnB4KHRoaXMud2lkdGgoKSkpO1xuXG4gICAgZWwuc2VsZWN0KCcudGl0bGUnKVxuICAgICAgLnRleHQoZnVuY3Rpb24oZCwgaSkge1xuICAgICAgICByZXR1cm4gc2VsZi50aXRsZSgpLmNhbGwobm9kZSwgZCwgaSk7XG4gICAgICB9KTtcblxuICAgIHZhciB2YWx1ZXMgPSBlbC5zZWxlY3QoJy52YWx1ZXMnKVxuICAgICAgLmRhdHVtKGZ1bmN0aW9uKGQsIGkpIHtcbiAgICAgICAgcmV0dXJuIHNlbGYudmFsdWVzKClcbiAgICAgICAgICAuY2FsbChub2RlLCBkLCBpKVxuICAgICAgICAgIC5tYXAoZnVuY3Rpb24oZCwgaSkge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgeDogc2VsZi54KCkuY2FsbChub2RlLCBkLCBpKSxcbiAgICAgICAgICAgICAgeTogc2VsZi55KCkuY2FsbChub2RlLCBkLCBpKVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICB9KTtcbiAgICAgIH0pXG4gICAgICAuYXR0cignY2xhc3MnLCBmdW5jdGlvbihkKSB7XG4gICAgICAgIGQgPSBkLnNsaWNlKC0yKTtcblxuICAgICAgICBkID0gZC5sZW5ndGggPiAxXG4gICAgICAgICAgPyBkWzFdLnkgLSBkWzBdLnlcbiAgICAgICAgICA6IDA7XG5cbiAgICAgICAgaWYgKGQgPiAwKSB7IHJldHVybiAnZ29vZCB2YWx1ZXMnOyB9XG4gICAgICAgIGlmIChkIDwgMCkgeyByZXR1cm4gJ2JhZCB2YWx1ZXMnOyB9XG4gICAgICAgIHJldHVybiAnbmV1dHJhbCB2YWx1ZXMnO1xuICAgICAgfSk7XG5cbiAgICB2YWx1ZXMuc2VsZWN0KCcubGFzdC52YWx1ZScpXG4gICAgICAuZGF0dW0oZnVuY3Rpb24oZCwgaSkge1xuICAgICAgICBkID0gZFtkLmxlbmd0aCAtIDFdO1xuXG4gICAgICAgIHJldHVybiAhZFxuICAgICAgICAgID8gc2VsZi5ub25lKClcbiAgICAgICAgICA6IGQueTtcbiAgICAgIH0pXG4gICAgICAudGV4dCh0aGlzLnlGb3JtYXQoKSk7XG5cbiAgICB2YWx1ZXMuc2VsZWN0KCcuc3BhcmtsaW5lJylcbiAgICAgIC5jYWxsKHRoaXMuc3BhcmtsaW5lKCkpO1xuXG4gICAgdmFsdWVzLnNlbGVjdCgnLnN1bW1hcnknKVxuICAgICAgLmNhbGwodGhpcy5zdW1tYXJ5KCkpO1xuICB9KTtcblxuXG52YXIgc3VtbWFyeSA9IHJlcXVpcmUoJy4uL3ZpZXcnKS5leHRlbmQoKVxuICAucHJvcCgnd2lkZ2V0JylcblxuICAuaW5pdChmdW5jdGlvbih3aWRnZXQpIHtcbiAgICB0aGlzLndpZGdldCh3aWRnZXQpO1xuICB9KVxuXG4gIC5lbnRlcihmdW5jdGlvbihlbCkge1xuICAgIGVsLmFwcGVuZCgnc3BhbicpXG4gICAgICAuYXR0cignY2xhc3MnLCAnZGlmZicpO1xuXG4gICAgZWwuYXBwZW5kKCdzcGFuJylcbiAgICAgIC5hdHRyKCdjbGFzcycsICd0aW1lJyk7XG4gIH0pXG5cbiAgLmRyYXcoZnVuY3Rpb24oZWwpIHtcbiAgICB2YXIgd2lkZ2V0ID0gdGhpcy53aWRnZXQoKTtcblxuICAgIGlmIChlbC5kYXR1bSgpLmxlbmd0aCA8IHRoaXMud2lkZ2V0KCkuc3VtbWFyeUxpbWl0KCkpIHtcbiAgICAgIGVsLnN0eWxlKCdoZWlnaHQnLCAwKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBlbC5zZWxlY3QoJy5kaWZmJylcbiAgICAgIC5kYXR1bShmdW5jdGlvbihkKSB7XG4gICAgICAgIGQgPSBkLnNsaWNlKC0yKTtcbiAgICAgICAgcmV0dXJuIGRbMV0ueSAtIGRbMF0ueTtcbiAgICAgIH0pXG4gICAgICAudGV4dCh3aWRnZXQuZGlmZkZvcm1hdCgpKTtcblxuICAgIGVsLnNlbGVjdCgnLnRpbWUnKVxuICAgICAgLmRhdHVtKGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgZCA9IGQuc2xpY2UoLTIpO1xuXG4gICAgICAgIHJldHVybiBbZFswXS54LCBkWzFdLnhdXG4gICAgICAgICAgLm1hcCh1dGlscy5kYXRlKVxuICAgICAgICAgIC5tYXAod2lkZ2V0LnhGb3JtYXQoKSk7XG4gICAgICB9KVxuICAgICAgLnRleHQoZnVuY3Rpb24oZCkge1xuICAgICAgICByZXR1cm4gWycgZnJvbScsIGRbMF0sICd0bycsIGRbMV1dLmpvaW4oJyAnKTtcbiAgICAgIH0pO1xuICB9KTtcblxuXG52YXIgc3BhcmtsaW5lID0gcmVxdWlyZSgnLi4vdmlldycpLmV4dGVuZCgpXG4gIC5wcm9wKCd3aWRnZXQnKVxuXG4gIC5wcm9wKCdoZWlnaHQnKVxuICAuZGVmYXVsdCgyNSlcblxuICAucHJvcCgnbWFyZ2luJylcbiAgLmRlZmF1bHQoe1xuICAgIHRvcDogNCxcbiAgICBsZWZ0OiA0LFxuICAgIGJvdHRvbTogNCxcbiAgICByaWdodDogNCBcbiAgfSlcblxuICAuaW5pdChmdW5jdGlvbih3aWRnZXQpIHtcbiAgICB0aGlzLndpZGdldCh3aWRnZXQpO1xuICB9KVxuXG4gIC5lbnRlcihmdW5jdGlvbihlbCkge1xuICAgIHZhciBzdmcgPSBlbC5hcHBlbmQoJ3N2ZycpXG4gICAgICAuYXBwZW5kKCdnJyk7XG5cbiAgICBzdmcuYXBwZW5kKCdwYXRoJylcbiAgICAgIC5hdHRyKCdjbGFzcycsICdyZXN0IHBhdGgnKTtcblxuICAgIHN2Zy5hcHBlbmQoJ3BhdGgnKVxuICAgICAgLmF0dHIoJ2NsYXNzJywgJ2RpZmYgcGF0aCcpO1xuICB9KVxuXG4gIC5kcmF3KGZ1bmN0aW9uKGVsKSB7XG4gICAgaWYgKGVsLmRhdHVtKCkubGVuZ3RoIDwgdGhpcy53aWRnZXQoKS5zcGFya2xpbmVMaW1pdCgpKSB7XG4gICAgICBlbC5zdHlsZSgnaGVpZ2h0JywgMCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdmFyIGRpbXMgPSB1dGlscy5ib3goKVxuICAgICAgLm1hcmdpbih0aGlzLm1hcmdpbigpKVxuICAgICAgLndpZHRoKHV0aWxzLmlubmVyV2lkdGgoZWwpKVxuICAgICAgLmhlaWdodCh0aGlzLmhlaWdodCgpKVxuICAgICAgLmNhbGMoKTtcblxuICAgIHZhciBmeCA9IGQzLnNjYWxlLmxpbmVhcigpXG4gICAgICAuZG9tYWluKGQzLmV4dGVudChlbC5kYXR1bSgpLCBmdW5jdGlvbihkKSB7IHJldHVybiBkLng7IH0pKVxuICAgICAgLnJhbmdlKFswLCBkaW1zLmlubmVyV2lkdGhdKTtcblxuICAgIHZhciBmeSA9IGQzLnNjYWxlLmxpbmVhcigpXG4gICAgICAuZG9tYWluKGQzLmV4dGVudChlbC5kYXR1bSgpLCBmdW5jdGlvbihkKSB7IHJldHVybiBkLnk7IH0pKVxuICAgICAgLnJhbmdlKFtkaW1zLmlubmVySGVpZ2h0LCAwXSk7XG5cbiAgICB2YXIgbGluZSA9IGQzLnN2Zy5saW5lKClcbiAgICAgIC54KGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGZ4KGQueCk7IH0pXG4gICAgICAueShmdW5jdGlvbihkKSB7IHJldHVybiBmeShkLnkpOyB9KTtcblxuICAgIHZhciBzdmcgPSBlbC5zZWxlY3QoJ3N2ZycpXG4gICAgICAuYXR0cignd2lkdGgnLCBkaW1zLndpZHRoKVxuICAgICAgLmF0dHIoJ2hlaWdodCcsIGRpbXMuaGVpZ2h0KVxuICAgICAgLnNlbGVjdCgnZycpXG4gICAgICAgIC5hdHRyKCd0cmFuc2Zvcm0nLCB1dGlscy50cmFuc2xhdGUoZGltcy5tYXJnaW4ubGVmdCwgZGltcy5tYXJnaW4udG9wKSk7XG5cbiAgICBzdmcuc2VsZWN0KCcucmVzdC5wYXRoJylcbiAgICAgIC5hdHRyKCdkJywgbGluZSk7XG5cbiAgICBzdmcuc2VsZWN0KCcuZGlmZi5wYXRoJylcbiAgICAgIC5kYXR1bShmdW5jdGlvbihkKSB7IHJldHVybiBkLnNsaWNlKC0yKTsgfSlcbiAgICAgIC5hdHRyKCdkJywgbGluZSk7XG5cbiAgICB2YXIgZG90ID0gc3ZnLnNlbGVjdEFsbCgnLmRvdCcpXG4gICAgICAuZGF0YShmdW5jdGlvbihkKSB7IHJldHVybiBkLnNsaWNlKC0xKTsgfSk7XG5cbiAgICBkb3QuZW50ZXIoKS5hcHBlbmQoJ2NpcmNsZScpXG4gICAgICAuYXR0cignY2xhc3MnLCAnZG90JylcbiAgICAgIC5hdHRyKCdyJywgNCk7XG5cbiAgICBkb3RcbiAgICAgIC5hdHRyKCdjeCcsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGZ4KGQueCk7IH0pXG4gICAgICAuYXR0cignY3knLCBmdW5jdGlvbihkKSB7IHJldHVybiBmeShkLnkpOyB9KTtcblxuICAgIGRvdC5leGl0KCkucmVtb3ZlKCk7XG4gIH0pO1xuIiwidmFyIHV0aWxzID0gcmVxdWlyZSgnLi4vdXRpbHMnKTtcblxuXG5tb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoJy4vd2lkZ2V0JykuZXh0ZW5kKClcbiAgLnByb3AoJ3dpZHRoJylcbiAgLmRlZmF1bHQoNDAwKVxuXG4gIC5wcm9wKCdjb2xzcGFuJylcbiAgLmRlZmF1bHQoNClcblxuICAucHJvcCgndGl0bGUnKVxuICAuc2V0KGQzLmZ1bmN0b3IpXG4gIC5kZWZhdWx0KGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQudGl0bGU7IH0pXG5cbiAgLnByb3AoJ21ldHJpY3MnKVxuICAuc2V0KGQzLmZ1bmN0b3IpXG4gIC5kZWZhdWx0KGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQubWV0cmljczsgfSlcblxuICAucHJvcCgna2V5JylcbiAgLnNldChkMy5mdW5jdG9yKVxuICAuZGVmYXVsdChmdW5jdGlvbihkLCBpKSB7IHJldHVybiBpOyB9KVxuXG4gIC5wcm9wKCdtZXRyaWNUaXRsZScpXG4gIC5zZXQoZDMuZnVuY3RvcilcbiAgLmRlZmF1bHQoZnVuY3Rpb24oZCkgeyByZXR1cm4gZC50aXRsZTsgfSlcblxuICAucHJvcCgndmFsdWVzJylcbiAgLnNldChkMy5mdW5jdG9yKVxuICAuZGVmYXVsdChmdW5jdGlvbihkKSB7IHJldHVybiBkLnZhbHVlczsgfSlcblxuICAucHJvcCgneCcpXG4gIC5zZXQoZDMuZnVuY3RvcilcbiAgLmRlZmF1bHQoZnVuY3Rpb24oZCkgeyByZXR1cm4gZC54OyB9KVxuXG4gIC5wcm9wKCd5JylcbiAgLnNldChkMy5mdW5jdG9yKVxuICAuZGVmYXVsdChmdW5jdGlvbihkKSB7IHJldHVybiBkLnk7IH0pXG5cbiAgLnByb3AoJ3hUaWNrRm9ybWF0JylcbiAgLmRlZmF1bHQobnVsbClcblxuICAucHJvcCgneFRpY2tzJylcbiAgLmRlZmF1bHQoOClcblxuICAucHJvcCgneUZvcm1hdCcpXG4gIC5kZWZhdWx0KGQzLmZvcm1hdCgnLDJzJykpXG5cbiAgLnByb3AoJ3lUaWNrcycpXG4gIC5kZWZhdWx0KDUpXG5cbiAgLnByb3AoJ3lUaWNrRm9ybWF0JylcbiAgLmRlZmF1bHQoZDMuZm9ybWF0KCcuMnMnKSlcblxuICAucHJvcCgneU1pbicpXG4gIC5zZXQoZDMuZnVuY3RvcilcbiAgLmRlZmF1bHQoZDMubWluKVxuXG4gIC5wcm9wKCd5TWF4JylcbiAgLnNldChkMy5mdW5jdG9yKVxuICAuZGVmYXVsdChkMy5tYXgpXG5cbiAgLnByb3AoJ25vbmUnKVxuICAuZGVmYXVsdCgwKVxuXG4gIC5wcm9wKCdjb2xvcnMnKVxuICAucHJvcCgnY2hhcnQnKVxuICAucHJvcCgnbGVnZW5kJylcblxuICAuaW5pdChmdW5jdGlvbigpIHtcbiAgICB0aGlzLmNoYXJ0KGNoYXJ0KHRoaXMpKTtcbiAgICB0aGlzLmxlZ2VuZChsZWdlbmQodGhpcykpO1xuICAgIHRoaXMuY29sb3JzKGQzLnNjYWxlLmNhdGVnb3J5MTAoKSk7XG4gIH0pXG5cbiAgLmVudGVyKGZ1bmN0aW9uKGVsKSB7XG4gICAgZWwuYXR0cignY2xhc3MnLCAnbGluZXMgd2lkZ2V0Jyk7XG5cbiAgICBlbC5hcHBlbmQoJ2RpdicpXG4gICAgICAuYXR0cignY2xhc3MnLCAndGl0bGUnKTtcblxuICAgIHZhciB2YWx1ZXMgPSBlbC5hcHBlbmQoJ2RpdicpXG4gICAgICAuYXR0cignY2xhc3MnLCAndmFsdWVzJyk7XG5cbiAgICB2YWx1ZXMuYXBwZW5kKCdkaXYnKVxuICAgICAgLmF0dHIoJ2NsYXNzJywgJ2NoYXJ0Jyk7XG5cbiAgICB2YWx1ZXMuYXBwZW5kKCdkaXYnKVxuICAgICAgLmF0dHIoJ2NsYXNzJywgJ2xlZ2VuZCcpO1xuICB9KVxuXG4gIC5tZXRoKCdub3JtYWxpemUnLCBmdW5jdGlvbihlbCkge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICB2YXIgbm9kZSA9IGVsLm5vZGUoKTtcblxuICAgIGVsLmRhdHVtKGZ1bmN0aW9uKGQsIGkpIHtcbiAgICAgIHZhciB0aXRsZSA9IHNlbGYudGl0bGUoKS5jYWxsKG5vZGUsIGQsIGkpO1xuXG4gICAgICByZXR1cm4ge1xuICAgICAgICB0aXRsZTogdGl0bGUsXG4gICAgICAgIG1ldHJpY3M6IHNlbGYubWV0cmljcygpXG4gICAgICAgICAgLmNhbGwobm9kZSwgZCwgaSlcbiAgICAgICAgICAubWFwKG1ldHJpYylcbiAgICAgIH07XG4gICAgfSk7XG5cbiAgICBmdW5jdGlvbiBtZXRyaWMoZCwgaSkge1xuICAgICAgdmFyIGtleSA9IHNlbGYua2V5KClcbiAgICAgICAgLmNhbGwobm9kZSwgZCwgaSlcbiAgICAgICAgLnRvU3RyaW5nKCk7XG5cbiAgICAgIHJldHVybiB7XG4gICAgICAgIGtleToga2V5LFxuICAgICAgICBjb2xvcjogc2VsZi5jb2xvcnMoKShrZXkpLFxuICAgICAgICB0aXRsZTogc2VsZi5tZXRyaWNUaXRsZSgpLmNhbGwobm9kZSwgZCwgaSksXG4gICAgICAgIHZhbHVlczogc2VsZi52YWx1ZXMoKVxuICAgICAgICAgIC5jYWxsKG5vZGUsIGQsIGkpXG4gICAgICAgICAgLm1hcCh2YWx1ZSlcbiAgICAgIH07XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gdmFsdWUoZCwgaSkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgeDogc2VsZi54KCkuY2FsbChub2RlLCBkLCBpKSxcbiAgICAgICAgeTogc2VsZi55KCkuY2FsbChub2RlLCBkLCBpKVxuICAgICAgfTtcbiAgICB9XG4gIH0pXG5cbiAgLmRyYXcoZnVuY3Rpb24oZWwpIHtcbiAgICB0aGlzLm5vcm1hbGl6ZShlbCk7XG5cbiAgICBlbC5zdHlsZSgnd2lkdGgnLCB1dGlscy5weCh0aGlzLndpZHRoKCkpKTtcblxuICAgIGVsLnNlbGVjdCgnLndpZGdldCAudGl0bGUnKVxuICAgICAgLnRleHQoZnVuY3Rpb24oZCkgeyByZXR1cm4gZC50aXRsZTsgfSk7XG5cbiAgICB2YXIgdmFsdWVzID0gZWwuc2VsZWN0KCcudmFsdWVzJylcbiAgICAgIC5kYXR1bShmdW5jdGlvbihkLCBpKSB7IHJldHVybiBkLm1ldHJpY3M7IH0pO1xuXG4gICAgdmFsdWVzLnNlbGVjdCgnLmNoYXJ0JylcbiAgICAgIC5jYWxsKHRoaXMuY2hhcnQoKSk7XG5cbiAgICB2YWx1ZXMuc2VsZWN0KCcubGVnZW5kJylcbiAgICAgIC5jYWxsKHRoaXMubGVnZW5kKCkpO1xuICB9KTtcblxuXG52YXIgY2hhcnQgPSByZXF1aXJlKCcuLi92aWV3JykuZXh0ZW5kKClcbiAgLnByb3AoJ2hlaWdodCcpXG4gIC5kZWZhdWx0KDE1MClcblxuICAucHJvcCgnbWFyZ2luJylcbiAgLmRlZmF1bHQoe1xuICAgIHRvcDogMTAsXG4gICAgbGVmdDogMzUsXG4gICAgcmlnaHQ6IDE1LFxuICAgIGJvdHRvbTogMjBcbiAgfSlcblxuICAucHJvcCgnd2lkZ2V0JylcblxuICAuaW5pdChmdW5jdGlvbih3aWRnZXQpIHtcbiAgICB0aGlzLndpZGdldCh3aWRnZXQpO1xuICB9KVxuXG4gIC5lbnRlcihmdW5jdGlvbihlbCkge1xuICAgIHZhciBzdmcgPSBlbC5hcHBlbmQoJ3N2ZycpXG4gICAgICAuYXBwZW5kKCdnJyk7XG5cbiAgICBzdmcuYXBwZW5kKCdnJylcbiAgICAgIC5hdHRyKCdjbGFzcycsICd4IGF4aXMnKTtcblxuICAgIHN2Zy5hcHBlbmQoJ2cnKVxuICAgICAgLmF0dHIoJ2NsYXNzJywgJ3kgYXhpcycpO1xuXG4gICAgc3ZnLmFwcGVuZCgnZycpXG4gICAgICAuYXR0cignY2xhc3MnLCAnbGluZXMnKTtcbiAgfSlcblxuICAuZHJhdyhmdW5jdGlvbihlbCkge1xuICAgIHZhciB3aWRnZXQgPSB0aGlzLndpZGdldCgpO1xuXG4gICAgdmFyIGRpbXMgPSB1dGlscy5ib3goKVxuICAgICAgLm1hcmdpbih0aGlzLm1hcmdpbigpKVxuICAgICAgLndpZHRoKHV0aWxzLmlubmVyV2lkdGgoZWwpKVxuICAgICAgLmhlaWdodCh0aGlzLmhlaWdodCgpKVxuICAgICAgLmNhbGMoKTtcblxuICAgIHZhciBhbGxWYWx1ZXMgPSBlbFxuICAgICAgLmRhdHVtKClcbiAgICAgIC5yZWR1Y2UoZnVuY3Rpb24ocmVzdWx0cywgbWV0cmljKSB7XG4gICAgICAgIHJlc3VsdHMucHVzaC5hcHBseShyZXN1bHRzLCBtZXRyaWMudmFsdWVzKTtcbiAgICAgICAgcmV0dXJuIHJlc3VsdHM7XG4gICAgICB9LCBbXSk7XG5cbiAgICB2YXIgZnggPSBkMy50aW1lLnNjYWxlKClcbiAgICAgIC5kb21haW4oZDMuZXh0ZW50KGFsbFZhbHVlcywgZnVuY3Rpb24oZCkgeyByZXR1cm4gZC54OyB9KSlcbiAgICAgIC5yYW5nZShbMCwgZGltcy5pbm5lcldpZHRoXSk7XG5cbiAgICB2YXIgeXMgPSBhbGxWYWx1ZXNcbiAgICAgIC5tYXAoZnVuY3Rpb24oZCkgeyByZXR1cm4gZC55OyB9KTtcblxuICAgIHZhciBmeSA9IGQzLnNjYWxlLmxpbmVhcigpXG4gICAgICAuZG9tYWluKFt3aWRnZXQueU1pbigpKHlzKSwgd2lkZ2V0LnlNYXgoKSh5cyldKVxuICAgICAgLnJhbmdlKFtkaW1zLmlubmVySGVpZ2h0LCAwXSk7XG5cbiAgICB2YXIgbGluZSA9IGQzLnN2Zy5saW5lKClcbiAgICAgIC54KGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGZ4KGQueCk7IH0pXG4gICAgICAueShmdW5jdGlvbihkKSB7IHJldHVybiBmeShkLnkpOyB9KTtcblxuICAgIHZhciBzdmcgPSBlbC5zZWxlY3QoJ3N2ZycpXG4gICAgICAuYXR0cignd2lkdGgnLCBkaW1zLndpZHRoKVxuICAgICAgLmF0dHIoJ2hlaWdodCcsIGRpbXMuaGVpZ2h0KVxuICAgICAgLnNlbGVjdCgnZycpXG4gICAgICAgIC5hdHRyKCd0cmFuc2Zvcm0nLCB1dGlscy50cmFuc2xhdGUoZGltcy5tYXJnaW4ubGVmdCwgZGltcy5tYXJnaW4udG9wKSk7XG5cbiAgICB2YXIgbWV0cmljID0gc3ZnLnNlbGVjdCgnLmxpbmVzJykuc2VsZWN0QWxsKCcubWV0cmljJylcbiAgICAgIC5kYXRhKGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQ7IH0sXG4gICAgICAgICAgICBmdW5jdGlvbihkKSB7IHJldHVybiBkLmtleTsgfSk7XG5cbiAgICBtZXRyaWMuZW50ZXIoKS5hcHBlbmQoJ2cnKVxuICAgICAgLmF0dHIoJ2NsYXNzJywgJ21ldHJpYycpXG4gICAgICAuYXR0cignZGF0YS1rZXknLCBmdW5jdGlvbihkKSB7IHJldHVybiBkLmtleTsgfSlcbiAgICAgIC5hcHBlbmQoJ3BhdGgnKVxuICAgICAgICAuYXR0cignY2xhc3MnLCAnbGluZScpO1xuXG4gICAgbWV0cmljLnNlbGVjdCgnLmxpbmUnKVxuICAgICAgLmF0dHIoJ3N0cm9rZScsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQuY29sb3I7IH0pXG4gICAgICAuYXR0cignZCcsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGxpbmUoZC52YWx1ZXMpOyB9KTtcblxuICAgIHZhciBkb3QgPSBtZXRyaWMuc2VsZWN0QWxsKCcuZG90JylcbiAgICAgIC5kYXRhKGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgaWYgKCFkLnZhbHVlcy5sZW5ndGgpIHsgcmV0dXJuIFtdOyB9XG4gICAgICAgIHZhciBsYXN0ID0gZC52YWx1ZXNbZC52YWx1ZXMubGVuZ3RoIC0gMV07XG5cbiAgICAgICAgcmV0dXJuIFt7XG4gICAgICAgICAgeDogbGFzdC54LFxuICAgICAgICAgIHk6IGxhc3QueSxcbiAgICAgICAgICBjb2xvcjogZC5jb2xvclxuICAgICAgICB9XTtcbiAgICAgIH0pO1xuXG4gICAgZG90LmVudGVyKCkuYXBwZW5kKCdjaXJjbGUnKVxuICAgICAgLmF0dHIoJ2NsYXNzJywgJ2RvdCcpXG4gICAgICAuYXR0cigncicsIDQpO1xuXG4gICAgZG90XG4gICAgICAuYXR0cignZmlsbCcsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQuY29sb3I7IH0pXG4gICAgICAuYXR0cignY3gnLCBmdW5jdGlvbihkKSB7IHJldHVybiBmeChkLngpOyB9KVxuICAgICAgLmF0dHIoJ2N5JywgZnVuY3Rpb24oZCkgeyByZXR1cm4gZnkoZC55KTsgfSk7XG5cbiAgICBkb3QuZXhpdCgpXG4gICAgICAucmVtb3ZlKCk7XG5cbiAgICBtZXRyaWMuZXhpdCgpXG4gICAgICAucmVtb3ZlKCk7XG5cbiAgICB2YXIgYXhpcyA9IGQzLnN2Zy5heGlzKClcbiAgICAgIC5zY2FsZShmeClcbiAgICAgIC50aWNrUGFkZGluZyg4KVxuICAgICAgLnRpY2tzKHdpZGdldC54VGlja3MoKSlcbiAgICAgIC50aWNrRm9ybWF0KHdpZGdldC54VGlja0Zvcm1hdCgpKVxuICAgICAgLnRpY2tTaXplKC1kaW1zLmlubmVySGVpZ2h0KTtcblxuICAgIHN2Zy5zZWxlY3QoJy54LmF4aXMnKVxuICAgICAgLmF0dHIoJ3RyYW5zZm9ybScsIHV0aWxzLnRyYW5zbGF0ZSgwLCBkaW1zLmlubmVySGVpZ2h0KSlcbiAgICAgIC5jYWxsKGF4aXMpO1xuXG4gICAgYXhpcyA9IGQzLnN2Zy5heGlzKClcbiAgICAgIC5vcmllbnQoJ2xlZnQnKVxuICAgICAgLnNjYWxlKGZ5KVxuICAgICAgLnRpY2tQYWRkaW5nKDgpXG4gICAgICAudGlja3Mod2lkZ2V0LnlUaWNrcygpKVxuICAgICAgLnRpY2tGb3JtYXQod2lkZ2V0LnlUaWNrRm9ybWF0KCkpXG4gICAgICAudGlja1NpemUoLWRpbXMuaW5uZXJXaWR0aCk7XG4gICAgXG4gICAgc3ZnLnNlbGVjdCgnLnkuYXhpcycpXG4gICAgICAuY2FsbChheGlzKTtcbiAgfSk7XG5cblxudmFyIGxlZ2VuZCA9IHJlcXVpcmUoJy4uL3ZpZXcnKS5leHRlbmQoKVxuICAucHJvcCgnd2lkZ2V0JylcblxuICAuaW5pdChmdW5jdGlvbih3aWRnZXQpIHtcbiAgICB0aGlzLndpZGdldCh3aWRnZXQpO1xuICB9KVxuXG4gIC5lbnRlcihmdW5jdGlvbihlbCkge1xuICAgIGVsLmFwcGVuZCgndGFibGUnKVxuICAgICAgLmF0dHIoJ2NsYXNzJywgJ3RhYmxlJyk7XG4gIH0pXG5cbiAgLmRyYXcoZnVuY3Rpb24oZWwpIHtcbiAgICB2YXIgbm9uZSA9IHRoaXMud2lkZ2V0KCkubm9uZSgpO1xuICAgIHZhciB5Rm9ybWF0ID0gdGhpcy53aWRnZXQoKS55Rm9ybWF0KCk7XG5cbiAgICB2YXIgbWV0cmljID0gZWwuc2VsZWN0KCcudGFibGUnKS5zZWxlY3RBbGwoJy5tZXRyaWMnKVxuICAgICAgLmRhdGEoZnVuY3Rpb24oZCkgeyByZXR1cm4gZDsgfSxcbiAgICAgICAgICAgIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQua2V5OyB9KTtcblxuICAgIHZhciBlbnRlck1ldHJpYyA9IG1ldHJpYy5lbnRlcigpLmFwcGVuZCgndHInKVxuICAgICAgLmF0dHIoJ2RhdGEta2V5JywgZnVuY3Rpb24oZCkgeyByZXR1cm4gZC5rZXk7IH0pXG4gICAgICAuYXR0cignY2xhc3MnLCAnbWV0cmljJyk7XG5cbiAgICBlbnRlck1ldHJpYy5hcHBlbmQoJ3RkJylcbiAgICAgIC5hdHRyKCdjbGFzcycsICdzd2F0Y2gnKTtcblxuICAgIGVudGVyTWV0cmljLmFwcGVuZCgndGQnKVxuICAgICAgLmF0dHIoJ2NsYXNzJywgJ3RpdGxlJyk7XG5cbiAgICBlbnRlck1ldHJpYy5hcHBlbmQoJ3RkJylcbiAgICAgIC5hdHRyKCdjbGFzcycsICd2YWx1ZScpO1xuXG4gICAgbWV0cmljLnNlbGVjdCgnLnN3YXRjaCcpXG4gICAgICAuc3R5bGUoJ2JhY2tncm91bmQnLCBmdW5jdGlvbihkKSB7IHJldHVybiBkLmNvbG9yOyB9KTtcblxuICAgIG1ldHJpYy5zZWxlY3QoJy50aXRsZScpXG4gICAgICAudGV4dChmdW5jdGlvbihkKSB7IHJldHVybiBkLnRpdGxlOyB9KTtcblxuICAgIG1ldHJpYy5zZWxlY3QoJy52YWx1ZScpXG4gICAgICAudGV4dChmdW5jdGlvbihkKSB7XG4gICAgICAgIGQgPSBkLnZhbHVlc1tkLnZhbHVlcy5sZW5ndGggLSAxXTtcblxuICAgICAgICByZXR1cm4gZFxuICAgICAgICAgID8geUZvcm1hdChkLnkpXG4gICAgICAgICAgOiB5Rm9ybWF0KG5vbmUpO1xuICAgICAgfSk7XG5cbiAgICBtZXRyaWMuZXhpdCgpXG4gICAgICAucmVtb3ZlKCk7XG4gIH0pO1xuIiwidmFyIHV0aWxzID0gcmVxdWlyZSgnLi4vdXRpbHMnKTtcblxuXG5tb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoJy4vd2lkZ2V0JykuZXh0ZW5kKClcbiAgLnByb3AoJ3dpZHRoJylcbiAgLmRlZmF1bHQoNDAwKVxuXG4gIC5wcm9wKCdjb2xzcGFuJylcbiAgLmRlZmF1bHQoNClcblxuICAucHJvcCgnY29sb3JzJylcblxuICAucHJvcCgndGl0bGUnKVxuICAuc2V0KGQzLmZ1bmN0b3IpXG4gIC5kZWZhdWx0KGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQudGl0bGU7IH0pXG5cbiAgLnByb3AoJ21ldHJpY3MnKVxuICAuc2V0KGQzLmZ1bmN0b3IpXG4gIC5kZWZhdWx0KGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQubWV0cmljczsgfSlcblxuICAucHJvcCgna2V5JylcbiAgLnNldChkMy5mdW5jdG9yKVxuICAuZGVmYXVsdChmdW5jdGlvbihkLCBpKSB7IHJldHVybiBpOyB9KVxuXG4gIC5wcm9wKCdtZXRyaWNUaXRsZScpXG4gIC5zZXQoZDMuZnVuY3RvcilcbiAgLmRlZmF1bHQoZnVuY3Rpb24oZCkgeyByZXR1cm4gZC50aXRsZTsgfSlcblxuICAucHJvcCgndmFsdWUnKVxuICAuc2V0KGQzLmZ1bmN0b3IpXG4gIC5kZWZhdWx0KGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQudmFsdWU7IH0pXG5cbiAgLnByb3AoJ21hcmdpbicpXG4gIC5kZWZhdWx0KHtcbiAgICB0b3A6IDIwLFxuICAgIGxlZnQ6IDIwLFxuICAgIHJpZ2h0OiAyMCxcbiAgICBib3R0b206IDIwXG4gIH0pXG5cbiAgLnByb3AoJ2lubmVyUmFkaXVzJylcbiAgLnNldChkMy5mdW5jdG9yKVxuICAuZGVmYXVsdCgwKVxuXG4gIC5wcm9wKCd2YWx1ZUZvcm1hdCcpXG4gIC5kZWZhdWx0KGQzLmZvcm1hdCgnLDJzJykpXG5cbiAgLnByb3AoJ3BlcmNlbnRGb3JtYXQnKVxuICAuZGVmYXVsdChkMy5mb3JtYXQoJy4wJScpKVxuXG4gIC5pbml0KGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuY29sb3JzKGQzLnNjYWxlLmNhdGVnb3J5MTAoKSk7XG4gIH0pXG5cbiAgLm1ldGgoJ25vcm1hbGl6ZScsIGZ1bmN0aW9uKGVsKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIHZhciBub2RlID0gZWwubm9kZSgpO1xuXG4gICAgZWwuZGF0dW0oZnVuY3Rpb24oZCwgaSkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgdGl0bGU6IHNlbGYudGl0bGUoKS5jYWxsKG5vZGUsIGQsIGkpLFxuICAgICAgICBtZXRyaWNzOiBzZWxmLm1ldHJpY3MoKVxuICAgICAgICAgIC5jYWxsKG5vZGUsIGQsIGkpXG4gICAgICAgICAgLm1hcChtZXRyaWMpXG4gICAgICB9O1xuICAgIH0pO1xuXG4gICAgZnVuY3Rpb24gbWV0cmljKGQsIGkpIHtcbiAgICAgIHZhciBrZXkgPSBzZWxmLmtleSgpXG4gICAgICAgIC5jYWxsKG5vZGUsIGQsIGkpXG4gICAgICAgIC50b1N0cmluZygpO1xuXG4gICAgICByZXR1cm4ge1xuICAgICAgICBrZXk6IGtleSxcbiAgICAgICAgY29sb3I6IHNlbGYuY29sb3JzKCkoa2V5KSxcbiAgICAgICAgdGl0bGU6IHNlbGYubWV0cmljVGl0bGUoKS5jYWxsKG5vZGUsIGQsIGkpLFxuICAgICAgICB2YWx1ZTogc2VsZi52YWx1ZSgpLmNhbGwobm9kZSwgZCwgaSlcbiAgICAgIH07XG4gICAgfVxuXG4gICAgdmFyIHN1bSA9IGQzLnN1bShlbC5kYXR1bSgpLm1ldHJpY3MsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQudmFsdWU7IH0pO1xuICAgIGVsLmRhdHVtKCkubWV0cmljcy5mb3JFYWNoKGZ1bmN0aW9uKGQpIHsgZC5wZXJjZW50ID0gZC52YWx1ZSAvIHN1bTsgfSk7XG4gIH0pXG5cbiAgLmVudGVyKGZ1bmN0aW9uKGVsKSB7XG4gICAgZWwuYXR0cignY2xhc3MnLCAncGllIHdpZGdldCcpO1xuXG4gICAgZWwuYXBwZW5kKCdkaXYnKVxuICAgICAgLmF0dHIoJ2NsYXNzJywgJ3RpdGxlJyk7XG5cbiAgICBlbC5hcHBlbmQoJ2RpdicpXG4gICAgICAuYXR0cignY2xhc3MnLCAnY2hhcnQnKTtcblxuICAgIGVsLmFwcGVuZCgnZGl2JylcbiAgICAgIC5hdHRyKCdjbGFzcycsICdsZWdlbmQnKTtcbiAgfSlcblxuICAuZHJhdyhmdW5jdGlvbihlbCkge1xuICAgIHRoaXMubm9ybWFsaXplKGVsKTtcblxuICAgIGVsLnN0eWxlKCd3aWR0aCcsIHV0aWxzLnB4KHRoaXMud2lkdGgoKSkpO1xuXG4gICAgZWwuc2VsZWN0KCcud2lkZ2V0IC50aXRsZScpXG4gICAgICAudGV4dChmdW5jdGlvbihkKSB7IHJldHVybiBkLnRpdGxlOyB9KTtcblxuICAgIGVsLnNlbGVjdCgnLmxlZ2VuZCcpXG4gICAgICAuY2FsbChsZWdlbmQodGhpcykpO1xuXG4gICAgZWwuc2VsZWN0KCcuY2hhcnQnKVxuICAgICAgLmNhbGwoY2hhcnQodGhpcykpO1xuICB9KTtcblxuXG52YXIgY2hhcnQgPSByZXF1aXJlKCcuLi92aWV3JykuZXh0ZW5kKClcbiAgLnByb3AoJ3dpZGdldCcpXG5cbiAgLmluaXQoZnVuY3Rpb24od2lkZ2V0KSB7XG4gICAgdGhpcy53aWRnZXQod2lkZ2V0KTtcbiAgfSlcblxuICAuZW50ZXIoZnVuY3Rpb24oZWwpIHtcbiAgICBlbC5hcHBlbmQoJ3N2ZycpXG4gICAgICAuYXBwZW5kKCdnJyk7XG4gIH0pXG5cbiAgLmRyYXcoZnVuY3Rpb24oZWwpIHtcbiAgICB2YXIgd2lkdGggPSB1dGlscy5pbm5lcldpZHRoKGVsKTtcblxuICAgIHZhciBkaW1zID0gdXRpbHMuYm94KClcbiAgICAgIC5tYXJnaW4odGhpcy53aWRnZXQoKS5tYXJnaW4oKSlcbiAgICAgIC53aWR0aCh3aWR0aClcbiAgICAgIC5oZWlnaHQod2lkdGgpXG4gICAgICAuY2FsYygpO1xuXG4gICAgdmFyIHJhZGl1cyA9IE1hdGgubWluKGRpbXMuaW5uZXJXaWR0aCwgZGltcy5pbm5lckhlaWdodCkgLyAyO1xuXG4gICAgdmFyIHN2ZyA9IGVsLnNlbGVjdCgnc3ZnJylcbiAgICAgIC5hdHRyKCd3aWR0aCcsIGRpbXMud2lkdGgpXG4gICAgICAuYXR0cignaGVpZ2h0JywgZGltcy5oZWlnaHQpXG4gICAgICAuc2VsZWN0KCdnJylcbiAgICAgICAgLmF0dHIoJ3RyYW5zZm9ybScsIHV0aWxzLnRyYW5zbGF0ZShcbiAgICAgICAgICAoZGltcy53aWR0aCAvIDIpIC0gcmFkaXVzLFxuICAgICAgICAgIChkaW1zLmhlaWdodCAvIDIpIC0gcmFkaXVzKSk7XG5cbiAgICB2YXIgYXJjID0gZDMuc3ZnLmFyYygpXG4gICAgICAuaW5uZXJSYWRpdXModGhpcy53aWRnZXQoKS5pbm5lclJhZGl1cygpKHJhZGl1cykpXG4gICAgICAub3V0ZXJSYWRpdXMocmFkaXVzKTtcblxuICAgIHZhciBsYXlvdXQgPSBkMy5sYXlvdXQucGllKClcbiAgICAgIC52YWx1ZShmdW5jdGlvbihkKSB7IHJldHVybiBkLnZhbHVlOyB9KTtcblxuICAgIHZhciBzbGljZSA9IHN2Zy5zZWxlY3RBbGwoJy5zbGljZScpXG4gICAgICAuZGF0YShmdW5jdGlvbihkKSB7IHJldHVybiBsYXlvdXQoZC5tZXRyaWNzKTsgfSxcbiAgICAgICAgICAgIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQuZGF0YS5rZXk7IH0pO1xuXG4gICAgc2xpY2UuZW50ZXIoKS5hcHBlbmQoJ2cnKVxuICAgICAgLmF0dHIoJ2NsYXNzJywgJ3NsaWNlJylcbiAgICAgIC5hcHBlbmQoJ3BhdGgnKTtcblxuICAgIHNsaWNlXG4gICAgICAuYXR0cigndHJhbnNmb3JtJywgdXRpbHMudHJhbnNsYXRlKHJhZGl1cywgcmFkaXVzKSk7XG5cbiAgICBzbGljZS5zZWxlY3QoJ3BhdGgnKVxuICAgICAgLmF0dHIoJ2QnLCBhcmMpXG4gICAgICAuc3R5bGUoJ2ZpbGwnLCBmdW5jdGlvbihkKSB7IHJldHVybiBkLmRhdGEuY29sb3I7IH0pO1xuXG4gICAgc2xpY2UuZXhpdCgpXG4gICAgICAucmVtb3ZlKCk7XG4gIH0pO1xuXG5cbnZhciBsZWdlbmQgPSByZXF1aXJlKCcuLi92aWV3JykuZXh0ZW5kKClcbiAgLnByb3AoJ3dpZGdldCcpXG5cbiAgLmluaXQoZnVuY3Rpb24od2lkZ2V0KSB7XG4gICAgdGhpcy53aWRnZXQod2lkZ2V0KTtcbiAgfSlcblxuICAuZW50ZXIoZnVuY3Rpb24oZWwpIHtcbiAgICBlbC5hcHBlbmQoJ3RhYmxlJylcbiAgICAgIC5hdHRyKCdjbGFzcycsICd0YWJsZScpO1xuICB9KVxuXG4gIC5kcmF3KGZ1bmN0aW9uKGVsKSB7XG4gICAgdmFyIHZhbHVlRm9ybWF0ID0gdGhpcy53aWRnZXQoKS52YWx1ZUZvcm1hdCgpO1xuICAgIHZhciBwZXJjZW50Rm9ybWF0ID0gdGhpcy53aWRnZXQoKS5wZXJjZW50Rm9ybWF0KCk7XG5cbiAgICB2YXIgbWV0cmljID0gZWwuc2VsZWN0KCcudGFibGUnKS5zZWxlY3RBbGwoJy5tZXRyaWMnKVxuICAgICAgLmRhdGEoZnVuY3Rpb24oZCkgeyByZXR1cm4gZC5tZXRyaWNzOyB9LFxuICAgICAgICAgICAgZnVuY3Rpb24oZCkgeyByZXR1cm4gZC5rZXk7IH0pO1xuXG4gICAgdmFyIGVudGVyTWV0cmljID0gbWV0cmljLmVudGVyKCkuYXBwZW5kKCd0cicpXG4gICAgICAuYXR0cignY2xhc3MnLCAnbWV0cmljJyk7XG5cbiAgICBlbnRlck1ldHJpYy5hcHBlbmQoJ3RkJylcbiAgICAgIC5hdHRyKCdjbGFzcycsICdzd2F0Y2gnKTtcblxuICAgIGVudGVyTWV0cmljLmFwcGVuZCgndGQnKVxuICAgICAgLmF0dHIoJ2NsYXNzJywgJ3RpdGxlJyk7XG5cbiAgICBlbnRlck1ldHJpYy5hcHBlbmQoJ3RkJylcbiAgICAgIC5hdHRyKCdjbGFzcycsICdwZXJjZW50Jyk7XG5cbiAgICBlbnRlck1ldHJpYy5hcHBlbmQoJ3RkJylcbiAgICAgIC5hdHRyKCdjbGFzcycsICd2YWx1ZScpO1xuXG4gICAgbWV0cmljLnNlbGVjdCgnLnN3YXRjaCcpXG4gICAgICAuc3R5bGUoJ2JhY2tncm91bmQnLCBmdW5jdGlvbihkKSB7IHJldHVybiBkLmNvbG9yOyB9KTtcblxuICAgIG1ldHJpYy5zZWxlY3QoJy50aXRsZScpXG4gICAgICAudGV4dChmdW5jdGlvbihkKSB7IHJldHVybiBkLnRpdGxlOyB9KTtcblxuICAgIG1ldHJpYy5zZWxlY3QoJy5wZXJjZW50JylcbiAgICAgIC50ZXh0KGZ1bmN0aW9uKGQpIHsgcmV0dXJuIHBlcmNlbnRGb3JtYXQoZC5wZXJjZW50KTsgfSk7XG5cbiAgICBtZXRyaWMuc2VsZWN0KCcudmFsdWUnKVxuICAgICAgLnRleHQoZnVuY3Rpb24oZCkgeyByZXR1cm4gdmFsdWVGb3JtYXQoZC52YWx1ZSk7IH0pO1xuXG4gICAgbWV0cmljLmV4aXQoKVxuICAgICAgLnJlbW92ZSgpO1xuICB9KTtcbiIsIm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSgnLi4vdmlldycpLmV4dGVuZCgpXG4gIC5wcm9wKCdjb2xzcGFuJylcbiAgLmRlZmF1bHQoMClcblxuICAucHJvcCgncm93c3BhbicpXG4gIC5kZWZhdWx0KDApXG5cbiAgLnByb3AoJ3dpZHRoJylcbiAgLnNldChkMy5mdW5jdG9yKVxuICAuZGVmYXVsdCgwKVxuXG4gIC5wcm9wKCdoZWlnaHQnKVxuICAuc2V0KGQzLmZ1bmN0b3IpXG4gIC5kZWZhdWx0KDApO1xuIl19
(3)
});
