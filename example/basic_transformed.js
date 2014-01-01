"use strict";

var squared = (function() {
  var result = [];

  for (var $$i0 = 0, $$arr0 = [1,2,3,4,5], $$len0 = $$arr0.length, x; $$i0 < $$len0; $$i0++) {
    x = $$arr0[$$i0];

    for (var $$i1 = 0, $$arr1 = [1,2], $$len1 = $$arr1.length, y; $$i1 < $$len1; $$i1++) {
      y = $$arr1[$$i1];

      if (x > 2) {
        result.push(x * y);
      }
    }
  }

  return result;
})();

function mul(a, b) {
  return a * b;
}
