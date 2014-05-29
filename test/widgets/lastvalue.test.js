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
    var lastvalue = sapphire.widgets.lastvalue(el);
    expect(el.html()).to.be.empty;

    lastvalue({
      values: [{
        x: 123,
        y: 345
      }, {
        x: 678,
        y: 910
      }]
    });

    expect(el.selectAll('.last').size()).to.equal(1);
    expect(el.select('.last').text()).to.equal('910');

    lastvalue({
      values: [{
        x: 1123,
        y: 1345
      }, {
        x: 1678,
        y: 1910
      }]
    });

    expect(el.selectAll('.last').size()).to.equal(1);
    expect(el.select('.last').text()).to.equal('1910');
  });

  it("should show the 'none' value if values are available", function() {
    var lastvalue = sapphire.widgets.lastvalue(el).none(23);

    lastvalue({
      values: [{
        x: 123,
        y: 345
      }, {
        x: 678,
        y: 910
      }]
    });

    expect(el.select('.last').text()).to.equal('910');
  });
});
