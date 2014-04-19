"use strict";

var squared = (function() {
  var result = [];

  for (var $_i0 = 0, $_arr0 = [1,2,3,4,5], $_len0 = $_arr0.length, x; $_i0 < $_len0; $_i0++) {
    x = $_arr0[$_i0];

    if (x > 2) {
      result.push(x * x);
    }
  }

  return result;
})();

function mul(a, b) {
  return a * b;
}
