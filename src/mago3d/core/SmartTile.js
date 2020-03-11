'use strict';

/**
 * 4분할 타일링 수행 시 타일 객체.
 * Quadtree based tile with thickness.
 * @class SmartTile
 * 
 * @exception {Error} Messages.CONSTRUCT_ERROR
 * @param {String} smartTileName tile name;
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
	this.X;
	this.Y;
	this.minGeographicCoord; // longitude, latitude, altitude.
	this.maxGeographicCoord; // longitude, latitude, altitude.
	this.sphereExtent; // Cartesian position sphere in worldCoord.
	this.subTiles; // array.
	
	this.nodeSeedsArray;
	this.smartTileF4dSeedArray;
	this.nodesFromSmartTileF4dArray; 
	this.nodesArray; 
	this.objectsArray; // parametric objects.
	this.vectorTypeObjectsArray;
	
	this.nativeObjects = {
		opaquesArray      : [],
		transparentsArray : [],
		excavationsArray  : [],
		vectorTypeArray   : []
	};
	
	this.isVisible; // var to manage the frustumCulling and delete buildings if necessary.
	this.distToCamera;
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
 * 타일에 자식 타일 생성 및 반환.
 * @param {SmartTile} parentTile 부모타일
 * @return {SmartTile} subTile 생성된 자식타일 반환
 */
SmartTile.prototype.newSubTile = function(parentTile) 
{
	if (!(parentTile instanceof SmartTile))
	{
		return;
	}
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
 * 타일의 min max coord를 이용하여 타원체를 생성 후 this.sphereExtent에 할당
 * @param {MagoManager} magoManager
 * 
 * @see SmartTile#computeSphereExtent
 */
SmartTile.prototype.makeSphereExtent = function(magoManager) 
{
	this.sphereExtent = SmartTile.computeSphereExtent(magoManager, this.minGeographicCoord, this.maxGeographicCoord, this.sphereExtent);
};

/**
 * Sphere에 반지름과 중심점을 담아서 반환.
 * @static
 * @param {MagoManager} magoManager
 * @param {GeographicCoord} minGeographicCoord
 * @param {GeographicCoord} maxGeographicCoord
 * @param {Sphere} resultSphereExtent
 * 
 * @returns {Sphere} resultSphereExtent
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
SmartTile.prototype.putSmartTileF4dSeed = function(targetDepth, smartTileF4dSeed, magoManager) 
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
		var geoCoord = smartTileF4dSeed.geographicCoord;
		var subSmartTile;
		var finish = false;
		var i=0;
		while (!finish && i<4)
		{
			subSmartTile = this.subTiles[i];
			if (subSmartTile.intersectPoint(geoCoord.longitude, geoCoord.latitude) )
			{
				subSmartTile.putSmartTileF4dSeed(targetDepth, smartTileF4dSeed, magoManager);
				finish = true;
			}
			
			i++;
		}
	}
	else if (this.depth === targetDepth)
	{
		if (this.smartTileF4dSeedArray === undefined)
		{ this.smartTileF4dSeedArray = []; }

		this.smartTileF4dSeedArray.push(smartTileF4dSeed);
		
		// test inserting dataPackage(lod4 & lod3).***
		var smTileName = smartTileF4dSeed.tileName;
		var splitted = smTileName.split('.');
		var smTileRawName = splitted[0];
		
		// copy all attributtes, except tileName.
		var smartTileF4dSeed_lod4 = {};
		smartTileF4dSeed_lod4.L = smartTileF4dSeed.L;
		smartTileF4dSeed_lod4.X = smartTileF4dSeed.X;
		smartTileF4dSeed_lod4.Y = smartTileF4dSeed.Y;
		smartTileF4dSeed_lod4.geographicCoord = smartTileF4dSeed.geographicCoord;
		smartTileF4dSeed_lod4.objectType = smartTileF4dSeed.objectType;
		smartTileF4dSeed_lod4.id = smartTileF4dSeed.id;
		smartTileF4dSeed_lod4.smartTileType = smartTileF4dSeed.smartTileType;
		smartTileF4dSeed_lod4.tileName = smTileRawName + "_4.sti";
		smartTileF4dSeed_lod4.projectFolderName = smartTileF4dSeed.projectFolderName;
		smartTileF4dSeed_lod4.fileLoadState = CODE.fileLoadState.READY;
		this.smartTileF4dSeedArray.push(smartTileF4dSeed_lod4);
		
		var smartTileF4dSeed_lod3 = {};
		smartTileF4dSeed_lod3.L = smartTileF4dSeed.L;
		smartTileF4dSeed_lod3.X = smartTileF4dSeed.X;
		smartTileF4dSeed_lod3.Y = smartTileF4dSeed.Y;
		smartTileF4dSeed_lod3.geographicCoord = smartTileF4dSeed.geographicCoord;
		smartTileF4dSeed_lod3.objectType = smartTileF4dSeed.objectType;
		smartTileF4dSeed_lod3.id = smartTileF4dSeed.id;
		smartTileF4dSeed_lod3.smartTileType = smartTileF4dSeed.smartTileType;
		smartTileF4dSeed_lod3.tileName = smTileRawName + "_3.sti";
		smartTileF4dSeed_lod3.projectFolderName = smartTileF4dSeed.projectFolderName;
		smartTileF4dSeed_lod3.fileLoadState = CODE.fileLoadState.READY;
		this.smartTileF4dSeedArray.push(smartTileF4dSeed_lod3);
		
		return true;
	}
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
		
		// todo: Must recalculate the smartTile sphereExtent.
		//this.makeSphereExtent(magoManager);
		
		
		return true;
	}
};

/**
 * 어떤 일을 하고 있습니까?
 * @param geoLocData 변수
 */
SmartTile.prototype.putObject = function(targetDepth, object, magoManager) 
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
		var geoLocData = object.geoLocDataManager.getCurrentGeoLocationData();
		var geoCoord = geoLocData.getGeographicCoords();
		
		var subSmartTile;
		var finish = false;
		var i=0;
		while (!finish && i<4)
		{
			subSmartTile = this.subTiles[i];
			if (subSmartTile.intersectPoint(geoCoord.longitude, geoCoord.latitude))
			{
				subSmartTile.putObject(targetDepth, object, magoManager);
				finish = true;
			}
			
			i++;
		}
	}
	else if (this.depth === targetDepth)
	{
		object.smartTileOwner = this;
		if (object instanceof MagoRenderable) 
		{
			if (object.objectType === MagoRenderable.OBJECT_TYPE.MESH)
			{
				if (object.isOpaque())
				{
					this.nativeObjects.opaquesArray.push(object);
				}
				else 
				{
					this.nativeObjects.transparentsArray.push(object);
				}
			}
			else if (object.objectType === MagoRenderable.OBJECT_TYPE.VECTORMESH)
			{
				this.nativeObjects.vectorTypeArray.push(object);
			}
		}
		else if (object instanceof Excavation) 
		{
			this.nativeObjects.excavationsArray.push(object);
		}
		// todo: Must recalculate the smartTile sphereExtent.
		return true;
	}
};


/**
 * 목표레벨까지 각 타일의 SUB타일 생성 및 노드의 위치와 교점이 있는지 파악 후 노드를 보관.
 * @param {Number} targetDepth
 * @param {MagoManager} magoManager
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
			this.subTiles[i].takeIntersectedBuildingSeeds(this.nodeSeedsArray);
		}
		
		// for each subTile that has intercepted buildingSeeds -> makeTree.
		for (var i=0; i<4; i++)
		{
			this.subTiles[i].makeTreeByDepth(targetDepth, magoManager);
		}
		
	}
	else 
	{
		var hola = 0;
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
 * 타일과 노드의 포함유무 체크
 * @param {Node} node 포함유무를 체크할 
 * @return {Boolean}
 * 
 * @see this#intersectPoint
 */
SmartTile.prototype.intersectsNode = function(node) 
{
	var intersects = false;
	var buildingSeed = node.data.buildingSeed;
	var rootNode = node.getRoot();
	
	// Find geographicCoords as is possible.
	var longitude, latitude;
	
	if (rootNode.data.bbox !== undefined && rootNode.data.bbox.geographicCoord !== undefined)
	{
		longitude = rootNode.data.bbox.geographicCoord.longitude;
		latitude = rootNode.data.bbox.geographicCoord.latitude;
	}
	else if (buildingSeed !== undefined)
	{
		// in this case take the data from buildingSeed.
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
 * 해당 타일에 속하는 Node를 찾아서 nodeseedsArray에 추가.
 * Node의 smartTileOwner에 해당 SmartTile 인스턴스를 할당.
 * @param {Array.<Node>} nodeSeedsArray Node Array
 * 
 * @see this#intersectsNode
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
		
			// Set the smartTileOwner, for fast move of the node between smartTiles.
			node.data.smartTileOwner = this;
			
			this.nodeSeedsArray.push(node);
			
			// now, redefine the altitude limits of this tile.
			var buildingSeed = node.data.buildingSeed;
			if (buildingSeed !== undefined)
			{
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
 * 위경도를 받아서 현재 타일인스턴스와의 포함유무 반환.
 * @param {Number} longitude
 * @param {Number} latitude
 * 
 * @return {boolean}
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
	
	// Erase from this.nodeSeedsArray & this.nodesArray.
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
SmartTile.prototype.calculateDistToCamera = function(camera) 
{
	var sphereExtent = this.getSphereExtent();
	this.distToCamera = sphereExtent.distToPoint3D(camera.position);
	return this.distToCamera;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param frustum 변수
 */
SmartTile.prototype.extractLowestTiles = function(camera, resultLowestTilesArray, maxDistToCamera) 
{
	if (this.hasRenderables())
	{
		// Calculate distToCamera to sort by distance.
		var distToCam = this.calculateDistToCamera(camera);
		if (distToCam < SmartTileManager.maxDistToCameraByDepth(this.depth))
		{ 
			this.intersectionType = Constant.INTERSECTION_INSIDE;
			this.putSmartTileInEyeDistanceSortedArray(resultLowestTilesArray, this); 
		}
	}
		
	if (this.subTiles === undefined || this.subTiles.length === 0)
	{
		return;
	}
		
	var subTilesCount = this.subTiles.length;
	for (var i=0; i<subTilesCount; i++)
	{
		this.subTiles[i].extractLowestTiles(camera, resultLowestTilesArray, maxDistToCamera);
	}
};

/**
 * 어떤 일을 하고 있습니까?
 * @param frustum 변수
 */
SmartTile.prototype.getFrustumIntersectedLowestTiles = function(camera, frustum, resultFullyIntersectedTilesArray, maxDistToCamera) 
{
	var fullyIntersectedTiles = [];
	var partiallyIntersectedTilesArray = [];
	this.getFrustumIntersectedTiles(camera, frustum, fullyIntersectedTiles, partiallyIntersectedTilesArray, maxDistToCamera);
	resultFullyIntersectedTilesArray.push.apply(resultFullyIntersectedTilesArray, partiallyIntersectedTilesArray);
	
	var intersectedTilesCount = fullyIntersectedTiles.length;
	for (var i=0; i<intersectedTilesCount; i++)
	{
		fullyIntersectedTiles[i].extractLowestTiles(camera, resultFullyIntersectedTilesArray, maxDistToCamera);
	}
};

/**
 * 어떤 일을 하고 있습니까?
 * @param frustum 변수
 */
SmartTile.prototype.getFrustumIntersectedTiles = function(camera, frustum, resultFullyIntersectedTilesArray, resultPartiallyIntersectedTilesArray, maxDistToCamera) 
{
	if (this.sphereExtent === undefined)
	{ return Constant.INTERSECTION_OUTSIDE; }
	
	this.intersectionType = frustum.intersectionSphere(this.sphereExtent);
	
	if (this.intersectionType === Constant.INTERSECTION_OUTSIDE)
	{ return; }
	else if (this.intersectionType === Constant.INTERSECTION_INSIDE)
	{
		resultFullyIntersectedTilesArray.push(this);
		return;
	}
	else if (this.intersectionType === Constant.INTERSECTION_INTERSECT)
	{
		if (this.hasRenderables())
		{ 
			// Calculate the distToCamera.
			var distToCam = this.calculateDistToCamera(camera);
			if (distToCam < SmartTileManager.maxDistToCameraByDepth(this.depth))
			{ this.putSmartTileInEyeDistanceSortedArray(resultPartiallyIntersectedTilesArray, this); }
		} 
			
		if (this.subTiles && this.subTiles.length > 0)
		{
			for (var i=0; i<this.subTiles.length; i++)
			{
				if (this.subTiles[i].sphereExtent)
				{ this.subTiles[i].getFrustumIntersectedTiles(camera, frustum, resultFullyIntersectedTilesArray, resultPartiallyIntersectedTilesArray, maxDistToCamera); }
			}
		}
	}
};
/*
 * 어떤 일을 하고 있습니까?
 * @param frustum 변수
 */
SmartTile.prototype.getSphereIntersectedTiles = function(sphere, resultIntersectedTilesArray, maxDepth) 
{
	if (this.depth > maxDepth)
	{ return Constant.INTERSECTION_OUTSIDE; }
	
	if (this.sphereExtent === undefined)
	{ return Constant.INTERSECTION_OUTSIDE; }
	
	var intersectionType = sphere.intersectionSphere(this.sphereExtent);
	
	if (intersectionType === Constant.INTERSECTION_OUTSIDE)
	{ return Constant.INTERSECTION_OUTSIDE; }
	else
	{
		if (this.hasRenderables())
		{ 
			resultIntersectedTilesArray.push(this);
		} 
			
		if (this.subTiles && this.subTiles.length > 0)
		{
			for (var i=0; i<this.subTiles.length; i++)
			{
				if (this.subTiles[i].sphereExtent)
				{ this.subTiles[i].getSphereIntersectedTiles(sphere, resultIntersectedTilesArray, maxDepth); }
			}
		}
	}
};

/**
 * 어떤 일을 하고 있습니까?
 * @param result_smartTilesArray 변수
 * @param smartTile 변수
 */
SmartTile.prototype.putSmartTileInEyeDistanceSortedArray = function(result_smartTilesArray, smartTile) 
{
	// sorting is from minDist to maxDist.
	if (result_smartTilesArray.length > 0)
	{
		var startIdx = 0;
		var endIdx = result_smartTilesArray.length - 1;
		var insert_idx= ManagerUtils.getIndexToInsertBySquaredDistToEye(result_smartTilesArray, smartTile, startIdx, endIdx);

		result_smartTilesArray.splice(insert_idx, 0, smartTile);
	}
	else 
	{
		result_smartTilesArray.push(smartTile);
	}
};

/**
 * This function returns true if this smartTile has renderables objects.
 */
SmartTile.prototype.hasRenderables = function() 
{
	var hasObjects = false;
	
	if (this.nodeSeedsArray !== undefined &&  this.nodeSeedsArray.length > 0)
	{ return true; }

	if (this.nodesArray !== undefined &&  this.nodesArray.length > 0)
	{ return true; }

	// check if has smartTileF4dSeeds.***
	if (this.smartTileF4dSeedArray !== undefined && this.smartTileF4dSeedArray.length > 0)
	{ return true; }

	// check native objects.
	var nativeObjects = this.nativeObjects;
	if (nativeObjects.opaquesArray.length > 0 || nativeObjects.transparentsArray.length > 0 || nativeObjects.excavationsArray.length > 0 || nativeObjects.vectorTypeArray.length > 0)
	{ return true; }
	
	//if (this.objectsArray !== undefined && this.objectsArray.length > 0)
	//{ return true; }
	
	return hasObjects;
};

/**
 * This function returns true if this smartTile needs create geometries from sedds.
 */
SmartTile.prototype.isNeededToCreateGeometriesFromSeeds = function() 
{
	var isNeeded = false;
	
	if (this.nodeSeedsArray !== undefined)
	{
		if (this.nodesArray === undefined)
		{ return true; }
		
		if (this.nodesArray.length !== this.nodeSeedsArray.length)
		{ return true; }
	}
	
	if (this.smartTileF4dSeedArray !== undefined && this.smartTileF4dSeedArray.length > 0)
	{ 
		var smartTilesF4dCount = this.smartTileF4dSeedArray.length;
		for (var i=0; i<smartTilesF4dCount; i++)
		{
			if (this.smartTileF4dSeedArray[i].fileLoadState !== CODE.fileLoadState.PARSE_FINISHED)
			{ return true; }
		} 
	}
	
	return isNeeded;
};

/**
 */
SmartTile.prototype.setNodesAttribute = function(nodesArray, attributeName, attributeValue) 
{
	if (nodesArray !== undefined)
	{
		var nodesCount = nodesArray.length;
		for (var i=0; i<nodesCount; i++)
		{
			var node = nodesArray[i];
			if (node.data.attributes === undefined)
			{ node.data.attributes = {}; }
			
			node.data.attributes[attributeName] = attributeValue;
		}
	}
};

/**
 */
SmartTile.prototype.createGeometriesFromSeeds = function(magoManager) 
{
	// create the buildings by buildingSeeds.
	var node;
	var neoBuilding;
	var nodeBbox;
	var buildingSeed;
	var startIndex = 0;
	
	var geometriesCreated = false;
	
	// if exist nodesArray (there are buildings) and add a nodeSeed, we must make nodes of the added nodeSeeds.***
	if (this.nodeSeedsArray !== undefined)
	{
		//if (this.nodesArray)
		//{ startIndex = this.nodesArray.length; }

		if (this.nodesArray === undefined)
		{ this.nodesArray = []; }

		var nodeSeedsCount = this.nodeSeedsArray.length;
		var nodesCount = this.nodesArray.length;
		
		if (nodeSeedsCount !== nodesCount)
		{
			this.setNodesAttribute(this.nodeSeedsArray, "needCreated", 1);
			this.setNodesAttribute(this.nodesArray, "needCreated", 0);
			
			for (var j=0; j<nodeSeedsCount; j++)
			{
				node = this.nodeSeedsArray[j];
				
				if (node.data.attributes.needCreated === 1)
				{
					var attributes = node.data.attributes;
					if (attributes.objectType === "basicF4d" && attributes.fromSmartTile === false)
					{
						if (attributes.projectId !== undefined && attributes.isReference !== undefined && attributes.isReference === true)
						{
							StaticModelsManager.manageStaticModel(node, magoManager);
						}
					
						if (node.data.neoBuilding !== undefined)
						{
							this.nodesArray.push(node);
							continue;
						}
						
						neoBuilding = new NeoBuilding();
						
						// Test.
						neoBuilding.setAttribute("keepDataArrayBuffers", true);
						// End test.
						
						neoBuilding.nodeOwner = node;
						node.data.neoBuilding = neoBuilding;
						if (node.data.bbox === undefined)
						{ node.data.bbox = new BoundingBox(); }
						nodeBbox = node.data.bbox;
						buildingSeed = node.data.buildingSeed;
						
						this.nodesArray.push(node);
						
						if (neoBuilding.metaData === undefined) 
						{ neoBuilding.metaData = new MetaData(); }

						if (neoBuilding.metaData.geographicCoord === undefined)
						{ neoBuilding.metaData.geographicCoord = new GeographicCoord(); }

						if (neoBuilding.metaData.bbox === undefined) 
						{ neoBuilding.metaData.bbox = new BoundingBox(); }

						// create a building and set the location.***
						neoBuilding.name = buildingSeed.name;
						neoBuilding.buildingId = buildingSeed.buildingId;
					
						neoBuilding.buildingType = "basicBuilding";
						neoBuilding.buildingFileName = buildingSeed.buildingFileName;
						neoBuilding.metaData.geographicCoord.setLonLatAlt(buildingSeed.geographicCoord.longitude, buildingSeed.geographicCoord.latitude, buildingSeed.geographicCoord.altitude);
						neoBuilding.metaData.bbox.copyFrom(buildingSeed.bBox);
						nodeBbox.copyFrom(buildingSeed.bBox); // initially copy from building.
						if (neoBuilding.bbox === undefined)
						{ neoBuilding.bbox = new BoundingBox(); }
						neoBuilding.bbox.copyFrom(buildingSeed.bBox);
						neoBuilding.metaData.heading = buildingSeed.rotationsDegree.z;
						neoBuilding.metaData.pitch = buildingSeed.rotationsDegree.x;
						neoBuilding.metaData.roll = buildingSeed.rotationsDegree.y;
						neoBuilding.projectFolderName = node.data.projectFolderName;
						
						geometriesCreated = true;
					}
				}
				//else if (attributes.objectType === "multiBuildingsTile")
				//{
				//	if (node.data.multiBuildings !== undefined)
				//	{
				//		this.nodesArray.push(node);
				//		continue;
				//	}
				//	
				//	var multiBuildings = new MultiBuildings();
				//	multiBuildings.nodeOwner = node;
				//	multiBuildings.attributes = attributes;
				//	node.data.multiBuildings = multiBuildings;
				//	
				//	geometriesCreated = true;
				//}
			}
		}
	}
	
	// Now, check if exist smartTileF4dSeeds.***
	var distToCam = this.distToCamera; // use distToCam to decide load & parse smartTiles.
	
	if (this.smartTileF4dSeedArray !== undefined)
	{
		var smartTileF4dSeedsCount = this.smartTileF4dSeedArray.length;
		for (var i=0; i<smartTileF4dSeedsCount; i++)
		{
			var smartTileF4dSeed = this.smartTileF4dSeedArray[i];
			if (smartTileF4dSeed.fileLoadState === undefined)
			{ smartTileF4dSeed.fileLoadState = CODE.fileLoadState.READY; }
			
			if (i > 0)
			{
				// check if the previous level is parsedFinished.
				if (this.smartTileF4dSeedArray[i-1].fileLoadState !== CODE.fileLoadState.PARSE_FINISHED)
				{ break; }
			
				if (distToCam > magoManager.magoPolicy.getLod4DistInMeters())
				{ break; }
			}
			
			if (smartTileF4dSeed.fileLoadState === CODE.fileLoadState.READY)
			{
				//this.smartTileF4dSeedMap[name] = {
				//"L"                 : L,
				//"X"                 : X,
				//"Y"                 : Y,
				//"geographicCoord"   : centerGeoCoord,
				//"objectType"        : "F4dTile",
				//"id"                : f4dTileId,
				//"tileName"          : name,
				//"projectFolderName" : projectFolderName};
				if (magoManager.readerWriter.smartTileF4d_requested < 3)
				{
					var readerWriter = magoManager.readerWriter;
					var projectFolderName = smartTileF4dSeed.projectFolderName;
					var L = smartTileF4dSeed.L.toString();
					var X = smartTileF4dSeed.X.toString();
					var tilename = smartTileF4dSeed.tileName;
					var smartTileOwner = this;
					var geometryDataPath = readerWriter.geometryDataPath; // default geometryDataPath = "/f4d".***
					var fileName = geometryDataPath + "/" + projectFolderName + "/" + L + "/" + X + "/" + tilename;
					
					readerWriter.getSmartTileF4d(fileName, smartTileF4dSeed, smartTileOwner, magoManager);
				}
				break;
			}
			else if (smartTileF4dSeed.fileLoadState === CODE.fileLoadState.LOADING_FINISHED )
			{
				// parse the dataArrayBuffer.***
				var maxParses = 30;
				if (i > 0)
				{ maxParses = 5; }
				var parseQueue = magoManager.parseQueue;
				if (parseQueue.smartTileF4dParsesCount < maxParses)
				{
					// proceed to parse the dataArrayBuffer.***
					this.parseSmartTileF4d(smartTileF4dSeed.dataArrayBuffer, magoManager);
					parseQueue.smartTileF4dParsesCount++; // increment counter.
					smartTileF4dSeed.fileLoadState = CODE.fileLoadState.PARSE_FINISHED;
				
					geometriesCreated = true;
					break;
				}
			}
		}
	}

	return geometriesCreated;
};

/**
 */
SmartTile.prototype.parseSmartTileF4d = function(dataArrayBuffer, magoManager) 
{
	var hierarchyManager = magoManager.hierarchyManager;
	var readWriter = magoManager.readerWriter;
	var smartTileManager = magoManager.smartTileManager;
	var targetDepth = 17;
	
	if (targetDepth > this.depth)
	{ targetDepth = this.depth; }

	if (this.nodesArray === undefined)
	{ this.nodesArray = []; }

	if (this.sphereExtent === undefined)
	{ this.makeSphereExtent(magoManager); }

	var enc = new TextDecoder("utf-8");
	
	// parse smartTileF4d.***
	var bytesReaded = 0;
	var smartTileType = (new Int32Array(dataArrayBuffer.slice(bytesReaded, bytesReaded+4)))[0]; bytesReaded += 4;
	var buildingsCount = (new Int32Array(dataArrayBuffer.slice(bytesReaded, bytesReaded+4)))[0]; bytesReaded += 4;
	for (var i=0; i<buildingsCount; i++)
	{
		// read projectId.
		var projectId = "";
		var wordLength = (new Uint16Array(dataArrayBuffer.slice(bytesReaded, bytesReaded+2)))[0]; bytesReaded += 2;
		projectId = enc.decode(new Int8Array(dataArrayBuffer.slice(bytesReaded, bytesReaded+ wordLength))) ;bytesReaded += wordLength;
		
		// read buildingId.
		var buildingId = "";
		wordLength = (new Uint16Array(dataArrayBuffer.slice(bytesReaded, bytesReaded+2)))[0]; bytesReaded += 2;
		buildingId = enc.decode(new Int8Array(dataArrayBuffer.slice(bytesReaded, bytesReaded+ wordLength))) ;bytesReaded += wordLength;
		
		// Create a node for each building.
		var attributes = {
			"isPhysical" : true,
			"objectType" : "basicF4d"
		};
		
		// Now, must check if the node exists.
		var node = hierarchyManager.getNodeByDataKey(projectId, buildingId);
		var neoBuilding;
		var data;
		if (!node)
		{ 
			node = hierarchyManager.newNode(buildingId, projectId, attributes); 
			
			// Create a neoBuilding.
			data = node.data;
			data.projectFolderName = projectId;
			data.projectId = projectId + ".json";
			data.data_name = buildingId;
			data.attributes = attributes;
			data.attributes.fromSmartTile = true;
			data.mapping_type = "origin";
		
			neoBuilding = new NeoBuilding();
			data.neoBuilding = neoBuilding;
			neoBuilding.buildingFileName = buildingId;
			neoBuilding.buildingId = buildingId;
			neoBuilding.projectFolderName = projectId;
			neoBuilding.nodeOwner = node;
			
			var metadataByteSize = (new Int32Array(dataArrayBuffer.slice(bytesReaded, bytesReaded+4)))[0]; bytesReaded += 4;
			var startBuff = bytesReaded;
			var endBuff = bytesReaded + metadataByteSize;
			neoBuilding.headerDataArrayBuffer = dataArrayBuffer.slice(startBuff, endBuff);
			bytesReaded = bytesReaded + metadataByteSize; // updating data.
			if (neoBuilding.metaData === undefined) 
			{ neoBuilding.metaData = new MetaData(); }
			neoBuilding.metaData.fileLoadState = CODE.fileLoadState.LOADING_FINISHED;
		}
		else 
		{
			data = node.data;
			neoBuilding = data.neoBuilding;
			
			if (neoBuilding === undefined)
			{
				neoBuilding = new NeoBuilding();
				data.neoBuilding = neoBuilding;
				neoBuilding.buildingFileName = buildingId;
				neoBuilding.buildingId = buildingId;
				neoBuilding.projectFolderName = projectId;
				neoBuilding.nodeOwner = node;
			}
			
			var metadataByteSize = (new Int32Array(dataArrayBuffer.slice(bytesReaded, bytesReaded+4)))[0]; bytesReaded += 4;
			var startBuff = bytesReaded;
			var endBuff = bytesReaded + metadataByteSize;
			var headerDataArrayBuffer = dataArrayBuffer.slice(startBuff, endBuff); // Step over "dataArrayBuffer".
			bytesReaded = bytesReaded + metadataByteSize; // updating data.
			if (neoBuilding.metaData === undefined) 
			{ 
				neoBuilding.metaData = new MetaData(); 
				neoBuilding.headerDataArrayBuffer = headerDataArrayBuffer;
				neoBuilding.metaData.fileLoadState = CODE.fileLoadState.LOADING_FINISHED;
			}
			
		}
		
		/*
		var data = node.data;
		data.projectFolderName = projectId;
		data.projectId = projectId + ".json";
		data.data_name = buildingId;
		data.attributes = attributes;
		data.mapping_type = "origin";
		
		// Create a neoBuilding.
		var neoBuilding = new NeoBuilding();
		data.neoBuilding = neoBuilding;
		neoBuilding.buildingFileName = buildingId;
		neoBuilding.buildingId = buildingId;
		neoBuilding.projectFolderName = projectId;
		neoBuilding.nodeOwner = node;
		*/
		
		// read header (metaData + octree's structure + textures list + lodBuilding data).
		/*
		var metadataByteSize = (new Int32Array(dataArrayBuffer.slice(bytesReaded, bytesReaded+4)))[0]; bytesReaded += 4;
		var startBuff = bytesReaded;
		var endBuff = bytesReaded + metadataByteSize;
		neoBuilding.headerDataArrayBuffer = dataArrayBuffer.slice(startBuff, endBuff);
		bytesReaded = bytesReaded + metadataByteSize; // updating data.
		if (neoBuilding.metaData === undefined) 
		{ neoBuilding.metaData = new MetaData(); }
		neoBuilding.metaData.fileLoadState = CODE.fileLoadState.LOADING_FINISHED;
		*/
	
		var lodString = "lod5"; // default.
		if (smartTileType === 2)
		{
			// NEW. Read "LOD".*** NEW. Read "LOD".*** NEW. Read "LOD".*** NEW. Read "LOD".*** NEW. Read "LOD".***
			var lod = (new Int8Array(dataArrayBuffer.slice(bytesReaded, bytesReaded+1)))[0]; bytesReaded += 1;
			lodString = "lod" + lod.toString();
		}
		
		// read lod5 mesh data.
		var lodNameLength = (new Uint16Array(dataArrayBuffer.slice(bytesReaded, bytesReaded+2)))[0]; bytesReaded += 2;
		var lodName = enc.decode(new Int8Array(dataArrayBuffer.slice(bytesReaded, bytesReaded+ lodNameLength))) ;bytesReaded += lodNameLength;
		
		var lod5meshSize = (new Int32Array(dataArrayBuffer.slice(bytesReaded, bytesReaded+4)))[0]; bytesReaded += 4;
		
		var lodBuilding = neoBuilding.getOrNewLodBuilding(lodString);
		var lowLodMesh = neoBuilding.getOrNewLodMesh(lodName);
		var startBuff = bytesReaded;
		var endBuff = bytesReaded + lod5meshSize;
		lowLodMesh.fileLoadState = CODE.fileLoadState.LOADING_FINISHED;
		lowLodMesh.dataArrayBuffer = dataArrayBuffer.slice(startBuff, endBuff);
		bytesReaded = bytesReaded + lod5meshSize; // updating data.
		
		// read lod5 image.
		var lod5ImageSize = (new Int32Array(dataArrayBuffer.slice(bytesReaded, bytesReaded+4)))[0]; bytesReaded += 4;
		var byteSize = 1;
		var startBuff = bytesReaded;
		var endBuff = bytesReaded + byteSize * lod5ImageSize;

		if (lodBuilding.texture === undefined)
		{ lodBuilding.texture = new Texture(); }
	
		lodBuilding.texture.imageBinaryData = dataArrayBuffer.slice(startBuff, endBuff);
		lodBuilding.texture.fileLoadState = CODE.fileLoadState.LOADING_FINISHED;
		bytesReaded = bytesReaded + byteSize * lod5ImageSize; // updating data.
		
	
		// read geographicCoord.
		var geoCoord = new GeographicCoord();
		bytesReaded = geoCoord.readDataFromBuffer(dataArrayBuffer, bytesReaded);
		node.data.geographicCoord = geoCoord;
		
		// read euler angles degree.
		var eulerAngDeg = new Point3D();
		bytesReaded = eulerAngDeg.readDataFromBuffer(dataArrayBuffer, bytesReaded);
		data.rotationsDegree = eulerAngDeg; 
		
		// New 20200218.***
		var dataId = (new Int32Array(dataArrayBuffer.slice(bytesReaded, bytesReaded+4)))[0]; bytesReaded += 4;
		var dataGroupId = (new Int32Array(dataArrayBuffer.slice(bytesReaded, bytesReaded+4)))[0]; bytesReaded += 4;
		var endMark = (new Int8Array(dataArrayBuffer.slice(bytesReaded, bytesReaded+1)))[0]; bytesReaded += 1;
		node.data.dataId = dataId;
		node.data.dataGroupId = dataGroupId;
		
		// finally put the node into smartTile.
		//this.putNode(this.depth, node, magoManager);
		node.data.smartTileOwner = this;
		this.nodesArray.push(node);
	}
	
	//this.fileLoadState = CODE.fileLoadState.PARSE_FINISHED;
};

/**
 */
SmartTile.prototype.parseSmartTileF4d_original = function(dataArrayBuffer, magoManager) 
{
	var hierarchyManager = magoManager.hierarchyManager;
	var readWriter = magoManager.readerWriter;
	var smartTileManager = magoManager.smartTileManager;
	var targetDepth = 17;
	
	if (targetDepth < this.depth)
	{ targetDepth = this.depth; }
	
	// parse smartTileF4d.***
	var bytesReaded = 0;
	var buildingsCount = (new Int32Array(dataArrayBuffer.slice(bytesReaded, bytesReaded+4)))[0]; bytesReaded += 4;
	for (var i=0; i<buildingsCount; i++)
	{
		// read projectId.
		var projectId = "";
		var wordLength = (new Uint16Array(dataArrayBuffer.slice(bytesReaded, bytesReaded+2)))[0]; bytesReaded += 2;
		for (var j=0; j<wordLength; j++)
		{
			projectId += String.fromCharCode(new Int8Array(dataArrayBuffer.slice(bytesReaded, bytesReaded+ 1))[0]);bytesReaded += 1;
		}
		
		// read buildingId.
		var buildingId = "";
		wordLength = (new Uint16Array(dataArrayBuffer.slice(bytesReaded, bytesReaded+2)))[0]; bytesReaded += 2;
		for (var j=0; j<wordLength; j++)
		{
			buildingId += String.fromCharCode(new Int8Array(dataArrayBuffer.slice(bytesReaded, bytesReaded+ 1))[0]);bytesReaded += 1;
		}
		
		// Create a node for each building.
		var attributes = {
			"isPhysical" : true,
			"objectType" : "basicF4d"
		};
		
		var node = hierarchyManager.newNode(buildingId, projectId, attributes);
		var data = node.data;
		data.projectFolderName = projectId;
		data.projectId = projectId + ".json";
		data.data_name = buildingId;
		data.attributes = attributes;
		data.mapping_type = "origin";
		
		// Create a neoBuilding.
		var neoBuilding = new NeoBuilding();
		data.neoBuilding = neoBuilding;
		neoBuilding.buildingFileName = buildingId;
		neoBuilding.buildingId = buildingId;
		neoBuilding.projectFolderName = projectId;
		neoBuilding.nodeOwner = node;
		
		// read header (metaData + octree's structure + textures list + lodBuilding data).
		var metadataByteSize = (new Int32Array(dataArrayBuffer.slice(bytesReaded, bytesReaded+4)))[0]; bytesReaded += 4;
		bytesReaded = neoBuilding.parseHeader(dataArrayBuffer, bytesReaded);
		neoBuilding.bbox = neoBuilding.metaData.bbox;

		// read lod5 mesh data.
		var lod5meshSize = (new Int32Array(dataArrayBuffer.slice(bytesReaded, bytesReaded+4)))[0]; bytesReaded += 4;
		var lodToLoad = 5;
		var lodBuildingData = neoBuilding.getLodBuildingData(lodToLoad);
		if (lodBuildingData === undefined)
		{ return false; }

		if (lodBuildingData.isModelRef)
		{ return false; }
		
		var textureFileName = lodBuildingData.textureFileName;
		var lodString = lodBuildingData.geometryFileName;
		
		var lowLodMesh = neoBuilding.getOrNewLodMesh(lodString);
		lowLodMesh.textureName = textureFileName;
		lowLodMesh.fileLoadState = CODE.fileLoadState.LOADING_FINISHED;
		bytesReaded = lowLodMesh.parseLegoData(dataArrayBuffer, magoManager, bytesReaded);
		
		// read lod5 image.
		var lod5ImageSize = (new Int32Array(dataArrayBuffer.slice(bytesReaded, bytesReaded+4)))[0]; bytesReaded += 4;
		var byteSize = 1;
		var startBuff = bytesReaded;
		var endBuff = bytesReaded + byteSize * lod5ImageSize;
		var lod5ImageDataBuffer = new Uint8Array(dataArrayBuffer.slice(startBuff, endBuff));
		bytesReaded = bytesReaded + byteSize * lod5ImageSize; // updating data.

		if (lowLodMesh.texture === undefined)
		{ lowLodMesh.texture = new Texture(); }
	
		var gl = magoManager.getGl();
		TexturesManager.newWebGlTextureByEmbeddedImage(gl, lod5ImageDataBuffer, lowLodMesh.texture);
		
		
		// read geographicCoord.
		var geoCoord = new GeographicCoord();
		bytesReaded = geoCoord.readDataFromBuffer(dataArrayBuffer, bytesReaded);
		node.data.geographicCoord = geoCoord;
		
		// read euler angles degree.
		var eulerAngDeg = new Point3D();
		bytesReaded = eulerAngDeg.readDataFromBuffer(dataArrayBuffer, bytesReaded);
		data.rotationsDegree = eulerAngDeg; 
		
		// finally put the node into smartTile.
		this.putNode(targetDepth, node, magoManager);
	}
	
};

/**
 * 어떤 일을 하고 있습니까?
 * @param frustum 변수
 */
SmartTile.selectTileAngleRangeByDepth = function(depth) 
{
	if (depth === undefined || depth < 0 || depth > 21)
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
	if (depth === 16)
	{ return 0.010986328 / 4.0; }
	if (depth === 17)
	{ return 0.010986328 / 8.0; }
	if (depth === 18)
	{ return 0.010986328 / 16.0; }
	if (depth === 19)
	{ return 0.010986328 / 32.0; }
	if (depth === 20)
	{ return 0.010986328 / 64.0; }
	if (depth === 21)
	{ return 0.010986328 / 128.0; }
};

/**
 * 어떤 일을 하고 있습니까?
 * @param frustum 변수
 */
SmartTile.selectTileName = function(depth, longitude, latitude, resultTileName) 
{
	var xMin = -180.0;
	var yMin = 90.0;
	var angRange = SmartTile.selectTileAngleRangeByDepth(depth);
	
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
SmartTile.getGeographicExtentOfTileLXY = function(L, X, Y, resultGeoExtend) 
{
	var angRange = SmartTile.selectTileAngleRangeByDepth(L);
	var minLon = angRange*X - 180.0;
	var maxLon = angRange*(X+1) - 180.0;
	var minLat = 90.0 - angRange*(Y+1);
	var maxLat = 90.0 - angRange*(Y);
	
	if (resultGeoExtend === undefined)
	{ resultGeoExtend = new GeographicExtent(); }
	
	resultGeoExtend.setExtent(minLon, minLat, 0, maxLon, maxLat, 0);
	return resultGeoExtend;
};


/**
 * 어떤 일을 하고 있습니까?
 * @param frustum 변수
 */
 
SmartTile.getFrustumIntersectedTilesNames = function(frustum, maxDepth, camPos, magoManager, resultIntersectedTilesNamesMap) 
{
	var currMinGeographicCoords = new GeographicCoord();
	var currMaxGeographicCoords = new GeographicCoord();
	var currDepth = 0;
	
	if (resultIntersectedTilesNamesMap === undefined)
	{ resultIntersectedTilesNamesMap = []; }
	
	// America side.
	currMinGeographicCoords.setLonLatAlt(-180, -90, 0);
	currMaxGeographicCoords.setLonLatAlt(0, 90, 0);
	currDepth = 0;
	SmartTile.getFrustumIntersectedTilesNamesForGeographicExtent(frustum, maxDepth, currDepth, camPos, currMinGeographicCoords, currMaxGeographicCoords, magoManager, magoManager.boundingSphere_Aux, 
		resultIntersectedTilesNamesMap);
	
	// Asia side.
	currMinGeographicCoords.setLonLatAlt(0, -90, 0);
	currMaxGeographicCoords.setLonLatAlt(180, 90, 0);
	currDepth = 0;
	SmartTile.getFrustumIntersectedTilesNamesForGeographicExtent(frustum, maxDepth, currDepth, camPos, currMinGeographicCoords, currMaxGeographicCoords, magoManager, magoManager.boundingSphere_Aux, 
		resultIntersectedTilesNamesMap);
		
	return resultIntersectedTilesNamesMap;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param frustum 변수
 */
 
SmartTile.getFrustumIntersectedTilesNamesForGeographicExtent = function(frustum, maxDepth, currDepth, camPos, currMinGeographicCoords, currMaxGeographicCoords, magoManager, sphereExtentAux, resultFullyIntersectedTilesNamesMap) 
{
	// STATIC FUNCTION.
	// 1rst, make a sphereExtent.
	
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
		// check distance to camera.
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
			// must descend.
			currDepth += 1;
			var minLon = currMinGeographicCoords.longitude;
			var minLat = currMinGeographicCoords.latitude;
			var minAlt = currMinGeographicCoords.altitude;
			var maxLon = currMaxGeographicCoords.longitude;
			var maxLat = currMaxGeographicCoords.latitude;
			var maxAlt = currMaxGeographicCoords.altitude;
			var midLon = (minLon + maxLon)/ 2;
			var midLat = (minLat + maxLat)/ 2;
			
			// subTile 1.
			currMaxGeographicCoords.setLonLatAlt(midLon, midLat, maxAlt);
			this.getFrustumIntersectedTilesNamesForGeographicExtent(frustum, maxDepth, currDepth, camPos, currMinGeographicCoords, currMaxGeographicCoords, magoManager, sphereExtentAux, resultFullyIntersectedTilesNamesMap);
			
			// subTile 2.
			currMinGeographicCoords.setLonLatAlt(midLon, minLat, minAlt);
			currMaxGeographicCoords.setLonLatAlt(maxLon, midLat, maxAlt);
			this.getFrustumIntersectedTilesNamesForGeographicExtent(frustum, maxDepth, currDepth, camPos, currMinGeographicCoords, currMaxGeographicCoords, magoManager, sphereExtentAux, resultFullyIntersectedTilesNamesMap);
			
			// subTile 3.
			currMinGeographicCoords.setLonLatAlt(midLon, midLat, minAlt);
			currMaxGeographicCoords.setLonLatAlt(maxLon, maxLat, maxAlt);
			this.getFrustumIntersectedTilesNamesForGeographicExtent(frustum, maxDepth, currDepth, camPos, currMinGeographicCoords, currMaxGeographicCoords, magoManager, sphereExtentAux, resultFullyIntersectedTilesNamesMap);
			
			// subTile 4.
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
 * @param frustum 변수
 */
 
SmartTile.getTilesNamesByTargetDepth = function(targetDepth, currDepth, currMinGeographicCoords, currMaxGeographicCoords, resultTilesNamesMap) 
{
	if (currDepth < targetDepth)
	{
		// must descend.
		currDepth += 1;
		var minLon = currMinGeographicCoords.longitude;
		var minLat = currMinGeographicCoords.latitude;
		var minAlt = currMinGeographicCoords.altitude;
		var maxLon = currMaxGeographicCoords.longitude;
		var maxLat = currMaxGeographicCoords.latitude;
		var maxAlt = currMaxGeographicCoords.altitude;
		var midLon = (minLon + maxLon)/ 2;
		var midLat = (minLat + maxLat)/ 2;
		
		// subTile 1.
		currMaxGeographicCoords.setLonLatAlt(midLon, midLat, maxAlt);
		this.getTilesNamesByTargetDepth(targetDepth, currDepth, currMinGeographicCoords, currMaxGeographicCoords, resultTilesNamesMap);
		
		// subTile 2.
		currMinGeographicCoords.setLonLatAlt(midLon, minLat, minAlt);
		currMaxGeographicCoords.setLonLatAlt(maxLon, midLat, maxAlt);
		this.getTilesNamesByTargetDepth(targetDepth, currDepth, currMinGeographicCoords, currMaxGeographicCoords, resultTilesNamesMap);
		
		// subTile 3.
		currMinGeographicCoords.setLonLatAlt(midLon, midLat, minAlt);
		currMaxGeographicCoords.setLonLatAlt(maxLon, maxLat, maxAlt);
		this.getTilesNamesByTargetDepth(targetDepth, currDepth, currMinGeographicCoords, currMaxGeographicCoords, resultTilesNamesMap);
		
		// subTile 4.
		currMinGeographicCoords.setLonLatAlt(minLon, midLat, minAlt);
		currMaxGeographicCoords.setLonLatAlt(midLon, maxLat, maxAlt);
		this.getTilesNamesByTargetDepth(targetDepth, currDepth, currMinGeographicCoords, currMaxGeographicCoords, resultTilesNamesMap);
		
	}
	else 
	{
		var midLon = (currMinGeographicCoords.longitude + currMaxGeographicCoords.longitude)/2;
		var midLat = (currMinGeographicCoords.latitude + currMaxGeographicCoords.latitude)/2;
		var tileName = SmartTile.selectTileName(currDepth, midLon, midLat, undefined);
		var geographicExtent = new GeographicExtent();
		geographicExtent.minGeographicCoord = new GeographicCoord(currMinGeographicCoords.longitude, currMinGeographicCoords.latitude, currMinGeographicCoords.altitude);
		geographicExtent.maxGeographicCoord = new GeographicCoord(currMaxGeographicCoords.longitude, currMaxGeographicCoords.latitude, currMaxGeographicCoords.altitude);
		resultTilesNamesMap[tileName] = geographicExtent;
		return;
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
 * 각각 민맥스 좌표들로 타일의 사이즈 세팅.
 * @param {number} minLon
 * @param {number} minLat
 * @param {number} minAlt
 * @param {number} maxLon
 * @param {number} maxLat
 * @param {number} maxAlt
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
 * 생성된 4개의 subtile에 각각의 좌표를 할당
 */
SmartTile.prototype.setSizesToSubTiles = function() 
{
	//       +-----+-----+
	//       |  3  |  2  |
	//       +-----+-----+
	//       |  0  |  1  |
	//       +-----+-----+
	if (this.subTiles.length < 4)
	{
		throw new Error('When subTiles length is 4, setSizesToSubTiles is ok.'); 
	}
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
	subTile.X = this.X*2;
	subTile.Y = this.Y*2 + 1;
	
	subTile = this.subTiles[1];
	subTile.setSize(midLon, minLat, minAlt,     maxLon, midLat, maxAlt);
	subTile.X = this.X*2 + 1;
	subTile.Y = this.Y*2 + 1;
	
	subTile = this.subTiles[2];
	subTile.setSize(midLon, midLat, minAlt,     maxLon, maxLat, maxAlt);
	subTile.X = this.X*2 + 1;
	subTile.Y = this.Y*2;
	
	subTile = this.subTiles[3];
	subTile.setSize(minLon, midLat, minAlt,     midLon, maxLat, maxAlt);
	subTile.X = this.X*2;
	subTile.Y = this.Y*2;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param geoLocData 변수
 */
SmartTile.prototype.getId = function() 
{
	if (this.id === undefined)
	{
		this.id = this.depth.toString()+ "_" + this.X.toString() + "_" + this.Y.toString();
	}
	return this.id;
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
 * 스마트 타일 내에 object 제거
 * @param {object} object mago3d model object
 * @param {string} comparision comparision key name
 */
SmartTile.prototype.eraseObjectByComparision = function(object, comparision) 
{
	if (!object[comparision]) { return false; }
	
	var comparisionValue = object[comparision];
	var idx = null;
	if (this.objectsArray && Array.isArray(this.objectsArray)) 
	{
		for (var i=0, len=this.objectsArray.length; i<len;++i) 
		{
			if (!this.objectsArray[i][comparision]) { continue; }
			
			if (this.objectsArray[i][comparision] === comparisionValue)
			{
				this.objectsArray.splice(i, 1);
				break;
			}
		}
	}
};