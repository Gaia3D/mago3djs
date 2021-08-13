'use strict';

/**
 * vertex ring.
 * @exception {Error} Messages.CONSTRUCT_ERROR
 * 
 * @class VtxRing
 * @constructor
 */
var VtxRing_ = function() 
{
	/**
	 * vertex list
	 * @type {VertexList}
	 */
	this.vertexList;

	/**
	 * indexRange array
	 * @type {Array.<IndexRange>}
	 */
	this.elemsIndexRangesArray;
	
	this.isOpen;
};

VtxRing_.prototype.setIsOpen = function(bIsOpen)
{
	this.isOpen = bIsOpen;
};

VtxRing_.prototype.newElementIndexRange = function()
{
	if (this.elemsIndexRangesArray === undefined)
	{ this.elemsIndexRangesArray = []; }
	
	var indexRange = new IndexRange_();
	this.elemsIndexRangesArray.push(indexRange);
	return indexRange;
};

VtxRing_.prototype.calculatePlaneNormal = function(resultPlaneNormal)
{
	var planeNormal = Face_.calculatePlaneNormal(this.vertexList.vertexArray, undefined);
	return planeNormal;
};

VtxRing_.prototype.getProjectedPolyLineBasedRing2D = function(resultRing2d, normal)
{
	// This function returns a ring2d made by polylines2d.
	if (this.vertexList === undefined)
	{ return resultRing2d; }
	
	if (resultRing2d === undefined)
	{ resultRing2d = new Ring2D_(); }
	
	var points2dArray = [];
	points2dArray = VertexList_.getProjectedPoints2DArray(this.vertexList.vertexArray, normal, points2dArray);
	
	var polyLine2d = resultRing2d.newElement("POLYLINE");
	polyLine2d.point2dArray = points2dArray;
	
	return resultRing2d;
};

VtxRing_.prototype.deleteElementIndexRanges = function()
{
	if (this.elemsIndexRangesArray === undefined)
	{ return; }
	
	var indexRangesCount = this.elemsIndexRangesArray.length;
	for (var i=0; i<indexRangesCount; i++)
	{
		this.elemsIndexRangesArray[i].deleteObjects();
		this.elemsIndexRangesArray[i] = undefined;
	}
	
	this.elemsIndexRangesArray = undefined;
};

VtxRing_.prototype.getElementIndexRange = function(idx)
{
	if (this.elemsIndexRangesArray === undefined)
	{ return undefined; }
	
	return this.elemsIndexRangesArray[idx];
};

VtxRing_.prototype.getAllVertices = function(resultVerticesArray)
{
	if (this.vertexList === undefined || this.vertexList.vertexArray === undefined)
	{ return resultVerticesArray; }
	
	if (resultVerticesArray === undefined)
	{ resultVerticesArray = []; }
	
	resultVerticesArray.push.apply(resultVerticesArray, this.vertexList.vertexArray);
	
	return resultVerticesArray;
};

VtxRing_.prototype.calculateElementsIndicesRange = function()
{
	if (this.vertexList === undefined)
	{ return false; }

	// 1rst, delete all existent indexRanges.
	this.deleteElementIndexRanges();
	this.elemsIndexRangesArray = [];
	
	var vertex;
	var idxRange = undefined;
	var vertexType;
	var vertexCount = this.vertexList.getVertexCount();

	//if(this.isOpen)
	//vertexCount -= 1;

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
				if (i === vertexCount -1)
				{
					if (!this.isOpen)
					{
						idxRange = this.newElementIndexRange();
						idxRange.strIdx = i;
					}
					else
					{ idxRange = undefined; }
				}
				else
				{
					idxRange = this.newElementIndexRange();
					idxRange.strIdx = i;
				}
				
			}
		}
	}
	
	if (idxRange !== undefined)
	{ idxRange.endIdx = 0; }
};

VtxRing_.prototype.makeByPoints3DArray = function (point3dArray, options)
{
	if (point3dArray === undefined)
	{ return; }

	if (options)
	{
		if (options.isOpen)
		{ this.setIsOpen(options.isOpen); }
	}
	
	if (this.vertexList === undefined)
	{ this.vertexList = new VertexList_(); }
	
	this.vertexList.copyFromPoint3DArray(point3dArray);
	
	// Now, in this case, mark all vertex.vertexType = 1 (bcos all elems are lines).
	var vertexCount = this.vertexList.getVertexCount();
	var vertex;
	for (var i=0; i<vertexCount; i++)
	{
		vertex = this.vertexList.getVertex(i);
		vertex.setVertexType(1);
	}
	this.calculateElementsIndicesRange();
};