'use strict';

/**
 * This is the interaction for draw geometry.
 * @constructor
 * @class GeometrySelectInteraction
 * 
 * 
 * @param {object} option layer object.
 */
var PointSelectInteraction = function(option) 
{
	if (!(this instanceof PointSelectInteraction)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	option = option ? option : {};
	AbsClickInteraction.call(this, option);
	
	this.selected = undefined;

	this.targetType = defaultValue(option.targetType, DataType.F4D);
	this.targetHighlight = defaultValue(option.targetHighlight, true);

	this._initFilter();
	

	var that = this;
	this.on(PointSelectInteraction.EVENT_TYPE.DEACTIVE, function()
	{
		that.init();
		that.selected = undefined;
		that.manager.selectionManager.clearCurrents();
	});
};
PointSelectInteraction.prototype = Object.create(AbsClickInteraction.prototype);
PointSelectInteraction.prototype.constructor = PointSelectInteraction;

PointSelectInteraction.EVENT_TYPE = {
	'ACTIVE'  	: 'active',
	'DEACTIVE'	: 'deactive'
};
/**
 * interaction init
 */
PointSelectInteraction.prototype.init = function() 
{
	this.begin = false;
	this.startPoint = undefined;
	this.endPoint = undefined;
};

PointSelectInteraction.prototype._initFilter = function() {
	this.filter = {};

	for(var type in DataType) {
		if(DataType.hasOwnProperty(type))
		{
			var dataType = DataType[type];

			if( dataType !== DataType.ALL 
				&& typeof dataType !== 'function') {
				this.filter[dataType] = TRUE;
			}
		}
	}
}
/**
 * set TargetType
 * @param {boolean} type 
 */
PointSelectInteraction.prototype.setTargetType = function (type)
{
	var oldType = this.targetType;
	if (oldType !== type)
	{
		this.init();
		this.selected = undefined;
		this.manager.isCameraMoved = true;
		if(this.manager.selectionManager) this.manager.selectionManager.clearCurrents();
		this._initFilter();
	}
	this.targetType = type;
};

/**
 * get TargetType
 * @return {boolean}
 */
PointSelectInteraction.prototype.getTargetType = function()
{
	return this.targetType;
};

/**
 * set filter function
 * @param {String} dataType DataType. Required
 * @param {function} filterFunction
 */
PointSelectInteraction.prototype.setFilter = function(dataType, filterFunction)
{
	if(!dataType || !DataType.hasOwnProperty(DataType.getKey(dataType))) {
		throw new Error('dataType is required.'); 
	}

	if(!filterFunction || typeof filterFunction !== 'function') filterFunction = TRUE;

	this.filter[dataType] = filterFunction;
};

/**
 * get filter function
 * @param {string} dataType
 * @return {function}
 */
PointSelectInteraction.prototype.getFilter = function(dataType)
{
	return this.filter[dataType];
};

/**
 * set TargetHighlight
 * @param {boolean} highlight 
 */
PointSelectInteraction.prototype.setTargetHighlight = function(highlight)
{
	if (!highlight)
	{
		this.init();
		if(this.manager.selectionManager) this.manager.selectionManager.clearCurrents();
	}
	this.targetHighlight = highlight;
};

/**
 * get selected object
 * @return {Object}
 */
PointSelectInteraction.prototype.getSelected = function()
{
	return this.selected;
};

/**
 * get TargetHighlight
 * @return {boolean}
 */
PointSelectInteraction.prototype.getTargetHighlight = function()
{
	return this.targetHighlight;
};
/**
 * handle event
 * @param {BrowserEvent} browserEvent
 */
PointSelectInteraction.prototype.handleDownEvent = function(browserEvent)
{
	return;
};
/**
 * handle event
 * @param {BrowserEvent} browserEvent
 */
PointSelectInteraction.prototype.handleUpEvent = function(browserEvent)
{
	var selectionManager = this.manager.selectionManager;
	selectionManager.clearCurrents();

	var screenCoord = browserEvent.point.screenCoordinate;
	this.select(screenCoord);
	var oldSelected = this.selected;
	switch (this.targetType)
	{
	case DataType.F4D : {
		this.selected = selectionManager.getSelectedF4dNode();
		break;
	}
	case DataType.OBJECT : {
		this.selected = selectionManager.getSelectedF4dObject();
		break;
	}
	case DataType.NATIVE : {
		this.selected = selectionManager.getSelectedGeneral();
		break;
	}
	case DataType.ALL : {
		this.selected = selectionManager.getSelectedF4dNode() || selectionManager.getSelectedGeneral();
		break;
	}
	}
	if (oldSelected)
	{
		this.emitEvent(oldSelected, false, screenCoord);
	}
	this.emitEvent(this.selected, true, screenCoord);
};
PointSelectInteraction.prototype.emitEvent = function (selectedObj, selected, screenCoord)
{
	if (selectedObj)
	{
		var type = PointSelectInteraction.getEventType(this.targetType, selected, selectedObj);
		var eventObj = {
			type      : type,
			pixel : screenCoord,
			timestamp : new Date()
		};
		selected ? eventObj.selected = selectedObj : eventObj.deselected = selectedObj;
		if(this.targetType === DataType.OBJECT) {
			eventObj.f4d = this.manager.selectionManager.getSelectedF4dNode();
		}
		
		this.manager.emit(type, eventObj);
	}
};
PointSelectInteraction.getEventType = function(target, selected, selectedObj)
{
	var eventType;
	switch (target)
	{
	case DataType.F4D : {
		eventType = selected ? MagoManager.EVENT_TYPE.SELECTEDF4D : MagoManager.EVENT_TYPE.DESELECTEDF4D;
		break;
	}
	case DataType.OBJECT : {
		eventType = selected ? MagoManager.EVENT_TYPE.SELECTEDF4DOBJECT : MagoManager.EVENT_TYPE.DESELECTEDF4DOBJECT;
		break;
	}
	case DataType.NATIVE : {
		eventType = selected ? MagoManager.EVENT_TYPE.SELECTEDGENERALOBJECT : MagoManager.EVENT_TYPE.DESELECTEDGENERALOBJECT;
		break;
	}
	case DataType.ALL : {
		var selectedType = (selectedObj instanceof Node) ? DataType.F4D : DataType.NATIVE;
		return PointSelectInteraction.getEventType(selectedType, selected);
	}
 	}
	return eventType;
};

/**
 * handle event
 * @param {BrowserEvent} browserEvent
 */
PointSelectInteraction.prototype.handleMoveEvent = function(browserEvent)
{
	if (this.targetHighlight && !this.selected)
	{
		this.select(browserEvent.endEvent.screenCoordinate);
	}
};

/**
 * select 
 * @param {Point2D} screenCoordinate
 * @param {boolean} bObject
 */
PointSelectInteraction.prototype.select = function (screenCoordinate)
{
	var manager = this.manager;
	var selectManager = manager.selectionManager;

	if (manager.selectionFbo === undefined) 
	{ manager.getSelectionFBO(); }

	var gl = manager.getGl();
	selectManager.selectProvisionalObjectByPixel(gl, screenCoordinate.x, screenCoordinate.y);

	if(this.targetType === DataType.ALL) {
		selectManager.provisionalToCurrent(DataType.F4D, this.filter[DataType.F4D]);
		selectManager.provisionalToCurrent(DataType.NATIVE, this.filter[DataType.NATIVE], true);
	} else {
		selectManager.provisionalToCurrent(this.targetType, this.filter[this.targetType]);
	}
};

/**
 * clear 
 * @param {boolean} silence 
 */
PointSelectInteraction.prototype.clear = function(silence)
{
	if(!silence) {
		this.emitEvent(this.selected, false);
	}
	
	if(this.manager.selectionManager) this.manager.selectionManager.clearCurrents();
	this.init();
	this.selected = undefined;
};