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
	
	// projectTrees array.
	this.motherProjectTreesArray = [];
};

/**
 * 어떤 일을 하고 있습니까?
 * @class GeoLocationData
 * @param geoLocData 변수
 */
HierarchyManager.prototype.newNode = function() 
{
	var node = new Node();
	this.nodesArray.push(node);
	return node;
};

/**
 * @returns new ProjectTree.
 */
HierarchyManager.prototype.newProjectTree = function() 
{
	var projectTree = new ProjectTree();
	this.motherProjectTreesArray.push(projectTree);
	return projectTree;
};