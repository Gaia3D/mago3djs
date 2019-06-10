'use strict';

/**
 * 어떤 일을 하고 있습니까?
 * @class ByteColor
 */
var ByteColor = function() 
{
	if (!(this instanceof ByteColor)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this.ByteR = 0;
	this.ByteG = 0;
	this.ByteB = 0;
	this.ByteAlfa = 255;
};

/**
 * 어떤 일을 하고 있습니까?
 */
ByteColor.prototype.destroy = function() 
{
	this.ByteR = null;
	this.ByteG = null;
	this.ByteB = null;
	this.ByteAlfa = null;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param byteRed 변수
 * @param byteGreen 변수
 * @param byteBlue 변수
 */
ByteColor.prototype.set = function(byteRed, byteGreen, byteBlue) 
{
	this.ByteR = byteRed;
	this.ByteG = byteGreen;
	this.ByteB = byteBlue;
};
