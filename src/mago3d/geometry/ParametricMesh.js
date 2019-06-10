
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
	
	this.vtxProfilesList; // class: VtxProfilesList.
	this.profile; // class: Profile. is a 2d object.
	this.vboKeyContainer; // class: VBOVertexIdxCacheKeyContainer.
	this.vboKeyContainerEdges; // class: VBOVertexIdxCacheKeyContainer.
};

/**
 * Delete the data of this.profile
 */
ParametricMesh.prototype.deleteObjects = function() 
{
	if (this.profile)
	{ this.profile.deleteObjects(); }
	
	this.profile = undefined;
};

/**
 * Get the vbo key container of this feature
 * @returns {VBOVertexIdxCacheKeysContaier}	
 */
ParametricMesh.prototype.getVboKeysContainer = function()
{
	return this.vboKeyContainer;
};

/**
 * Get mesh of this instance
 * @param {Mesh} resultMesh
 * @param {Boolean} bIncludeBottomCap Check whether include the bottom of this revolved mesh ex) pipeline doesn't have bottom and top cap
 * @param {Boolean} bIncludeTopCap Check whether include the top of this revolved mesh ex) pipeline doesn't have bottom and top cap
 * @returns {Mesh}
 */
ParametricMesh.prototype.getMesh = function(resultMesh, bIncludeBottomCap, bIncludeTopCap)
{
	if (resultMesh === undefined)
	{ resultMesh = new Mesh(); }

	// must separate vbo groups by surfaces.
	resultMesh = this.vtxProfilesList.getMesh(resultMesh, bIncludeBottomCap, bIncludeTopCap);
	resultMesh.calculateVerticesNormals();
	
	return resultMesh;
};

/**
 * Change the unified mesh to the group of surfaces for drawing the mesh with WebGL
 * @param {Mesh} resultMesh
 * @param {Boolean} bIncludeBottomCap Check whether include the bottom of this revolved mesh ex) pipeline doesn't have bottom and top cap
 * @param {Boolean} bIncludeTopCap Check whether include the top of this revolved mesh ex) pipeline doesn't have bottom and top cap
 * 
 */
ParametricMesh.prototype.getSurfaceIndependentMesh = function(resultMesh, bIncludeBottomCap, bIncludeTopCap)
{
	if (resultMesh === undefined)
	{ resultMesh = new Mesh(); }

	// must separate vbo groups by surfaces.
	this.mesh = this.vtxProfilesList.getMesh(undefined, bIncludeBottomCap, bIncludeTopCap);
	resultMesh = this.mesh.getCopySurfaceIndependentMesh(resultMesh);
	resultMesh.calculateVerticesNormals();
	
	return resultMesh;
};

/**
 * Extrude the profile with curved direction
 * @param profile2d the profile which will be extruede
 * @param revolveAngDeg the angle of the vector used for extruding
 * @param revolveSegmentsCount the number of the segements which constitue of the extruded feature
 * @param revolveSegment2d rotating shaft
 * 
 */
ParametricMesh.prototype.revolve = function(profile2d, revolveAngDeg, revolveSegmentsCount, revolveSegment2d) 
{
	// Note: move this function into "VtxProfilesList" class.
	if (profile2d === undefined)
	{ return undefined; }
	
	if (this.vtxProfilesList === undefined)
	{ this.vtxProfilesList = new VtxProfilesList(); }
	
	// if want caps in the extruded mesh, must calculate "ConvexFacesIndicesData" of the profile2d before creating vtxProfiles.
	this.vtxProfilesList.convexFacesIndicesData = profile2d.getConvexFacesIndicesData(undefined);
	//profile2d.checkNormals();
	// create vtxProfiles.
	// make the base-vtxProfile.
	var baseVtxProfile = this.vtxProfilesList.newVtxProfile();
	baseVtxProfile.makeByProfile2D(profile2d);
	
	var increAngDeg = revolveAngDeg/revolveSegmentsCount;
	
	// calculate the translation.
	var line2d = revolveSegment2d.getLine();
	var origin2d = new Point2D(0, 0);
	var translationVector = line2d.getProjectedPoint(origin2d);
	translationVector.inverse();
	
	var rotMat = new Matrix4();
	var quaternion = new Quaternion();
	var rotAxis2d = revolveSegment2d.getDirection();
	var rotAxis = new Point3D(rotAxis2d.x, rotAxis2d.y, 0);
	rotAxis.unitary();
	
	for (var i=0; i<revolveSegmentsCount; i++)
	{
		// calculate rotation.
		quaternion.rotationAngDeg(increAngDeg*(i+1), rotAxis.x, rotAxis.y, rotAxis.z);
		rotMat.rotationByQuaternion(quaternion);
		
		// test top profile.
		var nextVtxProfile = this.vtxProfilesList.newVtxProfile();
		nextVtxProfile.copyFrom(baseVtxProfile);
		nextVtxProfile.translate(translationVector.x, translationVector.y, 0);
		nextVtxProfile.transformPointsByMatrix4(rotMat);
		nextVtxProfile.translate(-translationVector.x, -translationVector.y, 0);
	}
};

/**
 * Make new instance which consist of the part of the extruded segment(The number of the segments is extrudeSegmentsCount) by extruding profile2D
 * @param {profile2D} profile2d the feature which will be extruded
 * @param {Number} extrusionDist the height of extruded feature
 * @param {Number} extrudeSegmentsCount the number of the segement which consist of extruded feature
 * @param {Point3D} extrusionVector the direction of extrusion
 */
ParametricMesh.prototype.extrude = function(profile2d, extrusionDist, extrudeSegmentsCount, extrusionVector) 
{
	// Note: move this function into "VtxProfilesList" class.
	if (profile2d === undefined || extrusionDist === undefined)
	{ return undefined; }
	
	if (this.vtxProfilesList === undefined)
	{ this.vtxProfilesList = new VtxProfilesList(); }
	

	// if want caps in the extruded mesh, must calculate "ConvexFacesIndicesData" of the profile2d before creating vtxProfiles.
	this.vtxProfilesList.convexFacesIndicesData = profile2d.getConvexFacesIndicesData(undefined);
	
	// create vtxProfiles.
	// make the base-vtxProfile.
	var baseVtxProfile = this.vtxProfilesList.newVtxProfile();
	baseVtxProfile.makeByProfile2D(profile2d);
	
	if (extrusionVector === undefined)
	{ extrusionVector = new Point3D(0, 0, 1); }
	
	var increDist = extrusionDist/extrudeSegmentsCount;
	for (var i=0; i<extrudeSegmentsCount; i++)
	{
		// test with a 1 segment extrusion.
		var nextVtxProfile = this.vtxProfilesList.newVtxProfile();
		nextVtxProfile.copyFrom(baseVtxProfile);
		nextVtxProfile.translate(0, 0, increDist*(i+1));
	}
};



































