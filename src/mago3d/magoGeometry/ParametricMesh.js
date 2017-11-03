
'use strict';


/**
 * 어떤 일을 하고 있습니까?
 * @class ParametricMesh
 */
var ParametricMesh = function() 
{
	if (!(this instanceof ParametricMesh)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
	this.vertexMatrix;
};