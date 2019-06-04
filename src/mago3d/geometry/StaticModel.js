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





































