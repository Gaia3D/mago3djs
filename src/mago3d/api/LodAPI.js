'use strict';

/**
 * lod 처리 관련 도메인
 * @class LodAPI
 */
var LodAPI = {};

LodAPI.changeLod = function(api, magoManager) 
{
	if(api.getLod0DistInMeters() !== null && api.getLod0DistInMeters() !== "") magoManager.magoPolicy.setLod0DistInMeters(api.getLod0DistInMeters());
	if(api.getLod1DistInMeters() !== null && api.getLod1DistInMeters() !== "") magoManager.magoPolicy.setLod1DistInMeters(api.getLod1DistInMeters());
	if(api.getLod2DistInMeters() !== null && api.getLod2DistInMeters() !== "") magoManager.magoPolicy.setLod2DistInMeters(api.getLod2DistInMeters());
	if(api.getLod3DistInMeters() !== null && api.getLod3DistInMeters() !== "") magoManager.magoPolicy.setLod3DistInMeters(api.getLod3DistInMeters());
	if(api.getLod4DistInMeters() !== null && api.getLod4DistInMeters() !== "") magoManager.magoPolicy.setLod4DistInMeters(api.getLod4DistInMeters());
	if(api.getLod5DistInMeters() !== null && api.getLod5DistInMeters() !== "") magoManager.magoPolicy.setLod5DistInMeters(api.getLod5DistInMeters());
};