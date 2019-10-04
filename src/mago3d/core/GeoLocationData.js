'use strict';

/**
 * GeoLocationData is a class object that contains axis information about the location on "geographicCoord".
 * 
 * @class GeoLocationData
 * @constructor 
 * @param {string} geoLocationDataName The name of the geoLocationData.
 */
var GeoLocationData = function(geoLocationDataName) 
{
	if (!(this instanceof GeoLocationData)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	/**
	 * The name of this geographicLocationData.
	 * @type {String}
	 * @default "noName"
	 */
	this.name;
	
	if (geoLocationDataName === undefined) { this.name = "noName"; }
	else { this.name = geoLocationDataName; }
	
	/**
	 * The geographic location (Longitude, Latitude, Altitude). This is the main data of this class.
	 * @type {GeographicCoord}
	 * @default undefined
	 */
	this.geographicCoord; 
	
	/**
	 * The z-axis rotation.
	 * @type {Number}
	 * @default 0
	 */
	this.heading;
	
	/**
	 * The x-axis rotation.
	 * @type {Number}
	 * @default 0
	 */
	this.pitch;
	
	/**
	 * The y-axis rotation.
	 * @type {Number}
	 * @default 0
	 */
	this.roll;
	
	/**
	 * The date relationed with this geoLocationData.
	 * @type {Date}
	 * @default undefined
	 */
	this.date; // year - month - day - hour - min - seg - miliseg.
	
	/**
	 * The position in world coordinates (x, y, z) of this geoLocationData.
	 * @type {Point3D}
	 * @default (0,0,0).
	 */
	this.position;   
	
	/**
	 * The high part of the splitted position.
	 * @type {Float32Array(3)}
	 * @default [0,0,0]
	 */
	this.positionHIGH; 
	
	/**
	 * The low part of the splitted position.
	 * @type {Float32Array(3)}
	 * @default [0,0,0]
	 */
	this.positionLOW; 
	
	/**
	 * The effective absoluteCoord (x, y, z) of this geoLocationData.
	 * @type {Point3D}
	 * @default (0,0,0).
	 */
	this.pivotPoint; // Actual position = pivotPoint.
	
	/**
	 * The transformation matrix of the geographicCoord. This matrix no includes Heading, Pitch or Roll rotations.
	 * @type {Matrix4}
	 * @default Identity matrix.
	 */
	this.geoLocMatrix; 
	
	/**
	 * The inverse of the transformation matrix of the geographicCoord. This matrix no includes Heading, Pitch or Roll rotations.
	 * @type {Matrix4}
	 * @default Identity matrix.
	 */
	this.geoLocMatrixInv; 
	
	/**
	 * The transformation matrix of the geographicCoord. This matrix includes Heading, Pitch or Roll rotations.
	 * @type {Matrix4}
	 * @default Identity matrix.
	 */
	this.tMatrix;      
	
	/**
	 * The inverse of the transformation matrix of the geographicCoord. This matrix includes Heading, Pitch or Roll rotations.
	 * @type {Matrix4}
	 * @default Identity matrix.
	 */
	this.tMatrixInv;   
	
	/**
	 * The rotation matrix of the geographicCoord. This matrix includes Heading, Pitch or Roll rotations.
	 * @type {Matrix4}
	 * @default Identity matrix.
	 */
	this.rotMatrix;    
	
	/**
	 * The inverse of the rotation matrix of the geographicCoord. This matrix includes Heading, Pitch or Roll rotations.
	 * @type {Matrix4}
	 * @default Identity matrix.
	 */
	this.rotMatrixInv; 
	
	/**
	 * The translation in local coordinates(x, y, z) of this geoLocationData.
	 * @type {Point3D}
	 * @default undefined
	 */
	this.pivotPointTraslationLC; 
	
	/**
	 * The local rotation matrix. This matrix uses only Heading, Pitch or Roll rotations.
	 * @type {Matrix4}
	 * @default Identity matrix.
	 */
	this.rotMatrixLC; 
};

/**
 * Sets the parameters Heading, pitch and Roll.
 * @param {Number} heading The heading value in degrees.
 * @param {Number} pitch The pitch value in degrees.
 * @param {Number} roll The roll value in degrees.
 */
GeoLocationData.prototype.setRotationHeadingPitchRoll = function(heading, pitch, roll) 
{
	// Note: Sets the parameters if exist argument.
	if (heading !== undefined)
	{ this.heading = heading; }
	
	if (pitch !== undefined)
	{ this.pitch = pitch; }

	if (roll !== undefined)
	{ this.roll = roll; }
};

/**
 * Returns the geographic coordinates.
 * @Returns {GeographicCoord} this.geographicCoord
 */
GeoLocationData.prototype.getGeographicCoords = function() 
{
	return this.geographicCoord;
};

/**
 * Sets the parameters Longitude, Latitude and Altitude of the geographic coordinates.
 * @param {Number} longitude The longitude in degrees.
 * @param {Number} latitude The latitude in degrees.
 * @param {Number} altitude The altitude in meters.
 */
GeoLocationData.prototype.setGeographicCoordsLonLatAlt = function(longitude, latitude, altitude) 
{
	if (this.geographicCoord === undefined)
	{ this.geographicCoord = new GeographicCoord(); }
	
	this.geographicCoord.setLonLatAlt(longitude, latitude, altitude);
};

/**
 * Deletes all objects of this class.
 @param {VboMemoryManager} vboMemManager The manager and controller of the gpu memory.
 */
GeoLocationData.prototype.deleteObjects = function(vboMemManager) 
{
	this.name = undefined;
	if (this.geographicCoord)
	{ this.geographicCoord.deleteObjects(vboMemManager); }
	this.geographicCoord = undefined;
	
	this.heading = undefined;
	this.pitch = undefined;
	this.roll = undefined;
	
	this.date = undefined; 
	
	if (this.position)
	{ this.position.deleteObjects(); }  
	this.position = undefined;
	this.positionHIGH = undefined;
	this.positionLOW = undefined; 
	if (this.pivotPoint)
	{ this.pivotPoint.deleteObjects(); }  
	this.pivotPoint = undefined;
	
	// F4D Matrix4.*
	if (this.geoLocMatrix)
	{ this.geoLocMatrix.deleteObjects(); }
	if (this.geoLocMatrixInv)
	{ this.geoLocMatrixInv.deleteObjects(); }
	if (this.tMatrix)
	{ this.tMatrix.deleteObjects(); } 
	if (this.tMatrixInv)
	{ this.tMatrixInv.deleteObjects(); } 
	if (this.rotMatrix)
	{ this.rotMatrix.deleteObjects(); }  
	if (this.rotMatrixInv)
	{ this.rotMatrixInv.deleteObjects(); } 
	
	this.geoLocMatrix = undefined;
	this.geoLocMatrixInv = undefined; 
	this.tMatrix = undefined;     
	this.tMatrixInv = undefined;  
	this.rotMatrix = undefined;   
	this.rotMatrixInv = undefined; 
	
	// Aditional.
	if (this.pivotPointTraslationLC)
	{ this.pivotPointTraslationLC.deleteObjects(); }
	this.pivotPointTraslationLC = undefined;
};

/**
 * Adds the translation vector into position.
 */
GeoLocationData.prototype.doEffectivePivotPointTranslation = function() 
{
	// this function adds the "pivotPointTraslation" to the positions.
	// this function is not for move the building on the globe. This function is only for translate the pivot point of the building.
	// Note: the translation vector only must be added into "this.pivotPoint". TODO:
	if (this.pivotPointTraslationLC === undefined)
	{ return; }
	
	var traslationVector;
	traslationVector = this.tMatrix.rotatePoint3D(this.pivotPointTraslationLC, traslationVector );
	
	// Recalculate the position.
	var geoCoord = this.geographicCoord;
	this.position = ManagerUtils.geographicCoordToWorldPoint(geoCoord.longitude, geoCoord.latitude, geoCoord.altitude, this.position);

	// High and Low values of the position.**
	if (this.positionHIGH === undefined)
	{ this.positionHIGH = new Float32Array([0.0, 0.0, 0.0]); }
	if (this.positionLOW === undefined)
	{ this.positionLOW = new Float32Array([0.0, 0.0, 0.0]); }
	ManagerUtils.calculateSplited3fv([this.position.x, this.position.y, this.position.z], this.positionHIGH, this.positionLOW);
	
	this.position.x += traslationVector.x;
	this.position.y += traslationVector.y;
	this.position.z += traslationVector.z;

	this.positionLOW[0] += traslationVector.x;
	this.positionLOW[1] += traslationVector.y;
	this.positionLOW[2] += traslationVector.z;

	if (this.pivotPoint === undefined)
	{ this.pivotPoint = new Point3D(); }

	this.pivotPoint.set(this.position.x, this.position.y, this.position.z);
};


/**
 * Copies all data of this class into the return geoLoctationData.
 *@param {GeoLocationData} 
 */
GeoLocationData.prototype.copyFrom = function(geoLocData) 
{
	if (geoLocData === undefined)
	{ return; }
	
	this.name = geoLocData.name;
	if (geoLocData.geographicCoord)
	{
		if (this.geographicCoord === undefined)
		{ this.geographicCoord = new GeographicCoord(); }
		
		this.geographicCoord.copyFrom(geoLocData.geographicCoord); // longitude, latitude, altitude.
	}
	
	this.heading = geoLocData.heading;
	this.pitch = geoLocData.pitch;
	this.roll = geoLocData.roll;
	
	this.date = geoLocData.date; // year - month - day - hour - min - seg - miliseg.
	
	if (geoLocData.position)
	{
		if (this.position === undefined)
		{ this.position = new Point3D(); }
		this.position.copyFrom(geoLocData.position);
	}
	if (geoLocData.positionHIGH)
	{
		if (this.positionHIGH === undefined)
		{ this.positionHIGH = new Float32Array(3); }
		
		this.positionHIGH[0]= geoLocData.positionHIGH[0];
		this.positionHIGH[1]= geoLocData.positionHIGH[1];
		this.positionHIGH[2]= geoLocData.positionHIGH[2];
	}
	if (geoLocData.positionLOW)
	{
		if (this.positionLOW === undefined)
		{ this.positionLOW = new Float32Array(3); }
		
		this.positionLOW[0]= geoLocData.positionLOW[0];
		this.positionLOW[1]= geoLocData.positionLOW[1];
		this.positionLOW[2]= geoLocData.positionLOW[2];
	}
	if (geoLocData.pivotPoint)
	{
		if (this.pivotPoint === undefined)
		{ this.pivotPoint = new Point3D(); }
		
		this.pivotPoint.copyFrom(geoLocData.pivotPoint);
	}
	
	// F4D Matrix4.*
	if (geoLocData.geoLocMatrix)
	{
		if (this.geoLocMatrix === undefined)
		{ this.geoLocMatrix = new Matrix4(); }
		
		this.geoLocMatrix.copyFromMatrix4(geoLocData.geoLocMatrix);
	}
	if (geoLocData.geoLocMatrixInv)
	{
		if (this.geoLocMatrixInv === undefined)
		{ this.geoLocMatrixInv = new Matrix4(); }
		
		this.geoLocMatrixInv.copyFromMatrix4(geoLocData.geoLocMatrixInv);
	}
	if (geoLocData.tMatrix)
	{
		if (this.tMatrix === undefined)
		{ this.tMatrix = new Matrix4(); }
		
		this.tMatrix.copyFromMatrix4(geoLocData.tMatrix);
	}
	if (geoLocData.tMatrixInv)
	{
		if (this.tMatrixInv === undefined)
		{ this.tMatrixInv = new Matrix4(); }
		
		this.tMatrixInv.copyFromMatrix4(geoLocData.tMatrixInv);
	}
	if (geoLocData.rotMatrix)
	{
		if (this.rotMatrix === undefined)
		{ this.rotMatrix = new Matrix4(); }
		
		this.rotMatrix.copyFromMatrix4(geoLocData.rotMatrix);
	}
	if (geoLocData.rotMatrixInv)
	{
		if (this.rotMatrixInv === undefined)
		{ this.rotMatrixInv = new Matrix4(); }
		
		this.rotMatrixInv.copyFromMatrix4(geoLocData.rotMatrixInv);
	}
	
	if (geoLocData.aditionalTraslation)
	{
		if (this.aditionalTraslation === undefined)
		{ this.aditionalTraslation = new Point3D(); }
		
		this.aditionalTraslation.copyFrom(geoLocData.aditionalTraslation);
	}
	
};

/**
 * This function transforms a local position of this geoLocation to world position.
 * @param localCoord  instance of Point3D.
 * @param resultWorldCoord. instance of Point3D.
 * @returns resultWorldCoord. instance of Point3D.
 */
GeoLocationData.prototype.localCoordToWorldCoord = function(localCoord, resultWorldCoord) 
{
	if (localCoord === undefined || this.tMatrix === undefined)
	{ return undefined; }
	
	if (resultWorldCoord === undefined)
	{ resultWorldCoord = new Point3D(); }
	
	resultWorldCoord = this.tMatrix.transformPoint3D(localCoord, resultWorldCoord); 
	return resultWorldCoord;
};

/**
 * This function transforms an absolute position to local position for this geoLocation.
 * @param worldCoord  instance of Point3D.
 * @param resultLocalCoord. instance of Point3D.
 * @returns resultLocalCoord. instance of Point3D.
 */
GeoLocationData.prototype.worldCoordToLocalCoord = function(worldCoord, resultLocalCoord) 
{
	var tMatrixInv = this.getTMatrixInv();
	if (worldCoord === undefined || tMatrixInv === undefined)
	{ return undefined; }
	
	if (resultLocalCoord === undefined)
	{ resultLocalCoord = new Point3D(); }
	
	resultLocalCoord = tMatrixInv.transformPoint3D(worldCoord, resultLocalCoord); 
	return resultLocalCoord;
};

/**
 * 
 * @returns this.locMatrixInv.
 */
GeoLocationData.prototype.getLocMatrixInv = function() 
{
	if (this.geoLocMatrixInv === undefined)
	{
		var locMatrixInv = glMatrix.mat4.create();
		locMatrixInv = glMatrix.mat4.invert(locMatrixInv, this.geoLocMatrix._floatArrays );
		
		this.geoLocMatrixInv = new Matrix4();
		this.geoLocMatrixInv.setByFloat32Array(locMatrixInv);
	}
	
	return this.geoLocMatrixInv;
};

/**
 * 
 * @returns this.rotMatrixInv.
 */
GeoLocationData.prototype.getRotMatrixInv = function() 
{
	if (this.rotMatrixInv === undefined)
	{
		var rotMatrixInv = glMatrix.mat4.create();
		rotMatrixInv = glMatrix.mat4.invert(rotMatrixInv, this.rotMatrix._floatArrays );
		
		this.rotMatrixInv = new Matrix4();
		this.rotMatrixInv.setByFloat32Array(rotMatrixInv);
	}
	
	return this.rotMatrixInv;
};

/**
 * 
 * @returns this.tMatrixInv.
 */
GeoLocationData.prototype.getTMatrixInv = function() 
{
	if (this.tMatrixInv === undefined)
	{
		var tMatrixInv = glMatrix.mat4.create();
		tMatrixInv = glMatrix.mat4.invert(tMatrixInv, this.tMatrix._floatArrays);
		
		this.tMatrixInv = new Matrix4();
		this.tMatrixInv.setByFloat32Array(tMatrixInv);
	}
	
	return this.tMatrixInv;
};

/**
 * 
 * @returns this.rotMatrixLC.
 */
GeoLocationData.prototype.getRotMatrixLC = function() 
{
	if (this.rotMatrixLC === undefined)
	{
		var xRotMatrix = new Matrix4();  // created as identity matrix.
		var yRotMatrix = new Matrix4();  // created as identity matrix.
		var zRotMatrix = new Matrix4();  // created as identity matrix.
		var heading = this.heading;
		var pitch = this.pitch;
		var roll = this.roll;
		
		if (heading !== undefined && heading !== 0)
		{ zRotMatrix.rotationAxisAngDeg(heading, 0.0, 0.0, 1.0); }

		if (pitch !== undefined && pitch !== 0)
		{ xRotMatrix.rotationAxisAngDeg(pitch, 1.0, 0.0, 0.0); }

		if (roll !== undefined && roll !== 0)
		{ yRotMatrix.rotationAxisAngDeg(roll, 0.0, 1.0, 0.0); }
		
		var resultTransformMatrix = new Matrix4();   // created as identity matrix.
		
		var zRotatedTMatrix;
		var zxRotatedTMatrix;
		var zxyRotatedTMatrix;

		zRotatedTMatrix = zRotMatrix.getMultipliedByMatrix(resultTransformMatrix, zRotatedTMatrix);
		zxRotatedTMatrix = xRotMatrix.getMultipliedByMatrix(zRotatedTMatrix, zxRotatedTMatrix);
		zxyRotatedTMatrix = yRotMatrix.getMultipliedByMatrix(zxRotatedTMatrix, zxyRotatedTMatrix);
		
		this.rotMatrixLC = zxyRotatedTMatrix;
	}
	
	return this.rotMatrixLC;
};

/**
 * 
 * @returns this.geoLocMatrixInv.
 */
GeoLocationData.prototype.getGeoLocationMatrixInv = function() 
{
	if (this.geoLocMatrixInv === undefined)
	{
		var geoLocMatrixInv = glMatrix.mat4.create();
		geoLocMatrixInv = glMatrix.mat4.invert(geoLocMatrixInv, this.geoLocMatrix._floatArrays  );
		
		this.geoLocMatrixInv = new Matrix4();
		this.geoLocMatrixInv.setByFloat32Array(geoLocMatrixInv);
	}
	
	return this.geoLocMatrixInv;
};

/**
 * This function transforms an absolute camera (world coord) into a relative camera (local coord) for this geoLocation.
 * @param absoluteCamera instance of Camera. 
 * @param resultCamera instance of Camera. This is the transformed camera.
 * @returns resultCamera
 */
GeoLocationData.prototype.getTransformedRelativeCamera = function(absoluteCamera, resultCamera) 
{
	if (resultCamera === undefined)
	{ resultCamera = new Camera(); }
	
	var pointAux = new Point3D();
	
	pointAux.set(absoluteCamera.position.x - this.position.x, 
		absoluteCamera.position.y - this.position.y, 
		absoluteCamera.position.z - this.position.z);
		
	var rotMatInv = this.getRotMatrixInv();
	
	resultCamera.position = rotMatInv.transformPoint3D(pointAux, resultCamera.position);
	
	pointAux.set(absoluteCamera.direction.x, absoluteCamera.direction.y, absoluteCamera.direction.z);
	resultCamera.direction = rotMatInv.transformPoint3D(pointAux, resultCamera.direction);
	
	pointAux.set(absoluteCamera.up.x, absoluteCamera.up.y, absoluteCamera.up.z);
	resultCamera.up = rotMatInv.transformPoint3D(pointAux, resultCamera.up);
  
	pointAux.x = undefined;
	pointAux.y = undefined;
	pointAux.z = undefined;
	pointAux = undefined;
	
	return resultCamera;
};

/**
 * 
 */
GeoLocationData.prototype.getTransformedRelativePositionNoApplyHeadingPitchRoll = function(absolutePosition, resultRelativePosition) 
{
	if (resultRelativePosition === undefined)
	{ resultRelativePosition = new Point3D(); }
	
	var pointAux = new Point3D();
	
	pointAux.set(absolutePosition.x, 
		absolutePosition.y, 
		absolutePosition.z);
	var locMatInv = this.getLocMatrixInv();
	resultRelativePosition = locMatInv.transformPoint3D(pointAux, resultRelativePosition);
	
	return resultRelativePosition;
};

/**
 * Change the absolute coordinate feature to relative coordinate feature
 * @param absolutePosition
 * @param {Point3D} resultRelativePosition
 */
GeoLocationData.prototype.getTransformedRelativePosition = function(absolutePosition, resultRelativePosition) 
{
	if (resultRelativePosition === undefined)
	{ resultRelativePosition = new Point3D(); }
	
	var pointAux = new Point3D();
	
	pointAux.set(absolutePosition.x - this.position.x, 
		absolutePosition.y - this.position.y, 
		absolutePosition.z - this.position.z);
	var rotMatInv = this.getRotMatrixInv();
	resultRelativePosition = rotMatInv.transformPoint3D(pointAux, resultRelativePosition);
	
	return resultRelativePosition;
};

/**
 * This function transforms an absolute camera (world coord) into a relative camera (local coord) for this geoLocation.
 */
GeoLocationData.prototype.getTransformedRelativePositionsArray = function(absolutePositionsArray, resultRelativePositionsArray) 
{
	if (absolutePositionsArray === undefined)
	{ return resultRelativePositionsArray; }
	
	if (resultRelativePositionsArray === undefined)
	{ resultRelativePositionsArray = []; }
	
	var absolutePoints3dCount = absolutePositionsArray.length;
	for (var i=0; i<absolutePoints3dCount; i++)
	{
		var relPoint3d = this.getTransformedRelativePosition(absolutePositionsArray[i], undefined);
		resultRelativePositionsArray.push(relPoint3d);
	}
	
	return resultRelativePositionsArray;
};

/**
 */
GeoLocationData.prototype.bindGeoLocationUniforms = function(gl, shader) 
{
	if (this.rotMatrix === undefined)
	{ var hola = 0; }
	
	gl.uniformMatrix4fv(shader.buildingRotMatrix_loc, false, this.rotMatrix._floatArrays);
	gl.uniform3fv(shader.buildingPosHIGH_loc, [this.positionHIGH[0], this.positionHIGH[1], this.positionHIGH[2]]);
	gl.uniform3fv(shader.buildingPosLOW_loc, [this.positionLOW[0], this.positionLOW[1], this.positionLOW[2]]);
};


