'use strict';

const ColorLegend = function(red = 1, green = 1, blue = 1, alpha = 1, value = 0)
{
	if (!(this instanceof ColorLegend)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this.red = red;
	this.green = green;
	this.blue = blue;
	this.alpha = alpha;
	this.value = value;
};

ColorLegend.prototype.destroy = function()
{
	this.red = null;
	this.green = null;
	this.blue = null;
	this.alpha = null;
	this.value = null;
};

ColorLegend.prototype.setColor = function(red, green, blue, alpha)
{
	this.red = red;
	this.green = green;
	this.blue = blue;
	this.alpha = alpha;
};

ColorLegend.prototype.getColor = function()
{
	return [this.red, this.green, this.blue, this.alpha];
};

ColorLegend.prototype.getRed = function()
{
	return this.red;
};

ColorLegend.prototype.getGreen = function()
{
	return this.green;
};

ColorLegend.prototype.getBlue = function()
{
	return this.blue;
};

ColorLegend.prototype.getAlpha = function()
{
	return this.alpha;
};

ColorLegend.prototype.setValue = function(value)
{
	this.value = value;
};

ColorLegend.prototype.getValue = function()
{
	return this.value;
};
