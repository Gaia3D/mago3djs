'use strict';

/**
 * This is the interaction for draw point.
 * @class PointDrawer
 * 
 * @param {object} layer layer object.
 */

var PointDrawer = function(style) 
{
	if (!(this instanceof PointDrawer)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	DrawGeometryInteraction.call(this, style);

	this.startDraw = false;
	this.result = [];
};
PointDrawer.prototype = Object.create(DrawGeometryInteraction.prototype);
PointDrawer.prototype.constructor = PointDrawer;

PointDrawer.EVENT_TYPE = {
	'DRAWEND': 'drawend'
};

PointDrawer.prototype.init = function() 
{
	this.startDraw = false;
};
PointDrawer.prototype.clear = function() 
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
PointDrawer.prototype.start = function() 
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
			that.startDraw = true;
		}
	});
	manager.on(MagoManager.EVENT_TYPE.LEFTUP, function(e)
	{
		if (!that.getActive()) { return; }
		if (that.startDraw) 
		{
			var position = e.point.geographicCoordinate;
            
			if (!that.style) 
			{
				that.style = {
					size  : 10,
					color : '#00FF00'
				};
			}

			that.end(new MagoPoint(position, that.style));
		}
	});
};

PointDrawer.prototype.end = function(point)
{
	this.result.push(point);
	this.manager.modeler.addObject(point, 1);
    
	this.emit(PointDrawer.EVENT_TYPE.DRAWEND, point);
	this.init();
};