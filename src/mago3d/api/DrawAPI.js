'use strict';

/**
 * Draw 관련 API를 담당하는 클래스
 * 원래는 이렇게 만들려고 한게 아니지만, legacy 파일이랑 이름, function 등이 중복되서 이렇게 만들었음
 * @class MagoConfig
 */
var DrawAPI = {};

DrawAPI.drawAppendData = function(api, magoManager) 
{
	var dataJson = api.getDataName();
	var projectFolderName = api.getProjectId();
	magoManager.getObjectIndexFileTEST(dataJson, projectFolderName);
};