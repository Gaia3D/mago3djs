'use strict';

/**
 * QuantizedMeshExcavationSet
 * @class QuantizedMeshExcavationSet
 * 
 */
var QuantizedMeshExcavationSet = function(quantizedMeshManager, geoCoordsArray, excavationAltitude) 
{
	if (!(this instanceof QuantizedMeshExcavationSet)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this.quantizedMeshManager = quantizedMeshManager;
	this.guid;
	this.geoCoordsArray = geoCoordsArray;
	this.excavationAltitude = excavationAltitude;
	this.geoExtent;
	this.minDepth = 10;
	this.maxDepth = 23;
	this.intersectedTilesMap;
    
};

QuantizedMeshExcavationSet.prototype.getGeographicExtent = function ()
{
	if (!this.geoCoordsArray || this.geoCoordsArray.length === 0)
	{
		return;
	}

	if (!this.geoExtent)
	{
		// Calculate the geoExtent by geographicCoords.***
		this.geoExtent = GeographicCoordsList.getGeographicExtent(this.geoCoordsArray, undefined);
	}

	return this.geoExtent;
};

QuantizedMeshExcavationSet.prototype.getIntersectedTiles = function ()
{
	// find the intersected tiles with the geoExtent.***
	if (!this.intersectedTilesMap)
	{
		var geoExtent = this.getGeographicExtent();
		var minGeoCoord = geoExtent.minGeographicCoord;
		var maxGeoCoord = geoExtent.maxGeographicCoord;
		var minLon = minGeoCoord.longitude;
		var minLat = minGeoCoord.latitude;
		var maxLon = maxGeoCoord.longitude;
		var maxLat = maxGeoCoord.latitude;

		this.intersectedTilesMap = {};

		for (var i = this.minDepth; i<= this.maxDepth; i++)
		{
			var tilesArray = SmartTile.selectTileIndicesArray(i, minLon, minLat, maxLon, maxLat, undefined);
			
			// test debug::::::::::::
			/*
			// Depth 17:
			223684: (8) [38143, 38144, 38145, 38146, 38147, 38148, 38149, 38150]
			223685: (8) [38143, 38144, 38145, 38146, 38147, 38148, 38149, 38150]
			223686: (8) [38143, 38144, 38145, 38146, 38147, 38148, 38149, 38150]
			223687: (8) [38143, 38144, 38145, 38146, 38147, 38148, 38149, 38150]
			223688: (8) [38143, 38144, 38145, 38146, 38147, 38148, 38149, 38150]
			223689: (8) [38143, 38144, 38145, 38146, 38147, 38148, 38149, 38150]
			223690: (8) [38143, 38144, 38145, 38146, 38147, 38148, 38149, 38150]
			223691: (8) [38143, 38144, 38145, 38146, 38147, 38148, 38149, 38150]
			223692: (8) [38143, 38144, 38145, 38146, 38147, 38148, 38149, 38150]
			223693: (8) [38143, 38144, 38145, 38146, 38147, 38148, 38149, 38150]
			*/
			//if (i === 17)
			{
				this.intersectedTilesMap[i] = {};
				for (var j=0, len=tilesArray.length;j<len;j++) 
				{
					var tile = tilesArray[j];
					// test debug::::::::::::
					//if (tile.X === 223685 && tile.Y === 38147) // no intersected X: 223684, 223685
					{
						
						if (!this.intersectedTilesMap[i][tile.X]) 
						{
							this.intersectedTilesMap[i][tile.X] = [];
						}
						this.intersectedTilesMap[i][tile.X].push(tile.Y);
					}
				}
			}
			
		}

	}

	return this.intersectedTilesMap;
};