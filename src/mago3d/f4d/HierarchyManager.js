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

	// mother nodes array.
	this.motherNodesArray = [];
};

/**
 * @returns new node.
 */
HierarchyManager.prototype.newMotherNode = function() 
{
	var motherNode = new Node();
	this.motherNodesArray.push(motherNode);
	return motherNode;
};