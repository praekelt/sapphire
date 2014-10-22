var lines = sapphire.widgets.lines()
  .key(function(d) { return d.title; });

d3.select('#lines1')
  .datum({
    title: 'Foo and Bar',
    metrics: [{
      title: 'Foo',
      values: d3.range(25)
        .map(d3.random.bates(10))
        .map(value(300, 1000))
    }, {
      title: 'Bar',
      values: d3.range(25)
        .map(d3.random.bates(10))
        .map(value(300, 100))
    }]
  })
  .call(lines);

d3.select('#lines2')
  .datum({
    title: 'Baz and Quux',
    metrics: [{
      title: 'Baz',
      values: d3.range(25)
        .map(d3.random.bates(10))
        .map(value(5000, 20000))
    }, {
      title: 'Quux',
      values: d3.range(25)
        .map(d3.random.bates(10))
        .map(value(5000, 20000))
    }]
  })
  .call(lines);

d3.select('#lines3')
  .datum({
    title: 'Corge, Grault and Garply',
    metrics: [{
      title: 'Corge',
      values: d3.range(25)
        .map(d3.random.bates(10))
        .map(value(300000, 9000000))
    }, {
      title: 'Grault',
      values: d3.range(25)
        .map(d3.random.bates(10))
        .map(value(300000, 9000000))
    }, {
      title: 'Garply',
      values: d3.range(25)
        .map(d3.random.bates(10))
        .map(value(300000, 9000000))
    }]
  })
  .call(lines);

function value(min, max) {
  return function(y, i) {
    return {
      x: +(new Date()) + (i * 1000),
      y: Math.round((y * (max - min)) + min)
    }
  }
}
