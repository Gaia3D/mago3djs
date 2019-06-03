'use strict';

/**
 * 4분할 타일링 수행 및 타일 객체 보관 객체
 * 인스턴스 생성 시 mother tile 생성
 * @class SmartTileManager
 * 
 * @exception {Error} Messages.CONSTRUCT_ERROR
 * @see SmartTile
 */
var SmartTileManager = function() 
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
    
	/**
     * mother 타일 생성
     */
	this.createMainTiles();
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
	targetDepth = defaultValue(targetDepth, 17);
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
 * 새로운 스마트타일을 생성하여 tilesArray에 넣고 반환.
 * @param {String} smartTileName tile name\
 * @return {SmartTile}
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