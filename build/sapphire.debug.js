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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvaG9tZS9qdXN0aW4vcHJhZWtlbHQvc2FwcGhpcmUvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsIi9ob21lL2p1c3Rpbi9wcmFla2VsdC9zYXBwaGlyZS9ub2RlX21vZHVsZXMvZDMtZ3JpZC1sYXlvdXQvaW5kZXguanMiLCIvaG9tZS9qdXN0aW4vcHJhZWtlbHQvc2FwcGhpcmUvc3JjL3NjcmlwdHMvZGFzaGJvYXJkLmpzIiwiL2hvbWUvanVzdGluL3ByYWVrZWx0L3NhcHBoaXJlL3NyYy9zY3JpcHRzL2luZGV4LmpzIiwiL2hvbWUvanVzdGluL3ByYWVrZWx0L3NhcHBoaXJlL3NyYy9zY3JpcHRzL3ZpZXcuanMiLCIvaG9tZS9qdXN0aW4vcHJhZWtlbHQvc2FwcGhpcmUvc3JjL3NjcmlwdHMvd2lkZ2V0cy9pbmRleC5qcyIsIi9ob21lL2p1c3Rpbi9wcmFla2VsdC9zYXBwaGlyZS9zcmMvc2NyaXB0cy93aWRnZXRzL2xhc3R2YWx1ZS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckxBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUNBO0FBQ0E7O0FDREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpfXZhciBmPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChmLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGYsZi5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJtb2R1bGUuZXhwb3J0cyA9IG9yZGVyZWRHcmlkXG5cbmZ1bmN0aW9uIG9yZGVyZWRHcmlkKGQzKSB7XG4gIGZ1bmN0aW9uIGxheW91dChzdGFydGVycykge1xuICAgIHZhciBncmlkID0ge31cbiAgICAgICwgZXZlbnQgPSBkMy5kaXNwYXRjaCgndGljaycpXG4gICAgICAsIGlkQ291bnRlciA9IDBcbiAgICAgICwgbm9kZXMgPSBbXVxuICAgICAgLCBpbmRleCA9IHt9XG4gICAgICAsIHdpZHRoID0gNTAwXG4gICAgICAsIGhlaWdodCA9IDUwMFxuICAgICAgLCByYXRpbyA9IHdpZHRoIC8gaGVpZ2h0XG4gICAgICAsIGRpYW1ldGVyID0gNTBcbiAgICAgICwgYWxwaGEgPSAwXG4gICAgICAsIHNwZWVkID0gMC4wMlxuICAgICAgLCBlYXNlID0gZDMuZWFzZSgnbGluZWFyJylcbiAgICAgICwgYWxpZ24gPSBbMCwgMF1cbiAgICAgICwgbG9jYWxXaWR0aFxuICAgICAgLCBsb2NhbEhlaWdodFxuICAgICAgLCBzb3J0XG4gICAgICAsIHJvd3NcbiAgICAgICwgY29sc1xuXG4gICAgZ3JpZC5zb3J0ID0gZnVuY3Rpb24oZm4pIHtcbiAgICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkgcmV0dXJuIHNvcnRcbiAgICAgIHNvcnQgPSBmbjsgcmV0dXJuIGdyaWRcbiAgICB9XG5cbiAgICAvLyBBbGlnbm1lbnRcbiAgICAvLyBbaG9yaXpvbnRhbCwgdmVydGljYWxdIG9yIGJvdGggd2l0aCBhIHNpbmdsZSBib29sZWFuXG4gICAgLy8gLTEgaXMgbGVmdFxuICAgIC8vICAwIGlzIGNlbnRlcmVkXG4gICAgLy8gKzEgaXMgcmlnaHRcbiAgICBncmlkLmFsaWduID0gZnVuY3Rpb24oYykge1xuICAgICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gY1xuICAgICAgYWxpZ24gPSBBcnJheS5pc0FycmF5KGMpID8gYyA6IFtjLCBjXVxuICAgICAgYWxpZ25bMF0gPSBhbGlnblswXSAqIDAuNSArIDAuNVxuICAgICAgYWxpZ25bMV0gPSBhbGlnblsxXSAqIDAuNSArIDAuNVxuICAgICAgcmV0dXJuIGdyaWRcbiAgICB9XG5cbiAgICBncmlkLndpZHRoID0gZnVuY3Rpb24odykge1xuICAgICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gd2lkdGhcbiAgICAgIHJhdGlvID0gd2lkdGggLyBoZWlnaHRcbiAgICAgIHdpZHRoID0gdzsgcmV0dXJuIGdyaWRcbiAgICB9XG4gICAgZ3JpZC5oZWlnaHQgPSBmdW5jdGlvbihoKSB7XG4gICAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiBoZWlnaHRcbiAgICAgIHJhdGlvID0gd2lkdGggLyBoZWlnaHRcbiAgICAgIGhlaWdodCA9IGg7IHJldHVybiBncmlkXG4gICAgfVxuXG4gICAgZ3JpZC5yb3dzID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gcm93c1xuICAgIH1cbiAgICBncmlkLmNvbHMgPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBjb2xzXG4gICAgfVxuICAgIGdyaWQuc2l6ZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIFtsb2NhbFdpZHRoLCBsb2NhbEhlaWdodF1cbiAgICB9XG5cbiAgICAvLyBTcGVlZCBvZiBtb3ZlbWVudCB3aGVuIHJlYXJyYW5naW5nXG4gICAgLy8gdGhlIG5vZGUgbGF5b3V0XG4gICAgZ3JpZC5zcGVlZCA9IGZ1bmN0aW9uKHMpIHtcbiAgICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkgcmV0dXJuIHNwZWVkXG4gICAgICBzcGVlZCA9IHM7IHJldHVybiBncmlkXG4gICAgfVxuXG4gICAgLy8gVGhlIGRpc3RhbmNlIGJldHdlZW4gbm9kZXMgb24gdGhlIGdyaWRcbiAgICBncmlkLnJhZGl1cyA9IGZ1bmN0aW9uKGQpIHtcbiAgICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkgcmV0dXJuIGRpYW1ldGVyXG4gICAgICBkaWFtZXRlciA9IGQgLyAyOyByZXR1cm4gZ3JpZFxuICAgIH1cblxuICAgIC8vIGFkZCBtdWx0aXBsZSB2YWx1ZXMgdG8gdGhlIGdyaWRcbiAgICBncmlkLmFkZCA9IGZ1bmN0aW9uKGFycikge1xuICAgICAgZm9yICh2YXIgaSA9IDAsIGwgPSBhcnIubGVuZ3RoOyBpIDwgbDsgaSArPSAxKSBncmlkLnB1c2goYXJyW2ldLCB0cnVlKVxuICAgICAgcmV0dXJuIGdyaWQudXBkYXRlKClcbiAgICB9XG5cbiAgICAvLyBhZGQgYSBzaW5nbGUgdmFsdWUgdG8gdGhlIGdyaWRcbiAgICBncmlkLnB1c2ggPSBmdW5jdGlvbihub2RlLCBfbm9MYXlvdXQpIHtcbiAgICAgIGlmICh0eXBlb2Ygbm9kZSAhPT0gJ29iamVjdCcpIG5vZGUgPSB7XG4gICAgICAgIGlkOiBub2RlXG4gICAgICB9XG5cbiAgICAgIG5vZGUuaWQgPSBTdHJpbmcobm9kZS5pZCB8fCBpZENvdW50ZXIrKylcblxuICAgICAgaWYgKGluZGV4W25vZGUuaWRdKSByZXR1cm5cblxuICAgICAgbm9kZS54ID0gbm9kZS54IHx8IHdpZHRoLzIgICAvLyB4LXBvc2l0aW9uXG4gICAgICBub2RlLnkgPSBub2RlLnkgfHwgaGVpZ2h0LzIgIC8vIHktcG9zaXRpb25cbiAgICAgIG5vZGUuc3ggPSBub2RlLnN4IHx8IHdpZHRoLzIgIC8vIHN0YXJ0aW5nIHgtcG9zaXRpb24gKGZvciBhbmltYXRpb24pXG4gICAgICBub2RlLnN5ID0gbm9kZS5zeSB8fCBoZWlnaHQvMiAvLyBzdGFydGluZyB5LXBvc2l0aW9uXG4gICAgICBub2RlLmd4ID0gbm9kZS5neCB8fCB3aWR0aC8yICAvLyBnb2FsIHgtcG9zaXRpb25cbiAgICAgIG5vZGUuZ3kgPSBub2RlLmd5IHx8IGhlaWdodC8yIC8vIGdvYWwgeS1wb3NpdGlvblxuXG4gICAgICBpbmRleFtub2RlLmlkXSA9IG5vZGVcbiAgICAgIG5vZGVzLnB1c2gobm9kZSlcblxuICAgICAgcmV0dXJuIF9ub0xheW91dCA/IGdyaWQgOiBncmlkLnVwZGF0ZSgpXG4gICAgfVxuXG4gICAgLy8gVXBkYXRlIHRoZSBhcnJhbmdlbWVudCBvZiB0aGUgbm9kZXNcbiAgICAvLyB0byBmaXQgaW50byBhIGdyaWQuIENhbGxlZCBhdXRvbWF0aWNhbGx5XG4gICAgLy8gYWZ0ZXIgcHVzaC9hZGRcbiAgICBncmlkLnVwZGF0ZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIGdyaWRMZW5ndGggPSBub2Rlcy5sZW5ndGhcblxuICAgICAgcm93cyA9IE1hdGgubWF4KE1hdGguZmxvb3IoTWF0aC5zcXJ0KGdyaWRMZW5ndGggKiBoZWlnaHQgLyB3aWR0aCkpLCAxKVxuICAgICAgY29scyA9IE1hdGguY2VpbChncmlkTGVuZ3RoIC8gcm93cylcbiAgICAgIGxvY2FsV2lkdGggPSBNYXRoLm1pbih3aWR0aCwgZGlhbWV0ZXIgKiBjb2xzKVxuICAgICAgbG9jYWxIZWlnaHQgPSBNYXRoLm1pbihoZWlnaHQsIGRpYW1ldGVyICogcm93cylcblxuICAgICAgdmFyIG9mZnNldFggPSAod2lkdGggLSBsb2NhbFdpZHRoKSAqIGFsaWduWzBdXG4gICAgICAgICwgb2Zmc2V0WSA9IChoZWlnaHQgLSBsb2NhbEhlaWdodCkgKiBhbGlnblsxXVxuICAgICAgICAsIGkgPSAwXG4gICAgICAgICwgbm9kZVxuXG4gICAgICBpZiAoc29ydCkgbm9kZXMuc29ydChzb3J0KVxuXG4gICAgICB0b3Bsb29wOlxuICAgICAgZm9yICh2YXIgeCA9IDAuNTsgeCA8IGNvbHM7IHggKz0gMSlcbiAgICAgIGZvciAodmFyIHkgPSAwLjU7IHkgPCByb3dzOyB5ICs9IDEsIGkgKz0gMSkge1xuICAgICAgICBub2RlID0gbm9kZXNbaV1cbiAgICAgICAgaWYgKCFub2RlKSBicmVhayB0b3Bsb29wXG4gICAgICAgIG5vZGUuZ3ggPSBvZmZzZXRYICsgbG9jYWxXaWR0aCAqIHggLyBjb2xzXG4gICAgICAgIG5vZGUuZ3kgPSBvZmZzZXRZICsgbG9jYWxIZWlnaHQgKiB5IC8gcm93c1xuICAgICAgICBub2RlLnN4ID0gbm9kZS54XG4gICAgICAgIG5vZGUuc3kgPSBub2RlLnlcbiAgICAgIH1cblxuICAgICAgZDMudGltZXIoZ3JpZC50aWNrKVxuICAgICAgYWxwaGEgPSAxXG5cbiAgICAgIHJldHVybiBncmlkXG4gICAgfVxuXG4gICAgZ3JpZC5ub2RlcyA9IGZ1bmN0aW9uKGFycikge1xuICAgICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gbm9kZXNcbiAgICAgIG5vZGVzID0gYXJyXG4gICAgICByZXR1cm4gZ3JpZFxuICAgIH1cblxuICAgIGdyaWQuZWFzZSA9IGZ1bmN0aW9uKGZuKSB7XG4gICAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiBmblxuICAgICAgaWYgKHR5cGVvZiBmbiA9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIGVhc2UgPSBmblxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZWFzZSA9IGQzLmVhc2UuYXBwbHkoZDMsIEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cykpXG4gICAgICB9XG4gICAgICByZXR1cm4gZ3JpZFxuICAgIH1cblxuICAgIGdyaWQudGljayA9IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIGkgPSBub2Rlcy5sZW5ndGhcbiAgICAgICAgLCBub2RlXG4gICAgICAgICwgc2NhbGVkID0gZWFzZShhbHBoYSAqIGFscGhhKVxuXG4gICAgICB3aGlsZSAoaS0tKSB7XG4gICAgICAgIG5vZGUgPSBub2Rlc1tpXVxuICAgICAgICBub2RlLnggPSBzY2FsZWQgKiAobm9kZS5zeCAtIG5vZGUuZ3gpICsgbm9kZS5neFxuICAgICAgICBub2RlLnkgPSBzY2FsZWQgKiAobm9kZS5zeSAtIG5vZGUuZ3kpICsgbm9kZS5neVxuICAgICAgICBpZiAoTWF0aC5hYnMobm9kZS54KSA8IDAuMDAwMSkgbm9kZS54ID0gMFxuICAgICAgICBpZiAoTWF0aC5hYnMobm9kZS55KSA8IDAuMDAwMSkgbm9kZS55ID0gMFxuICAgICAgfVxuXG4gICAgICBldmVudC50aWNrKHsgdHlwZTogJ3RpY2snIH0pXG5cbiAgICAgIGlmIChhbHBoYSA8IDApIHJldHVybiB0cnVlXG4gICAgICBhbHBoYSAtPSBzcGVlZFxuICAgIH1cblxuICAgIGdyaWQuYWRkKHN0YXJ0ZXJzIHx8IFtdKVxuXG4gICAgcmV0dXJuIGQzLnJlYmluZChncmlkLCBldmVudCwgXCJvblwiKVxuICB9XG5cbiAgcmV0dXJuIGxheW91dFxufVxuIiwidmFyIHdpZGdldHMgPSByZXF1aXJlKCcuL3dpZGdldHMnKTtcblxuXG5tb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoJy4vdmlldycpLmV4dGVuZCgpXG4gIC5wcm9wKCd0eXBlcycpXG5cbiAgLmNvbmZwcm9wKCd0aXRsZScpXG4gIC5zZXQoZDMuZnVuY3RvcilcbiAgLnRpdGxlKGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQudGl0bGU7IH0pXG5cbiAgLmNvbmZwcm9wKCdrZXknKVxuICAuc2V0KGQzLmZ1bmN0b3IpXG4gIC5rZXkoZnVuY3Rpb24oZCwgaSkge1xuICAgIHJldHVybiAna2V5JyBpbiBkXG4gICAgICA/IGQua2V5XG4gICAgICA6IGk7XG4gIH0pXG5cbiAgLmNvbmZwcm9wKCd0eXBlJylcbiAgLnNldChkMy5mdW5jdG9yKVxuICAudHlwZShmdW5jdGlvbihkKSB7IHJldHVybiBkLnR5cGU7IH0pXG5cbiAgLmNvbmZwcm9wKCd3aWRnZXRzJylcbiAgLnNldChkMy5mdW5jdG9yKVxuICAud2lkZ2V0cyhmdW5jdGlvbihkKSB7IHJldHVybiBkLndpZGdldHM7IH0pXG5cbiAgLmluaXQoZnVuY3Rpb24oKSB7XG4gICAgdmFyIHR5cGVzID0gZDMubWFwKCk7XG5cbiAgICBkMy5rZXlzKHdpZGdldHMpLmZvckVhY2goZnVuY3Rpb24oaykge1xuICAgICAgdHlwZXMuc2V0KGssIHdpZGdldHNba10uZXh0ZW5kKCkpO1xuICAgIH0pO1xuXG4gICAgdGhpcy50eXBlcyh0eXBlcyk7XG4gIH0pXG5cbiAgLmRyYXcoZnVuY3Rpb24oKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgdmFyIHdpZGdldHMgPSB0aGlzLmVsKClcbiAgICAgIC5odG1sKG51bGwpXG4gICAgICAuYXBwZW5kKCdkaXYnKVxuICAgICAgICAuZGF0dW0odGhpcy53aWRnZXRzKCkpXG4gICAgICAgIC5hdHRyKCdjbGFzcycsICd3aWRnZXRzJyk7XG5cbiAgICB2YXIgd2lkZ2V0ID0gd2lkZ2V0cy5zZWxlY3RBbGwoJy53aWRnZXQnKVxuICAgICAgLmRhdGEoZnVuY3Rpb24oZCkgeyByZXR1cm4gZDsgfSwgdGhpcy5rZXkoKSk7XG5cbiAgICB3aWRnZXQuZW50ZXIoKS5hcHBlbmQoJ2RpdicpXG4gICAgICAuYXR0cignY2xhc3MnLCAnd2lkZ2V0JylcbiAgICAgIC5hdHRyKCdkYXRhLWtleScsIHRoaXMua2V5KCkpO1xuXG4gICAgd2lkZ2V0LmVhY2goZnVuY3Rpb24oZCwgaSkge1xuICAgICAgdmFyIHR5cGUgPSBzZWxmLnR5cGUoKS5jYWxsKHRoaXMsIGQsIGkpO1xuXG4gICAgICBpZiAoIXNlbGYudHlwZXMoKS5oYXModHlwZSkpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVW5yZWNvZ25pc2VkIGRhc2hib2FyZCB3aWRnZXQgdHlwZSAnXCIgKyB0eXBlICsgXCInXCIpO1xuICAgICAgfVxuXG4gICAgICBzZWxmLnR5cGVzKClcbiAgICAgICAgLmdldCh0eXBlKVxuICAgICAgICAubmV3KHRoaXMpO1xuICAgIH0pO1xuXG4gICAgd2lkZ2V0LmV4aXQoKS5yZW1vdmUoKTtcbiAgfSk7XG4iLCJkMy5sYXlvdXQuZ3JpZCA9IHJlcXVpcmUoJ2QzLWdyaWQtbGF5b3V0JykoZDMpO1xuZXhwb3J0cy52aWV3ID0gcmVxdWlyZSgnLi92aWV3Jyk7XG5leHBvcnRzLndpZGdldHMgPSByZXF1aXJlKCcuL3dpZGdldHMnKTtcbmV4cG9ydHMuZGFzaGJvYXJkID0gcmVxdWlyZSgnLi9kYXNoYm9hcmQnKTtcbiIsIm1vZHVsZS5leHBvcnRzID0gc3RyYWluKClcbiAgLnN0YXRpYygnaW5pdCcsIGZ1bmN0aW9uKGZuKSB7XG4gICAgc3RyYWluLmluaXQuY2FsbCh0aGlzLCBmdW5jdGlvbihlbCkge1xuICAgICAgaWYgKGVsKSB7XG4gICAgICAgIHRoaXMuZWwoZWwpO1xuICAgICAgfVxuXG4gICAgICBmbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuXG4gICAgICBpZiAoZWwgJiYgdGhpcy5lbCgpLmRhdHVtKCkpIHtcbiAgICAgICAgdGhpcy5kcmF3KCk7XG4gICAgICB9XG4gICAgfSk7XG4gIH0pXG5cbiAgLnN0YXRpYygnY29uZnByb3AnLCBmdW5jdGlvbihuYW1lKSB7XG4gICAgdGhpcy5wcm9wKG5hbWUpO1xuXG4gICAgdGhpcy5zdGF0aWMobmFtZSwgZnVuY3Rpb24odikge1xuICAgICAgdGhpcy5wcm9wKG5hbWUpLmRlZmF1bHQodik7XG4gICAgfSk7XG4gIH0pXG5cbiAgLnN0YXRpYygnZHJhdycsIGZ1bmN0aW9uKGZuKSB7XG4gICAgdGhpcy5tZXRoKCdkcmF3JywgZnVuY3Rpb24oZGF0dW0pIHtcbiAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoKSB7XG4gICAgICAgIHRoaXMuZWwoKS5kYXR1bShkYXR1bSk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBmbi5jYWxsKHRoaXMpO1xuICAgIH0pO1xuICB9KVxuXG4gIC5wcm9wKCdlbCcpXG4gIC5zZXQoZnVuY3Rpb24odikge1xuICAgIHJldHVybiAhKHYgaW5zdGFuY2VvZiBkMy5zZWxlY3Rpb24pXG4gICAgICA/IGQzLnNlbGVjdCh2KVxuICAgICAgOiB2O1xuICB9KVxuXG4gIC5pbml0KGZ1bmN0aW9uKCkge30pXG4gIC5kcmF3KGZ1bmN0aW9uKCkge30pXG5cbiAgLmludm9rZShmdW5jdGlvbihkYXR1bSkge1xuICAgIHJldHVybiB0aGlzLmRyYXcoZGF0dW0pO1xuICB9KTtcbiIsImV4cG9ydHMubGFzdHZhbHVlID0gcmVxdWlyZSgnLi9sYXN0dmFsdWUnKTtcbiIsIm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSgnLi4vdmlldycpLmV4dGVuZCgpXG4gIC5jb25mcHJvcCgndGl0bGUnKVxuICAuc2V0KGQzLmZ1bmN0b3IpXG4gIC50aXRsZShmdW5jdGlvbihkKSB7IHJldHVybiBkLnRpdGxlOyB9KVxuXG4gIC5jb25mcHJvcCgndmFsdWVzJylcbiAgLnNldChkMy5mdW5jdG9yKVxuICAudmFsdWVzKGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQudmFsdWVzOyB9KVxuXG4gIC5jb25mcHJvcCgneCcpXG4gIC5zZXQoZDMuZnVuY3RvcilcbiAgLngoZnVuY3Rpb24oZCkgeyByZXR1cm4gZC54OyB9KVxuXG4gIC5jb25mcHJvcCgneScpXG4gIC5zZXQoZDMuZnVuY3RvcilcbiAgLnkoZnVuY3Rpb24oZCkgeyByZXR1cm4gZC55OyB9KVxuXG4gIC5jb25mcHJvcCgnZm9ybWF0JylcbiAgLmZvcm1hdChkMy5mb3JtYXQoKSlcblxuICAuY29uZnByb3AoJ25vdmFsJylcbiAgLm5vdmFsKDApXG5cbiAgLmRyYXcoZnVuY3Rpb24oKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgdGhpcy5lbCgpXG4gICAgICAuaHRtbChudWxsKVxuICAgICAgLmFwcGVuZCgnZGl2JylcbiAgICAgICAgLmRhdHVtKHRoaXMudmFsdWVzKCkpXG4gICAgICAgIC5hdHRyKCdjbGFzcycsICd2YWx1ZXMnKVxuICAgICAgICAuYXBwZW5kKCd0ZXh0JylcbiAgICAgICAgICAuZGF0dW0oZnVuY3Rpb24oZCwgaSkge1xuICAgICAgICAgICAgcmV0dXJuIGRbZC5sZW5ndGggLSAxXTtcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5hdHRyKCdjbGFzcycsICdsYXN0JylcbiAgICAgICAgICAudGV4dChmdW5jdGlvbihkLCBpKSB7XG4gICAgICAgICAgICB2YXIgdiA9IGRcbiAgICAgICAgICAgICAgPyBzZWxmLnkoKS5jYWxsKHRoaXMsIGQsIGkpXG4gICAgICAgICAgICAgIDogc2VsZi5ub3ZhbCgpO1xuXG4gICAgICAgICAgICAgIHJldHVybiBzZWxmLmZvcm1hdCgpKHYpO1xuICAgICAgICAgIH0pO1xuICB9KTtcbiJdfQ==
(3)
});
