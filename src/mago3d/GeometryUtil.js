'use strict';

/**
 * 어떤 일을 하고 있습니까?
 * @class ByteColor
 */
var ByteColor = function() {
	if(!(this instanceof ByteColor)) {
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this.ByteR = 0;
	this.ByteG = 0;
	this.ByteB = 0;
	this.ByteAlfa = 255;
};

/**
 * 어떤 일을 하고 있습니까?
 */
ByteColor.prototype.destroy = function() {
	this.ByteR = null;
	this.ByteG = null;
	this.ByteB = null;
	this.ByteAlfa = null;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param byteRed 변수
 * @param byteGreen 변수
 * @param byteBlue 변수
 */
ByteColor.prototype.set = function(byteRed, byteGreen, byteBlue) {
	this.ByteR = byteRed;
	this.ByteG = byteGreen;
	this.ByteB = byteBlue;
};

/**
* 어떤 일을 하고 있습니까?
* @class Point2D
*/
var Point2D = function() {
	if(!(this instanceof Point2D)) {
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this.x = 0.0;
	this.y = 0.0;
	this.IdxInIist; // delete this.***
};

/**
 * 어떤 일을 하고 있습니까?
 * @class Point3DAux
 */
var Point3DAux = function() {
	if(!(this instanceof Point3DAux)) {
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this.x = 0.0;
	this.y = 0.0;
	this.z = 0.0;
	//this.IdxInIist;
};

/**
 * 어떤 일을 하고 있습니까?
 * @class TTriangle
 */
var TTriangle = function() {
	if(!(this instanceof TTriangle)) {
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this.mVertex1;
	this.mVertex2;
	this.mVertex3;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param vtx1 변수
 * @param vtx2 변수
 * @param vtx3 변수
 */
TTriangle.prototype.setVertices = function(vtx1, vtx2, vtx3) {
	this.mVertex1 = vtx1;
	this.mVertex2 = vtx2;
	this.mVertex3 = vtx3;
};

/**
 * 어떤 일을 하고 있습니까?
 */
TTriangle.prototype.invert = function() {
	var vertexAux = this.mVertex2;
	this.mVertex2 = this.mVertex3;
	this.mVertex3 = vertexAux;
};

/**
 * 어떤 일을 하고 있습니까?
 * @class TTrianglesList
 */
var TTrianglesList = function() {
	if(!(this instanceof TTrianglesList)) {
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this.tTrianglesArray = [];
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns tTri
 */
TTrianglesList.prototype.newTTriangle = function() {
	var tTri = new TTriangle();
	this.tTrianglesArray.push(tTri);
	return tTri;
};

/**
 * 어떤 일을 하고 있습니까?
 */
TTrianglesList.prototype.invertTrianglesSense= function() {
	for(var i = 0, triCount = this.tTrianglesArray.length; i < triCount; i++) {
		this.tTrianglesArray[i].invert();
	}
};

/**
 * 어떤 일을 하고 있습니까?
 * @param idx 변수
 * @returns tTrianglesArray[idx]
 */
TTrianglesList.prototype.getTTriangle = function(idx) {
	if(idx >= 0 && idx < this.tTrianglesArray.length) {
		return this.tTrianglesArray[idx];
	} else{
		return undefined;
	}
};

/**
 * 어떤 일을 하고 있습니까?
 * @class TTrianglesMatrix
 */
var TTrianglesMatrix = function() {
	if(!(this instanceof TTrianglesMatrix)) {
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this.tTrianglesListsArray = [];
	// SCRATX.*********************
	this.totalTTrianglesArraySC = [];
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns tTrianglesList
 */
TTrianglesMatrix.prototype.newTTrianglesList = function() {
	var tTrianglesList = new TTrianglesList();
	this.tTrianglesListsArray.push(tTrianglesList);
	return tTrianglesList;
};

/**
 * 어떤 일을 하고 있습니까?
 */
TTrianglesMatrix.prototype.invertTrianglesSense = function() {
	for(var i = 0, tTriListsCount = this.tTrianglesListsArray.length; i < tTriListsCount; i++) {
		this.tTrianglesListsArray[i].invertTrianglesSense();
	}
};

/**
 * 어떤 일을 하고 있습니까?
 * @param resultTotalTTrianglesArray 변수
 * @returns resultTotalTTrianglesArray
 */
TTrianglesMatrix.prototype.getTotalTTrianglesArray = function(resultTotalTTrianglesArray) {
	for(var i = 0, tTriListsCount = this.tTrianglesListsArray.length; i < tTriListsCount; i++) {
		for(var j = 0, tTrianglesCount = this.tTrianglesListsArray[i].tTrianglesArray.length; j < tTrianglesCount; j++) {
			var tTriangle = this.tTrianglesListsArray[i].getTTriangle(j);
			resultTotalTTrianglesArray.push(tTriangle);
		}
	}

	return resultTotalTTrianglesArray;
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns shortArray
 */
TTrianglesMatrix.prototype.getVBOIndicesShortArray = function() {
	this.totalTTrianglesArraySC.length = 0;
	this.totalTTrianglesArraySC = this.getTotalTTrianglesArray(this.totalTTrianglesArraySC);

	var tTriangle;
	var shortArray = new Uint16Array(tTrianglesCount * 3);
	for(var i = 0, tTrianglesCount = this.totalTTrianglesArraySC.length; i < tTrianglesCount; i++) {
		tTriangle = this.totalTTrianglesArraySC[i];
		shortArray[i*3] = tTriangle.mVertex1.mIdxInList;
		shortArray[i*3+1] = tTriangle.mVertex2.mIdxInList;
		shortArray[i*3+2] = tTriangle.mVertex3.mIdxInList;
	}

	return shortArray;
};

/**
 * 어떤 일을 하고 있습니까?
 * @class VertexMatrix
 */
var VertexMatrix = function() {
	if(!(this instanceof VertexMatrix)) {
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this.vertexListsArray = [];
	// SCTRATXH.******************
	this.totalVertexArraySC = [];
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns vertexList
 */
VertexMatrix.prototype.newVertexList = function() {
	var vertexList = new VertexList();
	this.vertexListsArray.push(vertexList);
	return vertexList;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param idx 변수
 * @returns vertexListArray[idx]
 */
VertexMatrix.prototype.getVertexList = function(idx) {
	if(idx >= 0 && idx < this.vertexListsArray.length) {
		return this.vertexListsArray[idx];
	} else {
		return undefined;
	}
};

/**
 * 어떤 일을 하고 있습니까?
 * @param resultBox
 * @returns resultBox
 */
VertexMatrix.prototype.getBoundingBox = function(resultBox) {
	if(resultBox == undefined) resultBox = new BoundingBox();

	this.totalVertexArraySC.length = 0;
	this.totalVertexArraySC = this.getTotalVertexArray(this.totalVertexArraySC);
	for(var i = 0, totalVertexCount = this.totalVertexArraySC.length; i < totalVertexCount; i++) {
		if(i == 0) resultBox.setInit (this.totalVertexArraySC[i].point3d);
		else resultBox.addPoint3D(this.totalVertexArraySC[i].point3d);
	}
	return resultBox;
};

/**
 * 어떤 일을 하고 있습니까?
 */
VertexMatrix.prototype.setVertexIdxInList = function() {
	var idxInIist = 0;
	for(var i = 0, vertexListsCount = this.vertexListsArray.length; i < vertexListsCount; i++) {
		var vtxList = this.vertexListsArray[i];
		for(var j = 0, vertexCount = vtxList.vertexArray.length; j < vertexCount; j++) {
			var vertex = vtxList.getVertex(j);
			vertex.mIdxInList = idxInIist;
			idxInIist++;
		}
	}
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns vertexCount
 */
VertexMatrix.prototype.getVertexCount = function() {
	var vertexCount = 0;
	for(var i = 0, vertexListsCount = this.vertexListsArray.length; i < vertexListsCount; i++) {
		vertexCount += this.vertexListsArray[i].getVertexCount();
	}

	return vertexCount;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param resultTotalVertexArray 변수
 * @returns resultTotalVertexArray
 */
VertexMatrix.prototype.getTotalVertexArray = function(resultTotalVertexArray) {
	for(var i = 0, vertexListsCount = this.vertexListsArray.length; i < vertexListsCount; i++) {
		var vtxList = this.vertexListsArray[i];
		for(var j = 0, vertexCount = vtxList.vertexArray.length; j < vertexCount; j++) {
			var vertex = vtxList.getVertex(j);
			resultTotalVertexArray.push(vertex);
		}
	}

	return resultTotalVertexArray;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param resultFloatArray 변수
 * @returns resultFloatArray
 */
VertexMatrix.prototype.getVBOVertexColorFloatArray = function(resultFloatArray) {
	this.totalVertexArraySC.length = 0;
	this.totalVertexArraySC = this.getTotalVertexArray(this.totalVertexArraySC);

	var totalVertexCount = this.totalVertexArraySC.length;
	if(resultFloatArray == undefined) resultFloatArray = new Float32Array(totalVertexCount*6);

	for(var i = 0; i < totalVertexCount; i++) {
		var vertex = this.totalVertexArraySC[i];
		resultFloatArray[i*6] = vertex.point3d.x;
		resultFloatArray[i*6+1] = vertex.point3d.y;
		resultFloatArray[i*6+2] = vertex.point3d.z;

		resultFloatArray[i*6+3] = vertex.color4.r;
		resultFloatArray[i*6+4] = vertex.color4.g;
		resultFloatArray[i*6+5] = vertex.color4.b;
	}

	return resultFloatArray;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param resultFloatArray 변수
 * @returns resultFloatArray
 */
VertexMatrix.prototype.getVBOVertexColorRGBAFloatArray = function(resultFloatArray) {
	this.totalVertexArraySC.length = 0;
	this.totalVertexArraySC = this.getTotalVertexArray(this.totalVertexArraySC);

	var totalVertexCount = this.totalVertexArraySC.length;
	if(resultFloatArray == undefined) resultFloatArray = new Float32Array(totalVertexCount * 7);

	for(var i = 0; i < totalVertexCount; i++) {
		var vertex = this.totalVertexArraySC[i];
		resultFloatArray[i*7] = vertex.point3d.x;
		resultFloatArray[i*7+1] = vertex.point3d.y;
		resultFloatArray[i*7+2] = vertex.point3d.z;

		resultFloatArray[i*7+3] = vertex.color4.r;
		resultFloatArray[i*7+4] = vertex.color4.g;
		resultFloatArray[i*7+5] = vertex.color4.b;
		resultFloatArray[i*7+6] = vertex.color4.a;
	}

	return resultFloatArray;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param resultFloatArray 변수
 * @returns resultFloatArray
 */
VertexMatrix.prototype.getVBOVertexFloatArray = function(resultFloatArray) {
	this.totalVertexArraySC.length = 0;
	this.totalVertexArraySC = this.getTotalVertexArray(this.totalVertexArraySC);

	var totalVertexCount = this.totalVertexArraySC.length;
	if(resultFloatArray == undefined) resultFloatArray = new Float32Array(totalVertexCount * 3);

	for(var i = 0; i < totalVertexCount; i++) {
		var vertex = this.totalVertexArraySC[i];
		resultFloatArray[i*3] = vertex.point3d.x;
		resultFloatArray[i*3+1] = vertex.point3d.y;
		resultFloatArray[i*3+2] = vertex.point3d.z;
	}

	return resultFloatArray;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param dirX 변수
 * @param dirY 변수
 * @param dirZ 변수
 * @param distance 변수
 */
VertexMatrix.prototype.translateVertices = function(dirX, dirY, dirZ, distance) {
	for(var i = 0, vertexListsCount = this.vertexListsArray.length; i < vertexListsCount; i++) {
		this.vertexListsArray[i].translateVertices(dirX, dirY, dirZ, distance);
	}
};

/**
 * 어떤 일을 하고 있습니까?
 * @param tTrianglesMatrix 변수
 */
VertexMatrix.prototype.makeTTrianglesLateralSidesLOOP = function(tTrianglesMatrix) {
	// condition: all the vertex lists must have the same number of vertex.***
	var vtxList1;
	var vtxList2;
	var tTrianglesList;
	var tTriangle1;
	var tTriangle2;
	var vertexCount = 0;
	for(var i = 0, vertexListsCount = this.vertexListsArray.length; i < vertexListsCount - 1; i++) {
		vtxList1 = this.vertexListsArray[i];
		vtxList2 = this.vertexListsArray[i+1];
		tTrianglesList = tTrianglesMatrix.newTTrianglesList();

		vertexCount = vtxList1.vertexArray.length;
		for(var j = 0; j < vertexCount; j++) {
			tTriangle1 = tTrianglesList.newTTriangle();
			tTriangle2 = tTrianglesList.newTTriangle();

			if(j == vertexCount -1) {
				tTriangle1.setVertices(vtxList1.getVertex(j), vtxList2.getVertex(j), vtxList2.getVertex(0));
				tTriangle2.setVertices(vtxList1.getVertex(j), vtxList2.getVertex(0), vtxList1.getVertex(0));
			} else {
				tTriangle1.setVertices(vtxList1.getVertex(j), vtxList2.getVertex(j), vtxList2.getVertex(j+1));
				tTriangle2.setVertices(vtxList1.getVertex(j), vtxList2.getVertex(j+1), vtxList1.getVertex(j+1));
			}
		}
	}
};

/**
 * 어떤 일을 하고 있습니까?
 * @param transformMatrix
 */
VertexMatrix.prototype.transformPointsByMatrix4 = function(transformMatrix) {
	for(var i = 0, vertexListsCount = this.vertexListsArray.length; i < vertexListsCount; i++) {
		var vtxList = this.vertexListsArray[i];
		vtxList.transformPointsByMatrix4(transformMatrix);
	}
};

/**
 * 어떤 일을 하고 있습니까?
 * @class Polygon
 */
var Polygon = function() {
	if(!(this instanceof Polygon)) {
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this.mPoint3DArray = [];
};

/**
 * 어떤 일을 하고 있습니까?
 * @param point3d 변수
 */
Polygon.prototype.addPoint3D = function(point3d) {
	this.mPoint3DArray.push(point3d);
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns point3d
 */
Polygon.prototype.newPoint3D = function() {
	var point3d = new Point3D();
	this.mPoint3DArray.push(point3d);
	return point3d;
};

/**
 * 어떤 일을 하고 있습니까?
 * @class TrianglesSurface
 */
var TrianglesSurface= function() {
	if(!(this instanceof TrianglesSurface)) {
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this.mPoint3DArray = [];
	this.mTrianglesArray = [];
};

/**
 * 어떤 일을 하고 있습니까?
 */
TrianglesSurface.prototype.destroy = function() {
	// 1rst, destroy ftriangles.**********************************
	for(var i = 0, ftrianglesCount = this.mTrianglesArray.length; i < ftrianglesCount; i++) {
		var ftriangle = this.mTrianglesArray[i];
		if(ftriangle!=null)ftriangle.destroy();
		ftriangle = null;
	}
	this.mTrianglesArray = null;

	// 2nd, destroy points3d.*************************************
	for(var i = 0, pointsCount = this.mPoint3DArray.length; i < pointsCount; i++) {
		var point = this.mPoint3DArray[i];
		if(point!=null) point.destroy();
		point = null;
	}
	this.mPoint3DArray = null;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param generalVBOArraysContainer 변수
 */
TrianglesSurface.prototype.getVertexColorsIndicesArrays = function(generalVBOArraysContainer) {
	var currentMeshArrays = null;
	var meshArraysCount = generalVBOArraysContainer.meshArrays.length;
	if(meshArraysCount == 0) {
		currentMeshArrays = generalVBOArraysContainer.newVertexColorIdxArray();
	} else {
		currentMeshArrays = generalVBOArraysContainer.meshArrays[meshArraysCount - 1]; // take the last.***
	}

	// max unsigned short =  65,535
	var maxIndices = 65000;

	for(var i = 0, ftrianglesCount = this.mTrianglesArray.length; i < ftrianglesCount; i++) {
		if(currentMeshArrays.meshVertices.length/3 >= maxIndices) {
			currentMeshArrays = generalVBOArraysContainer.newVertexColorIdxArray();
		}

		var ftriangle = this.mTrianglesArray[i];
		var idxP1 = ftriangle.mPoint1Idx;
		var idxP2 = ftriangle.mPoint2Idx;
		var idxP3 = ftriangle.mPoint3Idx;

		var colorP1 = ftriangle.mColor1;
		var colorP2 = ftriangle.mColor2;
		var colorP3 = ftriangle.mColor3;

		var p1 = this.mPoint3DArray[idxP1];
		var p2 = this.mPoint3DArray[idxP2];
		var p3 = this.mPoint3DArray[idxP3];

		// Point 1.***
		currentMeshArrays.meshVertices.push(p1.x);
		currentMeshArrays.meshVertices.push(p1.y);
		currentMeshArrays.meshVertices.push(p1.z);
		currentMeshArrays.mesh_tri_indices.push(currentMeshArrays.meshVertices.length/3 - 1);
		currentMeshArrays.mesh_colors.push(colorP1.r);
		currentMeshArrays.mesh_colors.push(colorP1.g);
		currentMeshArrays.mesh_colors.push(colorP1.b);

		// Point 2.***
		currentMeshArrays.meshVertices.push(p2.x);
		currentMeshArrays.meshVertices.push(p2.y);
		currentMeshArrays.meshVertices.push(p2.z);
		currentMeshArrays.mesh_tri_indices.push(currentMeshArrays.meshVertices.length/3 - 1);
		currentMeshArrays.mesh_colors.push(colorP2.r);
		currentMeshArrays.mesh_colors.push(colorP2.g);
		currentMeshArrays.mesh_colors.push(colorP2.b);

		// Point 3.***
		currentMeshArrays.meshVertices.push(p3.x);
		currentMeshArrays.meshVertices.push(p3.y);
		currentMeshArrays.meshVertices.push(p3.z);
		currentMeshArrays.mesh_tri_indices.push(currentMeshArrays.meshVertices.length/3 - 1);
		currentMeshArrays.mesh_colors.push(colorP3.r);
		currentMeshArrays.mesh_colors.push(colorP3.g);
		currentMeshArrays.mesh_colors.push(colorP3.b);
	}
};

/**
 * 어떤 일을 하고 있습니까?
 * @param generalVertexIdxVBOArraysContainer = 변수
 */
TrianglesSurface.prototype.getVertexIndicesArrays = function(generalVertexIdxVBOArraysContainer) {
	var currentMeshArrays = null;
	var meshArraysCount = generalVertexIdxVBOArraysContainer._meshArrays.length;
	if(meshArraysCount == 0) {
		currentMeshArrays = generalVertexIdxVBOArraysContainer.newVertexIdxArray();
	} else {
		currentMeshArrays = generalVertexIdxVBOArraysContainer._meshArrays[meshArraysCount - 1]; // take the last.***
	}

	// max unsigned short =  65,535
	var maxIndices = 65000;

	var ftrianglesCount = this.mTrianglesArray.length;
	var currVtxCount = currentMeshArrays.meshVertices.length/3;
	for(var i = 0, vtxCount = this.mPoint3DArray.length; i < vtxCount; i++) {
		var point = this.mPoint3DArray[i];
		currentMeshArrays.meshVertices.push(point.x);
		currentMeshArrays.meshVertices.push(point.y);
		currentMeshArrays.meshVertices.push(point.z);
	}

	for(var i = 0; i < ftrianglesCount; i++) {
		if(currentMeshArrays.meshVertices.length/3 >= maxIndices) {
			currentMeshArrays = generalVertexIdxVBOArraysContainer.newVertexIdxArray();
			currVtxCount = 0;
		}

		var ftriangle = this.mTrianglesArray[i];
		var idxP1 = ftriangle.mPoint1Idx;
		var idxP2 = ftriangle.mPoint2Idx;
		var idxP3 = ftriangle.mPoint3Idx;

		currentMeshArrays.mesh_tri_indices.push(idxP1 + currVtxCount);
		currentMeshArrays.mesh_tri_indices.push(idxP2 + currVtxCount);
		currentMeshArrays.mesh_tri_indices.push(idxP3 + currVtxCount);
	}
};

/**
 * 어떤 일을 하고 있습니까?
 * @param generalVertexIdxVBOArraysContainer 변수
 */
TrianglesSurface.prototype.getVertexIndicesArraysOriginal = function(generalVertexIdxVBOArraysContainer) {
	var currentMeshArrays = null;
	var meshArraysCount = generalVertexIdxVBOArraysContainer._meshArrays.length;
	if(meshArraysCount == 0) {
		currentMeshArrays = generalVertexIdxVBOArraysContainer.newVertexIdxArray();
	} else {
		currentMeshArrays = generalVertexIdxVBOArraysContainer._meshArrays[meshArraysCount - 1]; // take the last.***
	}

	// max unsigned short =  65,535
	var maxIndices = 65000;

	for(var i = 0, ftrianglesCount = this.mTrianglesArray.length; i < ftrianglesCount; i++) {
		if(currentMeshArrays.meshVertices.length/3 >= maxIndices) {
			currentMeshArrays = generalVertexIdxVBOArraysContainer.newVertexIdxArray();
		}

		var ftriangle = this.mTrianglesArray[i];
		var idxP1 = ftriangle.mPoint1Idx;
		var idxP2 = ftriangle.mPoint2Idx;
		var idxP3 = ftriangle.mPoint3Idx;

		var p1 = this.mPoint3DArray[idxP1];
		var p2 = this.mPoint3DArray[idxP2];
		var p3 = this.mPoint3DArray[idxP3];

		// Point 1.***
		currentMeshArrays.meshVertices.push(p1.x);
		currentMeshArrays.meshVertices.push(p1.y);
		currentMeshArrays.meshVertices.push(p1.z);
		currentMeshArrays.mesh_tri_indices.push(currentMeshArrays.meshVertices.length/3 - 1);

		// Point 2.***
		currentMeshArrays.meshVertices.push(p2.x);
		currentMeshArrays.meshVertices.push(p2.y);
		currentMeshArrays.meshVertices.push(p2.z);
		currentMeshArrays.mesh_tri_indices.push(currentMeshArrays.meshVertices.length/3 - 1);

		// Point 3.***
		currentMeshArrays.meshVertices.push(p3.x);
		currentMeshArrays.meshVertices.push(p3.y);
		currentMeshArrays.meshVertices.push(p3.z);
		currentMeshArrays.mesh_tri_indices.push(currentMeshArrays.meshVertices.length/3 - 1);
	}
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns point3d
 */
TrianglesSurface.prototype.newPoint3D = function() {
	var point3d = new Point3D();
	this.mPoint3DArray.push(point3d);
	return point3d;
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns ftriangle
 */
TrianglesSurface.prototype.newTriangle = function() {
	var ftriangle = new Triangle();
	this.mTrianglesArray.push(ftriangle);
	return ftriangle;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param matrix4 변수
 * @returns transformedTrianglesSurface
 */
TrianglesSurface.prototype.getTransformedTrianglesSurface = function(matrix4) {
	var transformedTrianglesSurface = new TrianglesSurface();

	// 1) copy and transform the points3d.***
	for(var i = 0, pointsCount = this.mPoint3DArray.length; i < pointsCount; i++) {
		var point3d = this.mPoint3DArray[i];
		var transformedPoint = matrix4.transformPoint3D(point3d);
		transformedTrianglesSurface.mPoint3DArray.push(transformedPoint);
	}

	// 2) copy the triangles.***
	for(var i = 0, triCount = this.mTrianglesArray.length; i < triCount; i++) {
		var tri = this.mTrianglesArray[i];
		var transformedTri = transformedTrianglesSurface.newTriangle();
		transformedTri.setPoints3DIndices(tri.mPoint1Idx, tri.mPoint2Idx, tri.mPoint3Idx);
	}
	return transformedTrianglesSurface;
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns bb
 */
TrianglesSurface.prototype.getBoundingBox = function() {
	var pointsCount = this.mPoint3DArray.length;
	if(pointsCount == 0) return null;

	var bb = new BoundingBox();
	var firstPoint3d = this.mPoint3DArray[0];
	bb.setInit(firstPoint3d);

	for(var i = 1; i < pointsCount; i++) {
		var point3d = this.mPoint3DArray[i];
		bb.addPoint3D(point3d);
	}

	return bb;
};

/**
 * 어떤 일을 하고 있습니까?
 * @class Fpolyhedron
 */
var Fpolyhedron= function() {
	if(!(this instanceof Fpolyhedron)) {
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this.mFTrianglesSurfacesArray = [];
	this.mIFCEntityType = -1;
};

/**
 * 어떤 일을 하고 있습니까?
 */
Fpolyhedron.prototype.destroy = function() {
	for(var i = 0, ftriSurfacesCount = this.mFTrianglesSurfacesArray.length; i < ftriSurfacesCount; i++) {
		var ftrianglesSurface = this.mFTrianglesSurfacesArray[i];
		if(ftrianglesSurface!=null)ftrianglesSurface.destroy();
		ftrianglesSurface = null;
	}
	this.mFTrianglesSurfacesArray = null;
	this.mIFCEntityType = null;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param generalVBOArraysContainer 변수
 */
Fpolyhedron.prototype.getVertexColorsIndicesArrays = function(generalVBOArraysContainer) {
	for(var i = 0, ftriSurfacesCount = this.mFTrianglesSurfacesArray.length; i < ftriSurfacesCount; i++) {
		var ftrianglesSurface = this.mFTrianglesSurfacesArray[i];
		ftrianglesSurface.getVertexColorsIndicesArrays(generalVBOArraysContainer);
	}
};

/**
 * 어떤 일을 하고 있습니까?
 * @param generalVertexIdxVBOArraysContainer 변수
 */
Fpolyhedron.prototype.getVertexIndicesArrays = function(generalVertexIdxVBOArraysContainer) {
	for(var i = 0, ftriSurfacesCount = this.mFTrianglesSurfacesArray.length; i < ftriSurfacesCount; i++) {
		var ftrianglesSurface = this.mFTrianglesSurfacesArray[i];
		ftrianglesSurface.getVertexIndicesArrays(generalVertexIdxVBOArraysContainer);
	}
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns ftrianglesSurface
 */
Fpolyhedron.prototype.newFTrianglesSurface = function() {
	var ftrianglesSurface = new TrianglesSurface();
	this.mFTrianglesSurfacesArray.push(ftrianglesSurface);
	return ftrianglesSurface;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param matrix4
 * @returns transformedFPolyhedron
 */
Fpolyhedron.prototype.getTransformedFPolyhedron = function(matrix4) {
	var transformedFPolyhedron = new Fpolyhedron();
	for(var i = 0, ftriSurfacesCount = this.mFTrianglesSurfacesArray.length; i < ftriSurfacesCount; i++) {
		var ftrianglesSurface = this.mFTrianglesSurfacesArray[i];
		var transformedFtrianglesSurface = ftrianglesSurface.getTransformedTrianglesSurface(matrix4);
		transformedFPolyhedron.mFTrianglesSurfacesArray.push(transformedFtrianglesSurface);
	}

	return transformedFPolyhedron;
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns bb
 */
Fpolyhedron.prototype.getBoundingBox = function() {
	var ftriSurfacesCount = this.mFTrianglesSurfacesArray.length;
	if(ftriSurfacesCount == 0) return null;

	var bb = null;
	for(var i = 0; i < ftriSurfacesCount; i++) {
		var ftrianglesSurface = this.mFTrianglesSurfacesArray[i];
		var currentBb = ftrianglesSurface.getBoundingBox();
		if(bb == null) {
			if(currentBb != null) bb = currentBb;
		} else {
			if(currentBb != null) bb.addBox(currentBb);
		}
	}

	return bb;
};

/**
 * 어떤 일을 하고 있습니까?
 * @class FpolyhedronsList
 */
var FpolyhedronsList= function() {
	if(!(this instanceof FpolyhedronsList)) {
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this.mFPolyhedronsArray = [];
};

/**
 * 어떤 일을 하고 있습니까?
 * @param generalVBOArraysContainer 변수
 */
FpolyhedronsList.prototype.getVertexColorsIndicesArrays = function(generalVBOArraysContainer) {
	for(var i = 0, fpolyhedronsCount = this.mFPolyhedronsArray.length; i < fpolyhedronsCount; i++) {
		var fpolyhedron = this.mFPolyhedronsArray[i];
		if(fpolyhedron.mIFCEntityType != 27 && fpolyhedron.mIFCEntityType != 26) // 27 = ifc_space, 26 = ifc_windows.***
			fpolyhedron.getVertexColorsIndicesArrays(generalVBOArraysContainer);
	}
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns fpolyhedron
 */
FpolyhedronsList.prototype.newFPolyhedron = function() {
	var fpolyhedron = new Fpolyhedron();
	this.mFPolyhedronsArray.push(fpolyhedron);
	return fpolyhedron;
};



/**
 * 어떤 일을 하고 있습니까?
 * @class Reference
 */
var Reference = function() {
	if(!(this instanceof Reference)) {
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	// 1) Object ID.***
	this._id = 0;

	// 2) Block Idx.***
	this._block_idx = -1;

	// 3) Transformation Matrix.***
	this._matrix4 = new Matrix4();

	// 4) New. Only save the cache_key, and free geometry data.***
	//this._VBO_ByteColorsCacheKeys_Container = new VBOByteColorCacheKeysContainer(); // provisionally delete this.***

	// 4') may be only save the cache_key_idx.***
	this._VBO_ByteColorsCacheKeys_Container_idx = -1; // Test. Do this for possibly use with workers.***
};

/**
 * 어떤 일을 하고 있습니까?
 * @param matrix 변수
 */
Reference.prototype.multiplyTransformMatrix = function(matrix) {
	var multipliedMat = this._matrix4.getMultipliedByMatrix(matrix); // Original.***
	//var multipliedMat = matrix.getMultipliedByMatrix(this._matrix4); // Test.***
	this._matrix4 = multipliedMat;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param blocksList 변수
 * @returns bb
 */
Reference.prototype.getBoundingBox = function(blocksList) {
	var block = blocksList.getBlock(this._block_idx);
	if(block == null) return null;

	var block_fpolyhedron = block._fpolyhedron;
	var transformed_fpolyhedron = block_fpolyhedron.getTransformedFPolyhedron(this._matrix4);
	var bb = transformed_fpolyhedron.getBoundingBox();
	return bb;
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns byteColorsSurface
 */
Reference.prototype.newByteColorsSurface = function() {
	var byteColorsSurface = new f4d_ByteColorsSurface();
	this._ByteColorsSurfacesList.push(byteColorsSurface);
	return byteColorsSurface;
};

/**
 * 어떤 일을 하고 있습니까?
 * @class CompoundReference
 */
var CompoundReference = function() {
	if(!(this instanceof CompoundReference)) {
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this._referencesList = [];
};

/**
 * 어떤 일을 하고 있습니까?
 * @param blocksList 변수
 * @returns bb
 */
CompoundReference.prototype.getBoundingBox = function(blocksList) {
	var bb = null;
	for(var i=0, references_count = this._referencesList.length; i<references_count; i++) {
		var reference = this._referencesList[i];
		var currentBb = reference.getBoundingBox(blocksList);
		if(bb == null) {
			if(currentBb != null) bb = currentBb;
		} else {
			if(currentBb != null) bb.addBox(currentBb);
		}
	}

	return bb;
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns ref
 */
CompoundReference.prototype.newReference = function() {
	var ref = new Reference();
	this._referencesList.push(ref);
	return ref;
};

/**
 * 어떤 일을 하고 있습니까?
 * @class CompoundReferencesList
 */
var CompoundReferencesList = function() {
	if(!(this instanceof CompoundReferencesList)) {
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this.name = "";
	this._compoundRefsArray = [];
	this._lodLevel = -1;
	this._ocCulling = new OcclusionCullingOctree();
	this._currentVisibleIndices = []; // Determined by occlusion culling.***
	this._currentVisibleIndicesSC = []; // Determined by occlusion culling.***
	this._currentVisibleIndicesSC_2 = []; // Determined by occlusion culling.***
};

/**
 * 어떤 일을 하고 있습니까?
 * @param eye_x 변수
 * @param eye_y 변수
 * @param eye_z 변수
 */
CompoundReferencesList.prototype.updateCurrentVisibleIndices = function(eye_x, eye_y, eye_z) {
	this._currentVisibleIndicesSC = this._ocCulling._infinite_ocCulling_box.getIndicesVisiblesForEye(eye_x, eye_y, eye_z, this._currentVisibleIndicesSC);
	this._currentVisibleIndicesSC_2 = this._ocCulling._ocCulling_box.getIndicesVisiblesForEye(eye_x, eye_y, eye_z, this._currentVisibleIndicesSC_2);
	this._currentVisibleIndices = this._currentVisibleIndicesSC.concat(this._currentVisibleIndicesSC_2);
};

/**
 * 어떤 일을 하고 있습니까?
 * @param eye_x 변수
 * @param eye_y 변수
 * @param eye_z 변수
 */
CompoundReferencesList.prototype.updateCurrentVisibleIndicesInterior = function(eye_x, eye_y, eye_z) {
	this._currentVisibleIndices = this._ocCulling._ocCulling_box.getIndicesVisiblesForEye(eye_x, eye_y, eye_z, this._currentVisibleIndices);
};

/**
 * 어떤 일을 하고 있습니까?
 * @param blocksList 변수
 * @returns bb
 */
CompoundReferencesList.prototype.getBoundingBox = function(blocksList) {
	var bb = null;
	for(var i = 0, compRefsCount = this._compoundRefsArray.length; i < compRefsCount; i++) {
		var compRef = this._compoundRefsArray[i];
		var currentBb = compRef.getBoundingBox(blocksList);
		if(bb == null) {
			if(currentBb != null) bb = currentBb;
		} else {
			if(currentBb != null) bb.addBox(currentBb);
		}
	}
	return bb;
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns compRef
 */
CompoundReferencesList.prototype.newCompoundReference = function() {
	var compRef = new CompoundReference();
	this._compoundRefsArray.push(compRef);

	return compRef;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param matrix 변수
 */
CompoundReferencesList.prototype.multiplyReferencesMatrices = function(matrix) {
	for(var i = 0, compRefsCount = this._compoundRefsArray.length; i < compRefsCount; i++) {
		var compRef = this._compoundRefsArray[i];
		for(var j = 0, refsCount = compRef._referencesList.length; j < refsCount; j++) {
			var reference = compRef._referencesList[j];
			reference.multiplyTransformMatrix(matrix);
		}
	}
};

/**
 * 어떤 일을 하고 있습니까?
 * @class CompoundReferencesListContainer
 */
var CompoundReferencesListContainer = function() {
	if(!(this instanceof CompoundReferencesListContainer)) {
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this.compRefsListArray = [];
};

/**
 * 어떤 일을 하고 있습니까?
 * @param compoundReferenceList_name 변수
 * @param lodLevel 변수
 * @returns compoundRefList
 */
CompoundReferencesListContainer.prototype.newCompoundRefsList = function(compoundReferenceList_name, lodLevel) {
	var compoundRefList = new CompoundReferencesList();
	compoundRefList.name = compoundReferenceList_name;
	compoundRefList._lodLevel = lodLevel;
	this.compRefsListArray.push(compoundRefList);
	return compoundRefList;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param eye_x 변수
 * @param eye_y 변수
 * @param eye_z 변수
 */
CompoundReferencesListContainer.prototype.updateCurrentVisibleIndicesOfLists = function(eye_x, eye_y, eye_z) {
	for(var i = 0, compRefListsCount = this.compRefsListArray.length; i < compRefListsCount; i++) {
		this.compRefsListArray[i].updateCurrentVisibleIndices(eye_x, eye_y, eye_z);
	}
};

/**
 * 어떤 일을 하고 있습니까?
 * @param compRefListsName 변수
 * @returns result_compRefList
 */
CompoundReferencesListContainer.prototype.getCompRefListByName = function(compRefListsName) {
	var result_compRefList;
	var found = false;
	var compRefListsCount = this.compRefsListArray.length;
	var i=0;
	while(!found && i < compRefListsCount) {
		if(this.compRefsListArray[i].name == compRefListsName) {
			result_compRefList = this.compRefsListArray[i];
		}
		i++;
	}

	return result_compRefList;
};

  //VBO container.**************************************************************************************************************** //
  /*
  var VertexColorIdx_Arrays = function()
  {
	  this.meshVertices = [];
	  this.mesh_colors = [];
	  this.mesh_tri_indices = [];

	  this.meshVertexCacheKey= null;
	  this.meshColorsCacheKey= null;
	  this.meshFacesCacheKey= null;
  };

  var VBO_ArraysContainer = function()
  {
	  this.meshArrays = []; // "VertexColorIdx_Arrays" container.***
  };

  VBO_ArraysContainer.prototype.newVertexColorIdxArray = function()
  {
	  var vci_array = new VertexColorIdx_Arrays();
	  this.meshArrays.push(vci_array);
	  return vci_array;
  };
  */

  // F4D Block - Reference with LightMapping.****************************************************************************** //
  // Vertices and Indices VBO.********************************************************************************************* //

/**
 * 어떤 일을 하고 있습니까?
 * @class VertexIdxArrays
 */
var VertexIdxArrays = function() {
	if(!(this instanceof VertexIdxArrays)) {
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this.indicesCount = -1;

	this.meshVertexCacheKey= null;
	this.meshFacesCacheKey= null;
};

/**
 * 어떤 일을 하고 있습니까?
 * @class VertexIdxVBOArraysContainer
 */
var VertexIdxVBOArraysContainer = function() {
	if(!(this instanceof VertexIdxVBOArraysContainer)) {
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this._meshArrays = [];
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns vi_array
 */
VertexIdxVBOArraysContainer.prototype.newVertexIdxArray = function() {
	var vi_array = new VertexIdxArrays();
	this._meshArrays.push(vi_array);
	return vi_array;
};

/**
* 어떤 일을 하고 있습니까?
* @class ByteColorsVBOArrays
*/
var ByteColorsVBOArrays = function() {
	if(!(this instanceof ByteColorsVBOArrays)) {
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this.meshColorsCacheKey= null;
};

/**
 * 어떤 일을 하고 있습니까?
 * @class ByteColorsVBOArraysContainer
 */
var ByteColorsVBOArraysContainer = function() {
	if(!(this instanceof ByteColorsVBOArraysContainer)) {
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this._meshArrays = [];
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns byteColors_array
 */
ByteColorsVBOArraysContainer.prototype.newByteColorsVBOArray = function() {
	var byteColors_array = new ByteColorsVBOArrays();
	this._meshArrays.push(byteColors_array);
	return byteColors_array;
};

/**
 * 어떤 일을 하고 있습니까?
 * @class VertexTexcoordsArrays
 */
var VertexTexcoordsArrays = function() {
	if(!(this instanceof VertexTexcoordsArrays)) {
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this._vertices_array = [];
	this._texcoords_array = [];
};

/**
 * 어떤 일을 하고 있습니까?
 * @class VNTInterleavedCacheKeys
 */
var VNTInterleavedCacheKeys = function() {
	if(!(this instanceof VNTInterleavedCacheKeys)) {
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this.VNT_cacheKey = null;
	this.indices_cacheKey = null;
	this._vertices_count = 0;
	this.indicesCount = 0;
};

/**
 * 어떤 일을 하고 있습니까?
 * @class VertexTexcoordsArraysCacheKeys
 */
var VertexTexcoordsArraysCacheKeys = function() {
	if(!(this instanceof VertexTexcoordsArraysCacheKeys)) {
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this._verticesArray_cacheKey = null;
	this._texcoordsArray_cacheKey = null;
	this._vertices_count = 0;
	this._normalsArray_cacheKey = null;

	// arrayBuffers.***
	this.verticesArrayBuffer;
	this.texCoordsArrayBuffer;
	this.normalsArrayBuffer;
};

/**
 * 어떤 일을 하고 있습니까?
 * @class VertexTexcoordsArraysCacheKeysContainer
 */
var VertexTexcoordsArraysCacheKeysContainer = function() {
	if(!(this instanceof VertexTexcoordsArraysCacheKeysContainer)) {
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this._vtArrays_cacheKeys_array = [];
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns vt_cacheKey
 */
VertexTexcoordsArraysCacheKeysContainer.prototype.newVertexTexcoordsArraysCacheKey = function() {
	var vt_cacheKey = new VertexTexcoordsArraysCacheKeys();
	this._vtArrays_cacheKeys_array.push(vt_cacheKey);
	return vt_cacheKey;
};

/**
 * 어떤 일을 하고 있습니까?
 * @class SimpleObject
 */
var SimpleObject = function() {
	if(!(this instanceof SimpleObject)) {
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this._vtCacheKeys_container = new VertexTexcoordsArraysCacheKeysContainer();
};

/**
 * 어떤 일을 하고 있습니까?
 * @class SimpleStorey
 */
var SimpleStorey = function() {
	if(!(this instanceof SimpleStorey)) {
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this._simpleObjects_array = [];
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns simpleObject
 */
SimpleStorey.prototype.newSimpleObject = function() {
	var simpleObject = new SimpleObject();
	this._simpleObjects_array.push(simpleObject);
	return simpleObject;
};

/**
 * 어떤 일을 하고 있습니까?
 * @class SimpleBuilding
 */
var SimpleBuilding = function() {
	if(!(this instanceof SimpleBuilding)) {
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this._simpleStoreys_list = [];
	//this._simpleBuildingImage = new Image();
	this._simpleBuildingTexture;
	//this._simpleBuildingImage.onload = function() { handleTextureLoaded(this._simpleBuildingImage, this._simpleBuildingTexture); }
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns storey
 */
SimpleBuilding.prototype.newSimpleStorey = function() {
	var storey = new SimpleStorey();
	this._simpleStoreys_list.push(storey);
	return storey;
};

/**
 * 어떤 일을 하고 있습니까?
 * @class SimpleBuildingV1
 */
var SimpleBuildingV1 = function() {
	if(!(this instanceof SimpleBuildingV1)) {
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	// this class is for faster rendering XDO converted projects.***
	this._simpleObjects_array = [];
	this._simpleBuildingTexture; // Mini texture. Possibly coincident with texture_3.***
	this._texture_0; // Biggest texture.***
	this._texture_1;
	this._texture_2;
	this._texture_3; // Smallest texture.***

	this.color;

	// arrayBuffers.***
	this.textureArrayBuffer; // use this for all textures.***

	// for SPEED TEST.***
	this._vnt_cacheKeys;
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns simpleObject
 */
SimpleBuildingV1.prototype.newSimpleObject = function() {
	var simpleObject = new SimpleObject();
	this._simpleObjects_array.push(simpleObject);
	return simpleObject;
};

/**
 * 어떤 일을 하고 있습니까?
 * @class Header
 */
var Header = function() {
	if(!(this instanceof Header)) {
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this._f4d_version = 1;
	this._version = ""; // provisional for xdo.***
	this._type = -1;
	this._global_unique_id = "";

	this._latitude = 0.0;
	this._longitude = 0.0;
	this._elevation = 0.0;

	// Dont use this, if possible.***
	//this._yaw = 0.0;
	//this._pitch = 0.0;
	//this._roll = 0.0;

	this._boundingBox = new BoundingBox();
	this._octZerothBox = new BoundingBox(); // Provisionally...
	this._dataFileName = "";
	this._nailImageSize = 0;

	// Depending the bbox size, determine the LOD.***
	//this.bbox.maxLegth = 0.0;
	this.isSmall = false;

};

/**
 * 어떤 일을 하고 있습니까?
 * @class BRBuildingProject
 */
var BRBuildingProject = function() {
	if(!(this instanceof BRBuildingProject)) {
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this._header = new Header();

	// Block-Reference version of buildingProjects.***
	this.move_matrix = new Float32Array(16); // PositionMatrix.***
	this.moveMatrixInv = new Float32Array(16); // Inverse of PositionMatrix.***
	this.buildingPosMatInv;
	this.buildingPosition;
	this.buildingPositionHIGH;
	this.buildingPositionLOW;

	// Blocks data.***************************************************************
	this._blocksList_Container = new BlocksListsContainer();
	this.createDefaultBlockReferencesLists();

	// Compound references data.**************************************************
	this.octree;
	this._compRefList_Container = new CompoundReferencesListContainer(); // Exterior objects lists.***

	// SimpleBuilding.***************
	this._simpleBuilding = new SimpleBuilding(); // ifc simple building.***
	this._simpleBuilding_v1;

	//this._boundingBox;
	this.radius_aprox;

	// Test for stadistic. Delete this in the future.***
	this._total_triangles_count = 0;

	// Test for use workers.*****************************************************************
	this._VBO_ByteColorsCacheKeysContainer_List = [];
	// End test for use workers.-------------------------------------------------------------

	// SCRATCH.*** SCRATCH.*** SCRATCH.*** SCRATCH.*** SCRATCH.*** SCRATCH.*** SCRATCH.*** SCRATCH.***
	this._visibleCompRefLists_scratch = new CompoundReferencesList();
	this.point3dScratch = new Point3D();
	this.point3dScratch2 = new Point3D();

	// Header, SimpleBuildingGeometry and nailImage path-strings.**********************************
	this._f4d_rawPathName = ""; // Use only this.***

	this._f4d_headerPathName = "";
	this._f4d_header_readed = false;
	this._f4d_header_readed_finished = false;

	this._f4d_simpleBuildingPathName = "";
	this._f4d_simpleBuilding_readed = false;
	this._f4d_simpleBuilding_readed_finished = false;

	this._f4d_nailImagePathName = "";
	this._f4d_nailImage_readed = false;
	this._f4d_nailImage_readed_finished = false;

	this._f4d_lod0ImagePathName = "";
	this._f4d_lod0Image_readed = false;
	this._f4d_lod0Image_readed_finished = false;
	this._f4d_lod0Image_exists = true;

	this._f4d_lod1ImagePathName = "";
	this._f4d_lod1Image_readed = false;
	this._f4d_lod1Image_readed_finished = false;
	this._f4d_lod1Image_exists = true;

	this._f4d_lod2ImagePathName = "";
	this._f4d_lod2Image_readed = false;
	this._f4d_lod2Image_readed_finished = false;
	this._f4d_lod2Image_exists = true;

	this._f4d_lod3ImagePathName = "";
	this._f4d_lod3Image_readed = false;
	this._f4d_lod3Image_readed_finished = false;
	this._f4d_lod3Image_exists = true;

	// for SPEEDTEST. Delete after test.***
	this._xdo_simpleBuildingPathName = "";
	this._xdo_simpleBuilding_readed = false;
	this._xdo_simpleBuilding_readed_finished = false;
};

/**
 * 어떤 일을 하고 있습니까?
 */
BRBuildingProject.prototype.calculateTotalTrianglesCount = function() {
	// This is temp function for debugging.***
	var compRefList;
	var compRefsCount = 0;
	var interior_compRefLists_count = _interiorCompRefList_Container.compRefsListArray.length;
	for(var i=0; i<interior_compRefLists_count; i++) {
		compRefList = _interiorCompRefList_Container.compRefsListArray[i];
		compRefsCount = compRefList._compoundRefsArray.length;
		for(var j = 0; j < compRefsCount; j++) {

		}
	}
};

/**
 * 어떤 일을 하고 있습니까?
 * @param absolute_eye_x 변수
 * @param absolute_eye_y 변수
 * @param absolute_eye_z 변수
 * @returns point3dScratch2
 */
BRBuildingProject.prototype.getTransformedRelativeEyePositionToBuilding = function(absolute_eye_x, absolute_eye_y, absolute_eye_z) {
	// 1rst, calculate the relative eye position.***
	var buildingPosition = this.buildingPosition;
	var relative_eye_pos_x = absolute_eye_x - buildingPosition.x;
	var relative_eye_pos_y = absolute_eye_y - buildingPosition.y;
	var relative_eye_pos_z = absolute_eye_z - buildingPosition.z;

	if(this.buildingPosMatInv == undefined)
	{
		this.buildingPosMatInv = new Matrix4();
		this.buildingPosMatInv.setByFloat32Array(this.moveMatrixInv);
	}

	this.point3dScratch.set(relative_eye_pos_x, relative_eye_pos_y, relative_eye_pos_z);
	this.point3dScratch2 = this.buildingPosMatInv.transformPoint3D(this.point3dScratch, this.point3dScratch2);

	return this.point3dScratch2;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param eye_X 변수
 * @param eye_y 변수
 * @param eye_z 변수
 * @returns _header._boundingBox.isPoint3dInside(eye_x, eye_y, eye_z)
 */
BRBuildingProject.prototype.isCameraInsideOfBuilding = function(eye_x, eye_y, eye_z) {
	return this._header._boundingBox.isPoint3dInside(eye_x, eye_y, eye_z);
};

/**
 * 어떤 일을 하고 있습니까?
 * @param eye_x 변수
 * @param eye_y 변수
 * @param eye_z 변수
 */
BRBuildingProject.prototype.updateCurrentVisibleIndicesExterior = function(eye_x, eye_y, eye_z) {
	this._compRefList_Container.updateCurrentVisibleIndicesOfLists(eye_x, eye_y, eye_z);
};

/**
 * 어떤 일을 하고 있습니까?
 * @param eye_x 변수
 * @param eye_y 변수
 * @param eye_z 변수
 * @returns _visibleCompRefLists_scratch
 */
BRBuildingProject.prototype.getVisibleCompRefLists = function(eye_x, eye_y, eye_z) {
	// Old. Delete this.!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
	this._visibleCompRefLists_scratch = this._compRefList_Container.get_visibleCompRefObjectsList(eye_x, eye_y, eye_z, this._visibleCompRefLists_scratch);
	return this._visibleCompRefLists_scratch;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param eye_x 변수
 * @param eye_y 변수
 * @param eye_z 변수
 * @returns _compRefList_Container.get_visibleCompRefObjectsList(eye_x, eye_y, eye_z)
 */
BRBuildingProject.prototype.getVisibleEXTCompRefLists = function(eye_x, eye_y, eye_z) {
	// Old. Delete this.!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
	return this._compRefList_Container.get_visibleCompRefObjectsList(eye_x, eye_y, eye_z);
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns allCompRefLists
 */
BRBuildingProject.prototype.getAllCompRefLists = function() {
	var allCompRefLists = this._compRefList_Container.compRefsListArray.concat(this._interiorCompRefList_Container.compRefsListArray);
	return allCompRefLists;
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns radius_aprox
 */
BRBuildingProject.prototype.getRadiusAprox = function() {
	if(this._boundingBox == undefined) {
		var compRefList = this._compRefList_Container.getCompRefListByName("Ref_Skin1");
		if(compRefList) {
			this._boundingBox = new BoundingBox();
			this._boundingBox.minX = compRefList._ocCulling._ocCulling_box.minX;
			this._boundingBox.maxX = compRefList._ocCulling._ocCulling_box.maxX;
			this._boundingBox.minY = compRefList._ocCulling._ocCulling_box.minY;
			this._boundingBox.maxY = compRefList._ocCulling._ocCulling_box.maxY;
			this._boundingBox.minZ = compRefList._ocCulling._ocCulling_box.minZ;
			this._boundingBox.maxZ = compRefList._ocCulling._ocCulling_box.maxZ;

			this.radius_aprox = this._boundingBox.getMaxLength() / 2.0;
		}
	}

	return this.radius_aprox;
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns _boundingBox
 */
BRBuildingProject.prototype.getBoundingBox = function() {
 /*
	  if(this._boundingBox == undefined)
	  {
		  var boundingBox = null;

		  var compRefLists_count = this._compRefList_Container.compRefsListArray.length;
		  for(var i=0; i<compRefLists_count; i++)
		  {
			  var compRefList = this._compRefList_Container.compRefsListArray[i];
			  var blocksList = this._blocksList_Container.blocksListsArray[i];
			  var bb = compRefList.getBoundingBox(blocksList);
			  if(this._boundingBox == undefined)
			  {
				  if(bb != null)
				  this._boundingBox = bb;// malament. s'ha de multiplicar per el matrix de transformacio.***
			  }
			  else
			  {
				  if(bb != null)
					  this._boundingBox.addBox(bb);
			  }

		  }
	  }
	  */

	// Return the compReflList's occlussionCullingMotherBox.***
	if(this._boundingBox == undefined) {
		var compRefList = this._compRefList_Container.getCompRefListByName("Ref_Skin1");
		if(compRefList) {
			this._boundingBox = new BoundingBox();
			this._boundingBox.minX = compRefList._ocCulling._ocCulling_box._minX;
			this._boundingBox.maxX = compRefList._ocCulling._ocCulling_box.maxX;
			this._boundingBox.minY = compRefList._ocCulling._ocCulling_box.minY;
			this._boundingBox.maxY = compRefList._ocCulling._ocCulling_box.maxY;
			this._boundingBox.minZ = compRefList._ocCulling._ocCulling_box.minZ;
			this._boundingBox.maxZ = compRefList._ocCulling._ocCulling_box.maxZ;

			this.radius_aprox = this._boundingBox.getMaxLength() / 2.0;
		}
	}

	return this._boundingBox;
};

/**
 * 어떤 일을 하고 있습니까?
 */
BRBuildingProject.prototype.createDefaultBlockReferencesLists = function() {
	// Create 5 BlocksLists: "Blocks1", "Blocks2", "Blocks3", Blocks4" and "BlocksBone".***
	this._blocksList_Container.newBlocksList("Blocks1");
	this._blocksList_Container.newBlocksList("Blocks2");
	this._blocksList_Container.newBlocksList("Blocks3");

	this._blocksList_Container.newBlocksList("BlocksBone");
	this._blocksList_Container.newBlocksList("Blocks4");
};

/**
 * 어떤 일을 하고 있습니까?
 * @class PCloudMesh
 */
var PCloudMesh = function() {
	if(!(this instanceof PCloudMesh)) {
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	// this is a temporary class to render mesh from point cloud.***
	this.move_matrix = new Float32Array(16); // PositionMatrix.***
	this.moveMatrixInv = new Float32Array(16); // Inverse of PositionMatrix.***
	this.pCloudPosMat_inv;
	this._pCloudPosition;
	this._pCloudPositionHIGH;
	this._pCloudPositionLOW;

	this._header = new Header();
	this.vbo_datas = new VBOVertexIdxCacheKeysContainer(); // temp.***

	this._f4d_rawPathName = "";

	this._f4d_headerPathName = "";
	this._f4d_header_readed = false;
	this._f4d_header_readed_finished = false;

	this._f4d_geometryPathName = "";
	this._f4d_geometry_readed = false;
	this._f4d_geometry_readed_finished = false;
};

/**
 * 어떤 일을 하고 있습니까?
 * @class BRBuildingProjectsList
 */
var BRBuildingProjectsList = function() {
	if(!(this instanceof BRBuildingProjectsList)) {
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this._BR_buildingsArray = [];
	this._boundingBox;
	this._pCloudMesh_array = []; // 1rst aproximation to the pointCloud data. Test.***
	//this.detailed_building; // Test.***
	//this.compRefList_array; // Test.***
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns br_buildingProject
 */
BRBuildingProjectsList.prototype.newBRProject = function() {
	//var titol = "holes a tothom"
	//var br_buildingProject = new BRBuildingProject({Titol : titol});
	var br_buildingProject = new BRBuildingProject();
	this._BR_buildingsArray.push(br_buildingProject);
	return br_buildingProject;
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns _boundingBox
 */
BRBuildingProjectsList.prototype.getBoundingBox = function() {
	if(this._boundingBox == undefined) {
		var buildingProjects_count = this._BR_buildingsArray.length;
		for(var i=0; i<buildingProjects_count; i++) {
			var buildingProject = this._BR_buildingsArray[i];
			var currentBb = buildingProject.getBoundingBox();
			if(this._boundingBox == undefined) {
				if(currentBb != null)
					this._boundingBox = currentBb;
			}
			else
			{
				if(currentBb != null)
					this._boundingBox.addBox(currentBb);
			}
		}
	}
	return this._boundingBox;
};
