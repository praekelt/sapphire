var bars = sapphire.widgets.bars()
  .yMax(10);

var lines = sapphire.widgets.lines()
  .yMin(2)
  .yMax(10);

d3.select('#bars')
  .datum({
    title: 'Values between 0 and 10',
    values: d3.range(25)
      .map(d3.random.bates(10))
      .map(value(0, 10))
  })
  .call(bars);

d3.select('#lines')
  .datum({
    title: 'Values between 2 and 10',
    metrics: [{
      title: 'Foo',
      values: d3.range(25)
        .map(d3.random.bates(10))
        .map(value(2, 10))
    }, {
      title: 'Bar',
      values: d3.range(25)
        .map(d3.random.bates(10))
        .map(value(2, 10))
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
