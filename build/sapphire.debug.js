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

  .meth(function normalize(el) {
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

  .meth(function indexOffset(index) {
    return (index * this.scale()) + this.padding();
  })

  .meth(function spanLength(span) {
    return (span * this.scale()) - (this.padding() * 2);
  })

  .meth(function offsetIndex(offset) {
    return Math.ceil((offset - this.padding()) / this.scale());
  })

  .meth(function lengthSpan(len) {
    return Math.ceil((len + (this.padding() * 2)) / this.scale());
  })

  .static(function box(d) {
    return {
      x1: d.col,
      x2: d.col + d.colspan - 1,
      y1: d.row,
      y2: d.row + d.rowspan - 1
    };
  })

  .static(function uncollide(a) {
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

  .static(function intersection(a, b) {
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

  .meth(function calc() {
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

},{}],5:[function(_dereq_,module,exports){
module.exports = strain()
  .static(function draw(fn) {
    this.meth('_draw_', fn);
  })
  .draw(function() {})

  .static(function enter(fn) {
    this.meth('_enter_', fn);
  })
  .enter(function() {})

  .meth(function draw(el) {
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

  .meth(function enter(el) {
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
    left: 35,
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

  .prop('xFormat')
  .default(null)

  .prop('xTicks')
  .default(8)

  .prop('yFormat')
  .default(d3.format('.2s'))

  .prop('yTicks')
  .default(5)

  .prop('colors')

  .init(function() {
    this.colors(d3.scale.category10());
  })

  .meth(function normalize(el) {
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

    var fy = d3.scale.linear()
      .domain([0, d3.max(chart.datum(), function(d) { return d.y; })]);

    var dims = utils.box()
      .width(parseInt(chart.style('width')))
      .height(parseInt(chart.style('height')))
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
        .attr('transform', utils.translate(dims.margin.left, dims.margin.top));

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
      .tickFormat(this.xFormat());

    svg.select('.x.axis')
      .attr('transform', utils.translate(0, dims.innerHeight))
      .call(axis);

    axis = d3.svg.axis()
      .orient('left')
      .scale(fy)
      .tickPadding(8)
      .tickSize(-dims.innerWidth)
      .ticks(this.yTicks())
      .tickFormat(this.yFormat());
    
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
      .width(parseInt(el.style('width')))
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

  .prop('xFormat')
  .default(null)

  .prop('xTicks')
  .default(8)

  .prop('yFormat')
  .default(d3.format('.2s'))

  .prop('yTicks')
  .default(5)

  .prop('yFormat')
  .default(d3.format(',2s'))

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

  .meth(function normalize(el) {
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
    var dims = utils.box()
      .margin(this.margin())
      .width(parseInt(el.style('width')))
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

    var fy = d3.scale.linear()
      .domain(d3.extent(allValues, function(d) { return d.y; }))
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
      .ticks(this.widget().xTicks())
      .tickFormat(this.widget().xFormat())
      .tickSize(-dims.innerHeight);

    svg.select('.x.axis')
      .attr('transform', utils.translate(0, dims.innerHeight))
      .call(axis);

    axis = d3.svg.axis()
      .orient('left')
      .scale(fy)
      .tickPadding(8)
      .ticks(this.widget().yTicks())
      .tickFormat(this.widget().yFormat())
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
  .default(function(r) { return 0.35 * r; })

  .prop('valueFormat')
  .default(d3.format(',2s'))

  .prop('percentFormat')
  .default(d3.format('.0%'))

  .init(function() {
    this.colors(d3.scale.category10());
  })

  .meth(function normalize(el) {
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
    var width = parseInt(el.style('width'));

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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvaG9tZS9qdXN0aW4vcHJhZWtlbHQvc2FwcGhpcmUvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsIi9ob21lL2p1c3Rpbi9wcmFla2VsdC9zYXBwaGlyZS9zcmMvc2NyaXB0cy9kYXNoYm9hcmQuanMiLCIvaG9tZS9qdXN0aW4vcHJhZWtlbHQvc2FwcGhpcmUvc3JjL3NjcmlwdHMvZ3JpZC5qcyIsIi9ob21lL2p1c3Rpbi9wcmFla2VsdC9zYXBwaGlyZS9zcmMvc2NyaXB0cy9pbmRleC5qcyIsIi9ob21lL2p1c3Rpbi9wcmFla2VsdC9zYXBwaGlyZS9zcmMvc2NyaXB0cy91dGlscy5qcyIsIi9ob21lL2p1c3Rpbi9wcmFla2VsdC9zYXBwaGlyZS9zcmMvc2NyaXB0cy92aWV3LmpzIiwiL2hvbWUvanVzdGluL3ByYWVrZWx0L3NhcHBoaXJlL3NyYy9zY3JpcHRzL3dpZGdldHMvYmFycy5qcyIsIi9ob21lL2p1c3Rpbi9wcmFla2VsdC9zYXBwaGlyZS9zcmMvc2NyaXB0cy93aWRnZXRzL2luZGV4LmpzIiwiL2hvbWUvanVzdGluL3ByYWVrZWx0L3NhcHBoaXJlL3NyYy9zY3JpcHRzL3dpZGdldHMvbGFzdC5qcyIsIi9ob21lL2p1c3Rpbi9wcmFla2VsdC9zYXBwaGlyZS9zcmMvc2NyaXB0cy93aWRnZXRzL2xpbmVzLmpzIiwiL2hvbWUvanVzdGluL3ByYWVrZWx0L3NhcHBoaXJlL3NyYy9zY3JpcHRzL3dpZGdldHMvcGllLmpzIiwiL2hvbWUvanVzdGluL3ByYWVrZWx0L3NhcHBoaXJlL3NyYy9zY3JpcHRzL3dpZGdldHMvd2lkZ2V0LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6S0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2SkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9UQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN05BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKX12YXIgZj1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwoZi5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxmLGYuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwidmFyIHV0aWxzID0gcmVxdWlyZSgnLi91dGlscycpO1xudmFyIGxheW91dCA9IHJlcXVpcmUoJy4vZ3JpZCcpO1xudmFyIHdpZGdldHMgPSByZXF1aXJlKCcuL3dpZGdldHMnKTtcblxuXG5tb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoJy4vdmlldycpLmV4dGVuZCgpXG4gIC5wcm9wKCdzY2FsZScpXG4gIC5kZWZhdWx0KDEwMClcblxuICAucHJvcCgndHlwZXMnKVxuXG4gIC5wcm9wKCd0aXRsZScpXG4gIC5zZXQoZDMuZnVuY3RvcilcbiAgLmRlZmF1bHQoZnVuY3Rpb24oZCkgeyByZXR1cm4gZC50aXRsZTsgfSlcblxuICAucHJvcCgna2V5JylcbiAgLnNldChkMy5mdW5jdG9yKVxuICAuZGVmYXVsdChmdW5jdGlvbihkLCBpKSB7IHJldHVybiBpOyB9KVxuXG4gIC5wcm9wKCd0eXBlJylcbiAgLnNldChkMy5mdW5jdG9yKVxuICAuZGVmYXVsdChmdW5jdGlvbihkKSB7IHJldHVybiBkLnR5cGU7IH0pXG5cbiAgLnByb3AoJ3dpZGdldHMnKVxuICAuc2V0KGQzLmZ1bmN0b3IpXG4gIC5kZWZhdWx0KGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQud2lkZ2V0czsgfSlcblxuICAucHJvcCgnY29sJylcbiAgLnNldChkMy5mdW5jdG9yKVxuICAuZGVmYXVsdChmdW5jdGlvbihkKSB7XG4gICAgcmV0dXJuIHV0aWxzLmFjY2VzcyhkLCAnY29sJyk7XG4gIH0pXG5cbiAgLnByb3AoJ3JvdycpXG4gIC5zZXQoZDMuZnVuY3RvcilcbiAgLmRlZmF1bHQoZnVuY3Rpb24oZCkge1xuICAgIHJldHVybiB1dGlscy5hY2Nlc3MoZCwgJ3JvdycpO1xuICB9KVxuXG4gIC5wcm9wKCdjb2xzcGFuJylcbiAgLnNldChkMy5mdW5jdG9yKVxuICAuZGVmYXVsdChmdW5jdGlvbihkKSB7XG4gICAgcmV0dXJuIHV0aWxzLmFjY2VzcyhkLCAnY29sc3BhbicpO1xuICB9KVxuXG4gIC5wcm9wKCdyb3dzcGFuJylcbiAgLnNldChkMy5mdW5jdG9yKVxuICAuZGVmYXVsdChmdW5jdGlvbihkKSB7XG4gICAgcmV0dXJuIHV0aWxzLmFjY2VzcyhkLCAncm93c3BhbicpO1xuICB9KVxuXG4gIC5wcm9wKCdudW1jb2xzJylcbiAgLmRlZmF1bHQoOClcblxuICAucHJvcCgncGFkZGluZycpXG4gIC5kZWZhdWx0KDUpXG5cbiAgLmluaXQoZnVuY3Rpb24oKSB7XG4gICAgdmFyIHR5cGVzID0gZDMubWFwKCk7XG5cbiAgICBkMy5rZXlzKHdpZGdldHMpLmZvckVhY2goZnVuY3Rpb24oaykge1xuICAgICAgdHlwZXMuc2V0KGssIHdpZGdldHNba10ubmV3KCkpO1xuICAgIH0pO1xuXG4gICAgdGhpcy50eXBlcyh0eXBlcyk7XG4gIH0pXG5cbiAgLmVudGVyKGZ1bmN0aW9uKGVsKSB7XG4gICAgZWwuYXR0cignY2xhc3MnLCAnZGFzaGJvYXJkJylcbiAgICAgIC5hcHBlbmQoJ2RpdicpXG4gICAgICAgIC5hdHRyKCdjbGFzcycsICd3aWRnZXRzJyk7XG4gIH0pXG5cbiAgLm1ldGgoZnVuY3Rpb24gbm9ybWFsaXplKGVsKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIHZhciBub2RlID0gZWwubm9kZSgpO1xuXG4gICAgZWwuZGF0dW0oZnVuY3Rpb24oZCwgaSkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgdGl0bGU6IHNlbGYudGl0bGUoKVxuICAgICAgICAgIC5jYWxsKG5vZGUsIGQsIGkpLFxuICAgICAgICB3aWRnZXRzOiBzZWxmLndpZGdldHMoKVxuICAgICAgICAgIC5jYWxsKG5vZGUsIGQsIGkpXG4gICAgICAgICAgLm1hcCh3aWRnZXREYXR1bSlcbiAgICAgIH07XG4gICAgfSk7XG5cbiAgICBmdW5jdGlvbiB3aWRnZXREYXR1bShkLCBpKSB7XG4gICAgICB2YXIgdHlwZW5hbWUgPSBzZWxmLnR5cGUoKS5jYWxsKG5vZGUsIGQsIGkpO1xuICAgICAgdmFyIHR5cGUgPSBzZWxmLnR5cGVzKCkuZ2V0KHR5cGVuYW1lKTtcblxuICAgICAgaWYgKCF0eXBlKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIlVucmVjb2duaXNlZCBkYXNoYm9hcmQgd2lkZ2V0IHR5cGUgJ1wiICsgdHlwZW5hbWUgKyBcIidcIik7XG4gICAgICB9XG5cbiAgICAgIHZhciBjb2xzcGFuID0gc2VsZi5jb2xzcGFuKCkuY2FsbChub2RlLCBkLCBpKTtcbiAgICAgIGNvbHNwYW4gPSB1dGlscy5lbnN1cmUoY29sc3BhbiwgdHlwZS5jb2xzcGFuKCkpO1xuICAgICAgdmFyIHJvd3NwYW4gPSBzZWxmLnJvd3NwYW4oKS5jYWxsKG5vZGUsIGQsIGkpO1xuICAgICAgcm93c3BhbiA9IHV0aWxzLmVuc3VyZShyb3dzcGFuLCB0eXBlLnJvd3NwYW4oKSk7XG5cbiAgICAgIHJldHVybiB7XG4gICAgICAgIGRhdGE6IGQsXG4gICAgICAgIHR5cGU6IHR5cGUsXG4gICAgICAgIGNvbHNwYW46IGNvbHNwYW4sXG4gICAgICAgIHJvd3NwYW46IHJvd3NwYW4sXG4gICAgICAgIGtleTogc2VsZi5rZXkoKS5jYWxsKG5vZGUsIGQsIGkpLFxuICAgICAgICBjb2w6IHNlbGYuY29sKCkuY2FsbChub2RlLCBkLCBpKSxcbiAgICAgICAgcm93OiBzZWxmLnJvdygpLmNhbGwobm9kZSwgZCwgaSlcbiAgICAgIH07XG4gICAgfVxuICB9KVxuXG4gIC5kcmF3KGZ1bmN0aW9uKGVsKSB7XG4gICAgdGhpcy5ub3JtYWxpemUoZWwpO1xuICAgIHZhciB3aWRnZXREYXRhID0gZWwuZGF0dW0oKS53aWRnZXRzO1xuXG4gICAgdGhpcy50eXBlcygpXG4gICAgICAuZm9yRWFjaChmdW5jdGlvbihuYW1lLCB0eXBlKSB7XG4gICAgICAgIHR5cGUud2lkdGgod2lkZ2V0V2lkdGgpO1xuICAgICAgICB0eXBlLmhlaWdodCh3aWRnZXRIZWlnaHQpO1xuICAgICAgfSk7XG5cbiAgICB2YXIgZ3JpZCA9IGxheW91dCgpXG4gICAgICAuc2NhbGUodGhpcy5zY2FsZSgpKVxuICAgICAgLm51bWNvbHModGhpcy5udW1jb2xzKCkpXG4gICAgICAucGFkZGluZyh0aGlzLnBhZGRpbmcoKSlcbiAgICAgIC5jb2woZnVuY3Rpb24oZCkgeyByZXR1cm4gZC5jb2w7IH0pXG4gICAgICAucm93KGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQucm93OyB9KVxuICAgICAgLmNvbHNwYW4oZnVuY3Rpb24oZCkgeyByZXR1cm4gZC5jb2xzcGFuOyB9KVxuICAgICAgLnJvd3NwYW4oZnVuY3Rpb24oZCkgeyByZXR1cm4gZC5yb3dzcGFuOyB9KTtcbiAgICBcbiAgICBlbC5zdHlsZSgnd2lkdGgnLCB1dGlscy5weChncmlkLnNjYWxlKCkgKiBncmlkLm51bWNvbHMoKSkpO1xuXG4gICAgdmFyIHdpZGdldCA9IGVsLnNlbGVjdCgnLndpZGdldHMnKS5zZWxlY3RBbGwoJy53aWRnZXQnKVxuICAgICAgLmRhdGEod2lkZ2V0RGF0YSwgZnVuY3Rpb24oZCkgeyByZXR1cm4gZC5rZXk7IH0pO1xuXG4gICAgd2lkZ2V0LmVudGVyKCkuYXBwZW5kKCdkaXYnKTtcbiAgICB1dGlscy5tZXRhKHdpZGdldCwgZnVuY3Rpb24oZCkgeyByZXR1cm4gZDsgfSk7XG5cbiAgICB3aWRnZXRcbiAgICAgIC5jbGFzc2VkKCd3aWRnZXQnLCB0cnVlKVxuICAgICAgLmVhY2goZnVuY3Rpb24oZCkge1xuICAgICAgICB2YXIgd2lkZ2V0RWwgPSBkMy5zZWxlY3QodGhpcylcbiAgICAgICAgICAuZGF0dW0oZC5kYXRhKVxuICAgICAgICAgIC5jYWxsKGQudHlwZSk7XG5cbiAgICAgICAgdmFyIHdpZHRoID0gcGFyc2VJbnQod2lkZ2V0RWwuc3R5bGUoJ3dpZHRoJykpO1xuICAgICAgICBkLmNvbHNwYW4gPSBNYXRoLm1heChkLmNvbHNwYW4sIGdyaWQubGVuZ3RoU3Bhbih3aWR0aCkpO1xuXG4gICAgICAgIHZhciBoZWlnaHQgPSBwYXJzZUludCh3aWRnZXRFbC5zdHlsZSgnaGVpZ2h0JykpO1xuICAgICAgICBkLnJvd3NwYW4gPSBNYXRoLm1heChkLnJvd3NwYW4sIGdyaWQubGVuZ3RoU3BhbihoZWlnaHQpKTtcbiAgICAgIH0pO1xuXG4gICAgdmFyIGdyaWRFbHMgPSBncmlkKHdpZGdldERhdGEpO1xuXG4gICAgd2lkZ2V0XG4gICAgICAuc3R5bGUoJ2xlZnQnLCB1dGlscy5weChmdW5jdGlvbihkLCBpKSB7IHJldHVybiBncmlkRWxzW2ldLng7IH0pKVxuICAgICAgLnN0eWxlKCd0b3AnLCB1dGlscy5weChmdW5jdGlvbihkLCBpKSB7IHJldHVybiBncmlkRWxzW2ldLnk7IH0pKTtcblxuICAgIHdpZGdldC5leGl0KCkucmVtb3ZlKCk7XG5cbiAgICBmdW5jdGlvbiB3aWRnZXRXaWR0aCgpIHtcbiAgICAgIHJldHVybiBncmlkLnNwYW5MZW5ndGgodXRpbHMubWV0YSh0aGlzKS5jb2xzcGFuKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiB3aWRnZXRIZWlnaHQoKSB7XG4gICAgICByZXR1cm4gZ3JpZC5zcGFuTGVuZ3RoKHV0aWxzLm1ldGEodGhpcykucm93c3Bhbik7XG4gICAgfVxuICB9KTtcbiIsInZhciB1dGlscyA9IHJlcXVpcmUoJy4vdXRpbHMnKTtcblxuXG52YXIgZ3JpZCA9IG1vZHVsZS5leHBvcnRzID0gc3RyYWluKClcbiAgLnByb3AoJ2NvbCcpXG4gIC5zZXQoZDMuZnVuY3RvcilcbiAgLmRlZmF1bHQoZnVuY3Rpb24oZCkge1xuICAgIHJldHVybiB1dGlscy5hY2Nlc3MoZCwgJ2NvbCcpO1xuICB9KVxuXG4gIC5wcm9wKCdyb3cnKVxuICAuc2V0KGQzLmZ1bmN0b3IpXG4gIC5kZWZhdWx0KGZ1bmN0aW9uKGQpIHtcbiAgICByZXR1cm4gdXRpbHMuYWNjZXNzKGQsICdyb3cnKTtcbiAgfSlcblxuICAucHJvcCgnbnVtY29scycpXG4gIC5kZWZhdWx0KDgpXG5cbiAgLnByb3AoJ3NjYWxlJylcbiAgLmRlZmF1bHQoMTApXG5cbiAgLnByb3AoJ3BhZGRpbmcnKVxuICAuZGVmYXVsdCg1KVxuXG4gIC5wcm9wKCdjb2xzcGFuJylcbiAgLnNldChkMy5mdW5jdG9yKVxuICAuZGVmYXVsdChmdW5jdGlvbihkKSB7XG4gICAgcmV0dXJuIHV0aWxzLmFjY2VzcyhkLCAnY29sc3BhbicsIDEpO1xuICB9KVxuXG4gIC5wcm9wKCdyb3dzcGFuJylcbiAgLnNldChkMy5mdW5jdG9yKVxuICAuZGVmYXVsdChmdW5jdGlvbihkKSB7XG4gICAgcmV0dXJuIHV0aWxzLmFjY2VzcyhkLCAncm93c3BhbicsIDEpO1xuICB9KVxuXG4gIC5pbnZva2UoZnVuY3Rpb24oZGF0YSkge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICB2YXIgYmVzdCA9IGNvdW50ZXIoKS5udW1jb2xzKHRoaXMubnVtY29scygpKTtcblxuICAgIGRhdGEgPSAoZGF0YSB8fCBbXSlcbiAgICAgIC5tYXAoZnVuY3Rpb24oZCwgaSkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIGRhdGE6IGQsXG4gICAgICAgICAgY29sOiBzZWxmLmNvbCgpLmNhbGwoc2VsZiwgZCwgaSksIFxuICAgICAgICAgIHJvdzogc2VsZi5yb3coKS5jYWxsKHNlbGYsIGQsIGkpLFxuICAgICAgICAgIHJvd3NwYW46IHNlbGYucm93c3BhbigpLmNhbGwoc2VsZiwgZCwgaSksXG4gICAgICAgICAgY29sc3Bhbjogc2VsZi5jb2xzcGFuKCkuY2FsbChzZWxmLCBkLCBpKVxuICAgICAgICB9O1xuICAgICAgfSlcbiAgICAgIC5tYXAoYmVzdCk7XG5cbiAgICB2YXIgcXVhZHRyZWUgPSBkMy5nZW9tLnF1YWR0cmVlKClcbiAgICAgIC54KGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQuY29sOyB9KVxuICAgICAgLnkoZnVuY3Rpb24oZCkgeyByZXR1cm4gZC5yb3c7IH0pO1xuXG4gICAgdmFyIHJvb3QgPSBxdWFkdHJlZShkYXRhKTtcblxuICAgIGRhdGEuZm9yRWFjaChmdW5jdGlvbihkKSB7XG4gICAgICByb290LnZpc2l0KGdyaWQudW5jb2xsaWRlKGQpKTtcbiAgICAgIGQueCA9IHNlbGYuaW5kZXhPZmZzZXQoZC5jb2wpO1xuICAgICAgZC55ID0gc2VsZi5pbmRleE9mZnNldChkLnJvdyk7XG4gICAgICBkLndpZHRoID0gc2VsZi5zcGFuTGVuZ3RoKGQuY29sc3Bhbik7XG4gICAgICBkLmhlaWdodCA9IHNlbGYuc3Bhbkxlbmd0aChkLnJvd3NwYW4pO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIGRhdGE7XG4gIH0pXG5cbiAgLm1ldGgoZnVuY3Rpb24gaW5kZXhPZmZzZXQoaW5kZXgpIHtcbiAgICByZXR1cm4gKGluZGV4ICogdGhpcy5zY2FsZSgpKSArIHRoaXMucGFkZGluZygpO1xuICB9KVxuXG4gIC5tZXRoKGZ1bmN0aW9uIHNwYW5MZW5ndGgoc3Bhbikge1xuICAgIHJldHVybiAoc3BhbiAqIHRoaXMuc2NhbGUoKSkgLSAodGhpcy5wYWRkaW5nKCkgKiAyKTtcbiAgfSlcblxuICAubWV0aChmdW5jdGlvbiBvZmZzZXRJbmRleChvZmZzZXQpIHtcbiAgICByZXR1cm4gTWF0aC5jZWlsKChvZmZzZXQgLSB0aGlzLnBhZGRpbmcoKSkgLyB0aGlzLnNjYWxlKCkpO1xuICB9KVxuXG4gIC5tZXRoKGZ1bmN0aW9uIGxlbmd0aFNwYW4obGVuKSB7XG4gICAgcmV0dXJuIE1hdGguY2VpbCgobGVuICsgKHRoaXMucGFkZGluZygpICogMikpIC8gdGhpcy5zY2FsZSgpKTtcbiAgfSlcblxuICAuc3RhdGljKGZ1bmN0aW9uIGJveChkKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHgxOiBkLmNvbCxcbiAgICAgIHgyOiBkLmNvbCArIGQuY29sc3BhbiAtIDEsXG4gICAgICB5MTogZC5yb3csXG4gICAgICB5MjogZC5yb3cgKyBkLnJvd3NwYW4gLSAxXG4gICAgfTtcbiAgfSlcblxuICAuc3RhdGljKGZ1bmN0aW9uIHVuY29sbGlkZShhKSB7XG4gICAgdmFyIGJveEEgPSBncmlkLmJveChhKTtcbiAgICBcbiAgICByZXR1cm4gZnVuY3Rpb24obm9kZSwgeDEsIHkxLCB4MiwgeTIpIHtcbiAgICAgIHZhciBiID0gbm9kZS5wb2ludDtcblxuICAgICAgaWYgKGIgJiYgYSAhPT0gYiAmJiBncmlkLmludGVyc2VjdGlvbihib3hBLCBncmlkLmJveChiKSkpIHtcbiAgICAgICAgYi5yb3cgPSBib3hBLnkyICsgMTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuICFncmlkLmludGVyc2VjdGlvbihib3hBLCB7XG4gICAgICAgIHgxOiB4MSwgXG4gICAgICAgIHkxOiB5MSwgXG4gICAgICAgIHgyOiB4MixcbiAgICAgICAgeTI6IHkyXG4gICAgICB9KTtcbiAgICB9O1xuICB9KVxuXG4gIC5zdGF0aWMoZnVuY3Rpb24gaW50ZXJzZWN0aW9uKGEsIGIpIHtcbiAgICByZXR1cm4gKChhLngxIDw9IGIueDEgJiYgYi54MSA8PSBhLngyKSAmJiAoYS55MSA8PSBiLnkxICYmIGIueTEgPD0gYS55MikpXG4gICAgICAgIHx8ICgoYi54MSA8PSBhLngxICYmIGEueDEgPD0gYi54MikgJiYgKGIueTEgPD0gYS55MSAmJiBhLnkxIDw9IGIueTIpKVxuICAgICAgICB8fCAoKGEueDEgPD0gYi54MiAmJiBiLngyIDw9IGEueDIpICYmIChhLnkxIDw9IGIueTEgJiYgYi55MSA8PSBhLnkyKSlcbiAgICAgICAgfHwgKChiLngxIDw9IGEueDIgJiYgYS54MiA8PSBiLngyKSAmJiAoYi55MSA8PSBhLnkxICYmIGEueTEgPD0gYi55MikpO1xuICB9KTtcblxuXG52YXIgY291bnRlciA9IHN0cmFpbigpXG4gIC5wcm9wKCdudW1jb2xzJylcblxuICAucHJvcCgncm93c3BhbicpXG4gIC5kZWZhdWx0KDApXG5cbiAgLnByb3AoJ2NvbCcpXG4gIC5kZWZhdWx0KDApXG5cbiAgLnByb3AoJ3JvdycpXG4gIC5kZWZhdWx0KDApXG5cbiAgLmludm9rZShmdW5jdGlvbihkKSB7XG4gICAgZC5jb2wgPSB1dGlscy5lbnN1cmUoZC5jb2wsIHRoaXMuY29sKCkpO1xuICAgIGQucm93ID0gdXRpbHMuZW5zdXJlKGQucm93LCB0aGlzLnJvdygpKTtcblxuICAgIGlmIChkLmNvbCArIGQuY29sc3BhbiA+IHRoaXMubnVtY29scygpKSB7XG4gICAgICBkLmNvbCA9IDA7XG4gICAgICBkLnJvdyArPSB0aGlzLnJvd3NwYW4oKTtcbiAgICAgIHRoaXMucm93c3BhbigwKTtcbiAgICB9XG5cbiAgICB0aGlzXG4gICAgICAuY29sKGQuY29sICsgZC5jb2xzcGFuKVxuICAgICAgLnJvdyhkLnJvdylcbiAgICAgIC5yb3dzcGFuKE1hdGgubWF4KHRoaXMucm93c3BhbigpLCBkLnJvd3NwYW4pKTtcblxuICAgIHJldHVybiBkO1xuICB9KTtcbiIsImV4cG9ydHMudXRpbHMgPSByZXF1aXJlKCcuL3V0aWxzJyk7XG5leHBvcnRzLnZpZXcgPSByZXF1aXJlKCcuL3ZpZXcnKTtcbmV4cG9ydHMuZ3JpZCA9IHJlcXVpcmUoJy4vZ3JpZCcpO1xuZXhwb3J0cy53aWRnZXRzID0gcmVxdWlyZSgnLi93aWRnZXRzJyk7XG5leHBvcnRzLmRhc2hib2FyZCA9IHJlcXVpcmUoJy4vZGFzaGJvYXJkJyk7XG4iLCJ2YXIgdXRpbHMgPSBleHBvcnRzO1xuXG5cbnV0aWxzLmFjY2VzcyA9IGZ1bmN0aW9uKGQsIG5hbWUsIGRlZmF1bHR2YWwpIHtcbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPCAzKSB7XG4gICAgZGVmYXVsdHZhbCA9IG51bGw7XG4gIH1cblxuICBpZiAodHlwZW9mIGQgIT0gJ29iamVjdCcpIHtcbiAgICByZXR1cm4gZGVmYXVsdHZhbDtcbiAgfVxuXG4gIHZhciB2YWwgPSBkW25hbWVdO1xuICByZXR1cm4gdHlwZW9mIHZhbCA9PSAndW5kZWZpbmVkJ1xuICAgID8gZGVmYXVsdHZhbFxuICAgIDogdmFsO1xufTtcblxuXG51dGlscy5lbnN1cmUgPSBmdW5jdGlvbih2LCBkZWZhdWx0dmFsKSB7XG4gIHJldHVybiB2ID09PSBudWxsIHx8IHR5cGVvZiB2ID09ICd1bmRlZmluZWQnXG4gICAgPyBkZWZhdWx0dmFsXG4gICAgOiB2O1xufTtcblxuXG51dGlscy50cmFuc2xhdGUgPSBmdW5jdGlvbih4LCB5KSB7XG4gIHJldHVybiAndHJhbnNsYXRlKCcgKyB4ICsgJywgJyArIHkgKyAnKSc7XG59O1xuXG5cbnV0aWxzLmVuc3VyZUVsID0gZnVuY3Rpb24oZWwpIHtcbiAgcmV0dXJuICEoZWwgaW5zdGFuY2VvZiBkMy5zZWxlY3Rpb24pXG4gICAgPyBkMy5zZWxlY3QoZWwpXG4gICAgOiBlbDtcbn07XG5cblxudXRpbHMuZGF0ZSA9IGZ1bmN0aW9uKHQpIHtcbiAgcmV0dXJuIG5ldyBEYXRlKHQpO1xufTtcblxuXG51dGlscy5weCA9IGZ1bmN0aW9uKGZuKSB7XG4gIGZuID0gZDMuZnVuY3Rvcihmbik7XG5cbiAgcmV0dXJuIGZ1bmN0aW9uKGQsIGkpIHtcbiAgICByZXR1cm4gZm4uY2FsbCh0aGlzLCBkLCBpKSArICdweCc7XG4gIH07XG59O1xuXG5cbnV0aWxzLm1ldGEgPSBmdW5jdGlvbihlbCwgZm4pIHtcbiAgZWwgPSB1dGlscy5lbnN1cmVFbChlbCk7XG5cbiAgcmV0dXJuIGFyZ3VtZW50cy5sZW5ndGggPiAxXG4gICAgPyBlbC5wcm9wZXJ0eSgnX19zYXBwaGlyZV9tZXRhX18nLCBmbilcbiAgICA6IGVsLnByb3BlcnR5KCdfX3NhcHBoaXJlX21ldGFfXycpO1xufTtcblxuXG51dGlscy5ib3ggPSBzdHJhaW4oKVxuICAucHJvcCgnd2lkdGgnKVxuICAuZGVmYXVsdCgwKVxuXG4gIC5wcm9wKCdoZWlnaHQnKVxuICAuZGVmYXVsdCgwKVxuXG4gIC5wcm9wKCdtYXJnaW4nKVxuICAuZGVmYXVsdCh7XG4gICAgdG9wOiAwLFxuICAgIGxlZnQ6IDAsXG4gICAgcmlnaHQ6IDAsXG4gICAgYm90dG9tOiAwXG4gIH0pXG5cbiAgLm1ldGgoZnVuY3Rpb24gY2FsYygpIHtcbiAgICB2YXIgZCA9IHt9O1xuICAgIGQubWFyZ2luID0gdGhpcy5tYXJnaW4oKTtcbiAgICBkLndpZHRoID0gdGhpcy53aWR0aCgpO1xuICAgIGQuaGVpZ2h0ID0gdGhpcy5oZWlnaHQoKTtcbiAgICBkLmlubmVyV2lkdGggPSBkLndpZHRoIC0gZC5tYXJnaW4ubGVmdCAtIGQubWFyZ2luLnJpZ2h0O1xuICAgIGQuaW5uZXJIZWlnaHQgPSBkLmhlaWdodCAtIGQubWFyZ2luLnRvcCAtIGQubWFyZ2luLmJvdHRvbTtcbiAgICByZXR1cm4gZDtcbiAgfSlcblxuICAuaW52b2tlKGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLmNhbGMoKTtcbiAgfSk7XG4iLCJtb2R1bGUuZXhwb3J0cyA9IHN0cmFpbigpXG4gIC5zdGF0aWMoZnVuY3Rpb24gZHJhdyhmbikge1xuICAgIHRoaXMubWV0aCgnX2RyYXdfJywgZm4pO1xuICB9KVxuICAuZHJhdyhmdW5jdGlvbigpIHt9KVxuXG4gIC5zdGF0aWMoZnVuY3Rpb24gZW50ZXIoZm4pIHtcbiAgICB0aGlzLm1ldGgoJ19lbnRlcl8nLCBmbik7XG4gIH0pXG4gIC5lbnRlcihmdW5jdGlvbigpIHt9KVxuXG4gIC5tZXRoKGZ1bmN0aW9uIGRyYXcoZWwpIHtcbiAgICB2YXIgZGF0dW07XG4gICAgZWwgPSBzYXBwaGlyZS51dGlscy5lbnN1cmVFbChlbCk7XG5cbiAgICBpZiAoZWwubm9kZSgpKSB7XG4gICAgICBkYXR1bSA9IGVsLmRhdHVtKCk7XG4gICAgfVxuXG4gICAgaWYgKGVsLm5vZGUoKSAmJiAhZWwubm9kZSgpLmhhc0NoaWxkTm9kZXMoKSkge1xuICAgICAgdGhpcy5lbnRlci5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIH1cblxuICAgIHZhciBwYXJlbnQgPSB0aGlzLl90eXBlXy5fc3VwZXJfLnByb3RvdHlwZTtcbiAgICBpZiAoJ19kcmF3XycgaW4gcGFyZW50KSB7XG4gICAgICBwYXJlbnQuX2RyYXdfLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfVxuXG4gICAgdGhpcy5fZHJhd18uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcblxuICAgIGlmICh0eXBlb2YgZGF0dW0gIT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIGVsLmRhdHVtKGRhdHVtKTtcbiAgICB9XG4gIH0pXG5cbiAgLm1ldGgoZnVuY3Rpb24gZW50ZXIoZWwpIHtcbiAgICBlbCA9IHNhcHBoaXJlLnV0aWxzLmVuc3VyZUVsKGVsKTtcblxuICAgIHZhciBwYXJlbnQgPSB0aGlzLl90eXBlXy5fc3VwZXJfLnByb3RvdHlwZTtcbiAgICBpZiAoJ19lbnRlcl8nIGluIHBhcmVudCkge1xuICAgICAgcGFyZW50Ll9lbnRlcl8uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9XG5cbiAgICB0aGlzLl9lbnRlcl8uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgfSlcblxuICAuaW52b2tlKGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLmRyYXcuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgfSk7XG4iLCJ2YXIgdXRpbHMgPSByZXF1aXJlKCcuLi91dGlscycpO1xuXG5cbm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSgnLi93aWRnZXQnKS5leHRlbmQoKVxuICAucHJvcCgnd2lkdGgnKVxuICAuZGVmYXVsdCg0MDApXG5cbiAgLnByb3AoJ2NvbHNwYW4nKVxuICAuZGVmYXVsdCg0KVxuXG4gIC5wcm9wKCdyb3dzcGFuJylcbiAgLmRlZmF1bHQoMilcblxuICAucHJvcCgnaGVpZ2h0JylcbiAgLmRlZmF1bHQoMjAwKVxuXG4gIC5wcm9wKCdiYXJQYWRkaW5nJylcbiAgLmRlZmF1bHQoMi41KVxuXG4gIC5wcm9wKCdtYXJnaW4nKVxuICAuZGVmYXVsdCh7XG4gICAgdG9wOiAxMCxcbiAgICBsZWZ0OiAzNSxcbiAgICByaWdodDogMTUsXG4gICAgYm90dG9tOiA0NVxuICB9KVxuXG4gIC5wcm9wKCd0aXRsZScpXG4gIC5zZXQoZDMuZnVuY3RvcilcbiAgLmRlZmF1bHQoZnVuY3Rpb24oZCkgeyByZXR1cm4gZC50aXRsZTsgfSlcblxuICAucHJvcCgndmFsdWVzJylcbiAgLnNldChkMy5mdW5jdG9yKVxuICAuZGVmYXVsdChmdW5jdGlvbihkKSB7IHJldHVybiBkLnZhbHVlczsgfSlcblxuICAucHJvcCgneCcpXG4gIC5zZXQoZDMuZnVuY3RvcilcbiAgLmRlZmF1bHQoZnVuY3Rpb24oZCkgeyByZXR1cm4gZC54OyB9KVxuXG4gIC5wcm9wKCd5JylcbiAgLnNldChkMy5mdW5jdG9yKVxuICAuZGVmYXVsdChmdW5jdGlvbihkKSB7IHJldHVybiBkLnk7IH0pXG5cbiAgLnByb3AoJ2R4JylcbiAgLnNldChkMy5mdW5jdG9yKVxuICAuZGVmYXVsdChudWxsKVxuXG4gIC5wcm9wKCd4Rm9ybWF0JylcbiAgLmRlZmF1bHQobnVsbClcblxuICAucHJvcCgneFRpY2tzJylcbiAgLmRlZmF1bHQoOClcblxuICAucHJvcCgneUZvcm1hdCcpXG4gIC5kZWZhdWx0KGQzLmZvcm1hdCgnLjJzJykpXG5cbiAgLnByb3AoJ3lUaWNrcycpXG4gIC5kZWZhdWx0KDUpXG5cbiAgLnByb3AoJ2NvbG9ycycpXG5cbiAgLmluaXQoZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5jb2xvcnMoZDMuc2NhbGUuY2F0ZWdvcnkxMCgpKTtcbiAgfSlcblxuICAubWV0aChmdW5jdGlvbiBub3JtYWxpemUoZWwpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgdmFyIG5vZGUgPSBlbC5ub2RlKCk7XG5cbiAgICBlbC5kYXR1bShmdW5jdGlvbihkLCBpKSB7XG4gICAgICB2YXIgdmFsdWVzID0gc2VsZi52YWx1ZXMoKVxuICAgICAgICAuY2FsbChub2RlLCBkLCBpKVxuICAgICAgICAubWFwKHZhbHVlKTtcblxuICAgICAgdmFyIGxlbiA9IHZhbHVlcy5sZW5ndGg7XG4gICAgICB2YXIgZHhBdmcgPSB2YWx1ZXMubGVuZ3RoXG4gICAgICAgID8gKHZhbHVlc1tsZW4gLSAxXS54IC0gdmFsdWVzWzBdLngpIC8gbGVuXG4gICAgICAgIDogMDtcblxuICAgICAgdmFsdWVzLmZvckVhY2goZnVuY3Rpb24oZCkge1xuICAgICAgICBkLmR4ID0gdXRpbHMuZW5zdXJlKGQuZHgsIGR4QXZnKTtcbiAgICAgIH0pO1xuXG4gICAgICByZXR1cm4ge1xuICAgICAgICB2YWx1ZXM6IHZhbHVlcyxcbiAgICAgICAgdGl0bGU6IHNlbGYudGl0bGUoKS5jYWxsKG5vZGUsIGQsIGkpXG4gICAgICB9O1xuICAgIH0pO1xuXG4gICAgZnVuY3Rpb24gdmFsdWUoZCwgaSkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgeDogc2VsZi54KCkuY2FsbChub2RlLCBkLCBpKSxcbiAgICAgICAgeTogc2VsZi55KCkuY2FsbChub2RlLCBkLCBpKSxcbiAgICAgICAgZHg6IHNlbGYuZHgoKS5jYWxsKG5vZGUsIGQsIGkpLFxuICAgICAgICB3aWR0aDogc2VsZi53aWR0aCgpLmNhbGwobm9kZSwgZCwgaSksXG4gICAgICAgIGhlaWdodDogc2VsZi5oZWlnaHQoKS5jYWxsKG5vZGUsIGQsIGkpXG4gICAgICB9O1xuICAgIH1cbiAgfSlcblxuICAuZW50ZXIoZnVuY3Rpb24oZWwpIHtcbiAgICBlbC5hdHRyKCdjbGFzcycsICdiYXJzIHdpZGdldCcpO1xuXG4gICAgZWwuYXBwZW5kKCdkaXYnKVxuICAgICAgLmF0dHIoJ2NsYXNzJywgJ3RpdGxlJyk7XG5cbiAgICB2YXIgc3ZnID0gZWwuYXBwZW5kKCdkaXYnKVxuICAgICAgLmF0dHIoJ2NsYXNzJywgJ2NoYXJ0JylcbiAgICAgIC5hcHBlbmQoJ3N2ZycpXG4gICAgICAuYXBwZW5kKCdnJyk7XG5cbiAgICBzdmcuYXBwZW5kKCdnJylcbiAgICAgIC5hdHRyKCdjbGFzcycsICdiYXJzJyk7XG5cbiAgICBzdmcuYXBwZW5kKCdnJylcbiAgICAgIC5hdHRyKCdjbGFzcycsICd5IGF4aXMnKTtcblxuICAgIHN2Zy5hcHBlbmQoJ2cnKVxuICAgICAgLmF0dHIoJ2NsYXNzJywgJ3ggYXhpcycpO1xuICB9KVxuXG4gIC5kcmF3KGZ1bmN0aW9uKGVsKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIHRoaXMubm9ybWFsaXplKGVsKTtcblxuICAgIGVsLnN0eWxlKCd3aWR0aCcsIHV0aWxzLnB4KHRoaXMud2lkdGgoKSkpXG4gICAgICAuc3R5bGUoJ2hlaWdodCcsIHV0aWxzLnB4KHRoaXMuaGVpZ2h0KCkpKTtcblxuICAgIGVsLnNlbGVjdCgnLndpZGdldCAudGl0bGUnKVxuICAgICAgLnRleHQoZnVuY3Rpb24oZCkgeyByZXR1cm4gZC50aXRsZTsgfSk7XG5cbiAgICB2YXIgY2hhcnQgPSBlbC5zZWxlY3QoJy5jaGFydCcpXG4gICAgICAuZGF0dW0oZnVuY3Rpb24oZCkgeyByZXR1cm4gZC52YWx1ZXM7IH0pO1xuXG4gICAgdmFyIGZ4ID0gZDMudGltZS5zY2FsZSgpXG4gICAgICAuZG9tYWluKFtcbiAgICAgICAgZDMubWluKGNoYXJ0LmRhdHVtKCksIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQueDsgfSksXG4gICAgICAgIGQzLm1heChjaGFydC5kYXR1bSgpLCBmdW5jdGlvbihkKSB7IHJldHVybiBkLnggKyBkLmR4OyB9KV0pO1xuXG4gICAgdmFyIGZ5ID0gZDMuc2NhbGUubGluZWFyKClcbiAgICAgIC5kb21haW4oWzAsIGQzLm1heChjaGFydC5kYXR1bSgpLCBmdW5jdGlvbihkKSB7IHJldHVybiBkLnk7IH0pXSk7XG5cbiAgICB2YXIgZGltcyA9IHV0aWxzLmJveCgpXG4gICAgICAud2lkdGgocGFyc2VJbnQoY2hhcnQuc3R5bGUoJ3dpZHRoJykpKVxuICAgICAgLmhlaWdodChwYXJzZUludChjaGFydC5zdHlsZSgnaGVpZ2h0JykpKVxuICAgICAgLm1hcmdpbih0aGlzLm1hcmdpbigpKVxuICAgICAgLmNhbGMoKTtcblxuICAgIGNoYXJ0XG4gICAgICAuc3R5bGUoJ3dpZHRoJywgdXRpbHMucHgoZGltcy53aWR0aCkpXG4gICAgICAuc3R5bGUoJ2hlaWdodCcsIHV0aWxzLnB4KGRpbXMuaGVpZ2h0KSk7XG5cbiAgICBmeC5yYW5nZShbMCwgZGltcy5pbm5lcldpZHRoXSk7XG4gICAgZnkucmFuZ2UoW2RpbXMuaW5uZXJIZWlnaHQsIDBdKTtcblxuICAgIHZhciBzdmcgPSBjaGFydC5zZWxlY3QoJ3N2ZycpXG4gICAgICAuYXR0cignd2lkdGgnLCBkaW1zLndpZHRoKVxuICAgICAgLmF0dHIoJ2hlaWdodCcsIGRpbXMuaGVpZ2h0KVxuICAgICAgLnNlbGVjdCgnZycpXG4gICAgICAgIC5hdHRyKCd0cmFuc2Zvcm0nLCB1dGlscy50cmFuc2xhdGUoZGltcy5tYXJnaW4ubGVmdCwgZGltcy5tYXJnaW4udG9wKSk7XG5cbiAgICB2YXIgYmFyID0gc3ZnLnNlbGVjdCgnLmJhcnMnKVxuICAgICAgLnNlbGVjdEFsbCgnLmJhcicpXG4gICAgICAuZGF0YShmdW5jdGlvbihkKSB7IHJldHVybiBkOyB9LFxuICAgICAgICAgICAgZnVuY3Rpb24oZCkgeyByZXR1cm4gZC54OyB9KTtcblxuICAgIGJhci5lbnRlcigpLmFwcGVuZCgnZycpXG4gICAgICAuYXR0cignY2xhc3MnLCAnYmFyJylcbiAgICAgIC5hcHBlbmQoJ3JlY3QnKTtcblxuICAgIGJhclxuICAgICAgLmF0dHIoJ3RyYW5zZm9ybScsIGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgcmV0dXJuIHV0aWxzLnRyYW5zbGF0ZShmeChkLngpLCBmeShkLnkpKTtcbiAgICAgIH0pO1xuXG4gICAgYmFyLnNlbGVjdCgncmVjdCcpXG4gICAgICAuc3R5bGUoJ2ZpbGwnLCB0aGlzLmNvbG9ycygpKGVsLmRhdHVtKCkudGl0bGUpKVxuICAgICAgLmF0dHIoJ3dpZHRoJywgZnVuY3Rpb24oZCkge1xuICAgICAgICB2YXIgd2lkdGggPSBmeChkLnggKyBkLmR4KSAtIGZ4KGQueCk7XG4gICAgICAgIHdpZHRoIC09IHNlbGYuYmFyUGFkZGluZygpO1xuICAgICAgICByZXR1cm4gTWF0aC5tYXgod2lkdGgsIDEpO1xuICAgICAgfSlcbiAgICAgIC5hdHRyKCdoZWlnaHQnLCBmdW5jdGlvbihkKSB7XG4gICAgICAgIHJldHVybiBkaW1zLmlubmVySGVpZ2h0IC0gZnkoZC55KTsgXG4gICAgICB9KTtcblxuICAgIGJhci5leGl0KClcbiAgICAgIC5yZW1vdmUoKTtcblxuICAgIHZhciBheGlzID0gZDMuc3ZnLmF4aXMoKVxuICAgICAgLnNjYWxlKGZ4KVxuICAgICAgLnRpY2tzKHRoaXMueFRpY2tzKCkpXG4gICAgICAudGlja0Zvcm1hdCh0aGlzLnhGb3JtYXQoKSk7XG5cbiAgICBzdmcuc2VsZWN0KCcueC5heGlzJylcbiAgICAgIC5hdHRyKCd0cmFuc2Zvcm0nLCB1dGlscy50cmFuc2xhdGUoMCwgZGltcy5pbm5lckhlaWdodCkpXG4gICAgICAuY2FsbChheGlzKTtcblxuICAgIGF4aXMgPSBkMy5zdmcuYXhpcygpXG4gICAgICAub3JpZW50KCdsZWZ0JylcbiAgICAgIC5zY2FsZShmeSlcbiAgICAgIC50aWNrUGFkZGluZyg4KVxuICAgICAgLnRpY2tTaXplKC1kaW1zLmlubmVyV2lkdGgpXG4gICAgICAudGlja3ModGhpcy55VGlja3MoKSlcbiAgICAgIC50aWNrRm9ybWF0KHRoaXMueUZvcm1hdCgpKTtcbiAgICBcbiAgICBzdmcuc2VsZWN0KCcueS5heGlzJylcbiAgICAgIC5jYWxsKGF4aXMpO1xuICB9KTtcbiIsImV4cG9ydHMucGllID0gcmVxdWlyZSgnLi9waWUnKTtcbmV4cG9ydHMuYmFycyA9IHJlcXVpcmUoJy4vYmFycycpO1xuZXhwb3J0cy5sYXN0ID0gcmVxdWlyZSgnLi9sYXN0Jyk7XG5leHBvcnRzLmxpbmVzID0gcmVxdWlyZSgnLi9saW5lcycpO1xuZXhwb3J0cy53aWRnZXQgPSByZXF1aXJlKCcuL3dpZGdldCcpO1xuIiwidmFyIHV0aWxzID0gcmVxdWlyZSgnLi4vdXRpbHMnKTtcblxuXG5tb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoJy4vd2lkZ2V0JykuZXh0ZW5kKClcbiAgLnByb3AoJ3dpZHRoJylcbiAgLmRlZmF1bHQoNDAwKVxuXG4gIC5wcm9wKCdjb2xzcGFuJylcbiAgLmRlZmF1bHQoNClcblxuICAucHJvcCgndGl0bGUnKVxuICAuc2V0KGQzLmZ1bmN0b3IpXG4gIC5kZWZhdWx0KGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQudGl0bGU7IH0pXG5cbiAgLnByb3AoJ3ZhbHVlcycpXG4gIC5zZXQoZDMuZnVuY3RvcilcbiAgLmRlZmF1bHQoZnVuY3Rpb24oZCkgeyByZXR1cm4gZC52YWx1ZXM7IH0pXG5cbiAgLnByb3AoJ3gnKVxuICAuc2V0KGQzLmZ1bmN0b3IpXG4gIC5kZWZhdWx0KGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQueDsgfSlcblxuICAucHJvcCgneScpXG4gIC5zZXQoZDMuZnVuY3RvcilcbiAgLmRlZmF1bHQoZnVuY3Rpb24oZCkgeyByZXR1cm4gZC55OyB9KVxuXG4gIC5wcm9wKCd5Rm9ybWF0JylcbiAgLmRlZmF1bHQoZDMuZm9ybWF0KCcsMnMnKSlcblxuICAucHJvcCgnZGlmZkZvcm1hdCcpXG4gIC5kZWZhdWx0KGQzLmZvcm1hdCgnKywycycpKVxuXG4gIC5wcm9wKCd4Rm9ybWF0JylcbiAgLmRlZmF1bHQoZDMudGltZS5mb3JtYXQoJyUtZCAlYiAlLUg6JU0nKSlcblxuICAucHJvcCgnbm9uZScpXG4gIC5kZWZhdWx0KDApXG5cbiAgLnByb3AoJ3N1bW1hcnlMaW1pdCcpXG4gIC5kZWZhdWx0KDIpXG4gIC5zZXQoZnVuY3Rpb24odikgeyByZXR1cm4gTWF0aC5tYXgodXRpbHMuZW5zdXJlKHYsIDIpLCAyKTsgfSlcblxuICAucHJvcCgnc3BhcmtsaW5lTGltaXQnKVxuICAuZGVmYXVsdCgxNSlcbiAgLnNldChmdW5jdGlvbih2KSB7IHJldHVybiBNYXRoLm1heCh1dGlscy5lbnN1cmUodiwgMiksIDIpOyB9KVxuXG4gIC5wcm9wKCdzcGFya2xpbmUnKVxuICAucHJvcCgnc3VtbWFyeScpXG5cbiAgLmluaXQoZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5zcGFya2xpbmUoc3BhcmtsaW5lKHRoaXMpKTtcbiAgICB0aGlzLnN1bW1hcnkoc3VtbWFyeSh0aGlzKSk7XG4gIH0pXG5cbiAgLmVudGVyKGZ1bmN0aW9uKGVsKSB7XG4gICAgZWwuYXR0cignY2xhc3MnLCAnbGFzdCB3aWRnZXQnKTtcblxuICAgIGVsLmFwcGVuZCgnZGl2JylcbiAgICAgIC5hdHRyKCdjbGFzcycsICd0aXRsZScpO1xuXG4gICAgdmFyIHZhbHVlcyA9IGVsLmFwcGVuZCgnZGl2JylcbiAgICAgIC5hdHRyKCdjbGFzcycsICd2YWx1ZXMnKTtcblxuICAgIHZhbHVlcy5hcHBlbmQoJ2RpdicpXG4gICAgICAuYXR0cignY2xhc3MnLCAnbGFzdCB2YWx1ZScpO1xuXG4gICAgdmFsdWVzLmFwcGVuZCgnZGl2JylcbiAgICAgIC5hdHRyKCdjbGFzcycsICdzcGFya2xpbmUnKTtcblxuICAgIHZhbHVlcy5hcHBlbmQoJ2RpdicpXG4gICAgICAuYXR0cignY2xhc3MnLCAnc3VtbWFyeScpO1xuICB9KVxuXG4gIC5kcmF3KGZ1bmN0aW9uKGVsKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIHZhciBub2RlID0gZWwubm9kZSgpO1xuXG4gICAgZWwuc3R5bGUoJ3dpZHRoJywgdXRpbHMucHgodGhpcy53aWR0aCgpKSk7XG5cbiAgICBlbC5zZWxlY3QoJy50aXRsZScpXG4gICAgICAudGV4dChmdW5jdGlvbihkLCBpKSB7XG4gICAgICAgIHJldHVybiBzZWxmLnRpdGxlKCkuY2FsbChub2RlLCBkLCBpKTtcbiAgICAgIH0pO1xuXG4gICAgdmFyIHZhbHVlcyA9IGVsLnNlbGVjdCgnLnZhbHVlcycpXG4gICAgICAuZGF0dW0oZnVuY3Rpb24oZCwgaSkge1xuICAgICAgICByZXR1cm4gc2VsZi52YWx1ZXMoKVxuICAgICAgICAgIC5jYWxsKG5vZGUsIGQsIGkpXG4gICAgICAgICAgLm1hcChmdW5jdGlvbihkLCBpKSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICB4OiBzZWxmLngoKS5jYWxsKG5vZGUsIGQsIGkpLFxuICAgICAgICAgICAgICB5OiBzZWxmLnkoKS5jYWxsKG5vZGUsIGQsIGkpXG4gICAgICAgICAgICB9O1xuICAgICAgICAgIH0pO1xuICAgICAgfSlcbiAgICAgIC5hdHRyKCdjbGFzcycsIGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgZCA9IGQuc2xpY2UoLTIpO1xuXG4gICAgICAgIGQgPSBkLmxlbmd0aCA+IDFcbiAgICAgICAgICA/IGRbMV0ueSAtIGRbMF0ueVxuICAgICAgICAgIDogMDtcblxuICAgICAgICBpZiAoZCA+IDApIHsgcmV0dXJuICdnb29kIHZhbHVlcyc7IH1cbiAgICAgICAgaWYgKGQgPCAwKSB7IHJldHVybiAnYmFkIHZhbHVlcyc7IH1cbiAgICAgICAgcmV0dXJuICduZXV0cmFsIHZhbHVlcyc7XG4gICAgICB9KTtcblxuICAgIHZhbHVlcy5zZWxlY3QoJy5sYXN0LnZhbHVlJylcbiAgICAgIC5kYXR1bShmdW5jdGlvbihkLCBpKSB7XG4gICAgICAgIGQgPSBkW2QubGVuZ3RoIC0gMV07XG5cbiAgICAgICAgcmV0dXJuICFkXG4gICAgICAgICAgPyBzZWxmLm5vbmUoKVxuICAgICAgICAgIDogZC55O1xuICAgICAgfSlcbiAgICAgIC50ZXh0KHRoaXMueUZvcm1hdCgpKTtcblxuICAgIHZhbHVlcy5zZWxlY3QoJy5zcGFya2xpbmUnKVxuICAgICAgLmNhbGwodGhpcy5zcGFya2xpbmUoKSk7XG5cbiAgICB2YWx1ZXMuc2VsZWN0KCcuc3VtbWFyeScpXG4gICAgICAuY2FsbCh0aGlzLnN1bW1hcnkoKSk7XG4gIH0pO1xuXG5cbnZhciBzdW1tYXJ5ID0gcmVxdWlyZSgnLi4vdmlldycpLmV4dGVuZCgpXG4gIC5wcm9wKCd3aWRnZXQnKVxuXG4gIC5pbml0KGZ1bmN0aW9uKHdpZGdldCkge1xuICAgIHRoaXMud2lkZ2V0KHdpZGdldCk7XG4gIH0pXG5cbiAgLmVudGVyKGZ1bmN0aW9uKGVsKSB7XG4gICAgZWwuYXBwZW5kKCdzcGFuJylcbiAgICAgIC5hdHRyKCdjbGFzcycsICdkaWZmJyk7XG5cbiAgICBlbC5hcHBlbmQoJ3NwYW4nKVxuICAgICAgLmF0dHIoJ2NsYXNzJywgJ3RpbWUnKTtcbiAgfSlcblxuICAuZHJhdyhmdW5jdGlvbihlbCkge1xuICAgIHZhciB3aWRnZXQgPSB0aGlzLndpZGdldCgpO1xuXG4gICAgaWYgKGVsLmRhdHVtKCkubGVuZ3RoIDwgdGhpcy53aWRnZXQoKS5zdW1tYXJ5TGltaXQoKSkge1xuICAgICAgZWwuc3R5bGUoJ2hlaWdodCcsIDApO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGVsLnNlbGVjdCgnLmRpZmYnKVxuICAgICAgLmRhdHVtKGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgZCA9IGQuc2xpY2UoLTIpO1xuICAgICAgICByZXR1cm4gZFsxXS55IC0gZFswXS55O1xuICAgICAgfSlcbiAgICAgIC50ZXh0KHdpZGdldC5kaWZmRm9ybWF0KCkpO1xuXG4gICAgZWwuc2VsZWN0KCcudGltZScpXG4gICAgICAuZGF0dW0oZnVuY3Rpb24oZCkge1xuICAgICAgICBkID0gZC5zbGljZSgtMik7XG5cbiAgICAgICAgcmV0dXJuIFtkWzBdLngsIGRbMV0ueF1cbiAgICAgICAgICAubWFwKHV0aWxzLmRhdGUpXG4gICAgICAgICAgLm1hcCh3aWRnZXQueEZvcm1hdCgpKTtcbiAgICAgIH0pXG4gICAgICAudGV4dChmdW5jdGlvbihkKSB7XG4gICAgICAgIHJldHVybiBbJyBmcm9tJywgZFswXSwgJ3RvJywgZFsxXV0uam9pbignICcpO1xuICAgICAgfSk7XG4gIH0pO1xuXG5cbnZhciBzcGFya2xpbmUgPSByZXF1aXJlKCcuLi92aWV3JykuZXh0ZW5kKClcbiAgLnByb3AoJ3dpZGdldCcpXG5cbiAgLnByb3AoJ2hlaWdodCcpXG4gIC5kZWZhdWx0KDI1KVxuXG4gIC5wcm9wKCdtYXJnaW4nKVxuICAuZGVmYXVsdCh7XG4gICAgdG9wOiA0LFxuICAgIGxlZnQ6IDQsXG4gICAgYm90dG9tOiA0LFxuICAgIHJpZ2h0OiA0IFxuICB9KVxuXG4gIC5pbml0KGZ1bmN0aW9uKHdpZGdldCkge1xuICAgIHRoaXMud2lkZ2V0KHdpZGdldCk7XG4gIH0pXG5cbiAgLmVudGVyKGZ1bmN0aW9uKGVsKSB7XG4gICAgdmFyIHN2ZyA9IGVsLmFwcGVuZCgnc3ZnJylcbiAgICAgIC5hcHBlbmQoJ2cnKTtcblxuICAgIHN2Zy5hcHBlbmQoJ3BhdGgnKVxuICAgICAgLmF0dHIoJ2NsYXNzJywgJ3Jlc3QgcGF0aCcpO1xuXG4gICAgc3ZnLmFwcGVuZCgncGF0aCcpXG4gICAgICAuYXR0cignY2xhc3MnLCAnZGlmZiBwYXRoJyk7XG4gIH0pXG5cbiAgLmRyYXcoZnVuY3Rpb24oZWwpIHtcbiAgICBpZiAoZWwuZGF0dW0oKS5sZW5ndGggPCB0aGlzLndpZGdldCgpLnNwYXJrbGluZUxpbWl0KCkpIHtcbiAgICAgIGVsLnN0eWxlKCdoZWlnaHQnLCAwKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB2YXIgZGltcyA9IHV0aWxzLmJveCgpXG4gICAgICAubWFyZ2luKHRoaXMubWFyZ2luKCkpXG4gICAgICAud2lkdGgocGFyc2VJbnQoZWwuc3R5bGUoJ3dpZHRoJykpKVxuICAgICAgLmhlaWdodCh0aGlzLmhlaWdodCgpKVxuICAgICAgLmNhbGMoKTtcblxuICAgIHZhciBmeCA9IGQzLnNjYWxlLmxpbmVhcigpXG4gICAgICAuZG9tYWluKGQzLmV4dGVudChlbC5kYXR1bSgpLCBmdW5jdGlvbihkKSB7IHJldHVybiBkLng7IH0pKVxuICAgICAgLnJhbmdlKFswLCBkaW1zLmlubmVyV2lkdGhdKTtcblxuICAgIHZhciBmeSA9IGQzLnNjYWxlLmxpbmVhcigpXG4gICAgICAuZG9tYWluKGQzLmV4dGVudChlbC5kYXR1bSgpLCBmdW5jdGlvbihkKSB7IHJldHVybiBkLnk7IH0pKVxuICAgICAgLnJhbmdlKFtkaW1zLmlubmVySGVpZ2h0LCAwXSk7XG5cbiAgICB2YXIgbGluZSA9IGQzLnN2Zy5saW5lKClcbiAgICAgIC54KGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGZ4KGQueCk7IH0pXG4gICAgICAueShmdW5jdGlvbihkKSB7IHJldHVybiBmeShkLnkpOyB9KTtcblxuICAgIHZhciBzdmcgPSBlbC5zZWxlY3QoJ3N2ZycpXG4gICAgICAuYXR0cignd2lkdGgnLCBkaW1zLndpZHRoKVxuICAgICAgLmF0dHIoJ2hlaWdodCcsIGRpbXMuaGVpZ2h0KVxuICAgICAgLnNlbGVjdCgnZycpXG4gICAgICAgIC5hdHRyKCd0cmFuc2Zvcm0nLCB1dGlscy50cmFuc2xhdGUoZGltcy5tYXJnaW4ubGVmdCwgZGltcy5tYXJnaW4udG9wKSk7XG5cbiAgICBzdmcuc2VsZWN0KCcucmVzdC5wYXRoJylcbiAgICAgIC5hdHRyKCdkJywgbGluZSk7XG5cbiAgICBzdmcuc2VsZWN0KCcuZGlmZi5wYXRoJylcbiAgICAgIC5kYXR1bShmdW5jdGlvbihkKSB7IHJldHVybiBkLnNsaWNlKC0yKTsgfSlcbiAgICAgIC5hdHRyKCdkJywgbGluZSk7XG5cbiAgICB2YXIgZG90ID0gc3ZnLnNlbGVjdEFsbCgnLmRvdCcpXG4gICAgICAuZGF0YShmdW5jdGlvbihkKSB7IHJldHVybiBkLnNsaWNlKC0xKTsgfSk7XG5cbiAgICBkb3QuZW50ZXIoKS5hcHBlbmQoJ2NpcmNsZScpXG4gICAgICAuYXR0cignY2xhc3MnLCAnZG90JylcbiAgICAgIC5hdHRyKCdyJywgNCk7XG5cbiAgICBkb3RcbiAgICAgIC5hdHRyKCdjeCcsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGZ4KGQueCk7IH0pXG4gICAgICAuYXR0cignY3knLCBmdW5jdGlvbihkKSB7IHJldHVybiBmeShkLnkpOyB9KTtcblxuICAgIGRvdC5leGl0KCkucmVtb3ZlKCk7XG4gIH0pO1xuIiwidmFyIHV0aWxzID0gcmVxdWlyZSgnLi4vdXRpbHMnKTtcblxuXG5tb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoJy4vd2lkZ2V0JykuZXh0ZW5kKClcbiAgLnByb3AoJ3dpZHRoJylcbiAgLmRlZmF1bHQoNDAwKVxuXG4gIC5wcm9wKCdjb2xzcGFuJylcbiAgLmRlZmF1bHQoNClcblxuICAucHJvcCgndGl0bGUnKVxuICAuc2V0KGQzLmZ1bmN0b3IpXG4gIC5kZWZhdWx0KGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQudGl0bGU7IH0pXG5cbiAgLnByb3AoJ21ldHJpY3MnKVxuICAuc2V0KGQzLmZ1bmN0b3IpXG4gIC5kZWZhdWx0KGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQubWV0cmljczsgfSlcblxuICAucHJvcCgna2V5JylcbiAgLnNldChkMy5mdW5jdG9yKVxuICAuZGVmYXVsdChmdW5jdGlvbihkLCBpKSB7IHJldHVybiBpOyB9KVxuXG4gIC5wcm9wKCdtZXRyaWNUaXRsZScpXG4gIC5zZXQoZDMuZnVuY3RvcilcbiAgLmRlZmF1bHQoZnVuY3Rpb24oZCkgeyByZXR1cm4gZC50aXRsZTsgfSlcblxuICAucHJvcCgndmFsdWVzJylcbiAgLnNldChkMy5mdW5jdG9yKVxuICAuZGVmYXVsdChmdW5jdGlvbihkKSB7IHJldHVybiBkLnZhbHVlczsgfSlcblxuICAucHJvcCgneCcpXG4gIC5zZXQoZDMuZnVuY3RvcilcbiAgLmRlZmF1bHQoZnVuY3Rpb24oZCkgeyByZXR1cm4gZC54OyB9KVxuXG4gIC5wcm9wKCd5JylcbiAgLnNldChkMy5mdW5jdG9yKVxuICAuZGVmYXVsdChmdW5jdGlvbihkKSB7IHJldHVybiBkLnk7IH0pXG5cbiAgLnByb3AoJ3hGb3JtYXQnKVxuICAuZGVmYXVsdChudWxsKVxuXG4gIC5wcm9wKCd4VGlja3MnKVxuICAuZGVmYXVsdCg4KVxuXG4gIC5wcm9wKCd5Rm9ybWF0JylcbiAgLmRlZmF1bHQoZDMuZm9ybWF0KCcuMnMnKSlcblxuICAucHJvcCgneVRpY2tzJylcbiAgLmRlZmF1bHQoNSlcblxuICAucHJvcCgneUZvcm1hdCcpXG4gIC5kZWZhdWx0KGQzLmZvcm1hdCgnLDJzJykpXG5cbiAgLnByb3AoJ25vbmUnKVxuICAuZGVmYXVsdCgwKVxuXG4gIC5wcm9wKCdjb2xvcnMnKVxuICAucHJvcCgnY2hhcnQnKVxuICAucHJvcCgnbGVnZW5kJylcblxuICAuaW5pdChmdW5jdGlvbigpIHtcbiAgICB0aGlzLmNoYXJ0KGNoYXJ0KHRoaXMpKTtcbiAgICB0aGlzLmxlZ2VuZChsZWdlbmQodGhpcykpO1xuICAgIHRoaXMuY29sb3JzKGQzLnNjYWxlLmNhdGVnb3J5MTAoKSk7XG4gIH0pXG5cbiAgLmVudGVyKGZ1bmN0aW9uKGVsKSB7XG4gICAgZWwuYXR0cignY2xhc3MnLCAnbGluZXMgd2lkZ2V0Jyk7XG5cbiAgICBlbC5hcHBlbmQoJ2RpdicpXG4gICAgICAuYXR0cignY2xhc3MnLCAndGl0bGUnKTtcblxuICAgIHZhciB2YWx1ZXMgPSBlbC5hcHBlbmQoJ2RpdicpXG4gICAgICAuYXR0cignY2xhc3MnLCAndmFsdWVzJyk7XG5cbiAgICB2YWx1ZXMuYXBwZW5kKCdkaXYnKVxuICAgICAgLmF0dHIoJ2NsYXNzJywgJ2NoYXJ0Jyk7XG5cbiAgICB2YWx1ZXMuYXBwZW5kKCdkaXYnKVxuICAgICAgLmF0dHIoJ2NsYXNzJywgJ2xlZ2VuZCcpO1xuICB9KVxuXG4gIC5tZXRoKGZ1bmN0aW9uIG5vcm1hbGl6ZShlbCkge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICB2YXIgbm9kZSA9IGVsLm5vZGUoKTtcblxuICAgIGVsLmRhdHVtKGZ1bmN0aW9uKGQsIGkpIHtcbiAgICAgIHZhciB0aXRsZSA9IHNlbGYudGl0bGUoKS5jYWxsKG5vZGUsIGQsIGkpO1xuXG4gICAgICByZXR1cm4ge1xuICAgICAgICB0aXRsZTogdGl0bGUsXG4gICAgICAgIG1ldHJpY3M6IHNlbGYubWV0cmljcygpXG4gICAgICAgICAgLmNhbGwobm9kZSwgZCwgaSlcbiAgICAgICAgICAubWFwKG1ldHJpYylcbiAgICAgIH07XG4gICAgfSk7XG5cbiAgICBmdW5jdGlvbiBtZXRyaWMoZCwgaSkge1xuICAgICAgdmFyIGtleSA9IHNlbGYua2V5KClcbiAgICAgICAgLmNhbGwobm9kZSwgZCwgaSlcbiAgICAgICAgLnRvU3RyaW5nKCk7XG5cbiAgICAgIHJldHVybiB7XG4gICAgICAgIGtleToga2V5LFxuICAgICAgICBjb2xvcjogc2VsZi5jb2xvcnMoKShrZXkpLFxuICAgICAgICB0aXRsZTogc2VsZi5tZXRyaWNUaXRsZSgpLmNhbGwobm9kZSwgZCwgaSksXG4gICAgICAgIHZhbHVlczogc2VsZi52YWx1ZXMoKVxuICAgICAgICAgIC5jYWxsKG5vZGUsIGQsIGkpXG4gICAgICAgICAgLm1hcCh2YWx1ZSlcbiAgICAgIH07XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gdmFsdWUoZCwgaSkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgeDogc2VsZi54KCkuY2FsbChub2RlLCBkLCBpKSxcbiAgICAgICAgeTogc2VsZi55KCkuY2FsbChub2RlLCBkLCBpKVxuICAgICAgfTtcbiAgICB9XG4gIH0pXG5cbiAgLmRyYXcoZnVuY3Rpb24oZWwpIHtcbiAgICB0aGlzLm5vcm1hbGl6ZShlbCk7XG5cbiAgICBlbC5zdHlsZSgnd2lkdGgnLCB1dGlscy5weCh0aGlzLndpZHRoKCkpKTtcblxuICAgIGVsLnNlbGVjdCgnLndpZGdldCAudGl0bGUnKVxuICAgICAgLnRleHQoZnVuY3Rpb24oZCkgeyByZXR1cm4gZC50aXRsZTsgfSk7XG5cbiAgICB2YXIgdmFsdWVzID0gZWwuc2VsZWN0KCcudmFsdWVzJylcbiAgICAgIC5kYXR1bShmdW5jdGlvbihkLCBpKSB7IHJldHVybiBkLm1ldHJpY3M7IH0pO1xuXG4gICAgdmFsdWVzLnNlbGVjdCgnLmNoYXJ0JylcbiAgICAgIC5jYWxsKHRoaXMuY2hhcnQoKSk7XG5cbiAgICB2YWx1ZXMuc2VsZWN0KCcubGVnZW5kJylcbiAgICAgIC5jYWxsKHRoaXMubGVnZW5kKCkpO1xuICB9KTtcblxuXG52YXIgY2hhcnQgPSByZXF1aXJlKCcuLi92aWV3JykuZXh0ZW5kKClcbiAgLnByb3AoJ2hlaWdodCcpXG4gIC5kZWZhdWx0KDE1MClcblxuICAucHJvcCgnbWFyZ2luJylcbiAgLmRlZmF1bHQoe1xuICAgIHRvcDogMTAsXG4gICAgbGVmdDogMzUsXG4gICAgcmlnaHQ6IDE1LFxuICAgIGJvdHRvbTogMjBcbiAgfSlcblxuICAucHJvcCgnd2lkZ2V0JylcblxuICAuaW5pdChmdW5jdGlvbih3aWRnZXQpIHtcbiAgICB0aGlzLndpZGdldCh3aWRnZXQpO1xuICB9KVxuXG4gIC5lbnRlcihmdW5jdGlvbihlbCkge1xuICAgIHZhciBzdmcgPSBlbC5hcHBlbmQoJ3N2ZycpXG4gICAgICAuYXBwZW5kKCdnJyk7XG5cbiAgICBzdmcuYXBwZW5kKCdnJylcbiAgICAgIC5hdHRyKCdjbGFzcycsICd4IGF4aXMnKTtcblxuICAgIHN2Zy5hcHBlbmQoJ2cnKVxuICAgICAgLmF0dHIoJ2NsYXNzJywgJ3kgYXhpcycpO1xuXG4gICAgc3ZnLmFwcGVuZCgnZycpXG4gICAgICAuYXR0cignY2xhc3MnLCAnbGluZXMnKTtcbiAgfSlcblxuICAuZHJhdyhmdW5jdGlvbihlbCkge1xuICAgIHZhciBkaW1zID0gdXRpbHMuYm94KClcbiAgICAgIC5tYXJnaW4odGhpcy5tYXJnaW4oKSlcbiAgICAgIC53aWR0aChwYXJzZUludChlbC5zdHlsZSgnd2lkdGgnKSkpXG4gICAgICAuaGVpZ2h0KHRoaXMuaGVpZ2h0KCkpXG4gICAgICAuY2FsYygpO1xuXG4gICAgdmFyIGFsbFZhbHVlcyA9IGVsXG4gICAgICAuZGF0dW0oKVxuICAgICAgLnJlZHVjZShmdW5jdGlvbihyZXN1bHRzLCBtZXRyaWMpIHtcbiAgICAgICAgcmVzdWx0cy5wdXNoLmFwcGx5KHJlc3VsdHMsIG1ldHJpYy52YWx1ZXMpO1xuICAgICAgICByZXR1cm4gcmVzdWx0cztcbiAgICAgIH0sIFtdKTtcblxuICAgIHZhciBmeCA9IGQzLnRpbWUuc2NhbGUoKVxuICAgICAgLmRvbWFpbihkMy5leHRlbnQoYWxsVmFsdWVzLCBmdW5jdGlvbihkKSB7IHJldHVybiBkLng7IH0pKVxuICAgICAgLnJhbmdlKFswLCBkaW1zLmlubmVyV2lkdGhdKTtcblxuICAgIHZhciBmeSA9IGQzLnNjYWxlLmxpbmVhcigpXG4gICAgICAuZG9tYWluKGQzLmV4dGVudChhbGxWYWx1ZXMsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQueTsgfSkpXG4gICAgICAucmFuZ2UoW2RpbXMuaW5uZXJIZWlnaHQsIDBdKTtcblxuICAgIHZhciBsaW5lID0gZDMuc3ZnLmxpbmUoKVxuICAgICAgLngoZnVuY3Rpb24oZCkgeyByZXR1cm4gZngoZC54KTsgfSlcbiAgICAgIC55KGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGZ5KGQueSk7IH0pO1xuXG4gICAgdmFyIHN2ZyA9IGVsLnNlbGVjdCgnc3ZnJylcbiAgICAgIC5hdHRyKCd3aWR0aCcsIGRpbXMud2lkdGgpXG4gICAgICAuYXR0cignaGVpZ2h0JywgZGltcy5oZWlnaHQpXG4gICAgICAuc2VsZWN0KCdnJylcbiAgICAgICAgLmF0dHIoJ3RyYW5zZm9ybScsIHV0aWxzLnRyYW5zbGF0ZShkaW1zLm1hcmdpbi5sZWZ0LCBkaW1zLm1hcmdpbi50b3ApKTtcblxuICAgIHZhciBtZXRyaWMgPSBzdmcuc2VsZWN0KCcubGluZXMnKS5zZWxlY3RBbGwoJy5tZXRyaWMnKVxuICAgICAgLmRhdGEoZnVuY3Rpb24oZCkgeyByZXR1cm4gZDsgfSxcbiAgICAgICAgICAgIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQua2V5OyB9KTtcblxuICAgIG1ldHJpYy5lbnRlcigpLmFwcGVuZCgnZycpXG4gICAgICAuYXR0cignY2xhc3MnLCAnbWV0cmljJylcbiAgICAgIC5hdHRyKCdkYXRhLWtleScsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQua2V5OyB9KVxuICAgICAgLmFwcGVuZCgncGF0aCcpXG4gICAgICAgIC5hdHRyKCdjbGFzcycsICdsaW5lJyk7XG5cbiAgICBtZXRyaWMuc2VsZWN0KCcubGluZScpXG4gICAgICAuYXR0cignc3Ryb2tlJywgZnVuY3Rpb24oZCkgeyByZXR1cm4gZC5jb2xvcjsgfSlcbiAgICAgIC5hdHRyKCdkJywgZnVuY3Rpb24oZCkgeyByZXR1cm4gbGluZShkLnZhbHVlcyk7IH0pO1xuXG4gICAgdmFyIGRvdCA9IG1ldHJpYy5zZWxlY3RBbGwoJy5kb3QnKVxuICAgICAgLmRhdGEoZnVuY3Rpb24oZCkge1xuICAgICAgICBpZiAoIWQudmFsdWVzLmxlbmd0aCkgeyByZXR1cm4gW107IH1cbiAgICAgICAgdmFyIGxhc3QgPSBkLnZhbHVlc1tkLnZhbHVlcy5sZW5ndGggLSAxXTtcblxuICAgICAgICByZXR1cm4gW3tcbiAgICAgICAgICB4OiBsYXN0LngsXG4gICAgICAgICAgeTogbGFzdC55LFxuICAgICAgICAgIGNvbG9yOiBkLmNvbG9yXG4gICAgICAgIH1dO1xuICAgICAgfSk7XG5cbiAgICBkb3QuZW50ZXIoKS5hcHBlbmQoJ2NpcmNsZScpXG4gICAgICAuYXR0cignY2xhc3MnLCAnZG90JylcbiAgICAgIC5hdHRyKCdyJywgNCk7XG5cbiAgICBkb3RcbiAgICAgIC5hdHRyKCdmaWxsJywgZnVuY3Rpb24oZCkgeyByZXR1cm4gZC5jb2xvcjsgfSlcbiAgICAgIC5hdHRyKCdjeCcsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGZ4KGQueCk7IH0pXG4gICAgICAuYXR0cignY3knLCBmdW5jdGlvbihkKSB7IHJldHVybiBmeShkLnkpOyB9KTtcblxuICAgIGRvdC5leGl0KClcbiAgICAgIC5yZW1vdmUoKTtcblxuICAgIG1ldHJpYy5leGl0KClcbiAgICAgIC5yZW1vdmUoKTtcblxuICAgIHZhciBheGlzID0gZDMuc3ZnLmF4aXMoKVxuICAgICAgLnNjYWxlKGZ4KVxuICAgICAgLnRpY2tQYWRkaW5nKDgpXG4gICAgICAudGlja3ModGhpcy53aWRnZXQoKS54VGlja3MoKSlcbiAgICAgIC50aWNrRm9ybWF0KHRoaXMud2lkZ2V0KCkueEZvcm1hdCgpKVxuICAgICAgLnRpY2tTaXplKC1kaW1zLmlubmVySGVpZ2h0KTtcblxuICAgIHN2Zy5zZWxlY3QoJy54LmF4aXMnKVxuICAgICAgLmF0dHIoJ3RyYW5zZm9ybScsIHV0aWxzLnRyYW5zbGF0ZSgwLCBkaW1zLmlubmVySGVpZ2h0KSlcbiAgICAgIC5jYWxsKGF4aXMpO1xuXG4gICAgYXhpcyA9IGQzLnN2Zy5heGlzKClcbiAgICAgIC5vcmllbnQoJ2xlZnQnKVxuICAgICAgLnNjYWxlKGZ5KVxuICAgICAgLnRpY2tQYWRkaW5nKDgpXG4gICAgICAudGlja3ModGhpcy53aWRnZXQoKS55VGlja3MoKSlcbiAgICAgIC50aWNrRm9ybWF0KHRoaXMud2lkZ2V0KCkueUZvcm1hdCgpKVxuICAgICAgLnRpY2tTaXplKC1kaW1zLmlubmVyV2lkdGgpO1xuICAgIFxuICAgIHN2Zy5zZWxlY3QoJy55LmF4aXMnKVxuICAgICAgLmNhbGwoYXhpcyk7XG4gIH0pO1xuXG5cbnZhciBsZWdlbmQgPSByZXF1aXJlKCcuLi92aWV3JykuZXh0ZW5kKClcbiAgLnByb3AoJ3dpZGdldCcpXG5cbiAgLmluaXQoZnVuY3Rpb24od2lkZ2V0KSB7XG4gICAgdGhpcy53aWRnZXQod2lkZ2V0KTtcbiAgfSlcblxuICAuZW50ZXIoZnVuY3Rpb24oZWwpIHtcbiAgICBlbC5hcHBlbmQoJ3RhYmxlJylcbiAgICAgIC5hdHRyKCdjbGFzcycsICd0YWJsZScpO1xuICB9KVxuXG4gIC5kcmF3KGZ1bmN0aW9uKGVsKSB7XG4gICAgdmFyIG5vbmUgPSB0aGlzLndpZGdldCgpLm5vbmUoKTtcbiAgICB2YXIgeUZvcm1hdCA9IHRoaXMud2lkZ2V0KCkueUZvcm1hdCgpO1xuXG4gICAgdmFyIG1ldHJpYyA9IGVsLnNlbGVjdCgnLnRhYmxlJykuc2VsZWN0QWxsKCcubWV0cmljJylcbiAgICAgIC5kYXRhKGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQ7IH0sXG4gICAgICAgICAgICBmdW5jdGlvbihkKSB7IHJldHVybiBkLmtleTsgfSk7XG5cbiAgICB2YXIgZW50ZXJNZXRyaWMgPSBtZXRyaWMuZW50ZXIoKS5hcHBlbmQoJ3RyJylcbiAgICAgIC5hdHRyKCdkYXRhLWtleScsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQua2V5OyB9KVxuICAgICAgLmF0dHIoJ2NsYXNzJywgJ21ldHJpYycpO1xuXG4gICAgZW50ZXJNZXRyaWMuYXBwZW5kKCd0ZCcpXG4gICAgICAuYXR0cignY2xhc3MnLCAnc3dhdGNoJyk7XG5cbiAgICBlbnRlck1ldHJpYy5hcHBlbmQoJ3RkJylcbiAgICAgIC5hdHRyKCdjbGFzcycsICd0aXRsZScpO1xuXG4gICAgZW50ZXJNZXRyaWMuYXBwZW5kKCd0ZCcpXG4gICAgICAuYXR0cignY2xhc3MnLCAndmFsdWUnKTtcblxuICAgIG1ldHJpYy5zZWxlY3QoJy5zd2F0Y2gnKVxuICAgICAgLnN0eWxlKCdiYWNrZ3JvdW5kJywgZnVuY3Rpb24oZCkgeyByZXR1cm4gZC5jb2xvcjsgfSk7XG5cbiAgICBtZXRyaWMuc2VsZWN0KCcudGl0bGUnKVxuICAgICAgLnRleHQoZnVuY3Rpb24oZCkgeyByZXR1cm4gZC50aXRsZTsgfSk7XG5cbiAgICBtZXRyaWMuc2VsZWN0KCcudmFsdWUnKVxuICAgICAgLnRleHQoZnVuY3Rpb24oZCkge1xuICAgICAgICBkID0gZC52YWx1ZXNbZC52YWx1ZXMubGVuZ3RoIC0gMV07XG5cbiAgICAgICAgcmV0dXJuIGRcbiAgICAgICAgICA/IHlGb3JtYXQoZC55KVxuICAgICAgICAgIDogeUZvcm1hdChub25lKTtcbiAgICAgIH0pO1xuXG4gICAgbWV0cmljLmV4aXQoKVxuICAgICAgLnJlbW92ZSgpO1xuICB9KTtcbiIsInZhciB1dGlscyA9IHJlcXVpcmUoJy4uL3V0aWxzJyk7XG5cblxubW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKCcuL3dpZGdldCcpLmV4dGVuZCgpXG4gIC5wcm9wKCd3aWR0aCcpXG4gIC5kZWZhdWx0KDQwMClcblxuICAucHJvcCgnY29sc3BhbicpXG4gIC5kZWZhdWx0KDQpXG5cbiAgLnByb3AoJ2NvbG9ycycpXG5cbiAgLnByb3AoJ3RpdGxlJylcbiAgLnNldChkMy5mdW5jdG9yKVxuICAuZGVmYXVsdChmdW5jdGlvbihkKSB7IHJldHVybiBkLnRpdGxlOyB9KVxuXG4gIC5wcm9wKCdtZXRyaWNzJylcbiAgLnNldChkMy5mdW5jdG9yKVxuICAuZGVmYXVsdChmdW5jdGlvbihkKSB7IHJldHVybiBkLm1ldHJpY3M7IH0pXG5cbiAgLnByb3AoJ2tleScpXG4gIC5zZXQoZDMuZnVuY3RvcilcbiAgLmRlZmF1bHQoZnVuY3Rpb24oZCwgaSkgeyByZXR1cm4gaTsgfSlcblxuICAucHJvcCgnbWV0cmljVGl0bGUnKVxuICAuc2V0KGQzLmZ1bmN0b3IpXG4gIC5kZWZhdWx0KGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQudGl0bGU7IH0pXG5cbiAgLnByb3AoJ3ZhbHVlJylcbiAgLnNldChkMy5mdW5jdG9yKVxuICAuZGVmYXVsdChmdW5jdGlvbihkKSB7IHJldHVybiBkLnZhbHVlOyB9KVxuXG4gIC5wcm9wKCdtYXJnaW4nKVxuICAuZGVmYXVsdCh7XG4gICAgdG9wOiAyMCxcbiAgICBsZWZ0OiAyMCxcbiAgICByaWdodDogMjAsXG4gICAgYm90dG9tOiAyMFxuICB9KVxuXG4gIC5wcm9wKCdpbm5lclJhZGl1cycpXG4gIC5zZXQoZDMuZnVuY3RvcilcbiAgLmRlZmF1bHQoZnVuY3Rpb24ocikgeyByZXR1cm4gMC4zNSAqIHI7IH0pXG5cbiAgLnByb3AoJ3ZhbHVlRm9ybWF0JylcbiAgLmRlZmF1bHQoZDMuZm9ybWF0KCcsMnMnKSlcblxuICAucHJvcCgncGVyY2VudEZvcm1hdCcpXG4gIC5kZWZhdWx0KGQzLmZvcm1hdCgnLjAlJykpXG5cbiAgLmluaXQoZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5jb2xvcnMoZDMuc2NhbGUuY2F0ZWdvcnkxMCgpKTtcbiAgfSlcblxuICAubWV0aChmdW5jdGlvbiBub3JtYWxpemUoZWwpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgdmFyIG5vZGUgPSBlbC5ub2RlKCk7XG5cbiAgICBlbC5kYXR1bShmdW5jdGlvbihkLCBpKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICB0aXRsZTogc2VsZi50aXRsZSgpLmNhbGwobm9kZSwgZCwgaSksXG4gICAgICAgIG1ldHJpY3M6IHNlbGYubWV0cmljcygpXG4gICAgICAgICAgLmNhbGwobm9kZSwgZCwgaSlcbiAgICAgICAgICAubWFwKG1ldHJpYylcbiAgICAgIH07XG4gICAgfSk7XG5cbiAgICBmdW5jdGlvbiBtZXRyaWMoZCwgaSkge1xuICAgICAgdmFyIGtleSA9IHNlbGYua2V5KClcbiAgICAgICAgLmNhbGwobm9kZSwgZCwgaSlcbiAgICAgICAgLnRvU3RyaW5nKCk7XG5cbiAgICAgIHJldHVybiB7XG4gICAgICAgIGtleToga2V5LFxuICAgICAgICBjb2xvcjogc2VsZi5jb2xvcnMoKShrZXkpLFxuICAgICAgICB0aXRsZTogc2VsZi5tZXRyaWNUaXRsZSgpLmNhbGwobm9kZSwgZCwgaSksXG4gICAgICAgIHZhbHVlOiBzZWxmLnZhbHVlKCkuY2FsbChub2RlLCBkLCBpKVxuICAgICAgfTtcbiAgICB9XG5cbiAgICB2YXIgc3VtID0gZDMuc3VtKGVsLmRhdHVtKCkubWV0cmljcywgZnVuY3Rpb24oZCkgeyByZXR1cm4gZC52YWx1ZTsgfSk7XG4gICAgZWwuZGF0dW0oKS5tZXRyaWNzLmZvckVhY2goZnVuY3Rpb24oZCkgeyBkLnBlcmNlbnQgPSBkLnZhbHVlIC8gc3VtOyB9KTtcbiAgfSlcblxuICAuZW50ZXIoZnVuY3Rpb24oZWwpIHtcbiAgICBlbC5hdHRyKCdjbGFzcycsICdwaWUgd2lkZ2V0Jyk7XG5cbiAgICBlbC5hcHBlbmQoJ2RpdicpXG4gICAgICAuYXR0cignY2xhc3MnLCAndGl0bGUnKTtcblxuICAgIGVsLmFwcGVuZCgnZGl2JylcbiAgICAgIC5hdHRyKCdjbGFzcycsICdjaGFydCcpO1xuXG4gICAgZWwuYXBwZW5kKCdkaXYnKVxuICAgICAgLmF0dHIoJ2NsYXNzJywgJ2xlZ2VuZCcpO1xuICB9KVxuXG4gIC5kcmF3KGZ1bmN0aW9uKGVsKSB7XG4gICAgdGhpcy5ub3JtYWxpemUoZWwpO1xuXG4gICAgZWwuc3R5bGUoJ3dpZHRoJywgdXRpbHMucHgodGhpcy53aWR0aCgpKSk7XG5cbiAgICBlbC5zZWxlY3QoJy53aWRnZXQgLnRpdGxlJylcbiAgICAgIC50ZXh0KGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQudGl0bGU7IH0pO1xuXG4gICAgZWwuc2VsZWN0KCcubGVnZW5kJylcbiAgICAgIC5jYWxsKGxlZ2VuZCh0aGlzKSk7XG5cbiAgICBlbC5zZWxlY3QoJy5jaGFydCcpXG4gICAgICAuY2FsbChjaGFydCh0aGlzKSk7XG4gIH0pO1xuXG5cbnZhciBjaGFydCA9IHJlcXVpcmUoJy4uL3ZpZXcnKS5leHRlbmQoKVxuICAucHJvcCgnd2lkZ2V0JylcblxuICAuaW5pdChmdW5jdGlvbih3aWRnZXQpIHtcbiAgICB0aGlzLndpZGdldCh3aWRnZXQpO1xuICB9KVxuXG4gIC5lbnRlcihmdW5jdGlvbihlbCkge1xuICAgIGVsLmFwcGVuZCgnc3ZnJylcbiAgICAgIC5hcHBlbmQoJ2cnKTtcbiAgfSlcblxuICAuZHJhdyhmdW5jdGlvbihlbCkge1xuICAgIHZhciB3aWR0aCA9IHBhcnNlSW50KGVsLnN0eWxlKCd3aWR0aCcpKTtcblxuICAgIHZhciBkaW1zID0gdXRpbHMuYm94KClcbiAgICAgIC5tYXJnaW4odGhpcy53aWRnZXQoKS5tYXJnaW4oKSlcbiAgICAgIC53aWR0aCh3aWR0aClcbiAgICAgIC5oZWlnaHQod2lkdGgpXG4gICAgICAuY2FsYygpO1xuXG4gICAgdmFyIHJhZGl1cyA9IE1hdGgubWluKGRpbXMuaW5uZXJXaWR0aCwgZGltcy5pbm5lckhlaWdodCkgLyAyO1xuXG4gICAgdmFyIHN2ZyA9IGVsLnNlbGVjdCgnc3ZnJylcbiAgICAgIC5hdHRyKCd3aWR0aCcsIGRpbXMud2lkdGgpXG4gICAgICAuYXR0cignaGVpZ2h0JywgZGltcy5oZWlnaHQpXG4gICAgICAuc2VsZWN0KCdnJylcbiAgICAgICAgLmF0dHIoJ3RyYW5zZm9ybScsIHV0aWxzLnRyYW5zbGF0ZShcbiAgICAgICAgICAoZGltcy53aWR0aCAvIDIpIC0gcmFkaXVzLFxuICAgICAgICAgIChkaW1zLmhlaWdodCAvIDIpIC0gcmFkaXVzKSk7XG5cbiAgICB2YXIgYXJjID0gZDMuc3ZnLmFyYygpXG4gICAgICAuaW5uZXJSYWRpdXModGhpcy53aWRnZXQoKS5pbm5lclJhZGl1cygpKHJhZGl1cykpXG4gICAgICAub3V0ZXJSYWRpdXMocmFkaXVzKTtcblxuICAgIHZhciBsYXlvdXQgPSBkMy5sYXlvdXQucGllKClcbiAgICAgIC52YWx1ZShmdW5jdGlvbihkKSB7IHJldHVybiBkLnZhbHVlOyB9KTtcblxuICAgIHZhciBzbGljZSA9IHN2Zy5zZWxlY3RBbGwoJy5zbGljZScpXG4gICAgICAuZGF0YShmdW5jdGlvbihkKSB7IHJldHVybiBsYXlvdXQoZC5tZXRyaWNzKTsgfSxcbiAgICAgICAgICAgIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQuZGF0YS5rZXk7IH0pO1xuXG4gICAgc2xpY2UuZW50ZXIoKS5hcHBlbmQoJ2cnKVxuICAgICAgLmF0dHIoJ2NsYXNzJywgJ3NsaWNlJylcbiAgICAgIC5hcHBlbmQoJ3BhdGgnKTtcblxuICAgIHNsaWNlXG4gICAgICAuYXR0cigndHJhbnNmb3JtJywgdXRpbHMudHJhbnNsYXRlKHJhZGl1cywgcmFkaXVzKSk7XG5cbiAgICBzbGljZS5zZWxlY3QoJ3BhdGgnKVxuICAgICAgLmF0dHIoJ2QnLCBhcmMpXG4gICAgICAuc3R5bGUoJ2ZpbGwnLCBmdW5jdGlvbihkKSB7IHJldHVybiBkLmRhdGEuY29sb3I7IH0pO1xuXG4gICAgc2xpY2UuZXhpdCgpXG4gICAgICAucmVtb3ZlKCk7XG4gIH0pO1xuXG5cbnZhciBsZWdlbmQgPSByZXF1aXJlKCcuLi92aWV3JykuZXh0ZW5kKClcbiAgLnByb3AoJ3dpZGdldCcpXG5cbiAgLmluaXQoZnVuY3Rpb24od2lkZ2V0KSB7XG4gICAgdGhpcy53aWRnZXQod2lkZ2V0KTtcbiAgfSlcblxuICAuZW50ZXIoZnVuY3Rpb24oZWwpIHtcbiAgICBlbC5hcHBlbmQoJ3RhYmxlJylcbiAgICAgIC5hdHRyKCdjbGFzcycsICd0YWJsZScpO1xuICB9KVxuXG4gIC5kcmF3KGZ1bmN0aW9uKGVsKSB7XG4gICAgdmFyIHZhbHVlRm9ybWF0ID0gdGhpcy53aWRnZXQoKS52YWx1ZUZvcm1hdCgpO1xuICAgIHZhciBwZXJjZW50Rm9ybWF0ID0gdGhpcy53aWRnZXQoKS5wZXJjZW50Rm9ybWF0KCk7XG5cbiAgICB2YXIgbWV0cmljID0gZWwuc2VsZWN0KCcudGFibGUnKS5zZWxlY3RBbGwoJy5tZXRyaWMnKVxuICAgICAgLmRhdGEoZnVuY3Rpb24oZCkgeyByZXR1cm4gZC5tZXRyaWNzOyB9LFxuICAgICAgICAgICAgZnVuY3Rpb24oZCkgeyByZXR1cm4gZC5rZXk7IH0pO1xuXG4gICAgdmFyIGVudGVyTWV0cmljID0gbWV0cmljLmVudGVyKCkuYXBwZW5kKCd0cicpXG4gICAgICAuYXR0cignY2xhc3MnLCAnbWV0cmljJyk7XG5cbiAgICBlbnRlck1ldHJpYy5hcHBlbmQoJ3RkJylcbiAgICAgIC5hdHRyKCdjbGFzcycsICdzd2F0Y2gnKTtcblxuICAgIGVudGVyTWV0cmljLmFwcGVuZCgndGQnKVxuICAgICAgLmF0dHIoJ2NsYXNzJywgJ3RpdGxlJyk7XG5cbiAgICBlbnRlck1ldHJpYy5hcHBlbmQoJ3RkJylcbiAgICAgIC5hdHRyKCdjbGFzcycsICdwZXJjZW50Jyk7XG5cbiAgICBlbnRlck1ldHJpYy5hcHBlbmQoJ3RkJylcbiAgICAgIC5hdHRyKCdjbGFzcycsICd2YWx1ZScpO1xuXG4gICAgbWV0cmljLnNlbGVjdCgnLnN3YXRjaCcpXG4gICAgICAuc3R5bGUoJ2JhY2tncm91bmQnLCBmdW5jdGlvbihkKSB7IHJldHVybiBkLmNvbG9yOyB9KTtcblxuICAgIG1ldHJpYy5zZWxlY3QoJy50aXRsZScpXG4gICAgICAudGV4dChmdW5jdGlvbihkKSB7IHJldHVybiBkLnRpdGxlOyB9KTtcblxuICAgIG1ldHJpYy5zZWxlY3QoJy5wZXJjZW50JylcbiAgICAgIC50ZXh0KGZ1bmN0aW9uKGQpIHsgcmV0dXJuIHBlcmNlbnRGb3JtYXQoZC5wZXJjZW50KTsgfSk7XG5cbiAgICBtZXRyaWMuc2VsZWN0KCcudmFsdWUnKVxuICAgICAgLnRleHQoZnVuY3Rpb24oZCkgeyByZXR1cm4gdmFsdWVGb3JtYXQoZC52YWx1ZSk7IH0pO1xuXG4gICAgbWV0cmljLmV4aXQoKVxuICAgICAgLnJlbW92ZSgpO1xuICB9KTtcbiIsIm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSgnLi4vdmlldycpLmV4dGVuZCgpXG4gIC5wcm9wKCdjb2xzcGFuJylcbiAgLmRlZmF1bHQoMClcblxuICAucHJvcCgncm93c3BhbicpXG4gIC5kZWZhdWx0KDApXG5cbiAgLnByb3AoJ3dpZHRoJylcbiAgLnNldChkMy5mdW5jdG9yKVxuICAuZGVmYXVsdCgwKVxuXG4gIC5wcm9wKCdoZWlnaHQnKVxuICAuc2V0KGQzLmZ1bmN0b3IpXG4gIC5kZWZhdWx0KDApO1xuIl19
(3)
});
