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
	
	this.nodeSeedsArray;
	this.nodesArray; // nodes with geometry data only (lowest nodes).
	
	this.isVisible; // var to manage the frustumCulling and delete buildings if necessary.
};

/**
 * 어떤 일을 하고 있습니까?
 */
SmartTile.prototype.deleteObjects = function() 
{
	this.name = undefined;
	this.depth = undefined;
	if(this.minGeographicCoord)
		this.minGeographicCoord.deleteObjects(); 
		
	if(this.maxGeographicCoord)
		this.maxGeographicCoord.deleteObjects(); 
	
	this.minGeographicCoord = undefined; 
	this.maxGeographicCoord = undefined; 
	if(this.sphereExtent)
		this.sphereExtent.deleteObjects();
	
	this.sphereExtent = undefined;
	
	// now, erase nodeSeeds.
	if(this.nodeSeedsArray)
	{
		var nodeSeedsCount = this.nodeSeedsArray.length;
		for(var i=0; i<nodeSeedsCount; i++)
		{
			// no delete the nodeObjects. nodeObjects must be deleted by hierarchyManager.
			this.nodeSeedsArray[i] = undefined;
		}
		this.nodeSeedsArray = undefined;
	}
	
	// now, erase nodes.
	if(this.nodesArray)
	{
		var nodesCount = this.nodesArray.length;
		for(var i=0; i<nodesCount; i++)
		{
			// no delete the nodeObjects. nodeObjects must be deleted by hierarchyManager.
			this.nodesArray[i] = undefined;
		}
		this.nodesArray = undefined;
	}
	
	this.isVisible = undefined;
	
	// delete children.
	if(this.subTiles)
	{
		var subTilesCount = this.subTiles.length;
		for(var i=0; i<subTilesCount; i++)
		{
			this.subTiles[i].deleteObjects();
			this.subTiles[i] = undefined;
		}
		this.subTiles = undefined;
	}
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
SmartTile.prototype.clearNodesArray = function() 
{
	if (this.nodesArray === undefined)
	{ return; }
	
	for (var i=0; i<this.nodesArray.length; i++)
	{
		this.nodesArray[i] = undefined;
	}
	this.nodesArray = undefined;
};


/**
 * 어떤 일을 하고 있습니까?
 */
 /*
SmartTile.prototype.getNodeByBuildingId = function(buildingType, buildingId) 
{
	var resultNode;
	var neoBuilding;
	var node;
	var hasSubTiles = true;
	if (this.subTiles === undefined)
	{ hasSubTiles = false; }
	
	if (this.subTiles && this.subTiles.length === 0)
	{ hasSubTiles = false; }
		
	if (!hasSubTiles)
	{
		if (this.nodesArray)
		{
			var nodesCount = this.nodesArray.length;
			var find = false;
			var i=0;
			while (!find && i<nodesCount) 
			{
				node = this.nodesArray[i];
				neoBuilding = node.data.neoBuilding;
				if (buildingType)
				{
					if (neoBuilding.buildingId === buildingId && neoBuilding.buildingType === buildingType) 
					{
						find = true;
						resultNode = node;
						return resultNode;
					}
				}
				else 
				{
					if (neoBuilding.buildingId === buildingId) 
					{
						find = true;
						resultNode = node;
						return resultNode;
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
			resultNode = this.subTiles[i].getNodeByBuildingId(buildingType, buildingId);
			if (resultNode)
			{ return resultNode; }
		}
	}
	
	return resultNode;
};
*/

/**
 * 어떤 일을 하고 있습니까?
 */
SmartTile.prototype.getNeoBuildingById = function(buildingType, buildingId) 
{
	var resultNeoBuilding;
	var node = this.getNodeByBuildingId(buildingType, buildingId);
	if (node !== undefined)
	{ resultNeoBuilding = node.data.neoBuilding; }

	return resultNeoBuilding;
};

/**
 * 어떤 일을 하고 있습니까?
 */
SmartTile.prototype.getBuildingSeedById = function(buildingType, buildingId) 
{
	var resultNeoBuildingSeed;
	var hasSubTiles = true;
	if (this.subTiles === undefined)
	{ hasSubTiles = false; }
	
	if (this.subTiles && this.subTiles.length === 0)
	{ hasSubTiles = false; }
		
	if (!hasSubTiles)
	{
		if (this.nodeSeedsArray)
		{
			var buildingCount = this.nodeSeedsArray.length;
			var find = false;
			var i=0;
			var buildingSeed, node;
			while (!find && i<buildingCount) 
			{
				node = this.nodeSeedsArray[i];
				buildingSeed = node.data.buildingSeed;
				if (buildingType)
				{
					if (buildingSeed.buildingId === buildingId && buildingSeed.buildingType === buildingType) 
					{
						find = true;
						resultNeoBuildingSeed = buildingSeed;
						return resultNeoBuildingSeed;
					}
				}
				else 
				{
					if (buildingSeed.buildingId === buildingId) 
					{
						find = true;
						resultNeoBuildingSeed = buildingSeed;
						return resultNeoBuildingSeed;
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
			resultNeoBuildingSeed = this.subTiles[i].getBuildingSeedById(buildingType, buildingId);
			if (resultNeoBuildingSeed)
			{ return resultNeoBuildingSeed; }
		}
	}
	
	return resultNeoBuildingSeed;
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
	var cornerPoint;
	cornerPoint = ManagerUtils.geographicCoordToWorldPoint(this.minGeographicCoord.longitude, this.minGeographicCoord.latitude, this.minGeographicCoord.altitude, cornerPoint, magoManager);
	this.sphereExtent.r = this.sphereExtent.centerPoint.distTo(cornerPoint.x, cornerPoint.y, cornerPoint.z) * 1.3;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param geoLocData 변수
 */
SmartTile.prototype.makeTreeByDepth = function(targetDepth, magoManager) 
{
	if (this.nodeSeedsArray === undefined || this.nodeSeedsArray.length === 0)
	{ return; }
	
	// if this has "nodeSeedsArray" then make sphereExtent.
	this.makeSphereExtent(magoManager);
	
	// now, if the current depth < targetDepth, then descend.
	if (this.depth < targetDepth)
	{
		// create 4 child smartTiles.
		if (this.subTiles === undefined || this.subTiles.length === 0)
		{
			for (var i=0; i<4; i++)
			{ this.newSubTile(this); }
		}
		
		// set the sizes to subTiles (The minLongitude, MaxLongitude, etc. is constant, but the minAlt & maxAlt can will be modified every time that insert new buildingSeeds).
		this.setSizesToSubTiles();

		// intercept buildingSeeds for each subTiles.
		for (var i=0; i<4; i++)
		{
			this.subTiles[i].takeIntersectedBuildingSeeds(this.nodeSeedsArray, magoManager);
		}
		
		// for each subTile that has intercepted buildingSeeds -> makeTree.
		for (var i=0; i<4; i++)
		{
			this.subTiles[i].makeTreeByDepth(targetDepth, magoManager);
		}
		
	}
};

/**
 * 어떤 일을 하고 있습니까?
 * @param geoLocData 변수
 */
/*
SmartTile.prototype.getLowestTileWithNodeInside = function(node) 
{
	// this function returns the lowestTile with "node" if exist.
	if (this.subTiles === undefined)
	{
		var nodesCount = this.nodesArray.length;
		var i=0;
		while (i<nodesCount)
		{
			if (node == this.nodesArray[i])
			{
				return this;
			}
			i++;
		}
		return undefined;
	}
	else 
	{	
		var subTilesCount = this.subTiles.length;
		var lowestTile;
		for (var i=0; i<subTilesCount; i++)
		{
			lowestTile = this.subTiles[i].getLowestTileWithNodeInside(node);
			if (lowestTile)
			{ return lowestTile; }
		}
		
		return undefined;
	}
};
*/

/**
 * 어떤 일을 하고 있습니까?
 * @param geoLocData 변수
 */
SmartTile.prototype.takeIntersectedBuildingSeeds = function(nodeSeedsArray) 
{
	// this function intersects the buildingSeeds with this tile.
	// this function is used only one time when load a initial buildings distributions on the globe.
	var buildingSeed;
	var node;
	var buildingSeedsCount = nodeSeedsArray.length;
	for (var i=0; i<buildingSeedsCount; i++)
	{
		node = nodeSeedsArray[i];
		buildingSeed = node.data.buildingSeed;
		
		if (this.intersectPoint(buildingSeed.geographicCoordOfBBox.longitude, buildingSeed.geographicCoordOfBBox.latitude))
		{
			nodeSeedsArray.splice(i, 1);
			i--;
			buildingSeedsCount = nodeSeedsArray.length;
			
			if (this.nodeSeedsArray === undefined)
			{ this.nodeSeedsArray = []; }
			
			this.nodeSeedsArray.push(node);
			
			// now, redefine the altitude limits of this tile.
			var altitude = buildingSeed.geographicCoordOfBBox.altitude;
			var bboxRadius = buildingSeed.bBox.getRadiusAprox();
			if (altitude-bboxRadius < this.minGeographicCoord.altitude)
			{
				this.minGeographicCoord.altitude = altitude-bboxRadius;
			}
			if (altitude+bboxRadius > this.maxGeographicCoord.altitude)
			{
				this.maxGeographicCoord.altitude = altitude+bboxRadius;
			}
		}
	}
};

/**
 * 어떤 일을 하고 있습니까?
 * @param geoLocData 변수
 */
/*
SmartTile.prototype.calculateAltitudeLimits = function() 
{
	// this function calculates the minAltitude and maxAltitude of the tile.
	// init the altitudes.
	this.minGeographicCoord.altitude = 0;
	this.maxGeographicCoord.altitude = 0;
	
	var buildingSeed;
	var buildingSeedsCount = this.buildingSeedsArray.length;
	for (var i=0; i<buildingSeedsCount; i++)
	{
		buildingSeed = this.buildingSeedsArray[i];

		var altitude = buildingSeed.geographicCoordOfBBox.altitude;
		var bboxRadius = buildingSeed.bBox.getRadiusAprox();
		if (altitude-bboxRadius < this.minGeographicCoord.altitude)
		{
			this.minGeographicCoord.altitude = altitude-bboxRadius;
		}
		if (altitude+bboxRadius > this.maxGeographicCoord.altitude)
		{
			this.maxGeographicCoord.altitude = altitude+bboxRadius;
		}
	}
};
*/

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
		if (this.nodeSeedsArray && this.nodeSeedsArray.length > 0)
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
SmartTile.prototype.getFrustumIntersectedLowestTiles = function(frustum, resultFullyIntersectedTilesArray, resultPartiallyIntersectedTilesArray) 
{
	var fullyIntersectedTiles = [];
	this.getFrustumIntersectedTiles(frustum, fullyIntersectedTiles, resultPartiallyIntersectedTilesArray);
	
	var intersectedTilesCount = fullyIntersectedTiles.length;
	for (var i=0; i<intersectedTilesCount; i++)
	{
		fullyIntersectedTiles[i].extractLowestTiles(resultFullyIntersectedTilesArray);
	}
};

/**
 * 어떤 일을 하고 있습니까?
 * @param frustum 변수
 */
SmartTile.prototype.getFrustumIntersectedTiles = function(frustum, resultFullyIntersectedTilesArray, resultPartiallyIntersectedTilesArray) 
{
	if (this.sphereExtent === undefined)
	{ return Constant.INTERSECTION_OUTSIDE; }
	
	var intersectionType = frustum.intersectionSphere(this.sphereExtent);
	
	if (intersectionType === Constant.INTERSECTION_OUTSIDE)
	{ return; }
	else if (intersectionType === Constant.INTERSECTION_INSIDE)
	{
		resultFullyIntersectedTilesArray.push(this);
		return;
	}
	else if (intersectionType === Constant.INTERSECTION_INTERSECT)
	{
		if (this.subTiles && this.subTiles.length > 0)
		{
			for (var i=0; i<this.subTiles.length; i++)
			{
				if (this.subTiles[i].sphereExtent)
				{ this.subTiles[i].getFrustumIntersectedTiles(frustum, resultFullyIntersectedTilesArray, resultPartiallyIntersectedTilesArray); }
			}
		}
		else
		{ 
			if (this.nodeSeedsArray &&  this.nodeSeedsArray.length > 0)
			{ resultPartiallyIntersectedTilesArray.push(this); } 
		}
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
 * Quadtree based tile with thickness.
 * @class SmartTileManager
 */
var SmartTileManager = function() 
{
	if (!(this instanceof SmartTileManager)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
	this.tilesArray = []; // has 2 tiles (Asia side and America side).
	this.createMainTiles();
};

/**
 * 어떤 일을 하고 있습니까?
 * @class GeoLocationData
 * @param geoLocData 변수
 */
SmartTileManager.prototype.createMainTiles = function() 
{
	// tile 1 : longitude {-180, 0}, latitude {-90, 90}
	// tile 2 : longitude {0, 180},  latitude {-90, 90}
	
	// America side.
	var tile1 = this.newSmartTile("AmericaSide");
	if (tile1.minGeographicCoord === undefined)
	{ tile1.minGeographicCoord = new GeographicCoord(); }
	if (tile1.maxGeographicCoord === undefined)
	{ tile1.maxGeographicCoord = new GeographicCoord(); }
	
	tile1.depth = 0; // mother tile.
	tile1.minGeographicCoord.setLonLatAlt(-180, -90, 0);
	tile1.maxGeographicCoord.setLonLatAlt(0, 90, 0);
	
	// Asia side.
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
SmartTileManager.prototype.deleteTiles = function() 
{
	// this function deletes all children tiles.
	if(this.tilesArray)
	{
		var tilesCount = this.tilesArray.length; // allways tilesCount = 2. (Asia & America sides).
		for(var i=0; i<tilesCount; i++)
		{
			this.tilesArray[i].deleteObjects();
			this.tilesArray[i] = undefined;
		}
		this.tilesArray.length = 0;
	}
};

/**
 * 어떤 일을 하고 있습니까?
 * @class GeoLocationData
 * @param geoLocData 변수
 */
SmartTileManager.prototype.resetTiles = function() 
{
	this.deleteTiles();
	
	// now create the main tiles.
	this.createMainTiles();
};

/**
 * 어떤 일을 하고 있습니까?
 * @class GeoLocationData
 * @param geoLocData 변수
 */
SmartTileManager.prototype.newSmartTile = function(smartTileName) 
{
	if(this.tilesArray === undefined)
		this.tilesArray = [];
	
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

/**
 * 어떤 일을 하고 있습니까?
 */
SmartTileManager.prototype.getBuildingSeedById = function(buildingType, buildingId) 
{
	var resultNeoBuilding;
	var i = 0;
	var smartTilesCount = this.tilesArray.length;
	while (resultNeoBuilding === undefined && i<smartTilesCount)
	{
		resultNeoBuilding = this.tilesArray[i].getBuildingSeedById(buildingType, buildingId);
		i++;
	}
	
	return resultNeoBuilding;
};












