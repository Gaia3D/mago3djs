
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
 * @param dir_x 변수
 * @param dir_y 변수
 * @param dir_z 변수
 * @param distance 변수
 */
VertexList.prototype.translateVertices = function(dir_x, dir_y, dir_z, distance) {
	for(var i=0, vertex_count = this.vertexArray.length; i<vertex_count; i++) {
		this.vertexArray[i].translate(dir_x, dir_y, dir_z, distance);
	}
};

/**
 * 어떤 일을 하고 있습니까?
 * @param resultBox 변수
 * @returns resultBox
 */
VertexList.prototype.getBoundingBox = function(resultBox) {
	if(resultBox == undefined) resultBox = new BoundingBox();

	for(var i=0, vertex_count = this.vertexArray.length; i<vertex_count; i++) {
		if(i==0) resultBox.setInit (this.vertexArray[i].point3d);
		else resultBox.addPoint3D(this.vertexArray[i].point3d);
	}
	return resultBox;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param transformMatrix 변수
 */
VertexList.prototype.transformPointsByMatrix4 = function(transformMatrix) {
	for(var i=0, vertex_count = this.vertexArray.length; i<vertex_count; i++) {
		var vertex = this.vertexArray[i];
		transformMatrix.transformPoint3D(vertex.point3d, vertex.point3d);
	}
};
