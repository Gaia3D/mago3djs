'use strict';

/**
 * GeoLocationData is a class object that contains axis information about the location on "geographicCoord".
 * 
 * @class GeoLocationData
 * @constructor 
 * @param {string} geoLocationDataName The name of the geoLocationData.
 */
var GeoLocationData_ = function(geoLocationDataName) 
{
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
	 * @type {GeographicCoord_}
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

GeoLocationData_.prototype.getRotMatrixInv = function() 
{
	if (this.rotMatrixInv === undefined) 
	{
		var rotMatrixInv = glMatrix.mat4.create();
		rotMatrixInv = glMatrix.mat4.invert(rotMatrixInv, this.rotMatrix._floatArrays );
		
		this.rotMatrixInv = new Matrix4_();
		this.rotMatrixInv.setByFloat32Array(rotMatrixInv);
	}
	
	return this.rotMatrixInv;
};

GeoLocationData_.prototype.getTransformedRelativePosition = function(absolutePosition, resultRelativePosition) 
{
	// Note : "absolutePosition" is worldCoord position.
	if (resultRelativePosition === undefined)
	{ resultRelativePosition = new Point3D_(); }
	
	var pointAux = new Point3D_();

	// Do precision calculating.
	var positionHIGH = new Float32Array(3); 
	var positionLOW = new Float32Array(3); 
	Utils_.calculateSplited3fv([absolutePosition.x, absolutePosition.y, absolutePosition.z], positionHIGH, positionLOW);

	pointAux.set((positionHIGH[0] - this.positionHIGH[0])+(positionLOW[0] - this.positionLOW[0]), 
		(positionHIGH[1] - this.positionHIGH[1])+(positionLOW[1] - this.positionLOW[1]), 
		(positionHIGH[2] - this.positionHIGH[2])+(positionLOW[2] - this.positionLOW[2]));
	
	var rotMatInv = this.getRotMatrixInv();
	resultRelativePosition = rotMatInv.transformPoint3D(pointAux, resultRelativePosition);
	
	return resultRelativePosition;
};

GeoLocationData_.prototype.doEffectivePivotPointTranslation = function() 
{
	// this function adds the "pivotPointTraslation" to the positions.
	// this function is not for move the building on the globe. This function is only for translate the pivot point of the building.
	// Note: the translation vector only must be added into "this.pivotPoint". TODO:
	var traslationVector;
	if (this.pivotPointTraslationLC === undefined)
	{ 
		traslationVector = new Point3D_(0, 0, 0);
	}
	else 
	{
		traslationVector = this.tMatrix.rotatePoint3D(this.pivotPointTraslationLC, traslationVector );
	}
	
	// Recalculate the position.
	var geoCoord = this.geographicCoord;
	this.position = Utils_.geographicCoordToWorldPoint(geoCoord.longitude, geoCoord.latitude, geoCoord.altitude, this.position);

	// High and Low values of the position.**
	if (this.positionHIGH === undefined)
	{ this.positionHIGH = new Float32Array([0.0, 0.0, 0.0]); }
	if (this.positionLOW === undefined)
	{ this.positionLOW = new Float32Array([0.0, 0.0, 0.0]); }
	Utils_.calculateSplited3fv([this.position.x, this.position.y, this.position.z], this.positionHIGH, this.positionLOW);
	
	this.position.x += traslationVector.x;
	this.position.y += traslationVector.y;
	this.position.z += traslationVector.z;

	this.positionLOW[0] += traslationVector.x;
	this.positionLOW[1] += traslationVector.y;
	this.positionLOW[2] += traslationVector.z;

	if (this.pivotPoint === undefined)
	{ this.pivotPoint = new Point3D_(); }

	this.pivotPoint.set(this.position.x, this.position.y, this.position.z);
};