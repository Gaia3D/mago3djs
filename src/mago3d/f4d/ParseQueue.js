'use strict';

/**
 * ParseQueue
 * 
 * @alias ParseQueue
 * @class ParseQueue
 */
var ParseQueue = function() 
{
	if (!(this instanceof ParseQueue)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this.octreesLod0ReferencesToParseMap = new Map();
	this.octreesLod0ModelsToParseMap = new Map();
	this.octreesLod2LegosToParseMap = new Map();
	//this.neoBuildingsHeaderToParseArray = new Map(); // no used yet.
};

ParseQueue.prototype.putOctreeLod0ReferencesToParse = function(octree, aValue)
{
	// provisionally "aValue" can be anything.
	if (aValue === undefined)
	{ aValue = 0; }
	
	this.octreesLod0ReferencesToParseMap.set(octree, aValue);
};

ParseQueue.prototype.eraseOctreeLod0ReferencesToParse = function(octree)
{
	this.octreesLod0ReferencesToParseMap.delete(octree);
};

ParseQueue.prototype.putOctreeLod0ModelsToParse = function(octree, aValue)
{
	// provisionally "aValue" can be anything.
	if (aValue === undefined)
	{ aValue = 0; }
	
	this.octreesLod0ModelsToParseMap.set(octree, aValue);
};

ParseQueue.prototype.eraseOctreeLod0ModelsToParse = function(octree)
{
	this.octreesLod0ModelsToParseMap.delete(octree);
};

ParseQueue.prototype.putOctreeLod2LegosToParse = function(octree, aValue)
{
	// provisionally "aValue" can be anything.
	if (aValue === undefined)
	{ aValue = 0; }
	
	this.octreesLod2LegosToParseMap.set(octree, aValue);
};

ParseQueue.prototype.eraseOctreeLod2LegosToParse = function(octree)
{
	this.octreesLod2LegosToParseMap.delete(octree);
};



