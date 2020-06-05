'use strict';
/**
 * 
 * @exception {Error} Messages.CONSTRUCT_ERROR
 * 
 * @class MagoGeometry. abstract class
 * @constructor
 * @abstract
 * 
 * @extends MagoRenderable
 */
var MagoGeometry = function(position, style) 
{

	MagoRenderable.call(this);
	if (!(this instanceof MagoGeometry)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this.setPosition(position);
	this.style = {};

	if (style)
	{ this.style = style; }
};
MagoGeometry.prototype = Object.create(MagoRenderable.prototype);
MagoGeometry.prototype.constructor = MagoGeometry;

/**
 * set geometry position
 * @abstract
 * @param {MagoGeometry~MagoGeometryPosition} position
 */
MagoGeometry.prototype.setPosition = function(position) 
{
	return abstract();
};

/**
 * set geometry style, if this geometry has been renderd, init use magomanager.
 * @param {MagoGeometryStyle} style
 * @param {MagoManager} magoManager
 */
MagoGeometry.prototype.setStyle = function(style, magoManager) 
{
	if (!style) 
	{
		throw new Error(Messages.REQUIRED_EMPTY_ERROR('style'));
	}

	if (magoManager && magoManager instanceof MagoManager) 
	{
		this.init(magoManager);
	}

	this.style = style;
};