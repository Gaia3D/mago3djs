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
    
};

QuantizedMeshManager.prototype.doExcavation = function (qMesh, excavationGeoCoords, excavationAltitude)
{
    // test worker calling another worker.***
    var magoManager = this.magoManager;
    if(!this.workerQuantizedMeshExcavation)
    {
        var qMeshManager = this;
        this.workerQuantizedMeshExcavation = new Worker(magoManager.config.scriptRootPath + 'Worker/workerQuantizedMeshExcavation.js');
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
        info : {X: X, Y: Y, L: L},
        uValues : qMesh._uValues,
        vValues : qMesh._vValues,
        hValues : qMesh._heightValues,
        indices : qMesh._indices,
        minHeight : qMesh._minimumHeight,
        maxHeight : qMesh._maximumHeight,
        southIndices : qMesh._southIndices,
        eastIndices : qMesh._eastIndices,
        northIndices : qMesh._northIndices,
        westIndices : qMesh._westIndices,
        geoExtent : {
            minLongitude : geoExtent.minGeographicCoord.longitude,
            minLatitude : geoExtent.minGeographicCoord.latitude,
            maxLongitude : geoExtent.maxGeographicCoord.longitude,
            maxLatitude : geoExtent.maxGeographicCoord.latitude
        },
        excavationGeoCoords : excavationGeoCoords,
        excavationAltitude : excavationAltitude
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
    return result;
};