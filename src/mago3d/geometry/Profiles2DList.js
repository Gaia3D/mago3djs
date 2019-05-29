
'use strict';

/**
 * the list of the features of Profile2D
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
 * create new feature of Profile2D and push it at the list
 * @returns {Profile2D} profile
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
 * Clear all the features of this list
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




























