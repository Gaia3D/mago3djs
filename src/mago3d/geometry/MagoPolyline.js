'use strict';
/**
 * 
 * @typedef {object} MagoPolyline~MagoPolylinePosition MagoPolyline position 옵션.
 * @property {Array<MagoPoint~Coordinate>} coordinates 
 */
/** 
 * @typedef {object} MagoPolyline~MagoPolylineStyle MagoPolyline style 옵션.
 * @property {number} thickness line thickness. default is 2.
 * @property {string} color html color code.
 * @property {MagoPoint~PointStyle} point line vertex style. if this option is defined, line vertex render.
 */
/**
 * 폴리라인을 표현하는 클래스
 * @exception {Error} Messages.CONSTRUCT_ERROR
 * 
 * @constructor
 * @class MagoPolyline
 * @param {MagoPolyline~MagoPolylinePosition} position position info. coordinate list. required.
 * @param {MagoPolyline~MagoPolylineStyle} style polyline style. optional.
 *  
 * @extends MagoGeometry
 * 
 * @example
 * var position = {
 * 					coordinates : [
 * 						{longitude : 0, latitude : 0, altitude : 1},
 * 						{longitude : 0, latitude : 1, altitude : 1},
 * 						{longitude : 1, latitude : 1, altitude : 1}
 * 					]
 * 				};
 * var style = {color:'ff0000',thickness:0.8};
 * 
 * var magoPolyline = new MagoPolyline(position, style);
 */
var MagoPolyline = function(position, style) 
{
	
	if (!(this instanceof MagoPolyline)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this.knotGeoCoordsArray;
	MagoGeometry.call(this, position, style);

	if (!this.style.thickness) { this.style.thickness = 2.0; }
    
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

MagoPolyline.prototype = Object.create(MagoGeometry.prototype);
MagoPolyline.prototype.constructor = MagoPolyline;

/**
 * set position
 * @param {MagoPolyline~MagoPolylinePosition} position
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
 * @private
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

	// Check style. If exist points, then create points.
	//var magoPoint = new MagoPoint(position, style);
	if (this.style.point)
	{
		var pointsStyle = this.style.point;

		var coordsCount = this.knotGeoCoordsArray.length;
		if (coordsCount > 1)
		{
			for (var i=0; i<coordsCount; i++)
			{
				var coord = this.knotGeoCoordsArray[i];
				var position = {
					longitude : coord.longitude,
					latitude  : coord.latitude,
					altitude  : coord.altitude
				};
				var magoPoint = new MagoPoint(position, pointsStyle);
				this.objectsArray.push(magoPoint);
			}
		}
	}
	
	this.objectsArray.push(vectorMesh);
	this.setDirty(false);
};

/**
 * get MagoPoint by index
 * @param {number} index
 * 
 * @return {MagoPoint}
 */
MagoPolyline.prototype.getPointByIndex = function(index) 
{
	var points = this.getPoints();
	if (points.length <= index) 
	{
		throw new Error('Out of range');
	}

	if (points.length > 0) 
	{
		return points[index];
	}
	return;
};

/**
 * get MagoPoint array
 * @return {Array<MagoPoint>}
 */
MagoPolyline.prototype.getPoints = function() 
{
	return this.objectsArray.filter(function(mesh) 
	{
		return mesh instanceof MagoPoint;
	});
};