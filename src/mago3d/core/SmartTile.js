'use strict';

/**
 * Quadtree based tile with thickness.
 * @class SmartTile
 */
var SmartTile = function(smartTileName) 
{
	if (!(this instanceof SmartTile)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	this.name = "";
	if (smartTileName)
	{ this.name = smartTileName; }
	
	this.minGeographicCoord; // longitude, latitude, altitude.
	this.maxGeographicCoord; // longitude, latitude, altitude.
	this.subTiles; // array.
	
	
};

/**
 * Quadtree based tile with thickness.
 * @class SmartTileManager
 */
var SmartTileManager = function() 
{
	if (!(this instanceof SmartTileManager)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
	this.tilesArray = [];
	
	
};

/**
 * 어떤 일을 하고 있습니까?
 * @class GeoLocationData
 * @param geoLocData 변수
 */
SmartTileManager.prototype.newSmartTile = function(smartTileName) 
{
	var smartTile = new SmartTile(smartTileName);
	this.tilesArray.push(smartTile);
	return smartTile;
};