'use strict';

/**
 * 환경 설정 클래스. json 으로 할까 고민도 했지만 우선은 이 형태로 하기로 함
 * @class MagoConfig
 */
var MagoConfig = {};

MagoConfig.getPolicy = function() 
{
	return this.serverPolicy;
};

MagoConfig.getData = function(key) 
{
	return this.dataMap.get(key);
};

MagoConfig.isDataExist = function(key) 
{
	return this.dataMap.has(key);
};

/**
 * data 를 map에 저장
 * @param key map에 저장될 key
 * @param value map에 저장될 value
 */
MagoConfig.setData = function(key, value) 
{
	if (!this.isDataExist(key)) 
	{
		this.dataMap.set(key, value);
	}
};

/**
 * objectIndexFile 을 map에 찾아서 돌려줌
 * @param projectId 프로젝트 id
 */
MagoConfig.getObjectIndexFile = function(projectId) 
{
	var key = CODE.OBJECT_INDEX_FILE_PREFIX + projectId;
	return this.dataMap.get(key);
};

/**
 * objectIndex가 map에 존재 하는지를 판단
 * @param key
 */
MagoConfig.isObjectIndexFileExist = function(projectId) 
{
	var key = CODE.OBJECT_INDEX_FILE_PREFIX + projectId;
	return this.dataMap.has(key);
};

/**
 * objectIndexFile 을 map에 저장
 * @param key map에 저장될 key
 * @param value map에 저장될 value
 */
MagoConfig.setObjectIndexFile = function(projectId, value) 
{
	var key = CODE.OBJECT_INDEX_FILE_PREFIX + projectId;
	if (!this.isObjectIndexFileExist(key)) 
	{
		this.dataMap.set(key, value);
	}
};

/**
 * 환경설정 세팅
 * @param type new = clear 후 새로 그림, append = 추가하여 그림
 * @param serverPolicy mago3d policy(json)
 * @param serverDataKeyArray data 정보를 map 저장할 key name
 * @param serverDataArray data 정보(json)
 */
MagoConfig.init = function(serverPolicy, serverDataKeyArray, serverDataArray) 
{
	// map에 data 와 objectIndexFile 두가지를 저장해야 할거 같다. key는 objectIndexFile 은 prefix를 붙이자.
	this.dataMap = new Map();
	this.serverPolicy = serverPolicy;
	if (serverDataKeyArray !== null && serverDataKeyArray.length > 0) 
	{
		for (var i=0; i<serverDataKeyArray.length; i++) 
		{
			if (!this.isDataExist(serverDataKeyArray[i])) 
			{
				this.dataMap.set(serverDataKeyArray[i], serverDataArray[i]);
			}
		}
	}
};

/**
 * check 되지 않은 데이터들을 삭제함
 * @param key map에 저장될 key
 * @param value map에 저장될 value
 */
MagoConfig.clearUnSelectedData = function(keyMap) 
{
	for (var key of this.dataMap.keys()) 
	{
		if (!keyMap.has(key)) 
		{
			// obectIndexFile_로 시작하는 key만 아래 처리함
			if (key.indexOf(CODE.OBJECT_INDEX_FILE_PREFIX) >= 0) 
			{
				// in this case delete all existent projects.
				//this.smartTileManager.resetTiles();
				//this.hierarchyManager.deleteNodes(this.sceneState.gl, this.vboMemoryManager);
			}
			this.dataMap.delete(key);
		}
	}
};
