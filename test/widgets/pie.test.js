describe("sapphire.widgets.pie", function() {
  var el;
  var datum;

  beforeEach(function() {
    el = d3.select('body')
      .append('div')
      .attr('class', 'tmp');

    datum = {
      title: 'Total Foo and Bar',
      metrics: [{
        key: 'foo',
        title: 'Total Foo',
        value: 4000000
      }, {
        key: 'bar',
        title: 'Total Bar',
        value: 4000000
      }]
    };
  });

  afterEach(function() {
    el.remove();
  });

  it("should show its title", function() {
    var pie = sapphire.widgets.pie();
    expect(el.html()).to.be.empty;

    datum.title = 'Total Bar and Baz';

    el.datum(datum)
      .call(pie);

    var title = el.selectAll('.widget > .title');
    expect(title.size()).to.equal(1);
    expect(title.text()).to.equal(datum.title);

    datum.title = 'Total Qux and Corge';

    el.datum(datum)
      .call(pie);

    title = el.selectAll('.widget > .title');
    expect(title.size()).to.equal(1);
    expect(title.text()).to.equal(datum.title);
  });
});
