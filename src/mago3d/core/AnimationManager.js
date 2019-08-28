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

	// Nodes animation. Executed if the node is visible.
	this.nodesMap;	
	
	// General animations array. Executed every time.
	this.objectsMap;
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
 * put the node which will move
 * @param {Node} node
 */
AnimationManager.prototype.putObject = function(object) 
{
	if (this.objectsMap === undefined)
	{ this.objectsMap = {}; }
	
	var objectId = object.id;
	this.objectsMap[objectId] = object;
};

/**
 * Check whether this node already moved or not
 * @param {MagoManager} magoManager
 */
AnimationManager.prototype.checkAnimation = function(magoManager) 
{
	if (this.nodesMap !== undefined)
	{
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
	}
	
	// Now, for general objects.***
	if (this.objectsMap !== undefined)
	{
		var object;
		for (var key in this.objectsMap)
		{
			if (Object.prototype.hasOwnProperty.call(this.objectsMap, key))
			{
				object = this.objectsMap[key];
				if (object.finishedAnimation(magoManager))
				{
					delete this.objectsMap[key];
				}
			}
		}
	}
};

/**
 * This function returns the next position & rotation, depending the animationData type.
 */
AnimationManager.getNextPosition = function(animationData, currTime, magoManager) 
{
	if (animationData === undefined)
	{ return true; }

	// Check animationType.***
	var animType = animationData.animationType;
	if (animType === CODE.animationType.PATH)
	{
		return AnimationManager.getNextPositionByPath(animationData, currTime, magoManager);
	}
};

/**
 * This function returns the next position & rotation, for the path-animationData type.
 */
AnimationManager.getNextPositionByPath = function(animationData, currTime, magoManager) 
{
	if (animationData === undefined)
	{ return true; }

	var path = animationData.path;
	if (path === undefined)
	{ return true; }
	
	// Test for bSplineCubic3D path.***
	if (animationData.linearVelocityInMetersSecond === undefined)
	{ animationData.linearVelocityInMetersSecond = 20; } // 20m/s.***
	
	var speed = animationData.linearVelocityInMetersSecond;
	var increTimeSec = (currTime - animationData.birthTime)/1000;
	
	var linearPos = speed*increTimeSec;
	
	if (Path3D.prototype.isPrototypeOf(path))
	{
		var tangentLine = path.getTangent(linearPos, undefined, magoManager);
		
		return tangentLine;
	}
	else if (BSplineCubic3D.prototype.isPrototypeOf(path))
	{
		// If exist animationData.durationInSeconds, then use it.***
		if (animationData.durationInSeconds)
		{
			if (animationData.currentLinearPos && animationData.currentLinearPos >= animationData.totalLinearLength)
			{ return undefined; }
			
			var interpolationsCount = 20;
			if (animationData.totalLinearLength === undefined)
			{ 
				if (path.knotPoints3dList === undefined)
				{
					var controlPointArmLength = 0.3;
					path.makeControlPoints(controlPointArmLength, magoManager);
				}
				animationData.totalLinearLength = BSplineCubic3D.getLength(path, interpolationsCount); 
			}
			
			var totalLinearLength = animationData.totalLinearLength;
			var percentualTime = increTimeSec/animationData.durationInSeconds;
			linearPos = totalLinearLength*percentualTime;
			animationData.currentLinearPos = linearPos;
			if (linearPos > totalLinearLength)
			{ linearPos = totalLinearLength; }
		}
		return BSplineCubic3D.getTangent(path, linearPos, undefined, magoManager);
	}
};













































