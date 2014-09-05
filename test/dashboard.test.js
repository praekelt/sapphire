describe("sapphire.dashboard", function() {
  var el;
  var datum;

  function key(k) {
    return function() {
      return sapphire.utils.meta(this).key === k;
    };
  }

  var dummy = sapphire.widgets.widget.extend()
    .prop('text')
    .set(d3.functor)
    .default(function(d) { return d.text; })

    .draw(function(el) {
      el.text(this.text())
        .style('width', sapphire.utils.px(this.width()))
        .style('height', sapphire.utils.px(this.height()));
    });

  beforeEach(function() {
    d3.select('body')
      .append('div')
      .attr('class', 'tmp sapphire');

    el = d3.select('.tmp').append('div');

    datum = {
      widgets: [{
        type: 'dummy',
        text: 'foo'
      }, {
        type: 'dummy',
        text: 'bar'
      }]
    };
  });

  afterEach(function() {
    d3.select('.tmp').remove();
  });

  it("should set its width", function() {
    var dashboard = sapphire.dashboard()
      .numcols(4)
      .scale(100);

    datum.widgets = [];

    el.datum(datum)
      .call(dashboard);

    expect(el.style('width')).to.equal((100 * 4) + 'px');
  });

  it("should draw its widgets", function() {
    var dashboard = sapphire.dashboard()
      .key(function(d) { return d.key; });

    dashboard.types().set('dummy', dummy());

    datum.widgets = [{
      key: 'a',
      type: 'dummy',
      text: 'foo'
    }, {
      key: 'b',
      type: 'dummy',
      text: 'bar'
    }, {
      key: 'c',
      type: 'dummy',
      text: 'baz'
    }];

    el.datum(datum)
      .call(dashboard);

    var widget = el.selectAll('.widget');
    expect(widget.size()).to.equal(3);
    expect(widget.filter(key('a')).text()).to.equal('foo');
    expect(widget.filter(key('b')).text()).to.equal('bar');
    expect(widget.filter(key('c')).text()).to.equal('baz');

    datum.widgets = [{
      key: 'a',
      type: 'dummy',
      text: 'ham'
    }, {
      key: 'd',
      type: 'dummy',
      text: 'quux'
    }];

    el.datum(datum)
      .call(dashboard);

    widget = el.selectAll('.widget');
    expect(widget.size()).to.equal(2);
    expect(widget.filter(key('a')).text()).to.equal('ham');
    expect(widget.filter(key('d')).text()).to.equal('quux');
  });

  it("should use each widget type's colspan as a fallback colspan", function() {
    var dummy = sapphire.widgets.widget.extend()
      .prop('colspan')
      .default(4)

      .draw(function(el) {
        el.style('width', sapphire.utils.px(this.width()));
      });

    var dashboard = sapphire.dashboard()
      .numcols(4)
      .padding(10);

    dashboard.types().set('dummy', dummy());

    datum.widgets = [{
      type: 'dummy',
      text: 'foo',
      col: 3,
      row: 6
    }];

    el.datum(datum)
      .call(dashboard);

    expect(el.select('.widget').style('width')).to.equal('380px');
  });

  it("should use each widget type's rowspan as a fallback rowspan", function() {
    var dummy = sapphire.widgets.widget.extend()
      .prop('rowspan')
      .default(4)

      .draw(function(el) {
        el.style('height', sapphire.utils.px(this.height()));
      });

    var dashboard = sapphire.dashboard()
      .padding(10);

    dashboard.types().set('dummy', dummy());

    datum.widgets = [{
      type: 'dummy',
      text: 'foo',
      col: 3,
      row: 6
    }];

    el.datum(datum)
      .call(dashboard);

    expect(el.select('.widget').style('height')).to.equal('380px');
  });

  it("should position its widgets in a grid", function() {
    var dashboard = sapphire.dashboard()
      .numcols(4)
      .padding(10)
      .scale(100)
      .key(function(d) { return d.key; });

    dashboard.types().set('dummy', dummy());

    datum.widgets = [{
      key: 'a',
      type: 'dummy',
      text: 'foo',
      col: 3,
      row: 6,
      colspan: 2,
      rowspan: 3
    }, {
      key: 'b',
      type: 'dummy',
      text: 'bar',
      col: 2,
      row: 9,
      colspan: 3,
      rowspan: 2
    }];

    el.datum(datum)
      .call(dashboard);

    var widget = el.selectAll('.widget');
    expect(widget.filter(key('a')).style('left')).to.equal('10px');
    expect(widget.filter(key('a')).style('top')).to.equal('610px');
    expect(widget.filter(key('a')).style('width')).to.equal('180px');
    expect(widget.filter(key('a')).style('height')).to.equal('280px');

    expect(widget.filter(key('b')).style('left')).to.equal('10px');
    expect(widget.filter(key('b')).style('top')).to.equal('1210px');
    expect(widget.filter(key('b')).style('width')).to.equal('280px');
    expect(widget.filter(key('b')).style('height')).to.equal('180px');

    datum.widgets = [{
      key: 'a',
      type: 'dummy',
      text: 'foo',
      col: 2,
      row: 9,
      colspan: 2,
      rowspan: 3
    }, {
      key: 'b',
      type: 'dummy',
      text: 'bar',
      col: 1,
      row: 2,
      colspan: 4,
      rowspan: 2
    }, {
      key: 'c',
      type: 'dummy',
      text: 'baz',
      col: 3,
      row: 12,
      colspan: 2,
      rowspan: 4
    }];

    el.datum(datum)
      .call(dashboard);

    widget = el.selectAll('.widget');
    expect(widget.filter(key('a')).style('left')).to.equal('210px');
    expect(widget.filter(key('a')).style('top')).to.equal('910px');
    expect(widget.filter(key('a')).style('width')).to.equal('180px');
    expect(widget.filter(key('a')).style('height')).to.equal('280px');

    expect(widget.filter(key('b')).style('left')).to.equal('10px');
    expect(widget.filter(key('b')).style('top')).to.equal('510px');
    expect(widget.filter(key('b')).style('width')).to.equal('380px');
    expect(widget.filter(key('b')).style('height')).to.equal('180px');

    expect(widget.filter(key('c')).style('left')).to.equal('10px');
    expect(widget.filter(key('c')).style('top')).to.equal('1410px');
    expect(widget.filter(key('c')).style('width')).to.equal('180px');
    expect(widget.filter(key('c')).style('height')).to.equal('380px');
  });

  it("should respect its widgets' dimensions when positioning them", function() {
    var dummy = sapphire.widgets.widget.extend()
      .draw(function(el) {
        el.style('width', '100px')
          .style('height', '200px');
      });

    var dashboard = sapphire.dashboard()
      .numcols(4)
      .padding(10)
      .scale(100)
      .key(function(d) { return d.key; });

    dashboard.types().set('dummy', dummy());

    datum.widgets = [{
      key: 'a',
      type: 'dummy',
      colspan: 1,
      rowspan: 1
    }, {
      key: 'b',
      type: 'dummy',
      colspan: 1,
      rowspan: 1
    }, {
      key: 'c',
      type: 'dummy',
      colspan: 1,
      rowspan: 1
    }];

    el.datum(datum)
      .call(dashboard);

    var widget = el.selectAll('.widget');
    expect(widget.filter(key('b')).style('left')).to.equal('210px');
    expect(widget.filter(key('c')).style('top')).to.equal('310px');
  });

  it("should throw an error for unrecognised widget types", function() {
    var dashboard = sapphire.dashboard();
    dashboard.types().set('dummy', dummy());
    datum.widgets = [{type: 'unrecognised'}];

    function draw() {
      el.datum(datum)
        .call(dashboard);
    }

    expect(draw).to.throw(/Unrecognised dashboard widget type 'unrecognised'/);
  });
});
