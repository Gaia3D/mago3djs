'use strict';

/**
 * RenderableObject geometry.
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