'use strict';

/**
 * 선택한 object 정보를 화면에 표시
 * @param data_key
 * @param objectId
 * @param latitude
 * @param longitude
 * @param elevation
 * @param heading
 * @param pitch
 * @param roll
 * @param
 */
function selectedObjectCallback(functionName, data_key, objectId, latitude, longitude, elevation, heading, pitch, roll) 
{
	window[functionName](data_key, objectId, latitude, longitude, elevation, heading, pitch, roll);
}

/**
 * 선택한 object 정보를 화면에 표시
 * @param functionName
 * @param data_key
 * @param objectId
 * @param latitude
 * @param longitude
 * @param elevation
 */
function insertIssueCallback(functionName, data_key, objectId, latitude, longitude, elevation) 
{
	window[functionName](data_key, objectId, latitude, longitude, elevation);
}

/**
 * mouse click 위치 정보를 화면에 표시
 * @param functionName
 * @param position
 */
function clickPositionCallback(functionName, position) 
{
	window[functionName](position);
}
