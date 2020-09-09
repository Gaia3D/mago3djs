'use strict';

/**
 * This is the collection for Interaction.
 * @constructor
 * @class InteractionCollection
 * 
 * @param {MagoManager} magoManager magoManager.
 */
var InteractionCollection = function(magoManager)
{
	if (!(this instanceof InteractionCollection)) 
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

	var that =this;
	this.on(InteractionActiveType.ADD, function(target)
	{
		target.manager = magoManager;
	});

	/*
	this.on(InteractionCollection.EVENT_TYPE.ACTIVE, function(target)
	{
		for (var i=0, len = that.array.length; i<len; i++)
		{
			var interaction = that.array[i];
			if (interaction === target) 
			{
				interaction.active = true;
				interaction.start();
			}
			else 
			{
				interaction.active = false;
				interaction.init();
			}
		}
	});
	*/
	this.on(InteractionActiveType.DEACTIVE, function()
	{
		for (var i=0, len = that.array.length; i<len; i++)
		{
			that.array[i].clear();
			that.array[i].active = false;
		}
	});
};

InteractionCollection.prototype = Object.create(Emitter.prototype);
InteractionCollection.prototype.constructor = InteractionCollection;

InteractionCollection.EVENT_TYPE = {
	'ADD'     	: 'add'
};

/**
 * add interaction.
 * @param {DrawGeometryInteraction} interaction
 * 
 * @fires InteractionCollection#EVENT_TYPE.ADD
 */
InteractionCollection.prototype.add = function(interaction) 
{
	this.array.push(interaction);
	this.emit(InteractionActiveType.ADD, interaction);
};

/**
 * return select type
 * @param {DrawGeometryInteraction} interaction
 * @return {string}
 */
InteractionCollection.prototype.getSelectType = function() 
{
	var selects = this.array.filter(function(i)
	{
		if (i instanceof Mago3D.PointSelectInteraction) { return i; }
	});
	var pointSelectInteraction = selects[0];
	return pointSelectInteraction.targetType;
};


