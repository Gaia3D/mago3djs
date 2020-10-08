'use strict';

/**
 * This is the interaction for draw geometry.
 * @constructor
 * @class F4dSelectInteraction
 * 
 * 
 * @param {object} option layer object.
 */
var F4dSelectInteraction = function(option) 
{
	if (!(this instanceof F4dSelectInteraction)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	option = option ? option : {};
	AbsSelectInteraction.call(this, option);
    
	this.targetHighlight = defaultValue(option.targetHighlight, true);
};
F4dSelectInteraction.prototype = Object.create(AbsSelectInteraction.prototype);
F4dSelectInteraction.prototype.constructor = F4dSelectInteraction;

F4dSelectInteraction.EVENT_TYPE = {
	'ACTIVE'  	: 'active',
	'DEACTIVE'	: 'deactive'
};
/**
 * handle event
 * @param {BrowserEvent} browserEvent
 */
F4dSelectInteraction.prototype.handleDownEvent = function(browserEvent)
{
	return throwAbstractError();
};
/**
 * handle event
 * @param {BrowserEvent} browserEvent
 */
F4dSelectInteraction.prototype.handleUpEvent = function(browserEvent)
{
	return throwAbstractError();
};

/**
 * handle event
 * @param {BrowserEvent} browserEvent
 */
F4dSelectInteraction.prototype.handleMoveEvent = function(browserEvent)
{
	if (this.targetHighlight)
	{
		var manager = this.manager;
		var gl = manager.getGl();
		if (manager.selectionFbo === undefined) 
		{ manager.selectionFbo = new FBO(gl, manager.sceneState.drawingBufferWidth, manager.sceneState.drawingBufferHeight); }
        
		var position = browserEvent.endEvent.screenCoordinate;

		manager.objectSelected = manager.getSelectedObjects(gl, position.x, position.y, manager.arrayAuxSC, true);

		var auxBuildingSelected = manager.arrayAuxSC[0];
		var auxOctreeSelected = manager.arrayAuxSC[1];
		var auxNodeSelected = manager.arrayAuxSC[3]; 

		manager.buildingSelected = auxBuildingSelected;
		manager.octreeSelected = auxOctreeSelected;
		manager.nodeSelected = auxNodeSelected;
		manager.arrayAuxSC.length = 0;
	}
};