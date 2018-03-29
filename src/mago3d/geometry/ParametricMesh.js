
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
	
	this.profilesList; // class: ProfilesList
	this.trianglesMatrix;
	this.profile;
	this.vboKeyContainer;//VBOVertexIdxCacheKey
	this.bbox;
};

/**
 * 어떤 일을 하고 있습니까?
 */
ParametricMesh.prototype.deleteObjects = function() 
{
	if(this.profilesList)
		this.profilesList.deleteObjects();
	
	this.profilesList = undefined;
	
	if(this.trianglesMatrix)
		this.trianglesMatrix.deleteObjects();
	
	this.trianglesMatrix = undefined;
	
	if(this.profile)
		this.profile.deleteObjects();
	
	this.profile = undefined;
};

ParametricMesh.prototype.getVboKeysContainer = function()
{
	return this.vboKeyContainer;
};

/**
 * 어떤 일을 하고 있습니까?
 */
ParametricMesh.prototype.extrude = function(profile, extrusionVector, extrusionDist, extrudeSegmentsCount) 
{
	
	
	// now, make the bottomCap, topCap, and lateral triangles.
	this.trianglesMatrix = new TrianglesMatrix();
	
	
};



































