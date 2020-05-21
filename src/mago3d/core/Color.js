
'use strict';



/**
 * Save and calculate the color value as RGB
 * @class Color
 */
var Color = function(red, green, blue, alpha) 
{
	if (!(this instanceof Color)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

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


/**
 * Match gray scale to RGB scale
 * @param gray the percentage of the gray color. normalize the value from 0.0 to 1.0
 * @param {Color} resultColor
 * @returns {Color} 
 */
Color.grayToRGB_MagoStyle = function(gray, resultColor) 
{
	if (resultColor === undefined)
	{ resultColor = new Color(); }
	
	if (gray > 1.0){ gray = 1.0; }
	else if (gray<0.0){ gray = 0.0; }
	
	var r, g, b;
	
	r = -gray + 1.0;
	
	if (gray > 0.5)
	{
		g = -gray*2.0 + 2.0; 
	}
	else 
	{
		g = gray*2.0;
	}
	
	b = gray;
	
	resultColor.setRGB(r, g, b);
	
	return resultColor;
};

Color.grayToRGBYCM_MagoStyle = function(gray, resultColor)
{
	if (resultColor === undefined)
	{ resultColor = new Color(); }

	if (gray > 1.0){ gray = 1.0; }
	else if (gray<0.0){ gray = 0.0; }
	
	var r, g, b;
	
	if (gray < 0.16666)
	{
		b = 0.0;
		g = gray*6.0;
		r = 1.0;
	}
	else if (gray >= 0.16666 && gray < 0.33333)
	{
		b = 0.0;
		g = 1.0;
		r = 2.0 - gray*6.0;
	}
	else if (gray >= 0.33333 && gray < 0.5)
	{
		b = -2.0 + gray*6.0;
		g = 1.0;
		r = 0.0;
	}
	else if (gray >= 0.5 && gray < 0.66666)
	{
		b = 1.0;
		g = 4.0 - gray*6.0;
		r = 0.0;
	}
	else if (gray >= 0.66666 && gray < 0.83333)
	{
		b = 1.0;
		g = 0.0;
		r = -4.0 + gray*6.0;
	}
	else if (gray >= 0.83333)
	{
		b = 6.0 - gray*6.0;
		g = 0.0;
		r = 1.0;
	}
	
	resultColor.setRGB(r, g, b);
	return resultColor;
}; 

/**
 * copy of the value of RGB instance
 * @param {Color} color
 */
Color.prototype.copyFrom = function(color) 
{
	this.r = color.r;
	this.g = color.g;
	this.b = color.b;
	this.a = color.a;
};

/**
 * Clear the RGBA value of this instance
 */
Color.prototype.deleteObjects = function() 
{
	this.r = undefined;
	this.g = undefined;
	this.b = undefined;
	this.a = undefined;
};

/**
 * Linear interpolation between colorA & colorB
 */
Color.mix = function(colorA, colorB, weight, resultColor ) 
{
	if (resultColor === undefined)
	{ resultColor = new Color(); }
	
	var w = weight;
	var r = colorA.r * w + colorB.r * (1.0 - w);
	var g = colorA.g * w + colorB.g * (1.0 - w);
	var b = colorA.b * w + colorB.b * (1.0 - w);
	var a = colorA.a * w + colorB.a * (1.0 - w);
	
	resultColor.setRGBA(r, g, b, a);
	
	return resultColor;
};
  
/**
 * Set the value of RGBA (A means transparancy) as default. 
 * @param red the value of red
 * @param green the value of green
 * @param blue the value of blue
 * @param alpha the value of transparancy
 */
Color.prototype.set = function(red, green, blue, alpha) 
{

	this.r = red; 
	this.g = green; 
	this.b = blue; 
	this.a = alpha;
};
  
/**
 * Set the value of RGB
 * @param red the value of red
 * @param green the value of green
 * @param blue the value of blue
 */
Color.prototype.setRGB = function(red, green, blue) 
{

	this.r = red; 
	this.g = green; 
	this.b = blue;
};
  
/**
 * Set the value of RGBA (A means transparancy)
 * @param red the value of red
 * @param green the value of green
 * @param blue the value of blue
 * @param alpha the value of transparancy
 */
Color.prototype.setRGBA = function(red, green, blue, alpha) 
{
	//this[0] = red;
	//this[1] = green;
	//this[2] = blue;
	//this[3] = alpha;
	this.r = red; this.g = green; this.b = blue; this.a = alpha;
};

/**
 * return hexCode
 * @return {string}
 */
Color.prototype.getHexCode = function() 
{
	var r = this.r * 255;
	var g = this.g * 255;
	var b = this.b * 255;
	
	return Color.getHexCode(r, g, b);
};

/**
 * return hexCode
 * @return {string}
 */
Color.getHexCode = function(red, green, blue) 
{	
	var r = red * 255;
	var g = green * 255;
	var b = blue * 255;
	
	var hexR = r.toString(16).padStart(2, '0'); //String.padStart i.e no support..TT 
	var hexG = g.toString(16).padStart(2, '0');
	var hexB = b.toString(16).padStart(2, '0');
	
	return '#'+hexR+hexG+hexB;
};

/**
 * return hexCode
 * @return {string}
 */
Color.fromHexCode = function(hex, resultColor4) 
{
	var r = parseInt(hex.slice(1, 3), 16),
		g = parseInt(hex.slice(3, 5), 16),
		b = parseInt(hex.slice(5, 7), 16);

	if (resultColor4 === undefined)
	{ resultColor4 = new Color(); }

	resultColor4.setRGB(r/256, g/256, b/256);
	return resultColor4;
		
};