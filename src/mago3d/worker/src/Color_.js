
'use strict';



/**
 * Save and calculate the color value as RGB
 * @class Color
 */
var Color_ = function(red, green, blue, alpha) 
{

	this.r = 0;
	this.g = 0;
	this.b = 0;
	this.a = 1;
	
	if (red !== undefined)
	{ this.r = red; }
	
	if (green !== undefined)
	{ this.g = green; }
	
	if (blue !== undefined)
	{ this.b = blue; }
	
	if (alpha !== undefined)
	{ this.a = alpha; }
};

Color_.prototype.setRGB = function(red, green, blue) 
{

	this.r = red; 
	this.g = green; 
	this.b = blue;
};

Color_.getRandomPastelColor = function() 
{
	return new Color_(Math.random()*0.5 + 0.5, Math.random()*0.5 + 0.5, Math.random()*0.5 + 0.5, 1.0);
};
  
Color_.prototype.setRGBA = function(red, green, blue, alpha) 
{
	//this[0] = red;
	//this[1] = green;
	//this[2] = blue;
	//this[3] = alpha;
	this.r = red; this.g = green; this.b = blue; this.a = alpha;
};

Color_.prototype.copyFrom = function(color) 
{
	this.r = color.r;
	this.g = color.g;
	this.b = color.b;
	this.a = color.a;
};