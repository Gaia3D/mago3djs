
'use strict';

/**
 * 어떤 일을 하고 있습니까?
 * @class VertexList
 */
var VertexList = function() {
	if(!(this instanceof VertexList)) {
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this.vertexArray = [];
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns vertex
 */
VertexList.prototype.newVertex = function() {
	var vertex = new Vertex();
	this.vertexArray.push(vertex);
	return vertex;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param idx 변수
 * @returns vertexArray[idx]
 */
VertexList.prototype.getVertex = function(idx) {
	return this.vertexArray[idx];
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns vertexArray.length
 */
VertexList.prototype.getVertexCount = function() {
	return this.vertexArray.length;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param dirX 변수
 * @param dirY 변수
 * @param dirZ 변수
 * @param distance 변수
 */
VertexList.prototype.translateVertices = function(dirX, dirY, dirZ, distance) {
	for(var i = 0, vertexCount = this.vertexArray.length; i < vertexCount; i++) {
		this.vertexArray[i].translate(dirX, dirY, dirZ, distance);
	}
};

/**
 * 어떤 일을 하고 있습니까?
 * @param resultBox 변수
 * @returns resultBox
 */
VertexList.prototype.getBoundingBox = function(resultBox) {
	if(resultBox == undefined) resultBox = new BoundingBox();

	for(var i = 0, vertexCount = this.vertexArray.length; i < vertexCount; i++) {
		if(i == 0) resultBox.setInit (this.vertexArray[i].point3d);
		else resultBox.addPoint3D(this.vertexArray[i].point3d);
	}
	return resultBox;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param transformMatrix 변수
 */
VertexList.prototype.transformPointsByMatrix4 = function(transformMatrix) {
	for(var i = 0, vertexCount = this.vertexArray.length; i < vertexCount; i++) {
		var vertex = this.vertexArray[i];
		transformMatrix.transformPoint3D(vertex.point3d, vertex.point3d);
	}
};
