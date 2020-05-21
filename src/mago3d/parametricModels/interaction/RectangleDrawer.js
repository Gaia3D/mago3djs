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
    
	this.startDraw = false;
	this.dragging = false;
	this.startPoint;
	this.endPoint;

	this.tempRectangle;
	this.result;
};
RectangleDrawer.prototype = Object.create(DrawGeometryInteraction.prototype);
RectangleDrawer.prototype.constructor = RectangleDrawer;

RectangleDrawer.prototype.init = function() 
{
	this.startDraw = false;
	this.dragging = false;
	this.startPoint = undefined;
	this.endPoint = undefined;
	this.tempRectangle = undefined;
	this.manager.magoWorld.cameraMovable = true;
};
RectangleDrawer.prototype.start = function() 
{
	if (!this.manager || !(this.manager instanceof MagoManager)) 
	{
		throw new Error(Messages.REQUIRED_EMPTY_ERROR('MagoManager'));
	}
	
	var that = this;
	var manager = that.manager;

	manager.on(MagoManager.EVENT_TYPE.LEFTDOWN, function(e)
	{
		if (!that.getActive()) { return; }
		if (!that.startDraw) 
		{
			manager.magoWorld.cameraMovable = false;
			that.startDraw = true;
			that.startPoint = e.point.geographicCoordinate;
			console.info(e);
		}
	});
    
	manager.on(MagoManager.EVENT_TYPE.MOUSEMOVE, function(e)
	{
		if (!that.getActive()) { return; }
		if (that.startDraw && that.startPoint) 
		{
			that.dragging = true;
            
			var auxPoint = e.endEvent.geographicCoordinate;

			var minLon = (that.startPoint.longitude < auxPoint.longitude) ? that.startPoint.longitude : auxPoint.longitude;
			var minLat = (that.startPoint.latitude < auxPoint.latitude) ? that.startPoint.latitude : auxPoint.latitude;
			var maxLon = (that.startPoint.longitude < auxPoint.longitude) ? auxPoint.longitude : that.startPoint.longitude;
			var maxLat = (that.startPoint.latitude < auxPoint.latitude) ? auxPoint.latitude : that.startPoint.latitude;

			if (!that.tempRectangle)
			{
				var options = {
					minLongitude : minLon,
					minLatitude  : minLat,
					maxLongitude : maxLon,
					maxLatitude  : maxLat,
					altitude     : 200.0
				};
				that.tempRectangle = new MagoRectangle(options);
            
				var targetDepth = 10;
				manager.modeler.addObject(that.tempRectangle, targetDepth);
			}
			console.info(e);
		}
	});
    
	manager.on(MagoManager.EVENT_TYPE.LEFTUP, function(e)
	{
		if (!that.getActive()) { return; }
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
	this.manager.magoWorld.cameraMovable = true;
    
	console.info(this.startPoint);
	console.info(this.endPoint);


	this.result = this.tempRectangle;
	this.init();
};