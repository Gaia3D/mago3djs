'use strict';

/**
 * This is the interaction for draw geometry.
 * @constructor
 * @class GeometrySelectInteraction
 * 
 * 
 * @param {object} option layer object.
 */
var PointSelectInteraction = function(option) 
{
	if (!(this instanceof PointSelectInteraction)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	option = option ? option : {};
	AbsClickInteraction.call(this, option);
	
	this.selected = undefined;

	this.targetType = defaultValue(option.targetType, DataType.F4D);
	this.targetHighlight = defaultValue(option.targetHighlight, true);
	this.filter = undefined;

	var that = this;
	this.on(PointSelectInteraction.EVENT_TYPE.DEACTIVE, function()
	{
		that.init();
		that.selected = undefined;
		that.manager.selectionManager.clearCurrents();
	});
};
PointSelectInteraction.prototype = Object.create(AbsClickInteraction.prototype);
PointSelectInteraction.prototype.constructor = PointSelectInteraction;

PointSelectInteraction.EVENT_TYPE = {
	'ACTIVE'  	: 'active',
	'DEACTIVE'	: 'deactive'
};
/**
 * interaction init
 */
PointSelectInteraction.prototype.init = function() 
{
	this.begin = false;
	this.startPoint = undefined;
	this.endPoint = undefined;
};
/**
 * set TargetType
 * @param {boolean} type 
 */
PointSelectInteraction.prototype.setTargetType = function(type)
{
	var oldType = this.targetType;
	if (oldType !== type)
	{
		this.init();
		this.selected = undefined;
		this.manager.isCameraMoved = true;
		this.manager.selectionManager.clearCurrents();
		this.filter = undefined;
	}
	this.targetType = type;
};

/**
 * get TargetType
 * @return {boolean}
 */
PointSelectInteraction.prototype.getTargetType = function()
{
	return this.targetType;
};

/**
 * set filter function
 * @param {function} filterFunction
 */
PointSelectInteraction.prototype.setFilter = function(filterFunction)
{
	if(filterFunction && typeof filterFunction === 'function') {
		this.filter = filterFunction;
	}
};

/**
 * set filter function
 * @param {function} filterFunction
 */
PointSelectInteraction.prototype.getFilter = function(filterFunction)
{
	return this.filter;
};

/**
 * set TargetHighlight
 * @param {boolean} highlight 
 */
PointSelectInteraction.prototype.setTargetHighlight = function(highlight)
{
	if (!highlight)
	{
		this.init();
		this.manager.selectionManager.clearCurrents();
	}
	this.targetHighlight = highlight;
};

/**
 * get selected object
 * @return {Object}
 */
PointSelectInteraction.prototype.getSelected = function()
{
	return this.selected;
};

/**
 * get TargetHighlight
 * @return {boolean}
 */
PointSelectInteraction.prototype.getTargetHighlight = function()
{
	return this.targetHighlight;
};
/**
 * handle event
 * @param {BrowserEvent} browserEvent
 */
PointSelectInteraction.prototype.handleDownEvent = function(browserEvent)
{
	return;
};
/**
 * handle event
 * @param {BrowserEvent} browserEvent
 */
PointSelectInteraction.prototype.handleUpEvent = function(browserEvent)
{
	var selectionManager = this.manager.selectionManager;
	selectionManager.clearCurrents();
	this.select(browserEvent.point.screenCoordinate);
	var oldSelected = this.selected;
	switch (this.targetType)
	{
	case DataType.F4D : {
		this.selected = selectionManager.getSelectedF4dNode();
		break;
	}
	case DataType.OBJECT : {
		this.selected = selectionManager.getSelectedF4dObject();
		break;
	}
	case DataType.NATIVE : {
		this.selected = selectionManager.getSelectedGeneral();
		break;
	}
	}
	if (oldSelected)
	{
		this.emitEvent(oldSelected, false);
	}
	this.emitEvent(this.selected, true);
};
PointSelectInteraction.prototype.emitEvent = function(selectedObj, selected)
{
	if (selectedObj)
	{
		var type = PointSelectInteraction.getEventType(this.targetType, selected);
		var eventObj = {
			type      : type,
			timestamp : new Date()
		};
		selected ? eventObj.selected = selectedObj : eventObj.deselected = selectedObj;
		this.manager.emit(type, eventObj);
	}
};
PointSelectInteraction.getEventType = function(target, selected)
{
	var eventType;
	switch (target)
	{
	case DataType.F4D : {
		eventType = selected ? MagoManager.EVENT_TYPE.SELECTEDF4D : MagoManager.EVENT_TYPE.DESELECTEDF4D;
		break;
	}
	case DataType.OBJECT : {
		eventType = selected ? MagoManager.EVENT_TYPE.SELECTEDF4DOBJECT : MagoManager.EVENT_TYPE.DESELECTEDF4DOBJECT;
		break;
	}
	case DataType.NATIVE : {
		eventType = selected ? MagoManager.EVENT_TYPE.SELECTEDGENERALOBJECT : MagoManager.EVENT_TYPE.DESELECTEDGENERALOBJECT;
		break;
	}
	}
	return eventType;
};

/**
 * handle event
 * @param {BrowserEvent} browserEvent
 */
PointSelectInteraction.prototype.handleMoveEvent = function(browserEvent)
{
	if (this.targetHighlight && !this.selected)
	{
		this.select(browserEvent.endEvent.screenCoordinate);
	}
};

/**
 * select 
 * @param {Point2D} screenCoordinate
 * @param {boolean} bObject
 */
PointSelectInteraction.prototype.select = function(screenCoordinate)
{
	var manager = this.manager;
	var selectManager = manager.selectionManager;

	if (manager.selectionFbo === undefined) 
	{ manager.selectionFbo = new FBO(gl, manager.sceneState.drawingBufferWidth[0], manager.sceneState.drawingBufferHeight[0], {matchCanvasSize: true}); }

	var gl = manager.getGl();
	selectManager.selectProvisionalObjectByPixel(gl, screenCoordinate.x, screenCoordinate.y);
	selectManager.provisionalToCurrent(this.targetType, this.filter);
	
	//selectManager.selectObjectByPixel(gl, screenCoordinate.x, screenCoordinate.y, bObject);
};

/**
 * clear 
 */
PointSelectInteraction.prototype.clear = function()
{
	this.emitEvent(this.selected, false);
	this.manager.selectionManager.clearCurrents();
	this.init();
	this.selected = undefined;
};