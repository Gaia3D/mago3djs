'use strict';

/**
 * 어떤 일을 하고 있습니까?
 * @class GeoLocationData
 * @param geoLocationDataName 변수
 */
var GeoLocationData = function(geoLocationDataName) 
{
	if (!(this instanceof GeoLocationData)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	this.name;
	
	if (geoLocationDataName === undefined) { this.name = "noName"; }
	else { this.name = geoLocationDataName; }
	
	this.geographicCoord; // longitude, latitude, altitude.***
	
	this.heading;
	this.pitch;
	this.roll;
	
	this.date; // year - month - day - hour - min - seg - miliseg.***
	
	this.position;   // Point3D().***
	this.positionHIGH; // Float32Array[3].***
	this.positionLOW; // Float32Array[3].***
	this.pivotPoint; // Point3D().*** // Actually position = pivotPoint.
	
	// F4D Matrix4.****
	this.geoLocMatrix; // this is just the cartographic transformation matrix determined by (lon, lat, elev).***
	this.geoLocMatrixInv; // this is just the cartographic transformation matrixInv determined by (lon, lat, elev).***
	this.tMatrix;      // this contains translation & rotations.***
	this.tMatrixInv;   // this contains translation & rotations.***
	this.rotMatrix;    // this contains only rotation.***
	this.rotMatrixInv; // this contains only rotation.***
	
	// Aditional.***
	this.pivotPointTraslation; // made when translate the pivot point.***
};

/**
 * 어떤 일을 하고 있습니까?
 * @class GeoLocationData
 * @param geoLocData 변수
 */
GeoLocationData.prototype.deleteObjects = function() 
{
	this.name = undefined;
	if (this.geographicCoord)
	{ this.geographicCoord.deleteObjects(); }
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
	
	// F4D Matrix4.****
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
	
	// Aditional.***
	if (this.pivotPointTraslation)
	{ this.pivotPointTraslation.deleteObjects(); }
	this.pivotPointTraslation = undefined;
};

/**
 * 어떤 일을 하고 있습니까?
 * @class GeoLocationData
 * @param geoLocData 변수
 */
GeoLocationData.prototype.doEffectivePivotPointTranslation = function() 
{
	// this function adds the "pivotPointTraslation" to the positions.
	// this function is not for move the building on the globe. This function is only for translate the pivot point of the building.
	if (this.pivotPointTraslation === undefined)
	{ return; }
	
	var traslationVector;
	traslationVector = this.tMatrix.rotatePoint3D(this.pivotPointTraslation, traslationVector );
	
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
 * 어떤 일을 하고 있습니까?
 * @class GeoLocationData
 * @param geoLocData 변수
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
		
		this.geographicCoord.copyFrom(geoLocData.geographicCoord); // longitude, latitude, altitude.***
	}
	
	this.heading = geoLocData.heading;
	this.pitch = geoLocData.pitch;
	this.roll = geoLocData.roll;
	
	this.date = geoLocData.date; // year - month - day - hour - min - seg - miliseg.***
	
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
	
	// F4D Matrix4.****
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
	if(localCoord === undefined || this.tMatrix === undefined)
		return undefined;
	
	if(resultWorldCoord === undefined)
		resultWorldCoord = new Point3D();
	
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
	if(worldCoord === undefined || this.tMatrixInv === undefined)
		return undefined;
	
	if(resultLocalCoord === undefined)
		resultLocalCoord = new Point3D();
	
	resultLocalCoord = this.tMatrixInv.transformPoint3D(worldCoord, resultLocalCoord); 
	return resultLocalCoord;
};

/**
 * This function transforms an absolute camera (world coord) into a relative camera (local coord) for this geoLocation.
 * @param absoluteCamera instance of Camera. 
 * @param resultCamera instance of Camera. This is the transformed camera.
 * @returns resultCamera
 */
GeoLocationData.prototype.getTransformedRelativeCamera = function(absoluteCamera, resultCamera) 
{
	var pointAux = new Point3D();
	
	pointAux.set(absoluteCamera.position.x - this.position.x, 
		absoluteCamera.position.y - this.position.y, 
		absoluteCamera.position.z - this.position.z);
	
	resultCamera.position = this.rotMatrixInv.transformPoint3D(pointAux, resultCamera.position);
	
	pointAux.set(absoluteCamera.direction.x, absoluteCamera.direction.y, absoluteCamera.direction.z);
	resultCamera.direction = this.rotMatrixInv.transformPoint3D(pointAux, resultCamera.direction);
	
	pointAux.set(absoluteCamera.up.x, absoluteCamera.up.y, absoluteCamera.up.z);
	resultCamera.up = this.rotMatrixInv.transformPoint3D(pointAux, resultCamera.up);
  
	pointAux.x = undefined;
	pointAux.y = undefined;
	pointAux.z = undefined;
	pointAux = undefined;
	
	return resultCamera;
};

/**
 * 어떤 일을 하고 있습니까?
 * @class GeoLocationDataManager
 */
var GeoLocationDataManager = function() 
{
	if (!(this instanceof GeoLocationDataManager)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
	this.geoLocationDataArray = [];
	//this.geoLocationDataCache = {}; // use this.***
};

/**
 * 어떤 일을 하고 있습니까?
 * @class GeoLocationData
 * @param geoLocationName 변수
 * @returns geoLocationData
 */
GeoLocationDataManager.prototype.deleteObjects = function() 
{
	if (this.geoLocationDataArray)
	{
		for (var i=0; i<this.geoLocationDataArray.length; i++)
		{
			this.geoLocationDataArray[i].deleteObjects();
			this.geoLocationDataArray[i] = undefined;
		}
		this.geoLocationDataArray = undefined;
	}
};

/**
 * 어떤 일을 하고 있습니까?
 * @class GeoLocationData
 * @param geoLocationName 변수
 * @returns geoLocationData
 */
GeoLocationDataManager.prototype.newGeoLocationData = function(geoLocationName) 
{
	if (geoLocationName === undefined)
	{ geoLocationName = "noName" + this.geoLocationDataArray.length.toString(); }
	var geoLocationData = new GeoLocationData(geoLocationName);
	this.geoLocationDataArray.push(geoLocationData);
	//this.geoLocationDataCache[geoLocationName] = geoLocationData;
	return geoLocationData;
};

/**
 * 어떤 일을 하고 있습니까?
 * @class GeoLocationData
 * @param idx
 * @returns this.geoLoactionDataArray[idx]
 */
GeoLocationDataManager.prototype.getGeoLocationData = function(idx) 
{
	if (idx > this.geoLocationDataArray.length - 1)
	{ return undefined; }
	return this.geoLocationDataArray[idx];
};

/**
 * 어떤 일을 하고 있습니까?
 * @class GeoLocationData
 * @param idx
 * @returns this.geoLoactionDataArray[idx]
 */
GeoLocationDataManager.prototype.getCurrentGeoLocationData = function() 
{
	if (this.geoLocationDataArray.length === 0)
	{
		return undefined;
	}
	return this.geoLocationDataArray[0]; // provisionally return the 1rst.
};





























