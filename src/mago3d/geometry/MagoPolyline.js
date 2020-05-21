'use strict';
/**
 * 중심점과 가로, 세로 길이를 가진 클래스
 * @exception {Error} Messages.CONSTRUCT_ERROR
 * 
 * @class MagoPolyline
 * @constructor
 */
var MagoPolyline = function(position, style) 
{
	MagoRenderable.call(this);
	if (!(this instanceof MagoPolyline)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
    
	this.style = {};
	this.style.thickness = 2.0;
    
	this.knotGeoCoordsArray;
	this.setPosition(position);
    
	if (style)
	{
		this.style = style;
	}
    
	// Calculate geoLocationData.
	var resultGeographicCoord;
	resultGeographicCoord = this.knotGeoCoordsArray[0];
    
	var geoLocDataManager = new GeoLocationDataManager();
	var geoLocData = geoLocDataManager.newGeoLocationData();
	geoLocData = ManagerUtils.calculateGeoLocationData(resultGeographicCoord.longitude, resultGeographicCoord.latitude, resultGeographicCoord.altitude, undefined, undefined, undefined, geoLocData);
	// set the geoLocDataManager of the terrainScanner.
	this.geoLocDataManager = geoLocDataManager;
    
	// Note: the cartesianCoords are rotated, so :
	geoLocData.rotMatrix.Identity();
};

MagoPolyline.prototype = Object.create(MagoRenderable.prototype);
MagoPolyline.prototype.constructor = MagoPolyline;

/**
 * set position
 * @param {object} position
 */
MagoPolyline.prototype.setPosition = function(position) 
{
	var coordsCount = position.coordinates.length;
	if (coordsCount > 1)
	{
		if (this.knotGeoCoordsArray === undefined)
		{ this.knotGeoCoordsArray = []; }

		for (var i=0; i<coordsCount; i++)
		{
			var coord = position.coordinates[i];
			var geoCoord = new GeographicCoord(coord.longitude, coord.latitude, coord.altitude);
			this.knotGeoCoordsArray.push(geoCoord);
		}
	}
};

/**
 * Makes the geometry mesh.
 */
MagoPolyline.prototype.makeMesh = function(magoManager)
{
	if (this.knotGeoCoordsArray === undefined)
	{ return; } // error

	var color = Color.fromHexCode(this.style.color, undefined);

	var options = {
		thickness : this.style.thickness,
		color     : color
	};
	var vectorMesh = GeographicCoordsList.getRenderableObjectOfGeoCoordsArray(this.knotGeoCoordsArray, magoManager, options);
	
	//vectorMesh.color4 = color;
	this.objectsArray.push(vectorMesh);
	this.setDirty(false);
};

