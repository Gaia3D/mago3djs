'use strict';
/**
 * 같은 중심을 가진 튜브들의 모임. 우측과 같이 생긴 모양을 뜻함.-> ◎ 
 * @class ConcetricTubes
 * 
 * @param {Object} option 
 * @param {GeoLocationDataManager} geoLocDataManager Optional
 */
var ConcentricTubes = function(option, geoLocDataManager)
{
	MagoRenderable.call(this);
	/**
	 * @type {number}
	 * @default 0
	 */
	this.height = defaultValue(option.height, 0);

	/**
	 * The geographic location of the factory.
	 * @type {GeoLocationDataManager}
	 * @default undefined
	 */
	this.geoLocDataManager;

	if (defined(geoLocDataManager)) 
	{
		this.geoLocDataManager = geoLocDataManager;
	}
    
	
	this.bbox;
	this.options = option;
};

ConcentricTubes.prototype = Object.create(MagoRenderable.prototype);
ConcentricTubes.prototype.constructor = ConcentricTubes;
/**
 * 초기 튜브 정보를 가지고 튜브들을 초기화 함.
 */
ConcentricTubes.prototype.clear = function() 
{
	this.objectsArray = [];
};

/**
 * 튜브정보를 이용하여 튜브 생성 후 튜브어레이에 넣음
 * @param {Object} option
 */
ConcentricTubes.prototype.makeMesh = function() 
{
	var tubeInfos = this.options.tubeInfos;
	if (defined(tubeInfos))
	{	
		this.clear();
		for (var i=0, len=tubeInfos.length;i<len;i++) 
		{
			this.makeTube(tubeInfos[i]);
		}
		
		this.setDirty(false);
	}
};

/**
 * 튜브정보를 이용하여 튜브 생성 후 튜브어레이에 넣음
 * @param {Object} option
 */
ConcentricTubes.prototype.makeTube = function(option) 
{
	var interiorRadius = option.interiorRadius;
	var exteriorRadius = option.exteriorRadius;
	var height = this.getHeight(); 
	var options = option;

	var tube = new Tube(interiorRadius, exteriorRadius, height, options);
	tube.owner = this;
	this.objectsArray.push(tube);
};

/**
 * Returns the bbox.
 */
ConcentricTubes.prototype.getBoundingBox = function()
{
	if (this.bbox === undefined)
	{
		this.bbox = new BoundingBox();
		for (var i=0, len=this.getSize(); i<len; i++) 
		{
			var tube = this.getTube(i);

			var tubeBbox = tube.getBoundingBox();
			if (i === 0)
			{ this.bbox.copyFrom(tubeBbox); }
			else
			{ this.bbox.addBox(tubeBbox); }
		}
	}
	return this.bbox;
};

/**
 * 높이 설정
 * @param {number} height
 */
ConcentricTubes.prototype.setHeight = function(height) 
{
	this.height = height;
};

/**
 * 높이 반환
 * @return {number}
 */
ConcentricTubes.prototype.getHeight = function(height) 
{
	return this.height;
};

/**
 * 튜브 추가
 * @param {Tube} tube
 */
ConcentricTubes.prototype.addTube = function(tube) 
{
	this.objectsArray.push(tube);
};
/**
 * 튜브 목록 반환
 * @return {Array.<Tube>}
 */
ConcentricTubes.prototype.getTubes = function() 
{
	return this.objectsArray;
};
/**
 * 인덱스에 해당하는 튜브 반환
 * @param {number} index array index
 * @return {Tube}
 */
ConcentricTubes.prototype.getTube = function(index) 
{
	return this.objectsArray[index];
};

/**
 * 튜브 갯수 반환
 * @return {number}
 */
ConcentricTubes.prototype.getSize = function() 
{
	return this.objectsArray.length;
};













