'use strict';

/**
 * 어떤 일을 하고 있습니까?
 * @class IndexRange
 */
var IndexRange = function() 
{
	if (!(this instanceof IndexRange)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	this.strIdx;
	this.endIdx;
};

IndexRange.prototype.copyFrom = function(indexRange)
{
	if (indexRange === undefined)
	{ return; }
	
	this.strIdx = indexRange.strIdx;
	this.endIdx = indexRange.endIdx;
};