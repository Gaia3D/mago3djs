'use strict';

/**
 * 어떤 일을 하고 있습니까?
 * @class Ellipsoid
 */
var Ellipsoid = function(radiusX, radiusY, radiusZ) 
{
	if (!(this instanceof Ellipsoid)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	// Ellipsoid: x^2/a^2 + y^2/b^2 + z^2/c^2 = 1, (a, b, c) = (radiusX, radiusY, radiusZ).***
	
	this.radiusX;
	this.radiusY;
	this.radiusZ;
	
	if (radiusX !== undefined)
	{ this.radiusX = radiusX; }
	
	if (radiusY !== undefined)
	{ this.radiusY = radiusY; }
	
	if (radiusZ !== undefined)
	{ this.radiusZ = radiusZ; }

};