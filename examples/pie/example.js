var pie = sapphire.widgets.pie()
  .key(function(d) { return d.title; })
  .colors(d3.scale.category20());

d3.select('#pie1')
  .datum({
    title: 'A and B',
    metrics: [{
      title: 'A',
      value: 6
    }, {
      title: 'B',
      value: 3
    }]
  })
  .call(pie);

d3.select('#pie2')
  .datum({
    title: 'D and F',
    metrics: [{
      title: 'D',
      value: 2
    }, {
      title: 'F',
      value: 8
    }]
  })
  .call(pie);

d3.select('#pie3')
  .datum({
    title: 'G, H and I',
    metrics: [{
      title: 'G',
      value: 6
    }, {
      title: 'H',
      value: 3 
    }, {
      title: 'I',
      value: 6
    }]
  })
  .call(pie);
