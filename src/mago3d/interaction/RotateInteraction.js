'use strict';

/**
 * This is the interaction for draw geometry.
 * @constructor
 * @class RotateInteraction
 * 
 * 
 * @param {object} option layer object.
 */
var RotateInteraction = function(option) 
{
	if (!(this instanceof RotateInteraction)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	option = option ? option : {};
	AbsPointerInteraction.call(this, option);
    
	this.targetType = defaultValue(option.targetType, InteractionTargetType.F4D);
	this.filter = defaultValue(option.filter, 'selected');
	this.filter_;
    

	this.target = undefined;
	this.parentNode = undefined;
	this.centerScreenCoord = undefined;
	this.clickDeg = undefined;
};
RotateInteraction.prototype = Object.create(AbsPointerInteraction.prototype);
RotateInteraction.prototype.constructor = RotateInteraction;

RotateInteraction.EVENT_TYPE = {
	'ACTIVE'  	: 'active',
	'DEACTIVE'	: 'deactive'
};
/**
 * interaction init
 * @override
 */
RotateInteraction.prototype.init = function() 
{
	this.dragging = false;
	this.mouseBtn = undefined;
	this.startPoint = undefined;
	this.endPoint = undefined;
	this.target = undefined;
	this.parentNode = undefined;
	this.centerScreenCoord = undefined;
	this.clickDeg = undefined;
};

/**
 * set TargetType
 * @param {boolean} type 
 */
RotateInteraction.prototype.setTargetType = function(type)
{
	this.targetType = type;
};

/**
 * get TargetType
 * @return {boolean}
 */
RotateInteraction.prototype.getTargetType = function()
{
	return this.targetType;
};

/**
 * set TargetType
 * @param {string} filter 
 */
RotateInteraction.prototype.setFilter = function(filter)
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
RotateInteraction.prototype.getFilter = function()
{
	return this.filter;
};

RotateInteraction.prototype.handleDownEvent = function(browserEvent)
{
	var manager = this.manager;
	if (browserEvent.type !== "leftdown") { return; }

	var selectManager = manager.selectionManager;

	if (manager.selectionFbo === undefined) 
	{ manager.selectionFbo = new FBO(gl, manager.sceneState.drawingBufferWidth, manager.sceneState.drawingBufferHeight, {matchCanvasSize: true}); }

	var gl = manager.getGl();
	var clickScreenCoord = browserEvent.point.screenCoordinate;
	selectManager.selectProvisionalObjectByPixel(gl, clickScreenCoord.x, clickScreenCoord.y);

	if (!this.filter_)
	{
		this.setFilterFunction();
	}

	var filterProvisional = selectManager.filterProvisional(this.targetType, this.filter_);

	if (!isEmpty(filterProvisional))
	{
		this.target = filterProvisional[this.targetType][0];
		if (this.targetType === InteractionTargetType.OBJECT)
		{
			this.parentNode = filterProvisional[InteractionTargetType.F4D][0];
		}
		var currentGeoLocData = this.target.getCurrentGeoLocationData();
		var currentGeoCoord = currentGeoLocData.geographicCoord;
		var wc = ManagerUtils.geographicCoordToWorldPoint(currentGeoCoord.longitude, currentGeoCoord.latitude, currentGeoCoord.altitude);
        
		this.centerScreenCoord = ManagerUtils.calculateWorldPositionToScreenCoord(undefined, wc.x, wc.y, wc.z, this.centerScreenCoord, manager);
		var rad = Math.atan2(clickScreenCoord.x - this.centerScreenCoord.x, clickScreenCoord.y - this.centerScreenCoord.y);
		this.clickDeg = Math.round((rad * (180/Math.PI) * -1) + 100);

		this.manager.setCameraMotion(false);
	}
	else 
	{
		this.init();
	}
};

RotateInteraction.prototype.handleDragEvent = function(browserEvent)
{
	if (this.target && this.dragging)
	{
		var screenCoordinate = browserEvent.endEvent.screenCoordinate;
		var rad = Math.atan2(screenCoordinate.x - this.centerScreenCoord.x, screenCoordinate.y - this.centerScreenCoord.y);
		var deg = Math.round((rad * (180/Math.PI) * -1) + 100);
		var rdeg = deg - this.clickDeg;

		var currentGeoLocData = this.target.getCurrentGeoLocationData();
		var currentGeoCoord = currentGeoLocData.geographicCoord;
		var currentLon = currentGeoCoord.longtitude;
		var currentLat = currentGeoCoord.longtitude;
		var currentAlt = currentGeoCoord.altitude;
		var currentRoll = currentGeoLocData.roll;
		var currentPitch = currentGeoLocData.pitch;

		this.target.changeLocationAndRotation(currentLon, currentLat, currentAlt, -rdeg, currentRoll, currentPitch);
	}
};

RotateInteraction.prototype.handleUpEvent = function()
{
	this.init();
	this.manager.setCameraMotion(true);
	this.manager.isCameraMoved = true;
	return;
};

RotateInteraction.prototype.handleMoveEvent = function() 
{
	return;
};

RotateInteraction.prototype.setFilterFunction = function()
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