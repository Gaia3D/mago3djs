'use strict';

/**
 * Manager of workers.
 * @exception {Error} Messages.CONSTRUCT_ERROR
 * 
 * @class WorkersManager
 * @constructor
 */
var ExtrusionWorkerManager = function(workersManager) 
{
	if (!(this instanceof ExtrusionWorkerManager)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this.workersManager = workersManager;
	this.finishedMap = {};
	this.maxWorkers = 20; // the best threads count is 2.***
	this.storeType = 0; // 0= delete efter give. 1= keep.
};

ExtrusionWorkerManager.prototype.isBusy = function () 
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

ExtrusionWorkerManager.prototype.doExtrude = function (data) 
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
	var color = data.color;
	
	if (!color) 
	{ 
		color = [241/255, 231/255, 200/255, 1]; 
	}
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
		var imageUrl;
		if (objectToExtrude.divideLevel) 
		{
			var c = document.createElement("canvas");
			var ctx = c.getContext("2d");

			c.width = 8;
			c.height = 32;
			ctx.beginPath();
			ctx.fillStyle = "#262626";
			ctx.rect(0, 0, 8, 1);
			ctx.fill();
			ctx.closePath();

			ctx.beginPath();
			ctx.fillStyle = Color.getHexCode(color[0], color[1], color[2]);
			ctx.rect(0, 1, 8, 31);
			ctx.fill();
			ctx.closePath();

			imageUrl = c.toDataURL();
		}
        
		var objectToExtrudeWorker = {
			geoCoordsNumbersArrayArray : numbersArrayArray,
			height                     : objectToExtrude.height,
			floorHeight                : objectToExtrude.floorHeight,
			divideLevel                : objectToExtrude.divideLevel,
			imageUrl                   : imageUrl,
			color                      : color
		};

		objectsToExtrudeArrayWorker[i] = objectToExtrudeWorker;
	}

	// Now create worker.***
	var magoManager = this.workersManager.magoManager;
	if (!this.workerExtrudeObjects)
	{
		var extrudeWorkerManager = this;
		this.workerExtrudeObjects = createWorker(magoManager.config.scriptRootPath + 'Worker/workerExtrusionObjects.js');
		this.workerExtrudeObjects.onmessage = function(e)
		{
			
			var result = e.data.result;
			var info = result.info;
			var resultGuid = info.guid;

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

ExtrusionWorkerManager.prototype.getResult = function (guid)
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