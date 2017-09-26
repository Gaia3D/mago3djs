'use strict';

/**
 * 하늘에 구름을 관리하는 매니저
 *
 * @class Atmosphere
 */
var Atmosphere = function() 
{
	if (!(this instanceof Atmosphere)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this.cloudsManager = new CloudsManager();
	this.shadowBlendingCube = new ShadowBlendingCube();
};

/**
 * 구름이 땅에 그림자를 그릴때 사용함
 *
 * @class ShadowBlendingCube
 */
var ShadowBlendingCube = function() 
{
	if (!(this instanceof ShadowBlendingCube)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this.vertexMatrix = new VertexMatrix();
	this.tTrianglesMatrix = new TTrianglesMatrix();
	this.init(this.vertexMatrix, this.tTrianglesMatrix);

	this.vboVertexCacheKey;
	this.vboIndexCacheKey;
	this.indicesCount = 0;
};

/**
 * 구름이 땅에 그림자를 그릴때 초기화
 *
 * @param vtxMat 변수
 * @param tTriMat 변수
 */
ShadowBlendingCube.prototype.init = function(vtxMat, tTriMat) 
{
	// create a blending cube, with faces inverted.***
	var cubeSideSemiLength = 150.5;

	var r = 0.1;
	var g = 0.1;
	var b = 0.1;
	var alpha = 0.6;

	// Center Bottom of the cube.***
	var vertexList = vtxMat.newVertexList();
	var vertex = vertexList.newVertex();
	vertex.setPosition(0.0, 0.0, -cubeSideSemiLength);
	vertex.setColorRGBA(r, g, b, alpha);

	vertex = vertexList.newVertex();
	vertex.setPosition(0.0, 0.0, -cubeSideSemiLength);
	vertex.setColorRGBA(r, g, b, alpha);

	vertex = vertexList.newVertex();
	vertex.setPosition(0.0, 0.0, -cubeSideSemiLength);
	vertex.setColorRGBA(r, g, b, alpha);

	vertex = vertexList.newVertex();
	vertex.setPosition(0.0, 0.0, -cubeSideSemiLength);
	vertex.setColorRGBA(r, g, b, alpha);

	// Bottom of the cube.***
	vertexList = vtxMat.newVertexList();
	vertex = vertexList.newVertex();
	vertex.setPosition(-cubeSideSemiLength, -cubeSideSemiLength,
		-cubeSideSemiLength);
	vertex.setColorRGBA(r, g, b, alpha);

	vertex = vertexList.newVertex();
	vertex.setPosition(cubeSideSemiLength, -cubeSideSemiLength,
		-cubeSideSemiLength);
	vertex.setColorRGBA(r, g, b, alpha);

	vertex = vertexList.newVertex();
	vertex.setPosition(cubeSideSemiLength, cubeSideSemiLength,
		-cubeSideSemiLength);
	vertex.setColorRGBA(r, g, b, alpha);

	vertex = vertexList.newVertex();
	vertex.setPosition(-cubeSideSemiLength, cubeSideSemiLength,
		-cubeSideSemiLength);
	vertex.setColorRGBA(r, g, b, alpha);

	// Top of the cube.***
	vertexList = vtxMat.newVertexList();
	vertex = vertexList.newVertex();
	vertex.setPosition(-cubeSideSemiLength, -cubeSideSemiLength,
		cubeSideSemiLength);
	vertex.setColorRGBA(r, g, b, alpha);

	vertex = vertexList.newVertex();
	vertex.setPosition(cubeSideSemiLength, -cubeSideSemiLength,
		cubeSideSemiLength);
	vertex.setColorRGBA(r, g, b, alpha);

	vertex = vertexList.newVertex();
	vertex.setPosition(cubeSideSemiLength, cubeSideSemiLength,
		cubeSideSemiLength);
	vertex.setColorRGBA(r, g, b, alpha);

	vertex = vertexList.newVertex();
	vertex.setPosition(-cubeSideSemiLength, cubeSideSemiLength,
		cubeSideSemiLength);
	vertex.setColorRGBA(r, g, b, alpha);

	// Center Top of the cube.***
	vertexList = vtxMat.newVertexList();
	vertex = vertexList.newVertex();
	vertex.setPosition(0.0, 0.0, cubeSideSemiLength);
	vertex.setColorRGBA(r, g, b, alpha);

	vertex = vertexList.newVertex();
	vertex.setPosition(0.0, 0.0, cubeSideSemiLength);
	vertex.setColorRGBA(r, g, b, alpha);

	vertex = vertexList.newVertex();
	vertex.setPosition(0.0, 0.0, cubeSideSemiLength);
	vertex.setColorRGBA(r, g, b, alpha);

	vertex = vertexList.newVertex();
	vertex.setPosition(0.0, 0.0, cubeSideSemiLength);
	vertex.setColorRGBA(r, g, b, alpha);

	// Now, make the tTrianglesMatrix.***
	vtxMat.makeTTrianglesLateralSidesLOOP(tTriMat);
	// tTriMat.invert_trianglesSense();
};

/**
 * 그래픽 카드에 데이터를 올릴때 요청
 *
 * @returns floatArray
 */
ShadowBlendingCube.prototype.getVBOVertexColorRGBAFloatArray = function() 
{
	var floatArray = this.vertexMatrix.getVBOVertexColorRGBAFloatArray();
	return floatArray;
};

/**
 * 그래픽 카드에 데이터를 올릴때 사용(삼각형을 이루어 주는 순서)
 *
 * @returns shortArray
 */
ShadowBlendingCube.prototype.getVBOIndicesShortArray = function() 
{
	this.vertexMatrix.setVertexIdxInList();
	var shortArray = this.tTrianglesMatrix.getVBOIndicesShortArray();
	this.indicesCount = shortArray.length;

	return shortArray;
};

/**
 * 구름 매니저
 *
 * @class CloudsManager
 */
var CloudsManager = function() 
{
	if (!(this instanceof CloudsManager)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	this.circularCloudsArray = [];
};

/**
 * 원형 구름 생성
 *
 * @returns circularCloud
 */
CloudsManager.prototype.newCircularCloud = function() 
{
	var circularCloud = new CircularCloud();
	this.circularCloudsArray.push(circularCloud);
	return circularCloud;
};

/**
 * 원형 구름
 *
 * @class CircularCloud
 */
var CircularCloud = function() 
{
	if (!(this instanceof CircularCloud)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this.radius = 200.0;
	this.depth = 150.0;
	this.numPointsForCicle = 8;

	this.vertexMatrix = new VertexMatrix();
	this.tTrianglesMatrix = new TTrianglesMatrix();
	this.shadowVertexMatrix = new VertexMatrix();
	this.shadowTTrianglesMatrix = new TTrianglesMatrix();

	this.sunLightDirection = new Point3D();
	this.sunLightDirection.set(1, 1, -5);
	this.sunLightDirection.unitary();

	this.longitude;
	this.latitude;
	this.altitude;
	this.position;
	this.positionHIGH;
	this.positionLOW;

	this.bbox = new BoundingBox();
	this.cullingPosition;
	this.cullingRadius;

	this.vboVertexCacheKey;
	this.vboIndexCacheKey;
	this.vboShadowVertexCacheKey;
	this.vboShadowIndexCacheKey;
	this.indicesCount = 0;

	this.rendered = false; // Test.***

	// SCRATCH.*** SCRATCH.*** SCRATCH.*** SCRATCH.*** SCRATCH.*** SCRATCH.***
	// SCRATCH.*** SCRATCH.***
	this.point3dSC = new Point3D();
	this.vertexSC = new Vertex();
};

/**
 * 그래픽 카드에 올릴 데이터를 요청
 *
 * @returns floatArray
 */
CircularCloud.prototype.getVBOVertexColorFloatArray = function() 
{
	var floatArray;
	floatArray = this.vertexMatrix.getVBOVertexColorFloatArray(floatArray);
	return floatArray;
};

/**
 * 그래픽 카드에 올릴 데이터를 요청(삼각형)
 *
 * @returns floatArray
 */
CircularCloud.prototype.getVBOIndicesShortArray = function() 
{
	this.vertexMatrix.setVertexIdxInList();
	var shortArray = this.tTrianglesMatrix.getVBOIndicesShortArray();
	this.indicesCount = shortArray.length;

	return shortArray;
};

/**
 * 그래픽 카드에 올릴 데이터를 요청(Vertex)
 *
 * @returns floatArray
 */
CircularCloud.prototype.getVBOShadowVertexFloatArray = function() 
{
	var floatArray;
	floatArray = this.shadowVertexMatrix.getVBOVertexFloatArray(floatArray);
	return floatArray;
};

/**
 * 그래픽 카드에 올릴 데이터를 요청(삼삭형 순서)
 *
 * @returns shortArray
 */
CircularCloud.prototype.getVBOShadowIndicesShortArray = function() 
{
	this.shadowVertexMatrix.setVertexIdxInList();
	var shortArray = this.shadowTTrianglesMatrix.getVBOIndicesShortArray();
	this.indicesCount = shortArray.length;

	return shortArray;
};

/**
 * 로케이션을 따라서 회전
 *
 * @param vtxMat
 *            변수
 */
CircularCloud.prototype.rotateMeshByLocation = function(vtxMat) 
{
	// we rotate the cloud mesh by longitude, latitude.***
	var matrix = new Matrix4();

	// 1) Rotation Z. Longitude.***
	matrix.rotationAxisAngDeg(-this.longitude, 0.0, 0.0, 1.0);
	vtxMat.transformPointsByMatrix4(matrix);

	// 2) Rotation X'. Latitude.***
	var longitudeRad = this.longitude * Math.PI / 180.0;

	var cloudEquatorialPos = new Point3D();
	var zAxis = new Point3D();
	var pitchAxis;
	cloudEquatorialPos.set(Math.cos(longitudeRad), Math.sin(longitudeRad), 0.0);
	zAxis.set(0.0, 0.0, 1.0);
	pitchAxis = cloudEquatorialPos.crossProduct(zAxis, pitchAxis);
	pitchAxis.unitary();

	// matrix.rotationAxisAngDeg(90.0-this.latitude, Math.cos(longitudeRad-90),
	// -Math.sin(longitudeRad-90), 0.0);
	matrix.rotationAxisAngDeg(90.0 - this.latitude, pitchAxis.x, pitchAxis.y,
		0.0);
	vtxMat.transformPointsByMatrix4(matrix);
};

/**
 * 햇빛 방향으로 시작
 */
CircularCloud.prototype.doShadowMeshWithSunDirection = function() 
{
	var distance = 3000.0;
	var vertexList = this.shadowVertexMatrix.getVertexList(5); // Bottom radius
	// zero ring.***
	vertexList.translateVertices(this.sunLightDirection.x,
		this.sunLightDirection.y, this.sunLightDirection.z, distance);

	vertexList = this.shadowVertexMatrix.getVertexList(4); // Bottom minor
	// ring.***
	vertexList.translateVertices(this.sunLightDirection.x,
		this.sunLightDirection.y, this.sunLightDirection.z, distance);

	vertexList = this.shadowVertexMatrix.getVertexList(3); // Bottom major
	// ring.***
	vertexList.translateVertices(this.sunLightDirection.x,
		this.sunLightDirection.y, this.sunLightDirection.z, distance);
};

/**
 * 구름 생성
 *
 * @param logitude
 *            경도
 * @param latitude
 *            위도
 * @param radius
 *            반지름
 * @param depth
 *            깊이
 * @param numPointsForCircle
 *            동그라미 하나당 점의 갯수
 */
CircularCloud.prototype.createCloud = function(longitude, latitude, altitude,
	radius, depth, numPointsForCircle) 
{
	this.longitude = longitude;
	this.latitude = latitude;
	this.altitude = altitude;
	this.radius = radius;
	this.depth = depth;
	this.numPointsForCicle = numPointsForCircle;

	this.makeMesh(this.vertexMatrix, this.tTrianglesMatrix,
		this.shadowVertexMatrix, this.shadowTTrianglesMatrix);
	// this.makeMesh(this.shadowVertexMatrix, this.shadowTTrianglesMatrix,
	// true);
	// this.shadowTTrianglesMatrix.invertTrianglesSense();// TEST!!!!!!
	this.doShadowMeshWithSunDirection();

	this.rotateMeshByLocation(this.vertexMatrix);
	this.rotateMeshByLocation(this.shadowVertexMatrix);

	var position = Cesium.Cartesian3.fromDegrees(this.longitude, this.latitude,
		this.altitude);
	this.position = position;

	// var splitValue = Cesium.EncodedCartesian3.encode(position);
	var splitVelueX = Cesium.EncodedCartesian3.encode(position.x);
	var splitVelueY = Cesium.EncodedCartesian3.encode(position.y);
	var splitVelueZ = Cesium.EncodedCartesian3.encode(position.z);

	this.positionHIGH = new Float32Array([ splitVelueX.high, splitVelueY.high,
		splitVelueZ.high ]);
	this.positionLOW = new Float32Array([ splitVelueX.low, splitVelueY.low,
		splitVelueZ.low ]);

	this.bbox = this.shadowVertexMatrix.getBoundingBox(this.bbox);
	var cloudPoint3d;
	cloudPoint3d = this.bbox.getCenterPoint(cloudPoint3d);
	this.cullingPosition = new Cesium.Cartesian3(cloudPoint3d.x
			+ this.position.x, cloudPoint3d.y + this.position.y, cloudPoint3d.z
			+ this.position.z);
	this.cullingRadius = this.bbox.getMaxLength() / 2;
};

/**
 * mesh 생성
 *
 * @param vtxMat
 *            변수
 * @param tTriMat
 *            변수
 * @param shadowVtxMat
 *            변수
 * @param shadowTTriMat
 *            변수
 */
CircularCloud.prototype.makeMesh = function(vtxMat, tTriMat, shadowVtxMat,
	shadowTTriMat) 
{
	// use vertex_matrix.***
	// our cloud has 6 rings. Top ring and the bottom ring has radius zero.***
	var numPointsForRing = 16;
	var increAngRad = (2.0 * Math.PI) / numPointsForRing;
	var angRad = 0.0;
	var vertex;
	var shadowVertex;
	var semiDepth = this.depth / 2.0;
	var x = 0.0;
	var y = 0.0;
	var randomValue = 0;
	// var cloudWhite = 0.98;

	// 1) Top ring. radius zero.***
	var vertexList = vtxMat.newVertexList();
	var shadowVertexList = shadowVtxMat.newVertexList();
	randomValue = 0.9 + 0.3 * Math.random();
	for (var i = 0; i < numPointsForRing; i++) 
	{
		vertex = vertexList.newVertex();
		vertex.setPosition(x, y, semiDepth);
		shadowVertex = shadowVertexList.newVertex();
		shadowVertex.setPosition(x, y, -semiDepth * 1.2);
		vertex.setColorRGB(randomValue, randomValue, randomValue);
	}

	// 2) Top menor_ring.***
	angRad = 0.0;
	var menorRingRadius = this.radius * 0.7;
	vertexList = vtxMat.newVertexList();
	shadowVertexList = shadowVtxMat.newVertexList();
	for (var i = 0; i < numPointsForRing; i++) 
	{
		// Math.random(); // returns from 0.0 to 1.0.***
		randomValue = (2 + Math.random()) / 2;
		vertex = vertexList.newVertex();
		shadowVertex = shadowVertexList.newVertex();
		x = menorRingRadius * Math.cos(angRad) * randomValue;
		y = menorRingRadius * Math.sin(angRad) * randomValue;
		shadowVertex.setPosition(x, y, -semiDepth * 2);
		vertex.setPosition(x, y, semiDepth * 0.8);
		randomValue = 0.9 + 0.3 * Math.random();
		vertex.setColorRGB(randomValue, randomValue, randomValue);
		angRad += increAngRad;
	}

	// 3) Top major_ring.***
	angRad = 0.0;
	vertexList = vtxMat.newVertexList();
	shadowVertexList = shadowVtxMat.newVertexList();
	for (var i = 0; i < numPointsForRing; i++) 
	{
		randomValue = (2 + Math.random()) / 2;
		vertex = vertexList.newVertex();
		shadowVertex = shadowVertexList.newVertex();
		x = this.radius * Math.cos(angRad) * randomValue;
		y = this.radius * Math.sin(angRad) * randomValue;
		shadowVertex.setPosition(x, y, -semiDepth * 2);
		vertex.setPosition(x, y, semiDepth * 0.4);

		randomValue = 0.9 + 0.3 * Math.random();
		vertex.setColorRGB(randomValue, randomValue, randomValue);
		angRad += increAngRad;
	}

	// 4) Bottom major_ring.***
	angRad = 0.0;
	vertexList = vtxMat.newVertexList();
	shadowVertexList = shadowVtxMat.newVertexList();
	for ( var i = 0; i < numPointsForRing; i++ ) 
	{
		randomValue = (2 + Math.random()) / 2;
		vertex = vertexList.newVertex();
		shadowVertex = shadowVertexList.newVertex();
		x = this.radius * Math.cos(angRad) * randomValue;
		y = this.radius * Math.sin(angRad) * randomValue;
		shadowVertex.setPosition(x, y, -semiDepth * 2);
		vertex.setPosition(x, y, -semiDepth * 0.4);
		randomValue = 0.8 + 0.3 * Math.random();
		vertex.setColorRGB(randomValue, randomValue, randomValue);
		angRad += increAngRad;
	}

	// 5) Bottom menor_ring.***
	angRad = 0.0;
	menorRingRadius = this.radius * 0.7;
	vertexList = vtxMat.newVertexList();
	shadowVertexList = shadowVtxMat.newVertexList();
	for (var i = 0; i < numPointsForRing; i++ ) 
	{
		randomValue = (2 + Math.random()) / 2;
		vertex = vertexList.newVertex();
		shadowVertex = shadowVertexList.newVertex();
		x = menorRingRadius * Math.cos(angRad) * randomValue;
		y = menorRingRadius * Math.sin(angRad) * randomValue;
		vertex.setPosition(x, y, -semiDepth * 0.8);
		shadowVertex.setPosition(x, y, -semiDepth * 1.2);

		randomValue = 0.6 + 0.3 * Math.random();
		vertex.setColorRGB(randomValue, randomValue, randomValue);
		// vertex.setColorRGB(0.58, 0.58, 0.58);
		angRad += increAngRad;
	}

	// 6) Bottom ring. radius zero.***
	vertexList = vtxMat.newVertexList();
	shadowVertexList = shadowVtxMat.newVertexList();
	randomValue = 0.6 + 0.3 * Math.random();
	for ( var i = 0; i < numPointsForRing; i++ ) 
	{
		// randomValue = (2+Math.random())/2;
		vertex = vertexList.newVertex();
		shadowVertex = shadowVertexList.newVertex();
		vertex.setPosition(0.0, 0.0, -semiDepth);
		shadowVertex.setPosition(0.0, 0.0, -semiDepth);

		vertex.setColorRGB(randomValue, randomValue, randomValue);
		// vertex.setColorRGB(0.58, 0.58, 0.58);
	}

	// Now, make the tTrianglesMatrix.***
	vtxMat.makeTTrianglesLateralSidesLOOP(tTriMat);
	shadowVtxMat.makeTTrianglesLateralSidesLOOP(shadowTTriMat);
	// tTriMat.invertTrianglesSense(); // No.***

	// Now, calculate the culling bbox.***
};
