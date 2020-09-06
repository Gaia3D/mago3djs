'use strict';

/**
 * This is the interaction for draw geometry.
 * @constructor
 * @class ClickInteraction
 * 
 * @abstract
 * @param {object} option layer object.
 */
var ClickInteraction = function(option) 
{
	if (!(this instanceof ClickInteraction)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	option = option ? option : {};
	AbsClickInteraction.call(this);
	
	if (option.handleDownEvent)
	{
		this.handleDownEvent = option.handleDownEvent;
	}

	if (option.handleUpEvent)
	{
		this.handleUpEvent = option.handleUpEvent;
	}
    
	if (option.handleMoveEvent)
	{
		this.handleMoveEvent = option.handleMoveEvent;
	}

	this.begin = false;
	this.startPoint = undefined;
	this.startTime;
	this.endPoint = undefined;

	this.tolerance = 0;
};
ClickInteraction.prototype = Object.create(AbsClickInteraction.prototype);
ClickInteraction.prototype.constructor = ClickInteraction;

/**
 * interaction init
 */
ClickInteraction.prototype.init = function() 
{
	this.begin = false;
	this.startPoint = undefined;
	this.endPoint = undefined;
};

/**
 * handle event
 * @param {BrowserEvent} browserEvent
 */
ClickInteraction.prototype.handleDownEvent = function(browserEvent)
{
	this.emit(InteractionEventType.LEFTMOUSEDOWN,  {
        type   : InteractionEventType.LEFTMOUSEDOWN,
        position : browserEvent.point,
        timestamp: new Date()
    });
};
/**
 * handle event
 * @param {BrowserEvent} browserEvent
 */
ClickInteraction.prototype.handleUpEvent = function(browserEvent)
{
	this.emit(InteractionEventType.LEFTMOUSEUP,  {
        type   : InteractionEventType.LEFTMOUSEUP,
        position : browserEvent.point,
        timestamp: new Date()
    });
};

/**
 * handle event
 * @param {BrowserEvent} browserEvent
 */
ClickInteraction.prototype.handleMoveEvent = function(browserEvent)
{
	return;
};