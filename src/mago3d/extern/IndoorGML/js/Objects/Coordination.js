define([],function() {
  'use strict';

  /**
   * Coordination data format
   * @exports Coordination
   * @constructor
   * @param {number} x
   * @param {number} y
   * @param {number} z
   * @param {string} href
   */
  function Coordination(x, y, z, href){
    this.x = x;
    this.y = y;
    this.z = z;
    this.href = href;
  }

  /**
   * define toString
   * @memberof Coordination
   * @return {string} x, y, z
   */
  Coordination.prototype.toString = function(){
    return x + ", " + y + ", " + z;
  }


  return Coordination;
});
