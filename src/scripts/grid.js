module.exports = strain()
  .prop('col')
  .set(d3.functor)
  .default(function(d) {
    return access(d, 'col');
  })

  .prop('row')
  .set(d3.functor)
  .default(function(d) {
    return access(d, 'row');
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
    return access(d, 'colspan', 1);
  })

  .prop('rowspan')
  .set(d3.functor)
  .default(function(d) {
    return access(d, 'rowspan', 1);
  })

  .invoke(function(data) {
    var self = this;
    var best = counter().numcols(this.numcols());

    data = (data || []).map(function(d, i) {
      d = {
        data: d,
        col: ensure(self.col().call(self, d, i), best.col()), 
        row: ensure(self.row().call(self, d, i), best.row()),
        rowspan: self.rowspan().call(self, d, i),
        colspan: self.colspan().call(self, d, i)
      };

      best.inc(d);
      return d;
    });

    var quadtree = d3.geom.quadtree()
      .x(function(d) { return d.col; })
      .y(function(d) { return d.row; });

    var root = quadtree(data);

    data.forEach(function(d) {
      root.visit(uncollide(d));
      d.x = d.col * self.scale();
      d.y = d.row * self.scale();
      d.width = (d.colspan * self.scale()) - self.padding();
      d.height = (d.rowspan * self.scale()) - self.padding();
    });

    return data;
  });


var counter = strain()
  .prop('numcols')

  .prop('rowspan')
  .default(0)

  .prop('col')
  .default(0)

  .prop('row')
  .default(0)

  .meth('inc', function(d) {
    var col = d.col + d.colspan;
    var row = this.row();

    if (col >= this.numcols()) {
      col = 0;
      row += this.rowspan();
      this.rowspan(0);
    }

    this
      .col(col)
      .row(row)
      .rowspan(Math.max(this.rowspan(), d.rowspan));
  });


function box(d) {
  return {
    x1: d.col,
    x2: d.col + d.colspan - 1,
    y1: d.row,
    y2: d.row + d.rowspan - 1
  };
}


function uncollide(a) {
  var boxA = box(a);
  
  return function(node, x1, y1, x2, y2) {
    var b = node.point;

    if (b && a !== b && intersection(boxA, box(b))) {
      b.row = boxA.y2 + 1;
    }

    return !intersection(boxA, {
      x1: x1, 
      y1: y1, 
      x2: x2,
      y2: y2
    });
  };
}


function intersection(a, b) {
  return ((a.x1 <= b.x1 && b.x1 <= a.x2) && (a.y1 <= b.y1 && b.y1 <= a.y2))
      || ((b.x1 <= a.x1 && a.x1 <= b.x2) && (b.y1 <= a.y1 && a.y1 <= b.y2));
}


function access(d, name, defaultval) {
  if (arguments.length < 3) {
    defaultval = null;
  }

  return typeof d == 'object' && name in d
    ? d[name]
    : defaultval;
}


function ensure(v, defaultval) {
  return v === null
    ? defaultval
    : v;
}
