'use strict';

/**
 * mago3djs API
 * 
 * @alias API
 * @class API
 * 
 * @param {any} apiName api이름
 */
function API(apiName)
{
	if (!(this instanceof API)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	// mago3d 활성화/비활성화 여부
	this.magoEnable = true;
	// return
	this.returnable = false;

	// api 이름
	this.apiName = apiName;
	
	// project id
	this.projectId = null;
	this.projectDataFolder = null;
	// objectIds
	this.objectIds = null;
	// data_key
	this.dataKey = null;
	// issueId
	this.issueId = null;
	// issueType
	this.issueType = null;
	// drawType 이미지를 그리는 유형 0 : DB, 1 : 이슈등록
	this.drawType = 0;

	// 위도
	this.latitude = 0;
	// 경도
	this.longitude = 0;
	// 높이
	this.elevation = 0;
	// heading
	this.heading = 0;
	// pitch
	this.pitch = 0;
	// roll
	this.roll = 0;
	// duration
	this.duration = 0;

	// 속성
	this.property = null;
	// 색깔
	this.color = 0;
	// structs = MSP, outfitting = MOP
	this.blockType = null;
	// outfitting 표시/비표시
	this.showOutFitting = false;
	// label 표시/비표시
	this.showLabelInfo = true;
	// origin 표시/비표시
	this.showOrigin = false;
	// boundingBox 표시/비표시
	this.showBoundingBox = false;
	// 그림자 표시/비표시
	this.showShadow = false;
	// frustum culling 가시 거리(M단위)
	this.frustumFarDistance = 0;
	// move mode 
	this.objectMoveMode = CODE.moveMode.NONE;
	// 이슈 등록 표시
	this.issueInsertEnable = false;
	// object 정보 표시
	this.objectInfoViewEnable = false;
	// 이슈 목록 표시
	this.nearGeoIssueListEnable = false;
	// occlusion culling
	this.occlusionCullingEnable = false;
	//
	this.insertIssueState = 0;
	
	// LOD1
	this.lod0DistInMeters = null;
	this.lod1DistInMeters = null;
	this.lod2DistInMeters = null;
	this.lod3DistInMeters = null;
	this.lod4DistInMeters = null;
	this.lod5DistInMeters = null;
	
	// Lighting
	this.ambientReflectionCoef = null;
	this.diffuseReflectionCoef = null;
	this.specularReflectionCoef = null;
	this.ambientColor = null;
	this.specularColor = null;
	
	this.ssaoRadius = null;
	//
	this.FPVMode = false;

	// input x, y, z
	this.inputPoint = null;
	// result x, y, z
	this.resultPoint = null;
	
	// General magoMode.***
	this.magoMode = CODE.magoMode.NORMAL;

	this.unit = CODE.units.DEGREE;
};

API.prototype.getMagoEnable = function() 
{
	return this.magoEnable;
};
API.prototype.setMagoEnable = function(magoEnable) 
{
	this.magoEnable = magoEnable;
};

API.prototype.getReturnable = function()
{
	return this.returnable;
};
API.prototype.setReturnable = function(returnable)
{
	this.returnable = returnable;
};

API.prototype.getAPIName = function() 
{
	return this.apiName;
};

API.prototype.getProjectId = function() 
{
	return this.projectId;
};
API.prototype.setProjectId = function(projectId) 
{
	this.projectId = projectId;
};

API.prototype.getProjectDataFolder = function() 
{
	return this.projectDataFolder;
};
API.prototype.setProjectDataFolder = function(projectDataFolder) 
{
	this.projectDataFolder = projectDataFolder;
};

API.prototype.getObjectIds = function() 
{
	return this.objectIds;
};
API.prototype.setObjectIds = function(objectIds) 
{
	this.objectIds = objectIds;
};

API.prototype.getIssueId = function() 
{
	return this.issueId;
};
API.prototype.setIssueId = function(issueId) 
{
	this.issueId = issueId;
};
API.prototype.getIssueType = function() 
{
	return this.issueType;
};
API.prototype.setIssueType = function(issueType) 
{
	this.issueId = issueType;
};

API.prototype.getDataKey = function() 
{
	return this.dataKey;
};
API.prototype.setDataKey = function(dataKey) 
{
	this.dataKey = dataKey;
};

API.prototype.getLatitude = function() 
{
	return this.latitude;
};
API.prototype.setLatitude = function(latitude) 
{
	this.latitude = latitude;
};

API.prototype.getLongitude = function() 
{
	return this.longitude;
};
API.prototype.setLongitude = function(longitude) 
{
	this.longitude = longitude;
};

API.prototype.getElevation = function() 
{
	return this.elevation;
};
API.prototype.setElevation = function(elevation) 
{
	this.elevation = elevation;
};

API.prototype.getHeading = function() 
{
	return this.heading;
};
API.prototype.setHeading = function(heading) 
{
	this.heading = heading;
};

API.prototype.getPitch = function() 
{
	return this.pitch;
};
API.prototype.setPitch = function(pitch) 
{
	this.pitch = pitch;
};

API.prototype.getRoll = function() 
{
	return this.roll;
};
API.prototype.setRoll = function(roll) 
{
	this.roll = roll;
};

API.prototype.getProperty = function() 
{
	return this.property;
};
API.prototype.setProperty = function(property) 
{
	this.property = property;
};

API.prototype.getColor = function() 
{
	return this.color;
};
API.prototype.setColor = function(color) 
{
	this.color = color;
};

API.prototype.getBlockType = function() 
{
	return this.blockType;
};
API.prototype.setBlockType = function(blockType) 
{
	this.blockType = blockType;
};

API.prototype.getShowOutFitting = function() 
{
	return this.showOutFitting;
};
API.prototype.setShowOutFitting = function(showOutFitting) 
{
	this.showOutFitting = showOutFitting;
};


API.prototype.getShowLabelInfo = function() 
{
	return this.showLabelInfo;
};
API.prototype.setShowLabelInfo = function(showLabelInfo) 
{
	this.showLabelInfo = showLabelInfo;
};

API.prototype.getShowOrigin = function()
{
	return this.showOrigin;
};
API.prototype.setShowOrigin = function(showOrigin)
{
	this.showOrigin = showOrigin;
};

API.prototype.getShowBoundingBox = function() 
{
	return this.showBoundingBox;
};
API.prototype.setShowBoundingBox = function(showBoundingBox) 
{
	this.showBoundingBox = showBoundingBox;
};

API.prototype.getShowShadow = function() 
{
	return this.showShadow;
};
API.prototype.setShowShadow = function(showShadow) 
{
	this.showShadow = showShadow;
};

API.prototype.getFrustumFarDistance = function() 
{
	return this.frustumFarDistance;
};
API.prototype.setFrustumFarDistance = function(frustumFarDistance) 
{
	this.frustumFarDistance = frustumFarDistance;
};

API.prototype.getObjectMoveMode = function() 
{
	return this.objectMoveMode;
};
API.prototype.setObjectMoveMode = function(objectMoveMode) 
{
	this.objectMoveMode = objectMoveMode;
};

API.prototype.getIssueInsertEnable = function() 
{
	return this.issueInsertEnable;
};
API.prototype.setIssueInsertEnable = function(issueInsertEnable) 
{
	this.issueInsertEnable = issueInsertEnable;
};
API.prototype.getObjectInfoViewEnable = function() 
{
	return this.objectInfoViewEnable;
};
API.prototype.setObjectInfoViewEnable = function(objectInfoViewEnable) 
{
	this.objectInfoViewEnable = objectInfoViewEnable;
};
API.prototype.getOcclusionCullingEnable = function() 
{
	return this.occlusionCullingEnable;
};
API.prototype.setOcclusionCullingEnable = function(occlusionCullingEnable) 
{
	this.occlusionCullingEnable = occlusionCullingEnable;
};
API.prototype.getNearGeoIssueListEnable = function() 
{
	return this.nearGeoIssueListEnable;
};
API.prototype.setNearGeoIssueListEnable = function(nearGeoIssueListEnable) 
{
	this.nearGeoIssueListEnable = nearGeoIssueListEnable;
};

API.prototype.getInsertIssueState = function() 
{
	return this.insertIssueState;
};
API.prototype.setInsertIssueState = function(insertIssueState) 
{
	this.insertIssueState = insertIssueState;
};

API.prototype.getDrawType = function() 
{
	return this.drawType;
};
API.prototype.setDrawType = function(drawType) 
{
	this.drawType = drawType;
};

API.prototype.getLod0DistInMeters = function() 
{
	return this.lod0DistInMeters;
};
API.prototype.setLod0DistInMeters = function(lod0DistInMeters) 
{
	this.lod0DistInMeters = lod0DistInMeters;
};
API.prototype.getLod1DistInMeters = function() 
{
	return this.lod1DistInMeters;
};
API.prototype.setLod1DistInMeters = function(lod1DistInMeters) 
{
	this.lod1DistInMeters = lod1DistInMeters;
};
API.prototype.getLod2DistInMeters = function() 
{
	return this.lod2DistInMeters;
};
API.prototype.setLod2DistInMeters = function(lod2DistInMeters) 
{
	this.lod2DistInMeters = lod2DistInMeters;
};
API.prototype.getLod3DistInMeters = function() 
{
	return this.lod3DistInMeters;
};
API.prototype.setLod3DistInMeters = function(lod3DistInMeters) 
{
	this.lod3DistInMeters = lod3DistInMeters;
};
API.prototype.getLod4DistInMeters = function() 
{
	return this.lod4DistInMeters;
};
API.prototype.setLod4DistInMeters = function(lod4DistInMeters) 
{
	this.lod4DistInMeters = lod4DistInMeters;
};
API.prototype.getLod5DistInMeters = function() 
{
	return this.lod5DistInMeters;
};
API.prototype.setLod5DistInMeters = function(lod5DistInMeters) 
{
	this.lod5DistInMeters = lod5DistInMeters;
};

API.prototype.getAmbientReflectionCoef = function() 
{
	return this.ambientReflectionCoef;
};
API.prototype.setAmbientReflectionCoef = function(ambientReflectionCoef) 
{
	this.ambientReflectionCoef = ambientReflectionCoef;
};
API.prototype.getDiffuseReflectionCoef = function() 
{
	return this.diffuseReflectionCoef;
};
API.prototype.setDiffuseReflectionCoef = function(diffuseReflectionCoef) 
{
	this.diffuseReflectionCoef = diffuseReflectionCoef;
};
API.prototype.getSpecularReflectionCoef = function() 
{
	return this.specularReflectionCoef;
};
API.prototype.setSpecularReflectionCoef = function(specularReflectionCoef) 
{
	this.specularReflectionCoef = specularReflectionCoef;
};
API.prototype.getAmbientColor = function() 
{
	return this.ambientColor;
};
API.prototype.setAmbientColor = function(ambientColor) 
{
	this.ambientColor = ambientColor;
};
API.prototype.getSpecularColor = function() 
{
	return this.specularColor;
};
API.prototype.setSpecularColor = function(specularColor) 
{
	this.specularColor = specularColor;
};
API.prototype.getSsaoRadius = function() 
{
	return this.ssaoRadius;
};
API.prototype.setSsaoRadius = function(ssaoRadius) 
{
	this.ssaoRadius = ssaoRadius;
};
API.prototype.getFPVMode = function()
{
	return this.FPVMode;
};
API.prototype.setFPVMode = function(value)
{
	this.FPVMode = value;
};
API.prototype.getMagoMode = function()
{
	return this.magoMode;
};
API.prototype.setMagoMode = function(value)
{
	this.magoMode = value;
};
API.prototype.getDuration = function()
{
	return this.duration;
};
API.prototype.setDuration = function(duration)
{
	this.duration = duration;
};

API.prototype.getInputPoint = function()
{
	return this.inputPoint;
};
API.prototype.setInputPoint = function(inputPoint)
{
	this.inputPoint = inputPoint;
};

API.prototype.getResultPoint = function()
{
	return this.resultPoint;
};
API.prototype.setResultPoint = function(resultPoint)
{
	this.resultPoint = resultPoint;
};

API.prototype.getUnit = function()
{
	return this.unit;
};
API.prototype.setUnit = function(unit)
{
	if (unit !== undefined)
	{
		if (isNaN(unit) || unit > CODE.units.RADIAN)
		{
			throw new Error('unit parameter needs CODE.units');
		}
		this.unit = unit;
	}
};