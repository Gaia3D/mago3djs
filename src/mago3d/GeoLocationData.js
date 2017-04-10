'use strict';

/**
 * 어떤 일을 하고 있습니까?
 * @class GeoLocationData
 */
var GeoLocationData = function() {
	if(!(this instanceof GeoLocationData)) {
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
	this.longitude; 
	this.latitude;
	this.elevation;
	
	this.position;
	this.positionHIGH;
	this.positionLOW;
	
	this.heading;
	this.pitch;
	this.roll;
	
	this.bboxAbsoluteCenterPos;
	
	// F4D Matrix4.****
	this.geoLocMatrix; // this is just the cartographic transformation matrix determined by (lon, lat, elev).***
	this.geoLocMatrixInv; // this is just the cartographic transformation matrix determined by (lon, lat, elev).***
	this.tMatrix;      // this contains translation & rotations.***
	this.tMatrixInv;   // this contains translation & rotations.***
	this.rotMatrix;    // this contains only rotation.***
	this.rotMatrixInv; // this contains only rotation.***
	
	
	// Aditional.***
	this.aditionalTraslation;
};

/**
 * 어떤 일을 하고 있습니까?
 * @class GeoLocationData
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
}