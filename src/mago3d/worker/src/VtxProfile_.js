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
var VtxProfile_ = function() 
{

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

VtxProfile_.prototype.getAllVertices = function(resultVerticesArray)
{
	if (this.outerVtxRing !== undefined)
	{ this.outerVtxRing.getAllVertices(resultVerticesArray); }
	
	if (this.innerVtxRingsList !== undefined)
	{ this.innerVtxRingsList.getAllVertices(resultVerticesArray); }
	
	return resultVerticesArray;
};

VtxProfile_.prototype.getInnerVtxRingsCount = function()
{
	if (this.innerVtxRingsList === undefined || this.innerVtxRingsList.getRingsCount === 0)
	{ return 0; }
	
	return this.innerVtxRingsList.getVtxRingsCount();
};

VtxProfile_.prototype.getProjectedProfile2D = function(resultProfile2d)
{
	if (this.outerVtxRing === undefined)
	{ return resultProfile2d; }
	
	// 1rst, calculate the normal of this vtxProfile. Use the this.outerVtxRing.
	// The normal is used co calculate the bestFace to project.
	var normal = this.outerVtxRing.calculatePlaneNormal(undefined);

	if (normal === undefined)
	{ return resultProfile2d; }
	
	if (resultProfile2d === undefined)
	{ resultProfile2d = new Profile2D_(); }
	
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

VtxProfile_.prototype.calculateConvexFacesIndicesData = function(resultConvexFacesIndicesData)
{
	var profile2d = this.getProjectedProfile2D(undefined);
	resultConvexFacesIndicesData = profile2d.getConvexFacesIndicesData(resultConvexFacesIndicesData);
	return resultConvexFacesIndicesData;
};

VtxProfile_.prototype.makeByPoints3DArray = function(outerPoints3dArray, innerPoints3dArrayArray, options)
{
	if (outerPoints3dArray === undefined)
	{ return; }

	var outerRingOptions;
	if (options)
	{
		if (options.outerVtxRingOptions)
		{ outerRingOptions = options.outerVtxRingOptions; }
	}
	
	// outer.
	if (this.outerVtxRing === undefined)
	{ this.outerVtxRing = new VtxRing_(); }

	this.outerVtxRing.makeByPoints3DArray(outerPoints3dArray, outerRingOptions);
	
	// inners.
	// todo:
};