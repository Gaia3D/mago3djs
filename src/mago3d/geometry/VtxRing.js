'use strict';

/**
 * 어떤 일을 하고 있습니까?
 * @class VtxRing
 */
var VtxRing = function() 
{
	if (!(this instanceof VtxRing)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this.vertexList;
	this.elemsIndexRangesArray; // [] array.***
};

VtxRing.prototype.newElementIndexRange = function()
{
	if(this.elemsIndexRangesArray === undefined)
		this.elemsIndexRangesArray = [];
	
	var indexRange = new IndexRange();
	this.elemsIndexRangesArray.push(indexRange);
	return indexRange;
};

VtxRing.prototype.getElementIndexRange = function(idx)
{
	if(this.elemsIndexRangesArray === undefined)
		return undefined;
	
	return this.elemsIndexRangesArray[idx];
};

VtxRing.prototype.copyFrom = function(vtxRing)
{
	if(vtxRing.vertexList !== undefined)
	{
		if(this.vertexList === undefined)
			this.vertexList = new VertexList();
		
		this.vertexList.copyFrom(vtxRing.vertexList);
	}
	
	if(vtxRing.elemsIndexRangesArray !== undefined)
	{
		if(this.elemsIndexRangesArray === undefined)
			this.elemsIndexRangesArray = [];
		
		var indexRange, myIndexRange;
		var indexRangesCount = vtxRing.elemsIndexRangesArray.length;
		for(var i=0; i<indexRangesCount; i++)
		{
			indexRange = vtxRing.elemsIndexRangesArray[i];
			myIndexRange = this.newElementIndexRange();
			myIndexRange.copyFrom(indexRange);
		}
	}
};

VtxRing.prototype.translate = function(x, y, z)
{
	if(this.vertexList !== undefined)
	{
		this.vertexList.translateVertices(x, y, z);
	}
};

VtxRing.prototype.makeByPoint2DList = function(point2dList, z)
{
	if(point2dList === undefined)
		return;
	
	if(z === undefined)
		z = 0;
	
	if(this.vertexList === undefined)
		this.vertexList = new VertexList();
	
	this.vertexList.copyFromPoint2DList(point2dList, z);
	this.calculateElementsIndicesRange();
};

VtxRing.prototype.calculateElementsIndicesRange = function()
{
	if(this.vertexList === undefined)
		return false;
	
	var vertex;
	var idxRange = undefined;
	var vertexType;
	var vertexCount = this.vertexList.getVertexCount();
	for(var i=0; i<vertexCount; i++)
	{
		vertex = this.vertexList.getVertex(i);
		vertexType = vertex.vertexType;
		
		if(vertexType && vertexType === 1)
		{
			if(idxRange !== undefined)
			{
				idxRange.endIdx = i;
			}
			if(i !== vertexCount-1)
			{
				idxRange = this.newElementIndexRange();
				idxRange.strIdx = i;
			}
		}
	}
	
	if(idxRange !== undefined)
		idxRange.endIdx = vertexCount-1;
};















































