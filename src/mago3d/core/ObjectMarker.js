'use strict';

/**
 * 어떤 일을 하고 있습니까?
 * @class ObjectMarker
 *
 */
var ObjectMarker = function() 
{
	if (!(this instanceof ObjectMarker)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	this.id;
	this.geoLocationData = new GeoLocationData();
	this.issue_id = null;
	this.issue_type = null;
	
	// ObjectMakers can be absolute or relative.
	this.target;
	
	this.imageFilePath;
	this.size2d = new Float32Array([25.0, 25.0]);
	this.bUseOriginalImageSize = true;
};

ObjectMarker.prototype.deleteObjects = function() 
{
	if (this.geoLocationData)
	{ 
		this.geoLocationData.deleteObjects(); 
	}
};

ObjectMarker.prototype.setImageFilePath = function(imageFilePath) 
{
	this.imageFilePath = imageFilePath;
};

ObjectMarker.prototype.copyFrom = function(objMarker) 
{
	if (objMarker === undefined) { return; }
		
	if (objMarker.geoLocationData) 
	{
		this.geoLocationData.copyFrom(objMarker.geoLocationData);
	}
	
	this.issue_id = objMarker.issue_id;
	this.issue_type = objMarker.issue_type;
};

ObjectMarker.prototype.render = function(magoManager, currentShader, renderType, glPrimitive) 
{
	// This function is created to skip rendering error when Renderer.prototype.renderSilhouetteDepth = function().
	// do nothing. do nothing. do nothing.
};

ObjectMarker.prototype.getGeoLocationData = function(magoManager) 
{
	var geoLocationData;
	var target = this.target;

	if (target)
	{
		if (target.buildingId !== undefined && target.projectId !== undefined)
		{
			var projectId = target.projectId;
			var buildingId = target.buildingId;
			var hierarchyManager = magoManager.hierarchyManager;
			var node = hierarchyManager.getNodeByDataKey(projectId, buildingId);
			if (node)
			{
				var neoBuilding = node.data.neoBuilding;
				var geoLocDataManager = node.data.geoLocDataManager;
				if (geoLocDataManager)
				{
					var buildingGeoLocation = geoLocDataManager.getCurrentGeoLocationData();
					if (target.objectId !== undefined && neoBuilding)
					{
						var neoReferencesArray = neoBuilding.getReferenceObjectsArrayByObjectId(target.objectId);
						if (neoReferencesArray && neoReferencesArray.length > 0)
						{
							var neoReference = neoReferencesArray[0];
							var centerPosWC = neoReference.getCenterPositionWC(neoBuilding, undefined);
							if (centerPosWC)
							{
								if (geoLocationData === undefined)
								{ geoLocationData = new GeoLocationData(); }

								// High and Low values of the position.**
								if (geoLocationData.positionHIGH === undefined)
								{ geoLocationData.positionHIGH = new Float32Array([0.0, 0.0, 0.0]); }
								if (geoLocationData.positionLOW === undefined)
								{ geoLocationData.positionLOW = new Float32Array([0.0, 0.0, 0.0]); }
								ManagerUtils.calculateSplited3fv([centerPosWC.x, centerPosWC.y, centerPosWC.z], geoLocationData.positionHIGH, geoLocationData.positionLOW);
							}
						}
					}
					else 
					{
						geoLocationData = buildingGeoLocation;
					}
				}
			}
		}
	}
	else 
	{
		geoLocationData = this.geoLocationData;
	}

	return geoLocationData;
};


