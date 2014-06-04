describe("sapphire.grid", function() {
  it("should determine row and column values if they arent present", function() {
    var grid = sapphire.grid()
      .numcols(4);

    var data = [{
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
    }];

    expect(grid(data)).to.deep.equal([{
      data: data[0],
      col: 0,
      row: 0,
      colspan: 1,
      rowspan: 1
    }, {
      data: data[1],
      col: 1,
      row: 0,
      colspan: 2,
      rowspan: 3
    }, {
      data: data[2],
      col: 3,
      row: 0,
      colspan: 1,
      rowspan: 1
    }, {
      data: data[3],
      col: 0,
      row: 3,
      colspan: 3,
      rowspan: 4
    }, {
      data: data[4],
      col: 3,
      row: 3,
      colspan: 1,
      rowspan: 2
    }, {
      data: data[5],
      col: 0,
      row: 7,
      colspan: 3,
      rowspan: 3
    }, {
      data: data[6],
      col: 3,
      row: 7,
      colspan: 1,
      rowspan: 1
    }]);
  });

  it("should use row and column values if they are present", function() {
    var grid = sapphire.grid();

    var data = [{
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
    }];

    expect(grid(data)).to.deep.equal([{
      data: data[0],
      col: 4,
      row: 3,
      colspan: 1,
      rowspan: 1
    }, {
      data: data[1],
      col: 4,
      row: 8,
      colspan: 2,
      rowspan: 3
    }, {
      data: data[2],
      col: 3,
      row: 12,
      colspan: 1,
      rowspan: 1
    }]);
  });

  it("should resolve collisions", function() {
    var grid = sapphire.grid()
      .numcols(4);

    var data = [{
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
    }];

    expect(grid(data)).to.deep.equal([{
      colspan: 1,
      rowspan: 1,
      col: 0,
      row: 0,
      data: data[0]
    }, {
      colspan: 2,
      rowspan: 3,
      col: 1,
      row: 0,
      data: data[1]
    }, {
      colspan: 1,
      rowspan: 1,
      col: 3,
      row: 0,
      data: data[2]
    }, {
      colspan: 3,
      rowspan: 2,
      col: 1,
      row: 3,
      data: data[3]
    }, {
      colspan: 1,
      rowspan: 1,
      col: 1,
      row: 5,
      data: data[4]
    }, {
      colspan: 2,
      rowspan: 3,
      col: 2,
      row: 5,
      data: data[5]
    }]);
  });
});
