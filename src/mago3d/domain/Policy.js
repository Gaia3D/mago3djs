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
	// boundingBox 표시/비표시
	this.showBoundingBox = false;
	// 그림자 표시/비표시
	this.showShadow = false;
	// far frustum 거리
	this.frustumFarSquaredDistance = 5000000;

	// highlighting
	this.highLightedBuildings = [];
	// color
	this.colorBuildings = [];
	// color
	this.color = [];
	// show/hide
	this.hideBuildings = [];
	// move mode
	this.mouseMoveMode = CODE.moveMode.NONE;
	// 이슈 등록 표시
	this.issueInsertEnable = false;
	// object 정보 표시
	this.objectInfoViewEnable = false;
	// 이슈 목록 표시
	this.nearGeoIssueListEnable = false;
	
	// 이미지 경로
	this.imagePath = "";
	
	// provisional.***
	this.colorChangedObjectId;
	
	// LOD1
	this.lod0 = null;
	this.lod1 = null;
	this.lod2 = null;
	this.lod3 = null;
	
	// Lighting
	this.ambientReflectionCoef = null;
	this.diffuseReflectionCoef = null;
	this.specularReflectionCoef = null;
	this.ambientColor = null;
	this.specularColor = null;
	
	this.ssaoRadius = null;
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

Policy.prototype.getMouseMoveMode = function() 
{
	return this.mouseMoveMode;
};
Policy.prototype.setMouseMoveMode = function(mouseMoveMode) 
{
	this.mouseMoveMode = mouseMoveMode;
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

Policy.prototype.getLod0 = function() 
{
	return this.lod0;
};
Policy.prototype.setLod0 = function(lod0) 
{
	this.lod0 = lod0;
};
Policy.prototype.getLod1 = function() 
{
	return this.lod1;
};
Policy.prototype.setLod1 = function(lod1) 
{
	this.lod1 = lod1;
};
Policy.prototype.getLod2 = function() 
{
	return this.lod2;
};
Policy.prototype.setLod2 = function(lod2) 
{
	this.lod2 = lod2;
};
Policy.prototype.getLod3 = function() 
{
	return this.lod3;
};
Policy.prototype.setLod3 = function(lod3) 
{
	this.lod3 = lod3;
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