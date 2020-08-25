'use strict';

/**
 * browser event instance
 * @param {string} type required. 
 * @param {object} position is screen coord, if mousemove has startPosition and endPositon, otherwise one position
 * @param {MagoManager} magoManager 
 */
var BrowserEvent = function(type, position, magoManager) 
{

	if (!(this instanceof BrowserEvent)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
    
	if (isEmpty(type))
	{
		throw new Error(Messages.REQUIRED_EMPTY_ERROR('type'));
	}

	this.type = type;
	this.timestamp = new Date();
	if (position && typeof position === 'object') 
	{
		if (position.hasOwnProperty('x') && position.hasOwnProperty('y'))
		{
			var eventCoordinate = ManagerUtils.getComplexCoordinateByScreenCoord(magoManager.getGl(), position.x, position.y, undefined, undefined, undefined, magoManager);

			if (!eventCoordinate)
			{
				eventCoordinate = {screenCoordinate: new Point2D(position.x, position.y)};
			}
            
			this.point = eventCoordinate;
		} 
		else if (position.hasOwnProperty('startPosition') && position.hasOwnProperty('endPosition'))
		{
			var startEventCoordinate = ManagerUtils.getComplexCoordinateByScreenCoord(magoManager.getGl(), position.startPosition.x, position.startPosition.y, undefined, undefined, undefined, magoManager);
			if (!startEventCoordinate)
			{
				startEventCoordinate = {screenCoordinate: new Point2D(position.startPosition.x, position.startPosition.y)};
			}
	        var endEventCoordinate = ManagerUtils.getComplexCoordinateByScreenCoord(magoManager.getGl(), position.endPosition.x, position.endPosition.y, undefined, undefined, undefined, magoManager);
			if (!endEventCoordinate)
			{
				endEventCoordinate = {screenCoordinate: new Point2D(position.endPosition.x, position.endPosition.y)};
			}
            
			this.startEvent = startEventCoordinate;
			this.endEvent = endEventCoordinate;
		}
		else 
		{
			this.position = position;
		}
	}
};