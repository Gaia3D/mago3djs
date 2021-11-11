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
};

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

QuantizedMeshManager.prototype.applyQuantizedMeshExcavation = function()
{
	
	if (this.magoManager.scene.terrainProvider instanceof Cesium.EditableCesiumTerrainProvider) 
	{
		var tilesMap = this.quantizedMeshExcavationSet.getIntersectedTiles();
		var excavationAltitude = this.quantizedMeshExcavationSet.excavationAltitude;

		var excavationGeoCoords = this.quantizedMeshExcavationSet.geoCoordsArray.reduce(function(accum, item)
		{
			accum.push(item.longitude);
			accum.push(item.latitude); 
			return accum;
		}, []);
		this.magoManager.scene.terrainProvider.target = {
			tilesMap,
			excavationAltitude,
			excavationGeoCoords
		};
	}
};

QuantizedMeshManager.prototype.stopQuantizedMeshExcavation = function()
{
	
	if (this.magoManager.scene.terrainProvider instanceof Cesium.EditableCesiumTerrainProvider) 
	{
		this.magoManager.scene.terrainProvider.target = undefined;
	}
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
	
	//this.workerQuantizedMeshExcavation.postMessage(data, [data.uValues]); // send to worker by reference (transfer).
	return this.workerQuantizedMeshExcavation.postMessage(data).then(function(e) 
	{
		var result = e.result;
		console.info('length : ' + result.uvhValues.length);
		return new Cesium.QuantizedMeshTerrainData({
			minimumHeight         : result.minHeight,
			maximumHeight         : result.maxHeight,
			quantizedVertices     : result.uvhValues,
			indices               : result.indices,
			boundingSphere        : result.boundingSphere,
			orientedBoundingBox   : qMesh._orientedBoundingBox,
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