'use strict';


/**
 * GeoLocationDataManager is a class object that contains GeoLocationData objects in an array.
 * 
 * @class GeoLocationDataManager
 * @constructor 
 */
var GeoLocationDataManager = function() 
{
	if (!(this instanceof GeoLocationDataManager)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
	this.geoLocationDataArray = [];
	this.geoLocationDataArrayMaxLengthAllowed = 15;
};

/**
 * Clear all object of GeoLocationDataManager
 */
GeoLocationDataManager.prototype.deleteObjects = function() 
{
	if (this.geoLocationDataArray)
	{
		for (var i=0; i<this.geoLocationDataArray.length; i++)
		{
			this.geoLocationDataArray[i].deleteObjects();
			this.geoLocationDataArray[i] = undefined;
		}
		this.geoLocationDataArray = [];
	}
};

/**
 * Remove the latest GeoLocationData instance
 */
GeoLocationDataManager.prototype.popGeoLocationData = function() 
{
	this.geoLocationDataArray.pop();
};

/**
 * put the geoLocationData from this.geoLocationDataArray
 * @param geoLocationName 변수
 */
GeoLocationDataManager.prototype.newGeoLocationData = function(geoLocationName) 
{
	var currGeoLocData = this.getCurrentGeoLocationData();
	
	if (geoLocationName === undefined)
	{ geoLocationName = "noName" + this.geoLocationDataArray.length.toString(); }
	var geoLocationData = new GeoLocationData(geoLocationName);
	this.geoLocationDataArray.unshift(geoLocationData);
	
	if (this.geoLocationDataArray.length > this.geoLocationDataArrayMaxLengthAllowed)
	{
		this.geoLocationDataArray.pop();
		// delete extracted geoLocdata. TODO:
	}
	
	if (currGeoLocData)
	{
		// If exist a geoLocationData previous, then copy from it.
		geoLocationData.copyFrom(currGeoLocData);
	}

	return geoLocationData;
};

/**
 * put the geoLocationData from this.geoLocationDataArray
 * @param geoLocationName 변수
 */
GeoLocationDataManager.prototype.addGeoLocationData = function(geoLocData) 
{
	this.geoLocationDataArray.unshift(geoLocData);
	
	if (this.geoLocationDataArray.length > this.geoLocationDataArrayMaxLengthAllowed)
	{
		this.geoLocationDataArray.pop();
		// delete extracted geoLocdata. TODO:
	}

	return geoLocationData;
};

/**
 * return the length of this geoLocationDataArray
 * @returns {Number} the length of this geoLocationDataArray
 */
GeoLocationDataManager.prototype.getGeoLocationDatasCount = function() 
{
	return this.geoLocationDataArray.length;
};

/**
 * 어떤 일을 하고 있습니까?
 * @class GeoLocationData
 * @param {Number} idx
 * @returns this.geoLoactionDataArray[idx]
 */
GeoLocationDataManager.prototype.getGeoLocationData = function(idx) 
{
	if (idx > this.geoLocationDataArray.length - 1)
	{ return undefined; }
	return this.geoLocationDataArray[idx];
};

/**
 * provisionally return the first data of GeoLocationDataArray
 * @class GeoLocationData
 * @param {Number}idx
 * @returns {GeoLocationData}this.geoLoactionDataArray[idx]
 */
GeoLocationDataManager.prototype.getCurrentGeoLocationData = function() 
{
	if (this.geoLocationDataArray.length === 0)
	{
		return undefined;
	}
	return this.geoLocationDataArray[0]; // provisionally return the 1rst.
};