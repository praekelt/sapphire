describe("sapphire.grid", function() {
  it("should determine row and column values if they arent present", function() {
    var grid = sapphire.grid()
      .numcols(4);

    var result = grid([{
      colspan: 1,
      rowspan: 1
    }, {
      colspan: 2,
      rowspan: 3
    }, {
      colspan: 1,
      rowspan: 1
    }, {
      colspan: 3,
      rowspan: 4
    }, {
      colspan: 1,
      rowspan: 2
    }, {
      colspan: 3,
      rowspan: 3
    }, {
      colspan: 1,
      rowspan: 1
    }]);

    expect(sapphire.testutils.pick(result, ['col', 'row'])).to.deep.equal([{
      col: 0,
      row: 0,
    }, {
      col: 1,
      row: 0,
    }, {
      col: 3,
      row: 0,
    }, {
      col: 0,
      row: 3,
    }, {
      col: 3,
      row: 3,
    }, {
      col: 0,
      row: 7,
    }, {
      col: 3,
      row: 7,
    }]);
  });

  it("should use row and column values if they are present", function() {
    var grid = sapphire.grid();

    var result = grid([{
      colspan: 1,
      rowspan: 1,
      col: 4,
      row: 3
    }, {
      colspan: 2,
      rowspan: 3,
      col: 4,
      row: 8
    }, {
      colspan: 1,
      rowspan: 1,
      col: 3,
      row: 12
    }]);

    expect(sapphire.testutils.pick(result, ['col', 'row'])).to.deep.equal([{
      col: 4,
      row: 3
    }, {
      col: 4,
      row: 8
    }, {
      col: 3,
      row: 12
    }]);
  });

  it("should resolve collisions", function() {
    var grid = sapphire.grid()
      .numcols(4);

    var result = grid([{
      colspan: 1,
      rowspan: 1,
      col: 0,
      row: 0
    }, {
      colspan: 2,
      rowspan: 3,
      col: 1,
      row: 0
    }, {
      colspan: 1,
      rowspan: 1,
      col: 3,
      row: 0
    }, {
      colspan: 3,
      rowspan: 2,
      col: 1,
      row: 0
    }, {
      colspan: 1,
      rowspan: 1,
      col: 1,
      row: 3
    }, {
      colspan: 2,
      rowspan: 3,
      col: 2,
      row: 3
    }]);

    expect(sapphire.testutils.pick(result, ['col', 'row'])).to.deep.equal([{
      col: 0,
      row: 0
    }, {
      col: 1,
      row: 0
    }, {
      col: 3,
      row: 0
    }, {
      col: 1,
      row: 3
    }, {
      col: 1,
      row: 5
    }, {
      col: 2,
      row: 5
    }]);
  });

  it("should determine the resulting dimensions", function() {
    var grid = sapphire.grid()
      .numcols(4)
      .scale(100)
      .padding(10);

    var result = grid([{
      colspan: 1,
      rowspan: 1
    }, {
      colspan: 2,
      rowspan: 3
    }, {
      colspan: 1,
      rowspan: 1
    }, {
      colspan: 3,
      rowspan: 4
    }, {
      colspan: 1,
      rowspan: 2
    }, {
      colspan: 3,
      rowspan: 3
    }, {
      colspan: 1,
      rowspan: 1
    }]);

    expect(sapphire.testutils.pick(result, ['width', 'height'])).to.deep.equal([{
      width: 80,
      height: 80
    }, {
      width: 180,
      height: 280
    }, {
      width: 80,
      height: 80
    }, {
      width: 280,
      height: 380
    }, {
      width: 80,
      height: 180
    }, {
      width: 280,
      height: 280
    }, {
      width: 80,
      height: 80
    }]);
  });

  it("should determine the resulting positioning", function() {
    var grid = sapphire.grid()
      .scale(100)
      .padding(10);

    var result = grid([{
      colspan: 1,
      rowspan: 1,
      col: 4,
      row: 3
    }, {
      colspan: 2,
      rowspan: 3,
      col: 4,
      row: 8
    }, {
      colspan: 1,
      rowspan: 1,
      col: 3,
      row: 12
    }]);

    expect(sapphire.testutils.pick(result, ['x', 'y'])).to.deep.equal([{
      x: 410,
      y: 310
    }, {
      x: 410,
      y: 810
    }, {
      x: 310,
      y: 1210
    }]);
  });

  describe(".indexOffset", function() {
    it("should determine the offset of the given index", function() {
      var grid = sapphire.grid()
        .scale(10)
        .padding(2);

      expect(grid.indexOffset(0)).to.equal((10 * 0) + 2);
      expect(grid.indexOffset(1)).to.equal((10 * 1) + 2);
      expect(grid.indexOffset(2)).to.equal((10 * 2) + 2);
      expect(grid.indexOffset(3)).to.equal((10 * 3) + 2);
      expect(grid.indexOffset(4)).to.equal((10 * 4) + 2);
    });
  });

  describe(".spanLength", function() {
    it("should determine the span of the given length", function() {
      var grid = sapphire.grid()
        .scale(10)
        .padding(2);

      expect(grid.spanLength(0)).to.equal((10 * 0) - (2 * 2));
      expect(grid.spanLength(1)).to.equal((10 * 1) - (2 * 2));
      expect(grid.spanLength(2)).to.equal((10 * 2) - (2 * 2));
      expect(grid.spanLength(3)).to.equal((10 * 3) - (2 * 2));
      expect(grid.spanLength(4)).to.equal((10 * 4) - (2 * 2));
    });
  });

  describe(".offsetIndex", function() {
    it("should determine the index of the given offset", function() {
      var grid = sapphire.grid()
        .scale(10)
        .padding(2);

      expect(grid.offsetIndex((10 * 0) + 2)).to.equal(0);
      expect(grid.offsetIndex((10 * 1) + 2)).to.equal(1);
      expect(grid.offsetIndex((10 * 2) + 2)).to.equal(2);
      expect(grid.offsetIndex((10 * 3) + 2)).to.equal(3);
      expect(grid.offsetIndex((10 * 4) + 2)).to.equal(4);
    });
  });

  describe(".lengthSpan", function() {
    it("should determine the length of the given span", function() {
      var grid = sapphire.grid()
        .scale(10)
        .padding(2);

      expect(grid.lengthSpan((10 * 0) - (2 * 2))).to.equal(0);
      expect(grid.lengthSpan((10 * 1) - (2 * 2))).to.equal(1);
      expect(grid.lengthSpan((10 * 2) - (2 * 2))).to.equal(2);
      expect(grid.lengthSpan((10 * 3) - (2 * 2))).to.equal(3);
      expect(grid.lengthSpan((10 * 4) - (2 * 2))).to.equal(4);
    });
  });

  describe(".intersection", function() {
    it("should determine whether two boxes intersect", function() {
      var a, b;

      a = {
        x1: 1,
        y1: 0,
        x2: 3,
        y2: 2
      };
      b = {
        x1: 10,
        y1: 20,
        x2: 30,
        y2: 40
      };
      expect(sapphire.grid.intersection(a, b)).to.be.false;

      a = {
        x1: 1,
        y1: 0,
        x2: 3,
        y2: 2
      };
      b = {
        x1: 0,
        y1: 1,
        x2: 2,
        y2: 3
      };
      expect(sapphire.grid.intersection(a, b)).to.be.true;

      a = {
        x1: 0,
        y1: 0,
        x2: 2,
        y2: 2
      };
      b = {
        x1: 1,
        y1: 1,
        x2: 3,
        y2: 3
      };
      expect(sapphire.grid.intersection(a, b)).to.be.true;

      a = {
        x1: 0,
        y1: 1,
        x2: 2,
        y2: 3
      };
      b = {
        x1: 1,
        y1: 0,
        x2: 3,
        y2: 2
      };
      expect(sapphire.grid.intersection(a, b)).to.be.true;

      a = {
        x1: 1,
        y1: 1,
        x2: 3,
        y2: 3
      };
      b = {
        x1: 0,
        y1: 0,
        x2: 2,
        y2: 2
      };
      expect(sapphire.grid.intersection(a, b)).to.be.true;
    });
  });
});
