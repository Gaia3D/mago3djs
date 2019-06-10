'use strict';

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
	/**
	 * Color
	 * @type {Color}
	 */
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
