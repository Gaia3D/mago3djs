'use strict';

/**
 * @param {*} option 
 * @class BasicVehicle
 */
var BasicVehicle = function()
{
	if (!(this instanceof BasicVehicle)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
	this.dirty = true;

	this.box;
	this.frontArrow;
	this.rearArrow;

	/**
	 * distance between wheel axis
	 * @type {number}
	 */
	this.wheelbase;

	/**
	 * 바퀴 축 갯수
	 * @type {number}
	 */
	this.axle = 0;

	/**
	 * 바퀴
	 * @type {Wheel}
	 */
	this.wheels = [];

	this.frontArrowPos;
	this.rearArrowPos;

	/**
	 * y axix is zero degree
	 * @type {number}
	 */
	this.rearAngleDeg = 0;

	/**
	 * y axix is zero degree
	 * @type {number}
	 */
	this.frontAngleDeg = 0;

	this.isDrawArrow = true;

	this.eventStatus = {
		changingFrontArrow : false,
		changingRearArrow  : false,
		footOnAccel        : false
	};

	this.mode = {
		'PARALLEL' : 0,
		'FREE'     : 0
	};

	//this.changingFrontArrow = false;
	this.changingFrontArrowType = 0;
	this.changingFrontArrowSpeed = 0.4;

	//this.changingRearArrow = false;
	this.changingRearArrowType = 0;
	this.changingRearArrowSpeed = 0.4;

	//move
	/**
	 * unit m/s, EXAMPLE. 1.388889M/S IS 5KM/H 
	 * @type {number}
	 */
	this.maxSpeed = 4;
	this.frontCurrentSpeed = 0;
	this.frontAcceleration = 1;
	this.frontDeacceleration = 3.8;

	this.rearCurrentSpeed = 0;
	this.rearAcceleration = 1;
	this.rearDeacceleration = 3.8;

	this.pivotPointLC;
	this.isParallelDirection = false;

	this.guidePoint = new Point3DList();

	this.auxOffsetVector;
};

BasicVehicle.prototype.setWheelbase = function(wheelbase) 
{
	this.wheelbase = wheelbase;
};

BasicVehicle.prototype.getWheelbase = function() 
{
	return this.wheelbase;
};

BasicVehicle.prototype.setBox = function(box) 
{
	if (!box instanceof Box) 
	{
		throw new Error('box must Mago3d.Box instance.');
	}
	this.box = box;
};

BasicVehicle.prototype.getBox = function() 
{
	return this.box;
};

BasicVehicle.prototype.setFrontArrow = function(arrow) 
{
	if (!arrow instanceof Arrow) 
	{
		throw new Error('arrow must Mago3d.Arrow instance.');
	}
	this.frontArrow = arrow;
};

BasicVehicle.prototype.getFrontArrow = function() 
{
	return this.frontArrow;
};

BasicVehicle.prototype.setRearArrow = function(arrow) 
{
	if (!arrow instanceof Arrow) 
	{
		throw new Error('arrow must Mago3d.Arrow instance.');
	}
	this.rearArrow = arrow;
};

BasicVehicle.prototype.getRearArrow = function() 
{
	return this.rearArrow;
};

BasicVehicle.prototype.doChangeFrontAngleDeg = function(type) 
{
	this.eventStatus.changingFrontArrow = true;
	if (type === 'left') 
	{
		this.changingFrontArrowType = 0;
	}
	else 
	{
		this.changingFrontArrowType = 1;
	}
};

BasicVehicle.prototype.stopChangeFrontAngleDeg = function() 
{
	this.eventStatus.changingFrontArrow = false;
};

BasicVehicle.prototype.doChangeRearAngleDeg = function(type) 
{
	this.eventStatus.changingRearArrow = true;
	if (type === 'left') 
	{
		this.changingRearArrowType = 0;
	}
	else 
	{
		this.changingRearArrowType = 1;
	}
};
BasicVehicle.prototype.stopChangeRearAngleDeg = function() 
{
	this.eventStatus.changingRearArrow = false;
};
BasicVehicle.prototype._updateLastTime = function(currentTime) 
{
	this.lastTime = currentTime;
};
BasicVehicle.prototype.move = function(magoManager) 
{
	if (this.renderingFase === undefined || this.renderingFase === null) { this.renderingFase = magoManager.renderingFase; }
	if (this.renderingFase === magoManager.renderingFase)
	{ return; }
	if (!this.eventStatus.footOnAccel && this.frontCurrentSpeed === 0) { return; }
	
	var frontSpeed = 1;
	var rearSpeed = 0.8;
	var currentTime = magoManager.getCurrentTime();
	if (!this.lastTime) { this._updateLastTime(currentTime); }

	var deltaTime = (currentTime - this.lastTime) / 1000;
	if (deltaTime === 0) { return; }

	var accel = this.eventStatus.footOnAccel ? this.frontAcceleration : -this.frontDeacceleration;
	this.frontCurrentSpeed = calculateSpeed(deltaTime, accel, this.frontCurrentSpeed);

	if (this.frontCurrentSpeed > this.maxSpeed) { this.frontCurrentSpeed = this.maxSpeed; }

	var geoLocManager = this.geoLocDataManager;
	var geoLocData = geoLocManager.getCurrentGeoLocationData();
	
	//this.frontDirection2D = this.getFrontDirection2D(new Point2D());
	//this.rearDirection2D = this.getRearDirection2D(new Point2D());

	
	// 두 바퀴의 방향이 거의 동일 할 경우
	if (this.isParallelDirection) 
	{
		// do translate.
		var direction = this.frontDirection2D;//this.getFrontDirection2D(new Point2D());
		
		var direction3D = new Point3D(direction.x, direction.y, 0);
		var posLC = new Point3D(direction3D.x * this.frontCurrentSpeed * deltaTime, direction3D.y * this.frontCurrentSpeed * deltaTime, direction3D.z * this.frontCurrentSpeed * deltaTime);

		var rotMat = geoLocData.rotMatrix;
		var posLcRot = rotMat.rotatePoint3D(posLC);

		var posWCHIGH = new Float32Array(3);
		var posWCLOW = new Float32Array(3);

		posWCLOW[0] = geoLocData.positionLOW[0] + posLcRot.x;
		posWCLOW[1] = geoLocData.positionLOW[1] + posLcRot.y;
		posWCLOW[2] = geoLocData.positionLOW[2] + posLcRot.z;

		posWCHIGH[0] = geoLocData.positionHIGH[0];
		posWCHIGH[1] = geoLocData.positionHIGH[1];
		posWCHIGH[2] = geoLocData.positionHIGH[2];

		var posWC = geoLocData.localCoordToWorldCoord(posLC);
		geoCoord = ManagerUtils.pointToGeographicCoord(posWC, geoCoord);

		geoLocData = ManagerUtils.calculateGeoLocationDataByAbsolutePoint(posWCLOW[0] + posWCHIGH[0], posWCLOW[1] + posWCHIGH[1], posWCLOW[2] + posWCHIGH[2], geoLocData, magoManager);
		//geoLocData = ManagerUtils.calculateGeoLocationData(geoCoord.longitude, geoCoord.latitude, auxAltitude, geoLocData.heading, geoLocData.pitch, geoLocData.roll, geoLocData, magoManager);
	}
	else 
	{
		// do rotate
		var radiusErr = 10E-4;
		var frontArrowPos = this.frontArrowPos;
		var rearArrowPos = this.rearArrowPos;
		var frontLine2D = this.frontLine2D;
		var rearLine2D = this.rearLine2D;
		var frontDirection2D = this.frontDirection2D;
		var rearDirection2D = this.rearDirection2D;

		//front
		var frontSpeed = this.frontCurrentSpeed;
		var frontDist = frontSpeed * deltaTime;
		var frontPosTranslated = new Point3D(frontArrowPos.x, frontArrowPos.y, 0);
		frontPosTranslated.add(this.auxOffsetVector.x, this.auxOffsetVector.y, 0);
		var frontRadius = this.pivotPointLC.distToPoint(frontArrowPos);

		//rotation radius coincident
		if (frontRadius < radiusErr) 
		{ 
			this._updateLastTime(undefined);
			this.frontCurrentSpeed = 0;
			return; 
		}

		var frontRad = frontDist / frontRadius;
		var frontRelativeSideOfPoint = frontLine2D.getRelativeSideOfPoint(this.pivotPointLC);
		if (frontRelativeSideOfPoint === CODE.relativePosition2D.RIGHT) 
		{ frontRad *= -1; }
		
		var frontAuxMatrix = new Matrix4();
		frontAuxMatrix.rotationAxisAngRad(frontRad, 0, 0, 1);
		var frontPosRotated = frontAuxMatrix.rotatePoint3D(frontPosTranslated);
		var frontPosTransformed = new Point3D(frontPosRotated.x, frontPosRotated.y, frontPosRotated.z);
		frontPosTransformed.add(-this.auxOffsetVector.x, -this.auxOffsetVector.y, 0);

		//rear
		var scalarProduct = rearDirection2D.scalarProduct(frontDirection2D);
		var rearSpeed = frontSpeed * scalarProduct;
		var rearDist = rearSpeed * deltaTime;
		var rearPosTranslated = new Point3D(rearArrowPos.x, rearArrowPos.y, 0);
		rearPosTranslated.add(this.auxOffsetVector.x, this.auxOffsetVector.y, 0);
		var rearRadius = this.pivotPointLC.distToPoint(rearArrowPos);
		
		//rotation radius coincident
		/*if (rearRadius < radiusErr) 
		{ 
			this._updateLastTime(undefined);
			this.frontCurrentSpeed = 0;
			return; 
		}*/

		//var rearRad = rearDist / rearRadius;
		var rearRad = frontRad;

		//var rearRelativeSideOfPoint = rearLine2D.getRelativeSideOfPoint(this.pivotPointLC);
		//if (rearRelativeSideOfPoint === CODE.relativePosition2D.RIGHT) { rearRad *= -1; }

		var rearAuxMatrix = new Matrix4();
		rearAuxMatrix.rotationAxisAngRad(rearRad, 0, 0, 1);
		var rearPosRotated = rearAuxMatrix.rotatePoint3D(rearPosTranslated);
		var rearPosTransformed = new Point3D(rearPosRotated.x, rearPosRotated.y, rearPosRotated.z);
		rearPosTransformed.add(-this.auxOffsetVector.x, -this.auxOffsetVector.y, 0);

		//frame
		var framePosLC = new Point3D((frontPosTransformed.x + rearPosTransformed.x) / 2, (frontPosTransformed.y + rearPosTransformed.y) / 2, 0);
		var frameSegemnt = new Segment2D(rearPosTransformed, frontPosTransformed);
		var frameDirection = frameSegemnt.getDirection();
		var initialFrameDirection = new Point2D(0, 1);//this.getFrameDirection2D();

		var heading = frameDirection.angleDegToVector(initialFrameDirection);
		if (frameDirection.x > 0 ) { heading *= -1; }

		var rotMat = geoLocData.rotMatrix;

		var posWCHIGH = new Float32Array(3);
		var posWCLOW = new Float32Array(3);

		var framePosWCRot = rotMat.rotatePoint3D(framePosLC);

		posWCLOW[0] = geoLocData.positionLOW[0] + framePosWCRot.x;
		posWCLOW[1] = geoLocData.positionLOW[1] + framePosWCRot.y;
		posWCLOW[2] = geoLocData.positionLOW[2] + framePosWCRot.z;

		posWCHIGH[0] = geoLocData.positionHIGH[0];
		posWCHIGH[1] = geoLocData.positionHIGH[1];
		posWCHIGH[2] = geoLocData.positionHIGH[2];
		if (geoLocData.heading === undefined) { geoLocData.heading = 0; }
		heading = geoLocData.heading + heading;
		//geoLocData.heading = BasicVehicle.degreeValidator(heading);
		//geoLocData = ManagerUtils.calculateGeoLocationDataByAbsolutePoint(posWCLOW[0] + posWCHIGH[0], posWCLOW[1] + posWCHIGH[1], posWCLOW[2] + posWCHIGH[2], geoLocData, magoManager);

		var auxPoint3DWC = new Point3D(posWCLOW[0] + posWCHIGH[0], posWCLOW[1] + posWCHIGH[1], posWCLOW[2] + posWCHIGH[2]);
		var auxGeoCoord = ManagerUtils.pointToGeographicCoord(auxPoint3DWC);
		
		auxGeoCoord.altitude = 0;
		geoLocData = ManagerUtils.calculateGeoLocationData(auxGeoCoord.longitude, auxGeoCoord.latitude, auxGeoCoord.altitude, BasicVehicle.degreeValidator(heading), geoLocData.pitch, geoLocData.roll, geoLocData, magoManager);

		//헤딩이 변할 시 화살표 업데이트 해줘야함.
		this.update();
		//this.arrowDirectionChanged(magoManager);
	}

	
	var geoCoord = geoLocData.geographicCoord;
	var tile = this.smartTileOwner;
	var lon = geoCoord.longitude;
	var lat = geoCoord.latitude;
	
	if (!tile.intersectPoint(lon, lat))
	{
		tile.eraseObjectByComparision(this, 'name');
		var targetDepth = tile.depth;
		
		magoManager.smartTileManager.putObject(targetDepth, this, magoManager);
	}
	
	//시간 초기화
	if (this.frontCurrentSpeed === 0 && !this.eventStatus.footOnAccel) { currentTime = undefined; }
	this._updateLastTime(currentTime);

	this.renderingFase = !this.renderingFase;
	function calculateSpeed(dTime, acc, currentSpeed) 
	{
		var deltaSpeed = acc * dTime;
		currentSpeed = currentSpeed + deltaSpeed;

		if (currentSpeed < 0) { currentSpeed = 0; }
		return currentSpeed;
	}
};
/**
 * @return {Point2D}
 */
BasicVehicle.prototype.getFrameDirection2D = function(resultPoint2D)
{
	if (!resultPoint2D) { resultPoint2D = new Point2D(); }
	var geoLocManager = this.geoLocDataManager;
	var geoLocData = geoLocManager.getCurrentGeoLocationData();
	var heading = geoLocData.heading;

	var headingRad = heading * Math.PI / 180;
	resultPoint2D.set(-Math.sin(headingRad), Math.cos(headingRad));
	
	return resultPoint2D;
};
/**
 * @return {Point2D}
 */
BasicVehicle.prototype.getFrontDirection2D = function(resultPoint2D)
{
	if (!resultPoint2D) { resultPoint2D = new Point2D(); }
	var frontAngleRad = this.frontAngleDeg * Math.PI / 180;
	resultPoint2D.set(-Math.sin(frontAngleRad), Math.cos(frontAngleRad));
	return resultPoint2D;
};
/**
 * @return {Point2D}
 */
BasicVehicle.prototype.getRearDirection2D = function(resultPoint2D) 
{
	if (!resultPoint2D) { resultPoint2D = new Point2D(); }
	var rearAngleRad = this.rearAngleDeg * Math.PI / 180;
	resultPoint2D.set(-Math.sin(rearAngleRad), Math.cos(rearAngleRad));
	return resultPoint2D;
};
BasicVehicle.prototype.footOnAccel = function() 
{
	this.eventStatus.footOnAccel = true;
};
BasicVehicle.prototype.footOffAccel = function() 
{
	this.eventStatus.footOnAccel = false;
};
BasicVehicle.prototype.makeMesh = function() 
{
	if (this.objectsArray === undefined)
	{ this.objectsArray = []; }

	if (this.objectsMap === undefined)
	{ this.objectsMap = {}; }


	var box = this.getBox();
	if (!box.mesh) { box.makeMesh(); }

	var bodyMesh = box.mesh;
	bodyMesh.name = 'body';

	this.objectsArray.push(box.mesh);
	this.objectsMap[bodyMesh.name] = box;

	if (this.isDrawArrow) 
	{	
		if (!this.getFrontArrow().mesh) { this.getFrontArrow().makeMesh(); }

		this.frontArrowPos = new Point3D(0, this.wheelbase * 0.5, box.height);
		this.rearArrowPos = new Point3D(0, -this.wheelbase * 0.5, box.height);
		
		var frontArrow = this.getFrontArrow();

		frontArrow.tMat = new Matrix4();

		var frontArrowMesh = frontArrow.mesh;
		frontArrowMesh.name = 'frontArrow';
		this.objectsArray.push(frontArrow);
		this.objectsMap[frontArrowMesh.name] = frontArrow;

		if (!this.getRearArrow().mesh) { this.getRearArrow().makeMesh(); }

		var rearArrow = this.getRearArrow();

		rearArrow.tMat = new Matrix4();

		var rearArrowMesh = rearArrow.mesh;
		rearArrowMesh.name = 'rearArrow';
		this.objectsArray.push(rearArrow);
		this.objectsMap[rearArrowMesh.name] = rearArrow;
	}

	this.dirty = false;
};

BasicVehicle.prototype.update = function() 
{
	//front arrow
	var frontArrow = this.getFrontArrow();

	var frontTranslateAuxMat = new Matrix4();
	frontTranslateAuxMat.setTranslation(this.frontArrowPos.x, this.frontArrowPos.y, this.frontArrowPos.z);
	var frontRotAuxMat = new Matrix4();
	frontRotAuxMat.rotationAxisAngDeg(this.frontAngleDeg, 0, 0, 1);

	this.frontDirection2D = this.getFrontDirection2D();
	var frontTAuxMat = frontRotAuxMat.getMultipliedByMatrix(frontTranslateAuxMat);

	//rear arrow
	var rearArrow = this.getRearArrow();
	var rearTranslateAuxMat = new Matrix4();
	rearTranslateAuxMat.setTranslation(this.rearArrowPos.x, this.rearArrowPos.y, this.rearArrowPos.z);
	var rearRotAuxMat = new Matrix4();
	rearRotAuxMat.rotationAxisAngDeg(this.rearAngleDeg, 0, 0, 1);

	this.rearDirection2D = this.getRearDirection2D();
	var rearTAuxMat = rearRotAuxMat.getMultipliedByMatrix(rearTranslateAuxMat);

	//world coord matrix
	var geoLocData = this.geoLocDataManager.getCurrentGeoLocationData();
	var vehicleRotMat = geoLocData.rotMatrix;

	frontArrow.tMat = frontTAuxMat.getMultipliedByMatrix(vehicleRotMat, frontArrow.tMat);
	rearArrow.tMat = rearTAuxMat.getMultipliedByMatrix(vehicleRotMat, rearArrow.tMat);

};

BasicVehicle.prototype.arrowDirectionChanged = function(magoManager) 
{
	//front arrow
	this.update();
	var frontDirection2D = this.frontDirection2D;//this.getFrontDirection2D(new Point2D());
	var rearDirection2D = this.rearDirection2D;//this.getRearDirection2D(new Point2D());

	var error = 0.1;
	this.isParallelDirection = frontDirection2D.isParallelToPoint(rearDirection2D, error);

	if (!this.isParallelDirection) 
	{
		var frontArrowPos = this.frontArrowPos;
		var rearArrowPos = this.rearArrowPos;

		var frontArrowSegment = new Segment2D(new Point2D(frontArrowPos.x, frontArrowPos.y), new Point2D(frontArrowPos.x + frontDirection2D.x, frontArrowPos.y + frontDirection2D.y));
		var rearArrowSegment = new Segment2D(new Point2D(rearArrowPos.x, rearArrowPos.y),  new Point2D(rearArrowPos.x + rearDirection2D.x, rearArrowPos.y + rearDirection2D.y));

		this.frontLine2D = frontArrowSegment.getLine(); 
		this.rearLine2D = rearArrowSegment.getLine();
		
		var frontLine2D = this.frontLine2D;
		var rearLine2D = this.rearLine2D;
		//getPerpendicularRight
		var frontLinePerpendicular2D = frontLine2D.getPerpendicularRight();
		var rearLinePerpendicular2D = rearLine2D.getPerpendicularRight();

		var intersectPoint2D = frontLinePerpendicular2D.intersectionWithLine(rearLinePerpendicular2D);
		this.pivotPointLC = intersectPoint2D;
		this.guidePoint.deleteObjects(magoManager);
		this.guidePoint.addPoint(new Point3D(this.pivotPointLC.x, this.pivotPointLC.y, 2.2));

		var translationVector = new Point2D(intersectPoint2D.x, intersectPoint2D.y);
		translationVector.inverse();

		this.auxOffsetVector = translationVector;
	}
};

/**
 * Renders the factory.
 */
BasicVehicle.prototype.render = function(magoManager, shader, renderType, glPrimitive)
{
	if (this.attributes && this.attributes.isVisible !== undefined && this.attributes.isVisible === false) 
	{
		return;
	}

	if (this.dirty)
	{ this.makeMesh(); this.arrowDirectionChanged(magoManager); }
	
	if (this.objectsArray === undefined)
	{ return false; }

	// Set geoLocation uniforms.***
	var gl = magoManager.getGl();
	var buildingGeoLocation = this.geoLocDataManager.getCurrentGeoLocationData();
	buildingGeoLocation.bindGeoLocationUniforms(gl, shader); // rotMatrix, positionHIGH, positionLOW.
	
	var isUpdate = false;

	if (this.eventStatus.changingFrontArrow) 
	{
		var factor = this.changingFrontArrowSpeed;//(currTime - this.changingFrontArrowStartTime) /5000;
		if (this.changingFrontArrowType > 0) { factor = -factor; }
		this.frontAngleDeg = this.frontAngleDeg + factor;

		this.frontAngleDeg = BasicVehicle.degreeValidator(this.frontAngleDeg);
		isUpdate = true;
	}

	if (this.eventStatus.changingRearArrow) 
	{
		var factor = this.changingRearArrowSpeed;
		if (this.changingRearArrowType > 0) { factor = -factor; }
		this.rearAngleDeg = this.rearAngleDeg + factor;

		this.rearAngleDeg = BasicVehicle.degreeValidator(this.rearAngleDeg);
		isUpdate = true;
	}

	if (isUpdate) { this.arrowDirectionChanged(magoManager); }

	this.move(magoManager);

	gl.uniform1i(shader.refMatrixType_loc, 0); // in magoManager case, there are not referencesMatrix.***
	var isSelected = false;
	
	if (renderType === 0)
	{
		// Depth render.***
	}
	else if (renderType === 1)
	{
		// Color render.***
		// Color render.***
		var selectionManager = magoManager.selectionManager;
		if (selectionManager.isObjectSelected(this))
		{ isSelected = true; }
	
		//gl.blendFunc( gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA );
		gl.enable(gl.BLEND);
		gl.uniform1i(shader.bApplySsao_loc, true); // apply ssao.***
		gl.uniform1i(shader.colorType_loc, 0); // 0= oneColor, 1= attribColor, 2= texture.***

		
	}
	else if (renderType === 2)
	{
		// Selection render.***
		var selectionColor = magoManager.selectionColor;
		var colorAux = magoManager.selectionColor.getAvailableColor(undefined);
		var idxKey = magoManager.selectionColor.decodeColor3(colorAux.r, colorAux.g, colorAux.b);
		magoManager.selectionManager.setCandidateGeneral(idxKey, this);
		
		gl.uniform4fv(shader.oneColor4_loc, [colorAux.r/255.0, colorAux.g/255.0, colorAux.b/255.0, 1.0]);
		gl.disable(gl.BLEND);
	}
	
	
	if (isSelected)
	{
		if (this.selColor4 === undefined)
		{
			this.selColor4 = new Color();
			this.selColor4.setRGBA(0.8, 0.4, 0.5, 1.0);
		}
		gl.uniform4fv(shader.oneColor4_loc, [this.selColor4.r, this.selColor4.g, this.selColor4.b, 1.0]); 
	}

	//gl.uniform1i(shader.refMatrixType_loc, 0); // in magoManager case, there are not referencesMatrix.***
	//buildingGeoLocation.bindGeoLocationUniforms(gl, shader); // rotMatrix, positionHIGH, positionLOW.
	shader.disableVertexAttribArrayAll();
	shader.enableVertexAttribArray(shader.position3_loc);
	this.guidePoint.renderAsChild(magoManager, shader, renderType, glPrimitive);

	shader.enableVertexAttribArray(shader.normal3_loc);

	var objectsCount = this.objectsArray.length;
	for (var i=0; i<objectsCount; i++)
	{
		var object = this.objectsArray[i];
		if (object instanceof Arrow) 
		{
			object.renderAsChild(magoManager, shader, renderType, glPrimitive, isSelected);
		}
		else 
		{
			object.render(magoManager, shader, renderType, glPrimitive, isSelected);
		}
	}

	
	
	
	gl.disable(gl.BLEND);
};

BasicVehicle.degreeValidator = function(deg)
{
	//if (deg > 360) { deg -= 360; }
	//if (deg < -360) { deg += 360; }

	return deg;
};