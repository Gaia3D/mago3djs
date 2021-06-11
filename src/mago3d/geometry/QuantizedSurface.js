'use strict';

/**
 * quantized surface
 * @class QuantizedSurface
 * 
 */
var QuantizedSurface = function(options) 
{
    if (!(this instanceof QuantizedSurface)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

    this.qMesh;

};

QuantizedSurface.prototype.excavation = function(excavationPolygon2d, excavationDepth)
{
    // In this function, cut the qmesh with the excavationPolygon and create a negative extrude.
    
};