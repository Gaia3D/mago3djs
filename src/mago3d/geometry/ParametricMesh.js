
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
	
	this.profilesList; // class: ProfilesList.
	this.trianglesMatrix;
};

/**
 * 어떤 일을 하고 있습니까?
 */
ParametricMesh.prototype.extrude = function(profile, extrusionVector, extrusionDist, extrudeSegmentsCount) 
{
	if (this.profilesList === undefined)
	{
		this.profilesList = new ProfilesList();
	}
	
	if (extrudeSegmentsCount === undefined)
	{ extrudeSegmentsCount = 1; }
	
	// 1rst, make a profilesList extrude.
	this.profilesList.deleteObjects(); // init.
	this.profilesList.extrude(profile, extrusionVector, extrusionDist, extrudeSegmentsCount);
	
	// now, make the bottomCap, topCap, and lateral triangles.
	this.trianglesMatrix = new TrianglesMatrix();
	
	
};