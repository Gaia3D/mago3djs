'use strict';

/**
 * This is the interaction for draw geometry.
 * @constructor
 * @class AbsClickInteraction
 * 
 * @abstract
 * @param {object} option layer object.
 * 
 * @see {@link http://localhost/sample/interaction.html}
 */
var AbsClickInteraction = function(option) 
{
	if (!(this instanceof AbsClickInteraction)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	option = option ? option : {};
	Interaction.call(this);
	
	if (option.handleDownEvent)
	{
		this.handleDownEvent = option.handleDownEvent;
	}

	if (option.handleUpEvent)
	{
		this.handleUpEvent = option.handleUpEvent;
	}
    
	if (option.handleMoveEvent)
	{
		this.handleMoveEvent = option.handleMoveEvent;
	}

	this.begin = false;
	this.startPoint = undefined;
	this.startTime;
	this.endPoint = undefined;

	this.tolerance = 0;
};
AbsClickInteraction.prototype = Object.create(Interaction.prototype);
AbsClickInteraction.prototype.constructor = AbsClickInteraction;

/**
 * interaction init
 */
AbsClickInteraction.prototype.init = function() 
{
	this.begin = false;
	this.startPoint = undefined;
	this.endPoint = undefined;
};
/**
 * set active. set true, this interaction active, another interaction deactive.
 * @param {boolean} active
 * @fires AbsClickInteraction#ACTIVE
 * @fires AbsClickInteraction#DEACTIVE
 */
AbsClickInteraction.prototype.setActive = function(active) 
{
	if (!this.manager || !(this.manager instanceof MagoManager)) 
	{
		throw new Error(Messages.REQUIRED_EMPTY_ERROR('MagoManager'));
	}

	if (this.active === active) { return; }
    
	this.active = active;
	if (active) 
	{
		//this.manager.interactionCollection.emit(InteractionCollection.EVENT_TYPE.ACTIVE, that);
		this.emit(InteractionActiveType.ACTIVE, this);
	}
	else 
	{
		//this.manager.interactionCollection.emit(InteractionCollection.EVENT_TYPE.DEACTIVE);
		this.emit(InteractionActiveType.DEACTIVE);
	}
};

/**
 * handle event
 * @param {BrowserEvent} browserEvent
 */
AbsClickInteraction.prototype.handle = function(browserEvent) 
{
	var type = browserEvent.type;
	if (!(type === MagoManager.EVENT_TYPE.MOUSEMOVE || type === MagoManager.EVENT_TYPE.LEFTDOWN || type === MagoManager.EVENT_TYPE.RIGHTDOWN || type === MagoManager.EVENT_TYPE.MIDDLEDOWN || type === MagoManager.EVENT_TYPE.LEFTUP || type === MagoManager.EVENT_TYPE.RIGHTUP || type === MagoManager.EVENT_TYPE.MIDDLEUP))
	{
		return false;
	}
	if (this.begin && type !== MagoManager.EVENT_TYPE.MOUSEMOVE)
	{
		this.begin = false;
		this.dragtype = undefined;
		this.endPoint = browserEvent.point;

		if ((browserEvent.timestamp - this.startTime) < 1500)
		{
			var startScreenCoordinate = this.startPoint.screenCoordinate;
			var endScreenCoordinate = this.endPoint.screenCoordinate;

			var diffX = Math.abs(startScreenCoordinate.x - endScreenCoordinate.x);
			var diffY = Math.abs(startScreenCoordinate.y - endScreenCoordinate.y);

			if (diffX <= this.tolerance && diffY  <= this.tolerance)
			{
				var that = this;
				this.manager.once('lastFrustum', function() 
				{
					that.handleUpEvent.call(that, browserEvent);
				});
			}
		}
	}
	else 
	{
		if (type === MagoManager.EVENT_TYPE.MOUSEMOVE)
		{
			this.handleMoveEvent.call(this, browserEvent);
		}
		else if(type === MagoManager.EVENT_TYPE.LEFTDOWN)
		{
			this.begin = true;
			this.startPoint = browserEvent.point;
			this.startTime = browserEvent.timestamp;

			this.handleDownEvent.call(this, browserEvent);
		}
	}
};

/**
 * handle event
 * @param {BrowserEvent} browserEvent
 */
AbsClickInteraction.prototype.handleDownEvent = function(browserEvent)
{
	return throwAbstractError();
};
/**
 * handle event
 * @param {BrowserEvent} browserEvent
 */
AbsClickInteraction.prototype.handleUpEvent = function(browserEvent)
{
	return throwAbstractError();
};

/**
 * handle event
 * @param {BrowserEvent} browserEvent
 */
AbsClickInteraction.prototype.handleMoveEvent = function(browserEvent)
{
	return throwAbstractError();
};