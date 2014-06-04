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
});
