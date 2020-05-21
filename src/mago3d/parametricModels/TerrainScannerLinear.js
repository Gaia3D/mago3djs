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
	//this.geoCoordsList;

};

TerrainScannerLinear.prototype = Object.create(MagoRenderable.prototype);
TerrainScannerLinear.prototype.constructor = TerrainScannerLinear;

/**
 */
TerrainScannerLinear.prototype.makeMesh = function(magoManager)
{
	// create a vectorMesh segment.
	var maxDist = 1500;
	var geoCoordsArray = GeographicCoordSegment.getArcInterpolatedGeoCoords(this.geoCoordSegment.strGeoCoord, this.geoCoordSegment.endGeoCoord, maxDist, undefined);

	var options = {
		color     : '#ffff00',
		thickness : 2.0
	};
	var renderableObject = GeographicCoordsList.getRenderableObjectOfGeoCoordsArray(geoCoordsArray, magoManager, options);

	if (this.objectsArray === undefined)
	{ this.objectsArray = []; }
	
	this.objectsArray.push(renderableObject);

	this.setDirty(false);
};

