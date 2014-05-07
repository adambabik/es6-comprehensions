"use strict";

var squared = function() {
  var $__result = [];

  for (var $__i = 0, $__arr = [1,2,3,4,5], $__len = $__arr.length, x; $__i < $__len; $__i++) {
    x = $__arr[$__i];

    if (x > 2) {
      $__result.push(x * x);
    }
  }

  return $__result;
}();

function mul(a, b) {
  return a * b;
}
