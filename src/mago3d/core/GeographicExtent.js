'use strict';

/**
 * Bouonding box which has vertexs represented as lon,lat,alt.
 * @class GeographicExtent
 */
var GeographicExtent = function(minLon, minLat, minAlt, maxLon, maxLat, maxAlt) 
{
	if (!(this instanceof GeographicExtent)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
	this.minGeographicCoord;
	this.maxGeographicCoord;
	
	if (minLon !== undefined && minLat !== undefined && minAlt !== undefined)
	{
		if (this.minGeographicCoord === undefined)
		{ this.minGeographicCoord = new GeographicCoord(); }
		
		this.minGeographicCoord.setLonLatAlt(minLon, minLat, minAlt);
	}
	
	if (maxLon !== undefined && maxLat !== undefined && maxAlt !== undefined)
	{
		if (this.maxGeographicCoord === undefined)
		{ this.maxGeographicCoord = new GeographicCoord(); }
		
		this.maxGeographicCoord.setLonLatAlt(maxLon, maxLat, maxAlt);
	}
};

/**
 * Clear the value of this instance
 */
GeographicExtent.prototype.deleteObjects = function() 
{
	if (this.minGeographicCoord !== undefined)
	{
		this.minGeographicCoord.deleteObjects();
		this.minGeographicCoord = undefined;
	}
	
	if (this.maxGeographicCoord !== undefined)
	{
		this.maxGeographicCoord.deleteObjects();
		this.maxGeographicCoord = undefined;
	}
};

/**
 * set the value of this instance
 * @param minLon the value of lon of the lower bound
 * @param minLat the value of lat of the lower bound
 * @param minAlt the value of alt of the lower bound
 * @param maxLon the value of lon of the lower bound
 * @param maxLat the value of lat of the lower bound
 * @param maxAlt the value of alt of the lower bound
 */
GeographicExtent.prototype.setExtent = function(minLon, minLat, minAlt, maxLon, maxLat, maxAlt) 
{
	if (this.minGeographicCoord === undefined)
	{ this.minGeographicCoord = new GeographicCoord(); }
	
	this.minGeographicCoord.setLonLatAlt(minLon, minLat, minAlt);
	
	if (this.maxGeographicCoord === undefined)
	{ this.maxGeographicCoord = new GeographicCoord(); }
	
	this.maxGeographicCoord.setLonLatAlt(maxLon, maxLat, maxAlt);
};

/**
 * set the value of this instance
 * @param minAlt the value of alt of the lower bound
 * @param maxAlt the value of alt of the lower bound
 */
GeographicExtent.prototype.setExtentAltitudes = function(minAlt, maxAlt) 
{
	if (this.minGeographicCoord === undefined)
	{ this.minGeographicCoord = new GeographicCoord(); }
	
	this.minGeographicCoord.setAltitude(minAlt);
	
	if (this.maxGeographicCoord === undefined)
	{ this.maxGeographicCoord = new GeographicCoord(); }
	
	this.maxGeographicCoord.setAltitude(maxAlt);
};

/**
 * set the value of this instance
 * @param lon
 * @param lat
 * @param alt
 */
GeographicExtent.prototype.setInitExtent = function(lon, lat, alt) 
{
	this.setExtent(lon, lat, alt, lon, lat, alt);
};

/**
 * set the value of this instance
 * @param lon
 * @param lat
 * @param alt
 */
GeographicExtent.prototype.addGeographicCoord = function(geoCoord) 
{
	var lon = geoCoord.longitude;
	var lat = geoCoord.latitude;
	var alt = geoCoord.altitude;
	
	if (this.minGeographicCoord === undefined)
	{ 
		this.minGeographicCoord = new GeographicCoord(); 
		this.minGeographicCoord.setLonLatAlt(lon, lat, alt);
	}
	else 
	{
		if (lon < this.minGeographicCoord.longitude)
		{ this.minGeographicCoord.setLongitude(lon); }
		
		if (lat < this.minGeographicCoord.latitude)
		{ this.minGeographicCoord.setLatitude(lat); }
		
		if (alt < this.minGeographicCoord.altitude)
		{ this.minGeographicCoord.setAltitude(alt); }
	}
	
	if (this.maxGeographicCoord === undefined)
	{ 
		this.maxGeographicCoord = new GeographicCoord(); 
		this.maxGeographicCoord.setLonLatAlt(lon, lat, alt);
	}
	else 
	{
		if (lon > this.maxGeographicCoord.longitude)
		{ this.maxGeographicCoord.setLongitude(lon); }
		
		if (lat > this.maxGeographicCoord.latitude)
		{ this.maxGeographicCoord.setLatitude(lat); }
		
		if (alt > this.maxGeographicCoord.altitude)
		{ this.maxGeographicCoord.setAltitude(alt); }
	}
};

GeographicExtent.prototype.getCenterLongitude = function() 
{
	var minLon = this.minGeographicCoord.longitude;
	var maxLon = this.maxGeographicCoord.longitude;
	return (maxLon+minLon)/2;
};

GeographicExtent.prototype.getCenterLatitude = function() 
{
	var minLat = this.minGeographicCoord.latitude;
	var maxLat = this.maxGeographicCoord.latitude;
	return (maxLat+minLat)/2;
};

GeographicExtent.prototype.getCenterAltitude = function() 
{
	var minAlt = this.minGeographicCoord.altitude;
	var maxAlt = this.maxGeographicCoord.altitude;
	return (maxAlt+minAlt)/2;
};

/**
 * Returns the middle point of the lower bound point and uppper bound point
 * @param resultGeographicCoord the point which will save the result
 * @returns {GeographicCoord}
 */
GeographicExtent.prototype.getMidPoint = function(resultGeographicCoord) 
{
	return GeographicCoord.getMidPoint(this.minGeographicCoord, this.maxGeographicCoord, resultGeographicCoord);
};

/**
 * Returns the minimum longitude in radians.
 * @returns {Number}
 */
GeographicExtent.prototype.getExtentVec4 = function() 
{
	// This function returns an array = [minLon, minLat, maxLon, maxLat].***
	if (this.minGeographicCoord === undefined || this.maxGeographicCoord === undefined)
	{ return; }

	return [this.minGeographicCoord.longitude, this.minGeographicCoord.latitude, this.maxGeographicCoord.longitude, this.maxGeographicCoord.latitude];
};

/**
 * Returns the minimum latitude in radians.
 * @returns {Number}
 */
GeographicExtent.prototype.getMinLatitudeRad = function() 
{
	if (this.minGeographicCoord === undefined)
	{ return; }
	
	return this.minGeographicCoord.getLatitudeRad();
};

/**
 * Returns the minimum latitude in radians.
 * @returns {Number}
 */
GeographicExtent.prototype.getMinAltitude = function() 
{
	if (this.minGeographicCoord === undefined)
	{ return; }
	
	return this.minGeographicCoord.altitude;
};

/**
 * Returns the minimum latitude in radians.
 * @returns {Number}
 */
GeographicExtent.prototype.getMaxAltitude = function() 
{
	if (this.maxGeographicCoord === undefined)
	{ return; }
	
	return this.maxGeographicCoord.altitude;
};

GeographicExtent.prototype.getLongitudeRange = function() 
{
	return this.maxGeographicCoord.longitude - this.minGeographicCoord.longitude;
};

GeographicExtent.prototype.getLatitudeRange = function() 
{
	return this.maxGeographicCoord.latitude - this.minGeographicCoord.latitude;
};

GeographicExtent.prototype.getAltitudeRange = function() 
{
	return this.maxGeographicCoord.altitude - this.minGeographicCoord.altitude;
};

GeographicExtent.prototype.getLongitudeArcDistance = function() 
{
	// This function returns the arcDistance in longitude of the midLatitude.***
	var midGeoCoord = this.getMidPoint();
	var minGeoCoord = new GeographicCoord(this.minGeographicCoord.longitude, midGeoCoord.latitude, midGeoCoord.altitude);
	var maxGeoCoord = new GeographicCoord(this.maxGeographicCoord.longitude, midGeoCoord.latitude, midGeoCoord.altitude);
	return Globe.getArcDistanceBetweenGeographicCoords(minGeoCoord, maxGeoCoord);
};

GeographicExtent.prototype.getLatitudeArcDistance = function() 
{
	// This function returns the arcDistance in latitude of the midLongitude.***
	var midGeoCoord = this.getMidPoint();
	var minGeoCoord = new GeographicCoord(midGeoCoord.longitude, this.minGeographicCoord.latitude, midGeoCoord.altitude);
	var maxGeoCoord = new GeographicCoord(midGeoCoord.longitude, this.maxGeographicCoord.latitude, midGeoCoord.altitude);
	return Globe.getArcDistanceBetweenGeographicCoords(minGeoCoord, maxGeoCoord);
};

/**
 * Returns the minimum longitude in radians.
 * @returns {Number}
 */
GeographicExtent.prototype.getMinLongitudeRad = function() 
{
	if (this.minGeographicCoord === undefined)
	{ return; }
	
	return this.minGeographicCoord.getLongitudeRad();
};

/**
 * Returns the maximum latitude in radians.
 * @returns {Number}
 */
GeographicExtent.prototype.getMaxLatitudeRad = function() 
{
	if (this.maxGeographicCoord === undefined)
	{ return; }
	
	return this.maxGeographicCoord.getLatitudeRad();
};

/**
 * Returns the maximum longitude in radians.
 * @returns {Number}
 */
GeographicExtent.prototype.getMaxLongitudeRad = function() 
{
	if (this.maxGeographicCoord === undefined)
	{ return; }
	
	return this.maxGeographicCoord.getLongitudeRad();
};

GeographicExtent.prototype.intersects2dWithGeoCoord = function(geoCoord) 
{
	// In 2D intersection do not considere "altitude".
	var lon = geoCoord.longitude;
	var lat = geoCoord.latitude;
	
	if (lon > this.minGeographicCoord.longitude && lon < this.maxGeographicCoord.longitude)
	{
		if (lat > this.minGeographicCoord.latitude && lat < this.maxGeographicCoord.latitude)
		{
			return true;
		}
	}
	
	return false;
};

GeographicExtent.prototype.containsEntirelyGeoExtent2d = function(geoExtent_B) 
{
	// This function returs true if the geoExtent_B is entirely inside of this.***
	var minGeoCoord = geoExtent_B.minGeographicCoord;
	var maxGeoCoord = geoExtent_B.maxGeographicCoord;

	if (this.intersects2dWithGeoCoord(minGeoCoord) && this.intersects2dWithGeoCoord(maxGeoCoord))
	{
		return true;
	}

	return false;
};

GeographicExtent.prototype.getIntersectionTypeWithGeoExtent2d = function(geoExtent_B) 
{
	// Note : "this" is the geoExtent_A.***
	//------------------------------------------
	//Constant.INTERSECTION_OUTSIDE = 0;
	//Constant.INTERSECTION_INTERSECT= 1;
	//Constant.INTERSECTION_A_CONTAINS_B = 5;
	//Constant.INTERSECTION_B_CONTAINS_A = 6;
	//------------------------------------------

	if (this.intersects2dWithGeoExtent(geoExtent_B))
	{
		if (this.containsEntirelyGeoExtent2d(geoExtent_B))
		{
			return Constant.INTERSECTION_A_CONTAINS_B;
		}
		else if (geoExtent_B.containsEntirelyGeoExtent2d(this))
		{
			return Constant.INTERSECTION_B_CONTAINS_A;
		}
		else 
		{
			return Constant.INTERSECTION_INTERSECT;
		}
	}
	else
	{
		return Constant.INTERSECTION_OUTSIDE;
	}
};

GeographicExtent.prototype.intersects2dWithGeoExtent = function(geoExtent) 
{
	// In 2D intersection do not considere "altitude".
	var thisMinGeoCoord = this.minGeographicCoord;
	var thisMaxGeoCoord = this.maxGeographicCoord;
	var minGeoCoord = geoExtent.minGeographicCoord;
	var maxGeoCoord = geoExtent.maxGeographicCoord;

	if (thisMinGeoCoord.longitude > maxGeoCoord.longitude || thisMaxGeoCoord.longitude < minGeoCoord.longitude)
	{ return false; }
	else if (thisMinGeoCoord.latitude > maxGeoCoord.latitude || thisMaxGeoCoord.latitude < minGeoCoord.latitude)
	{ return false; }

	return true;
};

GeographicExtent.prototype.getQuantizedPoints = function(geoCoordsArray, resultQPointsArray) 
{
	// This function returns the quantizedPoint3d.
	// Quantized points domain is positive short size (0 to 32767).***
	if (!resultQPointsArray)
	{
		resultQPointsArray = [];
	}

	var minGeoCoord = this.minGeographicCoord;
	var maxGeoCoord = this.maxGeographicCoord;

	var minLon = minGeoCoord.longitude;
	var maxLon = maxGeoCoord.longitude;

	var minLat = minGeoCoord.latitude;
	var maxLat = maxGeoCoord.latitude;

	var minAlt = minGeoCoord.altitude;
	var maxAlt = maxGeoCoord.altitude;

	var lonRange = maxLon - minLon;
	var latRange = maxLat - minLat;
	var altRange = maxAlt - minAlt;

	var unitary_u, unitary_v, unitary_h;
	var corrdsCount = geoCoordsArray.length;
	for (var i=0; i<corrdsCount; i++)
	{
		var geoCoord = geoCoordsArray[i];
		unitary_u = (geoCoord.longitude - minLon) / lonRange;
		unitary_v = (geoCoord.latitude - minLat) / latRange;
		unitary_h = (geoCoord.altitude - minAlt) / altRange;

		var shortMax = 32767;
		//resultQPoint.set(unitary_u * shortMax, unitary_v * shortMax, unitary_h * shortMax);
		var qPoint = new Point3D(unitary_u * shortMax, unitary_v * shortMax, unitary_h * shortMax);
		resultQPointsArray.push(qPoint);
	}

	return resultQPointsArray;
};

GeographicExtent.prototype.getRenderableObject = function(magoManager) 
{
	// 1rst, create a geoCoordsList.
	var minGeoCoord = this.minGeographicCoord;
	var maxGeoCoord = this.maxGeographicCoord;
	
	var minLon = minGeoCoord.longitude;
	var maxLon = maxGeoCoord.longitude;
	var minLat = minGeoCoord.latitude;
	var maxLat = maxGeoCoord.latitude;
	var minAlt = minGeoCoord.altitude;
	var maxAlt = maxGeoCoord.altitude;

	var geoCoordsList = new GeographicCoordsList();
	geoCoordsList.newGeoCoord(minLon, minLat, minAlt);
	geoCoordsList.newGeoCoord(maxLon, minLat, minAlt);
	geoCoordsList.newGeoCoord(maxLon, maxLat, minAlt);
	geoCoordsList.newGeoCoord(minLon, maxLat, minAlt);

	var extrusionHeight = maxAlt - minAlt;
	var bLoop = true;

	var renderableObject = geoCoordsList.getExtrudedMeshRenderableObject(extrusionHeight, bLoop, undefined, magoManager, undefined);
	/*
	// Example of attributes that can to be setted after created.***************************************************************
	renderableObject.setOneColor(0.2, 0.7, 0.8, 0.05);
	renderableObject.attributes.isMovable = false;
	renderableObject.attributes.isSelectable = false;
	renderableObject.attributes.name = "extrudedObject";
	renderableObject.attributes.selectedColor4 = new Color(1.0, 0.0, 0.0, 0.0); // selectedColor fully transparent.
	if (renderableObject.options === undefined)
	{ renderableObject.options = {}; }
	
	renderableObject.options.renderWireframe = true;
	renderableObject.options.renderShaded = true;
	renderableObject.options.depthMask = false;
	// ***************************************************************************************************************************
	*/
	return renderableObject;
};

















































