/* eslint-env jquery */
'use strict';

/**
 * 화면단 UI와 연동 되는 API. APIGateWay 혹은 API 클래스로 클래스명 수정 예정
 * @class MagoFacade
 */
/**
 * mago3d 활성화/비활성화
 * 
 * @param {Property} isShow true = 활성화, false = 비활성화
 */
function changeMagoStateAPI(isShow) 
{
	var api = new API("changeMagoState");
	api.setMagoEnable(isShow);
	if (managerFactory !== null) 
	{
		managerFactory.callAPI(api);
	}
}

/**
 * render mode
 * 
 * @param {Property} renderMode 0 = 호선, 1 = 지번전개
 */
function changeRenderAPI(renderMode) 
{
	var api = new API("changeRender");
	api.setRenderMode(renderMode);
	if (managerFactory !== null) 
	{
		managerFactory.callAPI(api);
	}
}

/**
 * outfitting 표시/비표시
 * 
 * @param {Property} isShow true = 활성화, false = 비활성화
 */
function changeOutFittingAPI(isShow) 
{
	var api = new API("changeOutFitting");
	api.setShowOutFitting(isShow);
	if (managerFactory !== null) 
	{
		managerFactory.callAPI(api);
	}
}

/**
 * Label 표시/비표시
 * 
 * @param {Property} isShow true = 표시, false = 비표시
 */
function changeLabelAPI(isShow) 
{
	var api = new API("changeLabel");
	api.setShowLabelInfo(isShow);
	if (managerFactory !== null) 
	{
		managerFactory.callAPI(api);
	}
}

/**
 * boundingBox 표시/비표시
 * 
 * @param {Property} isShow true = 활성화, false = 비활성화
 */
function changeBoundingBoxAPI(isShow) 
{
	var api = new API("changeBoundingBox");
	api.setShowBoundingBox(isShow);
	if (managerFactory !== null) 
	{
		managerFactory.callAPI(api);
	}
}

/**
 * 그림자 표시/비표시
 * 
 * @param {Property} isShow true = 활성화, false = 비활성화
 */
function changeShadowAPI(isShow) 
{
	var api = new API("changeShadow");
	api.setShowShadow(isShow);
	if (managerFactory !== null) 
	{
		managerFactory.callAPI(api);
	}
}

/**
 * frustum culling 가시 거리
 * 
 * @param {Property} frustumFarDistance frustum 거리. 내부적으로는 입력값의 제곱이 사용됨
 */
function changeFrustumFarDistanceAPI(frustumFarDistance) 
{
	var api = new API("changefrustumFarDistance");
	api.setFrustumFarDistance(frustumFarDistance);
	if (managerFactory !== null) 
	{
		managerFactory.callAPI(api);
	}
}

/**
 * highlighting
 * 
 * @param {Property} projectId 프로젝트 아이디
 * @param {Property} blockIds block id. 복수개의 경우 , 로 입력
 * @param {Property} objectIds object id. 복수개의 경우 , 로 입력
 */
function changeHighLightingAPI(projectId, blockIds, objectIds) 
{
	var api = new API("changeHighLighting");
	api.setProjectId(projectId);
	api.setBlockIds(blockIds);
	api.setObjectIds(objectIds);
	if (managerFactory !== null) 
	{
		managerFactory.callAPI(api);
	}
}

/**
 * color 변경
 * 
 * @param {Property} projectId 프로젝트 아이디
 * @param {Property} blockIds block id. 복수개의 경우 , 로 입력
 * @param {Property} objectIds object id. 복수개의 경우 , 로 입력
 * @param {Property} color R, G, B 색깔을 ',' 로 연결한 string 값을 받음.
 */
function changeColorAPI(projectId, blockIds, objectIds, color) 
{
	var api = new API("changeColor");
	api.setProjectId(projectId);
	api.setBlockIds(blockIds);
	api.setObjectIds(objectIds);
	api.setColor(color);
	if (managerFactory !== null) 
	{
		managerFactory.callAPI(api);
	}
}

/**
 * location and rotation 변경
 * 
 * @param {Property} data_key
 * @param {Property} latitude 위도
 * @param {Property} longitude 경도
 * @param {Property} height 높이
 * @param {Property} heading 좌, 우
 * @param {Property} pitch 위, 아래
 * @param {Property} roll 좌, 우 기울기
 */
function changeLocationAndRotationAPI(data_key, latitude, longitude, height, heading, pitch, roll) 
{
	var api = new API("changeLocationAndRotation");
	api.setDataKey(data_key);
	api.setLatitude(latitude);
	api.setLongitude(longitude);
	api.setElevation(height);
	api.setHeading(heading);
	api.setPitch(pitch);
	api.setRoll(roll);
	if (managerFactory !== null) 
	{
		managerFactory.callAPI(api);
	}
}

/**
 * 마우스 클릭 객체 이동 대상 변경
 * 
 * @param {Property} mouseMoveMode 0 = All, 1 = object, 2 = None
 */
function changeMouseMoveAPI(mouseMoveMode) 
{
	var api = new API("changeMouseMove");
	api.setMouseMoveMode(mouseMoveMode);
	if (managerFactory !== null) 
	{
		managerFactory.callAPI(api);
	}
}

/**
 * 이슈 등록 활성화 유무
 * 
 * @param {Property} flag true = 활성화, false = 비활성화
 */
function changeInsertIssueModeAPI(flag) 
{
	var api = new API("changeInsertIssueMode");
	api.setIssueInsertEnable(flag);
	if (managerFactory !== null) 
	{
		managerFactory.callAPI(api);
	}
}

/**
 * object 정보 표시 활성화 유무
 * 
 * @param {Property} flag true = 활성화, false = 비활성화
 */
function changeObjectInfoViewModeAPI(flag) 
{
	var api = new API("changeObjectInfoViewMode");
	api.setObjectInfoViewEnable(flag);
	if (managerFactory !== null) 
	{
		managerFactory.callAPI(api);
	}
}

/**
 * Object Occlusion culling
 * 
 * @param {Property} flag true = 활성화, false = 비활성화
 * @param {Property} dataKey
 */
function changeOcclusionCullingAPI(flag, dataKey) 
{
	var api = new API("changeOcclusionCulling");
	api.setOcclusionCullingEnable(flag);
	api.setDataKey(dataKey);
	if (managerFactory !== null) 
	{
		managerFactory.callAPI(api);
	}
}

/**
 * 1인칭, 3인칭 모드 개발중...
 * 
 * @param {Property} flag true = 활성화, false = 비활성화
 */
function changeFPVModeAPI(flag)
{
	var api = new API("changeFPVMode");
	api.setFPVMode(flag);
	if (managerFactory !== null) 
	{
		managerFactory.callAPI(api);
	}
}

/**
 * 현재 위치 근처 issue list. false인 경우 clear
 * 
 * @param {Property} flag true = 활성화, false = 비활성화
 */
function changeNearGeoIssueListViewModeAPI(flag) 
{
	var api = new API("changeNearGeoIssueListViewMode");
	api.setNearGeoIssueListEnable(flag);
	if (managerFactory !== null) 
	{
		managerFactory.callAPI(api);
	}
}

/**
 * TODO 이건 위에 이슈 등록 활성화, 비활성화 api로 통합이 가능할거 같음
 * issue 등록 geo 정보 관련 상태 변경
 * 
 * @param {Property} insertIssueState 이슈 등록 좌표 상태
 */
function changeInsertIssueStateAPI(insertIssueState) 
{
	var api = new API("changeInsertIssueState");
	api.setInsertIssueState(insertIssueState);
	if (managerFactory !== null) 
	{
		managerFactory.callAPI(api);
	}
}

/**
 * LOD 설정을 변경
 * @param {Property} lod0DistInMeters
 * @param {Property} lod1DistInMeters
 * @param {Property} lod2DistInMeters
 * @param {Property} lod3DistInMeters
 */
function changeLodAPI(lod0DistInMeters, lod1DistInMeters, lod2DistInMeters, lod3DistInMeters)
{
	var api = new API("changeLod");
	api.setLod0DistInMeters(lod0DistInMeters);
	api.setLod1DistInMeters(lod1DistInMeters);
	api.setLod2DistInMeters(lod2DistInMeters);
	api.setLod3DistInMeters(lod3DistInMeters);
	if (managerFactory !== null) 
	{
		managerFactory.callAPI(api);
	}
}

/**
 * Lighting 설정
 * @param {Property} ambientReflectionCoef
 * @param {Property} diffuseReflectionCoef
 * @param {Property} specularReflectionCoef
 * @param {Property} ambientColor
 * @param {Property} specularColor
 */
function changeLightingAPI(ambientReflectionCoef, diffuseReflectionCoef, specularReflectionCoef, ambientColor, specularColor)
{
	var api = new API("changeLighting");
	api.setAmbientReflectionCoef(ambientReflectionCoef);
	api.setDiffuseReflectionCoef(diffuseReflectionCoef);
	api.setSpecularReflectionCoef(specularReflectionCoef);
	api.setAmbientColor(ambientColor);
	api.setSpecularColor(specularColor);
	if (managerFactory !== null) 
	{
		managerFactory.callAPI(api);
	}
}

/**
 * SSAD Radius 설정
 * @param {Property} ssaoRadius
 */
function changeSsadRadiusAPI(ssaoRadius)
{
	var api = new API("changeSsadRadius");
	api.setSsaoRadius(ssaoRadius);
	if (managerFactory !== null) 
	{
		managerFactory.callAPI(api);
	}
}

/**
 * pin image를 그림
 * 
 * @param {Property} drawType 이미지를 그리는 유형 0 : DB, 1 : 이슈등록
 * @param {Property} issue_id 이슈 고유키
 * @param {Property} issue_type 이슈 고유키
 * @param {Property} data_key 데이터 고유키
 * @param {Property} latitude 데이터 고유키
 * @param {Property} longitude 데이터 고유키
 * @param {Property} height 데이터 고유키
 */
function drawInsertIssueImageAPI(drawType, issue_id, issue_type, data_key, latitude, longitude, height) 
{
	var api = new API("drawInsertIssueImage");
	api.setDrawType(drawType);
	api.setIssueId(issue_id);
	api.setIssueId(issue_type);
	api.setDataKey(data_key);
	api.setLatitude(latitude);
	api.setLongitude(longitude);
	api.setElevation(height);
	if (managerFactory !== null) 
	{
		managerFactory.callAPI(api);
	}
}

/**
 * 마우스를 사용할 수 없는 환경에서 버튼 이벤트로 대체
 * @param {Property} eventType 어떤 마우스 동작을 원하는지를 구분
 */
function mouseMoveAPI(eventType) 
{
	if (managerFactory !== null) 
	{
		managerFactory.mouseMove(eventType);
	}
}

/**
 * 데이터 검색
 * 
 * @param {Property} dataKey 데이터 고유키
 */
function searchDataAPI(dataKey) 
{
	var api = new API("searchData");
	api.setDataKey(dataKey);
	if (managerFactory !== null) 
	{
		managerFactory.callAPI(api);
	}
}

/**
 * 데이터를 Rendering
 * 
 * @param type new clear 후 새로 그림, append = 추가하여 그림
 * @param dataNameArray target data 이름 배열
 * @param dataUrlArray data를 가져올 url 배열
 * @param 
 */
function drawData(type, dataNameArray, dataUrlArray) 
{
	if (dataNameArray.length <= 0) { return; }
	
	var keyMap = new Map();
	var dataCount = 0;
	dataNameArray.forEach(function(dataName, index) 
	{
		if (MagoConfig.isDataExist(dataName))
		{
			var data = MagoConfig.getData(dataName);
			keyMap.set(dataName, dataName);
			keyMap.set(CODE.OBJECT_INDEX_FILE_PREFIX + data.data_key, data.data_key);
			// 맨 마지막에는 map에서 지우는 처리를 하러 가자.
			if (type === "new" && dataNameArray.length === (dataCount + 1))		
			{
				MagoConfig.clearUnSelectedData(keyMap);
			}
			dataCount++;
		}
		else 
		{
			console.log("not exist. dataName = " + dataName);
			var objectIndexFilePath = null;
			$.ajax({
				url      : dataUrlArray[index],
				type     : "GET",
				dataType : "json",
				success  : function(serverData)
				{
					MagoConfig.setData(dataName, serverData);
					objectIndexFilePath = serverData.data_key;
					keyMap.set(dataName, dataName);
					keyMap.set(CODE.OBJECT_INDEX_FILE_PREFIX + objectIndexFilePath, objectIndexFilePath);
					managerFactory.loadObjectIndexFile(dataName, objectIndexFilePath);
					
					// 맨 마지막에는 map에서 지우는 처리를 하러 가자.
					if (type === "new" && dataNameArray.length === (dataCount + 1))		
					{
						MagoConfig.clearUnSelectedData(keyMap);
					}
					dataCount++;
				},
				error: function(request, status, error)
				{
					//alert(JS_MESSAGE["ajax.error.message"]);
					console.log("code:"+request.status+"\n"+"message:"+request.responseText+"\n"+"error:"+error);
				}
			});
		}
	});
}

