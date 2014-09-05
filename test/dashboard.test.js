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
      el.text(this.text());
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
      .default(4);

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
      .default(4);

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

  it("should use each widget's colspan as the minimum width", function() {
    var dummy = sapphire.widgets.widget.extend()
      .draw(function(el) {
          el.style('width', function(d) { return d.width + 'px'; });
      });

    var dashboard = sapphire.dashboard()
      .numcols(4)
      .padding(10)
      .scale(100);

    dashboard.types().set('dummy', dummy());

    datum.widgets = [{
      type: 'dummy',
      text: 'foo',
      col: 3,
      row: 6,
      colspan: 2,
      width: 350
    }];

    el.datum(datum)
      .call(dashboard);

    expect(el.select('.widget').style('width')).to.equal('380px');

    datum.widgets[0].width = 50;

    el.datum(datum)
      .call(dashboard);

    expect(el.select('.widget').style('width')).to.equal('180px');
  });

  it("should use each widget's rowspan as the minimum height", function() {
    var dummy = sapphire.widgets.widget.extend()
      .draw(function(el) {
          el.style('height',  function(d) { return d.height + 'px'; });
      });

    var dashboard = sapphire.dashboard()
      .numcols(4)
      .padding(10)
      .scale(100);

    dashboard.types().set('dummy', dummy());

    datum.widgets = [{
      type: 'dummy',
      text: 'foo',
      col: 3,
      row: 6,
      rowspan: 2,
      height: 350
    }];

    el.datum(datum)
      .call(dashboard);

    expect(el.select('.widget').style('height')).to.equal('380px');

    datum.widgets[0].height = 50;

    el.datum(datum)
      .call(dashboard);

    expect(el.select('.widget').style('height')).to.equal('180px');
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

  it("should set its widgets dimensions before drawing them", function(done) {
    var dummy = sapphire.widgets.widget.extend()
      .draw(function(el) {
        expect(el.style('width')).to.equal('180px');
        expect(el.style('height')).to.equal('280px');
        done();
      });

    var dashboard = sapphire.dashboard()
      .padding(10);

    dashboard.types().set('dummy', dummy());

    datum.widgets = [{
      key: 'a',
      type: 'dummy',
      text: 'foo',
      colspan: 2,
      rowspan: 3
    }];

    el.datum(datum)
      .call(dashboard);
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
