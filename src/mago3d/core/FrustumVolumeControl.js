'use strict';

/**
 * Manage the objects which is shown at each volume of this frustum
 * @class FrustumVolumeControl
 */
var FrustumVolumeControl = function() 
{
	if (!(this instanceof FrustumVolumeControl)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
	this.frustumVolumensMap = {};
	var mexFrustumsCount = 4;
	this.nearFarArray = new Float32Array(2*mexFrustumsCount);
};

/**
 * Find the specific volumn by the key of this.frustumVolumensMap
 * @param {Number} key
 * @returns {Frustum} 
 */
FrustumVolumeControl.prototype.getFrustumVolumeCulling = function(key)
{
	// 1rst, check if exist. If no exist create it.
	if (!this.frustumVolumensMap.hasOwnProperty(key))
	{
		this.frustumVolumensMap[key] = {};
		this.frustumVolumensMap[key].intersectedTilesArray = []; // todo: change name to "intersectedTilesArray".***
		this.frustumVolumensMap[key].visibleNodes = new VisibleObjectsController();
	}
	
	return this.frustumVolumensMap[key];
};

/**
 * Initiate and clear all the objects in the array
 */
FrustumVolumeControl.prototype.initArrays = function()
{
	var frustumVolumeObject;
	for (var key in this.frustumVolumensMap)
	{
		if (Object.prototype.hasOwnProperty.call(this.frustumVolumensMap, key)) 
		{
			frustumVolumeObject = this.frustumVolumensMap[key];
			frustumVolumeObject.intersectedTilesArray.length = 0; // todo: change name to "intersectedTilesArray".***
			frustumVolumeObject.visibleNodes.initArrays();
		}
	}
};

/**
 * Returns the near & far considering all frustum partitions.
 */
FrustumVolumeControl.prototype.getTotalBoundingFrustum = function(resultBFrustum)
{
	resultBFrustum = {}; // init.
	
	var frustumVolumeObject;
	for (var key in this.frustumVolumensMap)
	{
		if (Object.prototype.hasOwnProperty.call(this.frustumVolumensMap, key)) 
		{
			frustumVolumeObject = this.frustumVolumensMap[key];
			if (frustumVolumeObject.intersectedTilesArray.length > 0)
			{
				var bFrustumNear = frustumVolumeObject.visibleNodes.bFrustumNear;
				var bFrustumFar = frustumVolumeObject.visibleNodes.bFrustumFar;
				
				if (bFrustumNear !== undefined && bFrustumFar !== undefined)
				{
					if (resultBFrustum.bFrustumNear === undefined)
					{
						resultBFrustum.bFrustumNear = bFrustumNear;
					}
					else
					{
						if (bFrustumNear < resultBFrustum.bFrustumNear)
						{ resultBFrustum.bFrustumNear = bFrustumNear; }
					}
					
					if (resultBFrustum.bFrustumFar === undefined)
					{
						resultBFrustum.bFrustumFar = bFrustumFar;
					}
					else
					{
						if (bFrustumFar > resultBFrustum.bFrustumFar)
						{ resultBFrustum.bFrustumFar = bFrustumFar; }
					}
				}
			}
		}
	}
	
	return resultBFrustum;
};

/**
 * Returns the near & far considering all frustum partitions.
 */
FrustumVolumeControl.prototype.calculateBoundingFrustums = function(camera)
{
	var frustumVolumeObject;
	for (var key in this.frustumVolumensMap)
	{
		if (Object.prototype.hasOwnProperty.call(this.frustumVolumensMap, key)) 
		{
			frustumVolumeObject = this.frustumVolumensMap[key];
			if (frustumVolumeObject.intersectedTilesArray.length > 0)
			{
				frustumVolumeObject.visibleNodes.calculateBoundingFrustum(camera);
			}
		}
	}
};

/**
 * Returns the visible nodes & nativeObjects in a maps
 * Returns in "map", so there are NO repeated nodes or nativeObjects.
 */
FrustumVolumeControl.prototype.getAllVisiblesObject = function()
{
	// Returns in "map", so there are NO repeated nodes or nativeObjects.
	var nodeMap = {};
	var nativeMap = {};

	for (var i in this.frustumVolumensMap) 
	{
		if (this.frustumVolumensMap.hasOwnProperty(i)) 
		{
			var visibleNodes = this.frustumVolumensMap[i].visibleNodes;

			var natives = visibleNodes.getAllNatives();
			for (var j=0, len=natives.length;j<len;j++) 
			{
				var native = natives[j];
				if (nativeMap[native._guid]) { continue; }

				nativeMap[native._guid] = native;
			}

			var nodes = visibleNodes.getAllVisibles();
			for (var j=0, len=nodes.length;j<len;j++) 
			{
				var node = nodes[j];
				var id = node.getId();
				if (nodeMap[id]) { continue; }

				nodeMap[id] = node;
			}
		}
	}
	return {
		nodeMap   : nodeMap,
		nativeMap : nativeMap
	};
};

/**
 * Returns the visible nodes & nativeObjects in arrays
 * Returns in "arrays", so there can be repeated nodes or nativeObjects.
 */
FrustumVolumeControl.prototype.getAllVisiblesObjectArrays = function()
{
	// Returns in "arrays", so there can be repeated nodes or nativeObjects.
	var nodeArray = [];
	var nativeArray = [];

	for (var i in this.frustumVolumensMap) 
	{
		if (this.frustumVolumensMap.hasOwnProperty(i)) 
		{
			var visibleNodes = this.frustumVolumensMap[i].visibleNodes;

			var natives = visibleNodes.getAllNatives();
			nativeArray = nativeArray.concat(natives);

			var nodes = visibleNodes.getAllVisibles();
			nodeArray = nodeArray.concat(nodes);
		}
	}
	return {
		nodeArray   : nodeArray,
		nativeArray : nativeArray
	};
};

/**
 * 
 * @param {*} polygon2D 
 * @param {*} type 
 * @param {*} filter 
 */
FrustumVolumeControl.prototype.selectionByPolygon2D = function(polygon2D, type, filter) 
{
	var allVisible = this.getAllVisiblesObject();
	
	var result = [];
	var dataMap = (type === DataType.F4D) ? allVisible.nodeMap : allVisible.nativeMap;

	for (var k in dataMap) 
	{
		if (dataMap.hasOwnProperty(k)) 
		{
			var data = dataMap[k];
			if (filter && typeof filter === 'function') 
			{
				if (filter.call(this, data)) { continue; }
			}

			if (data.intersectionWithPolygon2D(polygon2D)) 
			{
				result.push(data);
			}
		}
	}

	return result;
};