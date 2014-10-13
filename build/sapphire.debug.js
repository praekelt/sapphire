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

    var fy = d3.scale.linear()
      .domain([0, d3.max(chart.datum(), function(d) { return d.y; })]);

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
      .tickFormat(this.widget().xTickFormat())
      .tickSize(-dims.innerHeight);

    svg.select('.x.axis')
      .attr('transform', utils.translate(0, dims.innerHeight))
      .call(axis);

    axis = d3.svg.axis()
      .orient('left')
      .scale(fy)
      .tickPadding(8)
      .ticks(this.widget().yTicks())
      .tickFormat(this.widget().yTickFormat())
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9ob21lL2p1c3Rpbi9wcmFla2VsdC9zYXBwaGlyZS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiL2hvbWUvanVzdGluL3ByYWVrZWx0L3NhcHBoaXJlL3NyYy9zY3JpcHRzL2Rhc2hib2FyZC5qcyIsIi9ob21lL2p1c3Rpbi9wcmFla2VsdC9zYXBwaGlyZS9zcmMvc2NyaXB0cy9ncmlkLmpzIiwiL2hvbWUvanVzdGluL3ByYWVrZWx0L3NhcHBoaXJlL3NyYy9zY3JpcHRzL2luZGV4LmpzIiwiL2hvbWUvanVzdGluL3ByYWVrZWx0L3NhcHBoaXJlL3NyYy9zY3JpcHRzL3V0aWxzLmpzIiwiL2hvbWUvanVzdGluL3ByYWVrZWx0L3NhcHBoaXJlL3NyYy9zY3JpcHRzL3ZpZXcuanMiLCIvaG9tZS9qdXN0aW4vcHJhZWtlbHQvc2FwcGhpcmUvc3JjL3NjcmlwdHMvd2lkZ2V0cy9iYXJzLmpzIiwiL2hvbWUvanVzdGluL3ByYWVrZWx0L3NhcHBoaXJlL3NyYy9zY3JpcHRzL3dpZGdldHMvaW5kZXguanMiLCIvaG9tZS9qdXN0aW4vcHJhZWtlbHQvc2FwcGhpcmUvc3JjL3NjcmlwdHMvd2lkZ2V0cy9sYXN0LmpzIiwiL2hvbWUvanVzdGluL3ByYWVrZWx0L3NhcHBoaXJlL3NyYy9zY3JpcHRzL3dpZGdldHMvbGluZXMuanMiLCIvaG9tZS9qdXN0aW4vcHJhZWtlbHQvc2FwcGhpcmUvc3JjL3NjcmlwdHMvd2lkZ2V0cy9waWUuanMiLCIvaG9tZS9qdXN0aW4vcHJhZWtlbHQvc2FwcGhpcmUvc3JjL3NjcmlwdHMvd2lkZ2V0cy93aWRnZXQuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4UEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvVEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKX12YXIgZj1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwoZi5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxmLGYuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwidmFyIHV0aWxzID0gcmVxdWlyZSgnLi91dGlscycpO1xudmFyIGxheW91dCA9IHJlcXVpcmUoJy4vZ3JpZCcpO1xudmFyIHdpZGdldHMgPSByZXF1aXJlKCcuL3dpZGdldHMnKTtcblxuXG5tb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoJy4vdmlldycpLmV4dGVuZCgpXG4gIC5wcm9wKCdzY2FsZScpXG4gIC5kZWZhdWx0KDEwMClcblxuICAucHJvcCgndHlwZXMnKVxuXG4gIC5wcm9wKCd0aXRsZScpXG4gIC5zZXQoZDMuZnVuY3RvcilcbiAgLmRlZmF1bHQoZnVuY3Rpb24oZCkgeyByZXR1cm4gZC50aXRsZTsgfSlcblxuICAucHJvcCgna2V5JylcbiAgLnNldChkMy5mdW5jdG9yKVxuICAuZGVmYXVsdChmdW5jdGlvbihkLCBpKSB7IHJldHVybiBpOyB9KVxuXG4gIC5wcm9wKCd0eXBlJylcbiAgLnNldChkMy5mdW5jdG9yKVxuICAuZGVmYXVsdChmdW5jdGlvbihkKSB7IHJldHVybiBkLnR5cGU7IH0pXG5cbiAgLnByb3AoJ3dpZGdldHMnKVxuICAuc2V0KGQzLmZ1bmN0b3IpXG4gIC5kZWZhdWx0KGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQud2lkZ2V0czsgfSlcblxuICAucHJvcCgnY29sJylcbiAgLnNldChkMy5mdW5jdG9yKVxuICAuZGVmYXVsdChmdW5jdGlvbihkKSB7XG4gICAgcmV0dXJuIHV0aWxzLmFjY2VzcyhkLCAnY29sJyk7XG4gIH0pXG5cbiAgLnByb3AoJ3JvdycpXG4gIC5zZXQoZDMuZnVuY3RvcilcbiAgLmRlZmF1bHQoZnVuY3Rpb24oZCkge1xuICAgIHJldHVybiB1dGlscy5hY2Nlc3MoZCwgJ3JvdycpO1xuICB9KVxuXG4gIC5wcm9wKCdjb2xzcGFuJylcbiAgLnNldChkMy5mdW5jdG9yKVxuICAuZGVmYXVsdChmdW5jdGlvbihkKSB7XG4gICAgcmV0dXJuIHV0aWxzLmFjY2VzcyhkLCAnY29sc3BhbicpO1xuICB9KVxuXG4gIC5wcm9wKCdyb3dzcGFuJylcbiAgLnNldChkMy5mdW5jdG9yKVxuICAuZGVmYXVsdChmdW5jdGlvbihkKSB7XG4gICAgcmV0dXJuIHV0aWxzLmFjY2VzcyhkLCAncm93c3BhbicpO1xuICB9KVxuXG4gIC5wcm9wKCdudW1jb2xzJylcbiAgLmRlZmF1bHQoOClcblxuICAucHJvcCgncGFkZGluZycpXG4gIC5kZWZhdWx0KDUpXG5cbiAgLmluaXQoZnVuY3Rpb24oKSB7XG4gICAgdmFyIHR5cGVzID0gZDMubWFwKCk7XG5cbiAgICBkMy5rZXlzKHdpZGdldHMpLmZvckVhY2goZnVuY3Rpb24oaykge1xuICAgICAgdHlwZXMuc2V0KGssIHdpZGdldHNba10ubmV3KCkpO1xuICAgIH0pO1xuXG4gICAgdGhpcy50eXBlcyh0eXBlcyk7XG4gIH0pXG5cbiAgLmVudGVyKGZ1bmN0aW9uKGVsKSB7XG4gICAgZWwuYXR0cignY2xhc3MnLCAnZGFzaGJvYXJkJylcbiAgICAgIC5hcHBlbmQoJ2RpdicpXG4gICAgICAgIC5hdHRyKCdjbGFzcycsICd3aWRnZXRzJyk7XG4gIH0pXG5cbiAgLm1ldGgoJ25vcm1hbGl6ZScsIGZ1bmN0aW9uKGVsKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIHZhciBub2RlID0gZWwubm9kZSgpO1xuXG4gICAgZWwuZGF0dW0oZnVuY3Rpb24oZCwgaSkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgdGl0bGU6IHNlbGYudGl0bGUoKVxuICAgICAgICAgIC5jYWxsKG5vZGUsIGQsIGkpLFxuICAgICAgICB3aWRnZXRzOiBzZWxmLndpZGdldHMoKVxuICAgICAgICAgIC5jYWxsKG5vZGUsIGQsIGkpXG4gICAgICAgICAgLm1hcCh3aWRnZXREYXR1bSlcbiAgICAgIH07XG4gICAgfSk7XG5cbiAgICBmdW5jdGlvbiB3aWRnZXREYXR1bShkLCBpKSB7XG4gICAgICB2YXIgdHlwZW5hbWUgPSBzZWxmLnR5cGUoKS5jYWxsKG5vZGUsIGQsIGkpO1xuICAgICAgdmFyIHR5cGUgPSBzZWxmLnR5cGVzKCkuZ2V0KHR5cGVuYW1lKTtcblxuICAgICAgaWYgKCF0eXBlKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIlVucmVjb2duaXNlZCBkYXNoYm9hcmQgd2lkZ2V0IHR5cGUgJ1wiICsgdHlwZW5hbWUgKyBcIidcIik7XG4gICAgICB9XG5cbiAgICAgIHZhciBjb2xzcGFuID0gc2VsZi5jb2xzcGFuKCkuY2FsbChub2RlLCBkLCBpKTtcbiAgICAgIGNvbHNwYW4gPSB1dGlscy5lbnN1cmUoY29sc3BhbiwgdHlwZS5jb2xzcGFuKCkpO1xuICAgICAgdmFyIHJvd3NwYW4gPSBzZWxmLnJvd3NwYW4oKS5jYWxsKG5vZGUsIGQsIGkpO1xuICAgICAgcm93c3BhbiA9IHV0aWxzLmVuc3VyZShyb3dzcGFuLCB0eXBlLnJvd3NwYW4oKSk7XG5cbiAgICAgIHJldHVybiB7XG4gICAgICAgIGRhdGE6IGQsXG4gICAgICAgIHR5cGU6IHR5cGUsXG4gICAgICAgIGNvbHNwYW46IGNvbHNwYW4sXG4gICAgICAgIHJvd3NwYW46IHJvd3NwYW4sXG4gICAgICAgIGtleTogc2VsZi5rZXkoKS5jYWxsKG5vZGUsIGQsIGkpLFxuICAgICAgICBjb2w6IHNlbGYuY29sKCkuY2FsbChub2RlLCBkLCBpKSxcbiAgICAgICAgcm93OiBzZWxmLnJvdygpLmNhbGwobm9kZSwgZCwgaSlcbiAgICAgIH07XG4gICAgfVxuICB9KVxuXG4gIC5kcmF3KGZ1bmN0aW9uKGVsKSB7XG4gICAgdGhpcy5ub3JtYWxpemUoZWwpO1xuICAgIHZhciB3aWRnZXREYXRhID0gZWwuZGF0dW0oKS53aWRnZXRzO1xuXG4gICAgdGhpcy50eXBlcygpXG4gICAgICAuZm9yRWFjaChmdW5jdGlvbihuYW1lLCB0eXBlKSB7XG4gICAgICAgIHR5cGUud2lkdGgod2lkZ2V0V2lkdGgpO1xuICAgICAgICB0eXBlLmhlaWdodCh3aWRnZXRIZWlnaHQpO1xuICAgICAgfSk7XG5cbiAgICB2YXIgZ3JpZCA9IGxheW91dCgpXG4gICAgICAuc2NhbGUodGhpcy5zY2FsZSgpKVxuICAgICAgLm51bWNvbHModGhpcy5udW1jb2xzKCkpXG4gICAgICAucGFkZGluZyh0aGlzLnBhZGRpbmcoKSlcbiAgICAgIC5jb2woZnVuY3Rpb24oZCkgeyByZXR1cm4gZC5jb2w7IH0pXG4gICAgICAucm93KGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQucm93OyB9KVxuICAgICAgLmNvbHNwYW4oZnVuY3Rpb24oZCkgeyByZXR1cm4gZC5jb2xzcGFuOyB9KVxuICAgICAgLnJvd3NwYW4oZnVuY3Rpb24oZCkgeyByZXR1cm4gZC5yb3dzcGFuOyB9KTtcbiAgICBcbiAgICBlbC5zdHlsZSgnd2lkdGgnLCB1dGlscy5weChncmlkLnNjYWxlKCkgKiBncmlkLm51bWNvbHMoKSkpO1xuXG4gICAgdmFyIHdpZGdldCA9IGVsLnNlbGVjdCgnLndpZGdldHMnKS5zZWxlY3RBbGwoJy53aWRnZXQnKVxuICAgICAgLmRhdGEod2lkZ2V0RGF0YSwgZnVuY3Rpb24oZCkgeyByZXR1cm4gZC5rZXk7IH0pO1xuXG4gICAgd2lkZ2V0LmVudGVyKCkuYXBwZW5kKCdkaXYnKTtcbiAgICB1dGlscy5tZXRhKHdpZGdldCwgZnVuY3Rpb24oZCkgeyByZXR1cm4gZDsgfSk7XG5cbiAgICB3aWRnZXRcbiAgICAgIC5jbGFzc2VkKCd3aWRnZXQnLCB0cnVlKVxuICAgICAgLmVhY2goZnVuY3Rpb24oZCkge1xuICAgICAgICB2YXIgd2lkZ2V0RWwgPSBkMy5zZWxlY3QodGhpcylcbiAgICAgICAgICAuZGF0dW0oZC5kYXRhKVxuICAgICAgICAgIC5jYWxsKGQudHlwZSk7XG5cbiAgICAgICAgdmFyIHdpZHRoID0gcGFyc2VJbnQod2lkZ2V0RWwuc3R5bGUoJ3dpZHRoJykpO1xuICAgICAgICBkLmNvbHNwYW4gPSBNYXRoLm1heChkLmNvbHNwYW4sIGdyaWQubGVuZ3RoU3Bhbih3aWR0aCkpO1xuXG4gICAgICAgIHZhciBoZWlnaHQgPSBwYXJzZUludCh3aWRnZXRFbC5zdHlsZSgnaGVpZ2h0JykpO1xuICAgICAgICBkLnJvd3NwYW4gPSBNYXRoLm1heChkLnJvd3NwYW4sIGdyaWQubGVuZ3RoU3BhbihoZWlnaHQpKTtcbiAgICAgIH0pO1xuXG4gICAgdmFyIGdyaWRFbHMgPSBncmlkKHdpZGdldERhdGEpO1xuXG4gICAgd2lkZ2V0XG4gICAgICAuc3R5bGUoJ2xlZnQnLCB1dGlscy5weChmdW5jdGlvbihkLCBpKSB7IHJldHVybiBncmlkRWxzW2ldLng7IH0pKVxuICAgICAgLnN0eWxlKCd0b3AnLCB1dGlscy5weChmdW5jdGlvbihkLCBpKSB7IHJldHVybiBncmlkRWxzW2ldLnk7IH0pKTtcblxuICAgIHdpZGdldC5leGl0KCkucmVtb3ZlKCk7XG5cbiAgICBmdW5jdGlvbiB3aWRnZXRXaWR0aCgpIHtcbiAgICAgIHJldHVybiBncmlkLnNwYW5MZW5ndGgodXRpbHMubWV0YSh0aGlzKS5jb2xzcGFuKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiB3aWRnZXRIZWlnaHQoKSB7XG4gICAgICByZXR1cm4gZ3JpZC5zcGFuTGVuZ3RoKHV0aWxzLm1ldGEodGhpcykucm93c3Bhbik7XG4gICAgfVxuICB9KTtcbiIsInZhciB1dGlscyA9IHJlcXVpcmUoJy4vdXRpbHMnKTtcblxuXG52YXIgZ3JpZCA9IG1vZHVsZS5leHBvcnRzID0gc3RyYWluKClcbiAgLnByb3AoJ2NvbCcpXG4gIC5zZXQoZDMuZnVuY3RvcilcbiAgLmRlZmF1bHQoZnVuY3Rpb24oZCkge1xuICAgIHJldHVybiB1dGlscy5hY2Nlc3MoZCwgJ2NvbCcpO1xuICB9KVxuXG4gIC5wcm9wKCdyb3cnKVxuICAuc2V0KGQzLmZ1bmN0b3IpXG4gIC5kZWZhdWx0KGZ1bmN0aW9uKGQpIHtcbiAgICByZXR1cm4gdXRpbHMuYWNjZXNzKGQsICdyb3cnKTtcbiAgfSlcblxuICAucHJvcCgnbnVtY29scycpXG4gIC5kZWZhdWx0KDgpXG5cbiAgLnByb3AoJ3NjYWxlJylcbiAgLmRlZmF1bHQoMTApXG5cbiAgLnByb3AoJ3BhZGRpbmcnKVxuICAuZGVmYXVsdCg1KVxuXG4gIC5wcm9wKCdjb2xzcGFuJylcbiAgLnNldChkMy5mdW5jdG9yKVxuICAuZGVmYXVsdChmdW5jdGlvbihkKSB7XG4gICAgcmV0dXJuIHV0aWxzLmFjY2VzcyhkLCAnY29sc3BhbicsIDEpO1xuICB9KVxuXG4gIC5wcm9wKCdyb3dzcGFuJylcbiAgLnNldChkMy5mdW5jdG9yKVxuICAuZGVmYXVsdChmdW5jdGlvbihkKSB7XG4gICAgcmV0dXJuIHV0aWxzLmFjY2VzcyhkLCAncm93c3BhbicsIDEpO1xuICB9KVxuXG4gIC5pbnZva2UoZnVuY3Rpb24oZGF0YSkge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICB2YXIgYmVzdCA9IGNvdW50ZXIoKS5udW1jb2xzKHRoaXMubnVtY29scygpKTtcblxuICAgIGRhdGEgPSAoZGF0YSB8fCBbXSlcbiAgICAgIC5tYXAoZnVuY3Rpb24oZCwgaSkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIGRhdGE6IGQsXG4gICAgICAgICAgY29sOiBzZWxmLmNvbCgpLmNhbGwoc2VsZiwgZCwgaSksIFxuICAgICAgICAgIHJvdzogc2VsZi5yb3coKS5jYWxsKHNlbGYsIGQsIGkpLFxuICAgICAgICAgIHJvd3NwYW46IHNlbGYucm93c3BhbigpLmNhbGwoc2VsZiwgZCwgaSksXG4gICAgICAgICAgY29sc3Bhbjogc2VsZi5jb2xzcGFuKCkuY2FsbChzZWxmLCBkLCBpKVxuICAgICAgICB9O1xuICAgICAgfSlcbiAgICAgIC5tYXAoYmVzdCk7XG5cbiAgICB2YXIgcXVhZHRyZWUgPSBkMy5nZW9tLnF1YWR0cmVlKClcbiAgICAgIC54KGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQuY29sOyB9KVxuICAgICAgLnkoZnVuY3Rpb24oZCkgeyByZXR1cm4gZC5yb3c7IH0pO1xuXG4gICAgdmFyIHJvb3QgPSBxdWFkdHJlZShkYXRhKTtcblxuICAgIGRhdGEuZm9yRWFjaChmdW5jdGlvbihkKSB7XG4gICAgICByb290LnZpc2l0KGdyaWQudW5jb2xsaWRlKGQpKTtcbiAgICAgIGQueCA9IHNlbGYuaW5kZXhPZmZzZXQoZC5jb2wpO1xuICAgICAgZC55ID0gc2VsZi5pbmRleE9mZnNldChkLnJvdyk7XG4gICAgICBkLndpZHRoID0gc2VsZi5zcGFuTGVuZ3RoKGQuY29sc3Bhbik7XG4gICAgICBkLmhlaWdodCA9IHNlbGYuc3Bhbkxlbmd0aChkLnJvd3NwYW4pO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIGRhdGE7XG4gIH0pXG5cbiAgLm1ldGgoJ2luZGV4T2Zmc2V0JywgZnVuY3Rpb24oaW5kZXgpIHtcbiAgICByZXR1cm4gKGluZGV4ICogdGhpcy5zY2FsZSgpKSArIHRoaXMucGFkZGluZygpO1xuICB9KVxuXG4gIC5tZXRoKCdzcGFuTGVuZ3RoJywgZnVuY3Rpb24oc3Bhbikge1xuICAgIHJldHVybiAoc3BhbiAqIHRoaXMuc2NhbGUoKSkgLSAodGhpcy5wYWRkaW5nKCkgKiAyKTtcbiAgfSlcblxuICAubWV0aCgnb2Zmc2V0SW5kZXgnLCBmdW5jdGlvbihvZmZzZXQpIHtcbiAgICByZXR1cm4gTWF0aC5jZWlsKChvZmZzZXQgLSB0aGlzLnBhZGRpbmcoKSkgLyB0aGlzLnNjYWxlKCkpO1xuICB9KVxuXG4gIC5tZXRoKCdsZW5ndGhTcGFuJywgZnVuY3Rpb24obGVuKSB7XG4gICAgcmV0dXJuIE1hdGguY2VpbCgobGVuICsgKHRoaXMucGFkZGluZygpICogMikpIC8gdGhpcy5zY2FsZSgpKTtcbiAgfSlcblxuICAuc3RhdGljKCdib3gnLCBmdW5jdGlvbihkKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHgxOiBkLmNvbCxcbiAgICAgIHgyOiBkLmNvbCArIGQuY29sc3BhbiAtIDEsXG4gICAgICB5MTogZC5yb3csXG4gICAgICB5MjogZC5yb3cgKyBkLnJvd3NwYW4gLSAxXG4gICAgfTtcbiAgfSlcblxuICAuc3RhdGljKCd1bmNvbGxpZGUnLCBmdW5jdGlvbihhKSB7XG4gICAgdmFyIGJveEEgPSBncmlkLmJveChhKTtcbiAgICBcbiAgICByZXR1cm4gZnVuY3Rpb24obm9kZSwgeDEsIHkxLCB4MiwgeTIpIHtcbiAgICAgIHZhciBiID0gbm9kZS5wb2ludDtcblxuICAgICAgaWYgKGIgJiYgYSAhPT0gYiAmJiBncmlkLmludGVyc2VjdGlvbihib3hBLCBncmlkLmJveChiKSkpIHtcbiAgICAgICAgYi5yb3cgPSBib3hBLnkyICsgMTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuICFncmlkLmludGVyc2VjdGlvbihib3hBLCB7XG4gICAgICAgIHgxOiB4MSwgXG4gICAgICAgIHkxOiB5MSwgXG4gICAgICAgIHgyOiB4MixcbiAgICAgICAgeTI6IHkyXG4gICAgICB9KTtcbiAgICB9O1xuICB9KVxuXG4gIC5zdGF0aWMoJ2ludGVyc2VjdGlvbicsIGZ1bmN0aW9uKGEsIGIpIHtcbiAgICByZXR1cm4gKChhLngxIDw9IGIueDEgJiYgYi54MSA8PSBhLngyKSAmJiAoYS55MSA8PSBiLnkxICYmIGIueTEgPD0gYS55MikpXG4gICAgICAgIHx8ICgoYi54MSA8PSBhLngxICYmIGEueDEgPD0gYi54MikgJiYgKGIueTEgPD0gYS55MSAmJiBhLnkxIDw9IGIueTIpKVxuICAgICAgICB8fCAoKGEueDEgPD0gYi54MiAmJiBiLngyIDw9IGEueDIpICYmIChhLnkxIDw9IGIueTEgJiYgYi55MSA8PSBhLnkyKSlcbiAgICAgICAgfHwgKChiLngxIDw9IGEueDIgJiYgYS54MiA8PSBiLngyKSAmJiAoYi55MSA8PSBhLnkxICYmIGEueTEgPD0gYi55MikpO1xuICB9KTtcblxuXG52YXIgY291bnRlciA9IHN0cmFpbigpXG4gIC5wcm9wKCdudW1jb2xzJylcblxuICAucHJvcCgncm93c3BhbicpXG4gIC5kZWZhdWx0KDApXG5cbiAgLnByb3AoJ2NvbCcpXG4gIC5kZWZhdWx0KDApXG5cbiAgLnByb3AoJ3JvdycpXG4gIC5kZWZhdWx0KDApXG5cbiAgLmludm9rZShmdW5jdGlvbihkKSB7XG4gICAgZC5jb2wgPSB1dGlscy5lbnN1cmUoZC5jb2wsIHRoaXMuY29sKCkpO1xuICAgIGQucm93ID0gdXRpbHMuZW5zdXJlKGQucm93LCB0aGlzLnJvdygpKTtcblxuICAgIGlmIChkLmNvbCArIGQuY29sc3BhbiA+IHRoaXMubnVtY29scygpKSB7XG4gICAgICBkLmNvbCA9IDA7XG4gICAgICBkLnJvdyArPSB0aGlzLnJvd3NwYW4oKTtcbiAgICAgIHRoaXMucm93c3BhbigwKTtcbiAgICB9XG5cbiAgICB0aGlzXG4gICAgICAuY29sKGQuY29sICsgZC5jb2xzcGFuKVxuICAgICAgLnJvdyhkLnJvdylcbiAgICAgIC5yb3dzcGFuKE1hdGgubWF4KHRoaXMucm93c3BhbigpLCBkLnJvd3NwYW4pKTtcblxuICAgIHJldHVybiBkO1xuICB9KTtcbiIsImV4cG9ydHMudXRpbHMgPSByZXF1aXJlKCcuL3V0aWxzJyk7XG5leHBvcnRzLnZpZXcgPSByZXF1aXJlKCcuL3ZpZXcnKTtcbmV4cG9ydHMuZ3JpZCA9IHJlcXVpcmUoJy4vZ3JpZCcpO1xuZXhwb3J0cy53aWRnZXRzID0gcmVxdWlyZSgnLi93aWRnZXRzJyk7XG5leHBvcnRzLmRhc2hib2FyZCA9IHJlcXVpcmUoJy4vZGFzaGJvYXJkJyk7XG4iLCJ2YXIgdXRpbHMgPSBleHBvcnRzO1xuXG5cbnV0aWxzLmFjY2VzcyA9IGZ1bmN0aW9uKGQsIG5hbWUsIGRlZmF1bHR2YWwpIHtcbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPCAzKSB7XG4gICAgZGVmYXVsdHZhbCA9IG51bGw7XG4gIH1cblxuICBpZiAodHlwZW9mIGQgIT0gJ29iamVjdCcpIHtcbiAgICByZXR1cm4gZGVmYXVsdHZhbDtcbiAgfVxuXG4gIHZhciB2YWwgPSBkW25hbWVdO1xuICByZXR1cm4gdHlwZW9mIHZhbCA9PSAndW5kZWZpbmVkJ1xuICAgID8gZGVmYXVsdHZhbFxuICAgIDogdmFsO1xufTtcblxuXG51dGlscy5lbnN1cmUgPSBmdW5jdGlvbih2LCBkZWZhdWx0dmFsKSB7XG4gIHJldHVybiB2ID09PSBudWxsIHx8IHR5cGVvZiB2ID09ICd1bmRlZmluZWQnXG4gICAgPyBkZWZhdWx0dmFsXG4gICAgOiB2O1xufTtcblxuXG51dGlscy50cmFuc2xhdGUgPSBmdW5jdGlvbih4LCB5KSB7XG4gIHJldHVybiAndHJhbnNsYXRlKCcgKyB4ICsgJywgJyArIHkgKyAnKSc7XG59O1xuXG5cbnV0aWxzLmVuc3VyZUVsID0gZnVuY3Rpb24oZWwpIHtcbiAgcmV0dXJuICEoZWwgaW5zdGFuY2VvZiBkMy5zZWxlY3Rpb24pXG4gICAgPyBkMy5zZWxlY3QoZWwpXG4gICAgOiBlbDtcbn07XG5cblxudXRpbHMuZGF0ZSA9IGZ1bmN0aW9uKHQpIHtcbiAgcmV0dXJuIG5ldyBEYXRlKHQpO1xufTtcblxuXG51dGlscy5weCA9IGZ1bmN0aW9uKGZuKSB7XG4gIGZuID0gZDMuZnVuY3Rvcihmbik7XG5cbiAgcmV0dXJuIGZ1bmN0aW9uKGQsIGkpIHtcbiAgICByZXR1cm4gZm4uY2FsbCh0aGlzLCBkLCBpKSArICdweCc7XG4gIH07XG59O1xuXG5cbnV0aWxzLm1ldGEgPSBmdW5jdGlvbihlbCwgZm4pIHtcbiAgZWwgPSB1dGlscy5lbnN1cmVFbChlbCk7XG5cbiAgcmV0dXJuIGFyZ3VtZW50cy5sZW5ndGggPiAxXG4gICAgPyBlbC5wcm9wZXJ0eSgnX19zYXBwaGlyZV9tZXRhX18nLCBmbilcbiAgICA6IGVsLnByb3BlcnR5KCdfX3NhcHBoaXJlX21ldGFfXycpO1xufTtcblxuXG51dGlscy5ib3ggPSBzdHJhaW4oKVxuICAucHJvcCgnd2lkdGgnKVxuICAuZGVmYXVsdCgwKVxuXG4gIC5wcm9wKCdoZWlnaHQnKVxuICAuZGVmYXVsdCgwKVxuXG4gIC5wcm9wKCdtYXJnaW4nKVxuICAuZGVmYXVsdCh7XG4gICAgdG9wOiAwLFxuICAgIGxlZnQ6IDAsXG4gICAgcmlnaHQ6IDAsXG4gICAgYm90dG9tOiAwXG4gIH0pXG5cbiAgLm1ldGgoJ2NhbGMnLCBmdW5jdGlvbigpIHtcbiAgICB2YXIgZCA9IHt9O1xuICAgIGQubWFyZ2luID0gdGhpcy5tYXJnaW4oKTtcbiAgICBkLndpZHRoID0gdGhpcy53aWR0aCgpO1xuICAgIGQuaGVpZ2h0ID0gdGhpcy5oZWlnaHQoKTtcbiAgICBkLmlubmVyV2lkdGggPSBkLndpZHRoIC0gZC5tYXJnaW4ubGVmdCAtIGQubWFyZ2luLnJpZ2h0O1xuICAgIGQuaW5uZXJIZWlnaHQgPSBkLmhlaWdodCAtIGQubWFyZ2luLnRvcCAtIGQubWFyZ2luLmJvdHRvbTtcbiAgICByZXR1cm4gZDtcbiAgfSlcblxuICAuaW52b2tlKGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLmNhbGMoKTtcbiAgfSk7XG5cblxudXRpbHMuaW5uZXJXaWR0aCA9IGZ1bmN0aW9uKGVsKSB7XG4gIHJldHVybiB1dGlscy5tZWFzdXJlKGVsLCAnd2lkdGgnKVxuICAgICAgIC0gdXRpbHMubWVhc3VyZShlbCwgJ3BhZGRpbmctbGVmdCcpXG4gICAgICAgLSB1dGlscy5tZWFzdXJlKGVsLCAncGFkZGluZy1yaWdodCcpO1xufTtcblxuXG51dGlscy5pbm5lckhlaWdodCA9IGZ1bmN0aW9uKGVsKSB7XG4gIHJldHVybiB1dGlscy5tZWFzdXJlKGVsLCAnaGVpZ2h0JylcbiAgICAgICAtIHV0aWxzLm1lYXN1cmUoZWwsICdwYWRkaW5nLXRvcCcpXG4gICAgICAgLSB1dGlscy5tZWFzdXJlKGVsLCAncGFkZGluZy1ib3R0b20nKTtcbn07XG5cblxudXRpbHMubWVhc3VyZSA9IGZ1bmN0aW9uKGVsLCBuYW1lKSB7XG4gIGVsID0gdXRpbHMuZW5zdXJlRWwoZWwpO1xuICByZXR1cm4gcGFyc2VJbnQoZWwuc3R5bGUobmFtZSkpO1xufTtcbiIsIm1vZHVsZS5leHBvcnRzID0gc3RyYWluKClcbiAgLnN0YXRpYygnZHJhdycsIGZ1bmN0aW9uKGZuKSB7XG4gICAgdGhpcy5tZXRoKCdfZHJhd18nLCBmbik7XG4gIH0pXG4gIC5kcmF3KGZ1bmN0aW9uKCkge30pXG5cbiAgLnN0YXRpYygnZW50ZXInLCBmdW5jdGlvbihmbikge1xuICAgIHRoaXMubWV0aCgnX2VudGVyXycsIGZuKTtcbiAgfSlcbiAgLmVudGVyKGZ1bmN0aW9uKCkge30pXG5cbiAgLm1ldGgoJ2RyYXcnLCBmdW5jdGlvbihlbCkge1xuICAgIHZhciBkYXR1bTtcbiAgICBlbCA9IHNhcHBoaXJlLnV0aWxzLmVuc3VyZUVsKGVsKTtcblxuICAgIGlmIChlbC5ub2RlKCkpIHtcbiAgICAgIGRhdHVtID0gZWwuZGF0dW0oKTtcbiAgICB9XG5cbiAgICBpZiAoZWwubm9kZSgpICYmICFlbC5ub2RlKCkuaGFzQ2hpbGROb2RlcygpKSB7XG4gICAgICB0aGlzLmVudGVyLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfVxuXG4gICAgdmFyIHBhcmVudCA9IHRoaXMuX3R5cGVfLl9zdXBlcl8ucHJvdG90eXBlO1xuICAgIGlmICgnX2RyYXdfJyBpbiBwYXJlbnQpIHtcbiAgICAgIHBhcmVudC5fZHJhd18uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9XG5cbiAgICB0aGlzLl9kcmF3Xy5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuXG4gICAgaWYgKHR5cGVvZiBkYXR1bSAhPSAndW5kZWZpbmVkJykge1xuICAgICAgZWwuZGF0dW0oZGF0dW0pO1xuICAgIH1cbiAgfSlcblxuICAubWV0aCgnZW50ZXInLCBmdW5jdGlvbihlbCkge1xuICAgIGVsID0gc2FwcGhpcmUudXRpbHMuZW5zdXJlRWwoZWwpO1xuXG4gICAgdmFyIHBhcmVudCA9IHRoaXMuX3R5cGVfLl9zdXBlcl8ucHJvdG90eXBlO1xuICAgIGlmICgnX2VudGVyXycgaW4gcGFyZW50KSB7XG4gICAgICBwYXJlbnQuX2VudGVyXy5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIH1cblxuICAgIHRoaXMuX2VudGVyXy5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICB9KVxuXG4gIC5pbnZva2UoZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuZHJhdy5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICB9KTtcbiIsInZhciB1dGlscyA9IHJlcXVpcmUoJy4uL3V0aWxzJyk7XG5cblxubW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKCcuL3dpZGdldCcpLmV4dGVuZCgpXG4gIC5wcm9wKCd3aWR0aCcpXG4gIC5kZWZhdWx0KDQwMClcblxuICAucHJvcCgnY29sc3BhbicpXG4gIC5kZWZhdWx0KDQpXG5cbiAgLnByb3AoJ3Jvd3NwYW4nKVxuICAuZGVmYXVsdCgyKVxuXG4gIC5wcm9wKCdoZWlnaHQnKVxuICAuZGVmYXVsdCgyMDApXG5cbiAgLnByb3AoJ2JhclBhZGRpbmcnKVxuICAuZGVmYXVsdCgyLjUpXG5cbiAgLnByb3AoJ21hcmdpbicpXG4gIC5kZWZhdWx0KHtcbiAgICB0b3A6IDEwLFxuICAgIGxlZnQ6IDM4LFxuICAgIHJpZ2h0OiAxNSxcbiAgICBib3R0b206IDQ1XG4gIH0pXG5cbiAgLnByb3AoJ3RpdGxlJylcbiAgLnNldChkMy5mdW5jdG9yKVxuICAuZGVmYXVsdChmdW5jdGlvbihkKSB7IHJldHVybiBkLnRpdGxlOyB9KVxuXG4gIC5wcm9wKCd2YWx1ZXMnKVxuICAuc2V0KGQzLmZ1bmN0b3IpXG4gIC5kZWZhdWx0KGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQudmFsdWVzOyB9KVxuXG4gIC5wcm9wKCd4JylcbiAgLnNldChkMy5mdW5jdG9yKVxuICAuZGVmYXVsdChmdW5jdGlvbihkKSB7IHJldHVybiBkLng7IH0pXG5cbiAgLnByb3AoJ3knKVxuICAuc2V0KGQzLmZ1bmN0b3IpXG4gIC5kZWZhdWx0KGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQueTsgfSlcblxuICAucHJvcCgnZHgnKVxuICAuc2V0KGQzLmZ1bmN0b3IpXG4gIC5kZWZhdWx0KG51bGwpXG5cbiAgLnByb3AoJ3hUaWNrRm9ybWF0JylcbiAgLmRlZmF1bHQobnVsbClcblxuICAucHJvcCgneFRpY2tzJylcbiAgLmRlZmF1bHQoOClcblxuICAucHJvcCgneVRpY2tGb3JtYXQnKVxuICAuZGVmYXVsdChkMy5mb3JtYXQoJy4ycycpKVxuXG4gIC5wcm9wKCd5VGlja3MnKVxuICAuZGVmYXVsdCg1KVxuXG4gIC5wcm9wKCdjb2xvcnMnKVxuXG4gIC5pbml0KGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuY29sb3JzKGQzLnNjYWxlLmNhdGVnb3J5MTAoKSk7XG4gIH0pXG5cbiAgLm1ldGgoJ25vcm1hbGl6ZScsIGZ1bmN0aW9uKGVsKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIHZhciBub2RlID0gZWwubm9kZSgpO1xuXG4gICAgZWwuZGF0dW0oZnVuY3Rpb24oZCwgaSkge1xuICAgICAgdmFyIHZhbHVlcyA9IHNlbGYudmFsdWVzKClcbiAgICAgICAgLmNhbGwobm9kZSwgZCwgaSlcbiAgICAgICAgLm1hcCh2YWx1ZSk7XG5cbiAgICAgIHZhciBsZW4gPSB2YWx1ZXMubGVuZ3RoO1xuICAgICAgdmFyIGR4QXZnID0gdmFsdWVzLmxlbmd0aFxuICAgICAgICA/ICh2YWx1ZXNbbGVuIC0gMV0ueCAtIHZhbHVlc1swXS54KSAvIGxlblxuICAgICAgICA6IDA7XG5cbiAgICAgIHZhbHVlcy5mb3JFYWNoKGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgZC5keCA9IHV0aWxzLmVuc3VyZShkLmR4LCBkeEF2Zyk7XG4gICAgICB9KTtcblxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgdmFsdWVzOiB2YWx1ZXMsXG4gICAgICAgIHRpdGxlOiBzZWxmLnRpdGxlKCkuY2FsbChub2RlLCBkLCBpKVxuICAgICAgfTtcbiAgICB9KTtcblxuICAgIGZ1bmN0aW9uIHZhbHVlKGQsIGkpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHg6IHNlbGYueCgpLmNhbGwobm9kZSwgZCwgaSksXG4gICAgICAgIHk6IHNlbGYueSgpLmNhbGwobm9kZSwgZCwgaSksXG4gICAgICAgIGR4OiBzZWxmLmR4KCkuY2FsbChub2RlLCBkLCBpKSxcbiAgICAgICAgd2lkdGg6IHNlbGYud2lkdGgoKS5jYWxsKG5vZGUsIGQsIGkpLFxuICAgICAgICBoZWlnaHQ6IHNlbGYuaGVpZ2h0KCkuY2FsbChub2RlLCBkLCBpKVxuICAgICAgfTtcbiAgICB9XG4gIH0pXG5cbiAgLmVudGVyKGZ1bmN0aW9uKGVsKSB7XG4gICAgZWwuYXR0cignY2xhc3MnLCAnYmFycyB3aWRnZXQnKTtcblxuICAgIGVsLmFwcGVuZCgnZGl2JylcbiAgICAgIC5hdHRyKCdjbGFzcycsICd0aXRsZScpO1xuXG4gICAgdmFyIHN2ZyA9IGVsLmFwcGVuZCgnZGl2JylcbiAgICAgIC5hdHRyKCdjbGFzcycsICdjaGFydCcpXG4gICAgICAuYXBwZW5kKCdzdmcnKVxuICAgICAgLmFwcGVuZCgnZycpO1xuXG4gICAgc3ZnLmFwcGVuZCgnZycpXG4gICAgICAuYXR0cignY2xhc3MnLCAnYmFycycpO1xuXG4gICAgc3ZnLmFwcGVuZCgnZycpXG4gICAgICAuYXR0cignY2xhc3MnLCAneSBheGlzJyk7XG5cbiAgICBzdmcuYXBwZW5kKCdnJylcbiAgICAgIC5hdHRyKCdjbGFzcycsICd4IGF4aXMnKTtcbiAgfSlcblxuICAuZHJhdyhmdW5jdGlvbihlbCkge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICB0aGlzLm5vcm1hbGl6ZShlbCk7XG5cbiAgICBlbC5zdHlsZSgnd2lkdGgnLCB1dGlscy5weCh0aGlzLndpZHRoKCkpKVxuICAgICAgLnN0eWxlKCdoZWlnaHQnLCB1dGlscy5weCh0aGlzLmhlaWdodCgpKSk7XG5cbiAgICBlbC5zZWxlY3QoJy53aWRnZXQgLnRpdGxlJylcbiAgICAgIC50ZXh0KGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQudGl0bGU7IH0pO1xuXG4gICAgdmFyIGNoYXJ0ID0gZWwuc2VsZWN0KCcuY2hhcnQnKVxuICAgICAgLmRhdHVtKGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQudmFsdWVzOyB9KTtcblxuICAgIHZhciBmeCA9IGQzLnRpbWUuc2NhbGUoKVxuICAgICAgLmRvbWFpbihbXG4gICAgICAgIGQzLm1pbihjaGFydC5kYXR1bSgpLCBmdW5jdGlvbihkKSB7IHJldHVybiBkLng7IH0pLFxuICAgICAgICBkMy5tYXgoY2hhcnQuZGF0dW0oKSwgZnVuY3Rpb24oZCkgeyByZXR1cm4gZC54ICsgZC5keDsgfSldKTtcblxuICAgIHZhciBmeSA9IGQzLnNjYWxlLmxpbmVhcigpXG4gICAgICAuZG9tYWluKFswLCBkMy5tYXgoY2hhcnQuZGF0dW0oKSwgZnVuY3Rpb24oZCkgeyByZXR1cm4gZC55OyB9KV0pO1xuXG4gICAgdmFyIGRpbXMgPSB1dGlscy5ib3goKVxuICAgICAgLndpZHRoKHV0aWxzLmlubmVyV2lkdGgoY2hhcnQpKVxuICAgICAgLmhlaWdodCh1dGlscy5pbm5lckhlaWdodChjaGFydCkpXG4gICAgICAubWFyZ2luKHRoaXMubWFyZ2luKCkpXG4gICAgICAuY2FsYygpO1xuXG4gICAgY2hhcnRcbiAgICAgIC5zdHlsZSgnd2lkdGgnLCB1dGlscy5weChkaW1zLndpZHRoKSlcbiAgICAgIC5zdHlsZSgnaGVpZ2h0JywgdXRpbHMucHgoZGltcy5oZWlnaHQpKTtcblxuICAgIGZ4LnJhbmdlKFswLCBkaW1zLmlubmVyV2lkdGhdKTtcbiAgICBmeS5yYW5nZShbZGltcy5pbm5lckhlaWdodCwgMF0pO1xuXG4gICAgdmFyIHN2ZyA9IGNoYXJ0LnNlbGVjdCgnc3ZnJylcbiAgICAgIC5hdHRyKCd3aWR0aCcsIGRpbXMud2lkdGgpXG4gICAgICAuYXR0cignaGVpZ2h0JywgZGltcy5oZWlnaHQpXG4gICAgICAuc2VsZWN0KCdnJylcbiAgICAgICAgLmF0dHIoJ3RyYW5zZm9ybScsIHV0aWxzLnRyYW5zbGF0ZShcbiAgICAgICAgICBkaW1zLm1hcmdpbi5sZWZ0LFxuICAgICAgICAgIGRpbXMubWFyZ2luLnRvcCkpO1xuXG4gICAgdmFyIGJhciA9IHN2Zy5zZWxlY3QoJy5iYXJzJylcbiAgICAgIC5zZWxlY3RBbGwoJy5iYXInKVxuICAgICAgLmRhdGEoZnVuY3Rpb24oZCkgeyByZXR1cm4gZDsgfSxcbiAgICAgICAgICAgIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQueDsgfSk7XG5cbiAgICBiYXIuZW50ZXIoKS5hcHBlbmQoJ2cnKVxuICAgICAgLmF0dHIoJ2NsYXNzJywgJ2JhcicpXG4gICAgICAuYXBwZW5kKCdyZWN0Jyk7XG5cbiAgICBiYXJcbiAgICAgIC5hdHRyKCd0cmFuc2Zvcm0nLCBmdW5jdGlvbihkKSB7XG4gICAgICAgIHJldHVybiB1dGlscy50cmFuc2xhdGUoZngoZC54KSwgZnkoZC55KSk7XG4gICAgICB9KTtcblxuICAgIGJhci5zZWxlY3QoJ3JlY3QnKVxuICAgICAgLnN0eWxlKCdmaWxsJywgdGhpcy5jb2xvcnMoKShlbC5kYXR1bSgpLnRpdGxlKSlcbiAgICAgIC5hdHRyKCd3aWR0aCcsIGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgdmFyIHdpZHRoID0gZngoZC54ICsgZC5keCkgLSBmeChkLngpO1xuICAgICAgICB3aWR0aCAtPSBzZWxmLmJhclBhZGRpbmcoKTtcbiAgICAgICAgcmV0dXJuIE1hdGgubWF4KHdpZHRoLCAxKTtcbiAgICAgIH0pXG4gICAgICAuYXR0cignaGVpZ2h0JywgZnVuY3Rpb24oZCkge1xuICAgICAgICByZXR1cm4gZGltcy5pbm5lckhlaWdodCAtIGZ5KGQueSk7IFxuICAgICAgfSk7XG5cbiAgICBiYXIuZXhpdCgpXG4gICAgICAucmVtb3ZlKCk7XG5cbiAgICB2YXIgYXhpcyA9IGQzLnN2Zy5heGlzKClcbiAgICAgIC5zY2FsZShmeClcbiAgICAgIC50aWNrcyh0aGlzLnhUaWNrcygpKVxuICAgICAgLnRpY2tGb3JtYXQodGhpcy54VGlja0Zvcm1hdCgpKTtcblxuICAgIHN2Zy5zZWxlY3QoJy54LmF4aXMnKVxuICAgICAgLmF0dHIoJ3RyYW5zZm9ybScsIHV0aWxzLnRyYW5zbGF0ZSgwLCBkaW1zLmlubmVySGVpZ2h0KSlcbiAgICAgIC5jYWxsKGF4aXMpO1xuXG4gICAgYXhpcyA9IGQzLnN2Zy5heGlzKClcbiAgICAgIC5vcmllbnQoJ2xlZnQnKVxuICAgICAgLnNjYWxlKGZ5KVxuICAgICAgLnRpY2tQYWRkaW5nKDgpXG4gICAgICAudGlja1NpemUoLWRpbXMuaW5uZXJXaWR0aClcbiAgICAgIC50aWNrcyh0aGlzLnlUaWNrcygpKVxuICAgICAgLnRpY2tGb3JtYXQodGhpcy55VGlja0Zvcm1hdCgpKTtcbiAgICBcbiAgICBzdmcuc2VsZWN0KCcueS5heGlzJylcbiAgICAgIC5jYWxsKGF4aXMpO1xuICB9KTtcbiIsImV4cG9ydHMucGllID0gcmVxdWlyZSgnLi9waWUnKTtcbmV4cG9ydHMuYmFycyA9IHJlcXVpcmUoJy4vYmFycycpO1xuZXhwb3J0cy5sYXN0ID0gcmVxdWlyZSgnLi9sYXN0Jyk7XG5leHBvcnRzLmxpbmVzID0gcmVxdWlyZSgnLi9saW5lcycpO1xuZXhwb3J0cy53aWRnZXQgPSByZXF1aXJlKCcuL3dpZGdldCcpO1xuIiwidmFyIHV0aWxzID0gcmVxdWlyZSgnLi4vdXRpbHMnKTtcblxuXG5tb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoJy4vd2lkZ2V0JykuZXh0ZW5kKClcbiAgLnByb3AoJ3dpZHRoJylcbiAgLmRlZmF1bHQoNDAwKVxuXG4gIC5wcm9wKCdjb2xzcGFuJylcbiAgLmRlZmF1bHQoNClcblxuICAucHJvcCgndGl0bGUnKVxuICAuc2V0KGQzLmZ1bmN0b3IpXG4gIC5kZWZhdWx0KGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQudGl0bGU7IH0pXG5cbiAgLnByb3AoJ3ZhbHVlcycpXG4gIC5zZXQoZDMuZnVuY3RvcilcbiAgLmRlZmF1bHQoZnVuY3Rpb24oZCkgeyByZXR1cm4gZC52YWx1ZXM7IH0pXG5cbiAgLnByb3AoJ3gnKVxuICAuc2V0KGQzLmZ1bmN0b3IpXG4gIC5kZWZhdWx0KGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQueDsgfSlcblxuICAucHJvcCgneScpXG4gIC5zZXQoZDMuZnVuY3RvcilcbiAgLmRlZmF1bHQoZnVuY3Rpb24oZCkgeyByZXR1cm4gZC55OyB9KVxuXG4gIC5wcm9wKCd5Rm9ybWF0JylcbiAgLmRlZmF1bHQoZDMuZm9ybWF0KCcsMnMnKSlcblxuICAucHJvcCgnZGlmZkZvcm1hdCcpXG4gIC5kZWZhdWx0KGQzLmZvcm1hdCgnKywycycpKVxuXG4gIC5wcm9wKCd4Rm9ybWF0JylcbiAgLmRlZmF1bHQoZDMudGltZS5mb3JtYXQoJyUtZCAlYiAlLUg6JU0nKSlcblxuICAucHJvcCgnbm9uZScpXG4gIC5kZWZhdWx0KDApXG5cbiAgLnByb3AoJ3N1bW1hcnlMaW1pdCcpXG4gIC5kZWZhdWx0KDIpXG4gIC5zZXQoZnVuY3Rpb24odikgeyByZXR1cm4gTWF0aC5tYXgodXRpbHMuZW5zdXJlKHYsIDIpLCAyKTsgfSlcblxuICAucHJvcCgnc3BhcmtsaW5lTGltaXQnKVxuICAuZGVmYXVsdCgxNSlcbiAgLnNldChmdW5jdGlvbih2KSB7IHJldHVybiBNYXRoLm1heCh1dGlscy5lbnN1cmUodiwgMiksIDIpOyB9KVxuXG4gIC5wcm9wKCdzcGFya2xpbmUnKVxuICAucHJvcCgnc3VtbWFyeScpXG5cbiAgLmluaXQoZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5zcGFya2xpbmUoc3BhcmtsaW5lKHRoaXMpKTtcbiAgICB0aGlzLnN1bW1hcnkoc3VtbWFyeSh0aGlzKSk7XG4gIH0pXG5cbiAgLmVudGVyKGZ1bmN0aW9uKGVsKSB7XG4gICAgZWwuYXR0cignY2xhc3MnLCAnbGFzdCB3aWRnZXQnKTtcblxuICAgIGVsLmFwcGVuZCgnZGl2JylcbiAgICAgIC5hdHRyKCdjbGFzcycsICd0aXRsZScpO1xuXG4gICAgdmFyIHZhbHVlcyA9IGVsLmFwcGVuZCgnZGl2JylcbiAgICAgIC5hdHRyKCdjbGFzcycsICd2YWx1ZXMnKTtcblxuICAgIHZhbHVlcy5hcHBlbmQoJ2RpdicpXG4gICAgICAuYXR0cignY2xhc3MnLCAnbGFzdCB2YWx1ZScpO1xuXG4gICAgdmFsdWVzLmFwcGVuZCgnZGl2JylcbiAgICAgIC5hdHRyKCdjbGFzcycsICdzcGFya2xpbmUnKTtcblxuICAgIHZhbHVlcy5hcHBlbmQoJ2RpdicpXG4gICAgICAuYXR0cignY2xhc3MnLCAnc3VtbWFyeScpO1xuICB9KVxuXG4gIC5kcmF3KGZ1bmN0aW9uKGVsKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIHZhciBub2RlID0gZWwubm9kZSgpO1xuXG4gICAgZWwuc3R5bGUoJ3dpZHRoJywgdXRpbHMucHgodGhpcy53aWR0aCgpKSk7XG5cbiAgICBlbC5zZWxlY3QoJy50aXRsZScpXG4gICAgICAudGV4dChmdW5jdGlvbihkLCBpKSB7XG4gICAgICAgIHJldHVybiBzZWxmLnRpdGxlKCkuY2FsbChub2RlLCBkLCBpKTtcbiAgICAgIH0pO1xuXG4gICAgdmFyIHZhbHVlcyA9IGVsLnNlbGVjdCgnLnZhbHVlcycpXG4gICAgICAuZGF0dW0oZnVuY3Rpb24oZCwgaSkge1xuICAgICAgICByZXR1cm4gc2VsZi52YWx1ZXMoKVxuICAgICAgICAgIC5jYWxsKG5vZGUsIGQsIGkpXG4gICAgICAgICAgLm1hcChmdW5jdGlvbihkLCBpKSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICB4OiBzZWxmLngoKS5jYWxsKG5vZGUsIGQsIGkpLFxuICAgICAgICAgICAgICB5OiBzZWxmLnkoKS5jYWxsKG5vZGUsIGQsIGkpXG4gICAgICAgICAgICB9O1xuICAgICAgICAgIH0pO1xuICAgICAgfSlcbiAgICAgIC5hdHRyKCdjbGFzcycsIGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgZCA9IGQuc2xpY2UoLTIpO1xuXG4gICAgICAgIGQgPSBkLmxlbmd0aCA+IDFcbiAgICAgICAgICA/IGRbMV0ueSAtIGRbMF0ueVxuICAgICAgICAgIDogMDtcblxuICAgICAgICBpZiAoZCA+IDApIHsgcmV0dXJuICdnb29kIHZhbHVlcyc7IH1cbiAgICAgICAgaWYgKGQgPCAwKSB7IHJldHVybiAnYmFkIHZhbHVlcyc7IH1cbiAgICAgICAgcmV0dXJuICduZXV0cmFsIHZhbHVlcyc7XG4gICAgICB9KTtcblxuICAgIHZhbHVlcy5zZWxlY3QoJy5sYXN0LnZhbHVlJylcbiAgICAgIC5kYXR1bShmdW5jdGlvbihkLCBpKSB7XG4gICAgICAgIGQgPSBkW2QubGVuZ3RoIC0gMV07XG5cbiAgICAgICAgcmV0dXJuICFkXG4gICAgICAgICAgPyBzZWxmLm5vbmUoKVxuICAgICAgICAgIDogZC55O1xuICAgICAgfSlcbiAgICAgIC50ZXh0KHRoaXMueUZvcm1hdCgpKTtcblxuICAgIHZhbHVlcy5zZWxlY3QoJy5zcGFya2xpbmUnKVxuICAgICAgLmNhbGwodGhpcy5zcGFya2xpbmUoKSk7XG5cbiAgICB2YWx1ZXMuc2VsZWN0KCcuc3VtbWFyeScpXG4gICAgICAuY2FsbCh0aGlzLnN1bW1hcnkoKSk7XG4gIH0pO1xuXG5cbnZhciBzdW1tYXJ5ID0gcmVxdWlyZSgnLi4vdmlldycpLmV4dGVuZCgpXG4gIC5wcm9wKCd3aWRnZXQnKVxuXG4gIC5pbml0KGZ1bmN0aW9uKHdpZGdldCkge1xuICAgIHRoaXMud2lkZ2V0KHdpZGdldCk7XG4gIH0pXG5cbiAgLmVudGVyKGZ1bmN0aW9uKGVsKSB7XG4gICAgZWwuYXBwZW5kKCdzcGFuJylcbiAgICAgIC5hdHRyKCdjbGFzcycsICdkaWZmJyk7XG5cbiAgICBlbC5hcHBlbmQoJ3NwYW4nKVxuICAgICAgLmF0dHIoJ2NsYXNzJywgJ3RpbWUnKTtcbiAgfSlcblxuICAuZHJhdyhmdW5jdGlvbihlbCkge1xuICAgIHZhciB3aWRnZXQgPSB0aGlzLndpZGdldCgpO1xuXG4gICAgaWYgKGVsLmRhdHVtKCkubGVuZ3RoIDwgdGhpcy53aWRnZXQoKS5zdW1tYXJ5TGltaXQoKSkge1xuICAgICAgZWwuc3R5bGUoJ2hlaWdodCcsIDApO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGVsLnNlbGVjdCgnLmRpZmYnKVxuICAgICAgLmRhdHVtKGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgZCA9IGQuc2xpY2UoLTIpO1xuICAgICAgICByZXR1cm4gZFsxXS55IC0gZFswXS55O1xuICAgICAgfSlcbiAgICAgIC50ZXh0KHdpZGdldC5kaWZmRm9ybWF0KCkpO1xuXG4gICAgZWwuc2VsZWN0KCcudGltZScpXG4gICAgICAuZGF0dW0oZnVuY3Rpb24oZCkge1xuICAgICAgICBkID0gZC5zbGljZSgtMik7XG5cbiAgICAgICAgcmV0dXJuIFtkWzBdLngsIGRbMV0ueF1cbiAgICAgICAgICAubWFwKHV0aWxzLmRhdGUpXG4gICAgICAgICAgLm1hcCh3aWRnZXQueEZvcm1hdCgpKTtcbiAgICAgIH0pXG4gICAgICAudGV4dChmdW5jdGlvbihkKSB7XG4gICAgICAgIHJldHVybiBbJyBmcm9tJywgZFswXSwgJ3RvJywgZFsxXV0uam9pbignICcpO1xuICAgICAgfSk7XG4gIH0pO1xuXG5cbnZhciBzcGFya2xpbmUgPSByZXF1aXJlKCcuLi92aWV3JykuZXh0ZW5kKClcbiAgLnByb3AoJ3dpZGdldCcpXG5cbiAgLnByb3AoJ2hlaWdodCcpXG4gIC5kZWZhdWx0KDI1KVxuXG4gIC5wcm9wKCdtYXJnaW4nKVxuICAuZGVmYXVsdCh7XG4gICAgdG9wOiA0LFxuICAgIGxlZnQ6IDQsXG4gICAgYm90dG9tOiA0LFxuICAgIHJpZ2h0OiA0IFxuICB9KVxuXG4gIC5pbml0KGZ1bmN0aW9uKHdpZGdldCkge1xuICAgIHRoaXMud2lkZ2V0KHdpZGdldCk7XG4gIH0pXG5cbiAgLmVudGVyKGZ1bmN0aW9uKGVsKSB7XG4gICAgdmFyIHN2ZyA9IGVsLmFwcGVuZCgnc3ZnJylcbiAgICAgIC5hcHBlbmQoJ2cnKTtcblxuICAgIHN2Zy5hcHBlbmQoJ3BhdGgnKVxuICAgICAgLmF0dHIoJ2NsYXNzJywgJ3Jlc3QgcGF0aCcpO1xuXG4gICAgc3ZnLmFwcGVuZCgncGF0aCcpXG4gICAgICAuYXR0cignY2xhc3MnLCAnZGlmZiBwYXRoJyk7XG4gIH0pXG5cbiAgLmRyYXcoZnVuY3Rpb24oZWwpIHtcbiAgICBpZiAoZWwuZGF0dW0oKS5sZW5ndGggPCB0aGlzLndpZGdldCgpLnNwYXJrbGluZUxpbWl0KCkpIHtcbiAgICAgIGVsLnN0eWxlKCdoZWlnaHQnLCAwKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB2YXIgZGltcyA9IHV0aWxzLmJveCgpXG4gICAgICAubWFyZ2luKHRoaXMubWFyZ2luKCkpXG4gICAgICAud2lkdGgodXRpbHMuaW5uZXJXaWR0aChlbCkpXG4gICAgICAuaGVpZ2h0KHRoaXMuaGVpZ2h0KCkpXG4gICAgICAuY2FsYygpO1xuXG4gICAgdmFyIGZ4ID0gZDMuc2NhbGUubGluZWFyKClcbiAgICAgIC5kb21haW4oZDMuZXh0ZW50KGVsLmRhdHVtKCksIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQueDsgfSkpXG4gICAgICAucmFuZ2UoWzAsIGRpbXMuaW5uZXJXaWR0aF0pO1xuXG4gICAgdmFyIGZ5ID0gZDMuc2NhbGUubGluZWFyKClcbiAgICAgIC5kb21haW4oZDMuZXh0ZW50KGVsLmRhdHVtKCksIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQueTsgfSkpXG4gICAgICAucmFuZ2UoW2RpbXMuaW5uZXJIZWlnaHQsIDBdKTtcblxuICAgIHZhciBsaW5lID0gZDMuc3ZnLmxpbmUoKVxuICAgICAgLngoZnVuY3Rpb24oZCkgeyByZXR1cm4gZngoZC54KTsgfSlcbiAgICAgIC55KGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGZ5KGQueSk7IH0pO1xuXG4gICAgdmFyIHN2ZyA9IGVsLnNlbGVjdCgnc3ZnJylcbiAgICAgIC5hdHRyKCd3aWR0aCcsIGRpbXMud2lkdGgpXG4gICAgICAuYXR0cignaGVpZ2h0JywgZGltcy5oZWlnaHQpXG4gICAgICAuc2VsZWN0KCdnJylcbiAgICAgICAgLmF0dHIoJ3RyYW5zZm9ybScsIHV0aWxzLnRyYW5zbGF0ZShkaW1zLm1hcmdpbi5sZWZ0LCBkaW1zLm1hcmdpbi50b3ApKTtcblxuICAgIHN2Zy5zZWxlY3QoJy5yZXN0LnBhdGgnKVxuICAgICAgLmF0dHIoJ2QnLCBsaW5lKTtcblxuICAgIHN2Zy5zZWxlY3QoJy5kaWZmLnBhdGgnKVxuICAgICAgLmRhdHVtKGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQuc2xpY2UoLTIpOyB9KVxuICAgICAgLmF0dHIoJ2QnLCBsaW5lKTtcblxuICAgIHZhciBkb3QgPSBzdmcuc2VsZWN0QWxsKCcuZG90JylcbiAgICAgIC5kYXRhKGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQuc2xpY2UoLTEpOyB9KTtcblxuICAgIGRvdC5lbnRlcigpLmFwcGVuZCgnY2lyY2xlJylcbiAgICAgIC5hdHRyKCdjbGFzcycsICdkb3QnKVxuICAgICAgLmF0dHIoJ3InLCA0KTtcblxuICAgIGRvdFxuICAgICAgLmF0dHIoJ2N4JywgZnVuY3Rpb24oZCkgeyByZXR1cm4gZngoZC54KTsgfSlcbiAgICAgIC5hdHRyKCdjeScsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGZ5KGQueSk7IH0pO1xuXG4gICAgZG90LmV4aXQoKS5yZW1vdmUoKTtcbiAgfSk7XG4iLCJ2YXIgdXRpbHMgPSByZXF1aXJlKCcuLi91dGlscycpO1xuXG5cbm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSgnLi93aWRnZXQnKS5leHRlbmQoKVxuICAucHJvcCgnd2lkdGgnKVxuICAuZGVmYXVsdCg0MDApXG5cbiAgLnByb3AoJ2NvbHNwYW4nKVxuICAuZGVmYXVsdCg0KVxuXG4gIC5wcm9wKCd0aXRsZScpXG4gIC5zZXQoZDMuZnVuY3RvcilcbiAgLmRlZmF1bHQoZnVuY3Rpb24oZCkgeyByZXR1cm4gZC50aXRsZTsgfSlcblxuICAucHJvcCgnbWV0cmljcycpXG4gIC5zZXQoZDMuZnVuY3RvcilcbiAgLmRlZmF1bHQoZnVuY3Rpb24oZCkgeyByZXR1cm4gZC5tZXRyaWNzOyB9KVxuXG4gIC5wcm9wKCdrZXknKVxuICAuc2V0KGQzLmZ1bmN0b3IpXG4gIC5kZWZhdWx0KGZ1bmN0aW9uKGQsIGkpIHsgcmV0dXJuIGk7IH0pXG5cbiAgLnByb3AoJ21ldHJpY1RpdGxlJylcbiAgLnNldChkMy5mdW5jdG9yKVxuICAuZGVmYXVsdChmdW5jdGlvbihkKSB7IHJldHVybiBkLnRpdGxlOyB9KVxuXG4gIC5wcm9wKCd2YWx1ZXMnKVxuICAuc2V0KGQzLmZ1bmN0b3IpXG4gIC5kZWZhdWx0KGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQudmFsdWVzOyB9KVxuXG4gIC5wcm9wKCd4JylcbiAgLnNldChkMy5mdW5jdG9yKVxuICAuZGVmYXVsdChmdW5jdGlvbihkKSB7IHJldHVybiBkLng7IH0pXG5cbiAgLnByb3AoJ3knKVxuICAuc2V0KGQzLmZ1bmN0b3IpXG4gIC5kZWZhdWx0KGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQueTsgfSlcblxuICAucHJvcCgneFRpY2tGb3JtYXQnKVxuICAuZGVmYXVsdChudWxsKVxuXG4gIC5wcm9wKCd4VGlja3MnKVxuICAuZGVmYXVsdCg4KVxuXG4gIC5wcm9wKCd5Rm9ybWF0JylcbiAgLmRlZmF1bHQoZDMuZm9ybWF0KCcsMnMnKSlcblxuICAucHJvcCgneVRpY2tzJylcbiAgLmRlZmF1bHQoNSlcblxuICAucHJvcCgneVRpY2tGb3JtYXQnKVxuICAuZGVmYXVsdChkMy5mb3JtYXQoJy4ycycpKVxuXG4gIC5wcm9wKCdub25lJylcbiAgLmRlZmF1bHQoMClcblxuICAucHJvcCgnY29sb3JzJylcbiAgLnByb3AoJ2NoYXJ0JylcbiAgLnByb3AoJ2xlZ2VuZCcpXG5cbiAgLmluaXQoZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5jaGFydChjaGFydCh0aGlzKSk7XG4gICAgdGhpcy5sZWdlbmQobGVnZW5kKHRoaXMpKTtcbiAgICB0aGlzLmNvbG9ycyhkMy5zY2FsZS5jYXRlZ29yeTEwKCkpO1xuICB9KVxuXG4gIC5lbnRlcihmdW5jdGlvbihlbCkge1xuICAgIGVsLmF0dHIoJ2NsYXNzJywgJ2xpbmVzIHdpZGdldCcpO1xuXG4gICAgZWwuYXBwZW5kKCdkaXYnKVxuICAgICAgLmF0dHIoJ2NsYXNzJywgJ3RpdGxlJyk7XG5cbiAgICB2YXIgdmFsdWVzID0gZWwuYXBwZW5kKCdkaXYnKVxuICAgICAgLmF0dHIoJ2NsYXNzJywgJ3ZhbHVlcycpO1xuXG4gICAgdmFsdWVzLmFwcGVuZCgnZGl2JylcbiAgICAgIC5hdHRyKCdjbGFzcycsICdjaGFydCcpO1xuXG4gICAgdmFsdWVzLmFwcGVuZCgnZGl2JylcbiAgICAgIC5hdHRyKCdjbGFzcycsICdsZWdlbmQnKTtcbiAgfSlcblxuICAubWV0aCgnbm9ybWFsaXplJywgZnVuY3Rpb24oZWwpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgdmFyIG5vZGUgPSBlbC5ub2RlKCk7XG5cbiAgICBlbC5kYXR1bShmdW5jdGlvbihkLCBpKSB7XG4gICAgICB2YXIgdGl0bGUgPSBzZWxmLnRpdGxlKCkuY2FsbChub2RlLCBkLCBpKTtcblxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgdGl0bGU6IHRpdGxlLFxuICAgICAgICBtZXRyaWNzOiBzZWxmLm1ldHJpY3MoKVxuICAgICAgICAgIC5jYWxsKG5vZGUsIGQsIGkpXG4gICAgICAgICAgLm1hcChtZXRyaWMpXG4gICAgICB9O1xuICAgIH0pO1xuXG4gICAgZnVuY3Rpb24gbWV0cmljKGQsIGkpIHtcbiAgICAgIHZhciBrZXkgPSBzZWxmLmtleSgpXG4gICAgICAgIC5jYWxsKG5vZGUsIGQsIGkpXG4gICAgICAgIC50b1N0cmluZygpO1xuXG4gICAgICByZXR1cm4ge1xuICAgICAgICBrZXk6IGtleSxcbiAgICAgICAgY29sb3I6IHNlbGYuY29sb3JzKCkoa2V5KSxcbiAgICAgICAgdGl0bGU6IHNlbGYubWV0cmljVGl0bGUoKS5jYWxsKG5vZGUsIGQsIGkpLFxuICAgICAgICB2YWx1ZXM6IHNlbGYudmFsdWVzKClcbiAgICAgICAgICAuY2FsbChub2RlLCBkLCBpKVxuICAgICAgICAgIC5tYXAodmFsdWUpXG4gICAgICB9O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHZhbHVlKGQsIGkpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHg6IHNlbGYueCgpLmNhbGwobm9kZSwgZCwgaSksXG4gICAgICAgIHk6IHNlbGYueSgpLmNhbGwobm9kZSwgZCwgaSlcbiAgICAgIH07XG4gICAgfVxuICB9KVxuXG4gIC5kcmF3KGZ1bmN0aW9uKGVsKSB7XG4gICAgdGhpcy5ub3JtYWxpemUoZWwpO1xuXG4gICAgZWwuc3R5bGUoJ3dpZHRoJywgdXRpbHMucHgodGhpcy53aWR0aCgpKSk7XG5cbiAgICBlbC5zZWxlY3QoJy53aWRnZXQgLnRpdGxlJylcbiAgICAgIC50ZXh0KGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQudGl0bGU7IH0pO1xuXG4gICAgdmFyIHZhbHVlcyA9IGVsLnNlbGVjdCgnLnZhbHVlcycpXG4gICAgICAuZGF0dW0oZnVuY3Rpb24oZCwgaSkgeyByZXR1cm4gZC5tZXRyaWNzOyB9KTtcblxuICAgIHZhbHVlcy5zZWxlY3QoJy5jaGFydCcpXG4gICAgICAuY2FsbCh0aGlzLmNoYXJ0KCkpO1xuXG4gICAgdmFsdWVzLnNlbGVjdCgnLmxlZ2VuZCcpXG4gICAgICAuY2FsbCh0aGlzLmxlZ2VuZCgpKTtcbiAgfSk7XG5cblxudmFyIGNoYXJ0ID0gcmVxdWlyZSgnLi4vdmlldycpLmV4dGVuZCgpXG4gIC5wcm9wKCdoZWlnaHQnKVxuICAuZGVmYXVsdCgxNTApXG5cbiAgLnByb3AoJ21hcmdpbicpXG4gIC5kZWZhdWx0KHtcbiAgICB0b3A6IDEwLFxuICAgIGxlZnQ6IDM1LFxuICAgIHJpZ2h0OiAxNSxcbiAgICBib3R0b206IDIwXG4gIH0pXG5cbiAgLnByb3AoJ3dpZGdldCcpXG5cbiAgLmluaXQoZnVuY3Rpb24od2lkZ2V0KSB7XG4gICAgdGhpcy53aWRnZXQod2lkZ2V0KTtcbiAgfSlcblxuICAuZW50ZXIoZnVuY3Rpb24oZWwpIHtcbiAgICB2YXIgc3ZnID0gZWwuYXBwZW5kKCdzdmcnKVxuICAgICAgLmFwcGVuZCgnZycpO1xuXG4gICAgc3ZnLmFwcGVuZCgnZycpXG4gICAgICAuYXR0cignY2xhc3MnLCAneCBheGlzJyk7XG5cbiAgICBzdmcuYXBwZW5kKCdnJylcbiAgICAgIC5hdHRyKCdjbGFzcycsICd5IGF4aXMnKTtcblxuICAgIHN2Zy5hcHBlbmQoJ2cnKVxuICAgICAgLmF0dHIoJ2NsYXNzJywgJ2xpbmVzJyk7XG4gIH0pXG5cbiAgLmRyYXcoZnVuY3Rpb24oZWwpIHtcbiAgICB2YXIgZGltcyA9IHV0aWxzLmJveCgpXG4gICAgICAubWFyZ2luKHRoaXMubWFyZ2luKCkpXG4gICAgICAud2lkdGgodXRpbHMuaW5uZXJXaWR0aChlbCkpXG4gICAgICAuaGVpZ2h0KHRoaXMuaGVpZ2h0KCkpXG4gICAgICAuY2FsYygpO1xuXG4gICAgdmFyIGFsbFZhbHVlcyA9IGVsXG4gICAgICAuZGF0dW0oKVxuICAgICAgLnJlZHVjZShmdW5jdGlvbihyZXN1bHRzLCBtZXRyaWMpIHtcbiAgICAgICAgcmVzdWx0cy5wdXNoLmFwcGx5KHJlc3VsdHMsIG1ldHJpYy52YWx1ZXMpO1xuICAgICAgICByZXR1cm4gcmVzdWx0cztcbiAgICAgIH0sIFtdKTtcblxuICAgIHZhciBmeCA9IGQzLnRpbWUuc2NhbGUoKVxuICAgICAgLmRvbWFpbihkMy5leHRlbnQoYWxsVmFsdWVzLCBmdW5jdGlvbihkKSB7IHJldHVybiBkLng7IH0pKVxuICAgICAgLnJhbmdlKFswLCBkaW1zLmlubmVyV2lkdGhdKTtcblxuICAgIHZhciBmeSA9IGQzLnNjYWxlLmxpbmVhcigpXG4gICAgICAuZG9tYWluKGQzLmV4dGVudChhbGxWYWx1ZXMsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQueTsgfSkpXG4gICAgICAucmFuZ2UoW2RpbXMuaW5uZXJIZWlnaHQsIDBdKTtcblxuICAgIHZhciBsaW5lID0gZDMuc3ZnLmxpbmUoKVxuICAgICAgLngoZnVuY3Rpb24oZCkgeyByZXR1cm4gZngoZC54KTsgfSlcbiAgICAgIC55KGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGZ5KGQueSk7IH0pO1xuXG4gICAgdmFyIHN2ZyA9IGVsLnNlbGVjdCgnc3ZnJylcbiAgICAgIC5hdHRyKCd3aWR0aCcsIGRpbXMud2lkdGgpXG4gICAgICAuYXR0cignaGVpZ2h0JywgZGltcy5oZWlnaHQpXG4gICAgICAuc2VsZWN0KCdnJylcbiAgICAgICAgLmF0dHIoJ3RyYW5zZm9ybScsIHV0aWxzLnRyYW5zbGF0ZShkaW1zLm1hcmdpbi5sZWZ0LCBkaW1zLm1hcmdpbi50b3ApKTtcblxuICAgIHZhciBtZXRyaWMgPSBzdmcuc2VsZWN0KCcubGluZXMnKS5zZWxlY3RBbGwoJy5tZXRyaWMnKVxuICAgICAgLmRhdGEoZnVuY3Rpb24oZCkgeyByZXR1cm4gZDsgfSxcbiAgICAgICAgICAgIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQua2V5OyB9KTtcblxuICAgIG1ldHJpYy5lbnRlcigpLmFwcGVuZCgnZycpXG4gICAgICAuYXR0cignY2xhc3MnLCAnbWV0cmljJylcbiAgICAgIC5hdHRyKCdkYXRhLWtleScsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQua2V5OyB9KVxuICAgICAgLmFwcGVuZCgncGF0aCcpXG4gICAgICAgIC5hdHRyKCdjbGFzcycsICdsaW5lJyk7XG5cbiAgICBtZXRyaWMuc2VsZWN0KCcubGluZScpXG4gICAgICAuYXR0cignc3Ryb2tlJywgZnVuY3Rpb24oZCkgeyByZXR1cm4gZC5jb2xvcjsgfSlcbiAgICAgIC5hdHRyKCdkJywgZnVuY3Rpb24oZCkgeyByZXR1cm4gbGluZShkLnZhbHVlcyk7IH0pO1xuXG4gICAgdmFyIGRvdCA9IG1ldHJpYy5zZWxlY3RBbGwoJy5kb3QnKVxuICAgICAgLmRhdGEoZnVuY3Rpb24oZCkge1xuICAgICAgICBpZiAoIWQudmFsdWVzLmxlbmd0aCkgeyByZXR1cm4gW107IH1cbiAgICAgICAgdmFyIGxhc3QgPSBkLnZhbHVlc1tkLnZhbHVlcy5sZW5ndGggLSAxXTtcblxuICAgICAgICByZXR1cm4gW3tcbiAgICAgICAgICB4OiBsYXN0LngsXG4gICAgICAgICAgeTogbGFzdC55LFxuICAgICAgICAgIGNvbG9yOiBkLmNvbG9yXG4gICAgICAgIH1dO1xuICAgICAgfSk7XG5cbiAgICBkb3QuZW50ZXIoKS5hcHBlbmQoJ2NpcmNsZScpXG4gICAgICAuYXR0cignY2xhc3MnLCAnZG90JylcbiAgICAgIC5hdHRyKCdyJywgNCk7XG5cbiAgICBkb3RcbiAgICAgIC5hdHRyKCdmaWxsJywgZnVuY3Rpb24oZCkgeyByZXR1cm4gZC5jb2xvcjsgfSlcbiAgICAgIC5hdHRyKCdjeCcsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGZ4KGQueCk7IH0pXG4gICAgICAuYXR0cignY3knLCBmdW5jdGlvbihkKSB7IHJldHVybiBmeShkLnkpOyB9KTtcblxuICAgIGRvdC5leGl0KClcbiAgICAgIC5yZW1vdmUoKTtcblxuICAgIG1ldHJpYy5leGl0KClcbiAgICAgIC5yZW1vdmUoKTtcblxuICAgIHZhciBheGlzID0gZDMuc3ZnLmF4aXMoKVxuICAgICAgLnNjYWxlKGZ4KVxuICAgICAgLnRpY2tQYWRkaW5nKDgpXG4gICAgICAudGlja3ModGhpcy53aWRnZXQoKS54VGlja3MoKSlcbiAgICAgIC50aWNrRm9ybWF0KHRoaXMud2lkZ2V0KCkueFRpY2tGb3JtYXQoKSlcbiAgICAgIC50aWNrU2l6ZSgtZGltcy5pbm5lckhlaWdodCk7XG5cbiAgICBzdmcuc2VsZWN0KCcueC5heGlzJylcbiAgICAgIC5hdHRyKCd0cmFuc2Zvcm0nLCB1dGlscy50cmFuc2xhdGUoMCwgZGltcy5pbm5lckhlaWdodCkpXG4gICAgICAuY2FsbChheGlzKTtcblxuICAgIGF4aXMgPSBkMy5zdmcuYXhpcygpXG4gICAgICAub3JpZW50KCdsZWZ0JylcbiAgICAgIC5zY2FsZShmeSlcbiAgICAgIC50aWNrUGFkZGluZyg4KVxuICAgICAgLnRpY2tzKHRoaXMud2lkZ2V0KCkueVRpY2tzKCkpXG4gICAgICAudGlja0Zvcm1hdCh0aGlzLndpZGdldCgpLnlUaWNrRm9ybWF0KCkpXG4gICAgICAudGlja1NpemUoLWRpbXMuaW5uZXJXaWR0aCk7XG4gICAgXG4gICAgc3ZnLnNlbGVjdCgnLnkuYXhpcycpXG4gICAgICAuY2FsbChheGlzKTtcbiAgfSk7XG5cblxudmFyIGxlZ2VuZCA9IHJlcXVpcmUoJy4uL3ZpZXcnKS5leHRlbmQoKVxuICAucHJvcCgnd2lkZ2V0JylcblxuICAuaW5pdChmdW5jdGlvbih3aWRnZXQpIHtcbiAgICB0aGlzLndpZGdldCh3aWRnZXQpO1xuICB9KVxuXG4gIC5lbnRlcihmdW5jdGlvbihlbCkge1xuICAgIGVsLmFwcGVuZCgndGFibGUnKVxuICAgICAgLmF0dHIoJ2NsYXNzJywgJ3RhYmxlJyk7XG4gIH0pXG5cbiAgLmRyYXcoZnVuY3Rpb24oZWwpIHtcbiAgICB2YXIgbm9uZSA9IHRoaXMud2lkZ2V0KCkubm9uZSgpO1xuICAgIHZhciB5Rm9ybWF0ID0gdGhpcy53aWRnZXQoKS55Rm9ybWF0KCk7XG5cbiAgICB2YXIgbWV0cmljID0gZWwuc2VsZWN0KCcudGFibGUnKS5zZWxlY3RBbGwoJy5tZXRyaWMnKVxuICAgICAgLmRhdGEoZnVuY3Rpb24oZCkgeyByZXR1cm4gZDsgfSxcbiAgICAgICAgICAgIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQua2V5OyB9KTtcblxuICAgIHZhciBlbnRlck1ldHJpYyA9IG1ldHJpYy5lbnRlcigpLmFwcGVuZCgndHInKVxuICAgICAgLmF0dHIoJ2RhdGEta2V5JywgZnVuY3Rpb24oZCkgeyByZXR1cm4gZC5rZXk7IH0pXG4gICAgICAuYXR0cignY2xhc3MnLCAnbWV0cmljJyk7XG5cbiAgICBlbnRlck1ldHJpYy5hcHBlbmQoJ3RkJylcbiAgICAgIC5hdHRyKCdjbGFzcycsICdzd2F0Y2gnKTtcblxuICAgIGVudGVyTWV0cmljLmFwcGVuZCgndGQnKVxuICAgICAgLmF0dHIoJ2NsYXNzJywgJ3RpdGxlJyk7XG5cbiAgICBlbnRlck1ldHJpYy5hcHBlbmQoJ3RkJylcbiAgICAgIC5hdHRyKCdjbGFzcycsICd2YWx1ZScpO1xuXG4gICAgbWV0cmljLnNlbGVjdCgnLnN3YXRjaCcpXG4gICAgICAuc3R5bGUoJ2JhY2tncm91bmQnLCBmdW5jdGlvbihkKSB7IHJldHVybiBkLmNvbG9yOyB9KTtcblxuICAgIG1ldHJpYy5zZWxlY3QoJy50aXRsZScpXG4gICAgICAudGV4dChmdW5jdGlvbihkKSB7IHJldHVybiBkLnRpdGxlOyB9KTtcblxuICAgIG1ldHJpYy5zZWxlY3QoJy52YWx1ZScpXG4gICAgICAudGV4dChmdW5jdGlvbihkKSB7XG4gICAgICAgIGQgPSBkLnZhbHVlc1tkLnZhbHVlcy5sZW5ndGggLSAxXTtcblxuICAgICAgICByZXR1cm4gZFxuICAgICAgICAgID8geUZvcm1hdChkLnkpXG4gICAgICAgICAgOiB5Rm9ybWF0KG5vbmUpO1xuICAgICAgfSk7XG5cbiAgICBtZXRyaWMuZXhpdCgpXG4gICAgICAucmVtb3ZlKCk7XG4gIH0pO1xuIiwidmFyIHV0aWxzID0gcmVxdWlyZSgnLi4vdXRpbHMnKTtcblxuXG5tb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoJy4vd2lkZ2V0JykuZXh0ZW5kKClcbiAgLnByb3AoJ3dpZHRoJylcbiAgLmRlZmF1bHQoNDAwKVxuXG4gIC5wcm9wKCdjb2xzcGFuJylcbiAgLmRlZmF1bHQoNClcblxuICAucHJvcCgnY29sb3JzJylcblxuICAucHJvcCgndGl0bGUnKVxuICAuc2V0KGQzLmZ1bmN0b3IpXG4gIC5kZWZhdWx0KGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQudGl0bGU7IH0pXG5cbiAgLnByb3AoJ21ldHJpY3MnKVxuICAuc2V0KGQzLmZ1bmN0b3IpXG4gIC5kZWZhdWx0KGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQubWV0cmljczsgfSlcblxuICAucHJvcCgna2V5JylcbiAgLnNldChkMy5mdW5jdG9yKVxuICAuZGVmYXVsdChmdW5jdGlvbihkLCBpKSB7IHJldHVybiBpOyB9KVxuXG4gIC5wcm9wKCdtZXRyaWNUaXRsZScpXG4gIC5zZXQoZDMuZnVuY3RvcilcbiAgLmRlZmF1bHQoZnVuY3Rpb24oZCkgeyByZXR1cm4gZC50aXRsZTsgfSlcblxuICAucHJvcCgndmFsdWUnKVxuICAuc2V0KGQzLmZ1bmN0b3IpXG4gIC5kZWZhdWx0KGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQudmFsdWU7IH0pXG5cbiAgLnByb3AoJ21hcmdpbicpXG4gIC5kZWZhdWx0KHtcbiAgICB0b3A6IDIwLFxuICAgIGxlZnQ6IDIwLFxuICAgIHJpZ2h0OiAyMCxcbiAgICBib3R0b206IDIwXG4gIH0pXG5cbiAgLnByb3AoJ2lubmVyUmFkaXVzJylcbiAgLnNldChkMy5mdW5jdG9yKVxuICAuZGVmYXVsdChmdW5jdGlvbihyKSB7IHJldHVybiAwLjM1ICogcjsgfSlcblxuICAucHJvcCgndmFsdWVGb3JtYXQnKVxuICAuZGVmYXVsdChkMy5mb3JtYXQoJywycycpKVxuXG4gIC5wcm9wKCdwZXJjZW50Rm9ybWF0JylcbiAgLmRlZmF1bHQoZDMuZm9ybWF0KCcuMCUnKSlcblxuICAuaW5pdChmdW5jdGlvbigpIHtcbiAgICB0aGlzLmNvbG9ycyhkMy5zY2FsZS5jYXRlZ29yeTEwKCkpO1xuICB9KVxuXG4gIC5tZXRoKCdub3JtYWxpemUnLCBmdW5jdGlvbihlbCkge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICB2YXIgbm9kZSA9IGVsLm5vZGUoKTtcblxuICAgIGVsLmRhdHVtKGZ1bmN0aW9uKGQsIGkpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHRpdGxlOiBzZWxmLnRpdGxlKCkuY2FsbChub2RlLCBkLCBpKSxcbiAgICAgICAgbWV0cmljczogc2VsZi5tZXRyaWNzKClcbiAgICAgICAgICAuY2FsbChub2RlLCBkLCBpKVxuICAgICAgICAgIC5tYXAobWV0cmljKVxuICAgICAgfTtcbiAgICB9KTtcblxuICAgIGZ1bmN0aW9uIG1ldHJpYyhkLCBpKSB7XG4gICAgICB2YXIga2V5ID0gc2VsZi5rZXkoKVxuICAgICAgICAuY2FsbChub2RlLCBkLCBpKVxuICAgICAgICAudG9TdHJpbmcoKTtcblxuICAgICAgcmV0dXJuIHtcbiAgICAgICAga2V5OiBrZXksXG4gICAgICAgIGNvbG9yOiBzZWxmLmNvbG9ycygpKGtleSksXG4gICAgICAgIHRpdGxlOiBzZWxmLm1ldHJpY1RpdGxlKCkuY2FsbChub2RlLCBkLCBpKSxcbiAgICAgICAgdmFsdWU6IHNlbGYudmFsdWUoKS5jYWxsKG5vZGUsIGQsIGkpXG4gICAgICB9O1xuICAgIH1cblxuICAgIHZhciBzdW0gPSBkMy5zdW0oZWwuZGF0dW0oKS5tZXRyaWNzLCBmdW5jdGlvbihkKSB7IHJldHVybiBkLnZhbHVlOyB9KTtcbiAgICBlbC5kYXR1bSgpLm1ldHJpY3MuZm9yRWFjaChmdW5jdGlvbihkKSB7IGQucGVyY2VudCA9IGQudmFsdWUgLyBzdW07IH0pO1xuICB9KVxuXG4gIC5lbnRlcihmdW5jdGlvbihlbCkge1xuICAgIGVsLmF0dHIoJ2NsYXNzJywgJ3BpZSB3aWRnZXQnKTtcblxuICAgIGVsLmFwcGVuZCgnZGl2JylcbiAgICAgIC5hdHRyKCdjbGFzcycsICd0aXRsZScpO1xuXG4gICAgZWwuYXBwZW5kKCdkaXYnKVxuICAgICAgLmF0dHIoJ2NsYXNzJywgJ2NoYXJ0Jyk7XG5cbiAgICBlbC5hcHBlbmQoJ2RpdicpXG4gICAgICAuYXR0cignY2xhc3MnLCAnbGVnZW5kJyk7XG4gIH0pXG5cbiAgLmRyYXcoZnVuY3Rpb24oZWwpIHtcbiAgICB0aGlzLm5vcm1hbGl6ZShlbCk7XG5cbiAgICBlbC5zdHlsZSgnd2lkdGgnLCB1dGlscy5weCh0aGlzLndpZHRoKCkpKTtcblxuICAgIGVsLnNlbGVjdCgnLndpZGdldCAudGl0bGUnKVxuICAgICAgLnRleHQoZnVuY3Rpb24oZCkgeyByZXR1cm4gZC50aXRsZTsgfSk7XG5cbiAgICBlbC5zZWxlY3QoJy5sZWdlbmQnKVxuICAgICAgLmNhbGwobGVnZW5kKHRoaXMpKTtcblxuICAgIGVsLnNlbGVjdCgnLmNoYXJ0JylcbiAgICAgIC5jYWxsKGNoYXJ0KHRoaXMpKTtcbiAgfSk7XG5cblxudmFyIGNoYXJ0ID0gcmVxdWlyZSgnLi4vdmlldycpLmV4dGVuZCgpXG4gIC5wcm9wKCd3aWRnZXQnKVxuXG4gIC5pbml0KGZ1bmN0aW9uKHdpZGdldCkge1xuICAgIHRoaXMud2lkZ2V0KHdpZGdldCk7XG4gIH0pXG5cbiAgLmVudGVyKGZ1bmN0aW9uKGVsKSB7XG4gICAgZWwuYXBwZW5kKCdzdmcnKVxuICAgICAgLmFwcGVuZCgnZycpO1xuICB9KVxuXG4gIC5kcmF3KGZ1bmN0aW9uKGVsKSB7XG4gICAgdmFyIHdpZHRoID0gdXRpbHMuaW5uZXJXaWR0aChlbCk7XG5cbiAgICB2YXIgZGltcyA9IHV0aWxzLmJveCgpXG4gICAgICAubWFyZ2luKHRoaXMud2lkZ2V0KCkubWFyZ2luKCkpXG4gICAgICAud2lkdGgod2lkdGgpXG4gICAgICAuaGVpZ2h0KHdpZHRoKVxuICAgICAgLmNhbGMoKTtcblxuICAgIHZhciByYWRpdXMgPSBNYXRoLm1pbihkaW1zLmlubmVyV2lkdGgsIGRpbXMuaW5uZXJIZWlnaHQpIC8gMjtcblxuICAgIHZhciBzdmcgPSBlbC5zZWxlY3QoJ3N2ZycpXG4gICAgICAuYXR0cignd2lkdGgnLCBkaW1zLndpZHRoKVxuICAgICAgLmF0dHIoJ2hlaWdodCcsIGRpbXMuaGVpZ2h0KVxuICAgICAgLnNlbGVjdCgnZycpXG4gICAgICAgIC5hdHRyKCd0cmFuc2Zvcm0nLCB1dGlscy50cmFuc2xhdGUoXG4gICAgICAgICAgKGRpbXMud2lkdGggLyAyKSAtIHJhZGl1cyxcbiAgICAgICAgICAoZGltcy5oZWlnaHQgLyAyKSAtIHJhZGl1cykpO1xuXG4gICAgdmFyIGFyYyA9IGQzLnN2Zy5hcmMoKVxuICAgICAgLmlubmVyUmFkaXVzKHRoaXMud2lkZ2V0KCkuaW5uZXJSYWRpdXMoKShyYWRpdXMpKVxuICAgICAgLm91dGVyUmFkaXVzKHJhZGl1cyk7XG5cbiAgICB2YXIgbGF5b3V0ID0gZDMubGF5b3V0LnBpZSgpXG4gICAgICAudmFsdWUoZnVuY3Rpb24oZCkgeyByZXR1cm4gZC52YWx1ZTsgfSk7XG5cbiAgICB2YXIgc2xpY2UgPSBzdmcuc2VsZWN0QWxsKCcuc2xpY2UnKVxuICAgICAgLmRhdGEoZnVuY3Rpb24oZCkgeyByZXR1cm4gbGF5b3V0KGQubWV0cmljcyk7IH0sXG4gICAgICAgICAgICBmdW5jdGlvbihkKSB7IHJldHVybiBkLmRhdGEua2V5OyB9KTtcblxuICAgIHNsaWNlLmVudGVyKCkuYXBwZW5kKCdnJylcbiAgICAgIC5hdHRyKCdjbGFzcycsICdzbGljZScpXG4gICAgICAuYXBwZW5kKCdwYXRoJyk7XG5cbiAgICBzbGljZVxuICAgICAgLmF0dHIoJ3RyYW5zZm9ybScsIHV0aWxzLnRyYW5zbGF0ZShyYWRpdXMsIHJhZGl1cykpO1xuXG4gICAgc2xpY2Uuc2VsZWN0KCdwYXRoJylcbiAgICAgIC5hdHRyKCdkJywgYXJjKVxuICAgICAgLnN0eWxlKCdmaWxsJywgZnVuY3Rpb24oZCkgeyByZXR1cm4gZC5kYXRhLmNvbG9yOyB9KTtcblxuICAgIHNsaWNlLmV4aXQoKVxuICAgICAgLnJlbW92ZSgpO1xuICB9KTtcblxuXG52YXIgbGVnZW5kID0gcmVxdWlyZSgnLi4vdmlldycpLmV4dGVuZCgpXG4gIC5wcm9wKCd3aWRnZXQnKVxuXG4gIC5pbml0KGZ1bmN0aW9uKHdpZGdldCkge1xuICAgIHRoaXMud2lkZ2V0KHdpZGdldCk7XG4gIH0pXG5cbiAgLmVudGVyKGZ1bmN0aW9uKGVsKSB7XG4gICAgZWwuYXBwZW5kKCd0YWJsZScpXG4gICAgICAuYXR0cignY2xhc3MnLCAndGFibGUnKTtcbiAgfSlcblxuICAuZHJhdyhmdW5jdGlvbihlbCkge1xuICAgIHZhciB2YWx1ZUZvcm1hdCA9IHRoaXMud2lkZ2V0KCkudmFsdWVGb3JtYXQoKTtcbiAgICB2YXIgcGVyY2VudEZvcm1hdCA9IHRoaXMud2lkZ2V0KCkucGVyY2VudEZvcm1hdCgpO1xuXG4gICAgdmFyIG1ldHJpYyA9IGVsLnNlbGVjdCgnLnRhYmxlJykuc2VsZWN0QWxsKCcubWV0cmljJylcbiAgICAgIC5kYXRhKGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQubWV0cmljczsgfSxcbiAgICAgICAgICAgIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQua2V5OyB9KTtcblxuICAgIHZhciBlbnRlck1ldHJpYyA9IG1ldHJpYy5lbnRlcigpLmFwcGVuZCgndHInKVxuICAgICAgLmF0dHIoJ2NsYXNzJywgJ21ldHJpYycpO1xuXG4gICAgZW50ZXJNZXRyaWMuYXBwZW5kKCd0ZCcpXG4gICAgICAuYXR0cignY2xhc3MnLCAnc3dhdGNoJyk7XG5cbiAgICBlbnRlck1ldHJpYy5hcHBlbmQoJ3RkJylcbiAgICAgIC5hdHRyKCdjbGFzcycsICd0aXRsZScpO1xuXG4gICAgZW50ZXJNZXRyaWMuYXBwZW5kKCd0ZCcpXG4gICAgICAuYXR0cignY2xhc3MnLCAncGVyY2VudCcpO1xuXG4gICAgZW50ZXJNZXRyaWMuYXBwZW5kKCd0ZCcpXG4gICAgICAuYXR0cignY2xhc3MnLCAndmFsdWUnKTtcblxuICAgIG1ldHJpYy5zZWxlY3QoJy5zd2F0Y2gnKVxuICAgICAgLnN0eWxlKCdiYWNrZ3JvdW5kJywgZnVuY3Rpb24oZCkgeyByZXR1cm4gZC5jb2xvcjsgfSk7XG5cbiAgICBtZXRyaWMuc2VsZWN0KCcudGl0bGUnKVxuICAgICAgLnRleHQoZnVuY3Rpb24oZCkgeyByZXR1cm4gZC50aXRsZTsgfSk7XG5cbiAgICBtZXRyaWMuc2VsZWN0KCcucGVyY2VudCcpXG4gICAgICAudGV4dChmdW5jdGlvbihkKSB7IHJldHVybiBwZXJjZW50Rm9ybWF0KGQucGVyY2VudCk7IH0pO1xuXG4gICAgbWV0cmljLnNlbGVjdCgnLnZhbHVlJylcbiAgICAgIC50ZXh0KGZ1bmN0aW9uKGQpIHsgcmV0dXJuIHZhbHVlRm9ybWF0KGQudmFsdWUpOyB9KTtcblxuICAgIG1ldHJpYy5leGl0KClcbiAgICAgIC5yZW1vdmUoKTtcbiAgfSk7XG4iLCJtb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoJy4uL3ZpZXcnKS5leHRlbmQoKVxuICAucHJvcCgnY29sc3BhbicpXG4gIC5kZWZhdWx0KDApXG5cbiAgLnByb3AoJ3Jvd3NwYW4nKVxuICAuZGVmYXVsdCgwKVxuXG4gIC5wcm9wKCd3aWR0aCcpXG4gIC5zZXQoZDMuZnVuY3RvcilcbiAgLmRlZmF1bHQoMClcblxuICAucHJvcCgnaGVpZ2h0JylcbiAgLnNldChkMy5mdW5jdG9yKVxuICAuZGVmYXVsdCgwKTtcbiJdfQ==
(3)
});
