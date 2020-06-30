'use strict';

/**
 * This is the interaction for draw polyline.
 * Last point use 'right click'
 * @class LineDrawer
 * 
 * @param {MagoPolyline~MagoPolylineStyle} style line style object.
 * 
 * @extends {DrawGeometryInteraction}
 */
var LineDrawer = function(style) 
{
	if (!(this instanceof LineDrawer)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	DrawGeometryInteraction.call(this, style);
    
	this.points = [];
	this.height = 200;

	this.tempLine;
	this.result = [];
};
LineDrawer.prototype = Object.create(DrawGeometryInteraction.prototype);
LineDrawer.prototype.constructor = LineDrawer;

LineDrawer.EVENT_TYPE = {
	'DRAWEND': 'drawend'
};
/**
 * @private
 */
LineDrawer.prototype.setHeight = function(height) 
{
	this.height = height;
};
/**
 * @private
 */
LineDrawer.prototype.getHeight = function() 
{
	return this.height;
};
/**
 * @private
 */
LineDrawer.prototype.init = function() 
{
	this.points = [];
	this.tempLine = undefined;
	clearTimeout(this.timeout);
};
/**
 * @private
 */
LineDrawer.prototype.clear = function() 
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
/**
 * @private
 */
LineDrawer.prototype.start = function() 
{
	if (!this.manager || !(this.manager instanceof MagoManager)) 
	{
		throw new Error(Messages.REQUIRED_EMPTY_ERROR('MagoManager'));
	}
	
	var that = this;
	var manager = that.manager;
    
	manager.on(MagoManager.EVENT_TYPE.LEFTUP, function(e)
	{
		if (!that.getActive()) { return; }

		that.points.push(e.point.geographicCoordinate);
	});

	manager.on(MagoManager.EVENT_TYPE.MOUSEMOVE, function(e)
	{
		if (!that.getActive()) { return; }
		if (that.points.length > 0) 
		{   
			var clonePoints = that.points.slice();
			var auxPoint = e.endEvent.geographicCoordinate;
			clonePoints.push(auxPoint);
            
			var position = {coordinates: clonePoints};
			if (!that.tempLine)
			{
				if (Object.keys(that.style).length < 1) 
				{
					that.style = {
						color     : '#ff0000',
						thickness : 2.0
					};
				}
				
				that.tempLine = new MagoPolyline(position, that.style);
				manager.modeler.magoRectangle = that.tempLine;
			}
			else 
			{
				that.tempLine.init(manager);
				that.tempLine.setPosition(position);
			}
		}
	});
    
	manager.on(MagoManager.EVENT_TYPE.RIGHTCLICK, function(e)
	{
		if (!that.getActive() || !that.tempLine) { return; }
		that.points.push(e.clickCoordinate.geographicCoordinate);

		var position = {coordinates: that.points};
		that.tempLine.init(manager);
		that.tempLine.setPosition(position);
        
		that.end();
	});
};
/**
 * @private
 */
LineDrawer.prototype.end = function()
{
	this.result.push(this.tempLine);

	this.manager.modeler.addObject(this.tempLine, 1);

	this.emit(LineDrawer.EVENT_TYPE.DRAWEND, this.tempLine);
	this.init();
};