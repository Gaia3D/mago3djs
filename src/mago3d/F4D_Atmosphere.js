
// tornado : https://www.html5rocks.com/en/tutorials/casestudies/oz/
// https://www.html5rocks.com/static/demos/oz/tutorials/tornado/index.html

/**
 * 어떤 일을 하고 있습니까?
 */
var f4d_shadowBlendingCube = function() {
	this.vertexMatrix = new f4d_vertexMatrix();
	this.tTrianglesMatrix = new f4d_tTrianglesMatrix();
	this.init(this.vertexMatrix, this.tTrianglesMatrix);
	
	this.vbo_vertexCacheKey = undefined;
	this.vbo_indexCacheKey = undefined;
	this.indices_count = 0;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param vtxMat = 변수
 * @param tTriMat = 변수
 */
f4d_shadowBlendingCube.prototype.init = function(vtxMat, tTriMat) {
	// create a blending cube, with faces inverted.***
	var cubeSideSemiLength = 150.5;
	var vertex = undefined;
	
	var r = 0.1;
	var g = 0.1;
	var b = 0.1;
	var alpha = 0.6;
	
	// Center Bottom of the cube.***
	var vertex_list = vtxMat.new_vertexList();
	vertex = vertex_list.new_vertex();
	vertex.set_position(0.0, 0.0, -cubeSideSemiLength);
	vertex.set_colorRGBA(r, g, b, alpha);
	
	vertex = vertex_list.new_vertex();
	vertex.set_position(0.0, 0.0, -cubeSideSemiLength);
	vertex.set_colorRGBA(r, g, b, alpha);
	
	vertex = vertex_list.new_vertex();
	vertex.set_position(0.0, 0.0, -cubeSideSemiLength);
	vertex.set_colorRGBA(r, g, b, alpha);
	
	vertex = vertex_list.new_vertex();
	vertex.set_position(0.0, 0.0, -cubeSideSemiLength);
	vertex.set_colorRGBA(r, g, b, alpha);
	
	// Bottom of the cube.***
	vertex_list = vtxMat.new_vertexList();
	vertex = vertex_list.new_vertex();
	vertex.set_position(-cubeSideSemiLength, -cubeSideSemiLength, -cubeSideSemiLength);
	vertex.set_colorRGBA(r, g, b, alpha);
	
	vertex = vertex_list.new_vertex();
	vertex.set_position(cubeSideSemiLength, -cubeSideSemiLength, -cubeSideSemiLength);
	vertex.set_colorRGBA(r, g, b, alpha);
	
	vertex = vertex_list.new_vertex();
	vertex.set_position(cubeSideSemiLength, cubeSideSemiLength, -cubeSideSemiLength);
	vertex.set_colorRGBA(r, g, b, alpha);
	
	vertex = vertex_list.new_vertex();
	vertex.set_position(-cubeSideSemiLength, cubeSideSemiLength, -cubeSideSemiLength);
	vertex.set_colorRGBA(r, g, b, alpha);
	
	// Top of the cube.***
	vertex_list = vtxMat.new_vertexList();
	vertex = vertex_list.new_vertex();
	vertex.set_position(-cubeSideSemiLength, -cubeSideSemiLength, cubeSideSemiLength);
	vertex.set_colorRGBA(r, g, b, alpha);
	
	vertex = vertex_list.new_vertex();
	vertex.set_position(cubeSideSemiLength, -cubeSideSemiLength, cubeSideSemiLength);
	vertex.set_colorRGBA(r, g, b, alpha);
	
	vertex = vertex_list.new_vertex();
	vertex.set_position(cubeSideSemiLength, cubeSideSemiLength, cubeSideSemiLength);
	vertex.set_colorRGBA(r, g, b, alpha);
	
	vertex = vertex_list.new_vertex();
	vertex.set_position(-cubeSideSemiLength, cubeSideSemiLength, cubeSideSemiLength);
	vertex.set_colorRGBA(r, g, b, alpha);
	
	// Center Top of the cube.***
	vertex_list = vtxMat.new_vertexList();
	vertex = vertex_list.new_vertex();
	vertex.set_position(0.0, 0.0, cubeSideSemiLength);
	vertex.set_colorRGBA(r, g, b, alpha);
	
	vertex = vertex_list.new_vertex();
	vertex.set_position(0.0, 0.0, cubeSideSemiLength);
	vertex.set_colorRGBA(r, g, b, alpha);
	
	vertex = vertex_list.new_vertex();
	vertex.set_position(0.0, 0.0, cubeSideSemiLength);
	vertex.set_colorRGBA(r, g, b, alpha);
	
	vertex = vertex_list.new_vertex();
	vertex.set_position(0.0, 0.0, cubeSideSemiLength);
	vertex.set_colorRGBA(r, g, b, alpha);
	
	// Now, make the tTrianglesMatrix.***
	vtxMat.make_tTriangles_lateralSidesLOOP(tTriMat);
	//tTriMat.invert_trianglesSense();
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns floatArray
 */
f4d_shadowBlendingCube.prototype.get_vbo_vertexColorRGBA_FloatArray = function() {
	var floatArray = this.vertexMatrix.get_vbo_vertexColorRGBA_FloatArray(floatArray);
	return floatArray;
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns shortArray
 */
f4d_shadowBlendingCube.prototype.get_vbo_indices_ShortArray = function() {
	this.vertexMatrix.set_vertexIdxInList();
	var shortArray = this.tTrianglesMatrix.get_vbo_indices_ShortArray();
	this.indices_count = shortArray.length;
	
	return shortArray;
};

/**
 * 어떤 일을 하고 있습니까?
 */
var f4d_atmosphere = function() {
	this.cloudsManager = new f4d_cloudsManager();
	this.shadowBlendingCube = new f4d_shadowBlendingCube();
};

/**
 * 어떤 일을 하고 있습니까?
 */
var f4d_cloudsManager = function() {
	this.circularCloudsArray = [];
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns circularCloud
 */
f4d_cloudsManager.prototype.newCircularCloud = function() {
	var circularCloud = new f4d_circularCloud();
	this.circularCloudsArray.push(circularCloud);
	return circularCloud;
};

/**
 * 어떤 일을 하고 있습니까?
 */
var f4d_circularCloud = function() {
	this.radius = 200.0;
	this.depth = 150.0;
	this.numPointsForCicle = 8;
	
	this.vertexMatrix = new f4d_vertexMatrix();
	this.tTrianglesMatrix = new f4d_tTrianglesMatrix();
	this.shadowVertexMatrix = new f4d_vertexMatrix();
	this.shadowTTrianglesMatrix = new f4d_tTrianglesMatrix();
	
	this.sunLightDirection = new f4d_point3d();
	this.sunLightDirection.set(1, 1, -5);
	this.sunLightDirection.unitary();
	
	this.longitude = undefined;
	this.latitude = undefined;
	this.altitude = undefined;
	this.position = undefined;
	this.positionHIGH = undefined;
	this.positionLOW = undefined;
	
	this.bbox = new f4d_boundingBox();
	this.cullingPosition = undefined;
	this.cullingRadius = undefined;
	//--------------------------------------
	
	this.vbo_vertexCacheKey = undefined;
	this.vbo_indexCacheKey = undefined;
	this.vbo_shadowVertexCacheKey = undefined;
	this.vbo_shadowIndexCacheKey = undefined;
	this.indices_count = 0;
	
	this.rendered = false; // Test.***
	
	// SCRATCH.*** SCRATCH.*** SCRATCH.*** SCRATCH.*** SCRATCH.*** SCRATCH.*** SCRATCH.*** SCRATCH.***
	this.point3dSC = new f4d_point3d();
	this.vertexSC = new f4d_vertex();
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns floatArray
 */
f4d_circularCloud.prototype.get_vbo_vertexColor_FloatArray = function() {
	var floatArray = this.vertexMatrix.get_vbo_vertexColor_FloatArray(floatArray);
	return floatArray;
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns floatArray
 */
f4d_circularCloud.prototype.get_vbo_indices_ShortArray = function() {
	this.vertexMatrix.set_vertexIdxInList();
	var shortArray = this.tTrianglesMatrix.get_vbo_indices_ShortArray();
	this.indices_count = shortArray.length;
	
	return shortArray;
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns floatArray
 */
f4d_circularCloud.prototype.get_vbo_shadowVertex_FloatArray = function() {
	var floatArray = this.shadowVertexMatrix.get_vbo_vertex_FloatArray(floatArray);
	return floatArray;
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns shortArray
 */
f4d_circularCloud.prototype.get_vbo_shadowIndices_ShortArray = function() {
	this.shadowVertexMatrix.set_vertexIdxInList();
	var shortArray = this.shadowTTrianglesMatrix.get_vbo_indices_ShortArray();
	this.indices_count = shortArray.length;
	
	return shortArray;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param vtxMat = 변수
 */
f4d_circularCloud.prototype.rotateMesh_byLocation = function(vtxMat) {
	// we rotate the cloud mesh by longitude, latitude.***
	var matrix = new f4d_Matrix4();
	
	// 1) Rotation Z. Longitude.***
	var vertex = undefined;
	matrix.RotationAxis_angDeg(-this.longitude, 0.0, 0.0, 1.0);
	vtxMat.transformPoints_byMatrix4(matrix);
	
	// 2) Rotation X'. Latitude.***
	var longitudeRad = this.longitude * Math.PI/180.0;
	
	var cloudEquatorialPos = new f4d_point3d();
	var zAxis = new f4d_point3d();
	var pitchAxis = undefined;
	cloudEquatorialPos.set(Math.cos(longitudeRad), Math.sin(longitudeRad), 0.0);
	zAxis.set(0.0, 0.0, 1.0);
	pitchAxis = cloudEquatorialPos.crossProduct(zAxis, pitchAxis);
	pitchAxis.unitary();

	//matrix.RotationAxis_angDeg(90.0-this.latitude, Math.cos(longitudeRad-90), -Math.sin(longitudeRad-90), 0.0);
	matrix.RotationAxis_angDeg(90.0-this.latitude, pitchAxis.x, pitchAxis.y, 0.0);
	vtxMat.transformPoints_byMatrix4(matrix);
};

/**
 * 어떤 일을 하고 있습니까?
 */
f4d_circularCloud.prototype.doShadowMesh_withSunDirection = function() {
	var distance = 3000.0;
	var vertexList = this.shadowVertexMatrix.get_vertexList(5); // Bottom radius zero ring.***
	vertexList.translate_vertices(this.sunLightDirection.x, this.sunLightDirection.y, this.sunLightDirection.z, distance);
	
	vertexList = this.shadowVertexMatrix.get_vertexList(4); // Bottom minor ring.***
	vertexList.translate_vertices(this.sunLightDirection.x, this.sunLightDirection.y, this.sunLightDirection.z, distance);
	
	vertexList = this.shadowVertexMatrix.get_vertexList(3); // Bottom major ring.***
	vertexList.translate_vertices(this.sunLightDirection.x, this.sunLightDirection.y, this.sunLightDirection.z, distance);
};

/**
 * 어떤 일을 하고 있습니까?
 * @param logitude = 경도
 * @param latitude = 위도
 * @param radius = 반지름
 * @param depth = 깊이
 * @param numPointsForCircle = 변수
 */
f4d_circularCloud.prototype.createCloud = function(longitude, latitude, altitude, radius, depth, numPointsForCircle) {
	this.longitude = longitude;
	this.latitude = latitude;
	this.altitude = altitude;
	this.radius = radius;
	this.depth = depth;
	this.numPointsForCicle = numPointsForCircle;
	
	this.makeMesh(this.vertexMatrix, this.tTrianglesMatrix, this.shadowVertexMatrix, this.shadowTTrianglesMatrix);
	//this.makeMesh(this.shadowVertexMatrix, this.shadowTTrianglesMatrix, true);
	//this.shadowTTrianglesMatrix.invert_trianglesSense();// TEST!!!!!!
	this.doShadowMesh_withSunDirection();
	
	this.rotateMesh_byLocation(this.vertexMatrix);
	this.rotateMesh_byLocation(this.shadowVertexMatrix);
	
	var position = Cesium.Cartesian3.fromDegrees(this.longitude, this.latitude, this.altitude); 
	this.position = position; 
	
	var splitValue = Cesium.EncodedCartesian3.encode(position);
	var splitVelue_X  = Cesium.EncodedCartesian3.encode(position.x);
	var splitVelue_Y  = Cesium.EncodedCartesian3.encode(position.y);
	var splitVelue_Z  = Cesium.EncodedCartesian3.encode(position.z);
	
	this.positionHIGH = new Float32Array(3);
	this.positionHIGH[0] = splitVelue_X.high;
	this.positionHIGH[1] = splitVelue_Y.high;
	this.positionHIGH[2] = splitVelue_Z.high;
	
	this.positionLOW = new Float32Array(3);
	this.positionLOW[0] = splitVelue_X.low;
	this.positionLOW[1] = splitVelue_Y.low;
	this.positionLOW[2] = splitVelue_Z.low;
	
	this.bbox = this.shadowVertexMatrix.get_boundingBox(this.bbox);
	var cloud_point3d = this.bbox.get_centerPoint3d(cloud_point3d);
	this.cullingPosition = new Cesium.Cartesian3(cloud_point3d.x + this.position.x,  cloud_point3d.y + this.position.y,  cloud_point3d.z + this.position.z) ;
	this.cullingRadius = this.bbox.get_maxLength()/2;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param vtxMat = 변수
 * @param tTriMat = 변수
 * @param shadowVtxMat = 변수
 * @param shadowTTriMat = 변수
 */
f4d_circularCloud.prototype.makeMesh = function(vtxMat, tTriMat, shadowVtxMat, shadowTTriMat) {
	// use vertex_matrix.***
	// our cloud has 6 rings. Top ring and the bottom ring has radius zero.***
	var numPointsForRing = 16;
	var increAngRad = (2.0*Math.PI)/numPointsForRing;
	var angRad = 0.0;
	var vertex = undefined;
	var shadow_vertex = undefined;
	var semi_depth = this.depth/2.0;
	var x = 0.0;
	var y = 0.0;
	var randomValue = 0;
	var cloudWhite = 0.98;
	
	// 1) Top ring. radius zero.***
	var vertex_list = vtxMat.new_vertexList();
	var shadow_vertex_list = shadowVtxMat.new_vertexList();
	randomValue = 0.9+0.3*Math.random();
	for(var i=0; i<numPointsForRing; i++)
	{
		vertex = vertex_list.new_vertex();
		vertex.set_position(x, y, semi_depth);
		shadow_vertex = shadow_vertex_list.new_vertex();
		shadow_vertex.set_position(x, y, -semi_depth*1.2);
		vertex.set_colorRGB(randomValue, randomValue, randomValue);
	}
	
	// 2) Top menor_ring.***
	angRad = 0.0;
	var menor_ring_radius = this.radius * 0.7;
	vertex_list = vtxMat.new_vertexList();
	shadow_vertex_list = shadowVtxMat.new_vertexList();
	for(var i=0; i<numPointsForRing; i++)
	{
		//Math.random(); // returns from 0.0 to 1.0.***
		randomValue = (2+Math.random())/2;
		vertex = vertex_list.new_vertex();
		shadow_vertex = shadow_vertex_list.new_vertex();
		x = menor_ring_radius*Math.cos(angRad)*randomValue;
		y = menor_ring_radius*Math.sin(angRad)*randomValue;
		shadow_vertex.set_position(x, y, -semi_depth*2);
		vertex.set_position(x, y, semi_depth*0.8);
		randomValue = 0.9+0.3*Math.random();
		vertex.set_colorRGB(randomValue, randomValue, randomValue);
		angRad += increAngRad;
	}
	
	// 3) Top major_ring.***
	angRad = 0.0;
	vertex_list = vtxMat.new_vertexList();
	shadow_vertex_list = shadowVtxMat.new_vertexList();
	for(var i=0; i<numPointsForRing; i++)
	{
		randomValue = (2+Math.random())/2;
		vertex = vertex_list.new_vertex();
		shadow_vertex = shadow_vertex_list.new_vertex();
		x = this.radius*Math.cos(angRad)*randomValue;
		y = this.radius*Math.sin(angRad)*randomValue;
		shadow_vertex.set_position(x, y, -semi_depth*2);
		vertex.set_position(x, y, semi_depth*0.4);
		
		randomValue = 0.9+0.3*Math.random();
		vertex.set_colorRGB(randomValue, randomValue, randomValue);
		angRad += increAngRad;
	}
	
	// 4) Bottom major_ring.***
	angRad = 0.0;
	vertex_list = vtxMat.new_vertexList();
	shadow_vertex_list = shadowVtxMat.new_vertexList();
	for(var i=0; i<numPointsForRing; i++)
	{
		randomValue = (2+Math.random())/2;
		vertex = vertex_list.new_vertex();
		shadow_vertex = shadow_vertex_list.new_vertex();
		x = this.radius*Math.cos(angRad)*randomValue;
		y = this.radius*Math.sin(angRad)*randomValue;
		shadow_vertex.set_position(x, y, -semi_depth*2);
		vertex.set_position(x, y, -semi_depth*0.4);
		randomValue = 0.8+0.3*Math.random();
		vertex.set_colorRGB(randomValue, randomValue, randomValue);
		angRad += increAngRad;
	}
	
	// 5) Bottom menor_ring.***
	angRad = 0.0;
	menor_ring_radius = this.radius * 0.7;
	vertex_list = vtxMat.new_vertexList();
	shadow_vertex_list = shadowVtxMat.new_vertexList();
	for(var i=0; i<numPointsForRing; i++)
	{
		randomValue = (2+Math.random())/2;
		vertex = vertex_list.new_vertex();
		shadow_vertex = shadow_vertex_list.new_vertex();
		x = menor_ring_radius*Math.cos(angRad)*randomValue;
		y = menor_ring_radius*Math.sin(angRad)*randomValue;
		vertex.set_position(x, y, -semi_depth*0.8);
		shadow_vertex.set_position(x, y, -semi_depth*1.2);
		
		randomValue = 0.6+0.3*Math.random();
		vertex.set_colorRGB(randomValue, randomValue, randomValue);
		//vertex.set_colorRGB(0.58, 0.58, 0.58);
		angRad += increAngRad;
	}
	
	// 6) Bottom ring. radius zero.***
	vertex_list = vtxMat.new_vertexList();
	shadow_vertex_list = shadowVtxMat.new_vertexList();
	randomValue = 0.6+0.3*Math.random();
	for(var i=0; i<numPointsForRing; i++)
	{
		//randomValue = (2+Math.random())/2;
		vertex = vertex_list.new_vertex();
		shadow_vertex = shadow_vertex_list.new_vertex();
		vertex.set_position(0.0, 0.0, -semi_depth);
		shadow_vertex.set_position(0.0, 0.0, -semi_depth);
		
		vertex.set_colorRGB(randomValue, randomValue, randomValue);
		//vertex.set_colorRGB(0.58, 0.58, 0.58);
	}
	
	// Now, make the tTrianglesMatrix.***
	vtxMat.make_tTriangles_lateralSidesLOOP(tTriMat);
	shadowVtxMat.make_tTriangles_lateralSidesLOOP(shadowTTriMat);
	//tTriMat.invert_trianglesSense(); // No.***
	
	// Now, calculate the culling bbox.***
};
