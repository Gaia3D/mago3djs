'use strict';

/**
 * This is the collection for Control.
 * @constructor
 * @class ControlCollection
 * 
 * @param {MagoManager} magoManager magoManager.
 */
var ControlCollection = function(magoManager)
{
	if (!(this instanceof ControlCollection)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
    
	if (!magoManager || !(magoManager instanceof MagoManager)) 
	{
		throw new Error(Messages.REQUIRED_EMPTY_ERROR('MagoManager'));
	}
	Emitter.call(this);

	this.manager = magoManager;
	this.array = [];

	this.on(ControlCollection.EVENT_TYPE.ADD, function(target)
	{
		target.setControl(magoManager);
	});
};

ControlCollection.prototype = Object.create(Emitter.prototype);
ControlCollection.prototype.constructor = ControlCollection;

ControlCollection.EVENT_TYPE = {
	'ADD': 'add'
};

/**
 * add interaction.
 * @param {AbsControl} control
 * 
 * @fires ControlCollection#EVENT_TYPE.ADD
 */
ControlCollection.prototype.add = function(control) 
{
	this.array.push(control);
	this.emit(ControlCollection.EVENT_TYPE.ADD, control);
};