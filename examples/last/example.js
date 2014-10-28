var last = sapphire.widgets.last();

d3.select('#last1')
  .datum({
    title: 'Foo',
    values: d3.range(25)
      .map(d3.random.bates(10))
      .map(value(300, 1000))
  })
  .call(last);

d3.select('#last2')
  .datum({
    title: 'Bar',
    values: d3.range(25)
      .map(d3.random.bates(10))
      .map(value(5000, 20000))
  })
  .call(last);

d3.select('#last3')
  .datum({
    title: 'Baz',
    values: d3.range(25)
      .map(d3.random.bates(10))
      .map(value(300000, 9000000))
  })
  .call(last);

function value(min, max) {
  return function(y, i) {
    return {
      x: +(new Date()) + (i * 1000 * 60 * 60 * 24),
      y: Math.round((y * (max - min)) + min)
    }
  }
}
