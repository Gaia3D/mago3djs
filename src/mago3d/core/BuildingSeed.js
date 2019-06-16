'use strict';

/**
 * buildings seed.
 * Represent single building feature.
 * @class BuildingSeed
 */
var BuildingSeed = function() 
{
	if (!(this instanceof BuildingSeed)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	/**
	 * @type {String}
	 */
	this.fisrtName;

	/**
	 * @type {String}
	 */
	this.name = "";

	/**
	 * @type {String}
	 */
	this.buildingId;

	/**
	 * @type {String}
	 */
	this.buildingFileName;

	/**
	 * @type {GeographicCoord}
	 */
	this.geographicCoord;

	/**
	 * heading, pitch, roll
	 * @type {Point3D}
	 */
	this.rotationsDegree;

	/**
	 * @type {BoundingBox}
	 */
	this.bBox;

	/**
	 * @type {GeographicCoord}
	 */
	this.geographicCoordOfBBox; // class : GeographicCoord.

	/**
	 * @type {SmartTile}
	 */
	this.smartTileOwner;
};

/**
 * clear this instance
 */
BuildingSeed.prototype.deleteObjects = function() 
{
	this.fisrtName = undefined;
	this.name = undefined;
	this.buildingId = undefined;
	this.buildingFileName = undefined;
	
	this.geographicCoord.deleteObjects(); 
	this.rotationsDegree.deleteObjects();
	this.bBox.deleteObjects();           
	this.geographicCoordOfBBox.deleteObjects(); 
	
	this.geographicCoord = undefined; 
	this.rotationsDegree = undefined;
	this.bBox = undefined;           
	this.geographicCoordOfBBox = undefined; 
};



























