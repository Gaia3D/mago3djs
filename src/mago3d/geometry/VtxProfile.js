'use strict';
/**
* 어떤 일을 하고 있습니까?
* @class VtxProfile
*/
var VtxProfile = function() 
{
	if (!(this instanceof VtxProfile)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this.outerVtxRing;
	this.innerVtxRingsList;
};

VtxProfile.prototype.getInnerVtxRingsCount = function()
{
	if (this.innerVtxRingsList === undefined || this.innerVtxRingsList.getRingsCount === 0)
	{ return 0; }
	
	return this.innerVtxRingsList.getVtxRingsCount();
};

VtxProfile.prototype.getInnerVtxRing = function(idx)
{
	if (this.innerVtxRingsList === undefined || this.innerVtxRingsList.getRingsCount === 0)
	{ return undefined; }
	
	return this.innerVtxRingsList.getVtxRing(idx);
};

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

VtxProfile.prototype.translate = function(dx, dy, dz)
{
	if (this.outerVtxRing !== undefined)
	{ this.outerVtxRing.translate(dx, dy, dz); }
	
	if (this.innerVtxRingsList !== undefined)
	{ this.innerVtxRingsList.translate(dx, dy, dz); }
};

VtxProfile.prototype.transformPointsByMatrix4 = function(tMat4)
{
	if (this.outerVtxRing !== undefined)
	{ this.outerVtxRing.transformPointsByMatrix4(tMat4); }
	
	if (this.innerVtxRingsList !== undefined)
	{ this.innerVtxRingsList.transformPointsByMatrix4(tMat4); }
};

VtxProfile.prototype.getProjectedProfile2D = function(resultProfile2d)
{
	// Note: this makes a projected profile2d conformed by polyLines2D.***
	// This function is used when necessary to tessellate this vtxProfile.***
	
	if (this.outerVtxRing === undefined)
	{ return resultProfile2d; }
	
	// 1rst, calculate the normal of this vtxProfile. Use the this.outerVtxRing.***
	var normal = this.outerVtxRing.calculatePlaneNormal(undefined);
	
	if (normal === undefined)
	{ return resultProfile2d; }
	
	if (resultProfile2d === undefined)
	{ resultProfile2d = new Profile2D(); }
	
	// OuterVtxRing.***
	resultProfile2d.outerRing = this.outerVtxRing.getProjectedPolyLineBasedRing2D(resultProfile2d.outerRing, normal);
	
	// InnerVtxRings.***
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

VtxProfile.prototype.makeByPoints3DArray = function(outerPoints3dArray, innerPoints3dArrayArray)
{
	if (outerPoints3dArray === undefined)
	{ return; }
	
	// outer.***************************************
	if (this.outerVtxRing === undefined)
	{ this.outerVtxRing = new VtxRing(); }

	this.outerVtxRing.makeByPoints3DArray(outerPoints3dArray);
	
	// inners.***************************************
	// todo:
};

VtxProfile.prototype.makeByProfile2D = function(profile2d)
{
	if (profile2d === undefined || profile2d.outerRing === undefined)
	{ return undefined; }
	
	var outerRing = profile2d.outerRing;
	if (outerRing.polygon === undefined)
	{ outerRing.makePolygon(); }
	
	// outer.***************************************
	if (this.outerVtxRing === undefined)
	{ this.outerVtxRing = new VtxRing(); }
	
	var z = 0;
	var outerPolygon = outerRing.polygon;
	var point2dList = outerPolygon.point2dList;
	this.outerVtxRing.makeByPoint2DList(point2dList, z);

	// inners.***************************************
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

VtxProfile.prototype.getAllVertices = function(resultVerticesArray)
{
	if (this.outerVtxRing !== undefined)
	{ this.outerVtxRing.getAllVertices(resultVerticesArray); }
	
	if (this.innerVtxRingsList !== undefined)
	{ this.innerVtxRingsList.getAllVertices(resultVerticesArray); }
	
	return resultVerticesArray;
};



















































