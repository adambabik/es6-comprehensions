"use strict";

var squared = [ for (x of [1,2,3,4,5]) if (x > 2)
                for (y of [1,2])
                x * y ];

function mul(a, b) {
  return a * b;
}
