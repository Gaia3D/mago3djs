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

	// projectTrees array.
	this.motherProjectTreesArray = [];
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