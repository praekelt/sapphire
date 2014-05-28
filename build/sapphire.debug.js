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
d3.layout.grid = _dereq_('d3-grid-layout')(d3);


module.exports = function() {
  console.log(d3.layout.grid);
};

},{"d3-grid-layout":1}]},{},[2])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvaG9tZS9qdXN0aW4vcHJhZWtlbHQvc2FwcGhpcmUvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsIi9ob21lL2p1c3Rpbi9wcmFla2VsdC9zYXBwaGlyZS9ub2RlX21vZHVsZXMvZDMtZ3JpZC1sYXlvdXQvaW5kZXguanMiLCIvaG9tZS9qdXN0aW4vcHJhZWtlbHQvc2FwcGhpcmUvc3JjL3NjcmlwdHMvaW5kZXguanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKX12YXIgZj1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwoZi5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxmLGYuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwibW9kdWxlLmV4cG9ydHMgPSBvcmRlcmVkR3JpZFxuXG5mdW5jdGlvbiBvcmRlcmVkR3JpZChkMykge1xuICBmdW5jdGlvbiBsYXlvdXQoc3RhcnRlcnMpIHtcbiAgICB2YXIgZ3JpZCA9IHt9XG4gICAgICAsIGV2ZW50ID0gZDMuZGlzcGF0Y2goJ3RpY2snKVxuICAgICAgLCBpZENvdW50ZXIgPSAwXG4gICAgICAsIG5vZGVzID0gW11cbiAgICAgICwgaW5kZXggPSB7fVxuICAgICAgLCB3aWR0aCA9IDUwMFxuICAgICAgLCBoZWlnaHQgPSA1MDBcbiAgICAgICwgcmF0aW8gPSB3aWR0aCAvIGhlaWdodFxuICAgICAgLCBkaWFtZXRlciA9IDUwXG4gICAgICAsIGFscGhhID0gMFxuICAgICAgLCBzcGVlZCA9IDAuMDJcbiAgICAgICwgZWFzZSA9IGQzLmVhc2UoJ2xpbmVhcicpXG4gICAgICAsIGFsaWduID0gWzAsIDBdXG4gICAgICAsIGxvY2FsV2lkdGhcbiAgICAgICwgbG9jYWxIZWlnaHRcbiAgICAgICwgc29ydFxuICAgICAgLCByb3dzXG4gICAgICAsIGNvbHNcblxuICAgIGdyaWQuc29ydCA9IGZ1bmN0aW9uKGZuKSB7XG4gICAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiBzb3J0XG4gICAgICBzb3J0ID0gZm47IHJldHVybiBncmlkXG4gICAgfVxuXG4gICAgLy8gQWxpZ25tZW50XG4gICAgLy8gW2hvcml6b250YWwsIHZlcnRpY2FsXSBvciBib3RoIHdpdGggYSBzaW5nbGUgYm9vbGVhblxuICAgIC8vIC0xIGlzIGxlZnRcbiAgICAvLyAgMCBpcyBjZW50ZXJlZFxuICAgIC8vICsxIGlzIHJpZ2h0XG4gICAgZ3JpZC5hbGlnbiA9IGZ1bmN0aW9uKGMpIHtcbiAgICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkgcmV0dXJuIGNcbiAgICAgIGFsaWduID0gQXJyYXkuaXNBcnJheShjKSA/IGMgOiBbYywgY11cbiAgICAgIGFsaWduWzBdID0gYWxpZ25bMF0gKiAwLjUgKyAwLjVcbiAgICAgIGFsaWduWzFdID0gYWxpZ25bMV0gKiAwLjUgKyAwLjVcbiAgICAgIHJldHVybiBncmlkXG4gICAgfVxuXG4gICAgZ3JpZC53aWR0aCA9IGZ1bmN0aW9uKHcpIHtcbiAgICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkgcmV0dXJuIHdpZHRoXG4gICAgICByYXRpbyA9IHdpZHRoIC8gaGVpZ2h0XG4gICAgICB3aWR0aCA9IHc7IHJldHVybiBncmlkXG4gICAgfVxuICAgIGdyaWQuaGVpZ2h0ID0gZnVuY3Rpb24oaCkge1xuICAgICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gaGVpZ2h0XG4gICAgICByYXRpbyA9IHdpZHRoIC8gaGVpZ2h0XG4gICAgICBoZWlnaHQgPSBoOyByZXR1cm4gZ3JpZFxuICAgIH1cblxuICAgIGdyaWQucm93cyA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHJvd3NcbiAgICB9XG4gICAgZ3JpZC5jb2xzID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gY29sc1xuICAgIH1cbiAgICBncmlkLnNpemUgPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBbbG9jYWxXaWR0aCwgbG9jYWxIZWlnaHRdXG4gICAgfVxuXG4gICAgLy8gU3BlZWQgb2YgbW92ZW1lbnQgd2hlbiByZWFycmFuZ2luZ1xuICAgIC8vIHRoZSBub2RlIGxheW91dFxuICAgIGdyaWQuc3BlZWQgPSBmdW5jdGlvbihzKSB7XG4gICAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiBzcGVlZFxuICAgICAgc3BlZWQgPSBzOyByZXR1cm4gZ3JpZFxuICAgIH1cblxuICAgIC8vIFRoZSBkaXN0YW5jZSBiZXR3ZWVuIG5vZGVzIG9uIHRoZSBncmlkXG4gICAgZ3JpZC5yYWRpdXMgPSBmdW5jdGlvbihkKSB7XG4gICAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiBkaWFtZXRlclxuICAgICAgZGlhbWV0ZXIgPSBkIC8gMjsgcmV0dXJuIGdyaWRcbiAgICB9XG5cbiAgICAvLyBhZGQgbXVsdGlwbGUgdmFsdWVzIHRvIHRoZSBncmlkXG4gICAgZ3JpZC5hZGQgPSBmdW5jdGlvbihhcnIpIHtcbiAgICAgIGZvciAodmFyIGkgPSAwLCBsID0gYXJyLmxlbmd0aDsgaSA8IGw7IGkgKz0gMSkgZ3JpZC5wdXNoKGFycltpXSwgdHJ1ZSlcbiAgICAgIHJldHVybiBncmlkLnVwZGF0ZSgpXG4gICAgfVxuXG4gICAgLy8gYWRkIGEgc2luZ2xlIHZhbHVlIHRvIHRoZSBncmlkXG4gICAgZ3JpZC5wdXNoID0gZnVuY3Rpb24obm9kZSwgX25vTGF5b3V0KSB7XG4gICAgICBpZiAodHlwZW9mIG5vZGUgIT09ICdvYmplY3QnKSBub2RlID0ge1xuICAgICAgICBpZDogbm9kZVxuICAgICAgfVxuXG4gICAgICBub2RlLmlkID0gU3RyaW5nKG5vZGUuaWQgfHwgaWRDb3VudGVyKyspXG5cbiAgICAgIGlmIChpbmRleFtub2RlLmlkXSkgcmV0dXJuXG5cbiAgICAgIG5vZGUueCA9IG5vZGUueCB8fCB3aWR0aC8yICAgLy8geC1wb3NpdGlvblxuICAgICAgbm9kZS55ID0gbm9kZS55IHx8IGhlaWdodC8yICAvLyB5LXBvc2l0aW9uXG4gICAgICBub2RlLnN4ID0gbm9kZS5zeCB8fCB3aWR0aC8yICAvLyBzdGFydGluZyB4LXBvc2l0aW9uIChmb3IgYW5pbWF0aW9uKVxuICAgICAgbm9kZS5zeSA9IG5vZGUuc3kgfHwgaGVpZ2h0LzIgLy8gc3RhcnRpbmcgeS1wb3NpdGlvblxuICAgICAgbm9kZS5neCA9IG5vZGUuZ3ggfHwgd2lkdGgvMiAgLy8gZ29hbCB4LXBvc2l0aW9uXG4gICAgICBub2RlLmd5ID0gbm9kZS5neSB8fCBoZWlnaHQvMiAvLyBnb2FsIHktcG9zaXRpb25cblxuICAgICAgaW5kZXhbbm9kZS5pZF0gPSBub2RlXG4gICAgICBub2Rlcy5wdXNoKG5vZGUpXG5cbiAgICAgIHJldHVybiBfbm9MYXlvdXQgPyBncmlkIDogZ3JpZC51cGRhdGUoKVxuICAgIH1cblxuICAgIC8vIFVwZGF0ZSB0aGUgYXJyYW5nZW1lbnQgb2YgdGhlIG5vZGVzXG4gICAgLy8gdG8gZml0IGludG8gYSBncmlkLiBDYWxsZWQgYXV0b21hdGljYWxseVxuICAgIC8vIGFmdGVyIHB1c2gvYWRkXG4gICAgZ3JpZC51cGRhdGUgPSBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBncmlkTGVuZ3RoID0gbm9kZXMubGVuZ3RoXG5cbiAgICAgIHJvd3MgPSBNYXRoLm1heChNYXRoLmZsb29yKE1hdGguc3FydChncmlkTGVuZ3RoICogaGVpZ2h0IC8gd2lkdGgpKSwgMSlcbiAgICAgIGNvbHMgPSBNYXRoLmNlaWwoZ3JpZExlbmd0aCAvIHJvd3MpXG4gICAgICBsb2NhbFdpZHRoID0gTWF0aC5taW4od2lkdGgsIGRpYW1ldGVyICogY29scylcbiAgICAgIGxvY2FsSGVpZ2h0ID0gTWF0aC5taW4oaGVpZ2h0LCBkaWFtZXRlciAqIHJvd3MpXG5cbiAgICAgIHZhciBvZmZzZXRYID0gKHdpZHRoIC0gbG9jYWxXaWR0aCkgKiBhbGlnblswXVxuICAgICAgICAsIG9mZnNldFkgPSAoaGVpZ2h0IC0gbG9jYWxIZWlnaHQpICogYWxpZ25bMV1cbiAgICAgICAgLCBpID0gMFxuICAgICAgICAsIG5vZGVcblxuICAgICAgaWYgKHNvcnQpIG5vZGVzLnNvcnQoc29ydClcblxuICAgICAgdG9wbG9vcDpcbiAgICAgIGZvciAodmFyIHggPSAwLjU7IHggPCBjb2xzOyB4ICs9IDEpXG4gICAgICBmb3IgKHZhciB5ID0gMC41OyB5IDwgcm93czsgeSArPSAxLCBpICs9IDEpIHtcbiAgICAgICAgbm9kZSA9IG5vZGVzW2ldXG4gICAgICAgIGlmICghbm9kZSkgYnJlYWsgdG9wbG9vcFxuICAgICAgICBub2RlLmd4ID0gb2Zmc2V0WCArIGxvY2FsV2lkdGggKiB4IC8gY29sc1xuICAgICAgICBub2RlLmd5ID0gb2Zmc2V0WSArIGxvY2FsSGVpZ2h0ICogeSAvIHJvd3NcbiAgICAgICAgbm9kZS5zeCA9IG5vZGUueFxuICAgICAgICBub2RlLnN5ID0gbm9kZS55XG4gICAgICB9XG5cbiAgICAgIGQzLnRpbWVyKGdyaWQudGljaylcbiAgICAgIGFscGhhID0gMVxuXG4gICAgICByZXR1cm4gZ3JpZFxuICAgIH1cblxuICAgIGdyaWQubm9kZXMgPSBmdW5jdGlvbihhcnIpIHtcbiAgICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkgcmV0dXJuIG5vZGVzXG4gICAgICBub2RlcyA9IGFyclxuICAgICAgcmV0dXJuIGdyaWRcbiAgICB9XG5cbiAgICBncmlkLmVhc2UgPSBmdW5jdGlvbihmbikge1xuICAgICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gZm5cbiAgICAgIGlmICh0eXBlb2YgZm4gPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICBlYXNlID0gZm5cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGVhc2UgPSBkMy5lYXNlLmFwcGx5KGQzLCBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpKVxuICAgICAgfVxuICAgICAgcmV0dXJuIGdyaWRcbiAgICB9XG5cbiAgICBncmlkLnRpY2sgPSBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBpID0gbm9kZXMubGVuZ3RoXG4gICAgICAgICwgbm9kZVxuICAgICAgICAsIHNjYWxlZCA9IGVhc2UoYWxwaGEgKiBhbHBoYSlcblxuICAgICAgd2hpbGUgKGktLSkge1xuICAgICAgICBub2RlID0gbm9kZXNbaV1cbiAgICAgICAgbm9kZS54ID0gc2NhbGVkICogKG5vZGUuc3ggLSBub2RlLmd4KSArIG5vZGUuZ3hcbiAgICAgICAgbm9kZS55ID0gc2NhbGVkICogKG5vZGUuc3kgLSBub2RlLmd5KSArIG5vZGUuZ3lcbiAgICAgICAgaWYgKE1hdGguYWJzKG5vZGUueCkgPCAwLjAwMDEpIG5vZGUueCA9IDBcbiAgICAgICAgaWYgKE1hdGguYWJzKG5vZGUueSkgPCAwLjAwMDEpIG5vZGUueSA9IDBcbiAgICAgIH1cblxuICAgICAgZXZlbnQudGljayh7IHR5cGU6ICd0aWNrJyB9KVxuXG4gICAgICBpZiAoYWxwaGEgPCAwKSByZXR1cm4gdHJ1ZVxuICAgICAgYWxwaGEgLT0gc3BlZWRcbiAgICB9XG5cbiAgICBncmlkLmFkZChzdGFydGVycyB8fCBbXSlcblxuICAgIHJldHVybiBkMy5yZWJpbmQoZ3JpZCwgZXZlbnQsIFwib25cIilcbiAgfVxuXG4gIHJldHVybiBsYXlvdXRcbn1cbiIsImQzLmxheW91dC5ncmlkID0gcmVxdWlyZSgnZDMtZ3JpZC1sYXlvdXQnKShkMyk7XG5cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbigpIHtcbiAgY29uc29sZS5sb2coZDMubGF5b3V0LmdyaWQpO1xufTtcbiJdfQ==
(2)
});
