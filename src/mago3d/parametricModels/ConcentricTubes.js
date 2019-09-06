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
    
	/**
	 * tube array
	 * @type {Array.<Tube>}
	 * @default undefined
	 */
	this.tubes = [];
	
	this.bbox;

	this.initTube(option.tubeInfos);
};

/**
 * 초기 튜브 정보를 가지고 튜브들을 초기화 함.
 * @param {Array.<Object>} tubeInfos
 */
ConcentricTubes.prototype.initTube = function(tubeInfos) 
{
	if (defined(tubeInfos))
	{
		for (var i=0, len=tubeInfos.length;i<len;i++) 
		{
			this.makeTube(tubeInfos[i]);
		}
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

	this.addTube(tube);
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
	this.tubes.push(tube);
};
/**
 * 튜브 목록 반환
 * @return {Array.<Tube>}
 */
ConcentricTubes.prototype.getTubes = function() 
{
	return this.tubes;
};
/**
 * 인덱스에 해당하는 튜브 반환
 * @param {number} index array index
 * @return {Tube}
 */
ConcentricTubes.prototype.getTube = function(index) 
{
	return this.tubes[index];
};

/**
 * 튜브 갯수 반환
 * @return {number}
 */
ConcentricTubes.prototype.getSize = function() 
{
	return this.tubes.length;
};

/**
 * getGeoLocDataManager 반환
 * @return {GeoLocationDataManager}
 */
ConcentricTubes.prototype.getGeoLocDataManager = function() 
{
	return this.geoLocDataManager;
};

/**
 * 튜브 렌더링
 * @param {MagoManager} magoManager
 * @param {Shader} shader
 * @param {number} renderType
 * @param {GL} glPrimitive
 */
ConcentricTubes.prototype.render = function (magoManager, shader, renderType, glPrimitive) 
{
	if (this.attributes && this.attributes.isVisible !== undefined && this.attributes.isVisible === false) 
	{
		return;
	}

	var gl = magoManager.getGl();
	var isSelected = false;
	if (renderType === 0)
	{
		// Depth render.***
	}
	else if (renderType === 1)
	{
		// Color render.***
		var selectionManager = magoManager.selectionManager;
		if (selectionManager.isObjectSelected(this))
		{ isSelected = true; }
	}
	else if (renderType === 2)
	{
		// Selection render.***
		var selectionColor = magoManager.selectionColor;
		var colorAux = magoManager.selectionColor.getAvailableColor(undefined);
		var idxKey = magoManager.selectionColor.decodeColor3(colorAux.r, colorAux.g, colorAux.b);
		magoManager.selectionManager.setCandidateGeneral(idxKey, this);
		
		gl.uniform4fv(shader.oneColor4_loc, [colorAux.r/255.0, colorAux.g/255.0, colorAux.b/255.0, 1.0]);
		gl.disable(gl.BLEND);
	}
	
	var geoLocManager = this.getGeoLocDataManager();
	for (var i=0, len=this.getSize(); i<len; i++) 
	{
		var tube = this.getTube(i);

		if (!tube.geoLocDataManager) { tube.geoLocDataManager = geoLocManager; }
		tube.renderRaw(magoManager, shader, renderType, glPrimitive, isSelected);
	}
};
















