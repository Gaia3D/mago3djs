/* eslint-env jquery */
'use strict';

/**
 * 화면단 UI와 연동 되는 API. APIGateWay 혹은 API 클래스로 클래스명 수정 예정
 * @class MagoFacade
 */
/**
 * mago3d 활성화/비활성화
 * @param {Property} managerFactoryInstance 
 * @param {Property} isShow true = 활성화, false = 비활성화
 */
function changeMagoStateAPI(managerFactoryInstance, isShow) 
{
	var api = new API("changeMagoState");
	api.setMagoEnable(isShow);
	if (managerFactoryInstance !== null) 
	{
		managerFactoryInstance.callAPI(api);
	}
}

/**
 * render mode
 * @param {Property} managerFactoryInstance 
 * @param {Property} renderMode 0 = 호선, 1 = 지번전개
 */
function changeRenderAPI(managerFactoryInstance, renderMode) 
{
	var api = new API("changeRender");
	api.setRenderMode(renderMode);
	if (managerFactoryInstance !== null) 
	{
		managerFactoryInstance.callAPI(api);
	}
}

/**
 * outfitting 표시/비표시
 * @param {Property} managerFactoryInstance  
 * @param {Property} isShow true = 활성화, false = 비활성화
 */
function changeOutFittingAPI(managerFactoryInstance, isShow) 
{
	var api = new API("changeOutFitting");
	api.setShowOutFitting(isShow);
	if (managerFactoryInstance !== null) 
	{
		managerFactoryInstance.callAPI(api);
	}
}

/**
 * Label 표시/비표시
 * @param {Property} managerFactoryInstance 
 * @param {Property} isShow true = 표시, false = 비표시
 */
function changeLabelAPI(managerFactoryInstance, isShow) 
{
	var api = new API("changeLabel");
	api.setShowLabelInfo(isShow);
	if (managerFactoryInstance !== null) 
	{
		managerFactoryInstance.callAPI(api);
	}
}

/**
 * boundingBox 표시/비표시
 * @param {Property} managerFactoryInstance
 * @param {Property} isShow true = 활성화, false = 비활성화
 */
function changeBoundingBoxAPI(managerFactoryInstance, isShow) 
{
	var api = new API("changeBoundingBox");
	api.setShowBoundingBox(isShow);
	if (managerFactoryInstance !== null) 
	{
		managerFactoryInstance.callAPI(api);
	}
}

/**
 * 그림자 표시/비표시
 * @param {Property} managerFactoryInstance
 * @param {Property} isShow true = 활성화, false = 비활성화
 */
function changeShadowAPI(managerFactoryInstance, isShow) 
{
	var api = new API("changeShadow");
	api.setShowShadow(isShow);
	if (managerFactoryInstance !== null) 
	{
		managerFactoryInstance.callAPI(api);
	}
}

/**
 * frustum culling 가시 거리
 * @param {Property} managerFactoryInstance
 * @param {Property} frustumFarDistance frustum 거리. 내부적으로는 입력값의 제곱이 사용됨
 */
function changeFrustumFarDistanceAPI(managerFactoryInstance, frustumFarDistance) 
{
	var api = new API("changefrustumFarDistance");
	api.setFrustumFarDistance(frustumFarDistance);
	if (managerFactoryInstance !== null) 
	{
		managerFactoryInstance.callAPI(api);
	}
}

/**
 * highlighting
 * @param {Property} managerFactoryInstance
 * @param {Property} projectId 프로젝트 아이디
 * @param {Property} blockIds block id. 복수개의 경우 , 로 입력
 * @param {Property} objectIds object id. 복수개의 경우 , 로 입력
 */
function changeHighLightingAPI(managerFactoryInstance, projectId, blockIds, objectIds) 
{
	var api = new API("changeHighLighting");
	api.setProjectId(projectId);
	api.setBlockIds(blockIds);
	api.setObjectIds(objectIds);
	if (managerFactoryInstance !== null) 
	{
		managerFactoryInstance.callAPI(api);
	}
}

/**
 * color 변경
 * @param {Property} managerFactoryInstance
 * @param {Property} projectId 프로젝트 아이디
 * @param {Property} blockIds block id. 복수개의 경우 , 로 입력
 * @param {Property} objectIds object id. 복수개의 경우 , 로 입력
 * @param {Property} color R, G, B 색깔을 ',' 로 연결한 string 값을 받음.
 */
function changeColorAPI(managerFactoryInstance, projectId, blockIds, objectIds, color) 
{
	var api = new API("changeColor");
	api.setProjectId(projectId);
	api.setBlockIds(blockIds);
	api.setObjectIds(objectIds);
	api.setColor(color);
	if (managerFactoryInstance !== null) 
	{
		managerFactoryInstance.callAPI(api);
	}
}

/**
 * location and rotation 변경
 * @param {Property} managerFactoryInstance
 * @param {Property} data_key
 * @param {Property} latitude 위도
 * @param {Property} longitude 경도
 * @param {Property} height 높이
 * @param {Property} heading 좌, 우
 * @param {Property} pitch 위, 아래
 * @param {Property} roll 좌, 우 기울기
 */
function changeLocationAndRotationAPI(managerFactoryInstance, data_key, latitude, longitude, height, heading, pitch, roll) 
{
	var api = new API("changeLocationAndRotation");
	api.setDataKey(data_key);
	api.setLatitude(latitude);
	api.setLongitude(longitude);
	api.setElevation(height);
	api.setHeading(heading);
	api.setPitch(pitch);
	api.setRoll(roll);
	if (managerFactoryInstance !== null) 
	{
		managerFactoryInstance.callAPI(api);
	}
}

/**
 * 마우스 클릭 객체 이동 대상 변경
 * @param {Property} managerFactoryInstance
 * @param {Property} mouseMoveMode 0 = All, 1 = object, 2 = None
 */
function changeMouseMoveAPI(managerFactoryInstance, mouseMoveMode) 
{
	var api = new API("changeMouseMove");
	api.setMouseMoveMode(mouseMoveMode);
	if (managerFactoryInstance !== null) 
	{
		managerFactoryInstance.callAPI(api);
	}
}

/**
 * 이슈 등록 활성화 유무
 * @param {Property} managerFactoryInstance
 * @param {Property} flag true = 활성화, false = 비활성화
 */
function changeInsertIssueModeAPI(managerFactoryInstance, flag) 
{
	var api = new API("changeInsertIssueMode");
	api.setIssueInsertEnable(flag);
	if (managerFactoryInstance !== null) 
	{
		managerFactoryInstance.callAPI(api);
	}
}

/**
 * object 정보 표시 활성화 유무
 * @param {Property} managerFactoryInstance
 * @param {Property} flag true = 활성화, false = 비활성화
 */
function changeObjectInfoViewModeAPI(managerFactoryInstance, flag) 
{
	var api = new API("changeObjectInfoViewMode");
	api.setObjectInfoViewEnable(flag);
	if (managerFactoryInstance !== null) 
	{
		managerFactoryInstance.callAPI(api);
	}
}

/**
 * Object Occlusion culling
 * @param {Property} managerFactoryInstance
 * @param {Property} flag true = 활성화, false = 비활성화
 * @param {Property} dataKey
 */
function changeOcclusionCullingAPI(managerFactoryInstance, flag, dataKey) 
{
	var api = new API("changeOcclusionCulling");
	api.setOcclusionCullingEnable(flag);
	api.setDataKey(dataKey);
	if (managerFactoryInstance !== null) 
	{
		managerFactoryInstance.callAPI(api);
	}
}

/**
 * 1인칭, 3인칭 모드 개발중...
 * @param {Property} managerFactoryInstance
 * @param {Property} flag true = 활성화, false = 비활성화
 */
function changeFPVModeAPI(managerFactoryInstance, flag)
{
	var api = new API("changeFPVMode");
	api.setFPVMode(flag);
	if (managerFactoryInstance !== null) 
	{
		managerFactoryInstance.callAPI(api);
	}
}

/**
 * 현재 위치 근처 issue list. false인 경우 clear
 * @param {Property} managerFactoryInstance
 * @param {Property} flag true = 활성화, false = 비활성화
 */
function changeNearGeoIssueListViewModeAPI(managerFactoryInstance, flag) 
{
	var api = new API("changeNearGeoIssueListViewMode");
	api.setNearGeoIssueListEnable(flag);
	if (managerFactoryInstance !== null) 
	{
		managerFactoryInstance.callAPI(api);
	}
}

/**
 * TODO 이건 위에 이슈 등록 활성화, 비활성화 api로 통합이 가능할거 같음
 * issue 등록 geo 정보 관련 상태 변경
 * @param {Property} managerFactoryInstance
 * @param {Property} insertIssueState 이슈 등록 좌표 상태
 */
function changeInsertIssueStateAPI(managerFactoryInstance, insertIssueState) 
{
	var api = new API("changeInsertIssueState");
	api.setInsertIssueState(insertIssueState);
	if (managerFactoryInstance !== null) 
	{
		managerFactoryInstance.callAPI(api);
	}
}

/**
 * LOD 설정을 변경
 * @param {Property} managerFactoryInstance
 * @param {Property} lod0DistInMeters
 * @param {Property} lod1DistInMeters
 * @param {Property} lod2DistInMeters
 * @param {Property} lod3DistInMeters
 */
function changeLodAPI(managerFactoryInstance, lod0DistInMeters, lod1DistInMeters, lod2DistInMeters, lod3DistInMeters)
{
	var api = new API("changeLod");
	api.setLod0DistInMeters(lod0DistInMeters);
	api.setLod1DistInMeters(lod1DistInMeters);
	api.setLod2DistInMeters(lod2DistInMeters);
	api.setLod3DistInMeters(lod3DistInMeters);
	if (managerFactoryInstance !== null) 
	{
		managerFactoryInstance.callAPI(api);
	}
}

/**
 * Lighting 설정
 * @param {Property} managerFactoryInstance
 * @param {Property} ambientReflectionCoef
 * @param {Property} diffuseReflectionCoef
 * @param {Property} specularReflectionCoef
 * @param {Property} ambientColor
 * @param {Property} specularColor
 */
function changeLightingAPI(managerFactoryInstance, ambientReflectionCoef, diffuseReflectionCoef, specularReflectionCoef, ambientColor, specularColor)
{
	var api = new API("changeLighting");
	api.setAmbientReflectionCoef(ambientReflectionCoef);
	api.setDiffuseReflectionCoef(diffuseReflectionCoef);
	api.setSpecularReflectionCoef(specularReflectionCoef);
	api.setAmbientColor(ambientColor);
	api.setSpecularColor(specularColor);
	if (managerFactoryInstance !== null) 
	{
		managerFactoryInstance.callAPI(api);
	}
}

/**
 * SSAD Radius 설정
 * @param {Property} managerFactoryInstance
 * @param {Property} ssaoRadius
 */
function changeSsadRadiusAPI(managerFactoryInstance, ssaoRadius)
{
	var api = new API("changeSsadRadius");
	api.setSsaoRadius(ssaoRadius);
	if (managerFactoryInstance !== null) 
	{
		managerFactoryInstance.callAPI(api);
	}
}

/**
 * 화면에 있는 모든 데이터를 삭제, 비표시
 * @param {Property} managerFactoryInstance
 */
function clearAllDataAPI(managerFactoryInstance)
{	
	var api = new API("clearAllData");
	if (managerFactoryInstance !== null) 
	{
		MagoConfig.clearAllData();
		managerFactoryInstance.callAPI(api);
	}
}

/**
 * pin image를 그림
 * @param {Property} managerFactoryInstance
 * @param {Property} drawType 이미지를 그리는 유형 0 : DB, 1 : 이슈등록
 * @param {Property} issue_id 이슈 고유키
 * @param {Property} issue_type 이슈 고유키
 * @param {Property} data_key 데이터 고유키
 * @param {Property} latitude 데이터 고유키
 * @param {Property} longitude 데이터 고유키
 * @param {Property} height 데이터 고유키
 */
function drawInsertIssueImageAPI(managerFactoryInstance, drawType, issue_id, issue_type, data_key, latitude, longitude, height) 
{
	var api = new API("drawInsertIssueImage");
	api.setDrawType(drawType);
	api.setIssueId(issue_id);
	api.setIssueId(issue_type);
	api.setDataKey(data_key);
	api.setLatitude(latitude);
	api.setLongitude(longitude);
	api.setElevation(height);
	if (managerFactoryInstance !== null) 
	{
		managerFactoryInstance.callAPI(api);
	}
}

/**
 * 마우스를 사용할 수 없는 환경에서 버튼 이벤트로 대체
 * @param {Property} managerFactoryInstance
 * @param {Property} eventType 어떤 마우스 동작을 원하는지를 구분
 */
function mouseMoveAPI(managerFactoryInstance, eventType) 
{
	if (managerFactoryInstance !== null) 
	{
		managerFactoryInstance.mouseMove(eventType);
	}
}

/**
 * 데이터 검색
 * @param {Property} managerFactoryInstance
 * @param {Property} dataKey 데이터 고유키
 */
function searchDataAPI(managerFactoryInstance, dataKey) 
{
	var api = new API("searchData");
	api.setDataKey(dataKey);
	if (managerFactoryInstance !== null) 
	{
		managerFactoryInstance.callAPI(api);
	}
}

/**
 * 환경 설정 data map에 key 값의 존재 유무를 판별
 * @param key 검색 키
 * @param 
 */
function isDataExistAPI(key) {
	if (MagoConfig.isDataExist(key)) return true;
	else return false;
}

/**
 * 데이터를 Rendering
 * @param {Property} managerFactoryInstance
 * @param dataNameArray target data 이름 배열
 * @param dataUrlArray data를 가져올 url 배열
 * @param dataArray data를 배열
 * @param objectIndexFilePathArray objectIndexFile 배열
 * @param 
 */
function drawAppendDataAPI(managerFactoryInstance, dataNameArray, dataUrlArray, dataArray, objectIndexFilePathArray) 
{
	if (dataNameArray.length <= 0) { return; }
	
	var api = new API("drawAppendData");
	dataNameArray.forEach(function(dataName, index) 
	{
		if (managerFactoryInstance !== null) 
		{
			MagoConfig.setData(dataName, dataArray[index]);
			MagoConfig.setObjectIndexFile(objectIndexFilePathArray[index], objectIndexFilePathArray[index]);
			
			api.setDataName(dataName);
			api.setProjectId(dataArray[index].data_key);
			managerFactoryInstance.callAPI(api);
		}
	});
}
