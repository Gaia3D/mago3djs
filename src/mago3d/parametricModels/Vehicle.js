'use strict';

var Vehicle = function(width, length, height, options) 
{
	MagoRenderable.call(this);

	if (!(this instanceof Vehicle)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	this.PARALLEL_ROTATION_ANGLE = 90;
	this.frame;
	this.frontArrow;
	this.rearArrow;
    
	this.frontArrowPos;
	this.rearArrowPos;
    
	this.width = width;
	this.length = length;
	this.height = height;

	/**
	 * distance between wheel axis
	 * @type {number}
	 */
	this.wheelbase = length * 0.8;
    
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

	this.mode = BasicVehicle.MODE.NORMAL;
	this.accelStatus = BasicVehicle.ACCEL_STATUS.FORWARD;

	//this.changingFrontArrow = false;
	this.changingFrontArrowType = 0;
	this.changingFrontArrowSpeed = 0.1;

	//this.changingRearArrow = false;
	this.changingRearArrowType = 0;
	this.changingRearArrowSpeed = 0.1;

	//move
	/**
	 * unit m/s, EXAMPLE. 1.388889M/S IS 5KM/H 
	 * @type {number}
	 */
	this.maxSpeed = 12;
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

	this.parallelRotationDist = 10;
    
	this.frame;

	this.carriedObjectsArray = [];

	this.shimmyMatDimension = new Point2D(this.width * 0.7, this.wheelbase);
	this.shimmyMat = new Point2D(2, 12);

	var maxPointCount = 50;

	this.trajectoryLength = this.length * 2;
	this.frontTrajectoryPointList = new Point3DList();
	this.rearTrajectoryPointList = new Point3DList();

	while (this.frontTrajectoryPointList.getPointsCount() !== maxPointCount) 
	{
		this.frontTrajectoryPointList.newPoint();
	}
	while (this.rearTrajectoryPointList.getPointsCount() !== maxPointCount) 
	{
		this.rearTrajectoryPointList.newPoint();
	}

	this.objectsArray.push(this.frontTrajectoryPointList);
	this.objectsArray.push(this.rearTrajectoryPointList);
};

Vehicle.prototype = Object.create(MagoRenderable.prototype);
Vehicle.prototype.constructor = Vehicle;


/**
 * @param {Object} object this must have geoLocationDatamanager. 
 */
Vehicle.prototype.addToContainer = function(object, magoManager) 
{

	this.carriedObjectsArray.push(object);
	this.updateContainer(magoManager);
};

/**
 * @param {Object} object this must have geoLocationDatamanager. 
 */
Vehicle.prototype.updateContainer = function(magoManager) 
{
	var vehicleGeoLocation = this.geoLocDataManager.getCurrentGeoLocationData();
	var vehicleGeoCoord = vehicleGeoLocation.getGeographicCoords();
	//ManagerUtils.calculateGeoLocationData = function(longitude, latitude, altitude, heading, pitch, roll, resultGeoLocationData) 
	for (var i=0, len=this.carriedObjectsArray.length;i<len;i++) 
	{
		var object = this.carriedObjectsArray[i];
		if (object instanceof Node) 
		{
			object.data.mapping_type = 'boundingboxcenter';
			var objectGeoLocation = object.data.geoLocDataManager.getCurrentGeoLocationData();
			
			var heading = vehicleGeoLocation.heading;// + objectGeoLocation.heading;

			var height = object.data.bbox.getZLength()/2;


			object.changeLocationAndRotation(vehicleGeoCoord.latitude, vehicleGeoCoord.longitude, vehicleGeoCoord.altitude + this.height + height, heading, undefined, undefined, magoManager);
		}
	}
	
};

Vehicle.prototype.render = function(magoManager, shader, renderType, glPrimitive) 
{
	if (this.attributes && this.attributes.isVisible !== undefined && this.attributes.isVisible === false) 
	{
		return;
	}

	if (this.dirty)
	{ this.makeMesh(); this.arrowDirectionChanged(magoManager); }//20191114
	
	if (this.objectsArray === undefined)
	{ return false; }

	// Set geoLocation uniforms.***
	var gl = magoManager.getGl();
	var buildingGeoLocation = this.geoLocDataManager.getCurrentGeoLocationData();
	buildingGeoLocation.bindGeoLocationUniforms(gl, shader); // rotMatrix, positionHIGH, positionLOW.
	gl.uniform4fv(shader.oneColor4_loc, [0, 1, 0, 1.0]); 
	//20191114
	//방향 변경
	this.changeArrow(magoManager);

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
		if (this.color4) 
		{
			gl.uniform4fv(shader.oneColor4_loc, [this.color4.r, this.color4.g, this.color4.b, 1.0]);
		}		
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
	//shader.disableVertexAttribArrayAll();
	shader.enableVertexAttribArray(shader.position3_loc);
	this.guidePoint.renderAsChild(magoManager, shader, renderType, glPrimitive);

	shader.enableVertexAttribArray(shader.normal3_loc);

	var objectsCount = this.objectsArray.length;
	for (var i=0; i<objectsCount; i++)
	{
		var object = this.objectsArray[i];
		object.renderAsChild(magoManager, shader, renderType, glPrimitive, isSelected);
		/*if (object instanceof Arrow || object instanceof ShimmyGearAssembly) 
		{
			object.renderAsChild(magoManager, shader, renderType, glPrimitive, isSelected);
		}
		else 
		{
			object.render(magoManager, shader, renderType, glPrimitive, isSelected);
		}*/
	}
	
	gl.disable(gl.BLEND);
};
Vehicle.prototype.renderAsChild = function(magoManager, shader, renderType, glPrimitive) 
{

};
Vehicle.prototype.makeMesh = function() 
{
	if (this.objectsArray === undefined)
	{ this.objectsArray = []; }

	//width, length, height
	//caculate frame dimension
	var frameWidth = this.width;
	var frameLength = this.length;
	var frameHeight = this.height * 0.15;

	var frame = new Box(frameWidth, frameLength, frameHeight, 'frame');
	frame.setOneColor(196/255, 117/255, 0.0, 1);
    
	var frameTranslatePoint3D = new Point3D(0.0, 0.0, this.height - frameHeight);
	frame.tMatOriginal = new Matrix4();
	frame.tMatOriginal.setTranslation(frameTranslatePoint3D.x, frameTranslatePoint3D.y, frameTranslatePoint3D.z);

	this.objectsArray.push(frame);
	this.frame = frame;

	var totalLength = 2;
	var bodyWidth = totalLength * 0.1;
	var headWidth = totalLength * 0.2;
	var tailLength = totalLength * 0.2;
	var extrude = totalLength * 0.05;
    
	var frontArrow = new Arrow(0.2, 10, 0.1, {
		totalLength : totalLength,
		bodyWidth   : bodyWidth,
		headWidth   : headWidth,
		tailLength  : tailLength,
		extrude     : extrude
	});

	var rearArrow = new Arrow(0.2, 10, 0.1, {
		totalLength : totalLength,
		bodyWidth   : bodyWidth,
		headWidth   : headWidth,
		tailLength  : tailLength,
		extrude     : extrude
	});

	this.objectsArray.push(frontArrow);
	this.frontArrow = frontArrow;
	this.frontArrow.setOneColor(0.9, 0.1, 0.1, 1);
	this.frontArrowPos = new Point3D(0.0, this.wheelbase * 0.5, this.height);
	frontArrow.tMatOriginal = new Matrix4();
	frontArrow.tMatOriginal.setTranslation(this.frontArrowPos.x, this.frontArrowPos.y, this.frontArrowPos.z);
	
	this.objectsArray.push(rearArrow);
	this.rearArrow = rearArrow;
    
	this.rearArrowPos = new Point3D(0.0, -this.wheelbase * 0.5, this.height);
	rearArrow.tMatOriginal = new Matrix4();
	rearArrow.tMatOriginal.setTranslation(this.rearArrowPos.x, this.rearArrowPos.y, this.rearArrowPos.z);
    
	var shimmyWidth = this.width * 0.25;
	var shimmyLength = 0.5;
	var shimmyHeight = this.height - frameHeight;
 
	var ShimmyGearAssemblyPrimitive = this.getShimmyGearAssembly();
	this.shimmyGearAssembly = new ShimmyGearAssemblyPrimitive(shimmyWidth, shimmyLength, shimmyHeight);
	this.shimmyGearAssembly.setOneColor(196/255, 117/255, 0.0, 1);
	//this.objectsArray.push(this.shimmyGearAssembly);


	this.shimmyGearAssembly.tMatOriginal = new Matrix4();
	this.shimmyGearAssembly.tMatOriginal.setTranslation(0, 0, shimmyHeight);
	this.shimmyGearAssembly.makeMesh();

	// shimmy matrix.
	var numCols = this.shimmyMat.x;
	var numRows = this.shimmyMat.y;

	var refRow = numRows/2;
	var colDist = this.shimmyMatDimension.x / (numCols-1);
	var rowDist = this.shimmyMatDimension.y / (numRows-1);

	for (var c=0;c<numCols;c++) 
	{
		for (var r=0;r<numRows;r++)
		{
			var auxShimmy = new ShimmyGearAssemblyPrimitive(shimmyWidth, shimmyLength, shimmyHeight);
			auxShimmy.frame = this.shimmyGearAssembly.frame;
			auxShimmy.rightWheel = this.shimmyGearAssembly.rightWheel;
			auxShimmy.leftWheel = this.shimmyGearAssembly.leftWheel;
			auxShimmy.color4 = this.shimmyGearAssembly.color4;
			auxShimmy.makeMesh();

			var x = colDist * c;
			var y = rowDist * r;

			var orginShimmyPos = new Point3D(x - this.shimmyMatDimension.x * 0.5, y - this.shimmyMatDimension.y * 0.5, shimmyHeight);
			auxShimmy.tMatOriginal = new Matrix4();
			auxShimmy.tMatOriginal.setTranslation(orginShimmyPos.x, orginShimmyPos.y, orginShimmyPos.z);
			auxShimmy.orginShimmyPos = orginShimmyPos;
			this.objectsArray.push(auxShimmy);
		}
	}

	this.updateMatrix();
	this.setDirty(false);
};

Vehicle.prototype.doChangeFrontAngleDeg = function(type) 
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

Vehicle.prototype.stopChangeFrontAngleDeg = function() 
{
	this.eventStatus.changingFrontArrow = false;
};

Vehicle.prototype.doChangeRearAngleDeg = function(type) 
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
Vehicle.prototype.stopChangeRearAngleDeg = function() 
{
	this.eventStatus.changingRearArrow = false;
};
Vehicle.prototype._updateLastTime = function(currentTime) 
{
	this.lastTime = currentTime;
};
Vehicle.prototype.moveParallelTranslate = function(deltaTime, magoManager)
{
	var geoLocManager = this.geoLocDataManager;
	//IF YOU WANT TRACKING OR DRIVING THE VEHICLE, USE NEWGEOLOCATIONDATA. ELSE USE GETCURRENTGEOLOCATIONDATA
	var geoLocData = geoLocManager.newGeoLocationData();
	var geoCoord = geoLocData.geographicCoord;

	var direction = this.frontDirection2D;//this.getFrontDirection2D(new Point2D());
	if (this.accelStatus === BasicVehicle.ACCEL_STATUS.REVERSE) 
	{
		direction = new Point2D();
		direction.copyFrom(this.frontDirection2D);
		direction.inverse();
	}
		
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
};
Vehicle.prototype.moveCircularRotation = function(deltaTime, magoManager) 
{
	if (!this.pivotPointLC) { return; }
    
	var geoLocManager = this.geoLocDataManager;
	//IF YOU WANT TRACKING OR DRIVING THE VEHICLE, USE NEWGEOLOCATIONDATA. ELSE USE GETCURRENTGEOLOCATIONDATA
	var geoLocData = geoLocManager.newGeoLocationData();
	var geoCoord = geoLocData.geographicCoord;
	// do rotate
	var radiusErr = 10E-4;
	var frontArrowPos = this.frontArrowPos;
	var rearArrowPos = this.rearArrowPos;
	var frontLine2D = this.frontLine2D;
	var rearLine2D = this.rearLine2D;
	var frontDirection2D = this.frontDirection2D;
	var rearDirection2D = this.rearDirection2D;
    
	if (!this.auxOffsetVector) 
	{
		this.auxOffsetVector = new Point3D(0, 0, 0);
	}

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
	
	if (this.accelStatus === BasicVehicle.ACCEL_STATUS.REVERSE) 
	{
		frontRad *= -1;
	}
	/*if (Math.abs(frontRad) > 0.0001) 
	{
		if (frontRad > 0) 
		{
			frontRad = 0.0001;
		}
		else 
		{
			frontRad = -0.0001;
		}
	}*/

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
	//geoLocData.heading = Vehicle.degreeValidator(heading);
	//geoLocData = ManagerUtils.calculateGeoLocationDataByAbsolutePoint(posWCLOW[0] + posWCHIGH[0], posWCLOW[1] + posWCHIGH[1], posWCLOW[2] + posWCHIGH[2], geoLocData, magoManager);

	var auxPoint3DWC = new Point3D(posWCLOW[0] + posWCHIGH[0], posWCLOW[1] + posWCHIGH[1], posWCLOW[2] + posWCHIGH[2]);
	var auxGeoCoord = ManagerUtils.pointToGeographicCoord(auxPoint3DWC);
	
	auxGeoCoord.altitude = 0;
	geoLocData = ManagerUtils.calculateGeoLocationData(auxGeoCoord.longitude, auxGeoCoord.latitude, auxGeoCoord.altitude, BasicVehicle.degreeValidator(heading), geoLocData.pitch, geoLocData.roll, geoLocData, magoManager);

	//헤딩이 변할 시 화살표 업데이트 해줘야함.
	this.update(magoManager);
};
Vehicle.prototype.changeParallelRotationDist = function(mode) 
{
	if (mode === 0 ) 
	{
		this.parallelRotationDist -= 0.1;
	}
	else 
	{
		this.parallelRotationDist += 0.1;
	}
};
Vehicle.prototype.moveNormal = function(deltaTime, magoManager)
{
	if (this.isParallelDirection) 
	{
		this.moveParallelTranslate(deltaTime, magoManager);
	}
	else 
	{
		this.moveCircularRotation(deltaTime, magoManager);
	}
};
Vehicle.prototype.moveParallelRotation = function(deltaTime, magoManager) 
{
	var geoLocManager = this.geoLocDataManager;
	//IF YOU WANT TRACKING OR DRIVING THE VEHICLE, USE NEWGEOLOCATIONDATA. ELSE USE GETCURRENTGEOLOCATIONDATA
	var geoLocData = geoLocManager.newGeoLocationData();
	var geoCoord = geoLocData.geographicCoord;
	// do rotate
	var radiusErr = 10E-4;
	var frontArrowPos = this.frontArrowPos;
	var rearArrowPos = this.rearArrowPos;
	var frontDirection2D = this.frontDirection2D;
	var rearDirection2D = this.rearDirection2D;

	var frontArrowSegment = new Segment2D(new Point2D(frontArrowPos.x, frontArrowPos.y), new Point2D(frontArrowPos.x + frontDirection2D.x, frontArrowPos.y + frontDirection2D.y));
	var rearArrowSegment = new Segment2D(new Point2D(rearArrowPos.x, rearArrowPos.y),  new Point2D(rearArrowPos.x + rearDirection2D.x, rearArrowPos.y + rearDirection2D.y));

	this.frontLine2D = frontArrowSegment.getLine(); 
	this.rearLine2D = rearArrowSegment.getLine();

	var frontLine2D = this.frontLine2D;
	var rearLine2D = this.rearLine2D;
	

	if (!this.pivotPointLC) { this.pivotPointLC = new Point3D(); }
	this.setPivotPointLC(0, this.parallelRotationDist, 0, magoManager);

	this.guidePoint.deleteObjects(magoManager);
	this.guidePoint.addPoint(new Point3D(this.pivotPointLC.x, this.pivotPointLC.y, 2.2));

	var translationVector = new Point2D(this.pivotPointLC.x, this.pivotPointLC.y);
	translationVector.inverse();

	this.auxOffsetVector = translationVector;

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

	if (this.accelStatus === BasicVehicle.ACCEL_STATUS.REVERSE) 
	{
		frontRad *= -1;
	}
	
	var frontAuxMatrix = new Matrix4();
	frontAuxMatrix.rotationAxisAngRad(frontRad, 0, 0, 1);
	var frontPosRotated = frontAuxMatrix.rotatePoint3D(frontPosTranslated);
	var frontPosTransformed = new Point3D(frontPosRotated.x, frontPosRotated.y, frontPosRotated.z);
	frontPosTransformed.add(-this.auxOffsetVector.x, -this.auxOffsetVector.y, 0);

	//rear
	var rearDist = this.parallelRotationDist + this.wheelbase * 0.5;
	var frontDist = this.parallelRotationDist - this.wheelbase * 0.5;
	var rearSpeed = (frontSpeed * rearDist) / frontDist;

	var rearPosTranslated = new Point3D(rearArrowPos.x, rearArrowPos.y, 0);
	rearPosTranslated.add(this.auxOffsetVector.x, this.auxOffsetVector.y, 0);
	var rearRadius = this.pivotPointLC.distToPoint(rearArrowPos);
	


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
	//geoLocData.heading = Vehicle.degreeValidator(heading);
	//geoLocData = ManagerUtils.calculateGeoLocationDataByAbsolutePoint(posWCLOW[0] + posWCHIGH[0], posWCLOW[1] + posWCHIGH[1], posWCLOW[2] + posWCHIGH[2], geoLocData, magoManager);

	var auxPoint3DWC = new Point3D(posWCLOW[0] + posWCHIGH[0], posWCLOW[1] + posWCHIGH[1], posWCLOW[2] + posWCHIGH[2]);
	var auxGeoCoord = ManagerUtils.pointToGeographicCoord(auxPoint3DWC);
	
	auxGeoCoord.altitude = 0;
	geoLocData = ManagerUtils.calculateGeoLocationData(auxGeoCoord.longitude, auxGeoCoord.latitude, auxGeoCoord.altitude, BasicVehicle.degreeValidator(heading), geoLocData.pitch, geoLocData.roll, geoLocData, magoManager);

	//헤딩이 변할 시 화살표 업데이트 해줘야함.
	this.update(magoManager);
};
Vehicle.prototype.move = function(magoManager) 
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

	
	
	//this.frontDirection2D = this.getFrontDirection2D(new Point2D());
	//this.rearDirection2D = this.getRearDirection2D(new Point2D());


	var mode = this.mode;
	switch (mode) 
	{
	//NORMAL
	case BasicVehicle.MODE.NORMAL : {
		this.moveNormal(deltaTime, magoManager);
		break;
	}
	case BasicVehicle.MODE.CIRCULAR_ROTATION : {
		this.moveCircularRotation(deltaTime, magoManager);
		break;
	}
	case BasicVehicle.MODE.PARALLEL_TRANSLATE : {
		this.moveParallelTranslate(deltaTime, magoManager);
		break;
	}
	case BasicVehicle.MODE.PARALLEL_ROTATION : {
		this.moveParallelRotation(deltaTime, magoManager);
		break;
	}
	}

	var geoLocManager = this.geoLocDataManager;
	var geoLocData = geoLocManager.getCurrentGeoLocationData();

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

	this.updateContainer(magoManager);
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
Vehicle.prototype.getFrameDirection2D = function(resultPoint2D)
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
Vehicle.prototype.getFrontDirection2D = function(resultPoint2D)
{
	if (!resultPoint2D) { resultPoint2D = new Point2D(); }
	var frontAngleRad = this.frontAngleDeg * Math.PI / 180;
	resultPoint2D.set(-Math.sin(frontAngleRad), Math.cos(frontAngleRad));
	return resultPoint2D;
};
/**
 * @return {Point2D}
 */
Vehicle.prototype.getRearDirection2D = function(resultPoint2D) 
{
	if (!resultPoint2D) { resultPoint2D = new Point2D(); }
	var rearAngleRad = this.rearAngleDeg * Math.PI / 180;
	resultPoint2D.set(-Math.sin(rearAngleRad), Math.cos(rearAngleRad));
	return resultPoint2D;
};
Vehicle.prototype.footOnAccel = function() 
{
	this.eventStatus.footOnAccel = true;
	this.accelStatus = BasicVehicle.ACCEL_STATUS.FORWARD;
};
Vehicle.prototype.footOnReverseAccel = function() 
{
	this.eventStatus.footOnAccel = true;
	this.accelStatus = BasicVehicle.ACCEL_STATUS.REVERSE;
};
Vehicle.prototype.footOffAccel = function() 
{
	this.eventStatus.footOnAccel = false;
};
Vehicle.prototype.arrowDirectionChanged = function(magoManager) 
{
	//front arrow
	this.update(magoManager);
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

		if (!intersectPoint2D) { return; }
		
		this.setPivotPointLC(intersectPoint2D.x, intersectPoint2D.y, 0, magoManager);
		this.guidePoint.deleteObjects(magoManager);
		this.guidePoint.addPoint(new Point3D(this.pivotPointLC.x, this.pivotPointLC.y, 2.2));

		var translationVector = new Point2D(intersectPoint2D.x, intersectPoint2D.y);
		translationVector.inverse();

		this.auxOffsetVector = translationVector;
	}
	else 
	{
		this.linearTrajectory();
		this.frontTrajectoryPointList.deleteVboKeysContainer(magoManager);
		this.rearTrajectoryPointList.deleteVboKeysContainer(magoManager);
	}
};
Vehicle.prototype.changeArrow = function(magoManager) 
{
	var isUpdate = false;
	var mode = this.mode;
	switch (mode) 
	{
	//NORMAL
	case BasicVehicle.MODE.NORMAL : {
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
		break;
	}
	case BasicVehicle.MODE.CIRCULAR_ROTATION : 
	case BasicVehicle.MODE.PARALLEL_TRANSLATE : {
		if (this.eventStatus.changingFrontArrow || this.eventStatus.changingRearArrow) 
		{
			var factor = this.changingFrontArrowSpeed;

			var arrowType = 0;
			if (this.eventStatus.changingFrontArrow) 
			{
				arrowType = this.changingFrontArrowType;
			}
			else 
			{ /*if(this.eventStatus.changingRearArrow){*/
				arrowType = this.changingRearArrowType;
			}

			if (arrowType > 0) { factor = -factor; }
			this.frontAngleDeg = this.frontAngleDeg + factor;
			this.rearAngleDeg = (mode === BasicVehicle.MODE.CIRCULAR_ROTATION) ? -this.frontAngleDeg : this.frontAngleDeg; 

			isUpdate = true;
		} 

		break;
	}
	case BasicVehicle.MODE.PARALLEL_ROTATION : {
		this.frontAngleDeg = this.PARALLEL_ROTATION_ANGLE;
		this.rearAngleDeg = this.PARALLEL_ROTATION_ANGLE;

		isUpdate = true;
		break;
	}
	}
	if (isUpdate) { this.arrowDirectionChanged(magoManager); }
};
Vehicle.prototype.update = function(magoManager) 
{
	//front arrow
	var frontArrow = this.frontArrow;

	var frontTranslateAuxMat = new Matrix4();
	frontTranslateAuxMat.setTranslation(this.frontArrowPos.x, this.frontArrowPos.y, this.frontArrowPos.z);
	var frontRotAuxMat = new Matrix4();
	frontRotAuxMat.rotationAxisAngDeg(this.frontAngleDeg, 0, 0, 1);

	this.frontDirection2D = this.getFrontDirection2D();
	var frontTAuxMat = frontRotAuxMat.getMultipliedByMatrix(frontTranslateAuxMat);
	frontArrow.tMatOriginal = frontTAuxMat;
	//rear arrow
	var rearArrow = this.rearArrow;
	var rearTranslateAuxMat = new Matrix4();
	rearTranslateAuxMat.setTranslation(this.rearArrowPos.x, this.rearArrowPos.y, this.rearArrowPos.z);
	var rearRotAuxMat = new Matrix4();
	rearRotAuxMat.rotationAxisAngDeg(this.rearAngleDeg, 0, 0, 1);

	this.rearDirection2D = this.getRearDirection2D();
	var rearTAuxMat = rearRotAuxMat.getMultipliedByMatrix(rearTranslateAuxMat);
	rearArrow.tMatOriginal = rearTAuxMat;

	var pivotPointLc = this.pivotPointLC;
	if (!pivotPointLc || pivotPointLc.x === Infinity) 
	{ 
		for (var i=0, len=this.objectsArray.length; i<len;i++)
		{
			var object = this.objectsArray[i];
			if (object instanceof Box || object instanceof Arrow || object instanceof Point3DList) { continue; }
			
			
			var pos = object.orginShimmyPos;

			var shimmyTranslateAuxMat = new Matrix4();
			shimmyTranslateAuxMat.setTranslation(pos.x, pos.y, pos.z);
			var shimmyRotAuxMat = new Matrix4();

			shimmyRotAuxMat.rotationAxisAngDeg(this.frontAngleDeg, 0, 0, 1);

			var tAuxMat = shimmyRotAuxMat.getMultipliedByMatrix(shimmyTranslateAuxMat);
			object.tMatOriginal = tAuxMat;
		}
	}
	else 
	{
		var pivotPoint2D = new Point2D(pivotPointLc.x, pivotPointLc.y);
		var auxDirction =  new Point2D(0, 1);
		for (var i=0, len=this.objectsArray.length; i<len;i++)
		{
			var object = this.objectsArray[i];
			if (object instanceof Box || object instanceof Arrow || object instanceof Point3DList) { continue; }
			
			
			var pos = object.orginShimmyPos;

			var shimmyTranslateAuxMat = new Matrix4();
			shimmyTranslateAuxMat.setTranslation(pos.x, pos.y, pos.z);
			var shimmyRotAuxMat = new Matrix4();

			var direction = pivotPoint2D.getVectorToPoint(new Point2D(pos.x, pos.y));
			direction.unitary();
			var auxAngleDeg = auxDirction.angleDegToVector(direction);

			var angleDeg = 90 - auxAngleDeg;
			if (direction.x < 0) { angleDeg *= -1; }

			shimmyRotAuxMat.rotationAxisAngDeg(angleDeg, 0, 0, 1);

			var tAuxMat = shimmyRotAuxMat.getMultipliedByMatrix(shimmyTranslateAuxMat);
			object.tMatOriginal = tAuxMat;
		}
	}

	this.updateMatrix();
};

Vehicle.prototype.getShimmyGearAssembly = function() 
{
	var ShimmyGearAssembly = function(width, length, height, options) 
	{
		MagoRenderable.call(this);
		this.width = width;
		this.height = height;
		this.wheelRadius = this.height * 0.4;
		this.frameLength = length * 0.4;
		this.frameHeight = this.height - this.wheelRadius*0.5;

		this.frame;
	};
	ShimmyGearAssembly.prototype = Object.create(MagoRenderable.prototype);
	ShimmyGearAssembly.prototype.constructor = ShimmyGearAssembly;

	ShimmyGearAssembly.prototype.makeMesh = function() 
	{
		if (this.objectsArray === undefined)
		{ this.objectsArray = []; }

		if (this.objectsMap === undefined)
		{ this.objectsMap = {}; }

		//frame
		var profile2dAux = new Profile2D();
	
		// Outer ring.**
		var outerRing = profile2dAux.newOuterRing();
		var frameHalfLength = this.frameLength * 0.5;
		var frameWidth = this.width * 0.25;

		var polyline = outerRing.newElement("POLYLINE");
		polyline.newPoint2d(frameHalfLength, 0);
		polyline.newPoint2d(-frameHalfLength, 0);
		polyline.newPoint2d(-frameHalfLength, -this.frameHeight);
		polyline.newPoint2d(frameHalfLength, -this.frameHeight);
		polyline.newPoint2d(frameHalfLength * 2.5, -this.frameHeight * 0.5);

		var extrusionDist = frameWidth;
		var extrudeSegmentsCount = 1;
		var extrusionVector = undefined;
		var bIncludeBottomCap = true;
		var bIncludeTopCap = true;
		
		var mesh = Modeler.getExtrudedMesh(profile2dAux, extrusionDist, extrudeSegmentsCount, extrusionVector, bIncludeBottomCap, bIncludeTopCap, undefined);
		mesh.name = 'frame';
		mesh.rotate(90, 1, 0, 0);
		mesh.rotate(90, 0, 0, 1);
		mesh.translate(-extrusionDist * 0.5, 0, 0);

		this.objectsArray.push(mesh);
		this.objectsMap[mesh.name] = mesh;

		var exteriorRadius = this.wheelRadius;
		var interiorRadius = exteriorRadius * 0.5;
		var wheelWidth = this.width * 0.5 - frameWidth*0.5;
        
		var leftWheel = new Wheel(interiorRadius, exteriorRadius, wheelWidth, {borderRadius: wheelWidth * 0.2});
		var rightWheel = new Wheel(interiorRadius, exteriorRadius, wheelWidth, {borderRadius: wheelWidth * 0.2});
		leftWheel.setOneColor(0.1, 0.1, 0.15, 1);
		rightWheel.setOneColor(0.1, 0.1, 0.15, 1);
		this.objectsArray.push(leftWheel);
		this.objectsArray.push(rightWheel);

		var leftWheelTranslation = new Point3D(-frameWidth*0.5-wheelWidth*0.5, 0, -this.height + exteriorRadius);
		var rightWheelTranslation = new Point3D(frameWidth*0.5+wheelWidth*0.5, 0, -this.height + exteriorRadius);

		leftWheel.tMatOriginal = new Matrix4();
		leftWheel.tMatOriginal.setTranslation(leftWheelTranslation.x, leftWheelTranslation.y, leftWheelTranslation.z);

		rightWheel.tMatOriginal = new Matrix4();
	    rightWheel.tMatOriginal.setTranslation(rightWheelTranslation.x, rightWheelTranslation.y, rightWheelTranslation.z);

		this.dirty = false;
	};
	ShimmyGearAssembly.prototype.renderAsChild = function(magoManager, shader, renderType, glPrimitive) 
	{
		if (this.attributes && this.attributes.isVisible !== undefined && this.attributes.isVisible === false) 
		{
			return;
		}

		if (this.dirty)
		{ this.makeMesh(); }
		
		if (this.objectsArray === undefined)
		{ return false; }


		
		// Set geoLocation uniforms.***
		var gl = magoManager.getGl();
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
			if (this.color4) 
			{
				gl.uniform4fv(shader.oneColor4_loc, [this.color4.r, this.color4.g, this.color4.b, 1.0]);
			}
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
		//shader.disableVertexAttribArrayAll();
		//shader.enableVertexAttribArray(shader.position3_loc);
		//shader.enableVertexAttribArray(shader.normal3_loc);
		if (this.tMat) 
		{
			gl.uniformMatrix4fv(shader.buildingRotMatrix_loc, false, this.tMat._floatArrays);
		}
		
		var objectsCount = this.objectsArray.length;

		for (var i=0; i<objectsCount; i++)
		{
			var object = this.objectsArray[i];
			object.renderAsChild(magoManager, shader, renderType, glPrimitive, isSelected);
		}
		
		gl.disable(gl.BLEND);
	};
    
	return ShimmyGearAssembly;
};



Vehicle.prototype.setPivotPointLC = function(x, y, z, magoManager) 
{
	if (!this.pivotPointLC) { this.pivotPointLC = new Point3D(); }
	this.pivotPointLC.set(x, y, z);

	//calculate trajectory points
	var mode = this.mode;	
	
	switch (mode) 
	{
	//NORMAL
	case BasicVehicle.MODE.NORMAL : {
		if (this.isParallelDirection) 
		{
			//
			this.linearTrajectory();
		}
		else 
		{
			//
			this.circleTrajectory();
		}
		break;
	}
	case BasicVehicle.MODE.PARALLEL_TRANSLATE : {
		this.linearTrajectory();
		break;
	}
	case BasicVehicle.MODE.CIRCULAR_ROTATION : 
	case BasicVehicle.MODE.PARALLEL_ROTATION : {
		this.circleTrajectory();
		break;
	}
	}

	this.frontTrajectoryPointList.deleteVboKeysContainer(magoManager);
	this.rearTrajectoryPointList.deleteVboKeysContainer(magoManager);
};


Vehicle.prototype.linearTrajectory = function() 
{
	var pointCount = this.frontTrajectoryPointList.getPointsCount();
	var increDist = this.trajectoryLength / pointCount;
	for (var i=0;i<pointCount;i++)
	{
		var frontTPoint = this.frontTrajectoryPointList.getPoint(i);
		var rearTPoint = this.rearTrajectoryPointList.getPoint(i);

		frontTPoint.set(this.frontDirection2D.x * increDist * (i+1), this.frontDirection2D.y * increDist * (i+1), this.height);
		rearTPoint.set(this.frontDirection2D.x * -increDist * (i+1), this.frontDirection2D.y * -increDist * (i+1), this.height);
	}
};

Vehicle.prototype.circleTrajectory = function() 
{
	if (!this.pivotPointLC) { return; }

	var pointCount = this.frontTrajectoryPointList.getPointsCount();
	var pivotPoint2DLC = new Point2D(-this.pivotPointLC.x, -this.pivotPointLC.y);
	var xAxis2D = new Point2D(1, 0);
	var startAngleRad =pivotPoint2DLC.angleRadToVector(xAxis2D);
	if (pivotPoint2DLC.y < 0) { startAngleRad*= -1; }

	var pivotPointLength = pivotPoint2DLC.getModul();
	var totalAngleRad = this.trajectoryLength / pivotPointLength;
	var icreAngleRad = totalAngleRad /  (pointCount-1);
		
	for (var i=0;i<pointCount;i++)
	{
		var frontTPoint = this.frontTrajectoryPointList.getPoint(i);
		var rearTPoint = this.rearTrajectoryPointList.getPoint(i);

		var frontCurrAngleRad = startAngleRad + (i * icreAngleRad);
		var rearCurrAngleRad = startAngleRad + (i * -icreAngleRad);
		frontTPoint.set(-pivotPoint2DLC.x + pivotPointLength * Math.cos(frontCurrAngleRad), -pivotPoint2DLC.y + pivotPointLength * Math.sin(frontCurrAngleRad), this.height);
		rearTPoint.set(-pivotPoint2DLC.x + pivotPointLength * Math.cos(rearCurrAngleRad), -pivotPoint2DLC.y + pivotPointLength * Math.sin(rearCurrAngleRad), this.height);
	}
};




