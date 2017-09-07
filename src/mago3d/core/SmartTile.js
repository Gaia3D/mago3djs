'use strict';

/**
 * Quadtree based tile with thickness.
 * @class SmartTile
 */
var SmartTile = function(smartTileName) 
{
	//       +-----+-----+
	//       |  3  |  2  |
	//       +-----+-----+
	//       |  0  |  1  |
	//       +-----+-----+
	
	if (!(this instanceof SmartTile)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	this.name;
	if (smartTileName)
	{ this.name = smartTileName; }
	this.depth; // mother tile depth = 0.
	this.minGeographicCoord; // longitude, latitude, altitude.
	this.maxGeographicCoord; // longitude, latitude, altitude.
	this.sphereExtent; // cartesian position sphere in worldCoord.
	this.subTiles; // array.
	//this.startIdx; // todo.
	//this.endIdx; // todo.
	
	this.buildingSeedsArray;
	this.buildingsArray;
};

/**
 * 어떤 일을 하고 있습니까?
 */
SmartTile.prototype.newSubTile = function(parentTile) 
{
	if (this.subTiles === undefined)
	{ this.subTiles = []; }
	
	var subTile = new SmartTile();
	subTile.depth = parentTile.depth + 1;
	this.subTiles.push(subTile);
	return subTile;
};

/**
 * 어떤 일을 하고 있습니까?
 */
SmartTile.prototype.getNeoBuildingById = function(buildingType, buildingId) 
{
	var resultNeoBuilding;
	var hasSubTiles = true;
	if (this.subTiles === undefined)
	{ hasSubTiles = false; }
	
	if (this.subTiles && this.subTiles.length === 0)
	{ hasSubTiles = false; }
		
	if (!hasSubTiles)
	{
		if (this.buildingsArray)
		{
			var buildingCount = this.buildingsArray.length;
			var find = false;
			var i=0;
			while (!find && i<buildingCount) 
			{
				if (buildingType)
				{
					if (this.buildingsArray[i].buildingId === buildingId && this.buildingsArray[i].buildingType === buildingType) 
					{
						find = true;
						resultNeoBuilding = this.buildingsArray[i];
						return resultNeoBuilding;
					}
				}
				else 
				{
					if (this.buildingsArray[i].buildingId === buildingId) 
					{
						find = true;
						resultNeoBuilding = this.buildingsArray[i];
						return resultNeoBuilding;
					}
				}
				i++;
			}
		}	
	}
	else 
	{
		for (var i=0; i<this.subTiles.length; i++)
		{
			resultNeoBuilding = this.subTiles[i].getNeoBuildingById(buildingType, buildingId);
			if (resultNeoBuilding)
			{ return resultNeoBuilding; }
		}
	}
	
	return resultNeoBuilding;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param geoLocData 변수
 */
SmartTile.prototype.makeSphereExtent = function(magoManager) 
{
	if (this.sphereExtent === undefined)
	{ this.sphereExtent = new Sphere(); }
	
	// calculate worldCoord center position.
	var midLongitude = (this.maxGeographicCoord.longitude + this.minGeographicCoord.longitude)/2;
	var midLatitude = (this.maxGeographicCoord.latitude + this.minGeographicCoord.latitude)/2;
	var midAltitude = (this.maxGeographicCoord.altitude + this.minGeographicCoord.altitude)/2;
	this.sphereExtent.centerPoint = ManagerUtils.geographicCoordToWorldPoint(midLongitude, midLatitude, midAltitude, this.sphereExtent.centerPoint, magoManager);
	
	// calculate an aproximate radius.
	var cornerPoint = ManagerUtils.geographicCoordToWorldPoint(this.minGeographicCoord.longitude, this.minGeographicCoord.latitude, this.minGeographicCoord.altitude, cornerPoint, magoManager);
	this.sphereExtent.r = this.sphereExtent.centerPoint.distTo(cornerPoint.x, cornerPoint.y, cornerPoint.z) * 1.2;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param geoLocData 변수
 */
SmartTile.prototype.makeTree = function(minDegree, magoManager) 
{
	if (this.buildingSeedsArray === undefined || this.buildingSeedsArray.length === 0)
	{ return; }
	
	// if this has "buildingSeedsArray" then make sphereExtent.
	this.makeSphereExtent(magoManager);
	
	// now, if the dimensions of the tile is bigger than "minDegree", then make subTiles.
	var longitudeRangeDegree = this.getLongitudeRangeDegree();
	if (longitudeRangeDegree > minDegree)
	{
		// create 4 child smartTiles.
		for (var i=0; i<4; i++)
		{ this.newSubTile(this); }
		
		// set the sizes to subTiles.
		this.setSizesToSubTiles();
		
		// intercept buildingSeeds for each subTiles.
		for (var i=0; i<4; i++)
		{
			this.subTiles[i].takeIntersectedBuildingSeeds(this.buildingSeedsArray);
		}
		
		// for each subTile that has intercepted buildingSeeds -> makeTree.
		for (var i=0; i<4; i++)
		{
			this.subTiles[i].makeTree(minDegree, magoManager);
		}
		
	}
};

/**
 * 어떤 일을 하고 있습니까?
 * @param geoLocData 변수
 */
SmartTile.prototype.takeIntersectedBuildingSeeds = function(buildingSeedsArray) 
{
	var buildingSeed;
	var buildingSeedsCount = buildingSeedsArray.length;
	for (var i=0; i<buildingSeedsCount; i++)
	{
		buildingSeed = buildingSeedsArray[i];
		if (this.intersectPoint(buildingSeed.geographicCoord.longitude, buildingSeed.geographicCoord.latitude))
		{
			buildingSeedsArray.splice(i, 1);
			i--;
			buildingSeedsCount = buildingSeedsArray.length;
			
			if (this.buildingSeedsArray === undefined)
			{ this.buildingSeedsArray = []; }
			
			this.buildingSeedsArray.push(buildingSeed);
		}
	}
};

/**
 * 어떤 일을 하고 있습니까?
 * @param geographicCoord 변수
 */
SmartTile.prototype.intersectPoint = function(longitude, latitude) 
{
	if (longitude < this.minGeographicCoord.longitude || longitude > this.maxGeographicCoord.longitude)
	{ return false; }
	
	if (latitude < this.minGeographicCoord.latitude || latitude > this.maxGeographicCoord.latitude)
	{ return false; }
	
	return true;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param frustum 변수
 */
SmartTile.prototype.extractLowestTiles = function(resultLowestTilesArray) 
{
	if (this.subTiles === undefined)
	{
		if (this.buildingSeedsArray && this.buildingSeedsArray.length > 0)
		{
			resultLowestTilesArray.push(this);
		}
		return;
	}
		
	var subTilesCount = this.subTiles.length;
	for (var i=0; i<subTilesCount; i++)
	{
		this.subTiles[i].extractLowestTiles(resultLowestTilesArray);
	}
};

/**
 * 어떤 일을 하고 있습니까?
 * @param frustum 변수
 */
SmartTile.prototype.getFrustumIntersectedLowestTiles = function(frustum, resultIntersectedTilesArray) 
{
	var intersectedTiles = [];
	this.getFrustumIntersectedTiles(frustum, intersectedTiles);
	
	var intersectedTilesCount = intersectedTiles.length;
	for (var i=0; i<intersectedTilesCount; i++)
	{
		intersectedTiles[i].extractLowestTiles(resultIntersectedTilesArray);
	}
};

/**
 * 어떤 일을 하고 있습니까?
 * @param frustum 변수
 */
SmartTile.prototype.getFrustumIntersectedTiles = function(frustum, resultIntersectedTilesArray) 
{	
	var intersectionType = frustum.intersectionSphere(this.sphereExtent);
	
	if (intersectionType === Constant.INTERSECTION_OUTSIDE)
	{ return; }
	else if (intersectionType === Constant.INTERSECTION_INSIDE)
	{
		resultIntersectedTilesArray.push(this);
		return;
	}
	else if (intersectionType === Constant.INTERSECTION_INTERSECT)
	{
		if (this.subTiles && this.subTiles.length > 0)
		{
			for (var i=0; i<this.subTiles.length; i++)
			{
				if (this.subTiles[i].sphereExtent)
				{ this.subTiles[i].getFrustumIntersectedTiles(frustum, resultIntersectedTilesArray); }
			}
		}
		else
		{ resultIntersectedTilesArray.push(this); }
	}
};

/**
 * 어떤 일을 하고 있습니까?
 * Extent(범위)
 * @param frustum 변수
 */
SmartTile.prototype.getSphereExtent = function() 
{
	return this.sphereExtent;
};

/**
 * 어떤 일을 하고 있습니까?
 */
SmartTile.prototype.setSize = function(minLon, minLat, minAlt, maxLon, maxLat, maxAlt) 
{
	if (this.minGeographicCoord === undefined)
	{ this.minGeographicCoord = new GeographicCoord(); }
	if (this.maxGeographicCoord === undefined)	
	{ this.maxGeographicCoord = new GeographicCoord(); }
		
	this.minGeographicCoord.setLonLatAlt(minLon, minLat, minAlt);	
	this.maxGeographicCoord.setLonLatAlt(maxLon, maxLat, maxAlt);	
};

/**
 * 어떤 일을 하고 있습니까?
 */
SmartTile.prototype.setSizesToSubTiles = function() 
{
	//       +-----+-----+
	//       |  3  |  2  |
	//       +-----+-----+
	//       |  0  |  1  |
	//       +-----+-----+
	
	var minLon = this.minGeographicCoord.longitude;
	var maxLon = this.maxGeographicCoord.longitude;
	var minLat = this.minGeographicCoord.latitude;
	var maxLat = this.maxGeographicCoord.latitude;
	var minAlt = this.minGeographicCoord.altitude;
	var maxAlt = this.maxGeographicCoord.altitude;
	
	var midLon = (maxLon + minLon)/2;
	var midLat = (maxLat + minLat)/2;
	
	var subTile = this.subTiles[0];
	subTile.setSize(minLon, minLat, minAlt,     midLon, midLat, maxAlt);
	
	subTile = this.subTiles[1];
	subTile.setSize(midLon, minLat, minAlt,     maxLon, midLat, maxAlt);
	
	subTile = this.subTiles[2];
	subTile.setSize(midLon, midLat, minAlt,     maxLon, maxLat, maxAlt);
	
	subTile = this.subTiles[3];
	subTile.setSize(minLon, midLat, minAlt,     midLon, maxLat, maxAlt);
};

/**
 * 어떤 일을 하고 있습니까?
 * @param geoLocData 변수
 */
SmartTile.prototype.getLongitudeRangeDegree = function() 
{
	return this.maxGeographicCoord.longitude - this.minGeographicCoord.longitude;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param geoLocData 변수
 */
SmartTile.prototype.getLatitudeRangeDegree = function() 
{
	return this.maxGeographicCoord.latitude - this.minGeographicCoord.latitude;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param geoLocData 변수
 */
SmartTile.prototype.calculateTileRange = function() 
{
	// No used function.
	if (this.buildingSeedsArray === undefined)
	{ return; }
	
	if (this.minGeographicCoord === undefined)
	{ this.minGeographicCoord = new GeographicCoord(); }
	if (this.maxGeographicCoord === undefined)	
	{ this.maxGeographicCoord = new GeographicCoord(); }
	
	var buildingSeed;
	var longitude, latitude, altitude;
	var buildingSeedsCount = this.buildingSeedsArray.length;
	for (var i=0; i<buildingSeedsCount; i++)
	{
		buildingSeed = this.buildingSeedsArray[i];
		longitude = buildingSeed.geographicCoord.longitude;
		latitude = buildingSeed.geographicCoord.latitude;
		altitude = buildingSeed.geographicCoord.altitude;
		
		if (i === 0)
		{
			this.minGeographicCoord.setLonLatAlt(longitude, latitude, altitude);
			this.maxGeographicCoord.setLonLatAlt(longitude, latitude, altitude);
		}
		else 
		{
			if (longitude < this.minGeographicCoord.longitude)
			{ this.minGeographicCoord.longitude = longitude; }
			
			if (latitude < this.minGeographicCoord.latitude)
			{ this.minGeographicCoord.latitude = latitude; }
			
			if (altitude < this.minGeographicCoord.altitude)
			{ this.minGeographicCoord.altitude = altitude; }
			
			if (longitude > this.maxGeographicCoord.longitude)
			{ this.maxGeographicCoord.longitude = longitude; }
			
			if (latitude > this.maxGeographicCoord.latitude)
			{ this.maxGeographicCoord.latitude = latitude; }
			
			if (altitude > this.maxGeographicCoord.altitude)
			{ this.maxGeographicCoord.altitude = altitude; }
		}
	}
};

/**
 * 어떤 일을 하고 있습니까?
 * @param geoLocData 변수
 */
SmartTile.prototype.deleteBuildings = function(gl, vboMemManager) 
{
	
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
	
	this.tilesArray = []; // has 2 tiles.

	// tile 1 : longitude {-180, 0}, latitude {-90, 90}
	// tile 2 : longitude {0, 180},  latitude {-90, 90}
	
	var tile1 = this.newSmartTile("AmericaSide");
	if (tile1.minGeographicCoord === undefined)
	{ tile1.minGeographicCoord = new GeographicCoord(); }
	if (tile1.maxGeographicCoord === undefined)
	{ tile1.maxGeographicCoord = new GeographicCoord(); }
	
	tile1.depth = 0; // mother tile.
	tile1.minGeographicCoord.setLonLatAlt(-180, -90, 0);
	tile1.maxGeographicCoord.setLonLatAlt(0, 90, 0);
	
	var tile2 = this.newSmartTile("AsiaSide");
	if (tile2.minGeographicCoord === undefined)
	{ tile2.minGeographicCoord = new GeographicCoord(); }
	if (tile2.maxGeographicCoord === undefined)
	{ tile2.maxGeographicCoord = new GeographicCoord(); }
	
	tile2.depth = 0; // mother tile.
	tile2.minGeographicCoord.setLonLatAlt(0, -90, 0);
	tile2.maxGeographicCoord.setLonLatAlt(180, 90, 0);
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

/**
 * 어떤 일을 하고 있습니까?
 */
SmartTileManager.prototype.getNeoBuildingById = function(buildingType, buildingId) 
{
	var resultNeoBuilding;
	var i = 0;
	var smartTilesCount = this.tilesArray.length;
	while (resultNeoBuilding === undefined && i<smartTilesCount)
	{
		resultNeoBuilding = this.tilesArray[i].getNeoBuildingById(buildingType, buildingId);
		i++;
	}
	
	return resultNeoBuilding;
};












