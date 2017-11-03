
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
	
	this.profile; // class: VertexList. use as auxiliar.
	this.vertexMatrix; // class: VertexMatrix.
};

/**
 * 어떤 일을 하고 있습니까?
 */
ParametricMesh.prototype.extrude = function(profile, extrusionVector, extrusionDist, extrudeSegmentsCount) 
{
	if (this.vertexMatrix === undefined)
	{
		this.vertexMatrix = new VertexMatrix();
	}
	
	if (extrudeSegmentsCount === undefined)
	{ extrudeSegmentsCount = 1; }
	
	// reset the vertexMatrix.
	this.vertexMatrix.extrude(profile, extrusionVector, extrusionDist, extrudeSegmentsCount);
	
};