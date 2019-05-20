'use strict';

/**
 * Policy
 * @class Policy
 */
var Policy = function() 
{
	if (!(this instanceof Policy)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	// mago3d 활성화/비활성화 여부
	this.magoEnable = true;

	// outfitting 표시 여부
	this.showOutFitting = false;
	// label 표시/비표시
	this.showLabelInfo = false;
	// boundingBox 표시/비표시
	this.showBoundingBox = false;
	// 그림자 표시/비표시
	this.showShadow = false;
	// squared far frustum 거리
	this.frustumFarSquaredDistance = 5000000;
	// far frustum
	this.frustumFarDistance = 20000;

	// highlighting
	this.highLightedBuildings = [];
	// color
	this.colorBuildings = [];
	// color
	this.color = [];
	// show/hide
	this.hideBuildings = [];
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
	// origin axis XYZ
	this.showOrigin = false;
	// mago generalMode
	this.magoMode = CODE.magoMode.NORMAL;
	
	// 이미지 경로
	this.imagePath = "";
	
	// provisional.***
	this.colorChangedObjectId;
	
	// LOD1
	this.lod0DistInMeters = 15;
	this.lod1DistInMeters = 50;
	this.lod2DistInMeters = 90;
	this.lod3DistInMeters = 200;
	this.lod4DistInMeters = 1000;
	this.lod5DistInMeters = 50000;
	
	// Lighting
	this.ambientReflectionCoef = 0.45; // 0.2.
	this.diffuseReflectionCoef = 0.75; // 1.0
	this.specularReflectionCoef = 0.6; // 0.7
	this.ambientColor = null;
	this.specularColor = new Float32Array([0.6, 0.6, 0.6]);
	
	this.ssaoRadius = 0.15;
	
	// PointsCloud.***
	this.pointsCloudSettings = {};
	this.pointsCloudSettings.maxPartitionsLod0 = 8;
	this.pointsCloudSettings.maxPartitionsLod1 = 4;
	this.pointsCloudSettings.maxPartitionsLod2orLess = 1;
	this.pointsCloudSettings.MaxPerUnitPointsRenderDistToCam0m = 1.0;
	this.pointsCloudSettings.MaxPerUnitPointsRenderDistToCam100m = 1.0/6.0;
	this.pointsCloudSettings.MaxPerUnitPointsRenderDistToCam200m = 1.0/12.0;
	this.pointsCloudSettings.MaxPerUnitPointsRenderDistToCam400m = 1.0/24.0;
	this.pointsCloudSettings.MaxPerUnitPointsRenderDistToCam800m = 1.0/48.0;
	this.pointsCloudSettings.MaxPerUnitPointsRenderDistToCam1600m = 1.0/128.0;
	this.pointsCloudSettings.MaxPerUnitPointsRenderDistToCamMoreThan1600m = 1.0/256.0;
	
};

Policy.prototype.getPointsCloudSettings = function() 
{
	return this.pointsCloudSettings;
};

Policy.prototype.getShowOrigin = function() 
{
	return this.showOrigin;
};
Policy.prototype.setShowOrigin = function(showOrigin) 
{
	this.showOrigin = showOrigin;
};

Policy.prototype.getMagoEnable = function() 
{
	return this.magoEnable;
};
Policy.prototype.setMagoEnable = function(magoEnable) 
{
	this.magoEnable = magoEnable;
};

Policy.prototype.getShowOutFitting = function() 
{
	return this.showOutFitting;
};
Policy.prototype.setShowOutFitting = function(showOutFitting) 
{
	this.showOutFitting = showOutFitting;
};
Policy.prototype.getShowLabelInfo = function() 
{
	return this.showLabelInfo;
};
Policy.prototype.setShowLabelInfo = function(showLabelInfo) 
{
	this.showLabelInfo = showLabelInfo;
};
Policy.prototype.getShowBoundingBox = function() 
{
	return this.showBoundingBox;
};
Policy.prototype.setShowBoundingBox = function(showBoundingBox) 
{
	this.showBoundingBox = showBoundingBox;
};

Policy.prototype.getShowShadow = function() 
{
	return this.showShadow;
};
Policy.prototype.setShowShadow = function(showShadow) 
{
	this.showShadow = showShadow;
};

Policy.prototype.getFrustumFarSquaredDistance = function() 
{
	return this.frustumFarSquaredDistance;
};
Policy.prototype.setFrustumFarSquaredDistance = function(frustumFarSquaredDistance) 
{
	this.frustumFarSquaredDistance = frustumFarSquaredDistance;
};

Policy.prototype.getFrustumFarDistance = function() 
{
	return this.frustumFarDistance;
};
Policy.prototype.setFrustumFarDistance = function(frustumFarDistance) 
{
	this.frustumFarDistance = frustumFarDistance;
};

Policy.prototype.getHighLightedBuildings = function() 
{
	return this.highLightedBuildings;
};
Policy.prototype.setHighLightedBuildings = function(highLightedBuildings) 
{
	this.highLightedBuildings = highLightedBuildings;
};

Policy.prototype.getColorBuildings = function() 
{
	return this.colorBuildings;
};
Policy.prototype.setColorBuildings = function(colorBuildings) 
{
	this.colorBuildings = colorBuildings;
};

Policy.prototype.getColor = function() 
{
	return this.color;
};
Policy.prototype.setColor = function(color) 
{
	this.color = color;
};

Policy.prototype.getHideBuildings = function() 
{
	return this.hideBuildings;
};
Policy.prototype.setHideBuildings = function(hideBuildings) 
{
	this.hideBuildings = hideBuildings;
};

Policy.prototype.getObjectMoveMode = function() 
{
	return this.objectMoveMode;
};
Policy.prototype.setObjectMoveMode = function(objectMoveMode) 
{
	this.objectMoveMode = objectMoveMode;
};

Policy.prototype.getMagoMode = function() 
{
	return this.magoMode;
};
Policy.prototype.setMagoMode = function(magoMode) 
{
	this.magoMode = magoMode;
};

Policy.prototype.getIssueInsertEnable = function() 
{
	return this.issueInsertEnable;
};
Policy.prototype.setIssueInsertEnable = function(issueInsertEnable) 
{
	this.issueInsertEnable = issueInsertEnable;
};
Policy.prototype.getObjectInfoViewEnable = function() 
{
	return this.objectInfoViewEnable;
};
Policy.prototype.setObjectInfoViewEnable = function(objectInfoViewEnable) 
{
	this.objectInfoViewEnable = objectInfoViewEnable;
};
Policy.prototype.getOcclusionCullingEnable = function() 
{
	return this.occlusionCullingEnable;
};
Policy.prototype.setOcclusionCullingEnable = function(occlusionCullingEnable) 
{
	this.occlusionCullingEnable = occlusionCullingEnable;
};
Policy.prototype.getNearGeoIssueListEnable = function() 
{
	return this.nearGeoIssueListEnable;
};
Policy.prototype.setNearGeoIssueListEnable = function(nearGeoIssueListEnable) 
{
	this.nearGeoIssueListEnable = nearGeoIssueListEnable;
};

Policy.prototype.getImagePath = function() 
{
	return this.imagePath;
};
Policy.prototype.setImagePath = function(imagePath) 
{
	this.imagePath = imagePath;
};

Policy.prototype.getLod = function(distInMeters) 
{
	var lod = -1;
	if (distInMeters < this.lod0DistInMeters)
	{ lod = 0; }
	else if (distInMeters < this.lod1DistInMeters)
	{ lod = 1; }
	else if (distInMeters < this.lod2DistInMeters)
	{ lod = 2; }
	else if (distInMeters < this.lod3DistInMeters)
	{ lod = 3; }
	else if (distInMeters < this.lod4DistInMeters)
	{ lod = 4; }
	else 
	{ lod = 5; }
	
	return lod;	
};
Policy.prototype.getLod0DistInMeters = function() 
{
	return this.lod0DistInMeters;
};
Policy.prototype.setLod0DistInMeters = function(lod0DistInMeters) 
{
	this.lod0DistInMeters = lod0DistInMeters;
};
Policy.prototype.getLod1DistInMeters = function() 
{
	return this.lod1DistInMeters;
};
Policy.prototype.setLod1DistInMeters = function(lod1DistInMeters) 
{
	this.lod1DistInMeters = lod1DistInMeters;
};
Policy.prototype.getLod2DistInMeters = function() 
{
	return this.lod2DistInMeters;
};
Policy.prototype.setLod2DistInMeters = function(lod2DistInMeters) 
{
	this.lod2DistInMeters = lod2DistInMeters;
};
Policy.prototype.getLod3DistInMeters = function() 
{
	return this.lod3DistInMeters;
};
Policy.prototype.setLod3DistInMeters = function(lod3DistInMeters) 
{
	this.lod3DistInMeters = lod3DistInMeters;
};
Policy.prototype.getLod4DistInMeters = function() 
{
	return this.lod4DistInMeters;
};
Policy.prototype.setLod4DistInMeters = function(lod4DistInMeters) 
{
	this.lod4DistInMeters = lod4DistInMeters;
};
Policy.prototype.getLod5DistInMeters = function() 
{
	return this.lod5DistInMeters;
};
Policy.prototype.setLod5DistInMeters = function(lod5DistInMeters) 
{
	this.lod5DistInMeters = lod5DistInMeters;
};
Policy.prototype.getAmbientReflectionCoef = function() 
{
	return this.ambientReflectionCoef;
};
Policy.prototype.setAmbientReflectionCoef = function(ambientReflectionCoef) 
{
	this.ambientReflectionCoef = ambientReflectionCoef;
};
Policy.prototype.getDiffuseReflectionCoef = function() 
{
	return this.diffuseReflectionCoef;
};
Policy.prototype.setDiffuseReflectionCoef = function(diffuseReflectionCoef) 
{
	this.diffuseReflectionCoef = diffuseReflectionCoef;
};
Policy.prototype.getSpecularReflectionCoef = function() 
{
	return this.specularReflectionCoef;
};
Policy.prototype.setSpecularReflectionCoef = function(specularReflectionCoef) 
{
	this.specularReflectionCoef = specularReflectionCoef;
};
Policy.prototype.getAmbientColor = function() 
{
	return this.ambientColor;
};
Policy.prototype.setAmbientColor = function(ambientColor) 
{
	this.ambientColor = ambientColor;
};
Policy.prototype.getSpecularColor = function() 
{
	return this.specularColor;
};
Policy.prototype.setSpecularColor = function(specularColor) 
{
	this.specularColor = specularColor;
};
Policy.prototype.getSsaoRadius = function() 
{
	return this.ssaoRadius;
};
Policy.prototype.setSsaoRadius = function(ssaoRadius) 
{
	this.ssaoRadius = ssaoRadius;
};