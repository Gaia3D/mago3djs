'use strict';

/**
 * This is the interaction for draw geometry.
 * @constructor
 * @class NativeUpDownInteraction
 * 
 * 
 * @param {object} option layer object.
 */
var NativeUpDownInteraction = function(option) 
{
	if (!(this instanceof NativeUpDownInteraction)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	option = option ? option : {};
	AbsPointerInteraction.call(this, option);
    
	this.targetType = InteractionTargetType.NATIVE;
	this.filter = defaultValue(option.filter, 'selected');
	this.filter_;
	this.offset = defaultValue(option.filter, 3.3);
    

	this.target = undefined;
	this.selObjMovePlaneCC = undefined;
	this.lineCC = new Line();
	this.startPixel = undefined;

};
NativeUpDownInteraction.prototype = Object.create(AbsPointerInteraction.prototype);
NativeUpDownInteraction.prototype.constructor = NativeUpDownInteraction;

NativeUpDownInteraction.EVENT_TYPE = {
	'ACTIVE'  	: 'active',
	'DEACTIVE'	: 'deactive'
};
/**
 * interaction init
 * @override
 */
NativeUpDownInteraction.prototype.init = function() 
{
	this.dragging = false;
	this.mouseBtn = undefined;
	this.startPoint = undefined;
	this.endPoint = undefined;
	this.selObjMovePlaneCC = undefined;
	this.startPixel = undefined;
	this.target = undefined;
};

/**
 * set TargetType
 * @param {string} filter 
 */
NativeUpDownInteraction.prototype.setFilter = function(filter)
{
	var oldFilter = this.filter;
	this.filter = filter;
	if (oldFilter !== filter)
	{
		this.setFilterFunction();
	}
};

/**
 * get TargetType
 * @return {boolean}
 */
NativeUpDownInteraction.prototype.getFilter = function()
{
	return this.filter;
};

NativeUpDownInteraction.prototype.handleDownEvent = function(browserEvent)
{
	var manager = this.manager;
	if (browserEvent.type !== "leftdown") { return; }

	var selectManager = manager.selectionManager;

	if (manager.selectionFbo === undefined) 
	{ manager.selectionFbo = new FBO(gl, manager.sceneState.drawingBufferWidth, manager.sceneState.drawingBufferHeight, {matchCanvasSize: true}); }

	var gl = manager.getGl();
	selectManager.selectProvisionalObjectByPixel(gl, browserEvent.point.screenCoordinate.x, browserEvent.point.screenCoordinate.y);

	if (!this.filter_)
	{
		this.setFilterFunction();
	}

	var filterProvisional = selectManager.filterProvisional(this.targetType, this.filter_);

	if (!isEmpty(filterProvisional))
	{
		this.target = filterProvisional[this.targetType][0];
	}
	else 
	{
		this.init();
	}
};

NativeUpDownInteraction.prototype.handleDragEvent = function(browserEvent)
{
	if (this.target && this.dragging)
	{
		this.manager.setCameraMotion(false);
		var object = this.target;
		if (object instanceof ObjectMarker)
		{ return; }
		object = object.getRootOwner();

		var attributes = object.attributes;
		if (attributes === undefined)
		{ return; }
        
		var geoLocDataManager = object.getGeoLocDataManager();
		if (geoLocDataManager === undefined)
		{ return; }
        
		var geoLocationData = geoLocDataManager.getCurrentGeoLocationData();
		var manager = this.manager;
		var gl = manager.getGl();
		var sceneState = manager.sceneState;
		if (this.selObjMovePlaneCC === undefined) 
		{
			this.selObjMovePlaneCC = new Plane();
			// calculate the pixelPos in camCoord.
			var geoLocMatrix = geoLocationData.geoLocMatrix;
			var mvMat = sceneState.modelViewMatrix;
			var mvMatRelToEye = sceneState.modelViewRelToEyeMatrix;
            
			var sc = this.startPoint.screenCoordinate;
			var magoWC = ManagerUtils.calculatePixelPositionWorldCoord(gl, sc.x, sc.y, magoWC, undefined, undefined, undefined, manager);
			//var pixelPosCC = mvMat.transformPoint3D(magoWC, undefined);
			var pixelPosCC = mvMat.transformPoint3D(this.startPoint.worldCoordinate, undefined);

			// movement in plane XZ.
			//var globeYaxisWC = new Point3D(geoLocMatrix._floatArrays[4], geoLocMatrix._floatArrays[5], geoLocMatrix._floatArrays[6]);
			var globeZaxisWC = new Point3D(geoLocMatrix._floatArrays[8], geoLocMatrix._floatArrays[9], geoLocMatrix._floatArrays[10]);
			var camDirection = sceneState.camera.direction;

			var dot = globeZaxisWC.scalarProduct(camDirection);
			if (Math.abs(dot) > 0.9)
			{
               
				var right = sceneState.camera.right;
				var mat = new Matrix4();
				mat.rotationAxisAngDeg(45, right.x, right.y, right.z);
				var newPosition = mat.transformPoint3D(sceneState.camera.position);
				/*
                var cesiumCam = manager.scene.camera;
                cesiumCam.flyTo({
                    destination: new Cesium.Cartesian3(newPosition.x,newPosition.y,newPosition.z),
                    orientation : {
                        heading : Cesium.Math.toRadians(-45),
                        pitch : 0,
                        roll : 0.0
                    },
                    duration: 2
                });
                */
				//this.handleUpEvent();
				// alert('카메라를 스리디로 바꿉니다(문구 추천좀)');
				//return;
			}

			var globeRightWC = globeZaxisWC.crossProduct(camDirection);
			var globeP = globeRightWC.crossProduct(globeZaxisWC);
			globeP.unitary();
			var globeYaxisCC = mvMatRelToEye.transformPoint3D(globeP, undefined);
			this.selObjMovePlaneCC.setPointAndNormal(pixelPosCC.x, pixelPosCC.y, pixelPosCC.z,    globeYaxisCC.x, globeYaxisCC.y, globeYaxisCC.z); 
		}
        
		var screenCoordinate = browserEvent.endEvent.screenCoordinate;
		var camRay = ManagerUtils.getRayCamSpace(screenCoordinate.x, screenCoordinate.y, camRay, manager);
		this.lineCC.setPointAndDir(0, 0, 0,  camRay[0], camRay[1], camRay[2]);

		// Calculate intersection cameraRay with planeCC.
		var intersectionPointCC = new Point3D();
		intersectionPointCC = this.selObjMovePlaneCC.intersectionLine(this.lineCC, intersectionPointCC);
        
		var mvMat = sceneState.getModelViewMatrixInv();
		var intersectionWC = mvMat.transformPoint3D(intersectionPointCC, intersectionWC);
        
		var intersectionScreenCoord = ManagerUtils.calculateWorldPositionToScreenCoord(undefined, intersectionWC.x, intersectionWC.y, intersectionWC.z, intersectionScreenCoord, manager);
        
		if (!this.startPixel)
		{
			var geoCoord = geoLocationData.geographicCoord;
			var wc = ManagerUtils.geographicCoordToWorldPoint(geoCoord.longitude, geoCoord.latitude, geoCoord.altitude);
			this.startPixel = ManagerUtils.calculateWorldPositionToScreenCoord(undefined, wc.x, wc.y, wc.z, this.startPixel, manager);
		}

		var diff = intersectionScreenCoord.y - this.startPixel.y;
		var up = diff < 0 ? true : false;
		var gijun = Math.abs(diff);
        
		if (gijun > this.offset)
		{
			var currentbuilding = this.target;
			var height = currentbuilding.height;
            
			if (up) 
			{
				height = height+this.offset;
			}
			else 
			{
				height = height-this.offset;			
			}

			/*var model = currentbuilding.geographicCoordList.getExtrudedMeshRenderableObject(height, undefined, undefined, undefined, undefined, {color: currentbuilding.color4.getHexCode(), height: this.offset});
            
			currentbuilding.height = height;
			currentbuilding.objectsArray = model.objectsArray;*/

			currentbuilding.setHeight(height);
            
			this.startPixel.set(screenCoordinate.x, screenCoordinate.y, screenCoordinate.z);
		}
        
		//geoLocationData = ManagerUtils.calculateGeoLocationData(undefined, undefined, difZ, undefined, undefined, undefined, geoLocationData, this);
	}
};

NativeUpDownInteraction.prototype.handleMoveEvent = function()
{
	return;
};

NativeUpDownInteraction.prototype.handleUpEvent = function()
{
	this.init();
	this.manager.setCameraMotion(true);
	this.manager.isCameraMoved = true;
	return;
};


NativeUpDownInteraction.prototype.setFilterFunction = function()
{
	var manager = this.manager;
	if (this.filter === 'selected')
	{
		this.filter_ = function(prov)
		{
			return prov === manager.defaultSelectInteraction.getSelected();
		};
	}
	else 
	{
		this.filter_ = function(){ return true; };
	}
};