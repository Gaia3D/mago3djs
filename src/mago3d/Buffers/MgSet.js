'use strict';

/**
 * @class MgSet
 * @constructor 
 */
var MgSet = function (options) 
{
	if (!(this instanceof MgSet)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
	// This is the top class of the mago renderables objects.
	this.magoManager;
	this.mgNodesArray = [];
	this.materials = [];

	this.mgBufferDataSetArray = [];

	this.geoLocDataManager;

	if (options)
	{
		if (options.magoManager)
		{
			this.magoManager = options.magoManager;
		}
	}
};

MgSet.makeMgSetFromMgNodesArray = function (mgNodesArray, resultMgSet)
{
	var map_attrib_mgBuffersArray = {};
	var mgBufferViewSetsArray = [];

	if (!resultMgSet)
	{
		resultMgSet = new MgSet();
	}

	var shortSize = 65535;
	var currTotalElemsCount = 0;
	var mgNodesCount = mgNodesArray.length;
	for (var i=0; i<mgNodesCount; i++)
	{
		var mgNode = mgNodesArray[i];
		mgNode._map_matId_mgPrimitivesArray = MgNode._makeMap_matId_mgPrimitivesArray(mgNode.mgMeshArray);
		mgNode._map_matId_mgBufferDataSetArray = MgNode._makeMap_matId_mgBufferDataSetArray(mgNode._map_matId_mgPrimitivesArray);
		var map_matId_mgBufferDataSetArray = mgNode._map_matId_mgBufferDataSetArray;
		for (var key in map_matId_mgBufferDataSetArray)
		{
			if (map_matId_mgBufferDataSetArray.hasOwnProperty(key)) 
			{
				var mgBufferDataSetArray = map_matId_mgBufferDataSetArray[key];
				var mgBufferDataSetsCount = mgBufferDataSetArray.length;
				for (var j=0; j<mgBufferDataSetsCount; j++)
				{
					resultMgSet.mgBufferDataSetArray.push(mgBufferDataSetArray[j]);
				}
				
			}
		}

		resultMgSet.mgNodesArray.push(mgNode);
	}

	
	return resultMgSet;
};


MgSet.prototype.render = function (gl, shader)
{
	// provisionally bind geoLocData.***
	var geoLocData = this.geoLocDataManager.getCurrentGeoLocationData();
	geoLocData.bindGeoLocationUniforms(gl, shader);

	var mgBufferDataSetsCount = this.mgBufferDataSetArray.length;
	for (var i=0; i<mgBufferDataSetsCount; i++)
	{
		// 1rst, bind buffers.
		var mgBufferDataSet = this.mgBufferDataSetArray[i];
		mgBufferDataSet.bindBuffers(gl, shader);

		// 2nd, draw by buffersViewers.***
		
	}
};



