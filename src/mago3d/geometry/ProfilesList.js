
'use strict';

/**
 * 어떤 일을 하고 있습니까?
 * @class ProfilesList
 */
var ProfilesList = function() 
{
	if (!(this instanceof ProfilesList)) 
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
ProfilesList.prototype.newProfile = function() 
{
	if (this.profilesArray === undefined)
	{ this.profilesArray = []; }
	
	var profile = new Profile();
	this.profilesArray.push(profile);
	return profile;
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns vertexList
 */
ProfilesList.prototype.deleteObjects = function() 
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




























