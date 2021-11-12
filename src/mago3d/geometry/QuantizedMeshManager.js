'use strict';

/**
 * QuantizedMeshManager
 * @class QuantizedMeshManager
 * 
 */
var QuantizedMeshManager = function(magoManager) 
{
	if (!(this instanceof QuantizedMeshManager)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this.magoManager = magoManager;
	this.excavatedQuantizedMeshMap = {};
	this.excavationSetsArray = [];

	this.quantizedMeshExcavationSet;
	this.workerQuantizedMeshExcavation;
	this._status = false;
	this.excavatedTilesMap = {};
};

Object.defineProperties(QuantizedMeshManager.prototype, {
	status: {
		get : function() { return this._status; },
		set : function(status) 
		{
			this._status = status;
		}
	}
});

function isNumber(n) { return !isNaN(parseFloat(n)) && !isNaN(n - 0); }

QuantizedMeshManager.prototype.newExcavationSet = function (excavationGeoCoords, excavationAltitude)
{
	// Check the type of the geoCoords.***
	// take one geoCoord.***
	var geoCoord = excavationGeoCoords[0];
	if (isNumber(geoCoord))
	{
		// convert number array to geographicCoords array.***
		var geoCoordsAux = excavationGeoCoords;
		excavationGeoCoords = [];
		var coordsCount = geoCoordsAux.length/2;
		for (var i=0; i<coordsCount; i++)
		{
			var lon = geoCoordsAux[i*2];
			var lat = geoCoordsAux[i*2+1];
			var geoCoord = new GeographicCoord(lon, lat, 0.0);
			excavationGeoCoords.push(geoCoord);
		}
	}
	else if (Array.isArray(geoCoord))
	{
		var geoCoordsAux = excavationGeoCoords;
		excavationGeoCoords = [];
		var coordsCount = geoCoordsAux.length;
		for (var i=0; i<coordsCount; i++)
		{
			var lon = geoCoordsAux[i][0];
			var lat = geoCoordsAux[i][1];
			var geoCoord = new GeographicCoord(lon, lat, 0.0);
			excavationGeoCoords.push(geoCoord);
		}
	}

	var excavationSet = new QuantizedMeshExcavationSet(this, excavationGeoCoords, excavationAltitude);
	this.excavationSetsArray.push(excavationSet);
	return excavationSet;
};

QuantizedMeshManager.prototype.setQuantizedMeshExcavationSet = function(geoCoordsArray, excavationAltitude) 
{
	this.quantizedMeshExcavationSet = new QuantizedMeshExcavationSet(this, geoCoordsArray, excavationAltitude);
};

QuantizedMeshManager.prototype.excavate = function() 
{
	var terrainProvider = this.magoManager.scene.terrainProvider;

	if (!(terrainProvider instanceof Cesium.EditableCesiumTerrainProvider)) { return false; }
	if (!terrainProvider.target) { return false; }

	//this.excavating = false;

	var tilesMap = terrainProvider.target.tilesMap;
	//terrainProvider.target = undefined;
	this.testAndReproductionTerrain(tilesMap);
};

QuantizedMeshManager.prototype.applyQuantizedMeshExcavation = function()
{
	var scene = this.magoManager.scene;
	var terrainProvider = scene.terrainProvider;
	if (terrainProvider instanceof Cesium.EditableCesiumTerrainProvider) 
	{
		var tilesMap = this.quantizedMeshExcavationSet.getIntersectedTiles();
		var excavationAltitude = this.quantizedMeshExcavationSet.excavationAltitude;

		var excavationGeoCoords = this.quantizedMeshExcavationSet.geoCoordsArray.reduce(function(accum, item)
		{
			accum.push(item.longitude);
			accum.push(item.latitude); 
			return accum;
		}, []);

		terrainProvider.target = {
			tilesMap,
			excavationAltitude,
			excavationGeoCoords
		};

		this.status = true;

		//this.testAndReproductionTerrain(tilesMap);
	}
};

QuantizedMeshManager.prototype.stopQuantizedMeshExcavation = function()
{
	var terrainProvider = this.magoManager.scene.terrainProvider;

	if (!(terrainProvider instanceof Cesium.EditableCesiumTerrainProvider)) { return false; }
	if (!terrainProvider.target) { return false; }

	//this.excavating = false;

	var tilesMap = terrainProvider.target.tilesMap;
	terrainProvider.target = undefined;
	this.testAndReproductionTerrain(tilesMap);
};

function test_doExcavateTile(tile, tilesMap, excavatedTilesMap, scene)
{
	// 1rst, check if tile is candidate.***
	//내 자신이 대상지역인지 체크, 아닐시 패스
	

	if (!targetCheck(tilesMap, tile)) 
	{
		return 0;
	}

	if (targetCheck(excavatedTilesMap, tile)) 
	{
		return 1;
	}

	// Now, check parendet.***
	var parent = tile.parent;
	if (tile.level === 13 || test_doExcavateTile(parent, tilesMap, excavatedTilesMap, scene))
	{
		// My parent is total ready, so excavete me if necesary.***
		// Excavate tile.***
		// ...

		initializeGlobeSurfaceTile(tile, scene);
		
		if (!excavatedTilesMap[tile.level]) 
		{
			excavatedTilesMap[tile.level] = {};
		}

		if (!excavatedTilesMap[tile.level][tile.x]) 
		{
			excavatedTilesMap[tile.level][tile.x] = [];
		}

		if (excavatedTilesMap[tile.level][tile.x].indexOf(tile.y) < 0) 
		{
			excavatedTilesMap[tile.level][tile.x].push(tile.y);
		}
			
		return 2;
	}

	return 0;
}

QuantizedMeshManager.prototype.testAndReproductionTerrain = function(tilesMap) 
{
	var scene = this.magoManager.scene;
	var globe = scene.globe;
	var surface = globe._surface;
	var index = 0;
	var tilesRendered = surface._tilesToRender;
	for (var i = 0, len = tilesRendered.length; i < len; ++i) 
	{

		if (index > 10) { break; }
		var tile = tilesRendered[i];
		var asdf = test_doExcavateTile(tile, tilesMap, this.excavatedTilesMap, scene);
		if (asdf === 2) 
		{ 
			console.info(tile.x, tile.y, tile.level);
			index++; 
		} else if( asdf === 1) {

		} else if( asdf === 0) {
			continue;
		}

		/* //내 자신이 대상지역인지 체크, 아닐시 패스
		if (!targetCheck(tilesMap, tile)) 
		{
			continue;
		}

		//내 자신이 캐싱되었는지 체크, 되었을 경우 패스
		if (targetCheck(this.excavatedTilesMap, tile)) 
		{
			continue;
		}

		var parent = tile.parent;
		if (targetCheck(this.excavatedTilesMap, parent)) 
		{

		} else {

		}
		
		if (!targetCheck(this.excavatedTilesMap, parent)) { continue; }
		if (testAndReproductionTerrain(tile, tilesMap, scene)) 
		{
			if (!this.excavatedTilesMap[tile.level]) 
			{
				this.excavatedTilesMap[tile.level] = {};
			}

			if (!this.excavatedTilesMap[tile.level][tile.x]) 
			{
				this.excavatedTilesMap[tile.level][tile.x] = [];
			}

			if (this.excavatedTilesMap[tile.level][tile.x].indexOf(tile.y) < 0) 
			{
				this.excavatedTilesMap[tile.level][tile.x].push(tile.y);
			}
			index ++ ;
		} */
	}
	/* surface.forEachRenderedTile((tile)=>
	{
		if (index > 10) { return; }
		if (targetCheck(this.excavatedTilesMap, tile)) 
		{
			return;
		}

		if (testAndReproductionTerrain(tile, tilesMap, scene)) 
		{
			if (!this.excavatedTilesMap[tile.level]) 
			{
				this.excavatedTilesMap[tile.level] = {};
			}

			if (!this.excavatedTilesMap[tile.level][tile.x]) 
			{
				this.excavatedTilesMap[tile.level][tile.x] = [];
			}

			if (this.excavatedTilesMap[tile.level][tile.x].indexOf(tile.y) < 0) 
			{
				this.excavatedTilesMap[tile.level][tile.x].push(tile.y);
			}
			index ++ ;
		}

		/* while (test) 
		{
			tile = tile.parent;
			if (!tile) 
			{
				test = false;
				break;
			}
			if (targetCheck(this.excavatedTilesMap, tile)) 
			{
				continue;
			}

			test = testAndReproductionTerrain(tile, tilesMap, scene);
			if (test) 
			{
				if (!this.excavatedTilesMap[tile.level]) 
				{
					this.excavatedTilesMap[tile.level] = {};
				}

				if (!this.excavatedTilesMap[tile.level][tile.x]) 
				{
					this.excavatedTilesMap[tile.level][tile.x] = [];
				}

				if (this.excavatedTilesMap[tile.level][tile.x].indexOf(tile.y) < 0) 
				{
					this.excavatedTilesMap[tile.level][tile.x].push(tile.y);
				}
			}
		} 
	}); */
};

function reproductionTerrain(tileForTest, refTilesMap, scene) 
{
	var test = targetCheck(refTilesMap, tileForTest);
	if (test) 
	{
		initializeGlobeSurfaceTile(tileForTest, scene);
	}

	return test;
};

function testAndReproductionTerrain(tileForTest, refTilesMap, scene) 
{
	var test = targetCheck(refTilesMap, tileForTest);
	if (test) 
	{
		initializeGlobeSurfaceTile(tileForTest, scene);
	}

	return test;
};
function initializeGlobeSurfaceTile (globeSurfaceTile, scene) 
{
	globeSurfaceTile.data = undefined;
	globeSurfaceTile.state = Cesium.QuadtreeTileLoadState.START;

	var globe = scene.globe;
	var tileProvider = globe._surface.tileProvider;

	Cesium.GlobeSurfaceTile.initialize(globeSurfaceTile, scene.terrainProvider, tileProvider._imageryLayers);
}
function targetCheck(ref, tile) 
{
	var x = tile.x;
	var y = tile.y;
	var level = tile.level;
	return ref[level] && ref[level][x] && ref[level][x].indexOf(y) > -1;
};


QuantizedMeshManager.prototype.doExcavationPromise = function (qMesh, excavationGeoCoords, excavationAltitude)
{
	var X = qMesh.tileIndices.X;
	var Y = qMesh.tileIndices.Y;
	var L = qMesh.tileIndices.L;

	// Now, min & max geographic coords.***
	var imageryType = CODE.imageryType.CRS84;
	var geoExtent = SmartTile.getGeographicExtentOfTileLXY(L, X, Y, undefined, imageryType);
	
	var minLon = geoExtent.minGeographicCoord.longitude;
	var minLat = geoExtent.minGeographicCoord.latitude;
	var maxLon = geoExtent.maxGeographicCoord.longitude;
	var maxLat = geoExtent.maxGeographicCoord.latitude;
	
	var data = {
		info             : {X: X, Y: Y, L: L},
		uValues          : qMesh._uValues,
		vValues          : qMesh._vValues,
		hValues          : qMesh._heightValues,
		indices          : qMesh._indices,
		minHeight        : qMesh._minimumHeight,
		maxHeight        : qMesh._maximumHeight,
		southIndices     : qMesh._southIndices,
		eastIndices      : qMesh._eastIndices,
		northIndices     : qMesh._northIndices,
		westIndices      : qMesh._westIndices,
		southSkirtHeight : qMesh._southSkirtHeight,
		eastSkirtHeight  : qMesh._eastSkirtHeight,
		northSkirtHeight : qMesh._northSkirtHeight,
		westSkirtHeight  : qMesh._westSkirtHeight,
		boundingSphere   : {
			center : qMesh._boundingSphere.center,
			radius : qMesh._boundingSphere.radius
		},
		horizonOcclusionPoint : qMesh._horizonOcclusionPoint,
		geoExtent             : {
			minLongitude : minLon,
			minLatitude  : minLat,
			maxLongitude : maxLon,
			maxLatitude  : maxLat
		},
		excavationGeoCoords : excavationGeoCoords,
		excavationAltitude  : excavationAltitude
	};

	if (!this.workerQuantizedMeshExcavation) 
	{
		this.workerQuantizedMeshExcavation = new PromiseWorker(createWorker(this.magoManager.config.scriptRootPath + 'Worker/workerQuantizedMeshExcavationPromise.js'));
	}
	var magoManager = this.magoManager;
	//this.workerQuantizedMeshExcavation.postMessage(data, [data.uValues]); // send to worker by reference (transfer).
	return this.workerQuantizedMeshExcavation.postMessage(data).then(function(e) 
	{
		var result = e.result;
		var info = e.info;
		var provider = magoManager.scene.terrainProvider;
		var rectangle = provider._tilingScheme.tileXYToRectangle(info.X, info.Y, info.L);
		var orientedBoundingBox = Cesium.OrientedBoundingBox.fromRectangle(
			rectangle,
			result.minHeight,
			result.maxHeight,
			provider._tilingScheme.ellipsoid
		);
		for (var i=0;i<9;i++) 
		{
			orientedBoundingBox.halfAxes[i] = orientedBoundingBox.halfAxes[i] * 3;
		}
		return new Cesium.QuantizedMeshTerrainData({
			minimumHeight         : result.minHeight,
			maximumHeight         : result.maxHeight,
			quantizedVertices     : result.uvhValues,
			indices               : result.indices,
			boundingSphere        : result.boundingSphere,
			orientedBoundingBox   : orientedBoundingBox,
			horizonOcclusionPoint : result.horizonOcclusionPoint,
			westIndices           : result.westIndices,
			southIndices          : result.southIndices,
			eastIndices           : result.eastIndices,
			northIndices          : result.northIndices,
			westSkirtHeight       : result.westSkirtHeight,
			southSkirtHeight      : result.southSkirtHeight,
			eastSkirtHeight       : result.eastSkirtHeight,
			northSkirtHeight      : result.northSkirtHeight
		});
	});
};

QuantizedMeshManager.prototype.doExcavation = function (qMesh, excavationGeoCoords, excavationAltitude)
{
	// test worker calling another worker.***
	var magoManager = this.magoManager;
	if (!this.workerQuantizedMeshExcavation)
	{
		var qMeshManager = this;
		this.workerQuantizedMeshExcavation = createWorker(magoManager.config.scriptRootPath + 'Worker/workerQuantizedMeshExcavation.js');
		this.workerQuantizedMeshExcavation.onmessage = function(e)
		{
			var tileInfo = e.data.info;
			var result = e.data.result;
			var excavatedQuantizedMeshMap = qMeshManager.excavatedQuantizedMeshMap;
			var Z = tileInfo.L;
			var X = tileInfo.X;
			var Y = tileInfo.Y;
			if (!excavatedQuantizedMeshMap[Z]) { excavatedQuantizedMeshMap[Z] = {}; }
			if (!excavatedQuantizedMeshMap[Z][X]) { excavatedQuantizedMeshMap[Z][X] = {}; }
			excavatedQuantizedMeshMap[Z][X][Y] = result;
		};
	}

	var X = qMesh.tileIndices.X;
	var Y = qMesh.tileIndices.Y;
	var L = qMesh.tileIndices.L;

	// Now, min & max geographic coords.***
	var imageryType = CODE.imageryType.CRS84;
	var tileIndices = qMesh.tileIndices;
	var geoExtent = SmartTile.getGeographicExtentOfTileLXY(L, X, Y, undefined, imageryType);

	var data = {
		info             : {X: X, Y: Y, L: L},
		uValues          : qMesh._uValues,
		vValues          : qMesh._vValues,
		hValues          : qMesh._heightValues,
		indices          : qMesh._indices,
		minHeight        : qMesh._minimumHeight,
		maxHeight        : qMesh._maximumHeight,
		southIndices     : qMesh._southIndices,
		eastIndices      : qMesh._eastIndices,
		northIndices     : qMesh._northIndices,
		westIndices      : qMesh._westIndices,
		southSkirtHeight : qMesh._southSkirtHeight,
		eastSkirtHeight  : qMesh._eastSkirtHeight,
		northSkirtHeight : qMesh._northSkirtHeight,
		westSkirtHeight  : qMesh._westSkirtHeight,
		boundingSphere   : {
			center : qMesh._boundingSphere.center,
			radius : qMesh._boundingSphere.radius
		},
		horizonOcclusionPoint : qMesh._horizonOcclusionPoint,
		geoExtent             : {
			minLongitude : geoExtent.minGeographicCoord.longitude,
			minLatitude  : geoExtent.minGeographicCoord.latitude,
			maxLongitude : geoExtent.maxGeographicCoord.longitude,
			maxLatitude  : geoExtent.maxGeographicCoord.latitude
		},
		excavationGeoCoords : excavationGeoCoords,
		excavationAltitude  : excavationAltitude
	};

	//this.workerQuantizedMeshExcavation.postMessage(data, [data.uValues]); // send to worker by reference (transfer).
	this.workerQuantizedMeshExcavation.postMessage(data); // send to worker by copy.
	var hola = 0;
};

QuantizedMeshManager.prototype.getExcavatedQuantizedMesh = function (X, Y, Z)
{
	var excavatedQuantizedMeshMap = this.excavatedQuantizedMeshMap;
	if (!excavatedQuantizedMeshMap[Z]) { return; }
	if (!excavatedQuantizedMeshMap[Z][X]) { return; }
	if (!excavatedQuantizedMeshMap[Z][X][Y]) { return; }

	var result = excavatedQuantizedMeshMap[Z][X][Y];

	// Must delete "excavatedQuantizedMeshMap[Z][X][Y]". : TODO :
	return result;
};