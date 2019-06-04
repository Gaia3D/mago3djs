'use strict';

/**
 * 4차원 정보
 * @class Point4D
 * @param {Number} x
 * @param {Number} y
 * @param {Number} z
 * @param {Number} w
 */
var Point4D = function(x, y, z, w) 
{
	if (!(this instanceof Point4D)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	if (x !== undefined)
	{ this.x = x; }
	else
	{ this.x = 0.0; }
	
	if (y !== undefined)
	{ this.y = y; }
	else
	{ this.y = 0.0; }
	
	if (z !== undefined)
	{ this.z = z; }
	else
	{ this.z = 0.0; }
	
	if (w !== undefined)
	{ this.w = w; }
	else
	{ this.w = 0.0; }
	
	this.pointType; // 1 = important point.
};