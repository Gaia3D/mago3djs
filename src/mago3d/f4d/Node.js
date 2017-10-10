'use strict';

/**
 * @class Node
 */
var Node = function() 
{
	if (!(this instanceof Node)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	// parent.
	this.parent;
	
	// children array.
	this.children = []; 
	
	// data.
	this.data;
};

