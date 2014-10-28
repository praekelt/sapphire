var bars = sapphire.widgets.bars();

d3.select('#bars1')
  .datum({
    title: 'Foo',
    values: d3.range(25)
      .map(d3.random.bates(10))
      .map(value(300, 1000))
  })
  .call(bars);

d3.select('#bars2')
  .datum({
    title: 'Bar',
    values: d3.range(25)
      .map(d3.random.bates(10))
      .map(value(5000, 20000))
  })
  .call(bars);

d3.select('#bars3')
  .datum({
    title: 'Baz',
    values: d3.range(25)
      .map(d3.random.bates(10))
      .map(value(300000, 9000000))
  })
  .call(bars);

function value(min, max) {
  return function(y, i) {
    return {
      x: +(new Date()) + (i * 1000),
      y: Math.round((y * (max - min)) + min)
    }
  }
}
