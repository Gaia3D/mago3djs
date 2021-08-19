'use strict';

/**
 * This is the interaction for draw geometry.
 * @constructor
 * @class Interaction
 * 
 * @abstract
 * @param {object} layer layer object.
 */
var Interaction = function () 
{
	if (!(this instanceof Interaction)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	Emitter.call(this);

	this.manager;
	this.active = false;
};
Interaction.prototype = Object.create(Emitter.prototype);
Interaction.prototype.constructor = Interaction;

/**
 * set active. set true, this interaction active, another interaction deactive.
 * @param {boolean} active
 * @abstract
 */
Interaction.prototype.setActive = function(active) 
{
	return throwAbstractError();
};

/**
 * set active. set true, this interaction active, another interaction deactive.
 * @param {boolean} active
 */
Interaction.prototype.getActive = function() 
{
	return this.active;
};

/**
 * start interaction
 * @abstract
 */
Interaction.prototype.start = function() 
{
	return throwAbstractError();
};

/**
 * interaction init
 * @abstract
 */
Interaction.prototype.init = function() 
{
	return throwAbstractError();
};

/**
 * clear interaction result
 * @abstract
 */
Interaction.prototype.clear = function() 
{
	return throwAbstractError();
};

/**
 * handle event
 * @param {BrowserEvent} browserEvent
 * @abstract
 */
Interaction.prototype.handle = function(browserEvent) 
{
	return throwAbstractError();
};