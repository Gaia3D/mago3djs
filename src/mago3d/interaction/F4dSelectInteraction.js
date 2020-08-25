'use strict';

/**
 * This is the interaction for draw geometry.
 * @constructor
 * @class F4dSelectInteraction
 * 
 * 
 * @param {object} option layer object.
 */
var F4dSelectInteraction = function(option) 
{
	if (!(this instanceof F4dSelectInteraction)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	option = option ? option : {};
	AbsSelectInteraction.call(this, option);
    
	this.targetHighlight = defaultValue(option.targetHighlight, false);
};
F4dSelectInteraction.prototype = Object.create(AbsSelectInteraction.prototype);
F4dSelectInteraction.prototype.constructor = F4dSelectInteraction;

F4dSelectInteraction.EVENT_TYPE = {
	'ACTIVE'  	: 'active',
	'DEACTIVE'	: 'deactive'
};
/**
 * handle event
 * @param {BrowserEvent} browserEvent
 */
F4dSelectInteraction.prototype.handleDownEvent = function(browserEvent)
{
	return;
};
/**
 * handle event
 * @param {BrowserEvent} browserEvent
 */
F4dSelectInteraction.prototype.handleUpEvent = function(browserEvent)
{
	this.select(browserEvent.point.screenCoordinate, false);
	var selectionManager = this.manager.selectionManager;

};

/**
 * handle event
 * @param {BrowserEvent} browserEvent
 */
F4dSelectInteraction.prototype.handleMoveEvent = function(browserEvent)
{
	if (this.targetHighlight)
	{
		this.select(browserEvent.endEvent.screenCoordinate, false);
	}
};