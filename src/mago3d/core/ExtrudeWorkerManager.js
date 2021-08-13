'use strict';

/**
 * Manager of workers.
 * @exception {Error} Messages.CONSTRUCT_ERROR
 * 
 * @class WorkersManager
 * @constructor
 */
var ExtrudeWorkerManager = function(workersManager) 
{
	if (!(this instanceof ExtrudeWorkerManager)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this.workersManager = workersManager;
	this.finishedMap = {};
	this.maxWorkers = 8;
	this.storeType = 0; // 0= delete efter give. 1= keep.
};

ExtrudeWorkerManager.prototype.isBusy = function () 
{
	if (this.workersCount === undefined) 
	{
		this.workersCount = 0;
	}

	if (this.workersCount > this.maxWorkers)
	{
		return true;
	}

	return false;
};

ExtrudeWorkerManager.prototype.doExtrude = function (data) 
{
	// Note : an object to extrude has 1 or more geographicCoordsLists and a height.*********************
	// object = {
	//   geographicCoordsListsArray : geographicCoordsListsArray,
	//   height : height
	//}
	//---------------------------------------------------------------------------------------------------

	// Must prepare data:
	// objectToExtrude = {
	//   geoCoordsNumbersArrayArray : geoCoordsNumbersArrayArray,
	//   height : height,
	//   color : color
	//}
	if (this.workersCount === undefined) 
	{
		this.workersCount = 0;
	}

	var objectsToExtrudeArray = data.objectsToExtrudeArray;
	var guid = data.guid;
	var objectsCount = objectsToExtrudeArray.length;
	var objectsToExtrudeArrayWorker = new Array(objectsCount);
	for (var i=0; i<objectsCount; i++)
	{
		var objectToExtrude = objectsToExtrudeArray[i];
		var geoCoordsListArray = objectToExtrude.geographicCoordsListsArray;
		var geoCoordsListsCount = geoCoordsListArray.length;
		var numbersArrayArray = new Array(geoCoordsListsCount);
		for (var j=0; j<geoCoordsListsCount; j++)
		{
			var geoCoordsList = geoCoordsListArray[j];
			var numbersArray = GeographicCoordsList.getNumbersArrayOfGeoCoordsList(geoCoordsList);
			numbersArrayArray[j] = numbersArray;
		}
        
		var objectToExtrudeWorker = {
			geoCoordsNumbersArrayArray : numbersArrayArray,
			height                     : objectToExtrude.height,
			color                      : [0.9, 0.9, 0.9, 1.0]
		};

		objectsToExtrudeArrayWorker[i] = objectToExtrudeWorker;
	}

	// Now create worker.***
	var magoManager = this.workersManager.magoManager;
	if (!this.workerExtrudeObjects)
	{
		var extrudeWorkerManager = this;
		this.workerExtrudeObjects = new Worker(magoManager.config.scriptRootPath + 'Worker/workerExtrudeObjects.js');
		this.workerExtrudeObjects.onmessage = function(e)
		{
			
			var result = e.data.result;
			var info = result.info;
			var resultGuid = info.guid;
			console.log('work complete ' + resultGuid);
			//var excavatedQuantizedMeshMap = qMeshManager.excavatedQuantizedMeshMap;
			//var Z = tileInfo.L;
			//var X = tileInfo.X;
			//var Y = tileInfo.Y;
			//if (!excavatedQuantizedMeshMap[Z]) { excavatedQuantizedMeshMap[Z] = {}; }
			//if (!excavatedQuantizedMeshMap[Z][X]) { excavatedQuantizedMeshMap[Z][X] = {}; }
			//excavatedQuantizedMeshMap[Z][X][Y] = result;
			if (!extrudeWorkerManager.finishedMap) 
			{
				extrudeWorkerManager.finishedMap = {};
			}

			extrudeWorkerManager.finishedMap[resultGuid] = result;
			extrudeWorkerManager.workersCount -= 1;
			
		};
	}

	

	var dataToWorker = {
		info                        : {guid: guid},
		objectsToExtrudeArrayWorker : objectsToExtrudeArrayWorker,
		geoLocation                 : data.geoLocation,
		rotation                    : data.rotation
	};

	//this.workerExtrudeObjects.postMessage(data, [data.uValues]); // send to worker by reference (transfer).
	this.workerExtrudeObjects.postMessage(dataToWorker); // send to worker by copy.
	this.workersCount ++;
	var hola = 0;

	if (!this.requestdedMap) 
	{
		this.requestdedMap = {};
	}

	this.requestdedMap[guid] = true;
};

ExtrudeWorkerManager.prototype.getResult = function (guid)
{
	if (!this.finishedMap) { return; }
	if (!this.finishedMap[guid]) { return; }
	var result = this.finishedMap[guid];

	if (this.storeType === 0)
	{
		delete this.finishedMap[guid];
	}

	return result;
};