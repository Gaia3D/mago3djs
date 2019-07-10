'use strict';

/**
 * AnimationManager
 * @class AnimationManager
 */
var AnimationManager = function() 
{
	if (!(this instanceof AnimationManager)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this.nodesMap;	
};

/**
 * put the node which will move
 * @param {Node} node
 */
AnimationManager.prototype.putNode = function(node) 
{
	if (this.nodesMap === undefined)
	{ this.nodesMap = {}; }
	
	var nodeId = node.data.nodeId;
	this.nodesMap[nodeId] = node;
};

/**
 * Check whether this node already moved or not
 * @param {MagoManager} magoManager
 */
AnimationManager.prototype.checkAnimation = function(magoManager) 
{
	if (this.nodesMap === undefined)
	{ return; }
	
	var node;
	for (var key in this.nodesMap)
	{
		if (Object.prototype.hasOwnProperty.call(this.nodesMap, key))
		{
			node = this.nodesMap[key];
			if (node.finishedAnimation(magoManager))
			{
				delete this.nodesMap[key];
			}
		}
	}
};

/**
 * This function returns the next position & rotation, depending the animationData type.
 */
AnimationManager.getNextPosition = function(animationData, currTime) 
{
	if (animationData === undefined)
	{ return true; }

	// Check animationType.***
	var animType = animationData.animationType;
	if (animType === CODE.animationType.PATH)
	{
		return AnimationManager.getNextPositionByPath(animationData, currTime);
	}
};

/**
 * This function returns the next position & rotation, for the path-animationData type.
 */
AnimationManager.getNextPositionByPath = function(animationData, currTime) 
{
	if (animationData === undefined)
	{ return true; }

	var path = animationData.path;
	if (path === undefined)
	{ return true; }
	
	// Test for bSplineCubic3D path.***
	if (animationData.linearVelocityInMetersSecond === undefined)
	{ animationData.linearVelocityInMetersSecond = 20; } // 4m/s.***
	
	var speed = animationData.linearVelocityInMetersSecond;
	var increTimeSec = (currTime - animationData.birthTime)/1000;
	
	var linearPos = speed*increTimeSec;
	
	if (BSplineCubic3D.prototype.isPrototypeOf(path))
	{
		var tangentLine = BSplineCubic3D.getTangent(path, linearPos, undefined);
		
		return tangentLine;
	}
};













































