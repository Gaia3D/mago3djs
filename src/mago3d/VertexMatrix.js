
'use strict';


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
	var idxInList = 0;
	for(var i = 0, vertexListsCount = this.vertexListsArray.length; i < vertexListsCount; i++) {
		var vtxList = this.vertexListsArray[i];
		for(var j = 0, vertexCount = vtxList.vertexArray.length; j < vertexCount; j++) {
			var vertex = vtxList.getVertex(j);
			vertex.mIdxInList = idxInList;
			idxInList++;
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
	if(resultFloatArray == undefined) resultFloatArray = new Float32Array(totalVertexCount * 6);
	
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
	for(var i = 0, vertexListsCount = this.vertexListsArray.length; i < vertexListsCount-1; i++) {
		vtxList1 = this.vertexListsArray[i];
		vtxList2 = this.vertexListsArray[i+1];
		tTrianglesList = tTrianglesMatrix.newTTrianglesList();
		
		vertexCount = vtxList1.vertexArray.length;
		for(var j = 0; j < vertexCount; j++) {
			tTriangle1 = tTrianglesList.newTTriangle();
			tTriangle2 = tTrianglesList.newTTriangle();
			
			if(j == vertexCount-1) {
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

