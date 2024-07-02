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
	this._status = true;
	this.excavatedTilesMap = {};
	this.tilesMap = {};
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

	/*if (!(terrainProvider instanceof Cesium.EditableCesiumTerrainProvider)) { return false; }*/
	//this.excavating = false;

	//var tilesMap = terrainProvider.target.tilesMap;
	//terrainProvider.target = undefined;
	this.testAndReproductionTerrain();
};

QuantizedMeshManager.prototype.applyQuantizedMeshExcavation = function()
{
	var scene = this.magoManager.scene;
	var terrainProvider = scene.terrainProvider;
	/*if (terrainProvider instanceof Cesium.EditableCesiumTerrainProvider)
	{
		var tilesMap = this.tilesMap = this.quantizedMeshExcavationSet.getIntersectedTiles();
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

		this.excavatedTilesMap = {};
	}*/
};

QuantizedMeshManager.prototype.stopQuantizedMeshExcavation = function()
{
	var terrainProvider = this.magoManager.scene.terrainProvider;

	/*if (!(terrainProvider instanceof Cesium.EditableCesiumTerrainProvider)) { return false; }*/
	if (!terrainProvider.target) { return false; }

	//this.excavating = false;

	//var tilesMap = terrainProvider.target.tilesMap;
	terrainProvider.target = undefined;
	this.excavatedTilesMap = {};
	//this.testAndReproductionTerrain(tilesMap);
};

function test_doExcavateTile(tile, childTile, tilesMap, excavatedTilesMap, scene)
{
	// 1rst, check if tile is candidate.***
	//내 자신이 대상지역인지 체크, 아닐시 패스
	if (!targetCheck(tilesMap, tile)) 
	{
		return false;
	}

	if (targetCheck(excavatedTilesMap, tile)) 
	{
		if (childTile) 
		{
			if (!targetCheck(tilesMap, childTile))
			{
				return false;
			}

			if (targetCheck(excavatedTilesMap, childTile))
			{
				return false;
			}

			initializeGlobeSurfaceTile(childTile, scene);
		
			if (!excavatedTilesMap[childTile.level]) 
			{
				excavatedTilesMap[childTile.level] = {};
			}

			if (!excavatedTilesMap[childTile.level][childTile.x]) 
			{
				excavatedTilesMap[childTile.level][childTile.x] = [];
			}

			if (excavatedTilesMap[childTile.level][childTile.x].indexOf(childTile.y) < 0) 
			{
				excavatedTilesMap[childTile.level][childTile.x].push(childTile.y);
			}
			return true;
		}

		return false;
	}

	// Now, check parendet.***
	var parent = tile.parent;
	var tieLevel = tile.level;
	if (tieLevel === 13 || test_doExcavateTile(parent, tile, tilesMap, excavatedTilesMap, scene))
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
		return true;
	}

	return false;
}

QuantizedMeshManager.prototype.testAndReproductionTerrain = function() 
{
	var scene = this.magoManager.scene;
	var globe = scene.globe;
	var surface = globe._surface;
	var index = 0;
	var tilesRendered = surface._tilesToRender;
	var tilesMap = this.tilesMap;
	for (var i = 0, len = tilesRendered.length; i < len; ++i) 
	{

		if (index > 10) { break; }
		var tile = tilesRendered[i];
		var test = test_doExcavateTile(tile, undefined, tilesMap, this.excavatedTilesMap, scene);
		if (test) 
		{ 
			index++; 
		}
	}
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
	// Use this function instead "doExcavation()".***
	// Actually the "doExcavation()" function is used to test excavation algrithm.***
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

QuantizedMeshManager.prototype.test__doQuantizedSurfaceExcavation = function (magoManager) 
{
	var _this = this;
  
	if (this.qMeshTestFinished) 
	{
		this._renderQMesh(magoManager);
	  return;
	} // Test.*** delete this.*** Test.*** delete this.*** Test.*** delete this.*** Test.*** delete this.*** Test.*** delete this.*** Test.*** 
  
  
	if (!this.requestedTile) 
	{
		// test debug:::
		/*
		15:
			55930: [9737]
		16:
			111861: [19474]
		17:
			223722: [38949]
		18:
			447444: [77898]
		19:
			894889: [155796]
		20:
			1789778: (2) [311592, 311593]
			1789779: (2) [311592, 311593]
		*/

	  var X = 55930; // Kim Ho Jun test excavation tile.***
	  var Y = 9737;
	  var L = 15; 

	  //X = 111861; // Kim Ho Jun test excavation tile.***
	  //Y = 19474;
	  //L = 16; 

	  //X = 447444; // Kim Ho Jun test excavation tile.***
	  //Y = 77898;
	  //L = 18; 

	  //X = 894889; // Kim Ho Jun test excavation tile.***
	  //Y = 155796;
	  //L = 19; 
  
	  var tileIndices = {
			L : L,
			X : X,
			Y : Y
	  };
	  this.requestedTile = true;
	  this.qMeshPromise = magoManager.scene.globe.terrainProvider.requestTileGeometry(X, Y, L);
	  this.qMeshPromise.then(function (value) 
		{
			_this.testQMesh = value;
			_this.testQMesh.tileIndices = {
		  L : L,
		  X : X,
		  Y : Y
			};
	  });
	} // Test debug to do excavation on cesium terrain.***
	// 1rst, check if dem texture is ready.
  
  
	if (!this.quantizedSurfaceTest && this.testQMesh) 
	{
	  // 1rst, calculate the geoExtent of the tile:
	  var imageryType = CODE.imageryType.CRS84;
	  var tileIndices = this.testQMesh.tileIndices;
	  var geoExtent = SmartTile.getGeographicExtentOfTileLXY(tileIndices.L, tileIndices.X, tileIndices.Y, undefined, imageryType);
	  var minGeoCoord = geoExtent.minGeographicCoord;
	  var maxGeoCoord = geoExtent.maxGeographicCoord; //this.quantizedSurface = new QuantizedSurface(this.testQMesh);
	  // The testing tile extent:
  
	  var minLon = minGeoCoord.longitude;
	  var minLat = minGeoCoord.latitude;
	  var maxLon = maxGeoCoord.longitude;
	  var maxLat = maxGeoCoord.latitude;
	  var midLon = (maxLon + minLon) / 2.0;
	  var midLat = (maxLat + minLat) / 2.0;
	  var lonRange = maxLon - minLon;
	  var latRange = maxLat - minLat;
	  var deltaLon = 0.0;
	  var deltaLat = 0.0;
	  var excavationGeoCoords = [];
	  var lonOffset = 0.0001;
	  var latOffset = 0.0001;
	  var lonOffset = -0.001;
	  var latOffset = 0.0001;
	  lonOffset = 0.004; //latOffset = 0.005;

		// let array = [[127.23582829477431,36.51155941930476],[127.23583033107829,36.511375920386314],[127.23600525531623,36.51139813828419],[127.23604468555075,36.511551079347164],[127.23582829477431,36.51155941930476]];
	  excavationGeoCoords.push(127.23582829477431, 36.51155941930476); // 0
	  excavationGeoCoords.push(127.23583033107829, 36.511375920386314); // 1
	  excavationGeoCoords.push(127.23600525531623, 36.51139813828419); // 2
	  excavationGeoCoords.push(127.23604468555075, 36.511551079347164); // 3

	  // Make a geoLocData, to render qMesh on scene.***
	  this.qMeshTest_geoLocData = ManagerUtils.calculateGeoLocationData(127.23582829477431, 36.51155941930476, 50.0, 0.0, 0.0, 0.0, undefined);

	  // Make geoCoords to render.***
	  var geoCoordsList = magoManager.modeler.getGeographicCoordsList();
	  var geoCoordsCount = excavationGeoCoords.length / 2;
	  for (var i=0; i<geoCoordsCount; i++)
	  {
			var geoCoord = new GeographicCoord(excavationGeoCoords[i*2], excavationGeoCoords[i*2+1], 50.0);
			geoCoord.makeDefaultGeoLocationData();
			geoCoordsList.addGeoCoord(geoCoord);
	  }
	  
	  //--------------------------------------------------------------------------------------------------------------
  
	  /*
	  var angRad = 0.0;
	  var interpolation = 128;
	  var increAngRad = Math.PI / (interpolation / 2);
	  var lonRadius = (lonRange/2) * 0.77;
	  var latRadius = (latRange/2) * 0.77;
	  
	  for(var i=0; i<interpolation; i++)
	  {
		  angRad = increAngRad * i;
		  var x = Math.cos(angRad);
		  var y = Math.sin(angRad);
			  var currLon = midLon + lonOffset + lonRadius * x;
		  var currLat = midLat + latOffset + latRadius * y;
			  excavationGeoCoords.push(currLon + deltaLon, currLat + deltaLat);
	  }
	  */
	  // Do a worker test.***
  
	  var qMeshManager = magoManager.quantizedMeshManager;
  
	  if (qMeshManager) 
		{
			var excavationAltitude = 103;
			qMeshManager.doExcavation(this.testQMesh, excavationGeoCoords, excavationAltitude); // another test.****
  
			var excavationSet = qMeshManager.newExcavationSet(excavationGeoCoords, excavationAltitude);
			var tiles = excavationSet.getIntersectedTiles();
			var hola = 0;
	  } //var excavationDepth = 120.0;
	  //this.quantizedSurface.excavation(excavationGeoCoords, excavationDepth);
  
  
	  this.quantizedSurfaceTest = true;
	} // Check if the qMesh worker finished.***
  
  
	var qMeshManager = magoManager.quantizedMeshManager;
  
	if (qMeshManager && this.testQMesh && !this.testQMesh_received) 
	{
	  var tileIndices = this.testQMesh.tileIndices;
	  var excavatedQMesh = qMeshManager.getExcavatedQuantizedMesh(tileIndices.X, tileIndices.Y, tileIndices.L);
  
	  if (excavatedQMesh) 
		{
		/*
		geoExtent: GeographicExtent {minGeographicCoord: GeographicCoord, maxGeographicCoord: GeographicCoord}
		tileIndices: {L: 14, X: 27934, Y: 4791}
		_boundingSphere: BoundingSphere {center: Cartesian3, radius: 791.149544024402}
		_childTileMask: 15
		_createdByUpsampling: false
		_credits: undefined
		_eastIndices: 
		_eastSkirtHeight: 23.519085626208074
		_encodedNormals: undefined
		_heightValues: 
		_horizonOcclusionPoint: Cartesian3 {x: -0.4778397353669971, y: 0.6364787134478864, z: 0.6055654428958949}
		_indices: 
		_maximumHeight: 459.2222900390625
		_mesh: undefined
		_minimumHeight: 172.89456176757812
		_northIndices: 
		_northSkirtHeight: 23.519085626208074
		_orientedBoundingBox: OrientedBoundingBox {center: Cartesian3, halfAxes: Matrix3}
		_quantizedVertices: 
		_southIndices: 
		_southSkirtHeight: 23.519085626208074
		_uValues: 
		_vValues: 
		_westIndices: 
		_westSkirtHeight: 23.519085626208074
		*/
			if (!this.testQMesh_received) 
			{
		  this.testQMesh._uValues = excavatedQMesh.uValues;
		  this.testQMesh._vValues = excavatedQMesh.vValues;
		  this.testQMesh._heightValues = excavatedQMesh.hValues;
		  this.testQMesh._indices = excavatedQMesh.indices;
		  this.testQMesh._southIndices = excavatedQMesh.southIndices;
		  this.testQMesh._eastIndices = excavatedQMesh.eastIndices;
		  this.testQMesh._northIndices = excavatedQMesh.northIndices;
		  this.testQMesh._westIndices = excavatedQMesh.westIndices;
		  this.testQMesh._minimumHeight = excavatedQMesh.minHeight;
		  this.testQMesh._maximumHeight = excavatedQMesh.maxHeight;
		  this.testQMesh_received = true;
			}
	  }
	}
  
	if (!this.qSurfaceMesh_dem_texture && this.testQMesh_received) 
	{
	    if (!this.qMeshVboKeyContainer)
		{
			this._makeQuantizedMeshVbo__testQSurfaceMesh(this.testQMesh);
		}
	  
	    this.qMeshTestFinished = true;
	} // End test.-------------
  
};

QuantizedMeshManager.makeQuantizedMesh_virtually = function (lonSegments, latSegments, altitude, resultQMesh)
{
	// This function makes a planar qMesh (used when the terrainProvider has no qMesh of a tile).***
	//-----------------------------------------------------------------------------------------------
	if (!resultQMesh)
	{
		resultQMesh = {};
	}

	// Set the altitude of the tile.
	resultQMesh._minimumHeight = altitude;
	resultQMesh._maximumHeight = altitude;

	var pointsCount = (lonSegments + 1.0) * (latSegments + 1.0);

	var shortMax = 32767;
	var uValues = new Uint16Array(pointsCount);
	var vValues = new Uint16Array(pointsCount);
	var heightValues = new Uint16Array(pointsCount);
	var indices = new Uint16Array(pointsCount);

	var increCol = 1.0 / lonSegments;
	var increRow = 1.0 / latSegments;
	var idx = 0;

	for (var r = 0; r < latSegments + 1; r++)
	{
		for (var c = 0; c < lonSegments + 1; c++)
		{
			uValues[idx] = Math.round(c * increCol * shortMax);
			vValues[idx] = Math.round(r * increRow * shortMax);
			heightValues[idx] = shortMax;
			idx += 1;
		}
	}

	var options = undefined;
	var points_columnsCount = lonSegments + 1;
	var points_rowsCount = latSegments + 1;
	var resultObject = GeometryUtils.getIndicesTrianglesRegularNet(points_columnsCount, points_rowsCount, undefined, undefined, undefined, undefined, undefined, options);

	resultQMesh._uValues = uValues;
	resultQMesh._vValues = vValues;
	resultQMesh._heightValues = heightValues;
	resultQMesh._indices = resultObject.indicesArray;

	return resultQMesh;
};


QuantizedMeshManager.prototype._makeQuantizedMeshVbo__testQSurfaceMesh = function (qMesh)
{
	if (this.qMeshVboKeyContainer)
	{
		return true;
	}

	var minHeight = qMesh._minimumHeight;
	var maxHeight = qMesh._maximumHeight;
	var uValues = qMesh._uValues;
	var vValues = qMesh._vValues;
	var hValues = qMesh._heightValues;
	this.indices = qMesh._indices;
	var colors;

	// check if has colors.
	if (qMesh._colors)
	{
		// has colors.
		colors = qMesh._colors;
	}

	// Now, make vbo.***
	var pointsCount = uValues.length;
	var cartesiansArray = new Uint16Array(pointsCount * 3);
	
	// Now, scale the mesh into the this.geoExtension.***

	var shortMax = 32767;
	var x, y, z;
	for (var i=0; i<pointsCount; i++)
	{
		x = uValues[i];
		y = vValues[i];
		z = hValues[i];

		cartesiansArray[i * 3] = x;
		cartesiansArray[i * 3 + 1] = y;
		cartesiansArray[i * 3 + 2] = z;
	}

	var magoManager = this.magoManager;
	var vboMemManager = magoManager.vboMemoryManager;

	if (this.qMeshVboKeyContainer === undefined)
	{ this.qMeshVboKeyContainer = new VBOVertexIdxCacheKeysContainer(); }
	
	var vboKey = this.qMeshVboKeyContainer.newVBOVertexIdxCacheKey();
	
	// Positions.
	vboKey.setDataArrayPos(cartesiansArray, vboMemManager);

	// Normals.
	//if (this.normalsArray)
	//{
	//	vboKey.setDataArrayNor(this.normalsArray, vboMemManager);
	//}
	
	// TexCoords.
	//if (this.texCoordsArray)
	//{
	//	vboKey.setDataArrayTexCoord(this.texCoordsArray, vboMemManager);
	//}

	if (colors)
	{
		vboKey.setDataArrayCol(colors, vboMemManager);
	}
		
	// Indices.
	vboKey.setDataArrayIdx(this.indices, vboMemManager);

	// Now, make skirt vbo.*****************************************************
	// South skrit.***
	var indicesArray = qMesh._southIndices;
	var indicesCount = indicesArray.length;
	var idx;
	// 1rst, make skirt cartesians array (use by TRIANGLES_STRIP).***
	var cartesian;
	var skirtCartesians = [];
	var zAux = 10000.0;
	for (var i=0; i<indicesCount; i++)
	{
		idx = indicesArray[i];
		x = uValues[idx];
		y = vValues[idx];
		z = hValues[idx];

		// Top value.***
		skirtCartesians.push(x, y, z);

		// bottom value.***
		skirtCartesians.push(x, y, zAux);
	}

	// east skirt.***
	var indicesArray = qMesh._eastIndices;
	var indicesCount = indicesArray.length;
	// 1rst, make skirt cartesians array (use by TRIANGLES_STRIP).***
	for (var i=0; i<indicesCount; i++)
	{
		idx = indicesArray[i];
		x = uValues[idx];
		y = vValues[idx];
		z = hValues[idx];

		// Top value.***
		skirtCartesians.push(x, y, z);

		// bottom value.***
		skirtCartesians.push(x, y, zAux);
	}
	
	// north skirt.***
	var indicesArray = qMesh._northIndices;
	var indicesCount = indicesArray.length;
	// 1rst, make skirt cartesians array (use by TRIANGLES_STRIP).***
	for (var i=indicesCount-1; i>=0; i--)
	{
		idx = indicesArray[i];
		x = uValues[idx];
		y = vValues[idx];
		z = hValues[idx];

		// Top value.***
		skirtCartesians.push(x, y, z);

		// bottom value.***
		skirtCartesians.push(x, y, zAux);
	}

	// west skirt.***
	var indicesArray = qMesh._westIndices;
	var indicesCount = indicesArray.length;
	// 1rst, make skirt cartesians array (use by TRIANGLES_STRIP).***
	for (var i=indicesCount-1; i>=0; i--)
	{
		idx = indicesArray[i];
		x = uValues[idx];
		y = vValues[idx];
		z = hValues[idx];

		// Top value.***
		skirtCartesians.push(x, y, z);

		// bottom value.***
		skirtCartesians.push(x, y, zAux);
	}
	

	var vboKey = this.qMeshVboKeyContainer.newVBOVertexIdxCacheKey();
	
	// Positions.
	vboKey.setDataArrayPos(new Uint16Array(skirtCartesians), vboMemManager);
	var hola = 0;
};

QuantizedMeshManager.prototype._renderQMesh = function (magoManager)
{
	// This function is a test function, to render the qmesh.***
	// Test function to render qSurface in excavation.***
	// Test function to render qSurface in excavation.***
	// Test function to render qSurface in excavation.***
	//if (!this.isPrepared())
	//{ return; }

	if (!this.qMeshVboKeyContainer)
	{
		return;
	}
	
	var magoManager = this.magoManager;
	var vboMemManager = magoManager.vboMemoryManager;
	var gl = magoManager.getGl();
	var shader;


	//gl.disable(gl.BLEND);
	//gl.disable(gl.CULL_FACE);


	var shader = magoManager.postFxShadersManager.getShader("qMeshRenderTEST");
	magoManager.postFxShadersManager.useProgram(shader);
	shader.bindUniformGenerals();

	var terrainPositionHIGH = this.qMeshTest_geoLocData.positionHIGH;
	var terrainPositionLOW = this.qMeshTest_geoLocData.positionLOW;
	var buildingGeoLocMat = this.qMeshTest_geoLocData.rotMatrix;

	gl.uniform4fv(shader.u_oneColor4_loc, [1.0, 0.5, 0.25, 1.0]);
	gl.uniform3fv(shader.buildingPosHIGH_loc, terrainPositionHIGH);
	gl.uniform3fv(shader.buildingPosLOW_loc, terrainPositionLOW);
	gl.uniformMatrix4fv(shader.buildingRotMatrix_loc, false, buildingGeoLocMat._floatArrays);

	// Now, set the waterSimGeoExtent & the qMeshGeoExtent.
	
	//var geoExtent = qMesh.geoExtent;
	//gl.uniform3fv(shader.u_totalMinGeoCoord_loc, [geoExtent.minGeographicCoord.longitude, geoExtent.minGeographicCoord.latitude, geoExtent.minGeographicCoord.altitude]);
	//gl.uniform3fv(shader.u_totalMaxGeoCoord_loc, [geoExtent.maxGeographicCoord.longitude, geoExtent.maxGeographicCoord.latitude, geoExtent.maxGeographicCoord.altitude]);

	//var tileGeoExtent = qMesh.geoExtent;
	//gl.uniform3fv(shader.u_currentMinGeoCoord_loc, [geoExtent.minGeographicCoord.longitude, geoExtent.minGeographicCoord.latitude, geoExtent.minGeographicCoord.altitude]);
	//gl.uniform3fv(shader.u_currentMaxGeoCoord_loc, [geoExtent.maxGeographicCoord.longitude, geoExtent.maxGeographicCoord.latitude, geoExtent.maxGeographicCoord.altitude]);
	


	var vbo_vicky = this.qMeshVboKeyContainer.vboCacheKeysArray[0]; // there are only one.
	var vertices_count = vbo_vicky.vertexCount;

	// Bind positions.
	vbo_vicky.vboBufferPos.bindData(shader, shader.attribLocations.a_pos, vboMemManager);
	
	//if (!vbo_vicky.bindDataNormal(shader, magoManager.vboMemoryManager))
	//{ return false; }

	//if (!vbo_vicky.bindDataTexCoord(shader, magoManager.vboMemoryManager))
	//{ return false; }

	if (vbo_vicky.vboBufferCol)
	{
		vbo_vicky.vboBufferCol.bindData(shader, shader.color4_loc, vboMemManager);
	}

	var indicesCount = vbo_vicky.indicesCount;
	if (!vbo_vicky.bindDataIndice(shader, magoManager.vboMemoryManager))
	{ return false; }

	// Render in traditional mode.***
	/*
	gl.uniform1i(shader.colorType_loc, 1);
	gl.drawElements(gl.TRIANGLES, indicesCount, gl.UNSIGNED_SHORT, 0); 

	gl.uniform1i(shader.colorType_loc, 0);
	gl.disable(gl.DEPTH_TEST);
	gl.drawElements(gl.LINES, indicesCount, gl.UNSIGNED_SHORT, 0); 
	*/

	// Render triangle one by one.**********************************************************
	var triCount = indicesCount/3.0;
	if (!this.randomColorsArray)
	{
		this.randomColorsArray = [];
		for (var i=0; i<triCount; i++)
		{
			this.randomColorsArray.push([Math.random()*0.5, Math.random()*0.5, Math.random()*0.5, 1.0]);
		}
	}
	
	var byteOffset;
	gl.uniform1i(shader.colorType_loc, 1);
	for (var i=0; i<triCount; i++)
	{
		byteOffset = i*3*2;
		gl.uniform4fv(shader.u_oneColor4_loc, this.randomColorsArray[i]);
		gl.drawElements(gl.TRIANGLES, 3, gl.UNSIGNED_SHORT, byteOffset); 
	}

	// Now, render the skirt.***
	var vbo_vicky = this.qMeshVboKeyContainer.vboCacheKeysArray[1]; // there are only one.
	var vertices_count = vbo_vicky.vertexCount;

	// Bind positions.
	vbo_vicky.vboBufferPos.bindData(shader, shader.attribLocations.a_pos, vboMemManager);

	gl.drawArrays(gl.TRIANGLE_STRIP, 0, vertices_count);
};