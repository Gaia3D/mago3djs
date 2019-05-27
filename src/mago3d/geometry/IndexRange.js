'use strict';

/**
 * index range. consist of two index. start and end.
 * @exception {Error} Messages.CONSTRUCT_ERROR
 * 
 * @class IndexRange
 */
var IndexRange = function() 
{
	if (!(this instanceof IndexRange)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
	/**
	 * start index
	 * @type {Number}
	 */
	this.strIdx;

	/**
	 * last index
	 * @type {Number}
	 */
	this.endIdx;
};

/**
 * make indexRange copy from another indexRange.
 * @param {IndexRange} indexRange 
 */
IndexRange.prototype.copyFrom = function(indexRange)
{
	if (indexRange === undefined)
	{ return; }
	
	this.strIdx = indexRange.strIdx;
	this.endIdx = indexRange.endIdx;
};

/**
 * indexRange init.
 * all member set undifined;
 */
IndexRange.prototype.deleteObjects = function()
{
	this.strIdx = undefined;
	this.endIdx = undefined;
};