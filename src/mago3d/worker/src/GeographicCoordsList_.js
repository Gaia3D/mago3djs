'use strict';

/**
 * @class GeographicCoordsList_
 */
var GeographicCoordsList_ = function(geographicCoordsArray) 
{
	if (geographicCoordsArray !== undefined) 
	{ 
		this.geographicCoordsArray = geographicCoordsArray; 
	}
	else 
	{ 
		this.geographicCoordsArray = []; 
	}
	//this.vboKeysContainer;
	this.owner;
	this.id;
};

GeographicCoordsList_.getGeoCoordsArrayFromNumbersArray = function(numbersArray) 
{
	// numbersArray = [lon, lat, alt, lon, lat, alt, lon, lat, alt, ...]
	var geoCoordsCount = numbersArray.length / 3;
	var geoCoordsArray = new Array(geoCoordsCount);
	for (var i=0; i<geoCoordsCount; i++) 
	{
		geoCoordsArray[i] = new GeographicCoord_(numbersArray[i*3], numbersArray[i*3+1], numbersArray[i*3+2]);
	}

	return geoCoordsArray;
};

GeographicCoordsList_.prototype.addGeoCoord = function(geographicPoint) 
{
	this.geographicCoordsArray.push(geographicPoint);
	geographicPoint.owner = this;
};

GeographicCoordsList_.prototype.getGeoCoord = function(idx) 
{
	if (this.geographicCoordsArray === undefined) 
	{ 
		return undefined; 
	}
	
	return this.geographicCoordsArray[idx];
};

GeographicCoordsList_.prototype.getGeoCoordsCount = function() 
{
	if (this.geographicCoordsArray === undefined) 
	{ 
		return 0; 
	}
	
	return this.geographicCoordsArray.length;
};

GeographicCoordsList_.prototype.getCopy = function(resultGeoCoordsListCopy) 
{
	if (resultGeoCoordsListCopy === undefined) 
	{ 
		resultGeoCoordsListCopy = new GeographicCoordsList_(); 
	}
	
	var geoPointsCount = this.getGeoCoordsCount();
	for (var i=0; i<geoPointsCount; i++) 
	{
		var geoCoord = this.getGeoCoord(i);
		var geoCoordCopy = new GeographicCoord_(geoCoord.longitude, geoCoord.latitude, geoCoord.altitude);
		resultGeoCoordsListCopy.addGeoCoord(geoCoordCopy);
	}
	
	return resultGeoCoordsListCopy;
};

GeographicCoordsList_.getPointsRelativeToGeoLocation = function(geoLocIn, geoCoordsArray, resultPoints3dArray, options) 
{
	if (resultPoints3dArray === undefined)
	{ resultPoints3dArray = []; }
	
	var geoPointsCount = geoCoordsArray.length;
	
	for (var i=0; i<geoPointsCount; i++)
	{
		var geoCoord = geoCoordsArray[i];
		var posAbs = Utils_.geographicCoordToWorldPoint(geoCoord.longitude, geoCoord.latitude, geoCoord.altitude);
		resultPoints3dArray[i] = geoLocIn.getTransformedRelativePosition(posAbs, resultPoints3dArray[i]);
	}
	
	return resultPoints3dArray;
};

GeographicCoordsList_.prototype.addAltitude = function(length) 
{
	var geoCoord;
	var geoCoordsCount = this.geographicCoordsArray.length;
	for (var i=0; i<geoCoordsCount; i++)
	{
		geoCoord = this.geographicCoordsArray[i];
		geoCoord.altitude += length;
	}
};