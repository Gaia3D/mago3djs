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
	this.data; // {}.
};

/**
 * 어떤 일을 하고 있습니까?
 */
Node.prototype.addChildren = function(children) 
{
	children.setParent(this);
	this.children.push(children);
};

/**
 * 어떤 일을 하고 있습니까?
 */
Node.prototype.setParent = function(parent) 
{
	this.parent = parent;
};

/**
 * 어떤 일을 하고 있습니까?
 */
Node.prototype.getRoot = function() 
{
	if (this.parent === undefined)
	{ return this; }
	else
	{
		return this.parent.getRoot();
	}
};

