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
	// 1rst, make a map [attribName : array[mgBuffer]].***
	var map_attrib_mgBuffersArray = {};
	var mgBufferViewSetsArray = [];

	if (!resultMgSet)
	{
		resultMgSet = new MgSet();
	}

	var mgNodesCount = mgNodesArray.length;
	for (var i=0; i<mgNodesCount; i++)
	{
		var mgNode = mgNodesArray[i];
		var meshesArray = mgNode.mgMeshArray;
		var meshesCount = meshesArray.length;
		for (var j=0; j<meshesCount; j++)
		{
			var mgMesh = meshesArray[j];
			var primitivesArray = mgMesh.primitives;
			var primitivesCount = primitivesArray.length;
			for (var k=0; k<primitivesCount; k++)
			{
				var mgPrimitive = primitivesArray[k];
				var mgBufferViewSet = mgPrimitive.mgBufferViewSet;
				mgBufferViewSetsArray.push(mgBufferViewSet);
			}
		}

		resultMgSet.mgNodesArray.push(mgNode);
	}

	
	var masterMgBufferDataSet = MgBufferDataSet.makeMgBufferDataSetFromMgBufferViewSetArray(mgBufferViewSetsArray, undefined);

	resultMgSet.mgBufferDataSetArray.push(masterMgBufferDataSet);
	return resultMgSet;
};

MgSet.prototype.render = function (gl, shader)
{
	var mgBufferDataSetsCount = this.mgBufferDataSetArray.length;
	for (var i=0; i<mgBufferDataSetsCount; i++)
	{
		var mgBufferDataSet = this.mgBufferDataSetArray[i];
		mgBufferDataSet.bindBuffers(gl, shader);
	}
};



