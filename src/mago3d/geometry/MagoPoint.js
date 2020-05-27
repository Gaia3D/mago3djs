'use strict';
/**
 * 중심점과 가로, 세로 길이를 가진 클래스
 * @exception {Error} Messages.CONSTRUCT_ERROR
 * 
 * @class MagoRectangle
 * @constructor
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
 * @param {object} position
 */
MagoPoint.prototype.setPosition = function(position) 
{
	if (!position)
	{ return; } // error.

	this.geoCoord = new GeographicCoord(position.longitude, position.latitude, position.altitude);

};

/**
 * Makes the geometry mesh.
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


