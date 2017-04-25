'use strict';

/**
 * 어떤 일을 하고 있습니까?
 * @class GeoLocationData
 * @param geoLocationDataName 변수
 */
var GeoLocationData = function(geoLocationDataName) {
	if(!(this instanceof GeoLocationData)) {
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	this.name;
	
	if(geoLocationDataName == undefined) this.name = "noName";
	else this.name = geoLocationDataName;
	
	this.geographicCoord; // longitude, latitude, altitude.***
	
	this.heading;
	this.pitch;
	this.roll;
	
	this.date; // year - month - day - hour - min - seg - miliseg.***
	
	this.position;
	this.positionHIGH;
	this.positionLOW;

	this.pivotPoint; // Point3D().***
	
	// F4D Matrix4.****
	this.geoLocMatrix; // this is just the cartographic transformation matrix determined by (lon, lat, elev).***
	this.geoLocMatrixInv; // this is just the cartographic transformation matrixInv determined by (lon, lat, elev).***
	this.tMatrix;      // this contains translation & rotations.***
	this.tMatrixInv;   // this contains translation & rotations.***
	this.rotMatrix;    // this contains only rotation.***
	this.rotMatrixInv; // this contains only rotation.***
	
	// Aditional.***
	this.aditionalTraslation; // no used yet.***
};

/**
 * 어떤 일을 하고 있습니까?
 * @class GeoLocationData
 * @param absoluteCamera 변수
 * @param resultCamera 변수
 * @returns resultCamera
 */
GeoLocationData.prototype.getTransformedRelativeCamera = function(absoluteCamera, resultCamera) {
	var pointAux = new Point3D();
	
	pointAux.set(absoluteCamera.position.x - this.position.x, 
			absoluteCamera.position.y - this.position.y, 
			absoluteCamera.position.z - this.position.z);
	
	//pointAux.set(absoluteCamera.position.x - this.position.x - this.aditionalTraslation.x, 
	//		absoluteCamera.position.y - this.position.y - this.aditionalTraslation.y, 
	//		absoluteCamera.position.z - this.position.z - this.aditionalTraslation.z);
	
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
var GeoLocationDataManager = function() {
	if(!(this instanceof GeoLocationDataManager)) {
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
	this.geoLocationDataArray = [];
};

/**
 * 어떤 일을 하고 있습니까?
 * @class GeoLocationData
 * @param geoLocationName 변수
 * @returns geoLocationData
 */
GeoLocationDataManager.prototype.newGeoLocationData = function(geoLocationName) {
	if(geoLocationName == undefined)
		geoLocationName = "noName" + this.geoLocationDataArray.length.toString();
	var geoLocationData = new GeoLocationData(geoLocationName);
	this.geoLocationDataArray.push(geoLocationData);
	return geoLocationData;
};

/**
 * 어떤 일을 하고 있습니까?
 * @class GeoLocationData
 * @param idx
 * @returns this.geoLoactionDataArray[idx]
 */
GeoLocationDataManager.prototype.getGeoLocationData = function(idx) {
	return this.geoLocationDataArray[idx];
};





























