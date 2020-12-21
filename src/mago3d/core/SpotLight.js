'use strict';

/**
 * SpotLight.
 * 
 * @class SpotLight
 * @constructor 
 */
var SpotLight = function(options) 
{
	MagoRenderable.call(this);
	if (!(this instanceof SpotLight)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	// https://www.behance.net/gallery/60349885/Clustered-and-Deferred-Rendering-in-WebGL
	// http://marcinignac.com/blog/deferred-rendering-explained/

	//https://martindevans.me/game-development/2015/10/09/Deferred-Transparency/
	//https://www.gamasutra.com/blogs/PiotrSobolewski/20160531/273912/How_To_Choose_Between_Forward_or_Deferred_Rendering_Paths_in_Unity.php

	// omni cubemaps:
	//https://learnopengl.com/Advanced-Lighting/Shadows/Point-Shadows
	//https://gamedev.stackexchange.com/questions/75854/omni-directional-light-shadow-mapping-with-cubemaps-in-webgl

	// pointLight lighting shaders
	// http://www.paulallenrenton.com/individual-projects/webgl-deferred-renderer

	this.hotspotDeg = 43.0;
	this.falloffDeg = 45.0;
	this.distance = 30.0; // 30 meters.
	if (this.geoLocDataManager === undefined)
	{ this.geoLocDataManager = new GeoLocationDataManager(); }
	this.directionLC = new Point3D(0.0, 0.0, -1.0); // this is a constant value.
	this.directionWC;
	this.cubeMapFBO = undefined;

	this._maxSpotDot; // dot(lightDir, spotDir).
	

	if(options)
	{
		if(options.hotspotDeg)
		this.hotspotDeg = options.hotspotDeg;

		if(options.falloffDeg)
		this.falloffDeg = options.falloffDeg;

		if(options.distance)
		this.distance = options.distance;
	}

	this.setObjectType(MagoRenderable.OBJECT_TYPE.LIGHTSOURCE);
};

SpotLight.prototype = Object.create(MagoRenderable.prototype);
SpotLight.prototype.constructor = SpotLight;

/**
 * Makes the geometry mesh.
 */
SpotLight.prototype.makeMesh = function()
{
	// provisionally make a cone.
	// coneRadius = this.distance * sin(this.falloffDeg * PI/180).
	var angRad = this.falloffDeg * Math.PI/180;
	var radius = this.distance * Math.sin(angRad);
	var height = this.distance * Math.cos(angRad);
	var color = new Mago3D.Color(0.95, 0.95, 0.95, 0.4);
	var options = {
			baseType : 2, // 0= NONE. 1= PLANE. 2= SPHERICAL.
			color : color,
			originType : 1 // 0= ATBASE, 1= ATVERTEX
	};
	var cone = new Cone(radius, height, options);
	this.objectsArray.push(cone);
	this.setDirty(false);
};

/**
 * Returns the lightDirection in world coord.
 */
SpotLight.prototype.getLightDirectionWC = function()
{
	if(!this.directionWC)
	{
		// calculate light direction in world coord.
		var geoLocDataManager = this.getGeoLocDataManager();
		var geoLocData = geoLocDataManager.getCurrentGeoLocationData();
		this.directionWC = geoLocData.tMatrix.rotatePoint3D(this.directionLC, this.directionWC);
	}

	return this.directionWC;
};

/**
 * Returns the lightDistance.
 */
SpotLight.prototype.getLightDistance = function()
{
	return this.distance;
};

/**
 * Returns the lightDistance.
 */
SpotLight.prototype.getMaxSpotDot = function()
{
	if(!this._maxSpotDot)
	{
		// calculate the dotProd of lightDir and the max-spotLightDir.
		this._maxSpotDot = Math.cos(this.falloffDeg * Math.PI/180.0);
	}

	return this._maxSpotDot;
};

/**
 * Makes a objectsArray influenced by this light.
 */
SpotLight.prototype.doIntersectedObjectsCulling = function(visiblesArray, nativeVisiblesArray)
{
	// this function does a frustumCulling-like process.
	// This function collects all objects inside of "this.distance" of this light position.

	if(this.bIntersectionCulling)
	return;

	var visiblesCount = 0;
	var nativeVisiblesCount = 0;

	if(visiblesArray)
	visiblesCount = visiblesArray.length;

	if(nativeVisiblesArray)
	nativeVisiblesCount = nativeVisiblesArray.length;

	if(visiblesCount === 0 && nativeVisiblesCount === 0)
	return;

	var myBSphereWC = this.getBoundingSphereWC(undefined);
	//if(!this.intersectedObjectsArray) // old. Delete.***
	//this.intersectedObjectsArray = []; // old. Delete.***

	//if(!this.intersectedNativeObjectsArray) // old. Delete.***
	//this.intersectedNativeObjectsArray = []; // old. Delete.***

	//this.intersectedObjectsArray.length = 0; // old. Delete.***
	//this.intersectedNativeObjectsArray.length = 0; // old. Delete.***

	if(!this.visibleObjectsControler)
	{
		// create a visible objects controler.
		this.visibleObjectsControler = new VisibleObjectsController();
	}

	this.visibleObjectsControler.clear(); // erase all objects from the arrays.

	// visiblesObjects (nodes).
	var node;
	var bSphereWC;
	for(var i=0; i<visiblesCount; i++)
	{
		node = visiblesArray[i];
		bSphereWC = node.getBoundingSphereWC(bSphereWC);

		if(myBSphereWC.intersectsWithBSphere(bSphereWC) !== Constant.INTERSECTION_OUTSIDE)
		{
			//this.intersectedObjectsArray.push(node);
			this.visibleObjectsControler.currentVisibles0.push(node);
		}
	}

	// nativeVisiblesObjects.
	var native;
	for(var i=0; i<nativeVisiblesCount; i++)
	{
		native = nativeVisiblesArray[i];
		bSphereWC = native.getBoundingSphereWC(bSphereWC);

		if(myBSphereWC.intersectsWithBSphere(bSphereWC) !== Constant.INTERSECTION_OUTSIDE)
		{
			//this.intersectedNativeObjectsArray.push(native);
			this.visibleObjectsControler.currentVisibleNativeObjects.opaquesArray.push(native);
		}
	}

	this.bIntersectionCulling = true;
};

/**
 * This function returns the boundingSphere of the spotlight in worldCoord.
 * @returns {BoundingSphere} resultBoundingSphere
 */
SpotLight.prototype.getBoundingSphereWC = function(resultBoundingSphere) 
{
	if (resultBoundingSphere === undefined)
	{ resultBoundingSphere = new BoundingSphere(); }
	
	var geoLoc = this.geoLocDataManager.getCurrentGeoLocationData();
	
	var posWC = geoLoc.tMatrix.transformPoint3D(new Point3D(0,0,0), undefined);
	var radius = this.distance;
	
	resultBoundingSphere.setCenterPoint(posWC.x, posWC.y, posWC.z);
	resultBoundingSphere.setRadius(radius);
	
	return resultBoundingSphere;
};
/*
SpotLight.prototype.render = function(magoManager, shader, renderType, glPrimitive, bIsSelected) 
{
	// Active this code if want override the "render" function of MagoRenderables abstract class.
};
*/

SpotLight.prototype._getCubeMapFrameBuffer = function(gl) 
{
	if(!this.cubeMapFbo)
	{
		var bufferWidth = 256;
		var bUseMultiRenderTarget = false;
		this.cubeMapFbo = new CubeMapFBO(gl, bufferWidth, {}); 
	}

	return this.cubeMapFbo;
};

SpotLight.prototype._createCubeMatrix2 = function(faceIdx, tMat, projMatrix) 
{
	// now, inverse the matrix.
	var mvMat = new Matrix4();
	mvMat._floatArrays = glMatrix.mat4.invert(mvMat._floatArrays, tMat._floatArrays);
	this.mvMatRelToEyeArray[faceIdx] = mvMat;

	var mvpMat = new Matrix4();
	mvpMat._floatArrays = glMatrix.mat4.multiply(mvpMat._floatArrays, projMatrix._floatArrays, mvMat._floatArrays);
	this.mvpMatRelToEyeArray[faceIdx] = mvpMat;
};

SpotLight.prototype._createCubeMatrix = function(faceIdx, dirX, dirY, dirZ, upX, upY, upZ, projMatrix, geoLocRotMatrix) 
{
	var camPos = new Point3D(); // position at the origin (0, 0, 0).
	var camDir = new Point3D();
	var camTarget = new Point3D();
	var camUp = new Point3D();
	var far = this.distance;

	var matAux = new Matrix4();
	var tMat = new Matrix4();
	
	camDir.set(dirX, dirY, dirZ);
	camUp.set(upX, upY, upZ);
	camTarget.set(camPos.x + camDir.x * far, camPos.y + camDir.y * far, camPos.z + camDir.z * far);
	matAux._floatArrays = Matrix4.lookAt(matAux._floatArrays, [camPos.x, camPos.y, camPos.z], [camTarget.x, camTarget.y, camTarget.z], [camUp.x, camUp.y, camUp.z]);
	//tMat._floatArrays = glMatrix.mat4.multiply(tMat._floatArrays, matAux._floatArrays, geoLocRotMatrix._floatArrays);
	tMat._floatArrays = glMatrix.mat4.multiply(tMat._floatArrays, geoLocRotMatrix._floatArrays, matAux._floatArrays);
	
	// now, inverse the matrix.
	var mvMat = new Matrix4();
	mvMat._floatArrays = glMatrix.mat4.invert(mvMat._floatArrays, tMat._floatArrays);
	this.mvMatRelToEyeArray[faceIdx] = mvMat;

	var mvpMat = new Matrix4();
	mvpMat._floatArrays = glMatrix.mat4.multiply(mvpMat._floatArrays, projMatrix._floatArrays, mvMat._floatArrays);
	this.mvpMatRelToEyeArray[faceIdx] = mvpMat;
};



SpotLight.prototype._createModelViewProjectionMatrixRelToEyes = function() 
{
	// create the 6 mvpMatrices.
	var fovyRad = 90 * Math.PI/180;
	var aspectRatio = 1;
	var near = 0.05;
	var far = this.distance;
	var projMat = new Matrix4();
	
	projMat._floatArrays = glMatrix.mat4.perspective(projMat._floatArrays, fovyRad, aspectRatio, near, far);
	
	var geoLocDataManager = this.getGeoLocDataManager();
	var geoLocData = geoLocDataManager.getCurrentGeoLocationData();
	var geoLocMat = geoLocData.geoLocMatrix;
	var rotMat = geoLocData.rotMatrix;

	// take the axis direction of the geoLocMatrix.
	var xAxis = geoLocMat.getXAxis();
	var yAxis = geoLocMat.getYAxis();
	var zAxis = geoLocMat.getZAxis();

	
	// gl.TEXTURE_CUBE_MAP_POSITIVE_X = face_0
	// gl.TEXTURE_CUBE_MAP_NEGATIVE_X = face_1
	// gl.TEXTURE_CUBE_MAP_POSITIVE_Y = face_2
	// gl.TEXTURE_CUBE_MAP_NEGATIVE_Y = face_3
	// gl.TEXTURE_CUBE_MAP_POSITIVE_Z = face_4
	// gl.TEXTURE_CUBE_MAP_NEGATIVE_Z = face_5
	//
	//               +-------------+
	//               | z  face_2   |
	//               | ^   (+Y)    |
	//               | |           |
	//               | +---> X     |
	// +-------------+-------------+-------------+-------------+
	// | y  face_1   | y  face_4   | y  face_0   | y  face_5   |
	// | ^  (-X)     | ^  (+Z)     | ^   (+X)    | ^  (-Z)     |
	// | |           | |           | |           | |           |
	// | +---> -z    | +---> X     | +---> z     | +---> -X    |
	// +-------------+-------------+-------------+-------------+
	//               | -z face_3   |
	//               | ^  (-Y)     |
	//               | |           |
	//               | +---> X     |
	//               +-------------+


	// Create modelViewMatrix-relativeToEye of 6 faces.
	if(!this.mvMatRelToEyeArray)
	this.mvMatRelToEyeArray = new Array(6);

	if(!this.mvpMatRelToEyeArray)
	this.mvpMatRelToEyeArray = new Array(6);
	
	// Positive_X. Face_0.
	this._createCubeMatrix(0,   1.0, 0.0, 0.0,   0.0, -1.0, 0.0,  projMat, rotMat);

	// Negative_X. Face_1.
	this._createCubeMatrix(1,   -1.0, 0.0, 0.0,   0.0, -1.0, 0.0,  projMat, rotMat);

	// Positive_Y. Face_2.
	this._createCubeMatrix(2,   0.0, 1.0, 0.0,   0.0, 0.0, 1.0,  projMat, rotMat);

	// Negative_Y. Face_3.
	this._createCubeMatrix(3,   0.0, -1.0, 0.0,   0.0, 0.0, -1.0,  projMat, rotMat);

	// Positive_Z. Face_4.
	this._createCubeMatrix(4,   0.0, 0.0, 1.0,   0.0, -1.0, 0.0,  projMat, rotMat);

	// Negative_Z. Face_5.
	this._createCubeMatrix(5,   0.0, 0.0, -1.0,   0.0, -1.0, 0.0,  projMat, rotMat);
	
	
	/*
	// Positive_X. Face_0.
	this._createCubeMatrix(0,   0.0, 0.0, -1.0,   0.0, -1.0, 0.0,  projMat, rotMat);

	// Negative_X. Face_1.
	this._createCubeMatrix(1,   0.0, 0.0, -1.0,   0.0, -1.0, 0.0,  projMat, rotMat);

	// Positive_Y. Face_2.
	this._createCubeMatrix(2,   0.0, 0.0, -1.0,   0.0, -1.0, 0.0,  projMat, rotMat);

	// Negative_Y. Face_3.
	this._createCubeMatrix(3,   0.0, 0.0, -1.0,   0.0, -1.0, 0.0,  projMat, rotMat);

	// Positive_Z. Face_4.
	this._createCubeMatrix(4,   0.0, 0.0, -1.0,   0.0, -1.0, 0.0,  projMat, rotMat);

	// Negative_Z. Face_5.
	this._createCubeMatrix(5,   0.0, 0.0, -1.0,   0.0, -1.0, 0.0,  projMat, rotMat);
	*/

	/*
	// https://github.com/mrdoob/three.js/blob/r84/src/renderers/webgl/WebGLShadowMap.js#L144-L179
	// Positive_X. Face_0.
	this._createCubeMatrix(0,   1.0, 0.0, 0.0,   0.0, 1.0, 0.0,  projMat, rotMat);

	// Negative_X. Face_1.
	this._createCubeMatrix(1,   -1.0, 0.0, 0.0,   0.0, 1.0, 0.0,  projMat, rotMat);

	// Positive_Y. Face_2.
	this._createCubeMatrix(2,   0.0, 0.0, 1.0,   0.0, 1.0, 0.0,  projMat, rotMat);

	// Negative_Y. Face_3.
	this._createCubeMatrix(3,   0.0, 0.0, -1.0,   0.0, 1.0, 0.0,  projMat, rotMat);

	// Positive_Z. Face_4.
	this._createCubeMatrix(4,   0.0, 1.0, 0.0,   0.0, 0.0, 1.0,  projMat, rotMat);

	// Negative_Z. Face_5.
	this._createCubeMatrix(5,   0.0, -1.0, 0.0,   0.0, 0.0, -1.0,  projMat, rotMat);
	*/

	
	/*
	// Positive_X. Face_0.
	this._createCubeMatrix(1,   xAxis.x, xAxis.y, xAxis.z,   xAxis.x, xAxis.y, xAxis.z,  projMat);

	// Negative_X. Face_1.
	this._createCubeMatrix(0,   -xAxis.x, -xAxis.y, -xAxis.z,   xAxis.x, xAxis.y, xAxis.z,  projMat);

	// Positive_Y. Face_2.
	this._createCubeMatrix(3,   yAxis.x, yAxis.y, yAxis.z,   zAxis.x, zAxis.y, zAxis.z,  projMat);

	// Negative_Y. Face_3.
	this._createCubeMatrix(2,   -yAxis.x, -yAxis.y, -yAxis.z,   -zAxis.x, -zAxis.y, -zAxis.z,  projMat);

	// Positive_Z. Face_4.
	this._createCubeMatrix(5,   -zAxis.x, -zAxis.y, -zAxis.z,   -yAxis.x, -yAxis.y, -yAxis.z,  projMat);

	// Negative_Z. Face_5.
	this._createCubeMatrix(4,   zAxis.x, zAxis.y, zAxis.z,   -yAxis.x, -yAxis.y, -yAxis.z,  projMat);
	*/
	/*
	// Positive_X. Face_0.
	this._createCubeMatrix2(0,   rotMat,  projMat);

	// Negative_X. Face_1.
	this._createCubeMatrix2(1,   rotMat,  projMat);

	// Positive_Y. Face_2.
	this._createCubeMatrix2(2,   rotMat,  projMat);

	// Negative_Y. Face_3.
	this._createCubeMatrix2(3,   rotMat,  projMat);

	// Positive_Z. Face_4.
	this._createCubeMatrix2(4,   rotMat,  projMat);

	// Negative_Z. Face_5.
	this._createCubeMatrix2(5,   rotMat,  projMat);
	*/
};

SpotLight.prototype._createModelViewProjectionMatrixRelToEyes__original = function() 
{
	// create the 6 mvpMatrices.
	var fovyRad = 90 * Math.PI/180;
	var aspectRatio = 1;
	var near = 0.1;
	var far = this.distance;
	var projMat = new Matrix4();
	var modelViewMat = new Matrix4();
	
	projMat._floatArrays = glMatrix.mat4.perspective(projMat._floatArrays, fovyRad, aspectRatio, near, far);
	
	var geoLocDataManager = this.getGeoLocDataManager();
	var geoLocData = geoLocDataManager.getCurrentGeoLocationData();
	var geoLocMat = geoLocData.geoLocMatrix;

	// take the lightPosition.
	var camPos = new Point3D(); // position at the origin (0, 0, 0).
	var camDir = new Point3D();
	var camTarget = new Point3D();
	var camUp = new Point3D();

	// take the axis direction of the geoLocMatrix.
	var xAxis = geoLocMat.getXAxis();
	var yAxis = geoLocMat.getYAxis();
	var zAxis = geoLocMat.getZAxis();

	
	// gl.TEXTURE_CUBE_MAP_POSITIVE_X = face_0
	// gl.TEXTURE_CUBE_MAP_NEGATIVE_X = face_1
	// gl.TEXTURE_CUBE_MAP_POSITIVE_Y = face_2
	// gl.TEXTURE_CUBE_MAP_NEGATIVE_Y = face_3
	// gl.TEXTURE_CUBE_MAP_POSITIVE_Z = face_4
	// gl.TEXTURE_CUBE_MAP_NEGATIVE_Z = face_5
	//
	//               +-------------+
	//               | z  face_2   |
	//               | ^   (+Y)    |
	//               | |           |
	//               | +---> X     |
	// +-------------+-------------+-------------+-------------+
	// | y  face_1   | y  face_4   | y  face_0   | y  face_5   |
	// | ^  (-X)     | ^  (+Z)     | ^   (+X)    | ^  (-Z)     |
	// | |           | |           | |           | |           |
	// | +---> -z    | +---> X     | +---> z     | +---> -X    |
	// +-------------+-------------+-------------+-------------+
	//               | -z face_3   |
	//               | ^  (-Y)     |
	//               | |           |
	//               | +---> X     |
	//               +-------------+


	// Create modelViewMatrix-relativeToEye of 6 faces.
	this.mvMatRelToEyeArray = [];

	// Positive_X. Face_0.
	var mvMat_Positive_X = new Matrix4();
	camDir.set(xAxis.x, xAxis.y, xAxis.z);
	camUp.set(yAxis.x, yAxis.y, yAxis.z);
	camTarget.set(camPos.x + camDir.x * far, camPos.y + camDir.y * far, camPos.z + camDir.z * far);
	mvMat_Positive_X._floatArrays = Matrix4.lookAt(mvMat_Positive_X._floatArrays, [camPos.x, camPos.y, camPos.z], [camTarget.x, camTarget.y, camTarget.z], [camUp.x, camUp.y, camUp.z]);
	this.mvMatRelToEyeArray.push(mvMat_Positive_X);

	// Negative_X. Face_1.
	var mvMat_Negative_X = new Matrix4();
	camDir.set(-xAxis.x, -xAxis.y, -xAxis.z);
	camUp.set(yAxis.x, yAxis.y, yAxis.z);
	camTarget.set(camPos.x + camDir.x * far, camPos.y + camDir.y * far, camPos.z + camDir.z * far);
	mvMat_Negative_X._floatArrays = Matrix4.lookAt(mvMat_Negative_X._floatArrays, [camPos.x, camPos.y, camPos.z], [camTarget.x, camTarget.y, camTarget.z], [camUp.x, camUp.y, camUp.z]);
	this.mvMatRelToEyeArray.push(mvMat_Negative_X);

	// Positive_Y. Face_2.
	var mvMat_Positive_Y = new Matrix4();
	camDir.set(yAxis.x, yAxis.y, yAxis.z);
	camUp.set(zAxis.x, zAxis.y, zAxis.z);
	camTarget.set(camPos.x + camDir.x * far, camPos.y + camDir.y * far, camPos.z + camDir.z * far);
	mvMat_Positive_Y._floatArrays = Matrix4.lookAt(mvMat_Positive_Y._floatArrays, [camPos.x, camPos.y, camPos.z], [camTarget.x, camTarget.y, camTarget.z], [camUp.x, camUp.y, camUp.z]);
	this.mvMatRelToEyeArray.push(mvMat_Positive_Y);

	// Negative_Y. Face_3.
	var mvMat_Negative_Y = new Matrix4();
	camDir.set(-yAxis.x, -yAxis.y, -yAxis.z);
	camUp.set(-zAxis.x, -zAxis.y, -zAxis.z);
	camTarget.set(camPos.x + camDir.x * far, camPos.y + camDir.y * far, camPos.z + camDir.z * far);
	mvMat_Negative_Y._floatArrays = Matrix4.lookAt(mvMat_Negative_Y._floatArrays, [camPos.x, camPos.y, camPos.z], [camTarget.x, camTarget.y, camTarget.z], [camUp.x, camUp.y, camUp.z]);
	this.mvMatRelToEyeArray.push(mvMat_Negative_Y);

	// Positive_Z. Face_4. Note: the "Positive_Z" is coincident with "geoLocMat".
	var mvMat_Positive_Z = new Matrix4();
	camDir.set(-zAxis.x, -zAxis.y, -zAxis.z);
	camUp.set(yAxis.x, yAxis.y, yAxis.z);
	camTarget.set(camPos.x + camDir.x * far, camPos.y + camDir.y * far, camPos.z + camDir.z * far);
	mvMat_Positive_Z._floatArrays = Matrix4.lookAt(mvMat_Positive_Z._floatArrays, [camPos.x, camPos.y, camPos.z], [camTarget.x, camTarget.y, camTarget.z], [camUp.x, camUp.y, camUp.z]);
	this.mvMatRelToEyeArray.push(mvMat_Positive_Z);

	// Negative_Z. Face_5.
	var mvMat_Negative_Z = new Matrix4();
	camDir.set(zAxis.x, zAxis.y, zAxis.z);
	camUp.set(yAxis.x, yAxis.y, yAxis.z);
	camTarget.set(camPos.x + camDir.x * far, camPos.y + camDir.y * far, camPos.z + camDir.z * far);
	mvMat_Negative_Z._floatArrays = Matrix4.lookAt(mvMat_Negative_Z._floatArrays, [camPos.x, camPos.y, camPos.z], [camTarget.x, camTarget.y, camTarget.z], [camUp.x, camUp.y, camUp.z]);
	this.mvMatRelToEyeArray.push(mvMat_Negative_Z);

	// Now, multiply the projectionMatrix with the 6 modelViewMatrices.
	this.mvpMatRelToEyeArray = [];

	var mvpMatRelToEye_positive_X = new Matrix4();
	mvpMatRelToEye_positive_X._floatArrays = glMatrix.mat4.multiply(mvpMatRelToEye_positive_X._floatArrays, projMat._floatArrays, mvMat_Positive_X._floatArrays);
	this.mvpMatRelToEyeArray.push(mvpMatRelToEye_positive_X);

	var mvpMatRelToEye_negative_X = new Matrix4();
	mvpMatRelToEye_negative_X._floatArrays = glMatrix.mat4.multiply(mvpMatRelToEye_negative_X._floatArrays, projMat._floatArrays, mvMat_Negative_X._floatArrays);
	this.mvpMatRelToEyeArray.push(mvpMatRelToEye_negative_X);

	var mvpMatRelToEye_positive_Y = new Matrix4();
	mvpMatRelToEye_positive_Y._floatArrays = glMatrix.mat4.multiply(mvpMatRelToEye_positive_Y._floatArrays, projMat._floatArrays, mvMat_Positive_Y._floatArrays);
	this.mvpMatRelToEyeArray.push(mvpMatRelToEye_positive_Y);

	var mvpMatRelToEye_negative_Y = new Matrix4();
	mvpMatRelToEye_negative_Y._floatArrays = glMatrix.mat4.multiply(mvpMatRelToEye_negative_Y._floatArrays, projMat._floatArrays, mvMat_Negative_Y._floatArrays);
	this.mvpMatRelToEyeArray.push(mvpMatRelToEye_negative_Y);

	var mvpMatRelToEye_positive_Z = new Matrix4();
	mvpMatRelToEye_positive_Z._floatArrays = glMatrix.mat4.multiply(mvpMatRelToEye_positive_Z._floatArrays, projMat._floatArrays, mvMat_Positive_Z._floatArrays);
	this.mvpMatRelToEyeArray.push(mvpMatRelToEye_positive_Z);

	var mvpMatRelToEye_negative_Z = new Matrix4();
	mvpMatRelToEye_negative_Z._floatArrays = glMatrix.mat4.multiply(mvpMatRelToEye_negative_Z._floatArrays, projMat._floatArrays, mvMat_Negative_Z._floatArrays);
	this.mvpMatRelToEyeArray.push(mvpMatRelToEye_negative_Z);
};

SpotLight.prototype.getModelViewProjectionMatrixRelToEye = function(faceIdx) 
{
	if(!this.mvpMatRelToEyeArray)
    {
        this._createModelViewProjectionMatrixRelToEyes();
	}
	
	return this.mvpMatRelToEyeArray[faceIdx];
};

SpotLight.prototype.getModelViewMatrixRelToEye = function(faceIdx) 
{
	if(!this.mvMatRelToEyeArray)
    {
        this._createModelViewProjectionMatrixRelToEyes();
	}
	
	return this.mvMatRelToEyeArray[faceIdx];
};

SpotLight.prototype.bindCubeMapFrameBuffer = function(faceIdx, magoManager) 
{
	var gl = magoManager.getGl();

	// 1rst, check if exist cubeMapFrameBuffer.
	var cubeMapFbo = this._getCubeMapFrameBuffer(gl);

	// Now, check if exist modelViewProjectionMatrix of each face.
	//var mvpMatRelToEye = this.getModelViewProjectionMatrixRelToEye(faceIdx);

	gl.bindFramebuffer(gl.FRAMEBUFFER, cubeMapFbo.framebuffer[faceIdx]);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_CUBE_MAP_POSITIVE_X + faceIdx, cubeMapFbo.colorBuffer, 0);
	
	gl.viewport(0, 0, cubeMapFbo.width[0], cubeMapFbo.width[0]);
	gl.clearColor(1, 1, 1, 1);
	//gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	gl.clear(gl.DEPTH_BUFFER_BIT);
	gl.clearColor(0, 0, 0, 1);
	var hola = 0;
};

SpotLight.prototype.getDepthCubeMapTexture = function(magoManager) 
{
	var gl = magoManager.getGl();

	// 1rst, check if exist cubeMapFrameBuffer.
	var cubeMapFbo = this._getCubeMapFrameBuffer(gl);
	return cubeMapFbo.colorBuffer;
};