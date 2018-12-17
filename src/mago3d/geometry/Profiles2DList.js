
'use strict';

/**
 * 어떤 일을 하고 있습니까?
 * @class Profiles2DList
 */
var Profiles2DList = function() 
{
	// Class no used.***
	if (!(this instanceof Profiles2DList)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this.profilesArray;
	this.auxiliarAxis;
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns vertexList
 */
Profiles2DList.prototype.newProfile = function() 
{
	if (this.profilesArray === undefined)
	{ this.profilesArray = []; }
	
	var profile = new Profile2D();
	this.profilesArray.push(profile);
	return profile;
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns vertexList
 */
Profiles2DList.prototype.deleteObjects = function() 
{
	if (this.profilesArray)
	{
		var profilesCount = this.profilesArray.length;
		for (var i=0; i<profilesCount; i++)
		{
			this.profilesArray[i].deleteObjects();
			this.profilesArray = undefined;
		}
		this.profilesArray = undefined;
	}
};




























