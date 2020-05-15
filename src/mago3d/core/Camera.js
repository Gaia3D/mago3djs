'use strict';

/**
 * 카메라
 * @class Camera
 * @constructor
 */
var Camera = function() 
{
	if (!(this instanceof Camera)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this.id = "camera";
	this.position = new Point3D(); 
	this.direction = new Point3D(); 
	this.up = new Point3D();
	this.right = new Point3D();
	// current frustum.
	this.frustum = new Frustum(); 
	// sum of all frustums.
	this.bigFrustum = new Frustum();
	this.dirty = true;
	this.frustumsArray = [];
	this.frustumsArray.push(this.frustum);
	
	// frustum points.
	this.nearCenterPoint = new Point3D();
	this.farCenterPoint = new Point3D();
	
	this.farLeftBottomPoint = new Point3D();
	this.farRightTopPoint = new Point3D();
	
	// directions.
	this.leftBottomDir = new Point3D();
	this.rightTopDir = new Point3D();
	
	// normals.
	this.leftNormal = new Point3D();
	this.rightNormal = new Point3D();
	this.bottomNormal = new Point3D();
	this.topNormal = new Point3D();
	
	// movement.
	this.lastMovement; // class Movement.

	/**
	 *  track target node;
	 * @type {Node}
	 */
	this.tracked;

	/**
	 *  track mode
	 * @type {number}
	 * @default CODE.trackMode.TRACKING 0
	 */
	this.trackType = CODE.trackMode.TRACKING;
	
	/**
	 *  targetOffset
	 * @type {number}
	 * @default 10.0
	 */
	this.targetOffset = 10.0;

	/**
	 *  trackCameraOffsetY
	 * @type {number}
	 * @default -1
	 */
	this.trackCameraOffsetY = -1;
	
	/**
	* trackCameraOffsetZ
	* @type {number} 
	* @default 12
	*/
	this.trackCameraOffsetZ = 12;
};

/**
 * Copy the position and the direction and up point of the other camera
 * @param {Camera} camera
 */
Camera.prototype.copyPosDirUpFrom = function(camera)
{
	this.position.copyFrom(camera.position);
	this.direction.copyFrom(camera.direction);
	this.up.copyFrom(camera.up);
};

/**
 * Translate this camera with translation vector
 * @param {Point3D} translationVec
 */
Camera.prototype.translate = function(translationVec)
{
	this.position.add(translationVec.x, translationVec.y, translationVec.z);
};

/**
 * Does the movent.
 * @param {Movement} movement
 */
Camera.prototype.doInertialMovement = function(magoManager)
{
	// Inertial movement is decided in "MagoWorld.prototype.mouseup".
	if (this.lastMovement === undefined)
	{ return false; }

	if (this.lastMovement.movementType === CODE.movementType.NO_MOVEMENT)
	{ return false; }

	var movement = this.lastMovement;
	var deltaTime = movement.deltaTime;
	var magoWorld = magoManager.magoWorld;
	
	var movType = movement.movementType;
	if (movType === CODE.movementType.TRANSLATION) // TRANSLATION.************************************
	{
		var linearVelocity = movement.currLinearVelocity;
		var dir = movement.translationDir;
		var dist = linearVelocity * deltaTime;
		
		if (Math.abs(dist) < 1E-4)
		{ movement.movementType = CODE.movementType.NO_MOVEMENT; }
		
		this.position.add(-dir.x*dist, -dir.y*dist, -dir.z*dist);
		
		magoWorld.updateModelViewMatrixByCamera(this);
		movement.currLinearVelocity *= 0.9;
		if (Math.abs(movement.currLinearVelocity) < 1E-4)
		{ movement.movementType = CODE.movementType.NO_MOVEMENT; }
	}
	else if (movType === CODE.movementType.ROTATION) // ROTATION.************************************
	{
		var angVelocity = movement.currAngularVelocity;
		movement.angRad = angVelocity * deltaTime;
		
		if (Math.abs(movement.angRad) < 1E-11)
		{ movement.movementType = CODE.movementType.NO_MOVEMENT; }
		
		var angRad = movement.angRad;
		var rotAxis = movement.rotationAxis;
		
		// check if there are rotationPoint.
		var rotPoint = movement.rotationPoint;
		if (rotPoint)
		{
			// camera is rotating respect a point of the scene.
			var rotMat = new Matrix4();
			rotMat.rotationAxisAngRad(angRad, rotAxis.x, rotAxis.y, rotAxis.z);

			var translationVec_1 = new Point3D(-rotPoint.x, -rotPoint.y, -rotPoint.z);
			var translationVec_2 = new Point3D(rotPoint.x, rotPoint.y, rotPoint.z);
			
			this.translate(translationVec_1);
			this.transformByMatrix4(rotMat);
			this.translate(translationVec_2);
		}
		else
		{
			// camera is rotating around the world origin.
			var rotMat = new Matrix4();
			rotMat.rotationAxisAngRad(-angRad, rotAxis.x, rotAxis.y, rotAxis.z);
			this.transformByMatrix4(rotMat);
		}
		
		magoWorld.updateModelViewMatrixByCamera(this);
		movement.currAngularVelocity *= 0.9;
		if (Math.abs(movement.currAngularVelocity) < 1E-11)
		{ movement.movementType = CODE.movementType.NO_MOVEMENT; }
	}
	else if (movType === CODE.movementType.ROTATION_ZX) // ROTATION_ZX.************************************
	{
		var angVelocity = movement.currAngularVelocity;
		movement.angRad = angVelocity * deltaTime;
		
		var angRad = movement.angRad;
		var rotAxis = movement.rotationAxis;
		
		// check if there are rotationPoint.
		var rotPoint = movement.rotationPoint;
		if (rotPoint)
		{
			var pivotPointNormal;
			pivotPointNormal = Globe.normalAtCartesianPointWgs84(rotPoint.x, rotPoint.y, rotPoint.z, pivotPointNormal);
			var xAxis = this.getCameraRight();
			
			var zRotAngRad = movement.zAngVelocity * deltaTime;
			var xRotAngRad = movement.xAngVelocity * deltaTime;
			
			if (Math.abs(zRotAngRad) < 1E-11 && Math.abs(xRotAngRad) < 1E-11)
			{ movement.movementType = CODE.movementType.NO_MOVEMENT; }
			
			var quatZRot = glMatrix.quat.create();
			quatZRot = glMatrix.quat.setAxisAngle(quatZRot, pivotPointNormal, zRotAngRad);
			
			var quatXRot = glMatrix.quat.create();
			quatXRot = glMatrix.quat.setAxisAngle(quatXRot, [xAxis.x, xAxis.y, xAxis.z], xRotAngRad);
			
			var quatTotalRot = glMatrix.quat.create();
			quatTotalRot = glMatrix.quat.multiply(quatTotalRot, quatZRot, quatXRot);
			
			var rotMat = new Matrix4();
			rotMat._floatArrays = glMatrix.mat4.fromQuat(rotMat._floatArrays, quatTotalRot);
		

			var translationVec_1 = new Point3D(-rotPoint.x, -rotPoint.y, -rotPoint.z);
			var translationVec_2 = new Point3D(rotPoint.x, rotPoint.y, rotPoint.z);
			
			this.translate(translationVec_1);
			this.transformByMatrix4(rotMat);
			this.translate(translationVec_2);
		}
		else
		{
			// camera is rotating around the world origin.
			var rotMat = new Matrix4();
			rotMat.rotationAxisAngRad(-angRad, rotAxis.x, rotAxis.y, rotAxis.z);
			this.transformByMatrix4(rotMat);
		}
		
		magoWorld.updateModelViewMatrixByCamera(this);
		movement.zAngVelocity *= 0.9;
		movement.xAngVelocity *= 0.9;
		if (Math.abs(movement.zAngVelocity) < 1E-11 && Math.abs(movement.xAngVelocity) < 1E-11)
		{ movement.movementType = CODE.movementType.NO_MOVEMENT; }
	}
	
	return true;
};

/**
 * Transfrom posion, direction and up of the camera
 * @param {Matrix4} mat
 */
Camera.prototype.transformByMatrix4 = function(mat)
{
	// transform position, direction and up.
	this.position = mat.transformPoint3D(this.position, this.position);
	this.direction = mat.rotatePoint3D(this.direction, this.direction);
	this.up = mat.rotatePoint3D(this.up, this.up);
};

/**
 * Get the Camera direction line
 * @param {Line} resultLine 
 * @returns {Line} resultLine Camera direction line
 */
Camera.prototype.getCameraDirectionLine = function(resultLine)
{
	if (resultLine === undefined)
	{ resultLine = new Line(); }
	
	resultLine.point.set(this.position.x, this.position.y, this.position.z);
	resultLine.direction.set(this.direction.x, this.direction.y, this.direction.z);
	
	return resultLine;
};

/**
 * determine camHeight
 * @returns {number} camera Height
 */
Camera.prototype.getCameraElevation = function()
{
	var geographicCoords;
	geographicCoords = Globe.CartesianToGeographicWgs84(this.position.x, this.position.y, this.position.z, geographicCoords);
	var latDeg = geographicCoords.latitude;
	var camModul = this.position.getModul();
	var radius = Globe.radiusAtLatitudeDeg(latDeg);
	return  camModul - radius;
};

/**
 * Get the right(up)
 * @returns {Point3D} Camera right
 */
Camera.prototype.getCameraRight = function()
{
	if (this.right === undefined)
	{ this.right = new Point3D(); }
	
	this.right = this.direction.crossProduct(this.up, this.right);
	return this.right;
};

/**
 * set dirty flag of the object
 * -dirty flag : Avoid unnecessary work by deferring it until the result is needed.
 * @param {Boolean} cameraIsDirty
 */
Camera.prototype.setDirty = function(cameraIsDirty)
{
	this.dirty = cameraIsDirty;
};

/**
 * get dirty flag of the object
 * @returns {Boolean} dirty
 */
Camera.prototype.getDirty = function()
{
	return this.dirty;
};

/**
 * Check whether this camera is moved or not
 * @param {Number} newPosX
 * @param {Number} newPosY
 * @param {Number} newPosZ
 * @param {Number} newDirX
 * @param {Number} newDirY
 * @param {Number} newDirZ
 * @param {Number} newUpX
 * @param {Number} newUpY
 * @param {Number} newUpZ
 * @returns {Boolean} 
 * 
 */
Camera.prototype.isCameraMoved = function(newPosX, newPosY, newPosZ, newDirX, newDirY, newDirZ, newUpX, newUpY, newUpZ )
{
	var positionError = 10E-4;
	var pos = this.position;
	if (Math.abs(pos.x - newPosX) > positionError || Math.abs(pos.y - newPosY) > positionError || Math.abs(pos.z - newPosZ) > positionError )
	{ return true; }
	
	var directionError = 10E-6;
	var dir = this.direction;
	if (Math.abs(dir.x - newDirX) > positionError || Math.abs(dir.y - newDirY) > positionError || Math.abs(dir.z - newDirZ) > directionError )
	{ return true; }
	
	var up = this.up;
	if (Math.abs(up.x - newUpX) > positionError || Math.abs(up.y - newUpY) > positionError || Math.abs(up.z - newUpZ) > directionError )
	{ return true; }
	
	return false;
	
};

/**
 * get the small Frustum in big frustum
 * @param {Number} idx 배열 인덱스
 * @returns {Frustum} 해당하는 배열 인덱스의 frustrum
 */
Camera.prototype.getFrustum = function(idx)
{
	if (this.frustumsArray[idx] === undefined)
	{
		this.frustumsArray[idx] = new Frustum();
		this.frustumsArray[idx].fovRad[0] = this.frustumsArray[0].fovRad[0];
		this.frustumsArray[idx].fovyRad[0]= this.frustumsArray[0].fovyRad[0];
		this.frustumsArray[idx].aspectRatio[0] = this.frustumsArray[0].aspectRatio[0];
		this.frustumsArray[idx].tangentOfHalfFovy[0] = this.frustumsArray[0].tangentOfHalfFovy[0];
	}
	
	return this.frustumsArray[idx];
};

/**
 * Get the lastest frustum of this camera
 * @returns {frustum} lastest frustum of this camera
 */
Camera.prototype.getLastFrustum = function()
{
	return this.getFrustum(this.frustumsArray.length - 1);
};

/**
 * The list of the distance between the divided frustum of visualization volume using each small frustum's near and far
 * @param {Number} numFrustums total of Frustum
 * @param {distancesArray[]} distancesArray
 */
Camera.prototype.setFrustumsDistances = function(numFrustums, distancesArray)
{
	var nearFarDistances;
	var frustum;
	for (var i=0; i<numFrustums; i++)
	{
		nearFarDistances = distancesArray[i];
		frustum = this.getFrustum(i);
		frustum.near[0] = distancesArray[i*2];
		frustum.far[0] = distancesArray[i*2+1];
		if (i === 0)
		{
			this.bigFrustum.near[0] = distancesArray[i*2];
		}
		if (i === numFrustums - 1)
		{
			this.bigFrustum.far[0] = distancesArray[i*2+1];
		}
	}
};

/**
 * 
 * Calculate the value of fovyRad and aspectRatio of each small frustum
 * @param {Float32Array[]} aspectRatio aspect ratio
 * @param {Float32Array[]} fovyRad the radian of FOV(Field Of View) y
 */
Camera.prototype.setAspectRatioAndFovyRad = function(aspectRatio, fovyRad)
{
	var frustum, frustum0;
	
	frustum0 = this.getFrustum(0);
	frustum0.aspectRatio[0] = aspectRatio;
	frustum0.fovyRad[0] = fovyRad; 
	frustum0.fovRad[0] = fovyRad*aspectRatio;
	frustum0.tangentOfHalfFovy[0] = Math.tan(fovyRad/2);
		
	var frustumsCount = this.frustumsArray.length;
	for (var i=1; i<frustumsCount; i++)
	{
		frustum = this.getFrustum(i);
		frustum.aspectRatio[0] = frustum0.aspectRatio[0];
		frustum.fovyRad[0] = frustum0.fovyRad[0]; 
		frustum.fovRad[0] = frustum0.fovRad[0];
		frustum.tangentOfHalfFovy[0] = frustum0.tangentOfHalfFovy[0];
	}
	
	this.bigFrustum.aspectRatio[0] = frustum0.aspectRatio[0];
	this.bigFrustum.fovyRad[0] = frustum0.fovyRad[0]; 
	this.bigFrustum.fovRad[0] = frustum0.fovRad[0];
	this.bigFrustum.tangentOfHalfFovy[0] = frustum0.tangentOfHalfFovy[0];
};

/**
 * Set the current frustum in bigFrustum
 * @param {Number} frustumIdx
 */
Camera.prototype.setCurrentFrustum = function(frustumIdx)
{
	this.frustum = this.getFrustum(frustumIdx);
};

/**
 * Bind the Camera uniforms
 * @param {gl} GL 
 * @param {shader} shader 
 */
Camera.prototype.bindUniforms = function(gl, shader) 
{
	// Bind frustum near & far. far.
	var frustum = this.frustum;
	gl.uniform1f(shader.frustumNear_loc, frustum.near[0]);
	gl.uniform1f(shader.frustumFar_loc, frustum.far[0]);
};

/**
 * Calculate the Frustums planes
 * 
 */
Camera.prototype.calculateFrustumsPlanes = function()
{
	var plane;
	// the 1rst frustum.
	var frustum0; 
	
	// Use the frustum0 to calculate nearWidth, nearHeight, farWidth & farHeight.
	frustum0 = this.getFrustum(0);
	var nearHeight = frustum0.tangentOfHalfFovy * frustum0.near * 2;
	var farHeight = frustum0.tangentOfHalfFovy * frustum0.far * 2;
	var nearWidth = nearHeight * frustum0.aspectRatio[0];
	var farWidht = farHeight * frustum0.aspectRatio[0];
	
	var px = this.position.x;
	var py = this.position.y;
	var pz = this.position.z;

	var dx = this.direction.x;
	var dy = this.direction.y;
	var dz = this.direction.z;
	
	// calculate right direction. "up" and "direction" must be unitaries.
	this.right = this.direction.crossProduct(this.up, this.right);
	
	// calculate the near and far points.
	this.nearCenterPoint.set(px + dx * frustum0.near, py + dy * frustum0.near, pz + dz * frustum0.near);
	this.farCenterPoint.set(px + dx * frustum0.far, py + dy * frustum0.far, pz + dz * frustum0.far);
	
	// far plane points.
	this.farLeftBottomPoint.set(this.farCenterPoint.x - this.right.x*farWidht*0.5 - this.up.x*farHeight*0.5, 
		this.farCenterPoint.y - this.right.y*farWidht*0.5 - this.up.y*farHeight*0.5, 
		this.farCenterPoint.z - this.right.z*farWidht*0.5 - this.up.z*farHeight*0.5);
								
	this.farRightTopPoint.set(this.farLeftBottomPoint.x + this.right.x*farWidht + this.up.x*farHeight, 
		this.farLeftBottomPoint.y + this.right.y*farWidht + this.up.y*farHeight, 
		this.farLeftBottomPoint.z + this.right.z*farWidht + this.up.z*farHeight);				
	
	// calculate directions.
	this.leftBottomDir.set(this.farLeftBottomPoint.x - px, this.farLeftBottomPoint.y - py, this.farLeftBottomPoint.z - pz);
	this.leftBottomDir.unitary(); // no necessary.
	
	this.rightTopDir.set(this.farRightTopPoint.x - px, this.farRightTopPoint.y - py, this.farRightTopPoint.z - pz);
	this.rightTopDir.unitary(); // no necessary.
	
	// near plane.
	plane = frustum0.planesArray[0];
	plane.setPointAndNormal(this.nearCenterPoint.x, this.nearCenterPoint.y, this.nearCenterPoint.z, dx, dy, dz);
							
	// far plane.
	plane = frustum0.planesArray[1];
	plane.setPointAndNormal(this.farCenterPoint.x, this.farCenterPoint.y, this.farCenterPoint.z, -dx, -dy, -dz);

	// The 4 lateral planes are the same for all frustum0s.
	// left plane.
	this.leftNormal = this.leftBottomDir.crossProduct(this.up, this.leftNormal);
	this.leftNormal.unitary();
	plane = frustum0.planesArray[2];
	plane.setPointAndNormal(px, py, pz, this.leftNormal.x, this.leftNormal.y, this.leftNormal.z);
							
	// bottom plane.
	this.bottomNormal = this.right.crossProduct(this.leftBottomDir, this.bottomNormal);
	this.bottomNormal.unitary();
	plane = frustum0.planesArray[3];
	plane.setPointAndNormal(px, py, pz, this.bottomNormal.x, this.bottomNormal.y, this.bottomNormal.z);
							
	// right plane.
	this.rightNormal = this.up.crossProduct(this.rightTopDir, this.rightNormal);
	this.rightNormal.unitary();
	plane = frustum0.planesArray[4];
	plane.setPointAndNormal(px, py, pz, this.rightNormal.x, this.rightNormal.y, this.rightNormal.z);
	
	// top plane.
	this.topNormal = this.rightTopDir.crossProduct(this.right, this.topNormal);
	this.topNormal.unitary();
	plane = frustum0.planesArray[5];
	plane.setPointAndNormal(px, py, pz, this.topNormal.x, this.topNormal.y, this.topNormal.z);
	
	// once finished, calculate the rest of frustums.
	var frustum;
	var frustumsCount = this.frustumsArray.length;
	for (var i=1; i<frustumsCount; i++)
	{
		frustum = this.getFrustum(i);
		
		// calculate the near and far points.
		this.nearCenterPoint.set(px + dx * frustum.near, py + dy * frustum.near, pz + dz * frustum.near);
		this.farCenterPoint.set(px + dx * frustum.far, py + dy * frustum.far, pz + dz * frustum.far);
		
		// near plane.
		plane = frustum.planesArray[0];
		plane.setPointAndNormal(this.nearCenterPoint.x, this.nearCenterPoint.y, this.nearCenterPoint.z, dx, dy, dz);
								
		// far plane.
		plane = frustum.planesArray[1];
		plane.setPointAndNormal(this.farCenterPoint.x, this.farCenterPoint.y, this.farCenterPoint.z, -dx, -dy, -dz);
		
		// the lateral planes.
		for (var j=2; j<6; j++)
		{
			frustum.planesArray[j] = frustum0.planesArray[j];
		}
	}
	
	// finally calculate the totalFrustum(BigFrustum).
	// calculate the near and far points.
	this.nearCenterPoint.set(px + dx * this.bigFrustum.near, py + dy * this.bigFrustum.near, pz + dz * this.bigFrustum.near);
	this.farCenterPoint.set(px + dx * this.bigFrustum.far, py + dy * this.bigFrustum.far, pz + dz * this.bigFrustum.far);
	
	// near plane.
	plane = this.bigFrustum.planesArray[0];
	plane.setPointAndNormal(this.nearCenterPoint.x, this.nearCenterPoint.y, this.nearCenterPoint.z, dx, dy, dz);
							
	// far plane.
	plane = this.bigFrustum.planesArray[1];
	plane.setPointAndNormal(this.farCenterPoint.x, this.farCenterPoint.y, this.farCenterPoint.z, -dx, -dy, -dz);
		
	var lastFrustum = this.getLastFrustum();
	for (var j=2; j<6; j++) // starting in i==2.
	{
		// the bigFrustum is esqual to frustum0 except in the "far".
		this.bigFrustum.planesArray[j] = frustum0.planesArray[j];
	}
};

/**
 * if track node exist, do track.
 * @param {MagoManager} magoManager
 */
Camera.prototype.doTrack = function(magoManager)
{
	if (this.tracked)
	{
		// Set camera position.*
		var trackNode = this.tracked;
		if (magoManager.isCesiumGlobe())
		{
			var camera = magoManager.scene.camera;
			var position = camera.positionWC;
			var movedCamPos;
			var geoLocDatamanager;
			if (trackNode instanceof Node) 
			{
				geoLocDatamanager = trackNode.getNodeGeoLocDataManager();
			}
			else if (trackNode instanceof MagoRenderable)
			{
				geoLocDatamanager = trackNode.geoLocDataManager;
			}
			
			//var geoLocationData = geoLocDatamanager.getTrackGeoLocationData();
			if (geoLocDatamanager === undefined)
			{ return; }
			
			var geoLocationData = geoLocDatamanager.getCurrentGeoLocationData();
			if (geoLocationData === undefined)
			{ return; }

			var prevGeoLocationData = geoLocDatamanager.getGeoLocationData(1);
			if (defined(prevGeoLocationData))
			{
				var currentPos = geoLocationData.positionLOW;
				var prevPos =  prevGeoLocationData.positionLOW;
				var camPosHIGH = new Float32Array([0.0, 0.0, 0.0]);
				var camPosLOW = new Float32Array([0.0, 0.0, 0.0]);
				
				ManagerUtils.calculateSplited3fv([position.x, position.y, position.z], camPosHIGH, camPosLOW);

				var dx = currentPos[0] - prevPos[0];
				var dy = currentPos[1] - prevPos[1];
				var dz  = currentPos[2] - prevPos[2];
				movedCamPos = new Cesium.Cartesian3();

				movedCamPos.x = camPosHIGH[0] + camPosLOW[0] + dx;
				movedCamPos.y = camPosHIGH[1] + camPosLOW[1] + dy;
				movedCamPos.z = camPosHIGH[2] + camPosLOW[2] + dz;
			}
			var targetGeographicCoords = geoLocationData.getGeographicCoords();
			if (targetGeographicCoords === undefined)
			{ return; }
			var target = Cesium.Cartesian3.fromDegrees(targetGeographicCoords.longitude, targetGeographicCoords.latitude, targetGeographicCoords.altitude);

			if (this.trackType === CODE.trackMode.TRACKING)
			{
				var range = Cesium.Cartesian3.distance(movedCamPos ? movedCamPos : position, target);
				var hpr = new Cesium.HeadingPitchRange(camera.heading, camera.pitch, range);

				camera.lookAt(target, hpr);
			}
			//CODE.trackMode.DRIVER
			else
			{
				var rotMat = geoLocationData.rotMatrix;
				var rotPointTarget  = rotMat.rotatePoint3D(new Point3D(0, this.targetOffset, 0));
				var rotPointCamPos = rotMat.rotatePoint3D(new Point3D(0, this.trackCameraOffsetY, this.trackCameraOffsetZ));

				rotPointCamPos.x = target.x + rotPointCamPos.x;
				rotPointCamPos.y = target.y + rotPointCamPos.y;
				rotPointCamPos.z = target.z + rotPointCamPos.z;

				rotPointTarget.x = target.x + rotPointTarget.x;
				rotPointTarget.y = target.y + rotPointTarget.y;
				rotPointTarget.z = target.z + rotPointTarget.z;

				var geoLocMat = geoLocationData.geoLocMatrix._floatArrays;
				var earthNormal = new Point3D(geoLocMat[8], geoLocMat[9], geoLocMat[10]);
				Camera.setByPositionAndTarget(camera, rotPointTarget, rotPointCamPos, earthNormal);
			}
		}
		else
		{
			//this.lookAt() -> we must develope lookAt function in magoworld.
		}
	}
	else if (this.gotoAnimation !== undefined)
	{
		// Do goto-animation.
		
	}
};

/**
 * stop track 
 * @param {MagoManager} magoManager
 */
Camera.prototype.stopTrack = function(magoManager)
{
	this.tracked = undefined;
	if (magoManager.isCesiumGlobe())
	{
		magoManager.scene.camera.lookAtTransform(Cesium.Matrix4.IDENTITY); //set camera transform
	}
	else
	{
		//this.lookAtStop() -> we must develope lookAtStop function in magoworld.
	}
};

/**
 * set track node.
 * Node is a single feature at F4D specification
 * Implement this function for tracking moving objects such as automatically moving vehicle
 * @param {Object} node
 * @param {trackOption} option Optional. 비어있을 시 TRACKING 모드로 설정
 */
Camera.prototype.setTrack = function(node, option)
{
	this.initTrackOption();

	this.tracked = node;
	if (option)
	{
		this.trackType = defaultValue(option.type, this.trackType);
		this.targetOffset = defaultValue(option.targetOffset, this.targetOffset);

		if (option.trackCameraOffset)
		{
			this.trackCameraOffsetY = defaultValueCheckLength(option.trackCameraOffset.y, this.trackCameraOffsetY);
			this.trackCameraOffsetZ = defaultValueCheckLength(option.trackCameraOffset.z, this.trackCameraOffsetZ);
		}
	}
};

/**
 * 카메라 트래킹 옵션 기본값으로 초기화
 */
Camera.prototype.initTrackOption = function()
{
	this.trackType = CODE.trackMode.TRACKING;
	this.targetOffset = 10.0;
	this.trackCameraOffsetY = -1;
	this.trackCameraOffsetZ = 12;
};

/**
 * 두 점을 이용하여 디렉션 정보 계산
 */
Camera.prototype.getPosition = function()
{
	return this.position;
};

/**
 * 두 점을 이용하여 디렉션 정보 계산
 */
Camera.prototype.getDirection = function()
{
	return this.direction;
};

/**
 * 두 점을 이용하여 디렉션 정보 계산
 */
Camera.prototype.getUp = function()
{
	return this.up;
};

/**
 * set position and orientation ( direction, up) of the camera
 * only cesium
 * 
 * @static
 * @param {Cesium.Camera} camera cesium camera object.
 * @param {Point3D} camTarget
 * @param {Point3D} camPos
 * @param {Point3D} aproxCamUp
 */
Camera.setByPositionAndTarget = function (camera, camTarget, camPos, aproxCamUp) 
{
	var direction = new Point3D();
	direction.set(camTarget.x - camPos.x, camTarget.y - camPos.y, camTarget.z - camPos.z);
	direction.unitary();

	var right = direction.crossProduct(aproxCamUp);
	var up = right.crossProduct(direction);
	up.unitary();
	camera.setView({
		destination : camPos,
		orientation : {
			direction : new Cesium.Cartesian3(direction.x, direction.y, direction.z),
			up        : new Cesium.Cartesian3(up.x, up.y, up.z)
		}
	});
};

/**
 * 어떤 일을 하고 있습니까?
 */
Camera.prototype.calculateUp = function(aproxCamUp) 
{
	this.right = this.direction.crossProduct(aproxCamUp, this.right);
	this.right.unitary();
	this.up = this.right.crossProduct(this.direction, this.up);
	this.up.unitary();
};

/**
 * 어떤 일을 하고 있습니까?
 */
Camera.prototype.finishedAnimation = function(magoManager) 
{
	var finished = false;
	var animData = this.animationData;
	
	if (animData === undefined)
	{ return true; }

	var currTime = magoManager.getCurrentTime();
	
	var nextLongitude;
	var nextLatitude;
	var nextAltitude;
	var nextHeading;
	var nextPitch;
	var nextRoll;

	// Check animationType.***
	var animType = animData.animationType;
	if (animType === CODE.animationType.PATH)
	{
		// Test.***
		var nextPosLine = AnimationManager.getNextPosition(animData, currTime, magoManager);
		
		if (nextPosLine === undefined)
		{ 
			animData.finished = true;
			return true; 
		}
	
		var path = animData.path;
		var pathGeoLocDataManager = path.getGeoLocationDataManager();
		var pathGeoLocData = pathGeoLocDataManager.getCurrentGeoLocationData();
		
		// Now, calculate the geographic coords of the position.***
		var posLocal = nextPosLine.point;
		var dir = nextPosLine.direction;

		// calculate worldPos.***
		var tMat = pathGeoLocData.tMatrix;
		var posWC = tMat.transformPoint3D(posLocal, undefined);
		
		this.position.copyFrom(posWC); 
		//this.direction.copyFrom(dir);
		
		// now, must calculate camera-Up by earth normal.***
		var normalEarth = Globe.normalAtCartesianPointWgs84(posWC.x, posWC.y, posWC.z, undefined);
		this.calculateUp(new Point3D(normalEarth[0], normalEarth[1], normalEarth[2]));
		//this.direction; 
		//this.up;
		/*
		var geographicCoords = Globe.CartesianToGeographicWgs84(posWC.x, posWC.y, posWC.z, undefined);
		nextLatitude = geographicCoords.latitude;
		nextLongitude = geographicCoords.longitude;
		nextAltitude = geographicCoords.altitude;
		
		// now calculate heading, pitch & roll.***
		var yAxis = new Point2D(0, 1);
		var dir2d = new Point2D(dir.x, dir.y);
		dir2d.unitary();
		var headingAngle = yAxis.angleDegToVector(dir2d);
		if (dir2d.x > 0.0)
		{
			headingAngle *= -1;
		}
		*/
		var magoWorld = magoManager.magoWorld;
		magoWorld.updateModelViewMatrixByCamera(this);
		
		// finally update "lastTime".
		animData.lastTime = currTime;
		return finished;
	}

	return finished;
};
