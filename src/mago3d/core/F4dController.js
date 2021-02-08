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

	this.smartTilePathInfo = {};

};

F4dController.prototype = Object.create(Emitter.prototype);
F4dController.prototype.constructor = F4dController;

/**
 * f4d smarttile data group 등록
 * @param {Array<object> | object} f4dObject f4d smarttile data group
 */
F4dController.prototype.addSmartTileGroup = function(f4dObject) 
{
	var magoManager = this.magoManager;
	if (Array.isArray(f4dObject)) 
	{
		for (var i=0, len=f4dObject.length;i<len;i++) 
		{
			this.addSmartTileGroup(f4dObject[i]);
		}
	} 
	else 
	{
		var groupId = f4dObject.data_key || f4dObject.dataGroupId;
		var groupDataFolder;
		var groupKey;
		var attributes;

		var metaInfo = f4dObject.metainfo;
		if (metaInfo && typeof metaInfo === 'string')
		{
			metaInfo = JSON.parse(metaInfo);
		}

		if (f4dObject.data_key) 
		{
			groupDataFolder = groupId;
			groupKey = groupId;
		}
		else 
		{
			groupDataFolder = f4dObject.dataGroupPath;
			groupDataFolder = groupDataFolder.replace(/\/+$/, '');

			groupKey = f4dObject.dataGroupKey;
		}

		if (!this.smartTilePathInfo[groupKey])
		{
			this.smartTilePathInfo[groupKey] = {};
		}

		this.smartTilePathInfo[groupKey].attributes = f4dObject.attributes || metaInfo;
		this.smartTilePathInfo[groupKey].projectId = groupId;
		this.smartTilePathInfo[groupKey].projectFolderPath = groupDataFolder;
		//this.smartTilePathInfo[groupKey].smartTileIndexPath = groupDataFolder + '/' + groupKey + '_TILE';

		if (f4dObject.smartTileIndexPath) 
		{
			magoManager.getObjectIndexFileSmartTileF4d(f4dObject.smartTileIndexPath);
		}
	}
};
/**
 * Object literal with config options for f4d layer.
 * @typedef {Object} f4dLayerObject
 * @property {string} dataGroupId Required. f4d 레이어의 고유 아이디.
 * @property {string} dataGroupKey Required. 레이어 폴더 매칭 키
 * @property {string} dataGroupName Required. 레이어 명
 * @property {string} dataGroupPath Required. 레이어 폴더 경로
 * @property {boolean} tiling optional. 타일링 유무
 * @property {Array<f4dObject>} datas optional. 해당 레이어에 포함된 f4d 목록
 * @property {number} longitude optional. 데이터 그룹 대표 경도, big decimal을 희망함..
 * @property {number} latitude optional. 데이터 그룹 대표 위도, big decimal을 희망함..
 * @property {number} altitude optional. 데이터 그룹 대표 높이, 숫자형태면 무관.
 * @property {Untitled} Untitled optional. 데이터 표출 옵션.
 */

/**
 * Object literal with config options for f4d data.
 * @typedef {Object} f4dObject
 * @property {string} dataId Required. 데이터  고유 아이디
 * @property {string} dataGroupId Required. 데이터의 레이어 아이디
 * @property {string} dataKey Required. 데이터 폴더명
 * @property {string} dataName Required. 데이터 이름
 * @property {string} dataType optional. 데이터 타입. 
 * @property {string} mappingType optional. case 'origin', 'boundingboxcenter', boudingboxbottomcenter'. default is 'origin' 
 * @property {number} longitude Required. 경도, big decimal을 희망함..
 * @property {number} latitude Required. 위도, big decimal을 희망함..
 * @property {number} altitude optional. 높이, 숫자형태면 무관. default is 0.
 * @property {number} heading optional. heading, big decimal을 희망함.. default is 0.
 * @property {number} pitch optional. pitch, big decimal을 희망함.. default is 0.
 * @property {number} roll optional. roll, big decimal을 희망함.. default is 0.
 * @property {Untitled} Untitled optional. 데이터 표출 옵션.
 */

/**
 * f4d data group 등록
 * @param {Array<f4dLayerObject> | f4dLayerObject} f4dLayerObject f4d data definition object
 */
F4dController.prototype.addF4dGroup = function(f4dLayerObject) 
{
	// TODO : validate f4dObject.
	//F4dController.f4dObjectValidate()
	//do add f4d group
	var magoManager = this.magoManager;
	if (Array.isArray(f4dLayerObject)) 
	{
		for (var i=0, len=f4dLayerObject.length;i<len;i++) 
		{
			this.addF4dGroup(f4dLayerObject[i]);
		}
	}
	else 
	{
		var groupId = f4dLayerObject.data_key || f4dLayerObject.dataKey || f4dLayerObject.dataGroupId;
		var groupDataFolder;

		if (f4dLayerObject.data_key) 
		{
			groupDataFolder = groupId;
		}
		else 
		{
			groupDataFolder = f4dLayerObject.dataGroupPath;
			groupDataFolder = groupDataFolder.replace(/\/+$/, '');
		}

		this.magoManager.config.setData(CODE.PROJECT_ID_PREFIX + groupId, f4dLayerObject);
		this.magoManager.config.setProjectDataFolder(CODE.PROJECT_DATA_FOLDER_PREFIX + groupDataFolder, groupDataFolder);
        
		magoManager.getObjectIndexFile(groupId, groupDataFolder);
	}
};

/**
 * f4d data를 등록
 * @param {string} groupId required. target group id
 * @param {Array<f4dObject> | f4dObject} f4dObject f4d data definition object
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

	var nodeMap = this.magoManager.hierarchyManager.getNodesMap(groupId);
	if (!nodeMap) 
	{
		throw new Error(groupId + ' group is no exists.');
	}

	var keys = Object.keys(nodeMap);
	for (var i=0, len=keys.length;i<len;i++) 
	{
		var key = keys[i];
		if (key === 'attributes') 
		{
			continue;
		}
		
		var item = nodeMap[keys[i]];
		if (!item.data.attributes.isPhysical) 
		{
			continue;
		}

		this.deleteF4dMember(groupId, key);
	}

	delete this.magoManager.hierarchyManager.projectsMap[groupId];
};

/**
 * f4d data를 삭제
 * @param {string} groupId required. target group id
 * @param {string} memberId f4d data definition object
 * @param {boolean} silence 
 */
F4dController.prototype.deleteF4dMember = function(groupId, memberId, silence) 
{
	if (!groupId) 
	{
		throw new Error('groupId is required.');
	}
	if (memberId === undefined || memberId === null) 
	{
		throw new Error('memberId is required.');
	}

	var node = this.magoManager.hierarchyManager.getNodeByDataKey(groupId, memberId);
	if (!node) 
	{
		throw new Error('node is no exists.');
	}

	var smartTile = node.data.smartTileOwner;
	if (smartTile) 
	{
		smartTile.eraseNode(node);
	}

	if(this.magoManager.defaultSelectInteraction.selected === node)
	{
		this.magoManager.defaultSelectInteraction.clear(silence);
	}

	this.magoManager.selectionManager.removeF4d(node);
	
	node.deleteObjects(this.magoManager.sceneState.gl, this.magoManager.vboMemoryManager);
	delete this.magoManager.hierarchyManager.projectsMap[groupId][memberId];
};

/**
 * f4d data를 반환
 * @param {string} groupId required. target group id
 * @param {string} memberId f4d data definition object
 */
F4dController.prototype.getF4d = function(groupId, memberId) 
{
	if (!groupId) 
	{
		throw new Error('groupId is required.');
	}
	if (memberId === undefined || memberId === null) 
	{
		throw new Error('memberId is required.');
	}

	return this.magoManager.hierarchyManager.getNodeByDataKey(groupId, memberId);
};

/**
 * f4d data를 반환
 * @param {string} groupId required. target group id
 */
F4dController.prototype.getF4dGroup = function(groupId) 
{
	if (!groupId) 
	{
		throw new Error('groupId is required.');
	}

	return this.magoManager.hierarchyManager.projectsMap[groupId];
};

/**
 * return static model project id list
 * @return {Array<string>}
 */
F4dController.prototype.getStaticModelGroupKeys = function() 
{
	var groupKeys = [];
	var staticModelsManager = this.magoManager.hierarchyManager.staticModelsManager;
	if(staticModelsManager) 
	{
		if(staticModelsManager.staticModelsMap){
			groupKeys = Object.keys(staticModelsManager.staticModelsMap);
		}
	}

	return groupKeys;
}

/**
 * return static model data (Node) object
 * obejct key equal group key(project id)
 * object values equal static model object, have data in group
 * static model object key equal instance id, and value equal instance (Node)
 * @return {object}
 */
F4dController.prototype.getStaticModelObject = function() 
{
	var groupKeys = this.getStaticModelGroupKeys();
	var obj;
	for(var i=0,groupKeyLenth=groupKeys.length; i<groupKeyLenth; i++) {
		var groupKey = groupKeys[i];
		var group = this.getF4dGroup(groupKey);
		if(!obj) obj={};

		obj[groupKey] = group;
	}

	return obj;
}

F4dController.f4dObjectValidate = function(f4dObject) 
{
	console.info(f4dObject);
};