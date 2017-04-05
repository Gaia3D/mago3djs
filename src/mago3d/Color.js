
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
 * @param _r 변수
 * @param _g 변수
 * @param _b 변수
 * @param _a 변수
 */
Color.prototype.set = function(_r, _g, _b, _a) {
	this.r = _r; this.g = _g; this.b = _b; this.a = _a;
};
  
/**
 * 어떤 일을 하고 있습니까?
 * @param _r 변수
 * @param _g 변수
 * @param _b 변수
 */
Color.prototype.setRGB = function(_r, _g, _b) {
	this.r = _r; this.g = _g; this.b = _b; 
};
  
/**
 * 어떤 일을 하고 있습니까?
 * @param _r 변수
 * @param _g 변수
 * @param _b 변수
 * @param _alpha 변수
 */
Color.prototype.setRGBA = function(_r, _g, _b, _alpha) {
	this.r = _r; this.g = _g; this.b = _b;  this.a = _alpha;
};