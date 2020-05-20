'use strict';

/**
 * This is the interaction for draw rectangle.
 * @class RectangleDrawer
 * 
 * @param {object} layer layer object.
 */

var RectangleDrawer = function() 
{
	if (!(this instanceof RectangleDrawer)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	DrawGeometryInteraction.call(this);
    
	this.start = false;
	this.dragging = false;
	this.startPoint;
	this.endPoint;


	this.temp = [];
};
RectangleDrawer.prototype = Object.create(DrawGeometryInteraction.prototype);
RectangleDrawer.prototype.constructor = RectangleDrawer;

RectangleDrawer.prototype.init = function() 
{
	this.start = false;
	this.dragging = false;
	this.startPoint = undefined;
	this.endPoint = undefined;
};
RectangleDrawer.prototype.start = function() 
{
	if (!this.manager || !(this.manager instanceof MagoManager)) 
	{
		throw new Error(Messages.REQUIRED_EMPTY_ERROR('MagoManager'));
	}
	
	var that = this;
	var manager = that.manager;
	manager.magoWorld.cameraMovable = false;

	manager.on(MagoManager.EVENT_TYPE.LEFTDOWN, function(e)
	{
		if (!that.start) 
		{
			that.start = true;
			that.startPoint = e.point.geographicCoordinate;
			console.info(e);
		}
	});
    
	manager.on(MagoManager.EVENT_TYPE.MOUSEMOVE, function(e)
	{
		if (that.start && that.startPoint) 
		{
			that.dragging = true;
			console.info(e);
		}
	});
    
	manager.on(MagoManager.EVENT_TYPE.LEFTUP, function(e)
	{
		if (that.dragging) 
		{
			console.info(e);
			that.endPoint = e.point;
			that.end();
		}
	});
};

RectangleDrawer.prototype.end = function(start, end)
{
	manager.magoWorld.cameraMovable = true;
    
	console.info(this.startPoint);
	console.info(this.endPoint);

	this.init();
};