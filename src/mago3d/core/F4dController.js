'use strict';

/**
 * Mago3d's format 'F4D' type data controller.
 * @class F4dController
 * 
 * @param {MagoManager} magoManager
 */
var F4dController = function(magoManager) 
{

	if (!(this instanceof F4dController)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	if (!magoManager || !magoManager instanceof MagoManager) 
	{
		throw new Error('magoManager is required.');
	}
	Emitter.call(this);

	this.magoManager = magoManager;

};

F4dController.prototype = Object.create(Emitter.prototype);
F4dController.prototype.constructor = F4dController;

/**
 * f4d data group 등록
 * @param {Array<object> | object} f4dObject f4d data definition object
 */
F4dController.prototype.addF4dGroup = function(f4dObject) 
{
	// TODO : validate f4dObject.
	//F4dController.f4dObjectValidate()
	//do add f4d group
	var magoManager = this.magoManager;
	if (Array.isArray(f4dObject)) 
	{
		for (var i=0, len=f4dObject.length;i<len;i++) 
		{
			this.addF4dGroup(f4dObject[i]);
		}
	}
	else 
	{
		var groupId = f4dObject.data_key || f4dObject.dataKey || f4dObject.dataGroupId;
		var groupDataFolder;

		if (f4dObject.data_key) 
		{
			groupDataFolder = groupId;
		}
		else 
		{
			groupDataFolder = f4dObject.dataGroupPath;
			groupDataFolder = groupDataFolder.replace(/\/+$/, '');
		}

		MagoConfig.setData(CODE.PROJECT_ID_PREFIX + groupId, f4dObject);
		MagoConfig.setProjectDataFolder(CODE.PROJECT_DATA_FOLDER_PREFIX + groupDataFolder, groupDataFolder);
        
		magoManager.getObjectIndexFile(groupId, groupDataFolder);
	}
};

/**
 * f4d data를 등록
 * @param {string} groupId required. target group id
 * @param {Array<object> | object} f4dObject f4d data definition object
 */
F4dController.prototype.addF4dMember = function(groupId, f4dObject) 
{
	if (!groupId) 
	{
		throw new Error('groupId is required.');
	}

	this.magoManager.getObjectIndexFileForData(groupId, f4dObject);
};

/**
 * f4d group 삭제
 * @param {string} groupId required. target group id
 * @param {Array<object>} f4dObjectArray f4d data definition object
 */
F4dController.prototype.deleteF4dGroup = function(groupId) 
{
	if (!groupId) 
	{
		throw new Error('groupId is required.');
	}
};

/**
 * f4d data를 삭제
 * @param {string} groupId required. target group id
 * @param {Array<object>} f4dObjectArray f4d data definition object
 */
F4dController.prototype.deleteF4dMember = function(groupId, memberId) 
{
	if (!groupId) 
	{
		throw new Error('groupId is required.');
	}
	if (!memberId) 
	{
		throw new Error('memberId is required.');
	}
    
};

F4dController.f4dObjectValidate = function(f4dObject) 
{
	console.info(f4dObject);
};