'use strict';

/**
 * ClippingBox geometry.
 * @class ClippingBox
 */
var ClippingBox = function(width, length, height, name) 
{
	MagoRenderable.call(this);
	if (!(this instanceof ClippingBox)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	// Initially, box centered at the center of the bottom.***
	this.centerPoint; // Usually (0,0,0).***
	this.width;
	this.length;
	this.height;

	if (name !== undefined)
	{ this.name = name; }
	
	if (width !== undefined)
	{ this.width = width; }
	
	if (length !== undefined)
	{ this.length = length; }
	
	if (height !== undefined)
	{ this.height = height; }

	this.planesVec4Array;

};

ClippingBox.prototype = Object.create(MagoRenderable.prototype);
ClippingBox.prototype.constructor = ClippingBox;

ClippingBox.prototype.getPlanesRelToEyevec4Array = function(magoManager)
{
	//if (this.planesVec4Array === undefined)
	//{ 
	this.planesVec4Array = []; 
	var planesArray = this.getPlanesRelToEye(undefined, magoManager);
	var planesCount = planesArray.length;
	for (var i=0; i<planesCount; i++)
	{
		var plane = planesArray[i];
		this.planesVec4Array.push(plane.a);
		this.planesVec4Array.push(plane.b);
		this.planesVec4Array.push(plane.c);
		this.planesVec4Array.push(plane.d);
	}
	//}

	return this.planesVec4Array;
};

ClippingBox.prototype.moved = function()
{
	this.planesVec4Array = undefined;
};

ClippingBox.prototype.getPlanesRelToEye = function(resultPlanesArray, magoManager)
{
	// 1rst, calculate planes on the initial state.
	// Initially, box centered at the center of the bottom.***
	if (resultPlanesArray === undefined)
	{ resultPlanesArray = []; }

	var sceneState = magoManager.sceneState;
	var mvMat = sceneState.modelViewMatrix;
	var mvMatRelToEye = sceneState.modelViewRelToEyeMatrix;
	var camera = sceneState.camera;
	var camPos = camera.position;
	var mvMat_inv = sceneState.modelViewMatrixInv;
	
	var geoLocDataManager = this.getGeoLocDataManager();
	var geoLocData = geoLocDataManager.getCurrentGeoLocationData();
	var rotMat = geoLocData.rotMatrix;
	
	var point = new Point3D();
	var dir = new Point3D();
	var pointWC = new Point3D();
	var dirWC = new Point3D();
	var pointCamCoord = new Point3D();
	var dirCamCoord = new Point3D();
	
	// top plane.
	point.set(0.0, 0.0, this.height);
	dir.set(0.0, 0.0, 1.0);
	pointWC = geoLocData.localCoordToWorldCoord(point, pointWC);
	dirWC = rotMat.transformPoint3D(dir, dirWC);
	pointCamCoord = mvMat.transformPoint3D(pointWC, pointCamCoord);
	dirCamCoord = mvMatRelToEye.transformPoint3D(dirWC, dirCamCoord);
	var plane = new Plane();
	plane.setPointAndNormal(pointCamCoord.x, pointCamCoord.y, pointCamCoord.z, dirCamCoord.x, dirCamCoord.y, dirCamCoord.z);
	resultPlanesArray.push(plane);
	
	// bottom plane.
	point.set(0.0, 0.0, 0.0);
	dir.set(0.0, 0.0, -1.0);
	pointWC = geoLocData.localCoordToWorldCoord(point, pointWC);
	dirWC = rotMat.transformPoint3D(dir, dirWC);
	pointCamCoord = mvMat.transformPoint3D(pointWC, pointCamCoord);
	dirCamCoord = mvMatRelToEye.transformPoint3D(dirWC, dirCamCoord);
	var plane = new Plane();
	plane.setPointAndNormal(pointCamCoord.x, pointCamCoord.y, pointCamCoord.z, dirCamCoord.x, dirCamCoord.y, dirCamCoord.z);
	resultPlanesArray.push(plane);
	
	// front plane.
	point.set(0.0, -this.length/2, this.height/2);
	dir.set(0.0, -1.0, 0.0);
	pointWC = geoLocData.localCoordToWorldCoord(point, pointWC);
	dirWC = rotMat.transformPoint3D(dir, dirWC);
	pointCamCoord = mvMat.transformPoint3D(pointWC, pointCamCoord);
	dirCamCoord = mvMatRelToEye.transformPoint3D(dirWC, dirCamCoord);
	var plane = new Plane();
	plane.setPointAndNormal(pointCamCoord.x, pointCamCoord.y, pointCamCoord.z, dirCamCoord.x, dirCamCoord.y, dirCamCoord.z);
	resultPlanesArray.push(plane);
	
	// rear plane.
	point.set(0.0, this.length/2, this.height/2);
	dir.set(0.0, 1.0, 0.0);
	pointWC = geoLocData.localCoordToWorldCoord(point, pointWC);
	dirWC = rotMat.transformPoint3D(dir, dirWC);
	pointCamCoord = mvMat.transformPoint3D(pointWC, pointCamCoord);
	dirCamCoord = mvMatRelToEye.transformPoint3D(dirWC, dirCamCoord);
	var plane = new Plane();
	plane.setPointAndNormal(pointCamCoord.x, pointCamCoord.y, pointCamCoord.z, dirCamCoord.x, dirCamCoord.y, dirCamCoord.z);
	resultPlanesArray.push(plane);
	
	// left plane.
	point.set(-this.width/2, 0.0, this.height/2);
	dir.set(-1.0, 0.0, 0.0);
	pointWC = geoLocData.localCoordToWorldCoord(point, pointWC);
	dirWC = rotMat.transformPoint3D(dir, dirWC);
	pointCamCoord = mvMat.transformPoint3D(pointWC, pointCamCoord);
	dirCamCoord = mvMatRelToEye.transformPoint3D(dirWC, dirCamCoord);
	var plane = new Plane();
	plane.setPointAndNormal(pointCamCoord.x, pointCamCoord.y, pointCamCoord.z, dirCamCoord.x, dirCamCoord.y, dirCamCoord.z);
	resultPlanesArray.push(plane);
	
	// right plane.
	point.set(this.width/2, 0.0, this.height/2);
	dir.set(1.0, 0.0, 0.0);
	pointWC = geoLocData.localCoordToWorldCoord(point, pointWC);
	dirWC = rotMat.transformPoint3D(dir, dirWC);
	pointCamCoord = mvMat.transformPoint3D(pointWC, pointCamCoord);
	dirCamCoord = mvMatRelToEye.transformPoint3D(dirWC, dirCamCoord);
	var plane = new Plane();
	plane.setPointAndNormal(pointCamCoord.x, pointCamCoord.y, pointCamCoord.z, dirCamCoord.x, dirCamCoord.y, dirCamCoord.z);
	resultPlanesArray.push(plane);
	
	return resultPlanesArray;
};

ClippingBox.prototype.getPlanes = function(resultPlanesArray, magoManager)
{
	// 1rst, calculate planes on the initial state.
	// Initially, box centered at the center of the bottom.***
	if (resultPlanesArray === undefined)
	{ resultPlanesArray = []; }

	var sceneState = magoManager.sceneState;
	var mvMat = sceneState.modelViewMatrix;
	var mvMatRelToEye = sceneState.modelViewRelToEyeMatrix;
	var camera = sceneState.camera;
	var camPos = camera.position;
	var mvMat_inv = sceneState.modelViewMatrixInv;
	
	var geoLocDataManager = this.getGeoLocDataManager();
	var geoLocData = geoLocDataManager.getCurrentGeoLocationData();
	var rotMat = geoLocData.rotMatrix;
	
	var point = new Point3D();
	var dir = new Point3D();
	var pointWC = new Point3D();
	var dirWC = new Point3D();
	var pointCamCoord = new Point3D();
	var dirCamCoord = new Point3D();
	
	// top plane.
	point.set(0.0, 0.0, this.height);
	dir.set(0.0, 0.0, 1.0);
	pointWC = rotMat.transformPoint3D(point, pointWC);
	dirWC = rotMat.transformPoint3D(dir, dirWC);
	var plane = new Plane();
	plane.setPointAndNormal(pointWC.x, pointWC.y, pointWC.z, dirWC.x, dirWC.y, dirWC.z);
	resultPlanesArray.push(plane);
	
	// bottom plane.
	point.set(0.0, 0.0, 0.0);
	dir.set(0.0, 0.0, -1.0);
	pointWC = rotMat.transformPoint3D(point, pointWC);
	dirWC = rotMat.transformPoint3D(dir, dirWC);
	var plane = new Plane();
	plane.setPointAndNormal(pointWC.x, pointWC.y, pointWC.z, dirWC.x, dirWC.y, dirWC.z);
	resultPlanesArray.push(plane);
	
	// front plane.
	point.set(0.0, -this.length/2, this.height/2);
	dir.set(0.0, -1.0, 0.0);
	pointWC = rotMat.transformPoint3D(point, pointWC);
	dirWC = rotMat.transformPoint3D(dir, dirWC);
	var plane = new Plane();
	plane.setPointAndNormal(pointWC.x, pointWC.y, pointWC.z, dirWC.x, dirWC.y, dirWC.z);
	resultPlanesArray.push(plane);
	
	// rear plane.
	point.set(0.0, this.length/2, this.height/2);
	dir.set(0.0, 1.0, 0.0);
	pointWC = rotMat.transformPoint3D(point, pointWC);
	dirWC = rotMat.transformPoint3D(dir, dirWC);
	var plane = new Plane();
	plane.setPointAndNormal(pointWC.x, pointWC.y, pointWC.z, dirWC.x, dirWC.y, dirWC.z);
	resultPlanesArray.push(plane);
	
	// left plane.
	point.set(-this.width/2, 0.0, this.height/2);
	dir.set(-1.0, 0.0, 0.0);
	pointWC = rotMat.transformPoint3D(point, pointWC);
	dirWC = rotMat.transformPoint3D(dir, dirWC);
	var plane = new Plane();
	plane.setPointAndNormal(pointWC.x, pointWC.y, pointWC.z, dirWC.x, dirWC.y, dirWC.z);
	resultPlanesArray.push(plane);
	
	// right plane.
	point.set(this.width/2, 0.0, this.height/2);
	dir.set(1.0, 0.0, 0.0);
	pointWC = rotMat.transformPoint3D(point, pointWC);
	dirWC = rotMat.transformPoint3D(dir, dirWC);
	var plane = new Plane();
	plane.setPointAndNormal(pointWC.x, pointWC.y, pointWC.z, dirWC.x, dirWC.y, dirWC.z);
	resultPlanesArray.push(plane);
	
	return resultPlanesArray;
};

/**
 * Makes the box mesh.
 * @param {Number} width
 * @param {Number} length
 * @param {Number} height 
 */
ClippingBox.prototype.makeMesh = function()
{
	var profileAux = new Profile2D();
	
	// Create a outer ring in the Profile2d.
	var outerRing = profileAux.newOuterRing();

	var halfWidth = this.width * 0.5;
	var halLength = this.length * 0.5;
	var polyline = outerRing.newElement("POLYLINE");

	polyline.newPoint2d(-halfWidth, -halLength);
	polyline.newPoint2d(halfWidth, -halLength);
	polyline.newPoint2d(halfWidth, halLength);
	polyline.newPoint2d(-halfWidth, halLength);

	//var rect = outerRing.newElement("RECTANGLE");
	//rect.setCenterPosition(this.centerPoint.x, this.centerPoint.y);
	//rect.setDimensions(this.width, this.length);
	
	// Extrude the Profile.
	var extrudeSegmentsCount = 1;
	var extrusionVector = undefined;
	var extrusionDist = this.height;
	var bIncludeBottomCap = true;
	var bIncludeTopCap = true;

	var mesh = Modeler.getExtrudedMesh(profileAux, extrusionDist, extrudeSegmentsCount, extrusionVector, bIncludeBottomCap, bIncludeTopCap, undefined);
	
	// set attributes & options.
	this.setOneColor(0.2, 0.7, 0.8, 0.3);
	this.attributes.isMovable = true;
	this.attributes.isSelectable = true;
	this.attributes.name = "clippingBox";
	this.attributes.selectedColor4 = new Color(1.0, 0.0, 0.0, 0.0); // selectedColor fully transparent.
	if (this.options === undefined)
	{ this.options = {}; }
	
	this.options.renderWireframe = true;
	this.options.renderShaded = true;
	this.options.depthMask = true;
	
	this.objectsArray.push(mesh);
	this.dirty = false;
	return mesh;
};