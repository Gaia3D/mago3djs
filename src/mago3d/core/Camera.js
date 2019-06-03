'use strict';

/**
 * 카메라
 * @class Camera
 */
var Camera = function() 
{
	if (!(this instanceof Camera)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this.position = new Point3D(); 
	this.direction = new Point3D(); 
	this.up = new Point3D();
	this.right = new Point3D();
	this.frustum = new Frustum(); // current frustum.
	this.bigFrustum = new Frustum(); // sum of all frustums.
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
	this.tracked;
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
 * 
 * Translate this camera with translation vector
 * @param translationVec
 */
Camera.prototype.translate = function(translationVec)
{
	this.position.add(translationVec.x, translationVec.y, translationVec.z);
};

/**
 * 카메라
 * @class Camera
 */
Camera.prototype.transformByMatrix4 = function(mat)
{
	// transform position, direction and up.
	/*
	this.position = this.transformPoint3DByMatrix4(this.position, mat);
	
	if (this.rotMat === undefined)
	{ this.rotMat = mat3.create(); }
	
	this.rotMat = mat3.fromMat4(this.rotMat, mat);

	this.direction = this.rotatePoint3DByMatrix3(this.direction, this.rotMat);
	this.up = this.rotatePoint3DByMatrix3(this.up, this.rotMat);
	*/
	// Calculate with our matrix4.
	this.position = mat.transformPoint3D(this.position, this.position);
	this.direction = mat.rotatePoint3D(this.direction, this.direction);
	this.up = mat.rotatePoint3D(this.up, this.up);
};

/**
 * 카메라
 * @class Camera
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
 * @class Camera
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
 * @class Camera
 */
Camera.prototype.getCameraRight = function()
{
	if (this.right === undefined)
	{ this.right = new Point3D(); }
	
	this.right = this.direction.crossProduct(this.up, this.right);
	return this.right;
};

/**
 * Transforms the vector "point" by given matrix4
 * @param point
 * @param {Mat4} mat
 * @return {Vec3} 
 */
Camera.prototype.transformPoint3DByMatrix4 = function(point, mat)
{
	var pos = vec3.clone([point.x, point.y, point.z]);
	var tPos = vec3.create();
	tPos = vec3.transformMat4(tPos, pos, mat);
	point.set(tPos[0], tPos[1], tPos[2]);
	
	return point;
};

/**
 * Transforms the vector "point" by given matrix4
 * @param point
 * @param {Mat3} mat
 * @return {Vec3} 
 */
Camera.prototype.rotatePoint3DByMatrix3 = function(point, mat)
{
	var pos = vec3.clone([point.x, point.y, point.z]);
	var tPos = vec3.create();
	tPos = vec3.transformMat3(tPos, pos, mat);
	point.set(tPos[0], tPos[1], tPos[2]);
	
	return point;
};

/**
 * set dirty flag of the object
 * -dirty flag : Avoid unnecessary work by deferring it until the result is needed.
 * @class Camera
 */
Camera.prototype.setDirty = function(cameraIsDirty)
{
	this.dirty = cameraIsDirty;
};

/**
 * get dirty flag of the object
 * @class Camera
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
 * @return {Boolean} 
 * 
 */
Camera.prototype.isCameraMoved = function(newPosX, newPosY, newPosZ, newDirX, newDirY, newDirZ, newUpX, newUpY, newUpZ )
{
	if (this.position.x === newPosX && this.position.y === newPosY && this.position.z === newPosZ && 
		this.direction.x === newDirX && this.direction.y === newDirY && this.direction.z === newDirZ && 
		this.up.x === newUpX && this.up.y === newUpY && this.up.z === newUpZ)
	{ return false; }
	else
	{ return true; }
};

/**
 * get the small Frustum in big frustum
 * @class Camera
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
 */
Camera.prototype.getLastFrustum = function()
{
	return this.getFrustum(this.frustumsArray.length - 1);
};

/**
 * The list of the distance between the divided frustum of visualization volume using each small frustum's near and far
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
 * @param aspectRatio aspect ratio
 * @param fovyRad the radian of FOV(Field Of View) y
 * @class Camera
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
 * @class Camera
 */
Camera.prototype.setCurrentFrustum = function(frustumIdx)
{
	this.frustum = this.getFrustum(frustumIdx);
};

/**
 */
Camera.prototype.bindCameraUniforms = function(gl, shader) 
{
	// Bind frustum near & far.
	var frustum = this.frustum;
	gl.uniform1f(shader.frustumNear_loc, frustum.near[0]);
	gl.uniform1f(shader.frustumFar_loc, frustum.far[0]);
};

/**
 * 카메라
 * @class Camera
 */
Camera.prototype.calculateFrustumsPlanes = function()
{
	var plane;
	var frustum0; // the 1rst frustum.
	
	// Use the frustum0 to calculate nearWidth, nearHeight, farWidth & farHeight.
	frustum0 = this.getFrustum(0);
	var nearHeight = frustum0.tangentOfHalfFovy * frustum0.near * 2;
	var farHeight = frustum0.tangentOfHalfFovy * frustum0.far * 2;
	var nearWidth = nearHeight * frustum0.aspectRatio;
	var farWidht = farHeight * frustum0.aspectRatio;
	
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
 * @param {Object} magoManager
 */
Camera.prototype.doTrack = function(magoManager)
{
	if (this.tracked)
	{
		// Set camera position.*
		var trackNode = this.tracked;
		if (MagoConfig.getPolicy().geo_view_library === Constant.CESIUM)
		{
			var camera = magoManager.scene.camera;
			var position = camera.positionWC;
			var movedCamPos;

			var geoLocDatamanager = trackNode.getNodeGeoLocDataManager();
			//var geoLocationData = geoLocDatamanager.getTrackGeoLocationData();
			if (geoLocDatamanager === undefined)
			{ return; }
			
			var geoLocationData = geoLocDatamanager.getCurrentGeoLocationData();
			if (geoLocationData === undefined)
			{ return; }

			var prevGeoLocationData = geoLocDatamanager.getGeoLocationData(1);
			if (defined(prevGeoLocationData))
			{
				var currentPos = geoLocationData.position;
				var prevPos =  prevGeoLocationData.position;

				var dx = currentPos.x - prevPos.x;
				var dy = currentPos.y - prevPos.y;
				var dz  = currentPos.z - prevPos.z;
				movedCamPos = new Cesium.Cartesian3();
				movedCamPos.x = position.x + dx;
				movedCamPos.y = position.y + dy;
				movedCamPos.z = position.z + dz;
			}
			var targetGeographicCoords = geoLocationData.getGeographicCoords();
			if (targetGeographicCoords === undefined)
			{ return; }
			var target = Cesium.Cartesian3.fromDegrees(targetGeographicCoords.longitude, targetGeographicCoords.latitude, targetGeographicCoords.altitude);
			var range = Cesium.Cartesian3.distance(movedCamPos ? movedCamPos : position, target);
			var hpr = new Cesium.HeadingPitchRange(camera.heading, camera.pitch, range);

			camera.lookAt(target, hpr); //How To lookAt off : use camera.lookAtTransform(Cesium.Matrix4.IDENTITY);
			
			/*var sphere = new Sphere();
			var radiusAprox_aux = trackNode.data.bbox.getRadiusAprox();
			sphere.radius = radiusAprox_aux;
			sphere.center = target;

			camera.viewBoundingSphere(sphere, hpr);*/
		}
		else
		{
			//this.lookAt() -> we must develope lookAt function in magoworld.
		}
	}
};

/**
 * stop track 
 * @param {Object} magoManager
 */
Camera.prototype.stopTrack = function(magoManager)
{
	this.tracked = undefined;
	if (MagoConfig.getPolicy().geo_view_library === Constant.CESIUM)
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
 */
Camera.prototype.setTrack = function(node)
{
	this.tracked = node;
};