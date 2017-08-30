
'use strict';



/**
 * 어떤 일을 하고 있습니까?
 * @class Color
 */
var Color = function() 
{
	if (!(this instanceof Color)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	//this[0] = 0.0;
	//this[1] = 0.0;
	//this[2] = 0.0;
	//this[3] = 1.0;

	this.r = 0;
	this.g = 0;
	this.b = 0;
	this.a = 1;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param red 변수
 * @param green 변수
 * @param blue 변수
 * @param alpha 변수
 */
Color.prototype.deleteObjects = function() 
{
	this.r = undefined;
	this.g = undefined;
	this.b = undefined;
	this.a = undefined;
};
  
/**
 * 어떤 일을 하고 있습니까?
 * @param red 변수
 * @param green 변수
 * @param blue 변수
 * @param alpha 변수
 */
Color.prototype.set = function(red, green, blue, alpha) 
{
	//this[0] = red;
	//this[1] = green;
	//this[2] = blue;
	//this[3] = alpha;
	this.r = red; this.g = green; this.b = blue; this.a = alpha;
};
  
/**
 * 어떤 일을 하고 있습니까?
 * @param red 변수
 * @param green 변수
 * @param blue 변수
 */
Color.prototype.setRGB = function(red, green, blue) 
{
	//this[0] = red;
	//this[1] = green;
	//this[2] = blue;
	this.r = red; this.g = green; this.b = blue;
};
  
/**
 * 어떤 일을 하고 있습니까?
 * @param red 변수
 * @param green 변수
 * @param blue 변수
 * @param alpha 변수
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
 * 어떤 일을 하고 있습니까?
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
 * 어떤 일을 하고 있습니까?
 */
SelectionColor.prototype.init = function() 
{
	this.color.r = 0;
	this.color.g = 0;
	this.color.b = 0;
	this.cycle = 0;
};

/**
 * 어떤 일을 하고 있습니까?
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






