/**
* 어떤 일을 하고 있습니까?
* @class Point2D
*/
var Point2D = function() 
{
	if (!(this instanceof Point2D)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this.x = 0.0;
	this.y = 0.0;
};

/**
 * 포인트값 삭제
 * 어떤 일을 하고 있습니까?
 */
Point2D.prototype.deleteObjects = function() 
{
	this.x = undefined;
	this.y = undefined;
};

/**
 * 포인트값 삭제
 * 어떤 일을 하고 있습니까?
 */
Point2D.prototype.copyFrom = function(point2d) 
{
	this.x = point2d.x;
	this.y = point2d.y;
};