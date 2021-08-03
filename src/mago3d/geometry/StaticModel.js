'use strict';

/**
 * 정적모델데이터
 * 
 * @class
 */
var StaticModel = function() 
{
	if (!(this instanceof StaticModel)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	/**
	 * 고유 아이디
	 * @type {String}
	 */
	this.guid = "";
	
	/**
	 * 건물 이름
	 * @type {String}
	 */
	this.buildingFolderName = "";

	/**
	 * 프로젝트 이름
	 * @type {String}
	 */
	this.projectFolderName= "";

	/**
	 * 건물 객체
	 * @type {F4D}
	 */
	this.neoBuilding = undefined;
};


/**
 * 정적모델데이터 관리자
 * 
 * @class
 */
var StaticModelsManager = function() 
{
	if (!(this instanceof StaticModelsManager)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this.staticModelsMap = {};
};

/**
 * 고유아이디를 가진 정적모델데이터를 추가한다.
 * 
 * @param {String} guid 고유아이디
 * @param {StaticModel} staticModel 정적모델데이터
 */
StaticModelsManager.prototype.addStaticModel = function(guid, staticModel)
{
	this.staticModelsMap[guid] = staticModel;
};


/**
 * 고유아이디를 가진 정적모델데이터를 가져온다.
 *
 * @param {String} guid 고유아이디
 * @returns {StaticModel} 정적모델데이터
 */
StaticModelsManager.prototype.getStaticModel = function(guid)
{
	var staticModel = this.staticModelsMap[guid];
	if (staticModel === undefined)
	{
		throw new Error('StaticModel is not exist.');
	}
	return staticModel;
};

StaticModelsManager.manageStaticModel = function(node, magoManager) {
	// Check if the node is a referenceNode.***
	var attributes = node.data.attributes;
	if (attributes === undefined) { 
		return; 
	}

	var neoBuilding = node.data.neoBuilding;
		
	if (attributes.projectId !== undefined && attributes.isReference !== undefined && attributes.isReference === true) {
		var projectFolderName;
		var neoBuildingFolderName;
	
		// check if has neoBuilding.***
		if(neoBuilding || neoBuilding instanceof NeoBuilding) return;

		var neoBuildingFolderName = attributes.buildingFolderName;
		projectFolderName = attributes.projectFolderName;
		
		// demand to staticModelsManager the neoBuilding.***
		var projectId = attributes.projectId;
		var staticModelsManager = magoManager.hierarchyManager.getStaticModelsManager();
		var staticModel = staticModelsManager.getStaticModel(projectId);
		neoBuilding = staticModel.neoBuilding;
		neoBuildingFolderName = staticModel.buildingFolderName;
		projectFolderName = staticModel.projectFolderName;
		
		//neoBuilding = staticModelsManager.getStaticModel(staticModelDataPath);
		
		// make a buildingSeed.***
		var buildingSeed = new BuildingSeed();
		buildingSeed.fisrtName = neoBuildingFolderName;
		buildingSeed.name = neoBuildingFolderName;
		buildingSeed.buildingId = neoBuildingFolderName;
		buildingSeed.buildingFileName = neoBuildingFolderName;
		buildingSeed.geographicCoord = new GeographicCoord(attributes.longitude, attributes.latitude, attributes.height); // class : GeographicCoord.
		buildingSeed.rotationsDegree = new Point3D(attributes.pitch, attributes.roll, attributes.heading); // class : Point3D. (heading, pitch, roll).
		buildingSeed.bBox = new BoundingBox();           // class : BoundingBox.
		buildingSeed.bBox.init();
		buildingSeed.bBox.expand(10.0); // we dont know the bbox size, provisionally set as 10,10,10.***
		buildingSeed.geographicCoordOfBBox = new GeographicCoord(attributes.longitude, attributes.latitude, attributes.height);  // class : GeographicCoord.
		buildingSeed.smartTileOwner;
		
		// Now, set neoBuildings parameters.***
		neoBuilding.buildingFileName = neoBuildingFolderName;
		neoBuilding.nodeOwner = node; // Attention! : static model has no NODE owner.!!!
		node.data.neoBuilding = neoBuilding;
		node.data.buildingSeed = buildingSeed;
		node.data.projectFolderName = projectFolderName;

		if (neoBuilding.metaData === undefined) 
		{ 
			neoBuilding.metaData = new MetaData(); 
			
			if (neoBuilding.metaData.geographicCoord === undefined)
			{ neoBuilding.metaData.geographicCoord = new GeographicCoord(); }

			if (neoBuilding.metaData.bbox === undefined) 
			{ neoBuilding.metaData.bbox = new BoundingBox(); }
		
			neoBuilding.metaData.geographicCoord.setLonLatAlt(buildingSeed.geographicCoord.longitude, buildingSeed.geographicCoord.latitude, buildingSeed.geographicCoord.altitude);
			neoBuilding.metaData.bbox.copyFrom(buildingSeed.bBox);
			neoBuilding.metaData.heading = buildingSeed.rotationsDegree.z;
			neoBuilding.metaData.pitch = buildingSeed.rotationsDegree.x;
			neoBuilding.metaData.roll = buildingSeed.rotationsDegree.y;

			if (neoBuilding.bbox === undefined)
			{ neoBuilding.bbox = new BoundingBox(); }
			neoBuilding.bbox.copyFrom(buildingSeed.bBox);
		} else {
			neoBuilding.bbox = neoBuilding.metaData.bbox;
			if (node.isNeedValidHeight(magoManager)) { magoManager._needValidHeightNodeArray.push(node); }
		}

		neoBuilding.name = "test_" + neoBuildingFolderName;
		neoBuilding.buildingId = neoBuildingFolderName;
		neoBuilding.buildingType = "basicBuilding";
		neoBuilding.projectFolderName = node.data.projectFolderName;
	}
};



































