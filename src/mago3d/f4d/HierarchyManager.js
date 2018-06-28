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
	this.projectsMap = {};
};

/**
 * 어떤 일을 하고 있습니까?
 * @class GeoLocationData
 * @param geoLocData 변수
 */
HierarchyManager.prototype.deleteNodes = function(gl, vboMemoryManager) 
{
	//for (var value of this.projectsMap.values()) 
	//{
	//	value.clear();
	//}
	this.projectsMap = {};
	
	var nodesCount = this.nodesArray.length;
	for (var i=0; i<nodesCount; i++)
	{
		if (this.nodesArray[i])
		{
			this.nodesArray[i].deleteObjects(gl, vboMemoryManager);
			this.nodesArray[i] = undefined;
		}
	}
	this.nodesArray.length = 0;
};

/**
 * 어떤 일을 하고 있습니까?
 * @class GeoLocationData
 * @param geoLocData 변수
 */
HierarchyManager.prototype.getNodeByDataName = function(projectId, dataName, dataNameValue) 
{
	// note: here "dataName" refers "nodeId", or other datas that can be inside of"data".***
	var nodesMap = this.getNodesMap(projectId);
	
	if (nodesMap === undefined)
	{ return undefined; }
	
	var resultNode;
	
	//for (var value of nodesMap.values()) 
	for (var key in nodesMap)
	{
		if (Object.prototype.hasOwnProperty.call(nodesMap, key))
		{
			var value = nodesMap[key];
			if (value.data[dataName] === dataNameValue)
			{
				resultNode = value;
				break;
			}
		}
	}
	
	return resultNode;
};

/**
 * 어떤 일을 하고 있습니까?
 * @class GeoLocationData
 * @param geoLocData 변수
 */
HierarchyManager.prototype.getNodeByDataKey = function(projectId, dataKey) 
{
	var nodesMap = this.getNodesMap(projectId);
	
	if (nodesMap === undefined)
	{ return undefined; }
	
	var resultNode = nodesMap[dataKey];
	
	return resultNode;
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
	}
	
	return resultRootNodesArray;
};

/**
 * 어떤 일을 하고 있습니까?
 * @class GeoLocationData
 * @param geoLocData 변수
 */
HierarchyManager.prototype.existProject = function(projectId) 
{
	return this.projectsMap.hasOwnProperty(projectId);
};

/**
 * 어떤 일을 하고 있습니까?
 * @class GeoLocationData
 * @param geoLocData 변수
 */
HierarchyManager.prototype.getNodesMap = function(projectId, attributes) 
{
	// 1rst, check if exist.
	var nodesMap = this.projectsMap[projectId];
	if (nodesMap === undefined)
	{
		nodesMap = {};
		if (attributes !== undefined)
		{ nodesMap.attributes = attributes; }
		this.projectsMap[projectId] = nodesMap;
	}
	else{
		if (attributes !== undefined && nodesMap.attributes === undefined)
		{ nodesMap.attributes = attributes; }
	}
	return nodesMap;
};


/**
 * 어떤 일을 하고 있습니까?
 * @class GeoLocationData
 * @param geoLocData 변수
 */
HierarchyManager.prototype.newNode = function(id, projectId, attributes) 
{
	var nodesMap = this.getNodesMap(projectId, attributes);
	
	var node = new Node();
	node.data = {"nodeId": id};
	this.nodesArray.push(node);
	nodesMap[id] = node;
	return node;
};

