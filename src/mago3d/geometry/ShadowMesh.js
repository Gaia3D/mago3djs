'use strict';

/**
 * This draws the outer shell of the feature as triangular mesh
 * @class ShadowMesh
 */
var ShadowMesh = function() 
{
	if (!(this instanceof ShadowMesh)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this.name;
	this.id;
	this.mesh;
};