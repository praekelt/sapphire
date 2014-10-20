var last = sapphire.widgets.last();

var pie = sapphire.widgets.pie()
  .key(function(d) { return d.title; });

var bars = sapphire.widgets.bars();

var lines = sapphire.widgets.lines()
  .key(function(d) { return d.title; });

d3.select('#foo')
  .datum({
    title: 'Foo',
    values: d3.range(60).map(value)
  })
  .call(last);

d3.select('#bar')
  .datum({
    title: 'Bar',
    values: d3.range(60).map(value)
  })
  .call(last);

d3.select('#baz-quux-corge')
  .datum({
    title: 'Baz, Quux and Corge',
    metrics: [{
      title: 'Baz',
      value: y()
    }, {
      title: 'Quux',
      value: y()
    }, {
      title: 'Corge',
      value: y()
    }]
  })
  .call(pie);

d3.select('#grault-garply')
  .datum({
    title: 'Grault and Garply',
    metrics: [{
      title: 'Grault',
      value: y()
    }, {
      title: 'Garply',
      value: y()
    }]
  })
  .call(pie);

d3.select('#waldo-fred')
  .datum({
    title: 'Waldo and Fred',
    metrics: [{
      title: 'Waldo',
      value: y()
    }, {
      title: 'Fred',
      value: y()
    }]
  })
  .call(pie);

d3.select('#plugh')
  .datum({
    title: 'Plugh',
    values: d3.range(25).map(value)
  })
  .call(bars);

d3.select('#xyzzy')
  .datum({
    title: 'Xyzzy',
    values: d3.range(25).map(value)
  })
  .call(bars);

d3.select('#rainbows-earthworms-microscopic-hummingbirds')
  .datum({
    title: 'Rainbows, Earthworms and Microscopic Hummingbirds',
    metrics: [{
      title: 'Rainbows',
      values: d3.range(50).map(value)
    }, {
      title: 'Earthworms',
      values: d3.range(50).map(value)
    }, {
      title: 'Microscopic Hummingbirds',
      values: d3.range(50).map(value)
    }]
  })
  .call(lines);

d3.select('#trees-colors-wizards')
  .datum({
    title: 'Trees, Colors and Wizards',
    metrics: [{
      title: 'Trees',
      values: d3.range(50).map(value)
    }, {
      title: 'Colors',
      values: d3.range(50).map(value)
    }, {
      title: 'Wizards',
      values: d3.range(50).map(value)
    }]
  })
  .call(lines);

function value(i) {
  return {
    x: x(i),
    y: y()
  };
}

function x(i) {
  return +(new Date()) + (i * 1000 * 60 * 60);
}

function y() {
  return Math.round((Math.random() * 8000000) + 2000000);
}
