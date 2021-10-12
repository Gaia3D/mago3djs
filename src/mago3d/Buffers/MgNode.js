'use strict';

/**
 * @class MgNode
 * @constructor 
 */
var MgNode = function () 
{
	if (!(this instanceof MgNode)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
	this.children = [];
	this.geoLocDataManager; // position, rotation, scale, etc.
	this.name = undefined;

	this.mgMeshArray = [];
	this._map_matId_mgPrimitivesArray;
	this._map_matId_mgBufferDataSetArray;
};

MgNode._makeMap_matId_mgPrimitivesArray = function (mgMeshArray)
{
	// Init the map.***
	var map_matId_mgPrimitivesArray = {};

	// Now, make the map.***
	var meshesCount = mgMeshArray.length;
	for (var i=0; i<meshesCount; i++)
	{
		var mgMesh = mgMeshArray[i];
		var primitives = mgMesh.primitives;
		var primitivesCount = primitives.length;
		for (var j=0; j<primitivesCount; j++)
		{
			var primitive = primitives[j];
			var matId = primitive.materialId;
			if (!map_matId_mgPrimitivesArray[matId])
			{
				map_matId_mgPrimitivesArray[matId] = [];
			}
			map_matId_mgPrimitivesArray[matId].push(primitive);
		}
	}

	return map_matId_mgPrimitivesArray;
};

MgNode._makeMap_matId_mgBufferDataSetArray = function (map_matId_mgPrimitivesArray)
{
	// In this function makes mgBufferDataSets joining primitives with the same material.***
	// Init the map.***
	var map_matId_mgBufferDataSetArray = {};
	var shortSize = 65535;
	var currTotalElemsCount = 0;

	for (var key in map_matId_mgPrimitivesArray)
	{
		if (map_matId_mgPrimitivesArray.hasOwnProperty(key)) 
		{
			var mgBufferViewSetsArray = [];
			if (!map_matId_mgBufferDataSetArray[key])
			{
				map_matId_mgBufferDataSetArray[key] = [];
			}
			var primitivesArray = map_matId_mgPrimitivesArray[key];
			var primitivesCount = primitivesArray.length;
			for (var k=0; k<primitivesCount; k++)
			{
				var mgPrimitive = primitivesArray[k];
				var materialId = mgPrimitive.materialId;
				var mgBufferViewSet = mgPrimitive.mgBufferViewSet;

				// Must check the total elementsCount cannot superate 65535.***
				var posMgBufferView = mgBufferViewSet.getMgBufferView("POSITION3");
				var elemsCount = posMgBufferView.aux_auxMgBuffer.getElementsCount();
				if (currTotalElemsCount + elemsCount >= shortSize)
				{
					var masterMgBufferDataSet = MgBufferDataSet.makeMgBufferDataSetFromMgBufferViewSetArray(mgBufferViewSetsArray, undefined);
					masterMgBufferDataSet.setMaterialId(key);
					map_matId_mgBufferDataSetArray[key].push(masterMgBufferDataSet);
					mgBufferViewSetsArray.length = 0; // init.***
					currTotalElemsCount = 0; // init.***
					//-----------------------------------------------------------
					currTotalElemsCount += elemsCount;
					mgBufferViewSetsArray.push(mgBufferViewSet);
				}
				else
				{
					currTotalElemsCount += elemsCount;
					mgBufferViewSetsArray.push(mgBufferViewSet);
				}
				
			}

			if (mgBufferViewSetsArray.length > 0)
			{
				var masterMgBufferDataSet = MgBufferDataSet.makeMgBufferDataSetFromMgBufferViewSetArray(mgBufferViewSetsArray, undefined);
				masterMgBufferDataSet.setMaterialId(key);
				map_matId_mgBufferDataSetArray[key].push(masterMgBufferDataSet);
				mgBufferViewSetsArray.length = 0; // init.***
				currTotalElemsCount = 0; // init.***
			}
		}
	}

	return map_matId_mgBufferDataSetArray;
};