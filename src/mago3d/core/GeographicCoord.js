'use strict';

/**
 * This class represents the coordinate as geographic coordinate system
 * @class GeographicCoord
 * @constructor
 */
var GeographicCoord = function(lon, lat, alt) 
{
	if (!(this instanceof GeographicCoord)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
	/**
	 * The "longitude" of a point on Earth's surface is the angle east or west of a reference meridian to another meridian that passes through that point.
	 * The unit of "longitude" is degree.
	 * @type {Number}
	 * @default undefined
	 */
	this.longitude;
	
	/**
	 * The "latitude" of a point on Earth's surface is the angle between the equatorial plane and the straight line that passes through that point and through (or close to) the center of the Earth.
	 * The unit of "latitude" is degree.
	 * @type {Number}
	 * @default undefined
	 */
	this.latitude;
	
	/**
	 * The "altitude" of a point is relative to the sea that is defined by an ellipsoid.
	 * The unit of "altitude" is meters.
	 * @type {Number}
	 * @default undefined
	 */
	this.altitude;
	
	if (lon !== undefined)
	{ this.longitude = lon; }
	
	if (lat !== undefined)
	{ this.latitude = lat; }
	
	if (alt !== undefined)
	{ this.altitude = alt; }

	/**
	 * The cartesian coordinate of a point defined by the longitude, latitude & altitude in the current world coordinate system.
	 * The unit of "altitude" is meters.
	 * @type {Point3D}
	 * @default undefined
	 */
	this.absolutePoint; 
	
	/**
	 * This class is the container which holds the VBO Cache Keys.
	 * Used to render the point on earth.
	 * @type {VBOVertexIdxCacheKeysContainer}
	 */
	this.vboKeysContainer;
	
	/**
	 * GeoLocationDataManager is a class object that contains GeoLocationData objects in an array.
	 * @type {GeoLocationDataManager}
	 */
	this.geoLocDataManager;
	
	/**
	 * Object or class that has this geographicCoord.
	 * @type {Class/Object}
	 */
	this.owner;
};

/**
 * cartesian으로 부터 GeographicCoords 객체 생성
 * @param {Array<object>} cartesian
 * @return {GeographicCoord}
 * @static
 */
GeographicCoord.fromCartesian = function(cartesian) 
{
	return ManagerUtils.pointToGeographicCoord(cartesian);
};

/**
 * Clear the value of this instance from the vbo key container and geoLocDataManager 
 * @param {VBOMemoryManager}vboMemManager
 */
GeographicCoord.prototype.deleteObjects = function(vboMemManager) 
{
	this.longitude = undefined;
	this.latitude = undefined;
	this.altitude = undefined;
	
	if (this.absolutePoint !== undefined)
	{
		this.absolutePoint.deleteObjects();
		this.absolutePoint = undefined;
	}
	
	if (this.vboKeysContainer !== undefined)
	{
		this.vboKeysContainer.deleteGlObjects(vboMemManager.gl, vboMemManager);
	}
	
	if (this.geoLocDataManager !== undefined)
	{
		this.geoLocDataManager.deleteObjects();
	}
	
	this.owner = undefined;
};

/**
 * Change this GeographicCoord point to Point3D point
 * @param {Point3D} resultPoint3D
 */
GeographicCoord.prototype.getWgs84Point3D = function(resultPoint3d) 
{
	var cartesianAux = Globe.geographicToCartesianWgs84(this.longitude, this.latitude, this.altitude, undefined);
	
	if (resultPoint3d === undefined)
	{ resultPoint3d = new Point3D(); }
	
	resultPoint3d.set(cartesianAux[0], cartesianAux[1], cartesianAux[2]);
	return resultPoint3d;
};

/**
 * Change this GeographicCoord point to Point2D point using Mercator projection
 * @param {Point2D} resultPoint2d
 */
GeographicCoord.prototype.getMercatorProjection = function(resultPoint2d) 
{
	return Globe.geographicToMercatorProjection(this.longitude, this.latitude, resultPoint2d);
};

/**
 * get the GeoLocationDataManager of this feature
 */
GeographicCoord.prototype.makeDefaultGeoLocationData = function() 
{
	if (this.geoLocDataManager === undefined)
	{ this.geoLocDataManager = new GeoLocationDataManager(); }
	
	var geoLocData = this.geoLocDataManager.getCurrentGeoLocationData();
	if (geoLocData === undefined)
	{
		geoLocData = this.geoLocDataManager.newGeoLocationData("default");
		geoLocData = ManagerUtils.calculateGeoLocationData(this.longitude, this.latitude, this.altitude, undefined, undefined, undefined, geoLocData);
	}
};

/**
 * get the GeoLocationDataManager of this feature
 */
GeographicCoord.prototype.getGeoLocationDataManager = function() 
{
	if (this.geoLocDataManager === undefined)
	{ this.geoLocDataManager = new GeoLocationDataManager(); }
	
	return this.geoLocDataManager ;
};

/**
 * Copy the value of the other GeographicCoord feature
 * @param {GeographicCoord} geographicCoord
 */
GeographicCoord.prototype.copyFrom = function(geographicCoord) 
{
	this.longitude = geographicCoord.longitude;
	this.latitude = geographicCoord.latitude;
	this.altitude = geographicCoord.altitude;
};

/**
 * Set lon,lat,alt at this feature
 * @param longitude 경도
 * @param latitude 위도
 * @param altitude 고도
 */
GeographicCoord.prototype.setLonLatAlt = function(longitude, latitude, altitude) 
{
	if (longitude !== undefined)
	{ this.longitude = longitude; }
	if (latitude !== undefined)
	{ this.latitude = latitude; }
	if (altitude !== undefined)
	{ this.altitude = altitude; }
};

/**
 * Set lon at this feature
 * @param longitude 경도
 */
GeographicCoord.prototype.setLongitude = function(longitude) 
{
	this.longitude = longitude; 
};

/**
 * Set lon at this feature
 * @param longitude 경도
 */
GeographicCoord.prototype.setLatitude = function(latitude) 
{
	this.latitude = latitude; 
};

/**
 * Set lon at this feature
 * @param longitude 경도
 */
GeographicCoord.prototype.setAltitude = function(altitude) 
{
	this.altitude = altitude;
};

/**
 * Returns the latitude in radians.
 * @returns {Number}
 */
GeographicCoord.prototype.getLatitudeRad = function() 
{
	if (this.latitude === undefined)
	{ return; }
	
	return this.latitude *Math.PI/180;
};

/**
 * Returns the longitude in radians.
 * @returns {Number}
 */
GeographicCoord.prototype.getLongitudeRad = function() 
{
	if (this.longitude === undefined)
	{ return; }
	
	return this.longitude *Math.PI/180;
};

/**
 * Returns the altitude.
 * @returns {Number}
 */
GeographicCoord.prototype.getAltitude = function() 
{
	if (this.altitude === undefined)
	{ return; }
	
	return this.altitude;
};

/**
 * Returns the middle point between two GeopraphicCoord features
 * @param {GeographicCoord} geographicCoordA
 * @param {GeographicCoord} geographicCoordB
 * @param {GeographicCoord} resultGeographicCoord
 * @returns {GeographicCoord}
 */
GeographicCoord.getMidPoint = function(geographicCoordA, geographicCoordB, resultGeographicCoord) 
{
	var midLat = ( geographicCoordA.latitude + geographicCoordB.latitude) / 2.0;
	var midLon = ( geographicCoordA.longitude + geographicCoordB.longitude) / 2.0;
	var midAlt = ( geographicCoordA.altitude + geographicCoordB.altitude) / 2.0;
	
	if (resultGeographicCoord === undefined)
	{ resultGeographicCoord = new GeographicCoord(midLon, midLat, midAlt); }
	else 
	{
		resultGeographicCoord.setLonLatAlt(midLon, midLat, midAlt);
	}
	
	return resultGeographicCoord;
};

/**
 * Returns if the geographicCoord is coincident to this.
 * @param {GeographicCoord} geographicCoord
 * @param {Number} error
 * @returns {Boolean}
 */
GeographicCoord.prototype.isCoincidentToGeoCoord = function(geographicCoord, error, errorForAltitude) 
{
	if(!error)
	error = 1E-8;

	if(!errorForAltitude)
	errorForAltitude = 1E-6;

	if(Math.abs(this.longitude - geographicCoord.longitude) > error)
	return false;

	if(Math.abs(this.latitude - geographicCoord.latitude) > error)
	return false;

	if(this.altitude && geographicCoord.altitude)
	{
		if(Math.abs(this.altitude - geographicCoord.altitude) > errorForAltitude)
		return false;
	}

	return true;
};

/**
 * Returns the module of the vector of geographicCoordA to geographicCoordB, without altitude.
 * @param {GeographicCoord} geographicCoordA
 * @param {GeographicCoord} geographicCoordB
 * @returns {Number}
 */
GeographicCoord.getAngleBetweenCoords = function(geographicCoordA, geographicCoordB) 
{
	var lonDiff = geographicCoordB.longitude - geographicCoordA.longitude;
	var latDiff = geographicCoordB.latitude - geographicCoordA.latitude;
	var result = Math.sqrt(lonDiff*lonDiff + latDiff*latDiff);
	
	return result;
};

/**
 * make the vbo data of this feature
 * @param {VBOMemoryManager} vboMemManager
 */
 
GeographicCoord.prototype.prepareData = function(vboMemManager) 
{
	if (this.vboKeysContainer === undefined)
	{ this.vboKeysContainer = new VBOVertexIdxCacheKeysContainer(); }
	
	if (this.vboKeysContainer.getVbosCount() === 0)
	{
		var vboKey = this.vboKeysContainer.newVBOVertexIdxCacheKey();
		
		// Position.
		var pos = new Float32Array([0.0, 0.0, 0.0]);
		vboKey.setDataArrayPos(pos, vboMemManager);
	}
	
	return true;
};

/**
 * make the vbo data of this feature
 * @param {VBOMemoryManager} vboMemManager
 */
 
GeographicCoord.prototype.readDataFromBuffer = function(dataArrayBuffer, bytesReaded) 
{
	// read longitude(64), latitude(64), altitude(32).
	this.longitude = (new Float64Array(dataArrayBuffer.slice(bytesReaded, bytesReaded+8)))[0]; bytesReaded += 8;
	this.latitude = (new Float64Array(dataArrayBuffer.slice(bytesReaded, bytesReaded+8)))[0]; bytesReaded += 8;
	this.altitude = (new Float32Array(dataArrayBuffer.slice(bytesReaded, bytesReaded+4)))[0]; bytesReaded += 4;
	return bytesReaded;
};

/**
 * Render this feature
 */
GeographicCoord.prototype.renderPoint = function(magoManager, shader, gl, renderType) 
{
	if (!this.prepareData(magoManager.vboMemoryManager))
	{ return false; }
	
	var buildingGeoLocation = this.geoLocDataManager.getCurrentGeoLocationData();
	buildingGeoLocation.bindGeoLocationUniforms(gl, shader);
	
	if (renderType === 2)
	{
		var selectionManager = magoManager.selectionManager;
		var selectionColor = magoManager.selectionColor;

		var selColor = selectionColor.getAvailableColor(undefined); 
		var idxKey = selectionColor.decodeColor3(selColor.r, selColor.g, selColor.b);

		selectionManager.setCandidateGeneral(idxKey, this);
		gl.uniform4fv(shader.oneColor4_loc, [selColor.r/255.0, selColor.g/255.0, selColor.b/255.0, 1.0]);
	}
	
	var vbo_vicky = this.vboKeysContainer.vboCacheKeysArray[0]; // there are only one.
	if (!vbo_vicky.bindDataPosition(shader, magoManager.vboMemoryManager))
	{ return false; }

	gl.drawArrays(gl.POINTS, 0, vbo_vicky.vertexCount);
};

















































