
'use strict';



/**
 * Save and calculate the color value as RGB
 * @class Color
 */
var Color = function() 
{
	if (!(this instanceof Color)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this.r = 0;
	this.g = 0;
	this.b = 0;
	this.a = 1;
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
 * This class is used for color code of GL
 * @class SelectionColor
 */
var SelectionColor = function() 
{
	if (!(this instanceof SelectionColor)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
	this.color = new Color();
};

/**
 * Initiate the color value of this feature
 */
SelectionColor.prototype.init = function() 
{
	this.color.r = 0;
	this.color.g = 0;
	this.color.b = 0;
	this.cycle = 0;
};

/**
 * get the color code of given RGB color
 * @param {Color} resultColor target color instance
 */
SelectionColor.prototype.getAvailableColor = function(resultColor) 
{
	if (resultColor === undefined)
	{ resultColor = new Color(); }
	
	resultColor.setRGB(this.color.r, this.color.g, this.color.b);
	
	this.color.b += 1;
	if (this.color.b >= 254)
	{
		this.color.b = 0;
		this.color.g += 1;
		if (this.color.g >= 254)
		{
			this.color.g = 0;
			this.color.r += 1;
			if (this.color.r >= 254)
			{
				this.color.r = 0;
				this.cycle += 1;
			}
		}
	}
	
	return resultColor;
};

/**
 * Change the RGB code to color code.
 * (255,255,255) is used to white color so 254 number is used
 * @param {Number} r
 * @param {Number} g
 * @param {Number} b
 * @returns Color code
 */
SelectionColor.prototype.decodeColor3 = function(r, g, b) 
{
	return 64516*r + 254*g + b;
};






