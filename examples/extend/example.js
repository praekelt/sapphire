var intervals = {};
intervals.minute = 1000 * 60;
intervals.hour = intervals.minute * 60;
intervals.day = intervals.hour * 24;


draw();


function draw() {
  d3.select('#target')
    .datum({
      title: 'Total Rainbows',
      interval: intervals.day,
      allValues: d3.range(35)
        .map(d3.random.bates(10))
        .map(value(300, 1000))
    })
    .call(widget);
}


// This function 'extends' the bars widget by using it to draw the chart, then
// applying its own drawing steps
function widget(el) {
  var datum = el.datum();

  var bars = sapphire.widgets.bars()
    .explicitComponents(true)
    .values(function(d) { return truncate(d.interval, d.allValues); });

  bars(el);

  el.select('.widget-title')
    .text(function(d) { return d.title; });

  var interval = el.selectAll('.widget-interval')
    .classed('active-widget-interval', false)
    .on('click', null)
    .on('click', function() {
      datum.interval = getInterval(this);
      widget(el);
    })

  interval
    .filter(function() {
      return getInterval(this) === datum.interval;
    })
    .classed('active-widget-interval', true);
}


function getInterval(el) {
  return intervals[d3.select(el).attr('data-interval')];
}


function truncate(interval, values) {
  var last = values[values.length - 1];

  var i = d3.bisector(function(d) { return d.x; })
    .right(values, last.x - interval);

  return values.slice(i);
}


function value(min, max) {
  return function(y, i) {
    return {
      x: +(new Date()) + (i * 5 * intervals.minute),
      y: Math.round((y * (max - min)) + min)
    };
  };
}
