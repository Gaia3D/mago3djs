'use strict';

/**
 * index range. consist of two vertex index. start and end.
 * 특정 geometry의 시작vertex와 끝vertex의 index를 저장
 * @exception {Error} Messages.CONSTRUCT_ERROR
 * 
 * @class IndexRange
 * @constructor
 */
var IndexRange_ = function() 
{
	
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
IndexRange_.prototype.copyFrom = function(indexRange)
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
IndexRange_.prototype.deleteObjects = function()
{
	this.strIdx = undefined;
	this.endIdx = undefined;
};