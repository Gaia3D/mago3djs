'use strict';

/**
 * TestFreeContourWallBuilding geometry.
 * @class TestFreeContourWallBuilding
 */
var TestFreeContourWallBuilding = function(width, length, height, name) 
{
	MagoRenderable.call(this);
	if (!(this instanceof TestFreeContourWallBuilding)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
};

TestFreeContourWallBuilding.prototype = Object.create(MagoRenderable.prototype);
TestFreeContourWallBuilding.prototype.constructor = TestFreeContourWallBuilding;
