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

/**
 * 어떤 일을 하고 있습니까?
 * @class GeoLocationData
 * @param geoLocData 변수
 */
ProjectTree.prototype.newNode = function() 
{
	var node = new Node();
	this.nodesArray.push(node);
	return node;
};