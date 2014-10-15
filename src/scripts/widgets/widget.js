module.exports = require('../view').extend()
  .prop('width')
  .set(d3.functor)
  .default(0)

  .prop('height')
  .set(d3.functor)
  .default(0);
