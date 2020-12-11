'use strict';

/**
 * This is the interaction for draw geometry.
 * @constructor
 * @class TranslateInteraction
 * 
 * 
 * @param {object} option layer object.
 */
var TranslateInteraction = function(option) 
{
	if (!(this instanceof TranslateInteraction)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	option = option ? option : {};
	AbsPointerInteraction.call(this, option);
    
	this.targetType = defaultValue(option.targetType, DataType.F4D);
	this.filter = defaultValue(option.filter, 'selected');
	this.filter_;
    

	this.target = undefined;
	this.parentNode = undefined;
	this.selObjMovePlaneCC = undefined;
	this.selObjMovePlane = undefined;
	this.lineCC = new Line();
	this.lineSC = new Line();
	this.startGeoCoordDif = undefined;
	this.startMovPoint = undefined;
};
TranslateInteraction.prototype = Object.create(AbsPointerInteraction.prototype);
TranslateInteraction.prototype.constructor = TranslateInteraction;

TranslateInteraction.EVENT_TYPE = {
	'ACTIVE'  	: 'active',
	'DEACTIVE'	: 'deactive',
	'MOVING_F4D' : 'movingf4d',
	'MOVING_NATIVE' : 'movingNative',
	'MOVING_OBJECT' : 'movingObject',
	'MOVE_END_F4D' : 'moveEndf4d',
	'MOVE_END_NATIVE' : 'moveEndNative',
	'MOVE_END_OBJECT' : 'moveEndObject'
};

/**
 * interaction init
 * @override
 */
TranslateInteraction.prototype.init = function() 
{
	this.begin = false;
	this.dragging = false;
	this.mouseBtn = undefined;
	this.startPoint = undefined;
	this.endPoint = undefined;
	this.selObjMovePlaneCC = undefined;
	this.selObjMovePlane = undefined;
	this.startGeoCoordDif = undefined;
	this.startMovPoint = undefined;
	this.target = undefined;
	this.parentNode = undefined;
};

/**
 * set TargetType
 * @param {boolean} type 
 */
TranslateInteraction.prototype.setTargetType = function(type)
{
	this.targetType = type;
};

/**
 * get TargetType
 * @return {boolean}
 */
TranslateInteraction.prototype.getTargetType = function()
{
	return this.targetType;
};

/**
 * set TargetType
 * @param {string} filter 
 */
TranslateInteraction.prototype.setFilter = function(filter)
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
TranslateInteraction.prototype.getFilter = function()
{
	return this.filter;
};

TranslateInteraction.prototype.handleDownEvent = function(browserEvent)
{
	var manager = this.manager;
	if (browserEvent.type !== "leftdown") { return; }

	var selectManager = manager.selectionManager;

	if (manager.selectionFbo === undefined) 
	{ manager.selectionFbo = new FBO(gl, manager.sceneState.drawingBufferWidth[0], manager.sceneState.drawingBufferHeight[0], {matchCanvasSize: true}); }

	var gl = manager.getGl();
	selectManager.selectProvisionalObjectByPixel(gl, browserEvent.point.screenCoordinate.x, browserEvent.point.screenCoordinate.y);

	if (!this.filter_)
	{
		this.setFilterFunction();
	}

	var filterProvisional = selectManager.filterProvisional(this.targetType, this.filter_);
	
	if (!isEmpty(filterProvisional) && (filterProvisional.hasOwnProperty(this.targetType) || this.targetType === DataType.ALL))
	{
		if(this.targetType !== DataType.ALL) {
			this.target = filterProvisional[this.targetType][0];
			if (this.targetType === DataType.OBJECT)
			{
				this.parentNode = filterProvisional[DataType.F4D][0];
			}
		} else {
			this.target = filterProvisional[Object.keys(filterProvisional)[0]][0];
		}
		
	}
	else 
	{
		this.init();
	}
};

TranslateInteraction.prototype.handleDragEvent = function(browserEvent)
{
	if (this.target && this.dragging)
	{
		this.manager.setCameraMotion(false);
		switch (this.targetType)
		{
		case DataType.F4D : {
			this.handleF4dDrag(browserEvent);
			break;
		}
		case DataType.OBJECT : {
			this.handleObjectDrag(browserEvent);
			break;
		}
		case DataType.NATIVE : {
			this.handleNativeDrag(browserEvent);
			break;
		}
		case DataType.ALL : {
			if(this.target instanceof Node) {
				this.handleF4dDrag(browserEvent);
			} else if(this.target instanceof MagoRenderable) {
				this.handleNativeDrag(browserEvent);
			}
			break;
		}
		}
	}
};

TranslateInteraction.prototype.handleF4dDrag = function(browserEvent)
{
	var manager = this.manager;
	var geoLocDataManager = this.target.getNodeGeoLocDataManager();
	var geoLocationData = geoLocDataManager.getCurrentGeoLocationData();
	var attributes = this.target.data.attributes;
	if (!this.selObjMovePlaneCC)
	{
		this.selObjMovePlaneCC = new Plane();

		var geoLocMatrix = geoLocationData.geoLocMatrix;
		var mvMat = manager.sceneState.modelViewMatrix;
		var mvMatRelToEye = manager.sceneState.modelViewRelToEyeMatrix;

		var sc = this.startPoint.screenCoordinate;
		var magoWC = ManagerUtils.calculatePixelPositionWorldCoord(manager.getGl(), sc.x, sc.y, magoWC, undefined, undefined, undefined, manager);
		var pixelPosCC = mvMat.transformPoint3D(this.startPoint.worldCoordinate, pixelPosCC);
        
		if (attributes.movementInAxisZ)
		{
			// movement in plane XZ.
			var globeYaxisWC = new Point3D(geoLocMatrix._floatArrays[4], geoLocMatrix._floatArrays[5], geoLocMatrix._floatArrays[6]);
			var globeYaxisCC = mvMatRelToEye.transformPoint3D(globeYaxisWC, undefined);
			this.selObjMovePlaneCC.setPointAndNormal(pixelPosCC.x, pixelPosCC.y, pixelPosCC.z,    globeYaxisCC.x, globeYaxisCC.y, globeYaxisCC.z); 
		}
		else 
		{
			// movement in plane XY.
			var globeZaxisWC = new Point3D(geoLocMatrix._floatArrays[8], geoLocMatrix._floatArrays[9], geoLocMatrix._floatArrays[10]);
			var globeZaxisCC = mvMatRelToEye.transformPoint3D(globeZaxisWC, undefined);
			this.selObjMovePlaneCC.setPointAndNormal(pixelPosCC.x, pixelPosCC.y, pixelPosCC.z,    globeZaxisCC.x, globeZaxisCC.y, globeZaxisCC.z); 
		}
	}

	var screenCoordinate = browserEvent.endEvent.screenCoordinate;
	var camRay = ManagerUtils.getRayCamSpace(screenCoordinate.x, screenCoordinate.y, camRay, manager);
	this.lineCC.setPointAndDir(0, 0, 0,  camRay[0], camRay[1], camRay[2]);
    
	var intersectionPointCC = new Point3D();
	intersectionPointCC = this.selObjMovePlaneCC.intersectionLine(this.lineCC, intersectionPointCC);
    
	var mvMat = manager.sceneState.getModelViewMatrixInv();
	var intersectionPointWC = mvMat.transformPoint3D(intersectionPointCC, intersectionPointWC);
    
	var cartographic = ManagerUtils.pointToGeographicCoord(intersectionPointWC, cartographic, this);
	if (!this.startGeoCoordDif)
	{
		var buildingGeoCoord = geoLocationData.geographicCoord;
		this.startGeoCoordDif = new GeographicCoord(cartographic.longitude-buildingGeoCoord.longitude, cartographic.latitude-buildingGeoCoord.latitude, cartographic.altitude-buildingGeoCoord.altitude);
	}
    
	var difX = cartographic.longitude - this.startGeoCoordDif.longitude;
	var difY = cartographic.latitude - this.startGeoCoordDif.latitude;
	var difZ = cartographic.altitude - this.startGeoCoordDif.altitude;
    
	if (attributes.movementInAxisZ)
	{
		//geoLocationData = ManagerUtils.calculateGeoLocationData(undefined, undefined, newAltitude, undefined, undefined, undefined, geoLocationData, this);
		manager.changeLocationAndRotationNode(this.target, undefined, undefined, difZ, undefined, undefined, undefined);
	}
	else 
	{
		//geoLocationData = ManagerUtils.calculateGeoLocationData(newLongitude, newlatitude, undefined, undefined, undefined, undefined, geoLocationData, this);
		manager.changeLocationAndRotationNode(this.target, difY, difX, undefined, undefined, undefined, undefined);
	}

	this.emit(TranslateInteraction.EVENT_TYPE.MOVING_F4D, {
		type   : TranslateInteraction.EVENT_TYPE.MOVING_F4D,
		result : this.target,
		timestamp: new Date()
	});
};

TranslateInteraction.prototype.handleObjectDrag = function(browserEvent)
{
	var selectedObjtect= this.target;
	var geoLocDataManager = this.parentNode.getNodeGeoLocDataManager();
	var buildingGeoLocation = geoLocDataManager.getCurrentGeoLocationData();
	var tMatrixInv = buildingGeoLocation.getTMatrixInv();
	var gl = this.manager.getGl();
	if (this.selObjMovePlane === undefined)
	{
		this.selObjMovePlane = new Plane();
		var sc = this.startPoint.screenCoordinate;
		var magoWC = ManagerUtils.calculatePixelPositionWorldCoord(gl, sc.x, sc.y, magoWC, undefined, undefined, undefined, this.manager);
		//var lc = tMatrixInv.transformPoint3D(magoWC, lc);
		var lc = tMatrixInv.transformPoint3D(this.startPoint.worldCoordinate, lc);

		// the plane is in local coord.***
		this.selObjMovePlane.setPointAndNormal(lc.x, lc.y, lc.z, 0.0, 0.0, 1.0);
	}

	var screenCoordinate = browserEvent.endEvent.screenCoordinate;
	this.lineSC = ManagerUtils.getRayWorldSpace(gl, screenCoordinate.x, screenCoordinate.y, this.lineSC, this.manager); // rayWorldSpace.***
	var camPosBuilding = new Point3D();
	var camDirBuilding = new Point3D();

	camPosBuilding = tMatrixInv.transformPoint3D(this.lineSC.point, camPosBuilding);
	camDirBuilding = tMatrixInv.rotatePoint3D(this.lineSC.direction, camDirBuilding);

	// now, intersect building_ray with the selObjMovePlane.***
	var line = new Line();
	line.setPointAndDir(camPosBuilding.x, camPosBuilding.y, camPosBuilding.z, camDirBuilding.x, camDirBuilding.y, camDirBuilding.z);// original.***

	var intersectionPoint = new Point3D();
	intersectionPoint = this.selObjMovePlane.intersectionLine(line, intersectionPoint);

	//the movement of an object must multiply by buildingRotMatrix.***
    
	if (selectedObjtect.moveVectorRelToBuilding === undefined)
	{ selectedObjtect.moveVectorRelToBuilding = new Point3D(); }

	if (!this.startMovPoint)
	{
		this.startMovPoint = intersectionPoint;
		this.startMovPoint.add(-selectedObjtect.moveVectorRelToBuilding.x, -selectedObjtect.moveVectorRelToBuilding.y, -selectedObjtect.moveVectorRelToBuilding.z);
	}

	var difX = intersectionPoint.x - this.startMovPoint.x;
	var difY = intersectionPoint.y - this.startMovPoint.y;
	var difZ = intersectionPoint.z - this.startMovPoint.z;

	selectedObjtect.moveVectorRelToBuilding.set(difX, difY, difZ);
	selectedObjtect.moveVector = buildingGeoLocation.tMatrix.rotatePoint3D(selectedObjtect.moveVectorRelToBuilding, selectedObjtect.moveVector); 
    
	var projectId = this.parentNode.data.projectId;
	var data_key = this.parentNode.data.nodeId;
	var objectIndexOrder = selectedObjtect._id;
    
	this.manager.config.deleteMovingHistoryObject(projectId, data_key, objectIndexOrder);
	this.manager.objectMoved = true; // this provoques that on leftMouseUp -> saveHistoryObjectMovement
};

TranslateInteraction.prototype.handleNativeDrag = function(browserEvent)
{
	var object = this.target;
	if (object instanceof ObjectMarker)
	{ return; }
	object = object.getRootOwner();

	var attributes = object.attributes;
	if (attributes === undefined)
	{ return; }
    
	var isMovable = attributes.isMovable;
	if (isMovable === undefined || isMovable === false)
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

		if (attributes.movementInAxisZ)
		{
			// movement in plane XZ.
			var globeYaxisWC = new Point3D(geoLocMatrix._floatArrays[4], geoLocMatrix._floatArrays[5], geoLocMatrix._floatArrays[6]);
			var globeYaxisCC = mvMatRelToEye.transformPoint3D(globeYaxisWC, undefined);
			this.selObjMovePlaneCC.setPointAndNormal(pixelPosCC.x, pixelPosCC.y, pixelPosCC.z,    globeYaxisCC.x, globeYaxisCC.y, globeYaxisCC.z); 
		}
		else 
		{
			// movement in plane XY.
			var globeZaxisWC = new Point3D(geoLocMatrix._floatArrays[8], geoLocMatrix._floatArrays[9], geoLocMatrix._floatArrays[10]);
			var globeZaxisCC = mvMatRelToEye.transformPoint3D(globeZaxisWC, undefined);
			this.selObjMovePlaneCC.setPointAndNormal(pixelPosCC.x, pixelPosCC.y, pixelPosCC.z,    globeZaxisCC.x, globeZaxisCC.y, globeZaxisCC.z); 
		}
	}
    
	var screenCoordinate = browserEvent.endEvent.screenCoordinate;
	var camRay = ManagerUtils.getRayCamSpace(screenCoordinate.x, screenCoordinate.y, camRay, manager);
	this.lineCC.setPointAndDir(0, 0, 0,  camRay[0], camRay[1], camRay[2]);

	// Calculate intersection cameraRay with planeCC.
	var intersectionPointCC = new Point3D();
	intersectionPointCC = this.selObjMovePlaneCC.intersectionLine(this.lineCC, intersectionPointCC);
    
	var mvMat = sceneState.getModelViewMatrixInv();
	var intersectionPointWC = mvMat.transformPoint3D(intersectionPointCC, intersectionPointWC);
    
	var cartographic = ManagerUtils.pointToGeographicCoord(intersectionPointWC, cartographic, manager);
	if (!this.startGeoCoordDif)
	{
		var buildingGeoCoord = geoLocationData.geographicCoord;
		this.startGeoCoordDif = new GeographicCoord(cartographic.longitude - buildingGeoCoord.longitude, cartographic.latitude-buildingGeoCoord.latitude, cartographic.altitude-buildingGeoCoord.altitude);
	}

	var difX = cartographic.longitude - this.startGeoCoordDif.longitude;
	var difY = cartographic.latitude - this.startGeoCoordDif.latitude;
	var difZ = cartographic.altitude - this.startGeoCoordDif.altitude;

	var attributes = object.attributes;
		
	if (attributes.minAltitude !== undefined)
	{
		if (difZ < attributes.minAltitude)
		{ difZ = attributes.minAltitude; }
	}
    
	if (attributes.maxAltitude !== undefined)
	{
		if (difZ > attributes.maxAltitude)
		{ difZ = attributes.maxAltitude; }
	}

	if (attributes && attributes.movementRestriction)
	{
		var movementRestriction = attributes.movementRestriction;
		if (movementRestriction)
		{
			var movementRestrictionType = movementRestriction.restrictionType;
			var movRestrictionElem = movementRestriction.element;
			if (movRestrictionElem && movRestrictionElem.constructor.name === "GeographicCoordSegment")
			{
				// restriction.***
				var geoCoordSegment = movRestrictionElem;
				var newGeoCoord = new GeographicCoord(difX, difY, 0.0);
				var projectedCoord = GeographicCoordSegment.getProjectedCoordToLine(geoCoordSegment, newGeoCoord, undefined);
                
				// check if is inside.***
				if (!GeographicCoordSegment.intersectionWithGeoCoord(geoCoordSegment, projectedCoord))
				{
					var nearestGeoCoord = GeographicCoordSegment.getNearestGeoCoord(geoCoordSegment, projectedCoord);
					difX = nearestGeoCoord.longitude;
					difY = nearestGeoCoord.latitude;
				}
				else 
				{
					difX = projectedCoord.longitude;
					difY = projectedCoord.latitude;
				}
			}
		}
	}
	if (attributes && attributes.hasStaticModel)
	{
		var projectId = attributes.projectId;
		var dataKey = attributes.instanceId;
		if (!defined(projectId))
		{
			return false;
		}
		if (!defined(dataKey))
		{
			return false;
		}
		var node = manager.hierarchyManager.getNodeByDataKey(projectId, dataKey);
		if (node !== undefined)
		{
			node.changeLocationAndRotation(difY, difX, 0, attributes.f4dHeading, 0, 0, this);
		}
	}

	if (attributes.movementInAxisZ)
	{
		geoLocationData = ManagerUtils.calculateGeoLocationData(undefined, undefined, difZ, undefined, undefined, undefined, geoLocationData, this);
	}
	else 
	{
		geoLocationData = ManagerUtils.calculateGeoLocationData(difX, difY, undefined, undefined, undefined, undefined, geoLocationData, this);

		if(object.localCoordListArray && object.geographicCoordListsArray) {
			var geographicCoordListsArray = [];
			var tmat = geoLocationData.tMatrix;
			for(var i=0,len=object.localCoordListArray.length; i<len; i++)
			{
				var localCoordList = object.localCoordListArray[i];
				var geographicCoordArray = [];
				for(var j=0,localCoordListLen=localCoordList.length; j<localCoordListLen;j++) {
					var lc = localCoordList[j];
					var wc = tmat.transformPoint3D(lc);
					var gc = ManagerUtils.pointToGeographicCoord(wc);
					geographicCoordArray.push(gc);
				}
				geographicCoordListsArray.push(new GeographicCoordsList(geographicCoordArray));
			}
			object.geographicCoordListsArray = geographicCoordListsArray;
		}
		if(object.options.limitationGeographicCoords)
		{
			object.makeUniformPoints2dArray();
		}
	}

	this.emit(TranslateInteraction.EVENT_TYPE.MOVING_NATIVE, {
		type   : TranslateInteraction.EVENT_TYPE.MOVING_NATIVE,
		result : this.target,
		timestamp: new Date()
	});

	object.moved();
};

TranslateInteraction.prototype.handleMoveEvent = function()
{
	return;
};

TranslateInteraction.prototype.handleUpEvent = function()
{
	var endEvent;
	if(this.target instanceof Node) {
		endEvent = TranslateInteraction.EVENT_TYPE.MOVE_END_F4D;
	} else if(this.target instanceof MagoRenderable) {
		endEvent = TranslateInteraction.EVENT_TYPE.MOVE_END_NATIVE;
	} else {
		endEvent = TranslateInteraction.EVENT_TYPE.MOVE_END_OBJECT;
	}

	this.emit(endEvent, {
		type   : endEvent,
		result : this.target,
		timestamp: new Date()
	});
	
	this.init();
	this.manager.setCameraMotion(true);
	this.manager.isCameraMoved = true;
	return;
};


TranslateInteraction.prototype.setFilterFunction = function()
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