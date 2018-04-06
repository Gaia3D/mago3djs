'use strict';
/**
* 어떤 일을 하고 있습니까?
* @class VtxProfile
*/
var VtxProfile = function(x, y) 
{
	if (!(this instanceof VtxProfile)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this.outerVtxRing;
	this.innerVtxRingsList;
	
};

VtxProfile.prototype.copyFrom = function(vtxProfile)
{
	if(vtxProfile.outerVtxRing)
	{
		if(this.outerVtxRing === undefined)
			this.outerVtxRing = new VtxRing();
		
		this.outerVtxRing.copyFrom(vtxProfile.outerVtxRing);
	}
	
	if(vtxProfile.innerVtxRingsList)
	{
		if(this.innerVtxRingsList === undefined)
			this.innerVtxRingsList = new VtxRingsList();
		
		this.innerVtxRingsList.copyFrom(vtxProfile.innerVtxRingsList);
	}
};

VtxProfile.prototype.translate = function(dx, dy, dz)
{
	if(this.outerVtxRing !== undefined)
		this.outerVtxRing.translate(dx, dy, dz);
	
	if(this.innerVtxRingsList !== undefined)
		this.innerVtxRingsList.translate(dx, dy, dz);
};

VtxProfile.prototype.makeByProfile = function(profile)
{
	if(profile === undefined || profile.outerRing === undefined)
		return undefined;
	
	var outerRing = profile.outerRing;
	if(outerRing.polygon === undefined)
		outerRing.makePolygon();
	
	// outer.***************************************
	if(this.outerVtxRing === undefined)
		this.outerVtxRing = new VtxRing();
	
	var z = 0;
	var outerPolygon = outerRing.polygon;
	var point2dList = outerPolygon.point2dList;
	this.outerVtxRing.makeByPoint2DList(point2dList, z);

	// inners.***************************************
	if(profile.innerRingsList === undefined)
		return; 
	
	var innerRingsList = profile.innerRingsList;
	var innerRingsCount = innerRingsList.getRingsCount();
	
	if(innerRingsCount === 0)
		return;
	
	if(this.innerVtxRingsList === undefined)
		this.innerVtxRingsList = new VtxRingsList();
	
	var innerRing;
	var innerPolygon;
	var innerVtxRing;
	
	for(var i=0; i<innerRingsCount; i++)
	{
		innerRing = innerRingsList.getRing(i);
		if(innerRing.polygon === undefined)
		innerRing.makePolygon();
		innerPolygon = innerRing.polygon;
		point2dList = innerPolygon.point2dList;
		
		innerVtxRing = this.innerVtxRingsList.newVtxRing();
		innerVtxRing.makeByPoint2DList(point2dList, z);
	}
};



















































