
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

	this.outer; // one vertexList.
	this.inners; // vertexLists array.
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns vertexList
 */
Profile.prototype.getOuter = function() 
{
	if (this.outer === undefined)
	{ this.outer = new VertexList(); }
	
	return this.outer;
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns vertexList
 */
Profile.prototype.newInner = function() 
{
	if (this.inners === undefined)
	{ this.inners = []; }
	
	var innerVertexList = new VertexList();
	this.inners.push(innerVertexList);
	
	return innerVertexList;
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns vertexList
 */
Profile.prototype.deleteObjects = function() 
{
	if (this.outer)
	{
		this.outer.deleteObjects();
		this.outer = undefined;
	}

	if (this.inners)
	{
		var innersCount = this.inners.length;
		for (var i=0; i<innersCount; i++)
		{
			this.inners[i].deleteObjects();
			this.inners[i] = undefined;
		}
		this.inners = undefined;
	}
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns vertexList
 */
Profile.prototype.copyFrom = function(profileRef) 
{
	// outer vertex list.
	if (profileRef.outer)
	{
		if (this.outer === undefined)
		{ this.outer = new VertexList(); }
		
		this.outer.copyFrom(profileRef.outer);
	}
	
	// inner vertex lists.
	if (profileRef.inners && profileRef.inners.length > 0)
	{
		if (this.inners === undefined)
		{ this.inners = []; }
		
		var innersCount = profileRef.inners.length;
		var myInner;
		for (var i=0; i<innersCount; i++)
		{
			myInner = this.newInner();
			myInner.copyFrom(profileRef.inners[i]);
		}
	}
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns vertexList
 */
Profile.prototype.getSurfaceOuterConvex = function(resultSurface) 
{
	// this function return a face made by convex outer.
	if (this.outer === undefined)
	{ return; }
	
	var vertex;
	var outerVertexCount = this.outer.getVertexCount();
	for (var i=0; i<outerVertexCount; i++)
	{
		vertex = this.outer.getVertex(i);
		
	}
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns vertexList
 */
Profile.prototype.getSurface = function(resultSurface) 
{
	
};














