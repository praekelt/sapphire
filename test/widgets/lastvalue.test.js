describe("sapphire.widgets.lastvalue", function() {
  var el;

  beforeEach(function() {
    el = d3.select('body')
      .append('div')
      .attr('class', 'tmp');
  });

  afterEach(function() {
    el.remove();
  });

  it("should show the last value", function() {
    var lastvalue = sapphire.widgets.lastvalue();
    expect(el.html()).to.be.empty;

    el.datum({
      values: [{
        x: 123,
        y: 345
      }, {
        x: 678,
        y: 910
      }]
    });

    lastvalue(el);
    expect(el.selectAll('.last').size()).to.equal(1);
    expect(el.select('.last').text()).to.equal('910');

    el.datum({
      values: [{
        x: 1123,
        y: 1345
      }, {
        x: 1678,
        y: 1910
      }]
    });

    lastvalue(el);
    expect(el.selectAll('.last').size()).to.equal(1);
    expect(el.select('.last').text()).to.equal('1910');
  });

  it("should show the 'none' value if values are available", function() {
    var lastvalue = sapphire.widgets.lastvalue()
      .none(23);

    el.datum({
      values: [{
        x: 123,
        y: 345
      }, {
        x: 678,
        y: 910
      }]
    });

    lastvalue(el);
    expect(el.select('.last').text()).to.equal('910');
  });
});
