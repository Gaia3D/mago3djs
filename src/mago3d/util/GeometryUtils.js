'use strict';
/**
* Utils for geometry.
* @class GeometryUtils
*/
var GeometryUtils = function() 
{
	if (!(this instanceof GeometryUtils)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
};

/**
 * Given an idx, this function returns the next idx of an array.
 * @param {Number} currIdx 
 * @param {Number} pointsCount The points count of the array.
 * @Return {Number} The next idx.
 */
GeometryUtils.getNextIdx = function(currIdx, pointsCount)
{
	if (currIdx === pointsCount - 1)
	{ return 0; }
	else
	{ return currIdx + 1; }
};

/**
 * Given an idx, this function returns the previous idx of an array.
 * @param {Number} currIdx 
 * @param {Number} pointsCount The points count of the array.
 * @Return {Number} The previous idx.
 */
GeometryUtils.getPrevIdx = function(currIdx, pointsCount)
{
	if (currIdx === 0)
	{ return pointsCount - 1; }
	else
	{ return currIdx - 1; }
};

































