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

/**
 * 
 */
 GeographicCoordsList_.prototype.setAltitude = function(length) 
 {
	 var geoCoord;
	 var geoCoordsCount = this.geographicCoordsArray.length;
	 for (var i=0; i<geoCoordsCount; i++)
	 {
		 geoCoord = this.geographicCoordsArray[i];
		 geoCoord.altitude = length;
	 }
 };

 /**
 * @param {Array<geographicCoord>} geographicCoordsArray
 * @return {boolean}
 */
GeographicCoordsList_.isClockwise = function(geographicCoordsArray) 
{
	 // This function deletes degenerated points.***
	 if (!geographicCoordsArray && geographicCoordsArray.length < 3)
	 { return; }

	 var geoCoordsCount = geographicCoordsArray.length;
	 var area = 0;
	 for (var i0=geoCoordsCount-1, i1=0; i1<geoCoordsCount; i0 = i1++)
	 {
		var v0 = geographicCoordsArray[i0];
		var v1 = geographicCoordsArray[i1];

		area += v0.longitude * v1.latitude - v1.longitude * v0.latitude;
	 }
	 area *= 0.5;

	 return area < 0;
};

/**
 * 
 */
 GeographicCoordsList_.solveDegeneratedPoints = function(geographicCoordsArray, error) 
 {
	 // This function deletes degenerated points.***
	 if (!geographicCoordsArray)
	 { return; }
 
	 // 1rst, solve uroborus.***
	 if (!error)
	 { error = 1E-8; }
	 GeographicCoordsList_.solveUroborus(geographicCoordsArray, error);
	 // 2nd, solve coincidentPoints.***
	 var geoCoordsCount = geographicCoordsArray.length;
	 for (var i=0; i<geoCoordsCount-1; i++)
	 {
		 var geoCoord1 = geographicCoordsArray[i];
		 var geoCoord2 = geographicCoordsArray[i+1];
 
		 if (!geoCoord2) { geoCoord2 = geographicCoordsArray[0]; }
		
		 var crossProduct = GeographicCoordsList_.getCrossProduct2D(geographicCoordsArray, i);

		 if(Math.abs(crossProduct) < 1E-7) {
			geographicCoordsArray.splice(i, 1);
			i--;
			geoCoordsCount--;
			continue;
		 }
 
		 if (geoCoord1.isCoincidentToGeoCoord(geoCoord2, error))
		 {
			 // delete the geoCoord2.***
			 geographicCoordsArray.splice(i+1, 1);
			 i--;
			 geoCoordsCount--;
			 continue;
		 }
	 }
 };
GeographicCoordsList_.getCrossProduct2D = function(geographicCoordsArray, idx) {

	var geoCoordsCount = geographicCoordsArray.length;

	var nextIdx;
	var prevIdx;

	if (idx === geoCoordsCount - 1)
	{ nextIdx = 0; }
	else
	{ nextIdx = idx + 1; }

	if(idx === 0) {
		prevIdx = geoCoordsCount - 1;
	}
	else
	{ prevIdx = idx - 1; }

	var prevGeoCoord = geographicCoordsArray[prevIdx];
	var geoCoord = geographicCoordsArray[idx];
	var nextGeoCoord = geographicCoordsArray[nextIdx];

	var vec1 = new Point2D_(geoCoord.longitude - prevGeoCoord.longitude, geoCoord.latitude - prevGeoCoord.latitude);
	var vec2 = new Point2D_(nextGeoCoord.longitude - geoCoord.longitude, nextGeoCoord.latitude - geoCoord.latitude);
	vec1.unitary();
	vec2.unitary();

	return vec1.crossProduct(vec2);
}
/**
 * 
 */
 GeographicCoordsList_.solveUroborus = function(geographicCoordsArray, error) 
 {
	 if (!geographicCoordsArray)
	 { return false; }
 
	 if (!error)
	 { error = 1E-8; }
 
	 var geoCoordsCount = geographicCoordsArray.length;
 
	 if (geoCoordsCount < 3)
	 { return false; }
 
	 var geoCoordStart = geographicCoordsArray[0];
	 var geoCoordLast = geographicCoordsArray[geoCoordsCount-1];
	 var errorForAltitude = error;
	 if (geoCoordStart.isCoincidentToGeoCoord(geoCoordLast, error, errorForAltitude) )
	 {
		 // delete the last geoCoord.***
		 geographicCoordsArray.pop();
		 return true;
	 }
 
	 return false;
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