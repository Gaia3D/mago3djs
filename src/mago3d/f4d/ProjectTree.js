'use strict';

/**
 * @class ProjectTree
 */
var ProjectTree = function() 
{
	if (!(this instanceof ProjectTree)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this.root;
	
	this.nodesArray = [];
};
