/* eslint-env jquery */
'use strict';

/**
 * An API that interacts with the on-screen UI. Class name to be modified by APIGateWay or API class
 * @class MagoFacade
 */
/**
 * mago3d 활성화/비활성화
 * @param {ManagerFactory} managerFactoryInstance 
 * @param {Boolean} isShow true = show, false = hide
 */
function changeMagoStateAPI(managerFactoryInstance, isShow) 
{
	if (managerFactoryInstance === null) { return; } 
	
	var api = new Mago3D.API("changeMagoState");
	api.setMagoEnable(isShow);
	managerFactoryInstance.callAPI(api);
};

/**
 * Label show/hide
 * @param {ManagerFactory} managerFactoryInstance 
 * @param {Boolean} isShow true = show, false = hide
 */
function changeLabelAPI(managerFactoryInstance, isShow) 
{
	if (managerFactoryInstance === null) { return; } 
	
	var api = new Mago3D.API("changeLabel");
	api.setShowLabelInfo(isShow);
	managerFactoryInstance.callAPI(api);
}

/**
 * Origin show/hide
 * @param {ManagerFactory} managerFactoryInstance
 * @param {Boolean} isShow true = show, false = hide
 */
function changeOriginAPI(managerFactoryInstance, isShow)
{
	if (managerFactoryInstance === null) { return; }

	var api = new Mago3D.API("changeOrigin");
	api.setShowOrigin(isShow);
	managerFactoryInstance.callAPI(api);
}

/**
 * boundingBox show/hide
 * @param {ManagerFactory} managerFactoryInstance
 * @param {Boolean} isShow true = show, false = hide
 */
function changeBoundingBoxAPI(managerFactoryInstance, isShow) 
{
	if (managerFactoryInstance === null) { return; } 
	
	var api = new Mago3D.API("changeBoundingBox");
	api.setShowBoundingBox(isShow);
	managerFactoryInstance.callAPI(api);
}

/**
 * 속성값에 의한 가시화 유무설정
 * 삭제 예정
 * @param {ManagerFactory} managerFactoryInstance
 * @param {Boolean} isShow true = 표시, false = 비표시
 */
function changePropertyRenderingAPI(managerFactoryInstance, isShow, projectId, property) 
{
	if (managerFactoryInstance === null) { return; } 
		
	var api = new Mago3D.API("changePropertyRendering");
	api.setShowShadow(isShow);
	api.setProjectId(projectId);
	api.setProperty(property);
	managerFactoryInstance.callAPI(api);
}

/**
 * 그림자 표시/비표시
 * @param {ManagerFactory} managerFactoryInstance
 * @param {Boolean} isShow true = 활성화, false = 비활성화
 */
function changeShadowAPI(managerFactoryInstance, isShow) 
{
	if (managerFactoryInstance === null) { return; } 
	
	var api = new Mago3D.API("changeShadow");
	api.setShowShadow(isShow);
	managerFactoryInstance.callAPI(api);
}

/**
 * color 변경
 * @param {ManagerFactory} managerFactoryInstance
 * @param {string} projectId 프로젝트 아이디
 * @param {string} dataKey data key
 * @param {string} objectIds object id. 복수개의 경우 , 로 입력
 * @param {string} property 속성값 예)isMain=true
 * @param {string} color R, G, B 색깔을 ',' 로 연결한 string 값을 받음.
 */
function changeColorAPI(managerFactoryInstance, projectId, dataKey, objectIds, property, color) 
{
	if (managerFactoryInstance === null) { return; } 
	
	var api = new Mago3D.API("changeColor");
	api.setProjectId(projectId);
	api.setDataKey(dataKey);
	api.setObjectIds(objectIds);
	api.setProperty(property);
	api.setColor(color);
	managerFactoryInstance.callAPI(api);
}

/**
 * Object literal with change Location And Rotation animation option.
 * @typedef {Object} animationOption
 * @property {string} dutaion optional. 
 * @property {Boolean} autoChangeRotation optional. If this option is true, your heading, pitch will be ignore, Heading and pitch changes according to the direction.
 */

/**
 * location and rotation 변경
 * @param {ManagerFactory} managerFactoryInstance
 * @param {string} projectId
 * @param {string} dataKey
 * @param {string} latitude 위도
 * @param {string} longitude 경도
 * @param {string} height 높이
 * @param {string} heading 좌, 우
 * @param {string} pitch 위, 아래
 * @param {string} roll 좌, 우 기울기
 * @param {animationOption} animationOption animation option
 */
function changeLocationAndRotationAPI(managerFactoryInstance, projectId, dataKey, latitude, longitude, height, heading, pitch, roll, animationOption) 
{
	if (managerFactoryInstance === null) { return; } 
	
	var api = new Mago3D.API("changeLocationAndRotation");
	api.setProjectId(projectId);
	api.setDataKey(dataKey);
	api.setLatitude(latitude);
	api.setLongitude(longitude);
	api.setElevation(height);
	api.setHeading(heading);
	api.setPitch(pitch);
	api.setRoll(roll);
	api.setAnimationOption(animationOption);
	managerFactoryInstance.callAPI(api);
}

/**
 * 마우스 클릭 객체 이동 대상 변경
 * @param {ManagerFactory} managerFactoryInstance
 * @param {string} objectMoveMode 0 = All, 1 = object, 2 = None
 */
function changeObjectMoveAPI(managerFactoryInstance, objectMoveMode) 
{
	if (managerFactoryInstance === null) { return; } 
	
	var api = new Mago3D.API("changeObjectMove");
	api.setObjectMoveMode(objectMoveMode);
	managerFactoryInstance.callAPI(api);
}

/**
 * 마우스로 이동한 객체 정보를 브라우저내 저장
 * @param {ManagerFactory} managerFactoryInstance
 * @param {string} objectMoveMode 0 = All, 1 = object, 2 = None
 */
function saveObjectMoveAPI(managerFactoryInstance, objectMoveMode) 
{
	if (managerFactoryInstance === null) { return; } 
	
	var api = new Mago3D.API("saveObjectMove");
	api.setObjectMoveMode(objectMoveMode);
	managerFactoryInstance.callAPI(api);
}

/**
 * 브라우저내 모든 마우스 이동 정보를 삭제
 * @param {ManagerFactory} managerFactoryInstance
 * @param {string} objectMoveMode 0 = All, 1 = object, 2 = None
 */
function deleteAllObjectMoveAPI(managerFactoryInstance, objectMoveMode) 
{
	if (managerFactoryInstance === null) { return; } 
	
	var api = new Mago3D.API("deleteAllObjectMove");
	api.setObjectMoveMode(objectMoveMode);
	managerFactoryInstance.callAPI(api);
}

/**
 * 브라우저내 모든 색깔 변경 이력을 삭제
 * @param {ManagerFactory} managerFactoryInstance
 */
function deleteAllChangeColorAPI(managerFactoryInstance) 
{
	if (managerFactoryInstance === null) { return; } 
	
	var api = new Mago3D.API("deleteAllChangeColor");
	managerFactoryInstance.callAPI(api);
}

/**
 * 이슈 등록 활성화 유무
 * @param {ManagerFactory} managerFactoryInstance
 * @param {Boolean} flag true = 활성화, false = 비활성화
 */
function changeInsertIssueModeAPI(managerFactoryInstance, flag) 
{
	if (managerFactoryInstance === null) { return; } 
	
	var api = new Mago3D.API("changeInsertIssueMode");
	api.setIssueInsertEnable(flag);
	managerFactoryInstance.callAPI(api);
}

/**
 * object 정보 표시 활성화 유무
 * @param {ManagerFactory} managerFactoryInstance
 * @param {Boolean} flag true = 활성화, false = 비활성화
 */
function changeObjectInfoViewModeAPI(managerFactoryInstance, flag) 
{
	if (managerFactoryInstance === null) { return; } 
	
	var api = new Mago3D.API("changeObjectInfoViewMode");
	api.setObjectInfoViewEnable(flag);
	managerFactoryInstance.callAPI(api);
}

/**
 * Object Occlusion culling
 * @param {ManagerFactory} managerFactoryInstance
 * @param {Boolean} flag true = 활성화, false = 비활성화
 * @param {string} dataKey
 */
function changeOcclusionCullingAPI(managerFactoryInstance, flag, dataKey) 
{
	if (managerFactoryInstance === null) { return; } 
	
	var api = new Mago3D.API("changeOcclusionCulling");
	api.setOcclusionCullingEnable(flag);
	api.setDataKey(dataKey);
	managerFactoryInstance.callAPI(api);
}

/**
 * 1인칭, 3인칭 모드 개발중...
 * @param {ManagerFactory} managerFactoryInstance
 * @param {Boolean} flag true = 활성화, false = 비활성화
 */
function changeFPVModeAPI(managerFactoryInstance, flag)
{
	if (managerFactoryInstance === null) { return; } 
	
	var api = new Mago3D.API("changeFPVMode");
	api.setFPVMode(flag);
	managerFactoryInstance.callAPI(api);
}

/**
 * 1인칭, 3인칭 모드 개발중...
 * @param {ManagerFactory} managerFactoryInstance
 * @param {Boolean} flag true = 활성화, false = 비활성화
 */
function changeMagoModeAPI(managerFactoryInstance, flag)
{
	if (managerFactoryInstance === null) { return; } 
	
	var api = new Mago3D.API("changeMagoMode");
	api.setMagoMode(flag);
	managerFactoryInstance.callAPI(api);
}

/**
 * 현재 위치 근처 issue list. false인 경우 clear
 * 삭제 예정
 * @param {ManagerFactory} managerFactoryInstance
 * @param {Boolean} flag true = 활성화, false = 비활성화
 */
function changeNearGeoIssueListViewModeAPI(managerFactoryInstance, flag) 
{
	if (managerFactoryInstance === null) { return; } 
	
	var api = new Mago3D.API("changeNearGeoIssueListViewMode");
	api.setNearGeoIssueListEnable(flag);
	managerFactoryInstance.callAPI(api);
}

/**
 * TODO 이건 위에 이슈 등록 활성화, 비활성화 api로 통합이 가능할거 같음
 * issue 등록 geo 정보 관련 상태 변경
 * 확인 필요
 * @param {ManagerFactory} managerFactoryInstance
 * @param {string} insertIssueState 이슈 등록 좌표 상태
 */
function changeInsertIssueStateAPI(managerFactoryInstance, insertIssueState) 
{
	if (managerFactoryInstance === null) { return; } 
	
	var api = new Mago3D.API("changeInsertIssueState");
	api.setInsertIssueState(insertIssueState);
	managerFactoryInstance.callAPI(api);
}

/**
 * LOD 설정을 변경
 * @param {ManagerFactory} managerFactoryInstance
 * @param {string} lod0DistInMeters
 * @param {string} lod1DistInMeters
 * @param {string} lod2DistInMeters
 * @param {string} lod3DistInMeters
 * @param {string} lod4DistInMeters
 * @param {string} lod5DistInMeters
 */
function changeLodAPI(managerFactoryInstance, lod0DistInMeters, lod1DistInMeters, lod2DistInMeters, lod3DistInMeters, lod4DistInMeters, lod5DistInMeters)
{
	if (managerFactoryInstance === null) { return; } 
	
	var api = new Mago3D.API("changeLod");
	api.setLod0DistInMeters(lod0DistInMeters);
	api.setLod1DistInMeters(lod1DistInMeters);
	api.setLod2DistInMeters(lod2DistInMeters);
	api.setLod3DistInMeters(lod3DistInMeters);
	api.setLod4DistInMeters(lod4DistInMeters);
	api.setLod5DistInMeters(lod5DistInMeters);
	managerFactoryInstance.callAPI(api);
}

/**
 * Lighting 설정
 * @param {ManagerFactory} managerFactoryInstance
 * @param {string} ambientReflectionCoef
 * @param {string} diffuseReflectionCoef
 * @param {string} specularReflectionCoef
 * @param {string} ambientColor
 * @param {string} specularColor
 */
function changeLightingAPI(managerFactoryInstance, ambientReflectionCoef, diffuseReflectionCoef, specularReflectionCoef, ambientColor, specularColor)
{
	if (managerFactoryInstance === null) { return; } 
	
	var api = new Mago3D.API("changeLighting");
	api.setAmbientReflectionCoef(ambientReflectionCoef);
	api.setDiffuseReflectionCoef(diffuseReflectionCoef);
	api.setSpecularReflectionCoef(specularReflectionCoef);
	api.setAmbientColor(ambientColor);
	api.setSpecularColor(specularColor);
	managerFactoryInstance.callAPI(api);
}

/**
 * SSAO Radius 설정
 * @param {ManagerFactory} managerFactoryInstance
 * @param {string} ssaoRadius
 */
function changeSsaoRadiusAPI(managerFactoryInstance, ssaoRadius)
{
	if (managerFactoryInstance === null) { return; } 
	
	var api = new Mago3D.API("changeSsaoRadius");
	api.setSsaoRadius(ssaoRadius);
	managerFactoryInstance.callAPI(api);
}

/**
 * 모든 f4d 데이터를 삭제, 비표시
 * @param {ManagerFactory} managerFactoryInstance
 */
function clearAllDataAPI(managerFactoryInstance)
{	
	if (managerFactoryInstance === null) { return; } 
	
	var api = new Mago3D.API("clearAllData");
	Mago3D.MagoConfig.clearAllData();
	managerFactoryInstance.callAPI(api);
}

/**
 * pin image를 그림
 * @param {ManagerFactory} managerFactoryInstance
 * @param {string} drawType 이미지를 그리는 유형 0 : DB, 1 : 이슈등록
 * @param {string} issue_id 이슈 고유키
 * @param {string} issue_type 이슈 고유키
 * @param {string} data_key 데이터 고유키
 * @param {string} latitude 데이터 고유키
 * @param {string} longitude 데이터 고유키
 * @param {string} height 데이터 고유키
 */
function drawInsertIssueImageAPI(managerFactoryInstance, drawType, issue_id, issue_type, data_key, latitude, longitude, height) 
{
	if (managerFactoryInstance === null) { return; } 
	
	var api = new Mago3D.API("drawInsertIssueImage");
	api.setDrawType(drawType);
	api.setIssueId(issue_id);
	api.setIssueId(issue_type);
	api.setDataKey(data_key);
	api.setLatitude(latitude);
	api.setLongitude(longitude);
	api.setElevation(height);
	managerFactoryInstance.callAPI(api);
}

/**
 * 해당 프로젝트를 로딩하고 이동하기
 * @param {ManagerFactory} managerFactoryInstance
 * @param {string} projectId project id
 * @param {string} latitude 데이터 고유키
 * @param {string} longitude 데이터 고유키
 * @param {string} height 데이터 고유키
 * @param {string} duration 이동하는 시간
 */
function gotoProjectAPI(managerFactoryInstance, projectId, projectData, projectDataFolder, longitude, latitude, height, duration) 
{
	if (managerFactoryInstance === null) { return; } 
	
	Mago3D.MagoConfig.setData(Mago3D.CODE.PROJECT_ID_PREFIX + projectId, projectData);
	Mago3D.MagoConfig.setProjectDataFolder(Mago3D.CODE.PROJECT_DATA_FOLDER_PREFIX + projectDataFolder, projectDataFolder);
	
	var api = new Mago3D.API("gotoProject");
	api.setProjectId(projectId);
	api.setProjectDataFolder(projectDataFolder);
	api.setLatitude(latitude);
	api.setLongitude(longitude);
	api.setElevation(height);
	api.setDuration(duration);
	managerFactoryInstance.callAPI(api);
}

/**
 * 해당 프로젝트를 로딩하고 Issue 등록 지점으로 이동하기
 * @param {ManagerFactory} managerFactoryInstance
 * @param {string} projectId project id
 * @param {string} issueId issue id
 * @param {string} issueType issue type
 * @param {string} latitude 데이터 고유키
 * @param {string} longitude 데이터 고유키
 * @param {string} height 데이터 고유키
 * @param {string} duration 이동하는 시간
 */
function gotoIssueAPI(managerFactoryInstance, projectId, projectData, projectDataFolder, issueId, issueType, longitude, latitude, height, duration)
{
	if (managerFactoryInstance === null) { return; } 
	
	Mago3D.MagoConfig.setData(Mago3D.CODE.PROJECT_ID_PREFIX + projectId, projectData);
	Mago3D.MagoConfig.setProjectDataFolder(Mago3D.CODE.PROJECT_DATA_FOLDER_PREFIX + projectDataFolder, projectDataFolder);
	
	var api = new Mago3D.API("gotoIssue");
	api.setProjectId(projectId);
	api.setProjectDataFolder(projectDataFolder);
	api.setIssueId(issueId);
	api.setIssueType(issueType);
	api.setLatitude(latitude);
	api.setLongitude(longitude);
	api.setElevation(height);
	api.setDuration(duration);
	managerFactoryInstance.callAPI(api);
}

/**
 * 고려 소프트웨어: 바로가기
 */
function gotoFlyAPI(managerFactoryInstance, longitude, latitude, height, duration)
{
	if (managerFactoryInstance === null) { return; } 
	
	var api = new Mago3D.API("gotoFly");
	api.setLongitude(longitude);
	api.setLatitude(latitude);
	api.setElevation(height);
	api.setDuration(duration);
	managerFactoryInstance.callAPI(api);
}

/**
 * 마우스를 사용할 수 없는 환경에서 버튼 이벤트로 대체
 * 삭제 예정
 * @param {ManagerFactory} managerFactoryInstance
 * @param {string} eventType 어떤 마우스 동작을 원하는지를 구분
 */
function mouseMoveAPI(managerFactoryInstance, eventType) 
{
	if (managerFactoryInstance === null) { return; } 
	
	managerFactoryInstance.mouseMove(eventType);
}

/**
 * 데이터 검색
 * @param {ManagerFactory} managerFactoryInstance
 * @param {string} projectId 데이터 고유키
 * @param {string} dataKey 데이터 고유키
 */
function searchDataAPI(managerFactoryInstance, projectId, dataKey) 
{
	if (managerFactoryInstance === null) { return; } 
	
	var api = new Mago3D.API("searchData");
	api.setProjectId(projectId);
	api.setDataKey(dataKey);
	managerFactoryInstance.callAPI(api);
}

/**
 * 환경 설정 data Object에 key 값의 존재 유무를 판별
 * @param {string} key 검색 키
 * @param 
 */
function isDataExistAPI(key) 
{
	if (Mago3D.MagoConfig.isDataExist(key)) { return true; }
	else { return false; }
}

/**
 * 환경 설정 data map에서 key 값을 취득
 * @param {string} key 검색 키
 * @param 
 */
function getDataAPI(key) 
{
	return Mago3D.MagoConfig.getData(key);
}

/**
 * Data Key 를 이용하여 Geo Spatial Info를 취득
 * @param {ManagerFactory} managerFactoryInstance
 * @param {String} projectId 고유키
 * @param {String} dataKey Data 고유키
 * @param
 */
function getDataInfoByDataKeyAPI(managerFactoryInstance, projectId, dataKey)
{
	if (managerFactoryInstance === null) { return; }

	var api = new Mago3D.API("getDataInfoByDataKey");
	api.setProjectId(projectId);
	api.setDataKey(dataKey);
	managerFactoryInstance.callAPI(api);
}

/**
 * 데이터를 Rendering
 * @param {ManagerFactory} managerFactoryInstance
 * @param {Object[]} projectIdArray 프로젝트 이름들
 * @param {Object[]} projectDataArray 프로젝트 데이터들
 * @param {Object[]} projectDataFolderArray 프로젝트 f4d 파일 경로
 * @param 
 */
function drawAppendDataAPI(managerFactoryInstance, projectIdArray, projectDataArray, projectDataFolderArray) 
{
	if (managerFactoryInstance === null) { return; } 
	
	if (projectIdArray.length <= 0) { return; }
	
	var api = new Mago3D.API("drawAppendData");
	projectIdArray.forEach(function(dataName, index) 
	{
			
		Mago3D.MagoConfig.setData(Mago3D.CODE.PROJECT_ID_PREFIX + dataName, projectDataArray[index]);
		Mago3D.MagoConfig.setProjectDataFolder(Mago3D.CODE.PROJECT_DATA_FOLDER_PREFIX + projectDataFolderArray[index], projectDataFolderArray[index]);
		
		api.setProjectId(dataName);
		api.setProjectDataFolder(projectDataFolderArray[index]);
		managerFactoryInstance.callAPI(api);
	});
}

/**
 * get coodinate relative to building
 * @param {ManagerFactory} managerFactoryInstance
 * @param {string} projectId project primary key
 * @param {string} dataKey data key
 * @param {string} inputPoint input x, y, z
 * @param {string} resultPoint return point
 */
function getCoordinateRelativeToBuildingAPI(managerFactoryInstance, projectId, dataKey, inputPoint, resultPoint)
{
	if (managerFactoryInstance === null) { return; }

	var api = new Mago3D.API("getCoordinateRelativeToBuilding");
	api.setReturnable(true);
	api.setProjectId(projectId);
	api.setDataKey(dataKey);
	api.setInputPoint(inputPoint);
	api.setResultPoint(resultPoint);

	return managerFactoryInstance.callAPI(api);
}

/**
 * get absolte coodinate of building point
 * @param {ManagerFactory} managerFactoryInstance
 * @param {string} projectId project primary key
 * @param {string} dataKey data key
 * @param {string} inputPoint input x, y, z
 * @param {string} resultPoint return point
 */
function getAbsoluteCoodinateOfBuildingPointAPI(managerFactoryInstance, projectId, dataKey, inputPoint, resultPoint)
{
	if (managerFactoryInstance === null) { return; }

	var api = new Mago3D.API("getAbsoluteCoodinateOfBuildingPoint");
	api.setReturnable(true);
	api.setProjectId(projectId);
	api.setDataKey(dataKey);
	api.setInputPoint(inputPoint);
	api.setResultPoint(resultPoint);

	return managerFactoryInstance.callAPI(api);
}

/**
 * get current camera position
 * @param {ManagerFactory} managerFactoryInstance
 * @param {Number} unit position unit. if not define, default value is Mago3D.CODE.units.DEGREE. 0 : Mago3D.CODE.units.METRE, 1 : Mago3D.CODE.units.DEGREE, 2 : Mago3D.CODE.units.RADIAN
 * @returns {Object|Cartesian3|Cartographic}
 */
function getCameraCurrentPositionAPI(managerFactoryInstance, unit)
{
	var api = new Mago3D.API("getCameraCurrentPosition");
	
	api.setReturnable(true);
	api.setUnit(unit);
	
	return managerFactoryInstance.callAPI(api);
}

/**
 * get current camera orientaion
 * @param {ManagerFactory} managerFactoryInstance
 * @returns {Object}
 */
function getCameraCurrentOrientaionAPI(managerFactoryInstance)
{
	var api = new Mago3D.API("getCameraCurrentOrientaion");
	
	api.setReturnable(true);
	return managerFactoryInstance.callAPI(api);
}

/**
 * change camera orientation
 * @param {ManagerFactory} managerFactoryInstance
 * @param {string|undefined|null} heading 좌, 우. needs degree. default value is current camera's heading value.
 * @param {string|undefined|null} pitch 위, 아래. needs degree. default value is current camera's pitch value.
 * @param {string|undefined|null} roll 좌, 우 기울기. needs degree. default value is current camera's roll value.
 * @param {string|undefined|null} duration 이동하는 시간. default value is 0.
 */
function changeCameraOrientationAPI(managerFactoryInstance, heading, pitch, roll, duration)
{
	var api = new Mago3D.API("changeCameraOrientation");

	api.setHeading(heading);
	api.setPitch(pitch);
	api.setRoll(roll);
	api.setDuration(duration);

	managerFactoryInstance.callAPI(api);
}


/**
 * Object literal with config options for instantiate static model.
 * @typedef {Object} instantiateOption
 * @property {string} projectId Required. projectId. static model key.
 * @property {string} instanceId Required. instance Id.
 * @property {number} longitude Required. initial longitude.
 * @property {number} latitude Required. initial latitude.
 * @property {number} height Optional. Default value is 0.
 * @property {number} heading Optional. Default value is 0.
 * @property {number} pitch Optional. Default value is 0.
 * @property {number} roll Optional. Default value is 0.
 */

/**
 * instantiate static model
 * @param {ManagerFactory} managerFactoryInstance
 * @param {instantiateOption} attributes
 */
function instantiateStaticModelAPI(managerFactoryInstance, attributes)
{
	var api = new Mago3D.API("instantiateStaticModel");
	
	api.setInstantiateObj(attributes);
	managerFactoryInstance.callAPI(api);
}

/**
 * Object literal with config options for add static model.
 * @typedef {Object} staticModelOption
 * @property {string} projectId Required. projectId. Static model key.
 * @property {string} projectFolderName Required. Static Model Folder Name.
 * @property {string} buildingFolderName Required. Static Model data Folder Name.
 */

/**
 * add static model
 * @param {ManagerFactory} managerFactoryInstance
 * @param {staticModelOption} attributes
 */
function addStaticModelAPI(managerFactoryInstance, attributes)
{
	var api = new Mago3D.API("addStaticModel");
	
	api.setStaticModelAttributeObj(attributes);
	managerFactoryInstance.callAPI(api);
}

/**
 * 트래킹 옵션.
 * @typedef {Object} trackOption
 * @property {number} type Required.  if not define, default value is CODE.trackMode.TRACKING. 0 : CODE.trackMode.TRACKING, 1 : CODE.trackMode.DRIVER
 * @property {number} targetOffset if type is 1 (CODE.trackMode.DRIVER), use this offset. Default is 10.0;
 * @property {trackCameraOffset} trackCameraOffset if type is 1 (CODE.trackMode.DRIVER), use this.
 */

/**
 * 트래킹 카메라 옵셋 
 * @typedef {Object} trackCameraOffset
 * @property {number} y Default is -1;
 * @property {number} z Default is 12;
 */

/**
 * set track target node.
 * @param {ManagerFactory} managerFactoryInstance
 * @param {string} projectId project primary key
 * @param {string} dataKey data key
 * @param {trackOption} option Optional. 비어있을 시 TRACKING 모드로 설정
 */
function setTrackNodeAPI(managerFactoryInstance, projectId, dataKey, option)
{
	var api = new Mago3D.API("setTrackNode");
	
	api.setProjectId(projectId);
	api.setDataKey(dataKey);
	api.setTrackOption(option);
	managerFactoryInstance.callAPI(api);
}

/**
 * set track target node.
 * @param {ManagerFactory} managerFactoryInstance
 */
function stopTrackAPI(managerFactoryInstance)
{
	var api = new Mago3D.API("stopTrack");
	
	managerFactoryInstance.callAPI(api);
}

/**
 * check static model is exist
 * @param {ManagerFactory} managerFactoryInstance
 * @param {string} projectId
 * @returns {Boolean} isExist
 */
function isExistStaticModelAPI(managerFactoryInstance, projectId)
{
	var api = new Mago3D.API("isExistStaticModel");
	api.setReturnable(true);
	api.setProjectId(projectId);
	return managerFactoryInstance.callAPI(api);
}

/**
 * check data is exist
 * @param {ManagerFactory} managerFactoryInstance
 * @param {string} projectId project primary key
 * @param {string} dataKey data key
 * @returns {Boolean} isExist
 */
function isExistDataAPI(managerFactoryInstance, projectId, dataKey)
{
	var api = new Mago3D.API("isExistData");
	api.setReturnable(true);
	api.setProjectId(projectId);
	api.setDataKey(dataKey);
	return managerFactoryInstance.callAPI(api);
}

/**
 * check data is ready to render
 * @param {ManagerFactory} managerFactoryInstance
 * @param {string} projectId project primary key
 * @param {string} dataKey data key
 * @return {Boolean} is ready to render 
 */
function isDataReadyToRenderAPI(managerFactoryInstance, projectId, dataKey)
{
	var api = new Mago3D.API("isDataReadyToRender");
	api.setReturnable(true);
	api.setProjectId(projectId);
	api.setDataKey(dataKey);
	return managerFactoryInstance.callAPI(api);
}

/**
 * check data is ready to render
 * @param {ManagerFactory} managerFactoryInstance
 * @param {string} projectId project primary key
 * @param {string} dataKey data key
 * @param {nodeAttribute} option data key
 */
function setNodeAttributeAPI(managerFactoryInstance, projectId, dataKey, option)
{
	var api = new Mago3D.API("setNodeAttribute");
	api.setProjectId(projectId);
	api.setDataKey(dataKey);
	api.setNodeAttribute(option);
	managerFactoryInstance.callAPI(api);
}
