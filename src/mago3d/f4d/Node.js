'use strict';

/**
 * 블럭 모델
 * @class Node
 */
var Node = function() 
{
	if (!(this instanceof Node)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	// children array.
	this.children = []; 
	
	// attributes jason.
	this.attributes;
};

/**
 * @returns new node.
 */
/*
Node.prototype.newChildNode = function() 
{
	var childNode = new Node();
	this.children.push(childNode);
	return childNode;
};
*/