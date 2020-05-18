'use strict';
/**
 * vertex profile. consist of outer Vertex ring and inner Vertex ring list.
 * @exception {Error} Messages.CONSTRUCT_ERROR
 * 
 * @class VtxProfile
 * @constructor
 * 
 * @see VtxRing
 */
var VtxProfile = function() 
{
	if (!(this instanceof VtxProfile)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	/**
	 * outer VtxRing
	 * @type {VtxRing}
	 */
	this.outerVtxRing;

	/**
	 * inner VtxRingList
	 * @type {VtxRingList}
	 */
	this.innerVtxRingsList;
};

/**
 * delete all vertex.
 */
VtxProfile.prototype.deleteObjects = function()
{
	if (this.outerVtxRing !== undefined)
	{
		this.outerVtxRing.deleteObjects();
		this.outerVtxRing = undefined;
	}
	
	if (this.innerVtxRingsList !== undefined)
	{
		this.innerVtxRingsList.deleteObjects();
		this.innerVtxRingsList = undefined;
	}
};

/**
 * get inner vertex ring's count
 * @returns {Number} 
 */
VtxProfile.prototype.getInnerVtxRingsCount = function()
{
	if (this.innerVtxRingsList === undefined || this.innerVtxRingsList.getRingsCount === 0)
	{ return 0; }
	
	return this.innerVtxRingsList.getVtxRingsCount();
};

/**
 * get inner vertex ring
 * @param {Number} idx
 * @returns {VtxRing} 
 */
VtxProfile.prototype.getInnerVtxRing = function(idx)
{
	if (this.innerVtxRingsList === undefined || this.innerVtxRingsList.getRingsCount === 0)
	{ return undefined; }
	
	return this.innerVtxRingsList.getVtxRing(idx);
};

/**
 * set vertex index in list
 * 
 * @see VertexList#setIdxInList
 * @see VtxRingList#setVerticesIdxInList maybe error.
 */
VtxProfile.prototype.setVerticesIdxInList = function()
{
	if (this.outerVtxRing && this.outerVtxRing.vertexList)
	{
		this.outerVtxRing.vertexList.setIdxInList();
	}
	
	if (this.innerVtxRingsList)
	{
		this.innerVtxRingsList.setVerticesIdxInList();
	}
};

/**
 * vertex profile copy from another vertex profile.
 * @param {VtxProfile} vtxProfile
 */
VtxProfile.prototype.copyFrom = function(vtxProfile)
{
	if (vtxProfile.outerVtxRing)
	{
		if (this.outerVtxRing === undefined)
		{ this.outerVtxRing = new VtxRing(); }
		
		this.outerVtxRing.copyFrom(vtxProfile.outerVtxRing);
	}
	
	if (vtxProfile.innerVtxRingsList)
	{
		if (this.innerVtxRingsList === undefined)
		{ this.innerVtxRingsList = new VtxRingsList(); }
		
		this.innerVtxRingsList.copyFrom(vtxProfile.innerVtxRingsList);
	}
};

/**
 * vertex point translate.
 * @param {Number} dx
 * @param {Number} dy
 * @param {Number} dz
 * @see Point3D#add
 */
VtxProfile.prototype.translate = function(dx, dy, dz)
{
	if (this.outerVtxRing !== undefined)
	{ this.outerVtxRing.translate(dx, dy, dz); }
	
	if (this.innerVtxRingsList !== undefined)
	{ this.innerVtxRingsList.translate(dx, dy, dz); }
};

/**
 * Rotates this VtxProfile specified angle by "angDeg" in (axisX, axisY, axisZ) axis.
 * @param {Number} angDeg Angle in degrees to rotate this VtxProfile.
 * @param {Number} axisX X component of the rotation axis.
 * @param {Number} axisY Y component of the rotation axis.
 * @param {Number} axisZ Z component of the rotation axis.
 */
VtxProfile.prototype.rotate = function(angDeg, axisX, axisY, axisZ)
{
	var rotMat = new Matrix4();
	var quaternion = new Quaternion();
	
	// Note: the axisX, axisY, axisZ must be unitary, but to be safe process, force rotationAxis to be unitary.*** 
	var rotAxis = new Point3D(axisX, axisY, axisZ);
	rotAxis.unitary();

	// calculate rotation.
	quaternion.rotationAngDeg(angDeg, rotAxis.x, rotAxis.y, rotAxis.z);
	rotMat.rotationByQuaternion(quaternion);
	
	this.transformPointsByMatrix4(rotMat);
};

/**
 * vertex point transform by matrix4
 * @param {Matrix4} tMat4
 * @see Matrix4#transformPoint3D
 */
VtxProfile.prototype.transformPointsByMatrix4 = function(tMat4)
{
	if (this.outerVtxRing !== undefined)
	{ this.outerVtxRing.transformPointsByMatrix4(tMat4); }
	
	if (this.innerVtxRingsList !== undefined)
	{ this.innerVtxRingsList.transformPointsByMatrix4(tMat4); }
};

/**
 * get projected 2d profile.
 * Note: this makes a projected profile2d ONLY conformed by polyLines2D.
 * This function is used when necessary to tessellate this vtxProfile.
 * @param {Profile2D|undefined} resultProfile2d if undefined, set new Profile2D instance.
 * @returns {Profile2D} when this.outerVtxRing is undefined or normal is undefined. return original resultProfile2d.
 * 
 * @see VtxRing#calculatePlaneNormal
 * @see VtxRing#getProjectedPolyLineBasedRing2D
 */
VtxProfile.prototype.getProjectedProfile2D = function(resultProfile2d)
{
	if (this.outerVtxRing === undefined)
	{ return resultProfile2d; }
	
	// 1rst, calculate the normal of this vtxProfile. Use the this.outerVtxRing.
	// The normal is used co calculate the bestFace to project.
	var normal = this.outerVtxRing.calculatePlaneNormal(undefined);

	if (normal === undefined)
	{ return resultProfile2d; }
	
	if (resultProfile2d === undefined)
	{ resultProfile2d = new Profile2D(); }
	
	// OuterVtxRing.
	resultProfile2d.outerRing = this.outerVtxRing.getProjectedPolyLineBasedRing2D(resultProfile2d.outerRing, normal);
	
	// InnerVtxRings.
	if (this.innerVtxRingsList !== undefined)
	{
		var innerVtxRingsCount = this.innerVtxRingsList.getVtxRingsCount();
		var innerRingsList;
		if (innerVtxRingsCount > 0)
		{
			innerRingsList = resultProfile2d.getInnerRingsList();
		}
		
		for (var i=0; i<innerVtxRingsCount; i++)
		{
			var innerVtxRing = this.innerVtxRingsList.getVtxRing(i);
			var innerRing = innerVtxRing.getProjectedPolyLineBasedRing2D(undefined, normal);
			innerRingsList.addRing(innerRing);
		}
	}
	
	return resultProfile2d;
};

/**
 * use point3d array, set outerVtxRing's vertex list and indexrange.
 * @param {Array.<Point3D>} outerPoints3dArray Required.
 * @param {Array.<Array.<Point3D>>} innerPoints3dArrayArray deprecated.
 * 
 * @see VtxRing#makeByPoints3DArray
 */
VtxProfile.prototype.makeByPoints3DArray = function(outerPoints3dArray, innerPoints3dArrayArray)
{
	if (outerPoints3dArray === undefined)
	{ return; }
	
	// outer.
	if (this.outerVtxRing === undefined)
	{ this.outerVtxRing = new VtxRing(); }

	this.outerVtxRing.makeByPoints3DArray(outerPoints3dArray);
	
	// inners.
	// todo:
};

/**
 * use point3d array, update outerVtxRing's vertex list.
 * @param {Array.<Point3D>} point3dArray Required.
 * @param {Array.<Array.<Point3D>>} innerPoints3dArrayArray deprecated.
 * 
 * @see VtxRing#makeByPoints3DArray
 */
VtxProfile.prototype.updateByPoints3DArray = function(outerPoints3dArray, innerPoints3dArrayArray)
{
	if (outerPoints3dArray === undefined)
	{ return; }
	
	// outer.
	if (this.outerVtxRing === undefined)
	{ return; }

	this.outerVtxRing.updateByPoints3DArray(outerPoints3dArray);
	
	// inners.
	// todo:
};

/**
 * use Profile2D, make VtxProfile's outer vertex ring and inner vertex ring list. 
 * z is always 0.
 * @param {Profile2D} profile2d Required.
 * 
 * @see VtxRing#makeByPoint2DList
 */
VtxProfile.prototype.makeByProfile2D = function(profile2d)
{
	if (profile2d === undefined || profile2d.outerRing === undefined)
	{ return undefined; }
	
	var outerRing = profile2d.outerRing;
	if (outerRing.polygon === undefined)
	{ outerRing.makePolygon(); }
	
	// outer.
	if (this.outerVtxRing === undefined)
	{ this.outerVtxRing = new VtxRing(); }
	
	var z = 0;
	var outerPolygon = outerRing.polygon;
	var point2dList = outerPolygon.point2dList;
	this.outerVtxRing.makeByPoint2DList(point2dList, z);

	// inners.
	if (profile2d.innerRingsList === undefined)
	{ return; } 
	
	var innerRingsList = profile2d.innerRingsList;
	var innerRingsCount = innerRingsList.getRingsCount();
	
	if (innerRingsCount === 0)
	{ return; }
	
	if (this.innerVtxRingsList === undefined)
	{ this.innerVtxRingsList = new VtxRingsList(); }
	
	var innerRing;
	var innerPolygon;
	var innerVtxRing;
	
	for (var i=0; i<innerRingsCount; i++)
	{
		innerRing = innerRingsList.getRing(i);
		if (innerRing.polygon === undefined)
		{ innerRing.makePolygon(); }
		innerPolygon = innerRing.polygon;
		point2dList = innerPolygon.point2dList;
		
		innerVtxRing = this.innerVtxRingsList.newVtxRing();
		innerVtxRing.makeByPoint2DList(point2dList, z);
	}
};

/**
 * get all vertex in outer vertex ring and inner vertex ring list. 
 * @param {Array} resultVerticesArray
 * @returns {Array.<Vertex>|undefined}
 */
VtxProfile.prototype.getAllVertices = function(resultVerticesArray)
{
	if (this.outerVtxRing !== undefined)
	{ this.outerVtxRing.getAllVertices(resultVerticesArray); }
	
	if (this.innerVtxRingsList !== undefined)
	{ this.innerVtxRingsList.getAllVertices(resultVerticesArray); }
	
	return resultVerticesArray;
};

/**
 * get vertex intersected with plane. 
 * @static
 * @param {VtxProfile} vtxProfile if vtxProfile.outerVtxRing undefined, return resultvtxProfile.
 * @param {Plane} plane. 
 * @param {Point3D} projectionDirection projectionDirection must be unitary.
 * @param {VtxProfile} resultvtxProfile Optional. if undefined, set new VtxProfile instance.
 * @returns {VtxProfile} resultvtxProfile
 */
VtxProfile.getProjectedOntoPlane = function(vtxProfile, plane, projectionDirection, resultvtxProfile)
{
	if (vtxProfile.outerVtxRing === undefined)
	{ return resultvtxProfile; }
	
	if (resultvtxProfile === undefined)
	{ resultvtxProfile = new VtxProfile(); }
	
	// OuterVtxRing.
	resultvtxProfile.outerVtxRing = VtxRing.getProjectedOntoPlane(vtxProfile.outerVtxRing, plane, projectionDirection, resultvtxProfile.outerVtxRing);
				
	// InnerVtxRings.
	if (vtxProfile.innerVtxRingsList !== undefined)
	{
		resultvtxProfile.innerVtxRingsList = VtxRingsList.getProjectedOntoPlane(vtxProfile.innerVtxRingsList, plane, projectionDirection, resultvtxProfile.innerVtxRingsList);
	}
	
	return resultvtxProfile;
};



















































