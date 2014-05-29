// sapphire 0.0.0


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
module.exports = orderedGrid

function orderedGrid(d3) {
  function layout(starters) {
    var grid = {}
      , event = d3.dispatch('tick')
      , idCounter = 0
      , nodes = []
      , index = {}
      , width = 500
      , height = 500
      , ratio = width / height
      , diameter = 50
      , alpha = 0
      , speed = 0.02
      , ease = d3.ease('linear')
      , align = [0, 0]
      , localWidth
      , localHeight
      , sort
      , rows
      , cols

    grid.sort = function(fn) {
      if (!arguments.length) return sort
      sort = fn; return grid
    }

    // Alignment
    // [horizontal, vertical] or both with a single boolean
    // -1 is left
    //  0 is centered
    // +1 is right
    grid.align = function(c) {
      if (!arguments.length) return c
      align = Array.isArray(c) ? c : [c, c]
      align[0] = align[0] * 0.5 + 0.5
      align[1] = align[1] * 0.5 + 0.5
      return grid
    }

    grid.width = function(w) {
      if (!arguments.length) return width
      ratio = width / height
      width = w; return grid
    }
    grid.height = function(h) {
      if (!arguments.length) return height
      ratio = width / height
      height = h; return grid
    }

    grid.rows = function() {
      return rows
    }
    grid.cols = function() {
      return cols
    }
    grid.size = function() {
      return [localWidth, localHeight]
    }

    // Speed of movement when rearranging
    // the node layout
    grid.speed = function(s) {
      if (!arguments.length) return speed
      speed = s; return grid
    }

    // The distance between nodes on the grid
    grid.radius = function(d) {
      if (!arguments.length) return diameter
      diameter = d / 2; return grid
    }

    // add multiple values to the grid
    grid.add = function(arr) {
      for (var i = 0, l = arr.length; i < l; i += 1) grid.push(arr[i], true)
      return grid.update()
    }

    // add a single value to the grid
    grid.push = function(node, _noLayout) {
      if (typeof node !== 'object') node = {
        id: node
      }

      node.id = String(node.id || idCounter++)

      if (index[node.id]) return

      node.x = node.x || width/2   // x-position
      node.y = node.y || height/2  // y-position
      node.sx = node.sx || width/2  // starting x-position (for animation)
      node.sy = node.sy || height/2 // starting y-position
      node.gx = node.gx || width/2  // goal x-position
      node.gy = node.gy || height/2 // goal y-position

      index[node.id] = node
      nodes.push(node)

      return _noLayout ? grid : grid.update()
    }

    // Update the arrangement of the nodes
    // to fit into a grid. Called automatically
    // after push/add
    grid.update = function() {
      var gridLength = nodes.length

      rows = Math.max(Math.floor(Math.sqrt(gridLength * height / width)), 1)
      cols = Math.ceil(gridLength / rows)
      localWidth = Math.min(width, diameter * cols)
      localHeight = Math.min(height, diameter * rows)

      var offsetX = (width - localWidth) * align[0]
        , offsetY = (height - localHeight) * align[1]
        , i = 0
        , node

      if (sort) nodes.sort(sort)

      toploop:
      for (var x = 0.5; x < cols; x += 1)
      for (var y = 0.5; y < rows; y += 1, i += 1) {
        node = nodes[i]
        if (!node) break toploop
        node.gx = offsetX + localWidth * x / cols
        node.gy = offsetY + localHeight * y / rows
        node.sx = node.x
        node.sy = node.y
      }

      d3.timer(grid.tick)
      alpha = 1

      return grid
    }

    grid.nodes = function(arr) {
      if (!arguments.length) return nodes
      nodes = arr
      return grid
    }

    grid.ease = function(fn) {
      if (!arguments.length) return fn
      if (typeof fn == 'function') {
        ease = fn
      } else {
        ease = d3.ease.apply(d3, Array.prototype.slice.call(arguments))
      }
      return grid
    }

    grid.tick = function() {
      var i = nodes.length
        , node
        , scaled = ease(alpha * alpha)

      while (i--) {
        node = nodes[i]
        node.x = scaled * (node.sx - node.gx) + node.gx
        node.y = scaled * (node.sy - node.gy) + node.gy
        if (Math.abs(node.x) < 0.0001) node.x = 0
        if (Math.abs(node.y) < 0.0001) node.y = 0
      }

      event.tick({ type: 'tick' })

      if (alpha < 0) return true
      alpha -= speed
    }

    grid.add(starters || [])

    return d3.rebind(grid, event, "on")
  }

  return layout
}

},{}],2:[function(_dereq_,module,exports){
var widgets = _dereq_('./widgets');


module.exports = _dereq_('./view').extend()
  .prop('types')

  .confprop('title')
  .set(d3.functor)
  .title(function(d) { return d.title; })

  .confprop('key')
  .set(d3.functor)
  .key(function(d, i) {
    return 'key' in d
      ? d.key
      : i;
  })

  .confprop('type')
  .set(d3.functor)
  .type(function(d) { return d.type; })

  .confprop('widgets')
  .set(d3.functor)
  .widgets(function(d) { return d.widgets; })

  .init(function() {
    var types = d3.map();

    d3.keys(widgets).forEach(function(k) {
      types.set(k, widgets[k].extend());
    });

    this.types(types);
  })

  .draw(function() {
    var self = this;

    var widgets = this.el()
      .html(null)
      .append('div')
        .datum(this.widgets())
        .attr('class', 'widgets');

    var widget = widgets.selectAll('.widget')
      .data(function(d) { return d; }, this.key());

    widget.enter().append('div')
      .attr('class', 'widget')
      .attr('data-key', this.key());

    widget.each(function(d, i) {
      var type = self.type().call(this, d, i);

      if (!self.types().has(type)) {
        throw new Error("Unrecognised dashboard widget type '" + type + "'");
      }

      self.types()
        .get(type)
        .new(this);
    });

    widget.exit().remove();
  });

},{"./view":4,"./widgets":5}],3:[function(_dereq_,module,exports){
d3.layout.grid = _dereq_('d3-grid-layout')(d3);
exports.view = _dereq_('./view');
exports.widgets = _dereq_('./widgets');
exports.dashboard = _dereq_('./dashboard');

},{"./dashboard":2,"./view":4,"./widgets":5,"d3-grid-layout":1}],4:[function(_dereq_,module,exports){
module.exports = strain()
  .static('init', function(fn) {
    strain.init.call(this, function(el) {
      if (el) {
        this.el(el);
      }

      fn.apply(this, arguments);

      if (el && this.el().datum()) {
        this.draw();
      }
    });
  })

  .static('confprop', function(name) {
    this.prop(name);

    this.static(name, function(v) {
      this.prop(name).default(v);
    });
  })

  .static('draw', function(fn) {
    this.meth('draw', function(datum) {
      if (arguments.length) {
        this.el().datum(datum);
      }

      return fn.call(this);
    });
  })

  .prop('el')
  .set(function(v) {
    return !(v instanceof d3.selection)
      ? d3.select(v)
      : v;
  })

  .init(function() {})
  .draw(function() {})

  .invoke(function(datum) {
    return this.draw(datum);
  });

},{}],5:[function(_dereq_,module,exports){
exports.lastvalue = _dereq_('./lastvalue');

},{"./lastvalue":6}],6:[function(_dereq_,module,exports){
module.exports = _dereq_('../view').extend()
  .confprop('title')
  .set(d3.functor)
  .title(function(d) { return d.title; })

  .confprop('values')
  .set(d3.functor)
  .values(function(d) { return d.values; })

  .confprop('x')
  .set(d3.functor)
  .x(function(d) { return d.x; })

  .confprop('y')
  .set(d3.functor)
  .y(function(d) { return d.y; })

  .confprop('format')
  .format(d3.format())

  .confprop('noval')
  .noval(0)

  .draw(function() {
    var self = this;

    this.el()
      .html(null)
      .append('div')
        .datum(this.values())
        .attr('class', 'values')
        .append('text')
          .datum(function(d, i) {
            return d[d.length - 1];
          })
          .attr('class', 'last')
          .text(function(d, i) {
            var v = d
              ? self.y().call(this, d, i)
              : self.noval();

              return self.format()(v);
          });
  });

},{"../view":4}]},{},[3])
(3)
});
}));
