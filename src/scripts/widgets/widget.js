var utils = require('../utils');


module.exports = require('../view').extend()
  .prop('standalone')
  .default(true)

  .prop('colspan')
  .default(1)

  .prop('rowspan')
  .default(1)

  .prop('width')
  .set(d3.functor)
  .default(100)

  .prop('height')
  .set(d3.functor)
  .default(100)

  .draw(function(el) {
    if (!this.standalone()) { return; }
    var self = this;

    el.style('width', utils.px(this.width()))
      .style('min-height', utils.px(this.height()));
  });
