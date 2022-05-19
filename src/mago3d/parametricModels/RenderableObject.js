'use strict';

/**
 * RenderableObject geometry.
 * This class replaces parametricObjects. Used to created custom parametricObject on fly.
 * @class RenderableObject
 */
var RenderableObject = function(options) 
{
	MagoRenderable.call(this);
	if (!(this instanceof RenderableObject)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	// See MagoRenderable's members.
	this.setDirty(false);

};
RenderableObject.prototype = Object.create(MagoRenderable.prototype);
RenderableObject.prototype.constructor = RenderableObject;

RenderableObject.prototype.makeMesh = function() 
{
	return;
};