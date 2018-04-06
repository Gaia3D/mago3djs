'use strict';
/**
* 어떤 일을 하고 있습니까?
* @class VtxProfilesList
*/
var VtxProfilesList = function(x, y) 
{
	if (!(this instanceof VtxProfilesList)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this.vtxProfilesArray;
};

VtxProfilesList.prototype.newVtxProfile = function()
{
	if(this.vtxProfilesArray === undefined)
		this.vtxProfilesArray = [];
	
	var vtxProfile = new VtxProfile();
	this.vtxProfilesArray.push(vtxProfile);
	return vtxProfile;
};

VtxProfilesList.prototype.getVtxProfilesCount = function()
{
	if(this.vtxProfilesArray === undefined)
		return 0;
	
	return this.vtxProfilesArray.lenght;
};

VtxProfilesList.prototype.getVtxProfile = function(idx)
{
	if(this.vtxProfilesArray === undefined)
		return undefined;
	
	return this.vtxProfilesArray[idx];
};

VtxProfilesList.prototype.getLateralTrianles = function(resultTrianglesLists)
{
	if(this.vtxProfilesArray === undefined)
		return resultTriangles;
	
	// outerLateral.***************************************************
	var vtxProfilesCount = this.getVtxProfilesCount();
	
	if(vtxProfilesCount < 2)
		return resultTriangles;
		
	var bottomVtxProfile, topVtxProfile;

	bottomVtxProfile = this.getVtxProfile(0);
	var outerVtxRing = bottomVtxProfile.outerVtxRing;
	var elemIndexRange;
	var bottomVtxRing, topVtxRing;
	var elemsCount = outerVtxRing.elemsIndexRangesArray.length;
	
	for(var i=0; i<elemsCount; i++)
	{
		elemIndexRange = outerVtxRing.getElementIndexRange(i);
		for(var j=0; j<vtxProfilesCount-1; j++)
		{
			bottomVtxProfile = this.getVtxProfile(j);
			topVtxProfile = this.getVtxProfile(j+1);
			
			bottomVtxRing = bottomVtxProfile.outerVtxRing;
			topVtxRing = topVtxProfile.outerVtxRing;
			
			
		}
		
	}

};

VtxProfilesList.prototype.getLateralTrianlesOfElement = function(elemIndexRange)
{
	
};





















































