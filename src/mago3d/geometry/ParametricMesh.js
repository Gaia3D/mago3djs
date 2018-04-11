
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
	this.profile; // class: Profile. is a 2d object.***
	this.vboKeyContainer;//VBOVertexIdxCacheKeyContainer.***
};

/**
 * 어떤 일을 하고 있습니까?
 */
ParametricMesh.prototype.deleteObjects = function() 
{
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

	// must separate vbo groups by surfaces.***
	var surfaceIndependentMesh = this.getSurfaceIndependentMesh(undefined);
	surfaceIndependentMesh.getVbo(resultVBOCacheKeys);
	
	return resultVBOCacheKeys;
};

ParametricMesh.prototype.getSurfaceIndependentMesh = function(resultMesh, bIncludeBottomCap, bIncludeTopCap)
{
	if(resultMesh === undefined)
		resultMesh = new Mesh();

	// must separate vbo groups by surfaces.***
	var mesh = this.vtxProfilesList.getMesh(undefined, bIncludeBottomCap, bIncludeTopCap);
	resultMesh = mesh.getCopySurfaceIndependetMesh(undefined);
	resultMesh.calculateVerticesNormals();
	
	return resultMesh;
};

/**
 * 어떤 일을 하고 있습니까?
 */
ParametricMesh.prototype.revolve = function(profile, revolveAngDeg, revolveSegmentsCount, revolveSegment2d) 
{
	if(profile === undefined)
		return undefined;
	
	if(this.vtxProfilesList === undefined)
		this.vtxProfilesList = new VtxProfilesList();
	
	// if want caps in the extruded mesh, must calculate "ConvexFacesIndicesData" of the profile before creating vtxProfiles.***
	this.vtxProfilesList.convexFacesIndicesData = profile.getConvexFacesIndicesData(undefined);
	
	// create vtxProfiles.***
	// make the base-vtxProfile.***
	var baseVtxProfile = this.vtxProfilesList.newVtxProfile();
	baseVtxProfile.makeByProfile(profile);
	
	var increAngDeg = revolveAngDeg/revolveSegmentsCount;
	
	// calculate the translation.***
	var line2d = revolveSegment2d.getLine();
	var origin2d = new Point2D(0,0);
	var translationVector = line2d.getProjectedPoint(origin2d);
	translationVector.inverse();
	
	var rotMat = new Matrix4();
	var quaternion = new Quaternion();
	var rotAxis2d = revolveSegment2d.getDirection();
	var rotAxis = new Point3D(rotAxis2d.x, rotAxis2d.y, 0);
	rotAxis.unitary();
	
	for(var i=0; i<revolveSegmentsCount; i++)
	{
		// calculate rotation.***
		quaternion.rotationAngDeg(increAngDeg*(i+1), rotAxis.x, rotAxis.y, rotAxis.z);
		rotMat.rotationByQuaternion(quaternion);
		
		// test top profile.***
		var nextVtxProfile = this.vtxProfilesList.newVtxProfile();
		nextVtxProfile.copyFrom(baseVtxProfile);
		nextVtxProfile.translate(translationVector.x, translationVector.y, 0);
		nextVtxProfile.transformPointsByMatrix4(rotMat);
		nextVtxProfile.translate(-translationVector.x, -translationVector.y, 0);
	}
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
	

	// if want caps in the extruded mesh, must calculate "ConvexFacesIndicesData" of the profile before creating vtxProfiles.***
	this.vtxProfilesList.convexFacesIndicesData = profile.getConvexFacesIndicesData(undefined);
	
	// create vtxProfiles.***
	// make the base-vtxProfile.***
	var baseVtxProfile = this.vtxProfilesList.newVtxProfile();
	baseVtxProfile.makeByProfile(profile);
	
	if(extrusionVector === undefined)
		extrusionVector = new Point3D(0, 0, 1);
	
	var increDist = extrusionDist/extrudeSegmentsCount;
	for(var i=0; i<extrudeSegmentsCount; i++)
	{
		// test with a 1 segment extrusion.***
		var nextVtxProfile = this.vtxProfilesList.newVtxProfile();
		nextVtxProfile.copyFrom(baseVtxProfile);
		nextVtxProfile.translate(0, 0, increDist*(i+1));
	}
};



































