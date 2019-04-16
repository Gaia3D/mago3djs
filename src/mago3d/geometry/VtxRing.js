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
	if (this.elemsIndexRangesArray === undefined)
	{ this.elemsIndexRangesArray = []; }
	
	var indexRange = new IndexRange();
	this.elemsIndexRangesArray.push(indexRange);
	return indexRange;
};

VtxRing.prototype.getElementIndexRange = function(idx)
{
	if (this.elemsIndexRangesArray === undefined)
	{ return undefined; }
	
	return this.elemsIndexRangesArray[idx];
};

VtxRing.prototype.getAllVertices = function(resultVerticesArray)
{
	if (this.vertexList === undefined || this.vertexList.vertexArray === undefined)
	{ return resultVerticesArray; }
	
	if (resultVerticesArray === undefined)
	{ resultVerticesArray = []; }
	
	resultVerticesArray.push.apply(resultVerticesArray, this.vertexList.vertexArray);
	
	return resultVerticesArray;
};

VtxRing.prototype.copyFrom = function(vtxRing)
{
	if (vtxRing.vertexList !== undefined)
	{
		if (this.vertexList === undefined)
		{ this.vertexList = new VertexList(); }
		
		this.vertexList.copyFrom(vtxRing.vertexList);
	}
	
	if (vtxRing.elemsIndexRangesArray !== undefined)
	{
		if (this.elemsIndexRangesArray === undefined)
		{ this.elemsIndexRangesArray = []; }
		
		var indexRange, myIndexRange;
		var indexRangesCount = vtxRing.elemsIndexRangesArray.length;
		for (var i=0; i<indexRangesCount; i++)
		{
			indexRange = vtxRing.elemsIndexRangesArray[i];
			myIndexRange = this.newElementIndexRange();
			myIndexRange.copyFrom(indexRange);
		}
	}
};

VtxRing.prototype.translate = function(x, y, z)
{
	if (this.vertexList !== undefined)
	{
		this.vertexList.translateVertices(x, y, z);
	}
};

VtxRing.prototype.transformPointsByMatrix4 = function(tMat4)
{
	if (this.vertexList !== undefined)
	{
		this.vertexList.transformPointsByMatrix4(tMat4);
	}
};

VtxRing.prototype.getProjectedPolyLineBasedRing2D = function(resultRing2d, normal)
{
	// This function returns a ring2d made by polylines2d.***
	if (this.vertexList === undefined)
		return resultRing2d;
	
	if(resultRing2d === undefined)
		resultRing2d = new Ring2D();
	
	var points2dArray = [];
	points2dArray = VertexList.getProjectedPoints2DArray(this.vertexList.vertexArray, normal, points2dArray);
	
	var polyLine2d = resultRing2d.newElement("POLYLINE");
	polyLine2d.point2dArray = points2dArray;
	
	return resultRing2d;
};

VtxRing.prototype.makeByPoints3DArray = function(point3dArray)
{
	if(point3dArray === undefined)
		return;
	
	if (this.vertexList === undefined)
	{ this.vertexList = new VertexList(); }
	
	this.vertexList.copyFromPoint3DArray(point3dArray);
	this.calculateElementsIndicesRange();
};

VtxRing.prototype.makeByPoint2DList = function(point2dList, z)
{
	if (point2dList === undefined)
	{ return; }
	
	if (z === undefined)
	{ z = 0; }
	
	if (this.vertexList === undefined)
	{ this.vertexList = new VertexList(); }
	
	this.vertexList.copyFromPoint2DList(point2dList, z);
	this.calculateElementsIndicesRange();
};

VtxRing.prototype.calculatePlaneNormal = function(resultPlaneNormal)
{
	// Note: this ring must be planar (or almost planar).***
	var planeNormal = Face.calculatePlaneNormal(this.vertexList.vertexArray, undefined);
	return planeNormal;
};

VtxRing.prototype.calculateElementsIndicesRange = function()
{
	if (this.vertexList === undefined)
	{ return false; }
	
	var vertex;
	var idxRange = undefined;
	var vertexType;
	var vertexCount = this.vertexList.getVertexCount();
	for (var i=0; i<vertexCount; i++)
	{
		vertex = this.vertexList.getVertex(i);
		vertexType = vertex.vertexType;
		
		//if(vertexType === undefined && i===0)
		//{
		//	var prevIdx = this.vertexList.getPrevIdx(i);
		//	var prevVertex = this.vertexList.getVertex(prevIdx);
		//	vertexType = prevVertex.vertexType;
		//}
		
		if (vertexType && vertexType === 1)
		{
			if (idxRange !== undefined)
			{
				idxRange.endIdx = i;
			}
			if (i !== vertexCount)
			{
				idxRange = this.newElementIndexRange();
				idxRange.strIdx = i;
			}
		}
	}
	
	if (idxRange !== undefined)
	{ idxRange.endIdx = 0; }
};















































