'use strict';

/**
 * 4분할 타일링 수행 시 타일 객체.
 * Quadtree based tile with thickness.
 * @class SmartTile
 * 
 * @exception {Error} Messages.CONSTRUCT_ERROR
 * @param {String} smartTileName tile name;
 */
var SmartTile = function(smartTileName, options) 
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
	this.smartTileManager;
	
	this.nodeSeedsArray;
	this.smartTileF4dSeedArray;
	this.nodesFromSmartTileF4dArray; 
	this.nodesArray; 
	this.objectsArray; // parametric objects.
	this.vectorTypeObjectsArray;
	
	this.nativeObjects = {
		generalObjectsArray : [], // opaques & transparent objects.
		excavationsArray    : [],
		vectorTypeArray     : [],
		lightSourcesArray   : [],
		nativeSeedArray     : []
	};
	
	this.isVisible; // var to manage the frustumCulling and delete buildings if necessary.
	this.distToCamera;

	this.mgSetArray; // collection of mgSets if exists.

	if (options)
	{
		if (options.smartTileManager)
		{ this.smartTileManager = options.smartTileManager; }
	}
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

	if (this.smartTileManager)
	{ subTile.smartTileManager = this.smartTileManager; }

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
SmartTile.prototype.calculateRectangleSize = function(magoManager, resultSize) 
{
	var maxGeographicCoord = this.maxGeographicCoord;
	var minGeographicCoord = this.minGeographicCoord;

	// calculate worldCoord center position.
	var midLongitude = (maxGeographicCoord.longitude + minGeographicCoord.longitude)/2;
	var midLatitude = (maxGeographicCoord.latitude + minGeographicCoord.latitude)/2;

	// calculate width & height aproximate.
	var point_LM = ManagerUtils.geographicCoordToWorldPoint(minGeographicCoord.longitude, midLatitude, 0.0, point_LM, magoManager);
	var point_RM = ManagerUtils.geographicCoordToWorldPoint(maxGeographicCoord.longitude, midLatitude, 0.0, point_RM, magoManager);

	var point_DM = ManagerUtils.geographicCoordToWorldPoint(midLongitude, minGeographicCoord.latitude, 0.0, point_DM, magoManager);
	var point_TM = ManagerUtils.geographicCoordToWorldPoint(midLongitude, maxGeographicCoord.latitude, 0.0, point_TM, magoManager);

	var tileWidth = point_LM.distToPoint(point_RM);
	var tileHeight = point_DM.distToPoint(point_TM);

	if (resultSize === undefined)
	{ resultSize = new Point2D(); }

	resultSize.set(tileWidth, tileHeight);
	return resultSize;
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

		/*
		// debug.***********************************
		if (this.depth === 18)
		{ var hola = 0; }
		else if (this.depth === 17)
		{ var hola = 0; }
		else if (this.depth === 16)
		{ var hola = 0; }
		else if (this.depth === 15)
		{ var hola = 0; }
		else if (this.depth === 14)
		{ var hola = 0; }
		else if (this.depth === 13)
		{ var hola = 0; }
		else if (this.depth === 12)
		{ var hola = 0; }
		else if (this.depth === 11)
		{ var hola = 0; }

		var size = this.calculateRectangleSize(magoManager);
		var hola = 0;
		// End debug.--------------------------------------
		*/

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
 * This function deletes native object by nativeObject's guid.
 */
SmartTile._deleteObjectFromArrayByGuid = function(objectGuid, objectsArray, magoManager) 
{
	var object;
	var objectsCount = objectsArray.length;
	for (var i=0; i<objectsCount; i++)
	{
		object = objectsArray[i];
		if (object._guid === objectGuid)
		{
			// Delete the object.
			object.deleteObjects(magoManager.vboMemoryManager);
			delete objectsArray[i];
			objectsArray.splice(i, 1);
			return true;
		}
	}

	return false;
};

/**
 * This function deletes native object by nativeObject's guid.
 */
SmartTile.prototype.deleteNativeObjectByGuid = function(objectGuid, magoManager) 
{
	var natives = this.nativeObjects;
	var bDeleted = false;
	if (SmartTile._deleteObjectFromArrayByGuid(objectGuid, natives.generalObjectsArray, magoManager))
	{ bDeleted = true; }
	if (SmartTile._deleteObjectFromArrayByGuid(objectGuid, natives.excavationsArray, magoManager))
	{ bDeleted = true; }
	if (SmartTile._deleteObjectFromArrayByGuid(objectGuid, natives.vectorTypeArray, magoManager))
	{ bDeleted = true; }
	if (SmartTile._deleteObjectFromArrayByGuid(objectGuid, natives.lightSourcesArray, magoManager))
	{ bDeleted = true; }
	return false;
};

/**
 * This function puts a native object in this smartTile.
 * @param {Number} targetDepth the tileDepth target
 * @param {MagoRenderable} object objects to put
 * @param {MagoManager} magoManager magoManager
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
		var geoCoord;
		if (object.geoLocDataManager) 
		{
			var geoLocData = object.geoLocDataManager.getCurrentGeoLocationData();
			geoCoord = geoLocData.getGeographicCoords();
		}
		else if (object.geographicCoord) 
		{
			geoCoord = object.geographicCoord;
		}
		
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
				this.nativeObjects.generalObjectsArray.push(object);
			}
			else if (object.objectType === MagoRenderable.OBJECT_TYPE.VECTORMESH)
			{
				this.nativeObjects.vectorTypeArray.push(object);
			}
			else if (object.objectType === MagoRenderable.OBJECT_TYPE.LIGHTSOURCE)
			{
				this.nativeObjects.lightSourcesArray.push(object);
			}
		}
		else if (object instanceof GeographicCoord)
		{
			if (this.nativeObjects.pointTypeArray === undefined)
			{ this.nativeObjects.pointTypeArray = []; }
			
			this.nativeObjects.pointTypeArray.push(object);
		}
		else if (object instanceof Excavation) 
		{
			this.nativeObjects.excavationsArray.push(object);
		}
		else if (object instanceof KoreaBuildingSeed)
		{
			this.nativeObjects.nativeSeedArray.push(object);
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
};

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
			
		var maxDepth = 30;
		if (this.smartTileManager)
		{ maxDepth = this.smartTileManager.maxDepth; }

		if (this.subTiles && this.subTiles.length > 0 && this.depth < maxDepth) 
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
SmartTile.prototype.hasRenderables = function () 
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
	if (nativeObjects.generalObjectsArray.length > 0 || nativeObjects.excavationsArray.length > 0 || nativeObjects.vectorTypeArray.length > 0)
	{ return true; }

	// Check geographicCoords.***
	if (nativeObjects.pointTypeArray && nativeObjects.pointTypeArray.length > 0)
	{ return true; }
	
	// Check lightSources.***
	if (nativeObjects.lightSourcesArray && nativeObjects.lightSourcesArray.length > 0)
	{ return true; }

	// Check nativeSeedArray.***
	if (nativeObjects.nativeSeedArray && nativeObjects.nativeSeedArray.length > 0)
	{ return true; }
	
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
SmartTile.prototype.createGeometriesFromSeeds = function (magoManager) 
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
					if (attributes.objectType === "basicF4d" && !attributes.fromSmartTile)
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

						magoManager.emit(MagoManager.EVENT_TYPE.F4DRENDERREADY, {
							type      : MagoManager.EVENT_TYPE.F4DRENDERREADY,
							f4d       : node,
							timestamp : new Date()
						});
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
	
	// Now, check if exist smartTileF4dSeeds.******************************************************************************************
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
				if (smartTileF4dSeed.smartTile_parsedFromWorker)
				{
					var hola = 0;
				}
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
					if (smartTileF4dSeed.smartTile_parsedFromWorker)
					{
						var hola = 0;
					}

					this._workerParseSmartTile(smartTileF4dSeed, magoManager);
					parseQueue.smartTileF4dParsesCount++; // increment counter.
					smartTileF4dSeed.fileLoadState = CODE.fileLoadState.PARSE_STARTED;
				
					geometriesCreated = true;
					break;
				}
			}
			else if (smartTileF4dSeed.fileLoadState === CODE.fileLoadState.PARSE_STARTED )
			{
				if (smartTileF4dSeed.smartTile_parsedFromWorker)
				{
					var hola = 0;
				}

				// check if the worker finished.
				var parsedSmartTileMap = this.smartTileManager.parsedSmartTileMap;
				var z = this.depth;
				var x = this.X;
				var y = this.Y;
				if (!parsedSmartTileMap[z]) { return; }
				if (!parsedSmartTileMap[z][x]) { return; }
				if (!parsedSmartTileMap[z][x][y]) { return; }
				if (!parsedSmartTileMap[z][x][y][smartTileF4dSeed.tileName]) { return; }

				var result = parsedSmartTileMap[z][x][y][smartTileF4dSeed.tileName];

				// Now, with the "result", make the nodes.***
				this._parseSmartTileF4d(result, magoManager);
				delete parsedSmartTileMap[z][x][y][smartTileF4dSeed.tileName]; // delete from the map.***

				smartTileF4dSeed.fileLoadState = CODE.fileLoadState.PARSE_FINISHED;
				smartTileF4dSeed.smartTile_parsedFromWorker = true;
			}
		}
	}

	return geometriesCreated;
};

/**
 */
SmartTile.prototype.createGeometriesFromSeeds__original = function (magoManager) 
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
					if (attributes.objectType === "basicF4d" && !attributes.fromSmartTile)
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

						magoManager.emit(MagoManager.EVENT_TYPE.F4DRENDERREADY, {
							type      : MagoManager.EVENT_TYPE.F4DRENDERREADY,
							f4d       : node,
							timestamp : new Date()
						});
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
SmartTile.prototype._workerParseSmartTile = function (smartTileF4dSeed, magoManager) 
{
	var dataArrayBuffer = smartTileF4dSeed.dataArrayBuffer;
	var smartTileManager = this.smartTileManager;
	if (!smartTileManager.workerParseSmartTile) 
	{ 
		smartTileManager.workerParseSmartTile = createWorker(this.smartTileManager.magoManager.config.scriptRootPath + 'Worker/workerParseSmartTile.js'); 
		smartTileManager.workerParseSmartTile.onmessage = function(e)
		{
			var tileInfo = e.data.info;
			var result = e.data.parsedSmartTile;
			var parsedSmartTileMap = smartTileManager.parsedSmartTileMap;
			if (!parsedSmartTileMap[tileInfo.z]) { parsedSmartTileMap[tileInfo.z] = {}; }
			if (!parsedSmartTileMap[tileInfo.z][tileInfo.x]) { parsedSmartTileMap[tileInfo.z][tileInfo.x] = {}; }
			if (!parsedSmartTileMap[tileInfo.z][tileInfo.x][tileInfo.y]) { parsedSmartTileMap[tileInfo.z][tileInfo.x][tileInfo.y] = {}; }
			if (!parsedSmartTileMap[tileInfo.z][tileInfo.x][tileInfo.y][tileInfo.tileName]) { parsedSmartTileMap[tileInfo.z][tileInfo.x][tileInfo.y][tileInfo.tileName] = result; }
		};
	}
	
	var data = { 
		info            : {x: this.X, y: this.Y, z: this.depth, tileName: smartTileF4dSeed.tileName},
		dataArrayBuffer : dataArrayBuffer};
	smartTileManager.workerParseSmartTile.postMessage(data, [data.dataArrayBuffer]); // send to worker by reference (transfer).
	//smartTileManager.workerParseSmartTile.postMessage(data); // send to worker by copy. this is slower.
};

SmartTile.prototype._parseSmartTileF4d = function (parsedResult, magoManager) 
{
	var prefix = 'F4D_';
	var hierarchyManager = magoManager.hierarchyManager;

	if (this.nodesArray === undefined)
	{ this.nodesArray = []; }

	if (this.sphereExtent === undefined)
	{ this.makeSphereExtent(magoManager); }
	
	// parse smartTileF4d.***
	var smartTileType = parsedResult.smartTileType;
	var parsedBuildingsArray = parsedResult.buildingsArray;
	// smartTileType = 2 -> smartTile with "lod" included. Load "smartTiles_lod5", "smartTiles_lod4" or "smartTiles_lod3".

	var buildingsCount = parsedBuildingsArray.length;
	magoManager.emit(MagoManager.EVENT_TYPE.SMARTTILELOADSTART, {tile: this, timestamp: new Date()});

	var smartTilePathInfo = magoManager.f4dController.smartTilePathInfo;
	for (var i=0; i<buildingsCount; i++)
	{
		var parsedBuildingData = parsedBuildingsArray[i];

		// read projectId.
		var projectId = parsedBuildingData.projectId;
		parsedBuildingData.projectId = undefined; // delete from map to save memory.
		
		// read buildingId.
		var buildingId = parsedBuildingData.buildingId;
		parsedBuildingData.buildingId = undefined; // delete from map to save memory.

		if (!smartTilePathInfo[projectId]) { continue; }

		var projectFolderName = smartTilePathInfo[projectId].projectFolderPath;
		var savedProjectId = smartTilePathInfo[projectId].projectId;
		
		// Create a node for each building.
		//var attributes = {
		//	"isPhysical"      : true,
		//	"objectType"      : "basicF4d",
		//	"heightReference" : HeightReference.CLAMP_TO_GROUND
		//};
		var attributes = {
			"isPhysical" : true,
			"objectType" : "basicF4d"
		};
		if (projectFolderName.indexOf('-tree') > 0) 
		{
			attributes.isReference = true;
			
			if (!magoManager.isExistStaticModel(savedProjectId)) 
			{
				magoManager.addStaticModel({
					projectId          : savedProjectId,
					projectFolderName  : projectFolderName,
					buildingFolderName : buildingId
				});
			}
		}
		// Now, must check if the node exists.
		var node = hierarchyManager.getNodeByDataKey(savedProjectId, buildingId);

		if(node) {
		attributes = node.data.attributes;
		}

		var commonAttr = smartTilePathInfo[projectId].attributes;
		if (commonAttr) 
		{
			attributes.isVisible = commonAttr.isVisible;
		}

		var neoBuilding;
		var data;
		var neoBuildingHeaderData = parsedBuildingData.neoBuildingHeaderData;
		parsedBuildingData.neoBuildingHeaderData = undefined; // delete from map to save memory.
		var data_name = buildingId.startsWith(prefix) ? buildingId.replace(prefix, '') : buildingId;
		if (!node)
		{ 
			if (!attributes.isReference) 
			{
				node = hierarchyManager.newNode(buildingId, savedProjectId, attributes); 
				// Create a neoBuilding.
				data = node.data;
				data.projectFolderName = projectFolderName;
				data.projectId = savedProjectId;// + ".json";
				data.data_name = data_name;
				data.attributes = attributes;
				data.attributes.fromSmartTile = true;
				data.attributes.fromDate = new Date();
				data.attributes.toDate = new Date();
				data.mapping_type = "origin";
			
				neoBuilding = new NeoBuilding();
				data.neoBuilding = neoBuilding;
				neoBuilding.buildingFileName = prefix + buildingId;
				neoBuilding.buildingId = buildingId;
				neoBuilding.projectFolderName = projectFolderName;
				neoBuilding.nodeOwner = node;
				
				neoBuilding.headerDataArrayBuffer = neoBuildingHeaderData;
				if (neoBuilding.metaData === undefined) 
				{ neoBuilding.metaData = new MetaData(); }
				neoBuilding.metaData.fileLoadState = CODE.fileLoadState.LOADING_FINISHED;
			}
		}
		else 
		{
			if (!attributes.isReference) 
			{
				data = node.data;
				neoBuilding = data.neoBuilding;
				
				if (neoBuilding === undefined)
				{
					neoBuilding = new NeoBuilding();
					data.neoBuilding = neoBuilding;
					neoBuilding.buildingFileName =  prefix + buildingId;
					neoBuilding.buildingId = buildingId;
					neoBuilding.projectFolderName = projectFolderName;
					neoBuilding.nodeOwner = node;
				}

				var headerDataArrayBuffer = neoBuildingHeaderData; // Step over "dataArrayBuffer".
				if (neoBuilding.metaData === undefined) 
				{ 
					neoBuilding.metaData = new MetaData(); 
					neoBuilding.headerDataArrayBuffer = headerDataArrayBuffer;
					neoBuilding.metaData.fileLoadState = CODE.fileLoadState.LOADING_FINISHED;
				}
			}
		}
		var lodString = parsedBuildingData.lodString;
		parsedBuildingData.lodString = undefined; // delete from map to save memory.
		var lodName = parsedBuildingData.lodName;
		parsedBuildingData.lodName = undefined; // delete from map to save memory.
		var lowLodMeshDataArray = parsedBuildingData.lowLodMeshDataArray;
		parsedBuildingData.lowLodMeshDataArray = undefined; // delete from map to save memory.
		var lodBuildingTextureData = parsedBuildingData.lodBuildingTextureData;
		parsedBuildingData.lodBuildingTextureData = undefined; // delete from map to save memory.

		// read geographicCoord.
		var geoCoord = new GeographicCoord(parsedBuildingData.longitude, parsedBuildingData.latitude, parsedBuildingData.altitude);
		parsedBuildingData.longitude = undefined; // delete from map to save memory.
		parsedBuildingData.latitude = undefined; // delete from map to save memory.
		parsedBuildingData.altitude = undefined; // delete from map to save memory.

		// read euler angles degree.
		var eulerAngDeg = new Point3D(parsedBuildingData.rotX, parsedBuildingData.rotY, parsedBuildingData.rotZ);
		parsedBuildingData.rotX = undefined; // delete from map to save memory.
		parsedBuildingData.rotY = undefined; // delete from map to save memory.
		parsedBuildingData.rotZ = undefined; // delete from map to save memory.

		// Read dataId & dataGroup.
		var dataId = parsedBuildingData.dataId;
		parsedBuildingData.dataId = undefined; // delete from map to save memory.
		var dataGroupId = parsedBuildingData.dataGroupId;
		parsedBuildingData.dataGroupId = undefined; // delete from map to save memory.

		var externInfo = parsedBuildingData.externInfo;
		parsedBuildingData.externInfo = undefined; // delete from map to save memory.

		parsedBuildingData = undefined; // delete from map to save memory.

		if (externInfo.heightReference) 
		{
			var charValue = externInfo.heightReference;
			charValue = HeightReference.getValueByOrdinal(charValue);
			externInfo.heightReference = charValue;
		}

		if (!attributes.isReference) 
		{
			var lodBuilding = neoBuilding.getOrNewLodBuilding(lodString);
			var lowLodMesh = neoBuilding.getOrNewLodMesh(lodName);
			
			// Note : "lowLodMeshes" can be shared in a building, so, lodMesh_5 can be used for lod 4 or lod 3. So if the lodMesh exist, then dont touch it.**********
			if (lowLodMesh.fileLoadState === CODE.fileLoadState.READY)
			{
				// Only set "LOADING_FINISHED" when fileLoadState = "READY".
				lowLodMesh.fileLoadState = CODE.fileLoadState.LOADING_FINISHED;

				// Now, asign "lowLodMeshDataArray", then it will be parsed into a worker.***
				lowLodMesh.dataArrayBuffer = lowLodMeshDataArray;
			}
			//--------------------------------------------------------------------------------------------------------------------------------------------------------

			if (lodBuilding.texture === undefined)
			{ lodBuilding.texture = new Texture(); }
		
			lodBuilding.texture.imageBinaryData = lodBuildingTextureData;
			lodBuilding.texture.fileLoadState = CODE.fileLoadState.LOADING_FINISHED;

			node.data.geographicCoord = geoCoord;
			node.data.rotationsDegree = eulerAngDeg; 
			node.data.dataId = dataId;
			node.data.dataGroupId = savedProjectId;

			node.data.smartTileOwner = this;
			for (var j in externInfo) 
			{
				if (externInfo.hasOwnProperty(j)) 
				{
					node.data.attributes[j] = externInfo[j];
				}
			}

			if (attributes.heightReference === HeightReference.RELATIVE_TO_GROUND) 
			{
				node.data.relativeHeight = geoCoord.altitude;
			}
			else 
			{
				node.data.relativeHeight = 0;
			}

			// HeightReference.CLAMP_TO_GROUND;
			this.nodesArray.push(node);
		}
		else 
		{
			var lon = geoCoord.longitude;
			var lat = geoCoord.latitude;
			var alt = geoCoord.altitude;
			magoManager.instantiateStaticModel({
				projectId       : savedProjectId,
				instanceId      : buildingId,
				longitude       : lon,
				latitude        : lat,
				height          : alt,
				heading         : eulerAngDeg.z,
				pitch           : eulerAngDeg.x,
				roll            : eulerAngDeg.y,
				heightReference : HeightReference.CLAMP_TO_GROUND
			});

			var intantiatedNode = hierarchyManager.getNodeByDataKey(savedProjectId, buildingId);

			intantiatedNode.data.dataId = dataId;
			intantiatedNode.data.dataGroupId = savedProjectId;
			intantiatedNode.data.projectFolderName = projectFolderName;
			for (var j in externInfo) 
			{
				if (externInfo.hasOwnProperty(j)) 
				{
					intantiatedNode.attributes.data[j] = externInfo[j];
				}
			}
			this.nodesArray.push(intantiatedNode);
		}
		parsedResult.buildingsArray = undefined; // delete from map to save memory.
	}
	magoManager.emit(MagoManager.EVENT_TYPE.SMARTTILELOADEND, {
		tile      : this,  
		timestamp : new Date()
	});

	// test debug:
	this.smartTile_parsedFromWorker = true;//smartTile_parsedFromWorker
};

/**
 */
SmartTile.prototype.parseSmartTileF4d = function (dataArrayBuffer, magoManager) 
{
	// Old. no used. Now using worker version.
	// Old. no used. Now using worker version.
	// Old. no used. Now using worker version.
	var prefix = 'F4D_';
	var hierarchyManager = magoManager.hierarchyManager;

	if (this.nodesArray === undefined)
	{ this.nodesArray = []; }

	if (this.sphereExtent === undefined)
	{ this.makeSphereExtent(magoManager); }

	var enc = new TextDecoder("utf-8");
	
	// parse smartTileF4d.***
	var bytesReaded = 0;
	var smartTileType = (new Int32Array(dataArrayBuffer.slice(bytesReaded, bytesReaded+4)))[0]; bytesReaded += 4;

	// smartTileType = 2 -> smartTile with "lod" included. Load "smartTiles_lod5", "smartTiles_lod4" or "smartTiles_lod3".

	var buildingsCount = (new Int32Array(dataArrayBuffer.slice(bytesReaded, bytesReaded+4)))[0]; bytesReaded += 4;
	magoManager.emit(MagoManager.EVENT_TYPE.SMARTTILELOADSTART, {tile: this, timestamp: new Date()});

	var smartTilePathInfo = magoManager.f4dController.smartTilePathInfo;
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

		buildingId = buildingId.startsWith(prefix) ? buildingId.substr(4, buildingId.length-4) : buildingId;

		if (!smartTilePathInfo[projectId]) { continue; }

		var projectFolderName = smartTilePathInfo[projectId].projectFolderPath;
		var savedProjectId = smartTilePathInfo[projectId].projectId;
		
		// Create a node for each building.
		//var attributes = {
		//	"isPhysical"      : true,
		//	"objectType"      : "basicF4d",
		//	"heightReference" : HeightReference.CLAMP_TO_GROUND
		//};
		var attributes = {
			"isPhysical" : true,
			"objectType" : "basicF4d"
		};
		if (projectFolderName.indexOf('-tree') > 0) 
		{
			attributes.isReference = true;
			
			if (!magoManager.isExistStaticModel(savedProjectId)) 
			{
				magoManager.addStaticModel({
					projectId          : savedProjectId,
					projectFolderName  : projectFolderName,
					buildingFolderName : buildingId
				});
			}
		}

		//var commonAttr = magoManager.hierarchyManager.getNodeByDataKey(savedProjectId, 'attributes');
		var commonAttr = smartTilePathInfo[projectId].attributes;
		if (commonAttr) 
		{
			attributes.isVisible = commonAttr.isVisible;
		}

		// Now, must check if the node exists.
		var node = hierarchyManager.getNodeByDataKey(savedProjectId, buildingId);
		if (node)
		{
			attributes = node.data.attributes; // added with jaehyun 20211026, when reloaded smartTile, referenceHeight problem solving.***
		}

		var neoBuilding;
		var data;
		var metadataByteSize = (new Int32Array(dataArrayBuffer.slice(bytesReaded, bytesReaded+4)))[0]; bytesReaded += 4;
		var startBuff = bytesReaded;
		var endBuff = bytesReaded + metadataByteSize;
		var neoBuildingHeaderData = dataArrayBuffer.slice(startBuff, endBuff);
		bytesReaded = bytesReaded + metadataByteSize; // updating data.

		
		var data_name = buildingId.startsWith(prefix) ? buildingId.replace(prefix, '') : buildingId;
		if (!node)
		{ 
			if (!attributes.isReference) 
			{
				node = hierarchyManager.newNode(buildingId, savedProjectId, attributes); 
				// Create a neoBuilding.
				data = node.data;
				data.projectFolderName = projectFolderName;
				data.projectId = savedProjectId;// + ".json";
				data.data_name = data_name;
				data.attributes = attributes;
				data.attributes.fromSmartTile = true;
				data.attributes.fromDate = new Date();
				data.attributes.toDate = new Date();
				data.mapping_type = "boundingboxcenter";
			
				neoBuilding = new NeoBuilding();
				data.neoBuilding = neoBuilding;
				neoBuilding.buildingFileName = prefix + buildingId;
				neoBuilding.buildingId = buildingId;
				neoBuilding.projectFolderName = projectFolderName;
				neoBuilding.nodeOwner = node;
				
				neoBuilding.headerDataArrayBuffer = neoBuildingHeaderData;
				if (neoBuilding.metaData === undefined) 
				{ neoBuilding.metaData = new MetaData(); }
				neoBuilding.metaData.fileLoadState = CODE.fileLoadState.LOADING_FINISHED;
			}
		}
		else 
		{
			if (!attributes.isReference) 
			{
				data = node.data;
				neoBuilding = data.neoBuilding;
				
				if (neoBuilding === undefined)
				{
					neoBuilding = new NeoBuilding();
					data.neoBuilding = neoBuilding;
					neoBuilding.buildingFileName =  prefix + buildingId;
					neoBuilding.buildingId = buildingId;
					neoBuilding.projectFolderName = projectFolderName;
					neoBuilding.nodeOwner = node;
				}
	
				var headerDataArrayBuffer = neoBuildingHeaderData; // Step over "dataArrayBuffer".
				if (neoBuilding.metaData === undefined) 
				{ 
					neoBuilding.metaData = new MetaData(); 
					neoBuilding.headerDataArrayBuffer = headerDataArrayBuffer;
					neoBuilding.metaData.fileLoadState = CODE.fileLoadState.LOADING_FINISHED;
				}
			}
		}
		var lodString = "lod5"; // default.
		if (smartTileType === 2)
		{
			// NEW. Read "LOD".*** NEW. Read "LOD".*** NEW. Read "LOD".*** NEW. Read "LOD".*** NEW. Read "LOD".***
			var lod = (new Int8Array(dataArrayBuffer.slice(bytesReaded, bytesReaded+1)))[0]; bytesReaded += 1;
			lodString = "lod" + lod.toString();
		}
		var lodNameLength = (new Uint16Array(dataArrayBuffer.slice(bytesReaded, bytesReaded+2)))[0]; bytesReaded += 2;
		var lodName = enc.decode(new Int8Array(dataArrayBuffer.slice(bytesReaded, bytesReaded+ lodNameLength))) ;bytesReaded += lodNameLength;
		
		// read lod5/4/3 mesh data.
		var lod5meshSize = (new Int32Array(dataArrayBuffer.slice(bytesReaded, bytesReaded+4)))[0]; bytesReaded += 4;
		var startBuff = bytesReaded;
		var endBuff = bytesReaded + lod5meshSize;
		var lowLodMeshDataArray = dataArrayBuffer.slice(startBuff, endBuff);
		bytesReaded = bytesReaded + lod5meshSize; // updating data.

		// read lod5/4/3 image.
		var lod5ImageSize = (new Int32Array(dataArrayBuffer.slice(bytesReaded, bytesReaded+4)))[0]; bytesReaded += 4;
		var byteSize = 1;
		var startBuff = bytesReaded;
		var endBuff = bytesReaded + byteSize * lod5ImageSize;
		var lodBuildingTextureData = dataArrayBuffer.slice(startBuff, endBuff);
		bytesReaded = bytesReaded + byteSize * lod5ImageSize; // updating data.

		// read geographicCoord.
		var geoCoord = new GeographicCoord();
		bytesReaded = geoCoord.readDataFromBuffer(dataArrayBuffer, bytesReaded);
		// read euler angles degree.
		var eulerAngDeg = new Point3D();
		bytesReaded = eulerAngDeg.readDataFromBuffer(dataArrayBuffer, bytesReaded);

		// Read dataId & dataGroup.
		var dataId = (new Int32Array(dataArrayBuffer.slice(bytesReaded, bytesReaded+4)))[0]; bytesReaded += 4;
		var dataGroupId = (new Int32Array(dataArrayBuffer.slice(bytesReaded, bytesReaded+4)))[0]; bytesReaded += 4;

		// read data_name.
		var dataName;
		var endMark = (new Int8Array(dataArrayBuffer.slice(bytesReaded, bytesReaded+1)))[0]; bytesReaded += 1;
		if (endMark > 0)
		{
			var dataKeyLength = (new Uint16Array(dataArrayBuffer.slice(bytesReaded, bytesReaded+2)))[0]; bytesReaded += 2;
			var dataKey = enc.decode(new Int8Array(dataArrayBuffer.slice(bytesReaded, bytesReaded+ dataKeyLength))) ;bytesReaded += dataKeyLength;
			var dataNameLength = (new Uint16Array(dataArrayBuffer.slice(bytesReaded, bytesReaded+2)))[0]; bytesReaded += 2;
			var dataName = enc.decode(new Int8Array(dataArrayBuffer.slice(bytesReaded, bytesReaded+ dataNameLength))) ;bytesReaded += dataNameLength;
			endMark = (new Int8Array(dataArrayBuffer.slice(bytesReaded, bytesReaded+1)))[0]; bytesReaded += 1;
		}

		// Now, read attributtes.
		
		
		var externInfo = {};
		while (endMark > 0)
		{
			// There are more data.
			// 0 = there are not next data.***
			// 1 = bool
			// 2 = char
			// 3 = short
			// 4 = int
			// 5 = string
			// 6 = float
			// 50 = keyValueDatasList.

			// 1rst, read the stringKey.
			var dataKeyLength = (new Uint16Array(dataArrayBuffer.slice(bytesReaded, bytesReaded+2)))[0]; bytesReaded += 2;
			var dataKey = enc.decode(new Int8Array(dataArrayBuffer.slice(bytesReaded, bytesReaded+ dataKeyLength))) ;bytesReaded += dataKeyLength;

			if (endMark === 1) // the next data is bool type data.***
			{
				// read the bool value.
				var boolValue = (new Uint8Array(dataArrayBuffer.slice(bytesReaded, bytesReaded+1)))[0]; bytesReaded += 1;
				// Put the readed data into externInfo.***
				externInfo[dataKey] = boolValue ? true : false;
			}
			else if (endMark === 2) // the next data is char type data.***
			{
				// read the char value.
				var charValue = (new Uint8Array(dataArrayBuffer.slice(bytesReaded, bytesReaded+1)))[0]; bytesReaded += 1;

				//if(dataKey === 'heightReference') {
				//	charValue = HeightReference.getValueByOrdinal(charValue);
				//}

				// Put the readed data into externInfo.***
				externInfo[dataKey] = charValue;
			}
			else if (endMark === 3) // the next data is short type data.***
			{
				// read the short value.
				var shortValue = (new Uint16Array(dataArrayBuffer.slice(bytesReaded, bytesReaded+2)))[0]; bytesReaded += 2;
				// Put the readed data into externInfo.***
				externInfo[dataKey] = shortValue;
			}
			else if (endMark === 4) // the next data is int type data.***
			{
				// read the int value.
				var intValue = (new Uint32Array(dataArrayBuffer.slice(bytesReaded, bytesReaded+4)))[0]; bytesReaded += 4;
				// Put the readed data into externInfo.***
				externInfo[dataKey] = intValue;
			}
			else if (endMark === 5) // the next data is string type data.***
			{
				// read the string value.
				var dataValueLength = (new Uint16Array(dataArrayBuffer.slice(bytesReaded, bytesReaded+2)))[0]; bytesReaded += 2;
				var charArray = new Uint8Array(dataArrayBuffer.slice(bytesReaded, bytesReaded+ dataValueLength)); bytesReaded += dataValueLength;
				//var dataValue = enc.decode(new Int8Array(dataArrayBuffer.slice(bytesReaded, bytesReaded+ dataValueLength))) ;bytesReaded += dataValueLength;
				var decoder = new TextDecoder('utf-8');
				var dataValueUtf8 = decoder.decode(charArray);
				
				// Put the readed data into externInfo.***
				externInfo[dataKey] = dataValueUtf8;
			}
			else if (endMark === 6) // the next data is float type data.***
			{
				// read the float value.
				var floatValue = (new Float32Array(dataArrayBuffer.slice(bytesReaded, bytesReaded+4)))[0]; bytesReaded += 4;
				// Put the readed data into externInfo.***
				externInfo[dataKey] = floatValue;
			}
			
			endMark = (new Int8Array(dataArrayBuffer.slice(bytesReaded, bytesReaded+1)))[0]; bytesReaded += 1;
		}

		if (externInfo.heightReference) 
		{
			var charValue = externInfo.heightReference;
			charValue = HeightReference.getValueByOrdinal(charValue);
			externInfo.heightReference = charValue;
		}

		if (!attributes.isReference) 
		{
			var lodBuilding = neoBuilding.getOrNewLodBuilding(lodString);
			var lowLodMesh = neoBuilding.getOrNewLodMesh(lodName);
			
			lowLodMesh.fileLoadState = CODE.fileLoadState.LOADING_FINISHED;
			lowLodMesh.dataArrayBuffer = lowLodMeshDataArray;

			if (lodBuilding.texture === undefined)
			{ lodBuilding.texture = new Texture(); }
		
			lodBuilding.texture.imageBinaryData = lodBuildingTextureData;
			lodBuilding.texture.fileLoadState = CODE.fileLoadState.LOADING_FINISHED;

			node.data.geographicCoord = geoCoord;
			node.data.rotationsDegree = eulerAngDeg; 
			node.data.dataId = dataId;
			node.data.dataGroupId = savedProjectId;

			node.data.smartTileOwner = this;
			for (var j in externInfo) 
			{
				if (externInfo.hasOwnProperty(j)) 
				{
					node.data.attributes[j] = externInfo[j];
				}
			}

			if (attributes.heightReference === HeightReference.RELATIVE_TO_GROUND) 
			{
				node.data.relativeHeight = geoCoord.altitude;
			}
			else 
			{
				node.data.relativeHeight = 0;
			}

			// HeightReference.CLAMP_TO_GROUND;
			this.nodesArray.push(node);
		}
		else 
		{
			var lon = geoCoord.longitude;
			var lat = geoCoord.latitude;
			var alt = geoCoord.altitude;
			magoManager.instantiateStaticModel({
				projectId       : savedProjectId,
				instanceId      : buildingId,
				longitude       : lon,
				latitude        : lat,
				height          : alt,
				heading         : eulerAngDeg.z,
				pitch           : eulerAngDeg.x,
				roll            : eulerAngDeg.y,
				heightReference : HeightReference.CLAMP_TO_GROUND
			});

			var intantiatedNode = hierarchyManager.getNodeByDataKey(savedProjectId, buildingId);

			intantiatedNode.data.dataId = dataId;
			intantiatedNode.data.dataGroupId = savedProjectId;
			intantiatedNode.data.projectFolderName = projectFolderName;
			for (var j in externInfo) 
			{
				if (externInfo.hasOwnProperty(j)) 
				{
					intantiatedNode.attributes.data[j] = externInfo[j];
				}
			}
			this.nodesArray.push(intantiatedNode);
		}
	}
	magoManager.emit(MagoManager.EVENT_TYPE.SMARTTILELOADEND, {
		tile      : this,  
		timestamp : new Date()
	});
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

SmartTile.selectTileIndices = function(depth, longitude, latitude, resultTileIndices) 
{
	var xMin = -180.0;
	var yMin = 90.0;
	var angRange = SmartTile.selectTileAngleRangeByDepth(depth);
	
	var xIndex = Math.floor((longitude - xMin)/angRange);
	var yIndex = Math.floor((yMin - latitude)/angRange);

	if (resultTileIndices === undefined)
	{
		resultTileIndices = {};
	}

	resultTileIndices.L = depth;
	resultTileIndices.X = xIndex;
	resultTileIndices.Y = yIndex;

	return resultTileIndices;
};

SmartTile.selectTileIndicesArray = function(depth, minLon, minLat, maxLon, maxLat, resultTileIndicesArray) 
{
	// Given a geographic rectangle (minLon, minLat, maxLon, maxLat) & a depth, this function returns all
	// tilesIndices intersected by the rectangle for the specific depth.**
	var leftDownTileName = SmartTile.selectTileIndices(depth, minLon, minLat, undefined);
	var rightDownTileName = SmartTile.selectTileIndices(depth, maxLon, minLat, undefined);
	var rightUpTileName = SmartTile.selectTileIndices(depth, maxLon, maxLat, undefined);
	//var leftUpTileName = SmartTile.selectTileIndices(depth, minLon, maxLat, undefined);

	var minX = leftDownTileName.X;
	var maxX = rightDownTileName.X;
	var maxY = leftDownTileName.Y; // origin is left-up.
	var minY = rightUpTileName.Y;

	if (!resultTileIndicesArray)
	{
		resultTileIndicesArray = [];
	}

	for (var x = minX; x <= maxX; x++)
	{
		for (var y = minY; y <= maxY; y++)
		{
			var tileIndices = {
				L : depth, X : x, Y : y
			};

			resultTileIndicesArray.push(tileIndices);
		}
	}

	return resultTileIndicesArray;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param frustum 변수
 */
SmartTile.getParentTileOfTileLXY = function(L, X, Y, resultParent, imageryType) 
{
	if (!resultParent)
	{
		resultParent = {L : 0, 
			X : 0, 
			Y : 0};
	}

	if (imageryType === CODE.imageryType.CRS84)
	{
		resultParent.L = L - 1;
		resultParent.X = Math.floor(X/2);
		resultParent.Y = Math.floor(Y/2);
	}

	return resultParent;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param frustum 변수
 */
SmartTile.getGeographicExtentOfTileLXY = function(L, X, Y, resultGeoExtend, imageryType) 
{
	if (resultGeoExtend === undefined)
	{ resultGeoExtend = new GeographicExtent(); }
	
	if (imageryType === CODE.imageryType.CRS84)
	{
		var angRange = SmartTile.selectTileAngleRangeByDepth(L);
		var minLon = angRange*X - 180.0;
		var maxLon = angRange*(X+1) - 180.0;
		var minLat = 90.0 - angRange*(Y+1);
		var maxLat = 90.0 - angRange*(Y);
		
		resultGeoExtend.setExtent(minLon, minLat, 0, maxLon, maxLat, 0);
		return resultGeoExtend;
	}
	else if (imageryType === CODE.imageryType.WEB_MERCATOR)
	{
		var webMercatorMaxLatRad = 1.4844222297453324; // = 2*Math.atan(Math.pow(Math.E, Math.PI)) - (Math.PI/2);

		// 1rst, must know how many colums & rows there are in depth "L".***
		var numCols = Math.pow(2, L);
		var numRows = numCols;

		// calculate the angles of the tiles.
		var lonAngDegRange = 360.0 / numCols; // the longitude are lineal.***
		var latAngDegRange;

		// In depth L=0, the latitude range is (-webMercatorMaxLatRad, webMercatorMaxLatRad).***
		var M_PI = Math.PI;
		var M_E = Math.E;
		var maxMercatorY = M_PI;
		var minMercatorY = -M_PI;
		var maxLadRad = webMercatorMaxLatRad;
		var minLadRad = -webMercatorMaxLatRad;
		var midLatRad;
		var midLatRadMercator;
		var y_ratio = ( Y + 0.0005 ) / numRows;
		var currL = 0;
		var finished = false;
		while (!finished && currL <= 22)
		{
			if (currL === L)
			{
				var min_longitude = lonAngDegRange * X - 180.0;
				var max_longitude = min_longitude + lonAngDegRange;
				var min_latitude = minLadRad * 180.0 / M_PI;
				var max_latitude = maxLadRad * 180.0 / M_PI;

				resultGeoExtend.setExtent(min_longitude, min_latitude, 0, max_longitude, max_latitude, 0);
				finished = true;
			}
			else
			{
				var midMercatorY = (maxMercatorY + minMercatorY) / 2.0;
				midLatRad = 2.0 * Math.atan(Math.pow(M_E, midMercatorY)) - M_PI / 2.0;
				var midLatRatio = (M_PI - midMercatorY) / (M_PI - (-M_PI));

				// must choice : the up_side of midLatRadMercator, or the down_side.***
				if (midLatRatio > y_ratio)
				{
					// choice the up_side of midLatRadMercator.***
					// maxLatRad no changes.***
					minLadRad = midLatRad;
					minMercatorY = midMercatorY;
				}
				else
				{
					// choice the down_side of midLatRadMercator.***
					maxLadRad = midLatRad;
					maxMercatorY = midMercatorY;
					// minLadRad no changes.***
				}
			}

			// Code to debug.************************************
			//var min_longitude = lonAngDegRange * X - 180.0;
			//var max_longitude = min_longitude + lonAngDegRange;

			//var min_latitude = minLadRad * 180.0 / M_PI;
			//var max_latitude = maxLadRad * 180.0 / M_PI;
			//---------------------------------------------------

			currL++;
		}
		
		return resultGeoExtend;
	}
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