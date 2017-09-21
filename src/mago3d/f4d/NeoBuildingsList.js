'use strict';

/**
 * 어떤 일을 하고 있습니까?
 * @class NeoBuildingsList
 */
var NeoBuildingsList = function() 
{
	if (!(this instanceof NeoBuildingsList)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	//Array.apply(this, arguments);

	this.neoBuildingsArray = [];
};
//NeoBuildingsList.prototype = Object.create(Array.prototype);

/**
 * 어떤 일을 하고 있습니까?
 * @returns neoBuilding
 */
NeoBuildingsList.prototype.newNeoBuilding = function() 
{
	var neoBuilding = new NeoBuilding();
	this.neoBuildingsArray.push(neoBuilding);
	return neoBuilding;
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns neoBuilding
 */
NeoBuildingsList.prototype.getNeoBuildingByTypeId = function(buildingType, buildingId) 
{
	var resultBuilding;
	var buildingsCount = this.neoBuildingsArray.length;
	var found = false;
	var i=0;
	while (!found && i < buildingsCount)
	{
		if (this.neoBuildingsArray[i].buildingType === buildingType && this.neoBuildingsArray[i].buildingId === buildingId)
		{
			found = true;
			resultBuilding = this.neoBuildingsArray[i];
		}
		i++;
	}

	return resultBuilding;
};


NeoBuildingsList.prototype.get = function (index)
{
	return this.neoBuildingsArray[index];
};

NeoBuildingsList.prototype.add = function (item)
{
	if (item !== undefined)	{ this.neoBuildingsArray.push(item); }
};