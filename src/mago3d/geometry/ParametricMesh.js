
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
	
	this.vtxProfilesList; // class: VtxProfilesList.***
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

ParametricMesh.prototype.getVbo = function(resultVBOCacheKeys)
{
	if(resultVBOCacheKeys === undefined)
		resultVBOCacheKeys = new VBOVertexIdxCacheKey();
	
	
};

/**
 * 어떤 일을 하고 있습니까?
 */
ParametricMesh.prototype.extrude = function(profile, extrusionDist, extrudeSegmentsCount, extrusionVector) 
{
	if(profile === undefined || extrusionDist === undefined)
		return undefined;
	
	if(this.vtxProfilesList === undefined)
		this.vtxProfilesList = new VtxProfilesList();
	
	// make the base-vtxProfile.***
	var baseVtxProfile = this.vtxProfilesList.newVtxProfile();
	baseVtxProfile.makeByProfile(profile);
	
	if(extrusionVector === undefined)
		extrusionVector = new Point3D(0, 0, 1);
	
	// test with a 1 segment extrusion.***
	var nextVtxProfile = this.vtxProfilesList.newVtxProfile();
	nextVtxProfile.copyFrom(baseVtxProfile);
	nextVtxProfile.translate(0, 0, extrusionDist);
	
	// now make the triangles.***
	
	
	var hola = 0;
};



































