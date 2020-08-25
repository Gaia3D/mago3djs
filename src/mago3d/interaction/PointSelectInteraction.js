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
	AbsSelectInteraction.call(this, option);
	
	this.targetType = defaultValue(option.targetType, PointSelectInteraction.TARGETTYPE.F4D);
	this.targetHighlight = defaultValue(option.targetHighlight, false);
	this.selected = undefined;
};
PointSelectInteraction.prototype = Object.create(AbsSelectInteraction.prototype);
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
 * handle event
 * @param {BrowserEvent} browserEvent
 */
PointSelectInteraction.prototype.handleDownEvent = function(browserEvent)
{
	this.selected = undefined;
};
/**
 * handle event
 * @param {BrowserEvent} browserEvent
 */
PointSelectInteraction.prototype.handleUpEvent = function(browserEvent)
{
	this.select(browserEvent.point.screenCoordinate, true);
	var selectionManager = this.manager.selectionManager;
	
	switch(this.targetType)
	{
		case PointSelectInteraction.TARGETTYPE.F4D : this.selected = selectionManager.getSelectedF4dNode();break;
		case PointSelectInteraction.TARGETTYPE.OBJECT : this.selected = selectionManager.getSelectedF4dObject();break;
		case PointSelectInteraction.TARGETTYPE.NATIVE : this.selected = selectionManager.getSelectedGeneral();break;
	}
};

/**
 * handle event
 * @param {BrowserEvent} browserEvent
 */
PointSelectInteraction.prototype.handleMoveEvent = function(browserEvent)
{
	if (this.targetHighlight)
	{
		this.select(browserEvent.endEvent.screenCoordinate, true);
	}
};