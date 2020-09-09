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
	AbsClickInteraction.call(this, option);
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
	return;
};
/**
 * handle event
 * @param {BrowserEvent} browserEvent
 */
ClickInteraction.prototype.handleUpEvent = function(browserEvent)
{
	return;
};

/**
 * handle event
 * @param {BrowserEvent} browserEvent
 */
ClickInteraction.prototype.handleMoveEvent = function(browserEvent)
{
	return;
};