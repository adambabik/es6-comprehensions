var squared = (function() {
  var result = [];

  for (var i_0 = 0, arr_0 = [1,2,3,4,5], len_0 = arr_0.length, x; i_0 < len_0; i_0++) {
    x = arr_0[i_0];

    if (x > 2) {
      result.push(x * x);
    }
  }

  return result;
})();
