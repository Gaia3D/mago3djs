'use strict';

var GeographicExtent_ = function(minLon, minLat, minAlt, maxLon, maxLat, maxAlt) 
{
	this.minGeographicCoord;
	this.maxGeographicCoord;
	
	if (minLon !== undefined && minLat !== undefined && minAlt !== undefined)
	{
		if (this.minGeographicCoord === undefined)
		{ this.minGeographicCoord = new GeographicCoord_(); }
		
		this.minGeographicCoord.setLonLatAlt(minLon, minLat, minAlt);
	}
	
	if (maxLon !== undefined && maxLat !== undefined && maxAlt !== undefined)
	{
		if (this.maxGeographicCoord === undefined)
		{ this.maxGeographicCoord = new GeographicCoord_(); }
		
		this.maxGeographicCoord.setLonLatAlt(maxLon, maxLat, maxAlt);
	}
};

GeographicExtent_.prototype.getQuantizedPoints = function(geoCoordsArray, resultQPointsArray) 
{
	// This function returns the quantizedPoint3d.
	// Quantized points domain is positive short size (0 to 32767).***
	if(!resultQPointsArray)
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

	if(Math.abs(altRange) < 1e-12)
	{
		altRange = 1.0;
	}

	var unitary_u, unitary_v, unitary_h;
	var corrdsCount = geoCoordsArray.length;
	for(var i=0; i<corrdsCount; i++)
	{
		var geoCoord = geoCoordsArray[i];
		unitary_u = (geoCoord.longitude - minLon) / lonRange;
		unitary_v = (geoCoord.latitude - minLat) / latRange;
		unitary_h = (geoCoord.altitude - minAlt) / altRange;

		var shortMax = 32767;
		var qPoint = new Point3D_(unitary_u * shortMax, unitary_v * shortMax, unitary_h * shortMax);
		resultQPointsArray.push(qPoint);
	}

	return resultQPointsArray;
};