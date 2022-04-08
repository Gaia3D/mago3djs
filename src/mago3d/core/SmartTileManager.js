'use strict';

/**
 * 4분할 타일링 수행 및 타일 객체 보관 객체
 * 인스턴스 생성 시 mother tile 생성
 * @class SmartTileManager
 * @constructor
 * 
 * @exception {Error} Messages.CONSTRUCT_ERROR
 * @see SmartTile
 */
var SmartTileManager = function(options) 
{
	if (!(this instanceof SmartTileManager)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
    
	/**
     * 타일 배열
     * has 2 tiles (Asia side and America side).
     * @type {Array.<SmartTile>}
     */
	this.tilesArray = []; 

	this.magoManager = undefined;
    
	/**
     * mother 타일 생성
     */
	this.createMainTiles();
	
	// objectSeedsMap created to process multiBuildings.
	this.objectSeedsMap;
	
	this.maxDepth = 17;

	// Vars to control parse-workers.
	this.parsedSmartTileMap = {};

	// Optional vars.
	

	if (options)
	{
		if (options.magoManager)
		{ this.magoManager = options.magoManager; }
	}
};

/**
 * Returns the depth of smartTile that corresponds by bbox size.
 */
SmartTileManager.getDepthByBoundingBoxMaxSize = function(bboxMaxLength) 
{
	if (bboxMaxLength === undefined)
	{ return undefined; }
	
	var smartTileDepth;

	if (bboxMaxLength < 5.0)
	{
		smartTileDepth = 18;
	}
	else if (bboxMaxLength >= 5.0 && bboxMaxLength < 10.0)
	{
		smartTileDepth = 17;
	}
	else if (bboxMaxLength >= 10.0 && bboxMaxLength < 30.0)
	{
		smartTileDepth = 16;
	}
	else if (bboxMaxLength >= 30.0 && bboxMaxLength < 50.0)
	{
		smartTileDepth = 15;
	}
	else if (bboxMaxLength >= 50.0 && bboxMaxLength < 100.0)
	{
		smartTileDepth = 14;
	}
	else if (bboxMaxLength >= 100.0 && bboxMaxLength < 200.0)
	{
		smartTileDepth = 13;
	}
	else if (bboxMaxLength >= 200.0 && bboxMaxLength < 400.0)
	{
		smartTileDepth = 12;
	}
	else if (bboxMaxLength >= 400.0 && bboxMaxLength < 800.0)
	{
		smartTileDepth = 11;
	}
	else if (bboxMaxLength >= 800.0 && bboxMaxLength < 1600.0)
	{
		smartTileDepth = 10;
	}
	else if (bboxMaxLength >= 1600.0 && bboxMaxLength < 3200.0)
	{
		smartTileDepth = 9;
	}
	else if (bboxMaxLength >= 3200.0 && bboxMaxLength < 6400.0)
	{
		smartTileDepth = 8;
	}
	else if (bboxMaxLength >= 6400.0 && bboxMaxLength < 12800.0)
	{
		smartTileDepth = 7;
	}
	else if (bboxMaxLength >= 12800.0)
	{
		smartTileDepth = 6;
	}

	// Debug test.***
	if (smartTileDepth >10)
	{ smartTileDepth = 10; }
	
	return smartTileDepth;
};

/**
 * Returns the max distance that is visible a smartTile by his depth.
 */
SmartTileManager.maxDistToCameraByDepth = function(depth) 
{
	if (depth < 13)
	{
		return 10000;
	}
	else if (depth === 13)
	{
		return 9000;
	}
	else if (depth === 14)
	{
		return 4000;
	}
	else if (depth === 15)
	{
		return 2000;
	}
	else if (depth === 16)
	{
		return 1000;
	}
	else if (depth === 17)
	{
		return 500;
	}
	else if (depth === 18)
	{
		return 150;
	}
	else if (depth > 18)
	{
		return 100;
	}

	/*
	// ORIGINAL.
	if (depth < 13)
	{
		return 10000;
	}
	else if (depth === 13)
	{
		return 9000;
	}
	else if (depth === 14)
	{
		return 4000;
	}
	else if (depth === 15)
	{
		return 2000;
	}
	else if (depth === 16)
	{
		return 1500;
	}
	else if (depth === 17)
	{
		return 1000;
	}
	else if (depth === 18)
	{
		return 250;
	}
	else if (depth > 18)
	{
		return 150;
	}
	*/
	
	return 10;
};

SmartTileManager.prototype.removeSmartTileF4dSeed = function (projectFolderName, L, X, Y) 
{
	// search in smartTiles
	var tileFullPath = [];
	tileFullPath[L] = {
		X,
		Y
	};
	tileFullPath = SmartTile.getTileFullPath_fromLXY(L, X, Y, tileFullPath);
	if (this.tilesArray)
	{
		var tilesCount = this.tilesArray.length; // allways tilesCount = 2. (Asia & America sides).
		for (var i=0; i<tilesCount; i++)
		{
			var tile = this.tilesArray[i].getTileByTileFullPath(tileFullPath);

			if (tile)
			{
				var smartTileF4dSeedArray = tile.smartTileF4dSeedArray;
				if (!smartTileF4dSeedArray) { continue; }
				
				var seedsCount = smartTileF4dSeedArray.length;
				for ( var j=0; j<seedsCount; j++)
				{
					var seed = smartTileF4dSeedArray[j];
					if (seed.projectFolderName === projectFolderName)
					{
						smartTileF4dSeedArray.splice(j, 1);
						break;
					}
				}
				break;
			}
		}
	}
};

/**
 * 아메리카쪽 아시아쪽으로 구분하여 두개의 mother 타일 생성
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
	tile1.X = 0; 
	tile1.Y = 0; 
	tile1.minGeographicCoord.setLonLatAlt(-180, -90, 0);
	tile1.maxGeographicCoord.setLonLatAlt(0, 90, 0);
	
	// Asia side.
	var tile2 = this.newSmartTile("AsiaSide");
	if (tile2.minGeographicCoord === undefined)
	{ tile2.minGeographicCoord = new GeographicCoord(); }
	if (tile2.maxGeographicCoord === undefined)
	{ tile2.maxGeographicCoord = new GeographicCoord(); }
	
	tile2.depth = 0; // mother tile.
	tile2.X = 1; // Asia side tile X coord = 1.***
	tile2.Y = 0; 
	tile2.minGeographicCoord.setLonLatAlt(0, -90, 0);
	tile2.maxGeographicCoord.setLonLatAlt(180, 90, 0);
};

SmartTileManager.prototype.removeSmartTileF4dSeed = function (projectFolderName, L, X, Y) 
{
	// search in smartTiles
	var tileFullPath = [];
	tileFullPath[L] = {X, Y};
	tileFullPath = SmartTile.getTileFullPath_fromLXY(L, X, Y, tileFullPath);
	if (this.tilesArray)
	{
		var tilesCount = this.tilesArray.length; // allways tilesCount = 2. (Asia & America sides).
		for (var i=0; i<tilesCount; i++)
		{
			var tile = this.tilesArray[i].getTileByTileFullPath(tileFullPath);

			if (tile)
			{
				var smartTileF4dSeedArray = tile.smartTileF4dSeedArray;
				var seedsCount = smartTileF4dSeedArray.length;
				for ( var j=0; j<seedsCount; j++)
				{
					var seed = smartTileF4dSeedArray[j];
					if (seed.projectFolderName === projectFolderName)
					{
						smartTileF4dSeedArray.splice(j, 1);
						break;
					}
				}
				break;
			}
		}
	}
};

/**
 */
SmartTileManager.prototype.parseSmartTilesF4dIndexFile = function (dataBuffer, projectFolderName, magoManager) 
{
	var bytes_readed = 0;
	var readWriter = magoManager.readerWriter;
	
	if (this.smartTileF4dSeedMap === undefined)
	{ this.smartTileF4dSeedMap = {}; }

	var smartTilesMBCount = readWriter.readInt32(dataBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
	for (var i=0; i<smartTilesMBCount; i++)
	{
		var nameLength = readWriter.readInt16(dataBuffer, bytes_readed, bytes_readed+2); bytes_readed += 2;
		var name = "";
		for (var j=0; j<nameLength; j++)
		{
			name += String.fromCharCode(new Int8Array(dataBuffer.slice(bytes_readed, bytes_readed+ 1))[0]);bytes_readed += 1;
		}
		var seedName = projectFolderName + '::' + name;
		var L = readWriter.readUInt8(dataBuffer, bytes_readed, bytes_readed+1); bytes_readed += 1;
		var X = readWriter.readInt32(dataBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
		var Y = readWriter.readInt32(dataBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
		var smartTileType = readWriter.readUInt8(dataBuffer, bytes_readed, bytes_readed+1); bytes_readed += 1;
		
		// Now read bbox.
		//var bbox = new BoundingBox();
		//bytes_readed = bbox.readData(dataBuffer, bytes_readed);
		
		var geoExtent = SmartTile.getGeographicExtentOfTileLXY(L, X, Y, undefined, CODE.imageryType.CRS84);
		var centerGeoCoord = geoExtent.getMidPoint();
		var f4dTileId = "";

		//var smartTileLodsCount = 3;
		this.smartTileF4dSeedMap[seedName] = {
			"L"                 : L,
			"X"                 : X,
			"Y"                 : Y,
			"geographicCoord"   : centerGeoCoord,
			"objectType"        : "F4dTile",
			"id"                : f4dTileId,
			"smartTileType"     : smartTileType,
			"tileName"          : name,
			"projectFolderName" : projectFolderName,
			"fileLoadState"     : CODE.fileLoadState.READY
		};
	}
	
	return this.smartTileF4dSeedMap;
};

/**
 */
SmartTileManager.prototype.parseSmartTilesF4dIndexFileAndDeleteSmartTileF4dSeed = function (dataBuffer, projectFolderName, magoManager) 
{
	 var bytes_readed = 0;
	 var readWriter = magoManager.readerWriter;

	 var smartTilesMBCount = readWriter.readInt32(dataBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
	 for (var i=0; i<smartTilesMBCount; i++)
	 {
		 var nameLength = readWriter.readInt16(dataBuffer, bytes_readed, bytes_readed+2); bytes_readed += 2;
		 var name = "";
		 for (var j=0; j<nameLength; j++)
		 {
			 name += String.fromCharCode(new Int8Array(dataBuffer.slice(bytes_readed, bytes_readed+ 1))[0]);bytes_readed += 1;
		 }
		 var L = readWriter.readUInt8(dataBuffer, bytes_readed, bytes_readed+1); bytes_readed += 1;
		 var X = readWriter.readInt32(dataBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
		 var Y = readWriter.readInt32(dataBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
		 var smartTileType = readWriter.readUInt8(dataBuffer, bytes_readed, bytes_readed+1); bytes_readed += 1;
		 
		 this.removeSmartTileF4dSeed(projectFolderName, L, X, Y);
	 }
};

/**
 * f4d들의 object index 파일을 읽고 생성한 물리적인 노드들을 타일에 배치.
 * @param {Number} targetDepth 없을 시 17, 일반적으로 17레벨까지 생성.
 * @param {Array.<Node>} physicalNodesArray geometry정보가 있는 화면에 표출할 수 있는 Node 배열
 * @param {MagoManager} magoManager 마고매니저.
 * 
 * @see Node
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
	targetDepth = defaultValue(targetDepth, this.maxDepth);
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
 */
SmartTileManager.prototype.putObject = function(targetDepth, object, magoManager) 
{
	targetDepth = defaultValue(targetDepth, this.maxDepth);
	if (this.tilesArray !== undefined)
	{
		var tilesCount = this.tilesArray.length; // allways tilesCount = 2. (Asia & America sides).
		for (var i=0; i<tilesCount; i++)
		{
			this.tilesArray[i].putObject(targetDepth, object, magoManager);
		}
	}
};

/**
 * 어떤 일을 하고 있습니까?
 */
SmartTileManager.prototype.getSphereIntersectedTiles = function(sphere, resultIntersectedTilesArray, maxDepth) 
{
	if (maxDepth === undefined)
	{ maxDepth = this.maxDepth; }
	
	if (this.tilesArray !== undefined)
	{
		var tilesCount = this.tilesArray.length; // allways tilesCount = 2. (Asia & America sides).
		for (var i=0; i<tilesCount; i++)
		{
			this.tilesArray[i].getSphereIntersectedTiles(sphere, resultIntersectedTilesArray, maxDepth);
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
 * 새로운 스마트타일을 생성하여 tilesArray에 넣고 반환.
 * @param {String} smartTileName tile name\
 * @returns {SmartTile}
 */
SmartTileManager.prototype.newSmartTile = function(smartTileName) 
{
	if (this.tilesArray === undefined)
	{ this.tilesArray = []; }
	
	var options = {
		smartTileManager: this
	};
	var smartTile = new SmartTile(smartTileName, options);
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

SmartTileManager.prototype.doPendentProcess = function(magoManager) 
{
	// This function does pendent process.
	if (this.objectSeedsMap !== undefined)
	{
		var hierarchyManager = magoManager.hierarchyManager;
		var tilesCount = this.tilesArray.length; // allways tilesCount = 2. (Asia & America sides).
		for (var key in this.objectSeedsMap)
		{
			if (Object.prototype.hasOwnProperty.call(this.objectSeedsMap, key))
			{
				var objectSeed = this.objectSeedsMap[key];
				var targetDepth = objectSeed.L;
				var projectId = objectSeed.objectType;
				var nodesMap = hierarchyManager.getNodesMap(projectId, undefined);

				var multiBuildingId = objectSeed.id;
				if (multiBuildingId === "")
				{
					// Assign a default id.
					var existNodesCount = Object.keys(nodesMap).length; 
					multiBuildingId = objectSeed.objectType + "_" + existNodesCount;
				}

				var node = magoManager.hierarchyManager.newNode(multiBuildingId, projectId, undefined);

				// Now, create the basic node data.
				node.data.attributes = {objectType: "multiBuildingsTile"};
				node.data.geographicCoord = objectSeed.geographicCoord;
				node.data.bbox = objectSeed.boundingBox;
				node.data.projectFolderName = objectSeed.projectFolderName;
				node.data.multiBuildingsFolderName = objectSeed.multiBuildingsFolderName;

				for (var i=0; i<tilesCount; i++)
				{
					//this.tilesArray[i].putObjectSeed(targetDepth, objectSeed, magoManager);
					this.tilesArray[i].putNode(targetDepth, node, magoManager);
				}
			}
		}

		// finally clear the this.objectSeedsMap.
		this.objectSeedsMap = undefined;
	}

	if (this.smartTileF4dSeedMap !== undefined)
	{
		var tilesCount = this.tilesArray.length; // allways tilesCount = 2. (Asia & America sides).

		// insert into smartTiles the smartTileF4d.***
		for (var key in this.smartTileF4dSeedMap)
		{
			if (Object.prototype.hasOwnProperty.call(this.smartTileF4dSeedMap, key))
			{
				var smartTileF4dSeed = this.smartTileF4dSeedMap[key];
				var targetDepth = smartTileF4dSeed.L;
				for (var i=0; i<tilesCount; i++)
				{
					this.tilesArray[i].putSmartTileF4dSeed(targetDepth, smartTileF4dSeed, magoManager);
				}
			}
		}

		this.smartTileF4dSeedMap = undefined;
	}
};