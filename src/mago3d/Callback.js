'use strict';

/**
 * 선택한 object 정보를 화면에 표시
 * @param
 */
function selectedObjectCallback(functionName, projectId, blockId, objectId, latitude, longitude, elevation, heading, pitch, roll) {
    window[functionName](projectId, blockId, objectId, latitude, longitude, elevation, heading, pitch, roll);
}

/**
 * 선택한 object 정보를 화면에 표시
 * @param functionName
 * @param data_name
 * @param data_key
 * @param latitude
 * @param longitude
 * @param elevation
 */
function insertIssueCallback(functionName, data_name, data_key, latitude, longitude, elevation) {
	window[functionName](data_name, data_key, latitude, longitude, elevation);
}