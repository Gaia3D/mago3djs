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
 * 환경설정 세팅
 * 
 * @param serverPolicy mago3d policy(json)
 * @param serverDataKey data 정보를 map 저장할 key name
 * @param serverData data 정보(json)
 */
MagoConfig.init = function(serverPolicy, serverDataKey, serverData) 
{
	this.dataMap = new Map();
	this.serverPolicy = serverPolicy;
	if(serverDataKey !== null && serverDataKey !== '') {
		this.dataMap.set(serverDataKey, serverData);
		this.serverData = serverData;
	}
};
