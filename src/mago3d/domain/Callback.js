'use strict';

/**
 * api 처리 결과를 담당하는 callback function
 * @param functionName policy json의 geo_callback_apiresult 속성값
 * @param apiName 호출한 api 이름
 * @param result 결과값
 */
function apiResultCallback(functionName, apiName, result) 
{
	window[functionName](apiName, result);
}

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
function selectedObjectCallback(functionName, dataKey, objectId, latitude, longitude, elevation, heading, pitch, roll)
{
	window[functionName](dataKey, objectId, latitude, longitude, elevation, heading, pitch, roll);
}

/**
 * Data Key 를 이용하여 Geo Spatial Info를 획득하여 화면에 표시
 * @param data_key
 * @param dataName
 * @param latitude
 * @param longitude
 * @param elevation
 * @param heading
 * @param pitch
 * @param roll
 * @param
 */
function dataInfoCallback(functionName, dataKey, dataName, latitude, longitude, elevation, heading, pitch, roll)
{
    window[functionName](dataKey, dataName, latitude, longitude, elevation, heading, pitch, roll);
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
function insertIssueCallback(functionName, dataKey, objectId, latitude, longitude, elevation)
{
	window[functionName](dataKey, objectId, latitude, longitude, elevation);
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
