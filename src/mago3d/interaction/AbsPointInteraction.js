'use strict';

/**
 * This is the interaction for draw geometry.
 * @constructor
 * @class AbsPointInteraction
 * 
 * @abstract
 * @param {object} eventObject layer object.
 */
var AbsPointInteraction = function(eventObject) 
{
	if (!(this instanceof AbsPointInteraction)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	Interaction.call(this);
    
	this.handleDownEvent = eventObject.handleDownEvent;

	this.handleDragEvent  = eventObject.handleDragEvent;

	this.handleMoveEvent = eventObject.handleMoveEvent;

	this.handleUpEvent = eventObject.handleUpEvent;

	this.begin = false;
	this.dragging = false;
	this.startPoint = undefined;
	this.endPoint = undefined;
};
AbsPointInteraction.prototype = Object.create(Interaction.prototype);
AbsPointInteraction.prototype.constructor = AbsPointInteraction;

/**
 * interaction init
 */
AbsPointInteraction.prototype.init = function() 
{
	this.begin = false;
	this.dragging = false;
	this.startPoint = undefined;
	this.endPoint = undefined;
};
/**
 * set active. set true, this interaction active, another interaction deactive.
 * @param {boolean} active
 * @fires AbsPointInteraction#ACTIVE
 * @fires AbsPointInteraction#DEACTIVE
 */
AbsPointInteraction.prototype.setActive = function(active) 
{
	if (!this.manager || !(this.manager instanceof MagoManager)) 
	{
		throw new Error(Messages.REQUIRED_EMPTY_ERROR('MagoManager'));
	}

	if (this.active === active) { return; }
    
	var that = this;
	if (active) 
	{
		this.manager.interactions.emit(InteractionCollection.EVENT_TYPE.ACTIVE, that);
		this.emit(this.constructor.EVENT_TYPE.ACTIVE, this);
	}
	else 
	{
		this.manager.interactions.emit(InteractionCollection.EVENT_TYPE.DEACTIVE);
		this.emit(this.constructor.EVENT_TYPE.DEACTIVE);
	}
};

/**
 * start interaction
 */
AbsPointInteraction.prototype.start = function() 
{
	return throwAbstractError();
};