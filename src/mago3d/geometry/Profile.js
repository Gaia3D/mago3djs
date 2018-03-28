
'use strict';

/**
 * 어떤 일을 하고 있습니까?
 * @class Profile
 */
var Profile = function() 
{
	if (!(this instanceof Profile)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this.outerRing; // one Ring. 
	this.innerRingsArray; // Rings array. 
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns vertexList
 */
Profile.prototype.newOuterRing = function() 
{
	if (this.outerRing === undefined)
	{ this.outerRing = new Ring(); }
	
	return this.outerRing;
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns vertexList
 */
Profile.prototype.newInnerRing = function() 
{
	if (this.innerRingsArray === undefined)
	{ this.innerRingsArray = []; }
	
	var innerRing = new Ring();
	this.innerRingsArray.push(innerRing);
	
	return innerRing;
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns vertexList
 */
Profile.prototype.deleteObjects = function() 
{
	if (this.outerRing)
	{
		this.outerRing.deleteObjects();
		this.outerRing = undefined;
	}

	if (this.innerRingsArray)
	{
		var innersCount = this.innerRingsArray.length;
		for (var i=0; i<innersCount; i++)
		{
			this.innerRingsArray[i].deleteObjects();
			this.innerRingsArray[i] = undefined;
		}
		this.innerRingsArray = undefined;
	}
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns vertexList
 */
Profile.prototype.tessellate = function(resultTrianglesIndices) 
{
	if(resultTrianglesIndices === undefined)
		resultTrianglesIndices = [];
	
	var innerRingsCount;
	if(this.innerRingsArray === undefined)
		innerRingsCount = 0;
	else
		innerRingsCount = this.innerRingsArray.length;
	
	// test.***
	// provisionally tessellate the outerRing.***
	
	
	return resultTrianglesIndices;
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns vertexList
 */
Profile.prototype.getVBO = function(resultVBOCacheKeys) 
{
	
};

















