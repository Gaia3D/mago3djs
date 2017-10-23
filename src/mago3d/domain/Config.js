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

MagoConfig.getData = function() 
{
	return this.serverData;
};

/**
 * data 를 map에 저장
 * @param type new = clear 후 새로 그림, append = 추가하여 그림
 * @param key map에 저장될 key
 * @param value map에 저장될 value
 */
MagoConfig.setData = function(type, key, value) 
{
	if(type === "new") {
		this.dataMap.clear();
		this.dataMap.set(key, value);
	} else if(type === "append") {
		this.dataMap.set(key, value);
	}
		
};

/**
 * objectIndexFile 을 map에 저장
 * @param type new = clear 후 새로 그림, append = 추가하여 그림
 * @param key map에 저장될 key
 * @param value map에 저장될 value
 */
MagoConfig.setObjectIndex = function(type, projectId, value) 
{
	var key = "objectIndex_" + projectId;
	if(type === "new") {
		this.dataMap.clear();
		this.dataMap.set(key, value);
	} else if(type === "append") {
		this.dataMap.set(key, value);
	}
		
};

/**
 * 환경설정 세팅
 * @param type new = clear 후 새로 그림, append = 추가하여 그림
 * @param serverPolicy mago3d policy(json)
 * @param serverDataKey data 정보를 map 저장할 key name
 * @param serverData data 정보(json)
 */
MagoConfig.init = function(type, serverPolicy, serverDataKey, serverData) 
{
	// map에 data 와 objectIndexFile 두가지를 저장해야 할거 같다. key는 objectIndexFile 은 prefix를 붙이자.
	this.dataMap = new Map();
	this.serverPolicy = serverPolicy;
	if(serverDataKey !== null && serverDataKey !== '') {
		if(type === "new") {
			this.dataMap.clear();
			this.dataMap.set(serverDataKey, serverData);
		} else if(type === "append") {
			this.dataMap.set(serverDataKey, serverData);
		}
		this.serverData = serverData;
	}
};
