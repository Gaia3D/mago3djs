'use strict';

/**
 * 블럭 모델
 * @class HierarchyManager
 */
var HierarchyManager = function() 
{
	if (!(this instanceof HierarchyManager)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	// lowest nodes array. initial array to create tiles global distribution.
	this.nodesArray = [];
	this.nodesMap = new Map();
	
	// projectTrees array.
	//this.motherProjectTreesArray = [];
};

/**
 * 어떤 일을 하고 있습니까?
 * @class GeoLocationData
 * @param geoLocData 변수
 */
HierarchyManager.prototype.getNodeByDataName = function(dataName, dataNameValue) 
{
	return this.nodesMap.get(dataNameValue);
	/*
	var nodesCount = this.nodesArray.length;
	var i=0;
	var find = false;
	var node;
	var resultNode;
	while (!find && i<nodesCount)
	{
		node = this.nodesArray[i];
		if (node.data[dataName] && node.data[dataName] === dataNameValue)
		{
			resultNode = node;
		}
		i++;
	}
	
	return resultNode;
	*/
};

/**
 * 어떤 일을 하고 있습니까?
 * @class GeoLocationData
 * @param geoLocData 변수
 */
HierarchyManager.prototype.getRootNodes = function(resultRootNodesArray) 
{
	if (resultRootNodesArray === undefined)
	{ resultRootNodesArray = []; }
	
	var nodesCount = this.nodesArray.length;
	var node;
	for (var i=0; i<nodesCount; i++)
	{
		node = this.nodesArray[i];
		if (node.parent === undefined)
		{
			resultRootNodesArray.push(node);
		}
		i++;
	}
	
	return resultRootNodesArray;
};

/**
 * 어떤 일을 하고 있습니까?
 * @class GeoLocationData
 * @param geoLocData 변수
 */
HierarchyManager.prototype.newNode = function(id) 
{
	var node = new Node();
	node.data = {"nodeId": id};
	this.nodesArray.push(node);
	this.nodesMap.set(id, node);
	return node;
};

