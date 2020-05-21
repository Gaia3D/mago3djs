'use strict';

/**
 * This is the interaction for draw rectangle.
 * @class RectangleDrawer
 * 
 * @param {object} style style object.
 */

var RectangleDrawer = function(style) 
{
	if (!(this instanceof RectangleDrawer)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	DrawGeometryInteraction.call(this, style);
    
	this.startDraw = false;
	this.dragging = false;
	this.startPoint;
	this.endPoint;

	this.tempRectangle;
	this.result = [];
};
RectangleDrawer.prototype = Object.create(DrawGeometryInteraction.prototype);
RectangleDrawer.prototype.constructor = RectangleDrawer;

RectangleDrawer.EVENT_TYPE = {
	'DRAWEND': 'drawend'
};

RectangleDrawer.prototype.init = function() 
{
	this.startDraw = false;
	this.dragging = false;
	this.startPoint = undefined;
	this.endPoint = undefined;
	this.tempRectangle = undefined;
	this.manager.magoWorld.cameraMovable = true;
};
RectangleDrawer.prototype.clear = function() 
{
	this.init();
	var modeler = this.manager.modeler;
	var result = this.result;
	for (var i=0, len=result.length;i < len; i++) 
	{
		var rec = result[i];
		modeler.removeObject(rec);
	}
	this.result.length = 0;
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

			var position = {
				minLongitude : minLon,
				minLatitude  : minLat,
				maxLongitude : maxLon,
				maxLatitude  : maxLat,
				altitude     : 200.0
			};

			if (!that.tempRectangle)
			{
				if (Object.keys(that.style).length < 1) 
				{
					that.style = {
						fillColor: '#ff0000'
					};
				}
				
				that.tempRectangle = new MagoRectangle(position, that.style);
				manager.modeler.magoRectangle = that.tempRectangle;
			}
			else 
			{
				that.tempRectangle.init(manager);
				that.tempRectangle.setPosition(position);
			}
		}
	});
    
	manager.on(MagoManager.EVENT_TYPE.LEFTUP, function(e)
	{
		if (!that.getActive()) { return; }
		if (that.dragging) 
		{
			that.endPoint = e.point;
			that.end();
		}
	});
};

RectangleDrawer.prototype.end = function()
{
	this.manager.magoWorld.cameraMovable = true;

	this.result.push(this.tempRectangle);

	this.manager.modeler.addObject(this.tempRectangle, 1);

	this.emit(RectangleDrawer.EVENT_TYPE.DRAWEND, this.tempRectangle);
	this.init();
};