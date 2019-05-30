'use strict';

/**
 * F4D LodBuildingData 클래스
 * Node의 NeoBuilding안에서 사용.
 * @exception {Error} Messages.CONSTRUCT_ERROR
 * 
 * @alias LodBuildingData
 * @class LodBuildingData
 * 
 * 아래 문서의 Table 1-3 (lodInfo) 참조
 * @link https://github.com/Gaia3D/F4DConverter/blob/master/doc/F4D_SpecificationV1.pdf
 */
var LodBuildingData = function() 
{
	if (!(this instanceof LodBuildingData)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	/**
	 * lod of this data.
	 * @type {Number}
	 */
	this.lod;

	/**
	 * 모델 레퍼런스 유무 0 : false, 1 : true
	 * @type {Number}
	 */
	this.isModelRef;

	/**
	 * geometry 파일명, isModelRef가 0일 경우 선언.
	 * @type {String}
	 * 
	 * @example lod0, lod1
	 */
	this.geometryFileName;

	/**
	 * texture 파일명 lod가 2일 경우 혹은 isModelRef가 0일 경우 선언
	 * @type {String}
	 * 
	 * @example mosaicTextureLod0.jpg
	 */
	this.textureFileName;
	//this.dataType; // no used yet.***
};