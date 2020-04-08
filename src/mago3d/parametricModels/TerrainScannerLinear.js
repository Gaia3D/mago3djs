'use strict';

/**
 * This class consist in 2 geoCoord & a vertical plane.
 * @class TerrainScannerLinear
 */
var TerrainScannerLinear = function(geoCoordSegment) 
{
	MagoRenderable.call(this);
	if (!(this instanceof TerrainScannerLinear)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
	this.geoCoordSegment = geoCoordSegment;

};

TerrainScannerLinear.prototype = Object.create(MagoRenderable.prototype);
TerrainScannerLinear.prototype.constructor = TerrainScannerLinear;

/**
 */
TerrainScannerLinear.prototype.render = function()
{
	
};