
'use strict';



/**
 * 어떤 일을 하고 있습니까?
 * @class Color
 */
var Color = function() {
	if(!(this instanceof Color)) {
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
	this.r = 0;
	this.g = 0;
	this.b = 0;
	this.a = 0;
};
  
/**
 * 어떤 일을 하고 있습니까?
 * @param red 변수
 * @param green 변수
 * @param blue 변수
 * @param alpha 변수
 */
Color.prototype.set = function(red, green, blue, alpha) {
	this.r = red; this.g = green; this.b = blue; this.a = alpha;
};
  
/**
 * 어떤 일을 하고 있습니까?
 * @param red 변수
 * @param green 변수
 * @param blue 변수
 */
Color.prototype.setRGB = function(red, green, blue) {
	this.r = red; this.g = green; this.b = blue;
};
  
/**
 * 어떤 일을 하고 있습니까?
 * @param red 변수
 * @param green 변수
 * @param blue 변수
 * @param alpha 변수
 */
Color.prototype.setRGBA = function(red, green, blue, alpha) {
	this.r = red; this.g = green; this.b = blue; this.a = alpha;
};