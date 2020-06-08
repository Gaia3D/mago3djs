'use strict';
/**
 * 
 * @typedef {object} MagoPoint~Coordinate MagoPoint coordinate scheme.
 * @property {number} longitude 
 * @property {number} latitude 
 * @property {number} altitude 
 */
/** 
 * @typedef {object} MagoPoint~MagoPointStyle MagoPoint style 옵션.
 * @property {number} size point size.
 * @property {number} opacity range 0-1. default is 1.
 * @property {string} color html color code.
 * @property {string} strokeColor point stroke color. html color code.
 */
/**
 * 폴리라인을 표현하는 클래스
 * @exception {Error} Messages.CONSTRUCT_ERROR
 * 
 * @constructor
 * @class MagoPoint
 * @param {MagoPoint~Coordinate} position position info. coordinate. required.
 * @param {MagoPoint~MagoPointStyle} style point style. optional.
 *  
 * @extends MagoGeometry
 * 
 * @example
 * var position = {longitude : 0, latitude : 0, altitude : 1};
 * var style = {color:'ff0000',thickness:0.8};
 * 
 * var magoPoint = new MagoPoint(position, style);
 */
var MagoPoint = function(position, style) 
{
	
	if (!(this instanceof MagoPoint)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	/**
	 * Minimum coord of this rectangle
	 * @type {GeographicCoord}
	 */
	this.geoCoord;
	
	MagoGeometry.call(this, position, style);

	// Calculate geoLocationData.
	var geoLocDataManager = new GeoLocationDataManager();
	var geoLocData = geoLocDataManager.newGeoLocationData();
	geoLocData = ManagerUtils.calculateGeoLocationData(this.geoCoord.longitude, this.geoCoord.latitude, this.geoCoord.altitude, undefined, undefined, undefined, geoLocData);
	// set the geoLocDataManager of the terrainScanner.
	this.geoLocDataManager = geoLocDataManager;
};

MagoPoint.prototype = Object.create(MagoGeometry.prototype);
MagoPoint.prototype.constructor = MagoPoint;

/**
 * set position
 * @param {MagoPoint~Coordinate} position
 */
MagoPoint.prototype.setPosition = function(position) 
{
	if (!position)
	{ return; } // error.

	this.geoCoord = new GeographicCoord(position.longitude, position.latitude, position.altitude);

};

/**
 * Makes the geometry mesh.
 * @private
 */
MagoPoint.prototype.makeMesh = function(magoManager)
{
	// there are no mesh to make.
	var vboKeyContainer = new VBOVertexIdxCacheKeysContainer();
	var vboKey = vboKeyContainer.newVBOVertexIdxCacheKey();
	var vboMemManager = magoManager.vboMemoryManager;
	
	// Positions.
	var positions = new Float32Array([0.0, 0.0, 0.0]);
	vboKey.setDataArrayPos(positions, vboMemManager);

	var options = this.style;
	var pointMesh = new PointMesh(options);
	pointMesh.vboKeysContainer = vboKeyContainer;
    
	// Finally put the mesh into magoRenderables-objectsArray.
	this.objectsArray.push(pointMesh);
    
	this.setDirty(false);
};