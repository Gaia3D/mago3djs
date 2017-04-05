
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
	for(var i=0, total_vertex_count = this.totalVertexArraySC.length; i<total_vertex_count; i++) {
		if(i==0) resultBox.setInit (this.totalVertexArraySC[i].point3d);
		else resultBox.addPoint3D(this.totalVertexArraySC[i].point3d);
	}
	return resultBox;
};

/**
 * 어떤 일을 하고 있습니까?
 */
VertexMatrix.prototype.setVertexIdxInList = function() {
	var idx_in_list = 0;
	for(var i=0, vertexLists_count = this.vertexListsArray.length; i<vertexLists_count; i++) {
		var vtxList = this.vertexListsArray[i];
		for(var j=0, vertex_count = vtxList.vertexArray.length; j<vertex_count; j++) {
			var vertex = vtxList.getVertex(j);
			vertex.m_idx_inList = idx_in_list;
			idx_in_list++;
		}
	}
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns vertexCount
 */
VertexMatrix.prototype.getVertexCount = function() {
	var vertexCount = 0;
	for(var i=0, vertexLists_count = this.vertexListsArray.length; i<vertexLists_count; i++) {
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
	for(var i=0, vertexLists_count = this.vertexListsArray.length; i<vertexLists_count; i++) {
		var vtxList = this.vertexListsArray[i];
		for(var j=0, vertex_count = vtxList.vertexArray.length; j<vertex_count; j++) {
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
	
	var total_vertex_count = this.totalVertexArraySC.length;
	if(resultFloatArray == undefined) resultFloatArray = new Float32Array(total_vertex_count*6);
	
	for(var i=0; i<total_vertex_count; i++) {
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
	
	var total_vertex_count = this.totalVertexArraySC.length;
	if(resultFloatArray == undefined) resultFloatArray = new Float32Array(total_vertex_count*7);
	
	for(var i=0; i<total_vertex_count; i++) {
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
	
	var total_vertex_count = this.totalVertexArraySC.length;
	if(resultFloatArray == undefined) resultFloatArray = new Float32Array(total_vertex_count*3);
	
	for(var i=0; i<total_vertex_count; i++) {
		var vertex = this.totalVertexArraySC[i];
		resultFloatArray[i*3] = vertex.point3d.x;
		resultFloatArray[i*3+1] = vertex.point3d.y;
		resultFloatArray[i*3+2] = vertex.point3d.z;
	}
	
	return resultFloatArray;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param dir_x 변수
 * @param dir_y 변수
 * @param dir_z 변수
 * @param distance 변수
 */
VertexMatrix.prototype.translateVertices = function(dir_x, dir_y, dir_z, distance) {
	for(var i=0, vertexLists_count = this.vertexListsArray.length; i<vertexLists_count; i++) {
		this.vertexListsArray[i].translateVertices(dir_x, dir_y, dir_z, distance);
	}
};

/**
 * 어떤 일을 하고 있습니까?
 * @param tTrianglesMatrix 변수
 */
VertexMatrix.prototype.makeTTrianglesLateralSidesLOOP = function(tTrianglesMatrix) {
	// condition: all the vertex lists must have the same number of vertex.***
	var vtxList_1;
	var vtxList_2;
	var tTrianglesList;
	var tTriangle_1;
	var tTriangle_2;
	var vertex_count = 0;
	for(var i=0, vertexLists_count = this.vertexListsArray.length; i<vertexLists_count-1; i++) {
		vtxList_1 = this.vertexListsArray[i];
		vtxList_2 = this.vertexListsArray[i+1];
		tTrianglesList = tTrianglesMatrix.newTTrianglesList();
		
		vertex_count = vtxList_1.vertexArray.length;
		for(var j=0; j<vertex_count; j++) {
			tTriangle_1 = tTrianglesList.newTTriangle();
			tTriangle_2 = tTrianglesList.newTTriangle();
			
			if(j == vertex_count-1) {
				tTriangle_1.setVertices(vtxList_1.getVertex(j), vtxList_2.getVertex(j), vtxList_2.getVertex(0)); 
				tTriangle_2.setVertices(vtxList_1.getVertex(j), vtxList_2.getVertex(0), vtxList_1.getVertex(0)); 
			} else {
				tTriangle_1.setVertices(vtxList_1.getVertex(j), vtxList_2.getVertex(j), vtxList_2.getVertex(j+1)); 
				tTriangle_2.setVertices(vtxList_1.getVertex(j), vtxList_2.getVertex(j+1), vtxList_1.getVertex(j+1)); 
			}
		}
	}
};

/**
 * 어떤 일을 하고 있습니까?
 * @param transformMatrix
 */
VertexMatrix.prototype.transformPointsByMatrix4 = function(transformMatrix) {
	for(var i=0, vertexLists_count = this.vertexListsArray.length; i<vertexLists_count; i++) {
		var vtxList = this.vertexListsArray[i];
		vtxList.transformPointsByMatrix4(transformMatrix);
	}
};

