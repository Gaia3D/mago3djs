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
 * @param serverData data 정보(json)
 */
MagoConfig.init = function(serverPolicy, serverData) 
{
	this.serverPolicy = serverPolicy;
	this.serverData = serverData;
};
