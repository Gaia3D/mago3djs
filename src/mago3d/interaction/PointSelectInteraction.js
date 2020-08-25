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

	this.targetType = defaultValue(option.targetType, PointSelectInteraction.TARGETTYPE.F4D);
	this.targetHighlight = defaultValue(option.targetHighlight, true);
};
PointSelectInteraction.prototype = Object.create(AbsClickInteraction.prototype);
PointSelectInteraction.prototype.constructor = PointSelectInteraction;

PointSelectInteraction.TARGETTYPE = {
	'F4D' : 'f4d',
	'OBJECT' : 'object',
	'NATIVE' : 'native',
	'ALL'  : 'all'
}

PointSelectInteraction.EVENT_TYPE = {
	'ACTIVE'  	: 'active',
	'DEACTIVE'	: 'deactive'
};

/**
 * set TargetType
 * @param {boolean} type 
 */
PointSelectInteraction.prototype.setTargetType = function(type)
{
	this.targetType = type;
}

/**
 * get TargetType
 * @return {boolean}
 */
PointSelectInteraction.prototype.getTargetType = function()
{
	return this.targetType;
}

/**
 * set TargetHighlight
 * @param {boolean} highlight 
 */
PointSelectInteraction.prototype.setTargetHighlight = function(highlight)
{
	this.targetHighlight = highlight;
}

/**
 * get TargetHighlight
 * @return {boolean}
 */
PointSelectInteraction.prototype.getTargetHighlight = function()
{
	return this.targetHighlight;
}
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
	this.select(browserEvent.point.screenCoordinate, true);
	var selectionManager = this.manager.selectionManager;
	var oldSelected = this.selected;
	switch(this.targetType)
	{
		case PointSelectInteraction.TARGETTYPE.F4D : {
			this.selected = selectionManager.getSelectedF4dNode();
			break;
		}
		case PointSelectInteraction.TARGETTYPE.OBJECT : {
			this.selected = selectionManager.getSelectedF4dObject();
			break;
		}
		case PointSelectInteraction.TARGETTYPE.NATIVE : {
			this.selected = selectionManager.getSelectedGeneral();
			break;
		}
	}
	if(oldSelected)
	{
		this.emitEvent(oldSelected, false);
	}
	this.emitEvent(this.selected, true);
};
PointSelectInteraction.prototype.emitEvent = function(selectedObj, selected)
{
	if(selectedObj)
	{
		var type = PointSelectInteraction.getEventType(this.targetType, selected);
		var eventObj = {
			type : type,
			timestamp : new Date()
		};
		selected ? eventObj.selected = selectedObj : eventObj.deselected = selectedObj
		this.manager.emit(type, eventObj);
	}
}
PointSelectInteraction.getEventType = function(target, selected)
{
	var eventType;
	switch(target)
	{
		case PointSelectInteraction.TARGETTYPE.F4D : {
			eventType = selected ? MagoManager.EVENT_TYPE.SELECTEDF4D : MagoManager.EVENT_TYPE.DESELECTEDF4D;
			break;
		}
		case PointSelectInteraction.TARGETTYPE.OBJECT : {
			eventType = selected ? MagoManager.EVENT_TYPE.SELECTEDF4DOBJECT : MagoManager.EVENT_TYPE.DESELECTEDF4DOBJECT;
			break;
		}
		case PointSelectInteraction.TARGETTYPE.NATIVE : {
			eventType = selected ? MagoManager.EVENT_TYPE.SELECTEDGENERALOBJECT : MagoManager.EVENT_TYPE.DESELECTEDGENERALOBJECT
			break;
		}
	}
	return eventType;
}

/**
 * handle event
 * @param {BrowserEvent} browserEvent
 */
PointSelectInteraction.prototype.handleMoveEvent = function(browserEvent)
{
	if (this.targetHighlight && !this.selected)
	{
		this.select(browserEvent.endEvent.screenCoordinate, true);
	}
};

/**
 * select 
 * @param {Point2D} screenCoordinate
 * @param {boolean} bObject
 */
PointSelectInteraction.prototype.select = function(screenCoordinate, bObject)
{
	var manager = this.manager;
	var selectManager = manager.selectionManager;

	if (manager.selectionFbo === undefined) 
	{ manager.selectionFbo = new FBO(gl, manager.sceneState.drawingBufferWidth, manager.sceneState.drawingBufferHeight, {matchCanvasSize : true}); }

	var gl = manager.getGl();
	selectManager.selectObjectByPixel(gl, screenCoordinate.x, screenCoordinate.y, bObject);
}

/**
 * clear 
 */
PointSelectInteraction.prototype.clear = function()
{
	this.emitEvent(this.selected, false);
	this.manager.selectionManager.clearCurrents();
	this.init();
	this.selected = undefined;
}