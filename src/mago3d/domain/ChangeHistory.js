'use strict';

/**
 * 사용자가 변경한 moving, color, rotation 등 이력 정보를 위한 domain
 * @class Policy
 */
var ChangeHistory = function() 
{
	if (!(this instanceof ChangeHistory)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this.moveHistory = false;
	this.colorHistory = false;
	this.rotationHistory = false;
	
	// move mode. ALL : 0 , OBJECT : 1, NONE : 2
	this.objectMoveMode = null;
	
	// project id
	this.projectId = null;
	// project data folder
	this.projectDataFolder = null;
	// data_key
	this.dataKey = null;	
	// objectId
	this.objectId = null;
	// objectIndexOrder
	this.objectIndexOrder = 0;
	
	// referenceObject aditional movement.
	this.refObjectAditionalMove;
	this.refObjectAditionalMoveRelToBuilding;
	
	// 위도
	this.latitude = 0;
	// 경도
	this.longitude = 0;
	// 높이
	this.elevation = 0;
	// heading
	this.heading = 0;
	// pitch
	this.pitch = 0;
	// roll
	this.roll = 0;
	// duration
	this.duration = 0;
	// 색깔
	this.color = 0;
	// color rgb
	this.rgbColor = [];
	// 속성
	this.property = null;
};

ChangeHistory.prototype.getReferenceObjectAditionalMovement = function() 
{
	if (this.refObjectAditionalMove === undefined)
	{ this.refObjectAditionalMove = new Point3D(); }
	
	return this.refObjectAditionalMove;
};

ChangeHistory.prototype.getReferenceObjectAditionalMovementRelToBuilding = function() 
{
	if (this.refObjectAditionalMoveRelToBuilding === undefined)
	{ this.refObjectAditionalMoveRelToBuilding = new Point3D(); }
	
	return this.refObjectAditionalMoveRelToBuilding;
};

ChangeHistory.prototype.getProjectId = function() 
{
	return this.projectId;
};
ChangeHistory.prototype.setProjectId = function(projectId) 
{
	this.projectId = projectId;
};

ChangeHistory.prototype.getProjectDataFolder = function() 
{
	return this.projectDataFolder;
};
ChangeHistory.prototype.setProjectDataFolder = function(projectDataFolder) 
{
	this.projectDataFolder = projectDataFolder;
};

ChangeHistory.prototype.getDataKey = function() 
{
	return this.dataKey;
};
ChangeHistory.prototype.setDataKey = function(dataKey) 
{
	this.dataKey = dataKey;
};

ChangeHistory.prototype.getObjectId = function() 
{
	return this.objectId;
};
ChangeHistory.prototype.setObjectId = function(objectId) 
{
	this.objectId = objectId;
};

ChangeHistory.prototype.getObjectIndexOrder = function() 
{
	return this.objectIndexOrder;
};
ChangeHistory.prototype.setObjectIndexOrder = function(objectIndexOrder) 
{
	this.objectIndexOrder = objectIndexOrder;
};

ChangeHistory.prototype.getLatitude = function() 
{
	return this.latitude;
};
ChangeHistory.prototype.setLatitude = function(latitude) 
{
	this.latitude = latitude;
};

ChangeHistory.prototype.getLongitude = function() 
{
	return this.longitude;
};
ChangeHistory.prototype.setLongitude = function(longitude) 
{
	this.longitude = longitude;
};

ChangeHistory.prototype.getElevation = function() 
{
	return this.elevation;
};
ChangeHistory.prototype.setElevation = function(elevation) 
{
	this.elevation = elevation;
};

ChangeHistory.prototype.getHeading = function() 
{
	return this.heading;
};
ChangeHistory.prototype.setHeading = function(heading) 
{
	this.heading = heading;
};

ChangeHistory.prototype.getPitch = function() 
{
	return this.pitch;
};
ChangeHistory.prototype.setPitch = function(pitch) 
{
	this.pitch = pitch;
};

ChangeHistory.prototype.getRoll = function() 
{
	return this.roll;
};
ChangeHistory.prototype.setRoll = function(roll) 
{
	this.roll = roll;
};

ChangeHistory.prototype.getColor = function() 
{
	return this.color;
};
ChangeHistory.prototype.setColor = function(color) 
{
	this.color = color;
};
ChangeHistory.prototype.getRgbColor = function() 
{
	return this.rgbColor;
};
ChangeHistory.prototype.setRgbColor = function(rgbColor) 
{
	this.rgbColor = rgbColor;
};

ChangeHistory.prototype.getProperty = function() 
{
	return this.property;
};
ChangeHistory.prototype.setProperty = function(property) 
{
	this.property = property;
};

ChangeHistory.prototype.getDuration = function()
{
	return this.duration;
};
ChangeHistory.prototype.setDuration = function(duration)
{
	this.duration = duration;
};

ChangeHistory.prototype.getObjectMoveMode = function() 
{
	return this.objectMoveMode;
};
ChangeHistory.prototype.setObjectMoveMode = function(objectMoveMode) 
{
	this.objectMoveMode = objectMoveMode;
};