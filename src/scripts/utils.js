var utils = exports;


utils.access = function(d, name, defaultval) {
  if (arguments.length < 3) {
    defaultval = null;
  }

  if (typeof d != 'object') {
    return defaultval;
  }

  var val = d[name];
  return typeof val == 'undefined'
    ? defaultval
    : val;
};


utils.ensure = function(v, defaultval) {
  return v === null || typeof v == 'undefined'
    ? defaultval
    : v;
};


utils.translate = function(x, y) {
  return 'translate(' + x + ', ' + y + ')';
};


utils.ensureEl = function(el) {
  return !(el instanceof d3.selection)
    ? d3.select(el)
    : el;
};


utils.date = function(t) {
  return new Date(t);
};


utils.px = function(fn) {
  fn = d3.functor(fn);

  return function(d, i) {
    return fn.call(this, d, i) + 'px';
  };
};


utils.box = strain()
  .prop('width')
  .default(0)

  .prop('height')
  .default(0)

  .prop('margin')
  .default({
    top: 0,
    left: 0,
    right: 0,
    bottom: 0
  })

  .meth('calc', function() {
    var d = {};
    d.margin = this.margin();
    d.width = this.width();
    d.height = this.height();
    d.innerWidth = d.width - d.margin.left - d.margin.right;
    d.innerHeight = d.height - d.margin.top - d.margin.bottom;
    return d;
  })

  .invoke(function() {
    return this.calc();
  });


utils.formatValue = strain()
  .prop('int')
  .default(d3.format(','))

  .prop('float')
  .default(d3.format(',.3f'))

  .invoke(function(v) {
    return utils.isInteger(v)
      ? this.int()(v)
      : this.float()(v);
  });


utils.isInteger = function(v) {
  return +v === parseInt(v);
};


utils.innerWidth = function(el) {
  return utils.measure(el, 'width')
       - utils.measure(el, 'padding-left')
       - utils.measure(el, 'padding-right');
};


utils.innerHeight = function(el) {
  return utils.measure(el, 'height')
       - utils.measure(el, 'padding-top')
       - utils.measure(el, 'padding-bottom');
};


utils.measure = function(el, name) {
  el = utils.ensureEl(el);
  return parseInt(el.style(name));
};


utils.isEmptyNode = function() {
  return !this.hasChildNodes();
};
