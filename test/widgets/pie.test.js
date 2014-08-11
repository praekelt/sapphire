describe("sapphire.widgets.pie", function() {
  var el;
  var datum;
  
  var helpers = {};

  helpers.arc = strain()
    .prop('margin')
    .prop('width')
    .prop('height')
    .prop('innerRadius')
    .prop('data')
    .invoke(function(key) {
      var dims = sapphire.utils.box()
        .margin(this.margin())
        .width(this.width())
        .height(this.height())
        .calc();

      var arc = d3.svg.arc()
        .innerRadius(this.innerRadius())
        .outerRadius(Math.min(dims.innerWidth, dims.innerHeight) / 2);

      var layout = d3.layout.pie()
        .value(function(d) { return d.value; });

      var d = layout(this.data())
        .filter(function(d){ return d.data.key === key; })[0];

      return arc(d);
    });

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
        value: 2000000
      }, {
        key: 'baz',
        title: 'Total Baz',
        value: 3000000
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

  it("should show its slices", function() {
    var pie = sapphire.widgets.pie()
      .key(function(d) { return d.key; });

    expect(el.html()).to.be.empty;

    el.datum(datum)
      .call(pie);

    datum.metrics[0].key = 'foo';
    datum.metrics[1].key = 'bar';
    datum.metrics[2].key = 'baz';

    var slice = el.selectAll('.slice');
    expect(slice.size()).to.equal(3);

    datum.metrics[0].key = 'foo';
    datum.metrics[1].key = 'ham';
    datum.metrics[2].key = 'baz';

    el.datum(datum)
      .call(pie);

    slice = el.selectAll('.slice');
    expect(slice.size()).to.equal(3);
  });

  it("should size its slices according to their values", function() {
    var pie = sapphire.widgets.pie()
      .width(300)
      .height(400)
      .margin({
        top: 20,
        left: 20,
        right: 20,
        bottom: 20
      })
      .innerRadius(15)
      .key(function(d) { return d.key; });

    var arc = helpers.arc()
      .margin({
        top: 20,
        left: 20,
        right: 20,
        bottom: 20
      })
      .width(300)
      .height(400)
      .innerRadius(15);

    expect(el.html()).to.be.empty;

    el.datum(datum)
      .call(pie);

    datum.metrics[0].key = 'foo';
    datum.metrics[1].key = 'bar';
    datum.metrics[2].key = 'baz';

    datum.metrics[0].value = 4000000;
    datum.metrics[1].value = 2000000;
    datum.metrics[2].value = 3000000;

    arc.data(datum.metrics);
    expect(d('foo')).to.equal(arc('foo'));
    expect(d('bar')).to.equal(arc('bar'));
    expect(d('baz')).to.equal(arc('baz'));

    datum.metrics[0].key = 'foo';
    datum.metrics[1].key = 'ham';
    datum.metrics[2].key = 'baz';

    datum.metrics[0].value = 5000000;
    datum.metrics[1].value = 6000000;
    datum.metrics[2].value = 7000000;

    el.datum(datum)
      .call(pie);

    arc.data(datum.metrics);
    expect(d('foo')).to.equal(arc('foo'));
    expect(d('ham')).to.equal(arc('ham'));
    expect(d('baz')).to.equal(arc('baz'));

    function d(key) {
      return el.selectAll('.slice path')
        .filter(function(d) { return d.data.key === key; })
        .attr('d');
    }
  });

  it("should colour its slices according to their keys", function() {
    var pie = sapphire.widgets.pie()
      .width(300)
      .height(400)
      .margin({
        top: 20,
        left: 20,
        right: 20,
        bottom: 20
      })
      .innerRadius(15)
      .key(function(d) { return d.key; });

    var colors = pie.colors();

    expect(el.html()).to.be.empty;

    el.datum(datum)
      .call(pie);

    datum.metrics[0].key = 'foo';
    datum.metrics[1].key = 'bar';
    datum.metrics[2].key = 'baz';

    expect(fill('foo')).to.equal(colors('foo'));
    expect(fill('bar')).to.equal(colors('bar'));
    expect(fill('baz')).to.equal(colors('baz'));

    datum.metrics[0].key = 'foo';
    datum.metrics[1].key = 'ham';
    datum.metrics[2].key = 'baz';

    el.datum(datum)
      .call(pie);

    expect(fill('foo')).to.equal(colors('foo'));
    expect(fill('ham')).to.equal(colors('ham'));
    expect(fill('baz')).to.equal(colors('baz'));

    function fill(key) {
      return el.selectAll('.slice path')
        .filter(function(d) { return d.data.key === key; })
        .style('fill');
    }
  });
});
