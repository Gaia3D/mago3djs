define([],function() {
  'use strict';

  /**
   * Coordinate data format
   * @exports Coordinate
   * @constructor
   * @param {number} x
   * @param {number} y
   * @param {number} z
   * @param {string} href
   */
  function Coordinate(x, y, z, href){
    this.x = x;
    this.y = y;
    this.z = z;
    this.href = href;
  }

  /**
   * define toString
   * @return {string}
   */
  Coordinate.prototype.toString = function(){
    return x + ", " + y + ", " + z;
  }


  return Coordinate;
});
