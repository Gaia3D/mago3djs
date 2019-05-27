'use strict';

/**
 * vertex ring.
 * @exception {Error} Messages.CONSTRUCT_ERROR
 * 
 * @class VtxRing
 * 
 */
var VtxRing = function() 
{
	if (!(this instanceof VtxRing)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

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
};

/**
 * delete all vertex and element index ranges.
 */
VtxRing.prototype.deleteObjects = function()
{
	if (this.vertexList !== undefined)
	{
		this.vertexList.deleteObjects();
		this.vertexList = undefined;
	}
	
	if (this.elemsIndexRangesArray !== undefined)
	{
		this.deleteElementIndexRanges();
	}
};

/**
 * delete all element index ranges.
 */
VtxRing.prototype.deleteElementIndexRanges = function()
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

/**
 * add new index range and return.
 * @return {IndexRange}
 */
VtxRing.prototype.newElementIndexRange = function()
{
	if (this.elemsIndexRangesArray === undefined)
	{ this.elemsIndexRangesArray = []; }
	
	var indexRange = new IndexRange();
	this.elemsIndexRangesArray.push(indexRange);
	return indexRange;
};

/**
 * get IndexRange
 * @param {number}
 * @return {IndexRange|undefined}
 */
VtxRing.prototype.getElementIndexRange = function(idx)
{
	if (this.elemsIndexRangesArray === undefined)
	{ return undefined; }
	
	return this.elemsIndexRangesArray[idx];
};

/**
 * get all vertex. 
 * @param {Array} resultVerticesArray
 * @return {Array.<Vertex>|undefined} if this.vertexList is undefined or this.vertexList.vertexArray is undefined, return resultVerticesArray.
 */
VtxRing.prototype.getAllVertices = function(resultVerticesArray)
{
	if (this.vertexList === undefined || this.vertexList.vertexArray === undefined)
	{ return resultVerticesArray; }
	
	if (resultVerticesArray === undefined)
	{ resultVerticesArray = []; }
	
	resultVerticesArray.push.apply(resultVerticesArray, this.vertexList.vertexArray);
	
	return resultVerticesArray;
};

/**
 * vertex ring copy from another vertex ring.
 * @param {VtxRing} vtxRing
 */
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

/**
 * vertex point translate.
 * @param {Number} x
 * @param {Number} y
 * @param {Number} z
 * @see Point3D#add
 */
VtxRing.prototype.translate = function(x, y, z)
{
	if (this.vertexList !== undefined)
	{
		this.vertexList.translateVertices(x, y, z);
	}
};

/**
 * vertex point transform by matrix4
 * @param {Matrix4} tMat4
 * @see Matrix4#transformPoint3D
 */
VtxRing.prototype.transformPointsByMatrix4 = function(tMat4)
{
	if (this.vertexList !== undefined)
	{
		this.vertexList.transformPointsByMatrix4(tMat4);
	}
};

/**
 * get projected poly line. this line based ring2d.
 * @param {Ring2D|undefined} resultRing2d if undefined, set new Ring2D instance.
 * @param {Point3D} normal
 * @return {Ring2D}
 * 
 * @see VertexList#getProjectedPoints2DArray
 */
VtxRing.prototype.getProjectedPolyLineBasedRing2D = function(resultRing2d, normal)
{
	// This function returns a ring2d made by polylines2d.***
	if (this.vertexList === undefined)
	{ return resultRing2d; }
	
	if (resultRing2d === undefined)
	{ resultRing2d = new Ring2D(); }
	
	var points2dArray = [];
	points2dArray = VertexList.getProjectedPoints2DArray(this.vertexList.vertexArray, normal, points2dArray);
	
	var polyLine2d = resultRing2d.newElement("POLYLINE");
	polyLine2d.point2dArray = points2dArray;
	
	return resultRing2d;
};

/**
 * use point3d array, set VtxRing's vertex list and indexrange.
 * @param {Array.<Point3D>} point3dArray Required.
 * 
 * @see VertexList#copyFromPoint3DArray
 */
VtxRing.prototype.makeByPoints3DArray = function(point3dArray)
{
	if (point3dArray === undefined)
	{ return; }
	
	if (this.vertexList === undefined)
	{ this.vertexList = new VertexList(); }
	
	this.vertexList.copyFromPoint3DArray(point3dArray);
	this.calculateElementsIndicesRange();
};

/**
 * use point3d array, update VtxRing's vertex list.
 * @param {Array.<Point3D>} point3dArray Required.
 * 
 * @see VertexList#copyFromPoint3DArray
 */
VtxRing.prototype.updateByPoints3DArray = function(point3dArray)
{
	// Note: point3dCount must be equal to this.verticesCount.***
	if (point3dArray === undefined)
	{ return; }
	
	if (this.vertexList === undefined)
	{ this.vertexList = new VertexList(); }

	var vertex;
	var point3d;
	var position;
	var points3dCount = point3dArray.length;
	for (var i=0; i<points3dCount; i++)
	{
		point3d = point3dArray[i]; // the original point3d.***
		vertex = this.vertexList.getVertex(i);
		if (vertex === undefined)
		{ vertex = this.vertexList.newVertex(); }
		
		if (vertex.point3d === undefined)
		{ vertex.point3d = new Point3D(); }
		
		vertex.point3d.set(point3d.x, point3d.y, point3d.z);
	}
	
	this.vertexList.copyFromPoint3DArray(point3dArray);
	
	// Do no modify elementsIndexRanges.***
	//this.calculateElementsIndicesRange();
};

/**
 * use point2d array, update VtxRing's vertex list and indexrange.
 * @param {Point2DList} point2dArray Required.
 * @param {number} z altitude. default is zero.
 * @see VertexList#copyFromPoint3DArray
 */
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

/**
 * calculate plane normal.
 * Note: this ring must be planar (or almost planar).***
 * @param {Point3D} resultPlaneNormal not use.
 * @return {Point3D} planeNormal
 * @see Face#calculatePlaneNormal
 */
VtxRing.prototype.calculatePlaneNormal = function(resultPlaneNormal)
{
	var planeNormal = Face.calculatePlaneNormal(this.vertexList.vertexArray, undefined);
	return planeNormal;
};

/**
 * calculate elements indices range.
 */
VtxRing.prototype.calculateElementsIndicesRange = function()
{
	if (this.vertexList === undefined)
	{ return false; }

	// 1rst, delete all existent indexRanges.***
	this.deleteElementIndexRanges();
	this.elemsIndexRangesArray = [];
	
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

/**
 * get vertex intersected with plane. 
 * @static
 * @param {VtxRing} vtxRing if vtxRing's vertexList undefined, return resultVtxRing.
 * @param {Plane} plane. 
 * @param {Point3D} projectionDirection projectionDirection must be unitary.
 * @param {VtxRing} resultVtxRing Optional. if undefined, set new VtxRing instance.
 * @return {VtxRing} resultVertex
 */
VtxRing.getProjectedOntoPlane = function(vtxRing, plane, projectionDirection, resultVtxRing)
{
	if (vtxRing.vertexList === undefined)
	{ return resultRing2d; }
	
	if (resultVtxRing === undefined)
	{ resultVtxRing = new VtxRing(); }

	resultVtxRing.vertexList = VertexList.getProjectedOntoPlane(vtxRing.vertexList, plane, projectionDirection, resultVtxRing.vertexList);
	resultVtxRing.calculateElementsIndicesRange();
	return resultVtxRing;
};













































