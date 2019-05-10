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
	if (this.minGeographicCoord)
	{ this.minGeographicCoord.deleteObjects(); } 
		
	if (this.maxGeographicCoord)
	{ this.maxGeographicCoord.deleteObjects(); } 
	
	this.minGeographicCoord = undefined; 
	this.maxGeographicCoord = undefined; 
	if (this.sphereExtent)
	{ this.sphereExtent.deleteObjects(); }
	
	this.sphereExtent = undefined;
	
	// now, erase nodeSeeds.
	if (this.nodeSeedsArray)
	{
		var nodeSeedsCount = this.nodeSeedsArray.length;
		for (var i=0; i<nodeSeedsCount; i++)
		{
			// no delete the nodeObjects. nodeObjects must be deleted by hierarchyManager.
			this.nodeSeedsArray[i] = undefined;
		}
		this.nodeSeedsArray = undefined;
	}
	
	// now, erase nodes.
	if (this.nodesArray)
	{
		var nodesCount = this.nodesArray.length;
		for (var i=0; i<nodesCount; i++)
		{
			// no delete the nodeObjects. nodeObjects must be deleted by hierarchyManager.
			this.nodesArray[i] = undefined;
		}
		this.nodesArray = undefined;
	}
	
	this.isVisible = undefined;
	
	// delete children.
	if (this.subTiles)
	{
		var subTilesCount = this.subTiles.length;
		for (var i=0; i<subTilesCount; i++)
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
	subTile.targetDepth = parentTile.targetDepth;
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
SmartTile.prototype.TEST__hasLowestTiles_nodesArray = function() 
{
	
	var lowestTilesArray = [];
	this.extractLowestTiles(lowestTilesArray);
	var subTilesCount = lowestTilesArray.length;
	var find = false;
	var i=0;
	while (!find && i<subTilesCount)
	{
		if (lowestTilesArray[i].nodesArray && lowestTilesArray[i].nodesArray.length > 0)
		{
			return true;
		}
		i++;
	}
	
	return find;
	
};


/**
 * 어떤 일을 하고 있습니까?
 * @param geoLocData 변수
 */
SmartTile.prototype.makeSphereExtent = function(magoManager) 
{
	this.sphereExtent = SmartTile.computeSphereExtent(magoManager, this.minGeographicCoord, this.maxGeographicCoord, this.sphereExtent);
};

/**
 * 어떤 일을 하고 있습니까?
 * @param geoLocData 변수
 */
SmartTile.computeSphereExtent = function(magoManager, minGeographicCoord, maxGeographicCoord, resultSphereExtent) 
{
	if (minGeographicCoord === undefined || maxGeographicCoord === undefined)
	{ return undefined; }
	
	if (resultSphereExtent === undefined)
	{ resultSphereExtent = new Sphere(); }
	
	// calculate worldCoord center position.
	var midLongitude = (maxGeographicCoord.longitude + minGeographicCoord.longitude)/2;
	var midLatitude = (maxGeographicCoord.latitude + minGeographicCoord.latitude)/2;
	var midAltitude = (maxGeographicCoord.altitude + minGeographicCoord.altitude)/2;
	
	resultSphereExtent.centerPoint = ManagerUtils.geographicCoordToWorldPoint(midLongitude, midLatitude, midAltitude, resultSphereExtent.centerPoint, magoManager);
	
	// calculate an aproximate radius.
	var cornerPoint;
	cornerPoint = ManagerUtils.geographicCoordToWorldPoint(minGeographicCoord.longitude, minGeographicCoord.latitude, minGeographicCoord.altitude, cornerPoint, magoManager);

	resultSphereExtent.r = resultSphereExtent.centerPoint.distTo(cornerPoint.x, cornerPoint.y, cornerPoint.z) * 1.1;
	return resultSphereExtent;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param geoLocData 변수
 */
SmartTile.prototype.putNode = function(targetDepth, node, magoManager) 
{
	if (this.sphereExtent === undefined)
	{ this.makeSphereExtent(magoManager); }
	
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
		var subSmartTile;
		var finish = false;
		var i=0;
		while (!finish && i<4)
		{
			subSmartTile = this.subTiles[i];
			if (subSmartTile.intersectsNode(node))
			{
				subSmartTile.putNode(targetDepth, node, magoManager);
				finish = true;
			}
			
			i++;
		}
	}
	else if (this.depth === targetDepth)
	{
		if (this.nodeSeedsArray === undefined)
		{ this.nodeSeedsArray = []; }
		
		if (this.nodesArray === undefined)
		{ this.nodesArray = []; }
		
		node.data.smartTileOwner = this;
		
		this.nodeSeedsArray.push(node);
		this.nodesArray.push(node);
		
		// todo: Must recalculate the smartTile sphereExtent.***
		//this.makeSphereExtent(magoManager);
		
		return true;
	}
};

/**
 * 어떤 일을 하고 있습니까?
 * @param geoLocData 변수
 */
SmartTile.prototype.makeTreeByDepth = function(targetDepth, magoManager) 
{
	if (this.nodeSeedsArray === undefined || this.nodeSeedsArray.length === 0)
	{ return; }

	this.targetDepth = targetDepth;
	
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
	//else
	//	var hola = 0;
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
SmartTile.prototype.intersectsNode = function(node) 
{
	var intersects = false;
	var buildingSeed = node.data.buildingSeed;
	var rootNode = node.getRoot();
	
	// Find geographicCoords as is possible.***
	var longitude, latitude;
	if (rootNode.data.bbox !== undefined && rootNode.data.bbox.geographicCoord !== undefined)
	{
		longitude = rootNode.data.bbox.geographicCoord.longitude;
		latitude = rootNode.data.bbox.geographicCoord.latitude;
	}
	else if (buildingSeed !== undefined)
	{
		// in this case take the data from buildingSeed.***
		longitude = buildingSeed.geographicCoordOfBBox.longitude;
		latitude = buildingSeed.geographicCoordOfBBox.latitude;
	}
	else
	{
		longitude = node.data.geographicCoord.longitude;
		latitude = node.data.geographicCoord.latitude;
	}
	
	if (this.intersectPoint(longitude, latitude))
	{
		intersects = true;
	}
	
	return intersects;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param geoLocData 변수
 */
SmartTile.prototype.takeIntersectedBuildingSeeds = function(nodeSeedsArray) 
{
	// this function intersects the buildingSeeds with this tile.
	// this function is used only one time when load a initial buildings distributions on the globe.
	var buildingSeed;
	var node, rootNode;
	var buildingSeedsCount = nodeSeedsArray.length;
	for (var i=0; i<buildingSeedsCount; i++)
	{
		node = nodeSeedsArray[i];
		
		if (this.intersectsNode(node))
		{
			nodeSeedsArray.splice(i, 1);
			i--;
			buildingSeedsCount = nodeSeedsArray.length;
			
			if (this.nodeSeedsArray === undefined)
			{ this.nodeSeedsArray = []; }
		
			// Set the smartTileOwner, for fast move of the node between smartTiles.***
			node.data.smartTileOwner = this;
			
			this.nodeSeedsArray.push(node);
			
			// now, redefine the altitude limits of this tile.
			var buildingSeed = node.data.buildingSeed;
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
SmartTile.prototype.eraseNode = function(node) 
{
	//this.nodeSeedsArray;
	//this.nodesArray;
	
	// Erase from this.nodeSeedsArray & this.nodesArray.***
	if (this.nodeSeedsArray !== undefined)
	{
		var nodeSeedsCount = this.nodeSeedsArray.length;
		var finished = false;
		var i = 0;
		while (!finished && i<nodeSeedsCount)
		{
			if (this.nodeSeedsArray[i] === node)
			{
				this.nodeSeedsArray.splice(i, 1);
				finished = true;
			}
			i++;
		}
	}
	
	if (this.nodesArray !== undefined)
	{
		var nodesCount = this.nodesArray.length;
		finished = false;
		i = 0;
		while (!finished && i<nodesCount)
		{
			if (this.nodesArray[i] === node)
			{
				this.nodesArray.splice(i, 1);
				finished = true;
			}
			i++;
		}
	}
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
 * @param frustum 변수
 */
SmartTile.selectTileAngleRangeByDepth = function(depth) 
{
	if (depth === undefined || depth < 0 || depth > 15)
	{ return undefined; }
	
	if (depth === 0)
	{ return 180; }
	if (depth === 1)
	{ return 90; }
	if (depth === 2)
	{ return 45; }
	if (depth === 3)
	{ return 22.5; }
	if (depth === 4)
	{ return 11.25; }
	if (depth === 5)
	{ return 5.625; }
	if (depth === 6)
	{ return 2.8125; }
	if (depth === 7)
	{ return 1.40625; }
	if (depth === 8)
	{ return 0.703125; }
	if (depth === 9)
	{ return 0.3515625; }
	if (depth === 10)
	{ return 0.17578125; }
	if (depth === 11)
	{ return 0.087890625; }
	if (depth === 12)
	{ return 0.043945313; }
	if (depth === 13)
	{ return 0.021972656; }
	if (depth === 14)
	{ return 0.010986328; }
	if (depth === 15)
	{ return 0.010986328/2.0; }
};

/**
 * 어떤 일을 하고 있습니까?
 * @param frustum 변수
 */
SmartTile.selectTileName = function(depth, longitude, latitude, resultTileName) 
{
	var xMin = -180.0;
	var yMin = 90.0;
	var angRange = SmartTile.selectTileAngleRangeByDepth(depth) ;
	
	var xIndex = Math.floor((longitude - xMin)/angRange);
	// with yMin = -90.0;
	//var yIndex = Math.floor((latitude - yMin)/angRange);
	var yIndex = Math.floor((yMin - latitude)/angRange);
	resultTileName = depth.toString() + "\\" + xIndex.toString() + "\\" + yIndex.toString();
	return resultTileName;
};


/**
 * 어떤 일을 하고 있습니까?
 * @param frustum 변수
 */
 
SmartTile.getFrustumIntersectedTilesNames = function(frustum, maxDepth, camPos, magoManager, resultFullyIntersectedTilesNamesMap) 
{
	var currMinGeographicCoords = new GeographicCoord();
	var currMaxGeographicCoords = new GeographicCoord();
	var currDepth = 0;
	
	// America side.
	currMinGeographicCoords.setLonLatAlt(-180, -90, 0);
	currMaxGeographicCoords.setLonLatAlt(0, 90, 0);
	currDepth = 0;
	SmartTile.getFrustumIntersectedTilesNamesForGeographicExtent(frustum, maxDepth, currDepth, camPos, currMinGeographicCoords, currMaxGeographicCoords, magoManager, magoManager.boundingSphere_Aux, 
		resultFullyIntersectedTilesNamesMap);
	
	// Asia side.
	currMinGeographicCoords.setLonLatAlt(0, -90, 0);
	currMaxGeographicCoords.setLonLatAlt(180, 90, 0);
	currDepth = 0;
	SmartTile.getFrustumIntersectedTilesNamesForGeographicExtent(frustum, maxDepth, currDepth, camPos, currMinGeographicCoords, currMaxGeographicCoords, magoManager, magoManager.boundingSphere_Aux, 
		resultFullyIntersectedTilesNamesMap);
};

/**
 * 어떤 일을 하고 있습니까?
 * @param frustum 변수
 */
 
SmartTile.getFrustumIntersectedTilesNamesForGeographicExtent = function(frustum, maxDepth, currDepth, camPos, currMinGeographicCoords, currMaxGeographicCoords, magoManager, sphereExtentAux, resultFullyIntersectedTilesNamesMap) 
{
	// STATIC FUNCTION.***
	// 1rst, make a sphereExtent.***
	
	sphereExtentAux = SmartTile.computeSphereExtent(magoManager, currMinGeographicCoords, currMaxGeographicCoords, sphereExtentAux);

	var intersectionType = frustum.intersectionSphere(sphereExtentAux);
	
	if (intersectionType === Constant.INTERSECTION_OUTSIDE)
	{ return; }
	else if (intersectionType === Constant.INTERSECTION_INSIDE)
	{
		var midLon = (currMinGeographicCoords.longitude + currMaxGeographicCoords.longitude)/2;
		var midLat = (currMinGeographicCoords.latitude + currMaxGeographicCoords.latitude)/2;
		var tileName = SmartTile.selectTileName(currDepth, midLon, midLat, undefined);
		var geographicExtent = new GeographicExtent();
		geographicExtent.minGeographicCoord = new GeographicCoord(currMinGeographicCoords.longitude, currMinGeographicCoords.latitude, currMinGeographicCoords.altitude);
		geographicExtent.maxGeographicCoord = new GeographicCoord(currMaxGeographicCoords.longitude, currMaxGeographicCoords.latitude, currMaxGeographicCoords.altitude);
		resultFullyIntersectedTilesNamesMap[tileName] = geographicExtent;
		return;
	}
	else if (intersectionType === Constant.INTERSECTION_INTERSECT)
	{
		// check distance to camera.***
		var distToCam = camPos.distToSphere(sphereExtentAux);
		if (distToCam > 2000)
		{
			var midLon = (currMinGeographicCoords.longitude + currMaxGeographicCoords.longitude)/2;
			var midLat = (currMinGeographicCoords.latitude + currMaxGeographicCoords.latitude)/2;
			var tileName = SmartTile.selectTileName(currDepth, midLon, midLat, undefined);
			var geographicExtent = new GeographicExtent();
			geographicExtent.minGeographicCoord = new GeographicCoord(currMinGeographicCoords.longitude, currMinGeographicCoords.latitude, currMinGeographicCoords.altitude);
			geographicExtent.maxGeographicCoord = new GeographicCoord(currMaxGeographicCoords.longitude, currMaxGeographicCoords.latitude, currMaxGeographicCoords.altitude);
			resultFullyIntersectedTilesNamesMap[tileName] = geographicExtent;
			return;
		}
		
		if (currDepth < maxDepth)
		{
			// must descend.***
			currDepth += 1;
			var minLon = currMinGeographicCoords.longitude;
			var minLat = currMinGeographicCoords.latitude;
			var minAlt = currMinGeographicCoords.altitude;
			var maxLon = currMaxGeographicCoords.longitude;
			var maxLat = currMaxGeographicCoords.latitude;
			var maxAlt = currMaxGeographicCoords.altitude;
			var midLon = (minLon + maxLon)/ 2;
			var midLat = (minLat + maxLat)/ 2;
			
			// subTile 1.***
			currMaxGeographicCoords.setLonLatAlt(midLon, midLat, maxAlt);
			this.getFrustumIntersectedTilesNamesForGeographicExtent(frustum, maxDepth, currDepth, camPos, currMinGeographicCoords, currMaxGeographicCoords, magoManager, sphereExtentAux, resultFullyIntersectedTilesNamesMap);
			
			// subTile 2.***
			currMinGeographicCoords.setLonLatAlt(midLon, minLat, minAlt);
			currMaxGeographicCoords.setLonLatAlt(maxLon, midLat, maxAlt);
			this.getFrustumIntersectedTilesNamesForGeographicExtent(frustum, maxDepth, currDepth, camPos, currMinGeographicCoords, currMaxGeographicCoords, magoManager, sphereExtentAux, resultFullyIntersectedTilesNamesMap);
			
			// subTile 3.***
			currMinGeographicCoords.setLonLatAlt(midLon, midLat, minAlt);
			currMaxGeographicCoords.setLonLatAlt(maxLon, maxLat, maxAlt);
			this.getFrustumIntersectedTilesNamesForGeographicExtent(frustum, maxDepth, currDepth, camPos, currMinGeographicCoords, currMaxGeographicCoords, magoManager, sphereExtentAux, resultFullyIntersectedTilesNamesMap);
			
			// subTile 4.***
			currMinGeographicCoords.setLonLatAlt(minLon, midLat, minAlt);
			currMaxGeographicCoords.setLonLatAlt(midLon, maxLat, maxAlt);
			this.getFrustumIntersectedTilesNamesForGeographicExtent(frustum, maxDepth, currDepth, camPos, currMinGeographicCoords, currMaxGeographicCoords, magoManager, sphereExtentAux, resultFullyIntersectedTilesNamesMap);
			
		}
		else 
		{
			var midLon = (currMinGeographicCoords.longitude + currMaxGeographicCoords.longitude)/2;
			var midLat = (currMinGeographicCoords.latitude + currMaxGeographicCoords.latitude)/2;
			var tileName = SmartTile.selectTileName(currDepth, midLon, midLat, undefined);
			var geographicExtent = new GeographicExtent();
			geographicExtent.minGeographicCoord = new GeographicCoord(currMinGeographicCoords.longitude, currMinGeographicCoords.latitude, currMinGeographicCoords.altitude);
			geographicExtent.maxGeographicCoord = new GeographicCoord(currMaxGeographicCoords.longitude, currMaxGeographicCoords.latitude, currMaxGeographicCoords.altitude);
			resultFullyIntersectedTilesNamesMap[tileName] = geographicExtent;
			return;
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
 */
SmartTileManager.prototype.makeTreeByDepth = function(targetDepth, physicalNodesArray, magoManager) 
{
	if (targetDepth === undefined)
	{ targetDepth = 17; }
	
	this.targetDepth = targetDepth;
	
	var smartTilesCount = this.tilesArray.length; // In this point, "smartTilesCount" = 2 always.
	for (var a=0; a<smartTilesCount; a++)
	{
		var smartTile = this.tilesArray[a];
		if (smartTile.nodeSeedsArray === undefined)
		{ smartTile.nodeSeedsArray = []; }
		
		smartTile.nodeSeedsArray = physicalNodesArray;
		smartTile.makeTreeByDepth(targetDepth, magoManager); // default depth = 17.
	}
};

/**
 * 어떤 일을 하고 있습니까?
 */
SmartTileManager.prototype.putNode = function(targetDepth, node, magoManager) 
{
	if (this.tilesArray !== undefined)
	{
		var tilesCount = this.tilesArray.length; // allways tilesCount = 2. (Asia & America sides).
		for (var i=0; i<tilesCount; i++)
		{
			this.tilesArray[i].putNode(targetDepth, node, magoManager);
		}
	}
};

/**
 * 어떤 일을 하고 있습니까?
 * @class GeoLocationData
 * @param geoLocData 변수
 */
SmartTileManager.prototype.deleteTiles = function() 
{
	// this function deletes all children tiles.
	if (this.tilesArray)
	{
		var tilesCount = this.tilesArray.length; // allways tilesCount = 2. (Asia & America sides).
		for (var i=0; i<tilesCount; i++)
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
	if (this.tilesArray === undefined)
	{ this.tilesArray = []; }
	
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












