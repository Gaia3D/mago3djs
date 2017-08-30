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

	this.octreesLod0ReferencesToParseArray = [];
	this.octreesLod0ModelsToParseArray = [];
	this.octreesLod2LegosToParseArray = [];
	this.neoBuildingsHeaderToParseArray = [];
};