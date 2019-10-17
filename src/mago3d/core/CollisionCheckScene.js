'use strict';

/**
 * @class CollisionCheckScene
 * 
 */
var CollisionCheckScene = function() 
{
	if (!(this instanceof CollisionCheckScene)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
	// Check hero (node) with others objects (Extras).
	this.hero;
	this.extrasArray;
};

/**
 * 어떤 일을 하고 있습니까?
 */
CollisionCheckScene.prototype.doCheck = function() 
{
	if (this.hero === undefined)
	{ return false; }
	
	if (this.extrasArray === undefined || this.extrasArray.length === 0)
	{ return false; }

	var heroNeoBuilding = hero.data.neobuilding;
	if (heroNeoBuilding === undefined)
	{ return false; }

	var heroCollisionOctree = heroNeoBuilding.getCollisionCheckOctree();
	if (heroCollisionOctree === undefined)
	{ return false; }

	var extrasCount = this.extrasArray.length;
	for (var i=0; i<extrasCount; i++)
	{
		var extra = this.extrasArray[i];
		
	}
	
};

/**
 * 어떤 일을 하고 있습니까?
 */
CollisionCheckScene.prototype.checkCollision = function(collisionOctreeA, collisionOctreeB) 
{
	if (collisionOctreeA === undefined || collisionOctreeB === undefined)
	{ return; }

	
};