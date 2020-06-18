'use strict';

/**
 * This is the layer for MagoModel.
 * @class MagoLayer
 * 
 * @param {MagoLayer~option} option layer object.
 */
var MagoLayer = function(option)
{
	/**
	 * @typedef {object} MagoLayer~option
	 * @property {string} dataGroupId 필수. 레이어 아이디
	 * @property {string} dataGroupKey 필수. 레이어 키. f4d폴더와 매칭.
	 * @property {string} dataGroupName 필수. 레이어 이름
	 * @property {string} dataGroupPath 필수. 레이어 폴더 경로.
	 * @property {boolean} tiling 스마트 타일링 레이어 유무. 기본은 false.
	 * @property {MagoLayer~style} style 레이어 전역 스타일 정보. 옵션.
	 * @property {number} longitude 옵션. 
	 * @property {number} latitude 옵션.
	 * @property {number} altitude 옵션.
	 */
	if (!(this instanceof MagoLayer)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	if (isEmpty(option.dataGroupId))
	{
		throw new Error(Messages.REQUIRED_EMPTY_ERROR('dataGroupId'));
	}

	if (isEmpty(option.dataGroupKey))
	{
		throw new Error(Messages.REQUIRED_EMPTY_ERROR('dataGroupKey'));
	}

	if (isEmpty(option.dataGroupName))
	{
		throw new Error(Messages.REQUIRED_EMPTY_ERROR('dataGroupName'));
	}

	if (isEmpty(option.dataGroupPath))
	{
		throw new Error(Messages.REQUIRED_EMPTY_ERROR('dataGroupPath'));
	}
	this.ready = false;

	// objectfile을 성공적으로 읽을 시 할당됨.
	this.buildingSeedMap;

	this.id = option.dataGroupId;
	this.key = option.dataGroupKey;
	this.name = option.dataGroupName;
	this.path = option.dataGroupPath.replace(/\/+$/, '');
    
	this.tiling = defaultValue(option.tiling, false);
	this.style = Object.assign({}, option.style||{});

	var longitude = option.longitude;
	var latitude = option.latitude;
	var altitude = option.altitude;

	if (!isNaN(longitude) && !isNaN(latitude) && !isNaN(altitude)) 
	{
		//TODO
	}
	//datas

	this.datas = [];
}; 

MagoLayer.prototype.getObjectIndexFile = function()
{
	var that = this;
	var filePath = '/f4d/' + this.path + Constant.OBJECT_INDEX_FILE + Constant.CACHE_VERSION + new Date().getTime();
	loadWithXhr(filePath).then(function(response) 
	{	
		var arrayBuffer = response;
		if (arrayBuffer) 
		{
			var buildingSeedMap = new BuildingSeedMap();
			buildingSeedMap.dataArrayBuffer = arrayBuffer;
			buildingSeedMap.parseBuildingSeedArrayBuffer();

			that.ready = true;
			that.buildingSeedMap = buildingSeedMap;
			
			if (that.datas.length > 0) 
			{
				//
			}
		}
	},
	function(status) 
	{
		console.log("xhr status = " + status);
	}).finally(function() 
	{
		//
	});
	/*
	MagoManager.prototype.getObjectIndexFile = function(projectId, projectDataFolder) 
	{
		if (this.configInformation === undefined)
		{
			this.configInformation = MagoConfig.getPolicy();
		}
		
		//this.buildingSeedList = new BuildingSeedList();
		
		var geometrySubDataPath = projectDataFolder;
		var fileName = this.readerWriter.geometryDataPath + "/" + geometrySubDataPath + Constant.OBJECT_INDEX_FILE + Constant.CACHE_VERSION + new Date().getTime();
		this.readerWriter.getObjectIndexFileForSmartTile(fileName, this, undefined, projectId);
	};
	*/
};