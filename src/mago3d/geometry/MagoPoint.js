'use strict';
/**
 * 중심점과 가로, 세로 길이를 가진 클래스
 * @exception {Error} Messages.CONSTRUCT_ERROR
 * 
 * @class MagoRectangle
 * @constructor
 */
var MagoPoint = function(position, style) 
{
	MagoRenderable.call(this);
	if (!(this instanceof MagoPoint)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	/**
	 * Minimum coord of this rectangle
	 * @type {GeographicCoord}
	 */
	this.geoCoord;
    
	this.setPosition(position);
};

MagoPoint.prototype = Object.create(MagoRenderable.prototype);
MagoPoint.prototype.constructor = MagoPoint;

/**
 * set position
 * @param {object} position
 */
MagoPoint.prototype.setPosition = function(position) 
{
	if (!position)
	{ return; } // error.

    
};