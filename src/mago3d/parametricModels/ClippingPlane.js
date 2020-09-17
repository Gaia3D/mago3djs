'use strict';

/**
 * ClippingPlane geometry.
 * @class ClippingPlane
 */
var ClippingPlane = function(options) 
{
	MagoRenderable.call(this);
	if (!(this instanceof ClippingPlane)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this.plane;

};

ClippingPlane.prototype = Object.create(MagoRenderable.prototype);
ClippingPlane.prototype.constructor = ClippingPlane;