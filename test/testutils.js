var testutils = sapphire.testutils = {};


testutils.pick = function(data, keys) {
  return data.map(function(d) {
    var results = {};

    keys.forEach(function(k) {
      if (k in d) { results[k] = d[k]; }
    });

    return results;
  });
};
