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
	//https://computergraphics.stackexchange.com/questions/1788/webgl-omnidirectional-shadow-mapping-issue

	// pointLight lighting shaders
	// http://www.paulallenrenton.com/individual-projects/webgl-deferred-renderer

	this.hotspotDeg = 43.0;
	this.falloffDeg = 45.0;
	this.hotDistance = 30.0; // 30 meters.
	this.falloffDistance = 40.0; // 30 meters.
	this.color = new Color(1.0, 1.0, 1.0, 1.0);
	this.intensity = 1.0; // power = intensity * Math.PI.
	if (this.geoLocDataManager === undefined)
	{ this.geoLocDataManager = new GeoLocationDataManager(); }
	this.directionLC = new Point3D(0.0, 0.0, -1.0); // this is a constant value.
	this.directionWC;
	this.localWC;
	this.cubeMapFBO = undefined;

	this._maxSpotDot; // dot(lightDir, spotDir).
	this.cullingUpdatedTime;
	
	this.options = options ? options : {};

	if(this.options.localWC) {
		this.localWC = this.options.localWC;
	}

	if(this.options.hotspotDeg)
	this.hotspotDeg = this.options.hotspotDeg;

	if(this.options.falloffDeg)
	this.falloffDeg = this.options.falloffDeg;

	if(this.options.hotDistance)
	this.hotDistance = this.options.hotDistance;

	if(this.options.falloffDistance)
	this.falloffDistance = this.options.falloffDistance;
	
	//this.attributes.heightReference = HeightReference.CLAMP_TO_GROUND;
	this.setObjectType(MagoRenderable.OBJECT_TYPE.LIGHTSOURCE);
};

SpotLight.prototype = Object.create(MagoRenderable.prototype);
SpotLight.prototype.constructor = SpotLight;

/**
 * Makes the geometry mesh.
 */
SpotLight.prototype.setColorRGB = function(red, green, blue)
{
	if(!this.color)
	{
		this.color = new Color(1.0, 1.0, 1.0, 1.0);
	}

	this.color.setRGB(red, green, blue);

};

/**
 * Makes the geometry mesh.
 */
SpotLight.prototype.setLightIntensity = function(intensity)
{
	this.intensity = intensity;
};

/**
 * Makes the geometry mesh.
 */
SpotLight.prototype.makeMesh = function()
{
	// provisionally make a cone.
	// coneRadius = this.distance * sin(this.falloffDeg * PI/180).
	var angRad = this.falloffDeg * Math.PI/180;
	var radius = this.falloffDistance * Math.sin(angRad) * 0.98;
	var height = this.falloffDistance * Math.cos(angRad) * 0.98;
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
SpotLight.prototype.setCullingUpdatedTime = function(time)
{
	this.cullingUpdatedTime = time;
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
SpotLight.prototype.getLightParameters = function()
{
	if(!this.lightParameters)
	{
		this.setLightParameters();
	}

	return this.lightParameters;
};

/**
 * set the light parameter.
 */
SpotLight.prototype.setLightParameters = function()
{
	// "lightParameters" is an array[4].
	// 0= lightDist, 1= lightFalloffDist, 2= maxSpotDot, 3= falloffSpotDot.
	this.lightParameters = new Float32Array(4);

	this.lightParameters[0] = this.getLightHotDistance();
	this.lightParameters[1] = this.getLightFallOffDistance(); // provisional.
	this.lightParameters[2] = this.getMaxSpotDot();
	this.lightParameters[3] = this.getFalloffSpotDot();
};

/**
 * Returns the lightDistance.
 */
SpotLight.prototype.getLightHotDistance = function()
{
	return this.hotDistance;
};

/**
 * Returns the lightDistance.
 */
SpotLight.prototype.getLightFallOffDistance = function()
{
	return this.falloffDistance;
};

/**
 * Returns the lightDistance.
 */
SpotLight.prototype.getMaxSpotDot = function()
{
	if(!this._maxSpotDot)
	{
		// calculate the dotProd of lightDir and the max-spotLightDir.
		this._setMaxSpotDot();
	}

	return this._maxSpotDot;
};

/**
 * set the maxSpotDot.
 */
SpotLight.prototype._setMaxSpotDot = function() {
	this._maxSpotDot = Math.cos(this.hotspotDeg * Math.PI/180.0);
}

/**
 * Returns the lightDistance.
 */
SpotLight.prototype.getFalloffSpotDot = function()
{
	if(!this._falloffSpotDot)
	{
		// calculate the dotProd of lightDir and the max-spotLightDir.
		this._setFalloffSpotDot();
	}

	return this._falloffSpotDot;
};

/**
 * set the falloffSpotDot.
 */
SpotLight.prototype._setFalloffSpotDot = function() {
	this._falloffSpotDot = Math.cos(this.falloffDeg * Math.PI/180.0);
}


/**
 * set the hotDistance.
 * @param {number}
 */
SpotLight.prototype.setHotDistance = function(hotDistance) {
	this.hotDistance = hotDistance;
	this.setLightParameters();
}

/**
 * set the falloffDistance.
 * @param {number}
 */
SpotLight.prototype.setFalloffDistance = function(falloffDistance) {
	this.falloffDistance = falloffDistance;
	this.setDirty(true);
	this.setLightParameters();
}

/**
 * set the hotspotDeg.
 * @param {number}
 */
SpotLight.prototype.setHotspotDeg = function(hotspotDeg) {
	this.hotspotDeg = hotspotDeg;
	this._setMaxSpotDot();
	this.setLightParameters();
}

/**
 * set the falloffDeg.
 * @param {number}
 */
SpotLight.prototype.setFalloffDeg = function(falloffDeg) {
	this.falloffDeg = falloffDeg;
	this._setFalloffSpotDot();
	this.setDirty(true);
	this.setLightParameters();
}

/**
 * Makes a objectsArray influenced by this light.
 */
SpotLight.prototype.clearIntersectedObjects = function()
{
	if(!this.visibleObjectsControler)
	{
		return;
	}

	this.visibleObjectsControler.clear(); // erase all objects from the arrays.
};

/**
 * Makes a objectsArray influenced by this light.
 */
SpotLight.prototype.doIntersectedObjectsCulling = function(visiblesArray, nativeVisiblesArray)
{
	// this function does a frustumCulling-like process.
	// This function collects all objects inside of "this.distance" of this light position.
	if(!this.cullingUpdatedTime)
	this.cullingUpdatedTime = 0;

	var visiblesCount = 0;
	var nativeVisiblesCount = 0;

	if(visiblesArray)
	visiblesCount = visiblesArray.length;

	if(nativeVisiblesArray)
	nativeVisiblesCount = nativeVisiblesArray.length;

	//if(visiblesCount === 0 && nativeVisiblesCount === 0)
	//return;

	var myBSphereWC = this.getBoundingSphereWC(undefined);

	if(!this.visibleObjectsControler)
	{
		// create a visible objects controler.
		this.visibleObjectsControler = new VisibleObjectsController();
	}

	// visiblesObjects (nodes).
	var node;
	var bSphereWC;
	for(var i=0; i<visiblesCount; i++)
	{
		node = visiblesArray[i];
		bSphereWC = node.getBoundingSphereWC(bSphereWC);

		if(myBSphereWC.intersectsWithBSphere(bSphereWC) !== Constant.INTERSECTION_OUTSIDE)
		{
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
			this.visibleObjectsControler.currentVisibleNativeObjects.opaquesArray.push(native);
		}
	}

	this.bIntersectionCulling = true;
	//this.bCubeMapMade = false;

	return true;
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
	var radius = this.hotDistance;
	
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
	var far = this.hotDistance;

	var matAux = new Matrix4();
	var tMat = new Matrix4();
	
	camDir.set(dirX, dirY, dirZ);
	camUp.set(upX, upY, upZ);
	camTarget.set(camPos.x + camDir.x * far, camPos.y + camDir.y * far, camPos.z + camDir.z * far);
	matAux._floatArrays = Matrix4.lookAt(matAux._floatArrays, [camPos.x, camPos.y, camPos.z], [camTarget.x, camTarget.y, camTarget.z], [camUp.x, camUp.y, camUp.z]);
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
	var far = this.getLightFallOffDistance();
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
	/*
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
	*/
	
	// Positive_X. Face_0.
	this._createCubeMatrix(0,   1.0, 0.0, 0.0,   0.0, -1.0, 0.0,  projMat, rotMat);

	// Negative_X. Face_1.
	this._createCubeMatrix(1,   -1.0, 0.0, 0.0,   0.0, -1.0, 0.0,  projMat, rotMat);

	// Positive_Y. Face_2.
	this._createCubeMatrix(3,   0.0, 1.0, 0.0,   0.0, 0.0, 1.0,  projMat, rotMat);

	// Negative_Y. Face_3.
	this._createCubeMatrix(2,   0.0, -1.0, 0.0,   0.0, 0.0, -1.0,  projMat, rotMat);

	// Positive_Z. Face_4.
	this._createCubeMatrix(4,   0.0, 0.0, 1.0,   0.0, -1.0, 0.0,  projMat, rotMat);

	// Negative_Z. Face_5.
	this._createCubeMatrix(5,   0.0, 0.0, -1.0,   0.0, -1.0, 0.0,  projMat, rotMat);

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

	gl.bindRenderbuffer(gl.RENDERBUFFER, cubeMapFbo.depthBuffer);
	gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, cubeMapFbo.width[0], cubeMapFbo.width[0]);
	gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, cubeMapFbo.depthBuffer);
	
	gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_CUBE_MAP_POSITIVE_X + faceIdx, cubeMapFbo.colorBuffer, 0);
	
	gl.viewport(0, 0, cubeMapFbo.width[0], cubeMapFbo.width[0]);
	gl.clearColor(1, 1, 1, 1);
	gl.clearDepth(1.0);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	gl.clearColor(0, 0, 0, 1);

};

SpotLight.prototype.getDepthCubeMapTexture = function(magoManager) 
{
	var gl = magoManager.getGl();

	// 1rst, check if exist cubeMapFrameBuffer.
	var cubeMapFbo = this._getCubeMapFrameBuffer(gl);
	return cubeMapFbo.colorBuffer;
};