'use strict';

/**
 * mago3D 전체 환경 설정을 관리
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

MagoConfig.deleteData = function(key) 
{
	return this.dataMap.delete(key);
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
 * F4D Converter 실행 결과물이 저장된 project data folder 명을 획득
 * @param projectDataFolder data folder
 */
MagoConfig.getProjectDataFolder = function(projectDataFolder) 
{
	var key = CODE.PROJECT_DATA_FOLDER_PREFIX + projectDataFolder;
	return this.dataMap.get(key);
};

/**
 * project map에 data folder명의 존재 유무를 검사
 * @param projectDataFolder
 */
MagoConfig.isProjectDataFolderExist = function(projectDataFolder) 
{
	var key = CODE.PROJECT_DATA_FOLDER_PREFIX + projectDataFolder;
	return this.dataMap.has(key);
};

/**
 * project data folder명을 map에서 삭제
 * @param projectDataFolder
 */
MagoConfig.deleteProjectDataFolder = function(projectDataFolder) 
{
	var key = CODE.PROJECT_DATA_FOLDER_PREFIX + projectDataFolder;
	return this.dataMap.delete(key);
};

/**
 * project data folder명을 map에서 삭제
 * @param projectDataFolder map에 저장될 key
 * @param value map에 저장될 value
 */
MagoConfig.setProjectDataFolder = function(projectDataFolder, value) 
{
	var key = CODE.PROJECT_DATA_FOLDER_PREFIX + projectDataFolder;
	if (!this.isProjectDataFolderExist(key)) 
	{
		this.dataMap.set(key, value);
	}
};

/**
 * 환경설정 초기화
 * @param serverPolicy mago3d policy(json)
 * @param projectIdArray data 정보를 map 저장할 key name
 * @param projectDataArray data 정보(json)
 */
MagoConfig.init = function(serverPolicy, projectIdArray, projectDataArray) 
{
	this.dataMap = new Map();
	this.commandCacheMap = new Map();
	this.serverPolicy = serverPolicy;
	if (projectIdArray !== null && projectIdArray.length > 0) 
	{
		for (var i=0; i<projectIdArray.length; i++) 
		{
			if (!this.isDataExist(CODE.PROJECT_ID_PREFIX + projectIdArray[i])) 
			{
				this.setData(CODE.PROJECT_ID_PREFIX + projectIdArray[i], projectDataArray[i]);
				this.setProjectDataFolder(CODE.PROJECT_DATA_FOLDER_PREFIX + projectDataArray[i].data_key, projectDataArray[i].data_key);
			}
		}
	}
};

/**
 * 모든 데이터를 삭제함
 */
MagoConfig.clearAllData = function() 
{
	this.dataMap.clear();
};
	
/**
 * TODO 이건 나중에 활요. 사용하지 않음
 * check 되지 않은 데이터들을 삭제함
 * @param keyMap 비교할 맵
 */
MagoConfig.clearUnSelectedData = function(keyMap) 
{
	for (var key of this.dataMap.keys()) 
	{
		if (!keyMap.has(key)) 
		{
			// data folder path가 존재하면....
			if (key.indexOf(CODE.PROJECT_DATA_FOLDER_PREFIX) >= 0) 
			{
				// 지우는 처리가 있어야 함
			}
			this.dataMap.delete(key);
		}
	}
};
