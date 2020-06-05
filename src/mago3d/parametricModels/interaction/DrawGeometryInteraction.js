'use strict';

/**
 * This is the interaction for draw geometry.
 * @constructor
 * @class DrawGeometryInteraction
 * 
 * @abstract
 * @param {object} layer layer object.
 */
var DrawGeometryInteraction = function(style) 
{
	if (!(this instanceof DrawGeometryInteraction)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	Emitter.call(this);

	/**
	 * geometry style
	 * @type {Object}
	 * @default {}
	 */
	this.style;

	if (style) 
	{
		this.setStyle(style);
	} else {
		this.style = {}
	}
	this.manager;
	this.collection;
	this.active = false;
	this.result = [];
};
DrawGeometryInteraction.prototype = Object.create(Emitter.prototype);
DrawGeometryInteraction.prototype.constructor = DrawGeometryInteraction;

/**
 * get style
 * @return {object}
 */
DrawGeometryInteraction.prototype.getStyle = function() 
{
	return this.style;
};

/**
 * set style
 * @param {object} style
 */
DrawGeometryInteraction.prototype.setStyle = function(style) 
{
	this.style = style;
};

/**
 * set active. set true, this interaction active, another interaction deactive.
 * @param {boolean} active
 * @fires DrawGeometryInteraction#ACTIVE
 * @fires DrawGeometryInteraction#DEACTIVE
 */
DrawGeometryInteraction.prototype.setActive = function(active) 
{
	if (!this.manager || !(this.manager instanceof MagoManager)) 
	{
		throw new Error(Messages.REQUIRED_EMPTY_ERROR('MagoManager'));
	}
    
	if (!this.collection) 
	{
		this.collection = this.manager.interactions;
	}

	var that = this;
	if (active) 
	{
		this.collection.emit(InteractionCollection.EVENT_TYPE.ACTIVE, that);
	}
	else 
	{
		this.collection.emit(InteractionCollection.EVENT_TYPE.DEACTIVE);
	}
};
/**
 * get active
 * @return {boolean}
 */
DrawGeometryInteraction.prototype.getActive = function() 
{
	return this.active;
};

/**
 * @private
 */
DrawGeometryInteraction.prototype.handle = function()
{
	return abstract();
};

/**
 * make DrawGeometryInteraction. PointDrawer, LineDrawer, RectangleDrawer
 * @static
 * @param {string} type point, line, polygon, rectangle. polygon is not  ready.
 * @return {DrawGeometryInteraction}
 */
DrawGeometryInteraction.createDrawGeometryInteraction = function(type) 
{
	if (!type) 
	{
		throw new Error(Messages.REQUIRED_EMPTY_ERROR('geometry type'));
	}

	var interaction;
	switch (type)
	{
	case CODE.drawGeometryType.POINT : {
		interaction = new PointDrawer();
		break;
	}
	case CODE.drawGeometryType.LINE : {
		interaction = new LineDrawer();
		break;
	}
	case CODE.drawGeometryType.POLYGON : {
		interaction = new PolygonDrawer();
		break;
	}
	case CODE.drawGeometryType.RECTANGLE : {
		interaction = new RectangleDrawer();
		break;
	}
	}

	return interaction;
};