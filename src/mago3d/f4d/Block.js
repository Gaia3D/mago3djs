'use strict';

/**
 * 블럭 모델
 * 
 * @class Block
 * 
 * @exception {Error} Messages.CONSTRUCT_ERROR
 * 아래 문서의 1.3 Models Folder의 항목 참조
 * @link https://github.com/Gaia3D/F4DConverter/blob/master/doc/F4D_SpecificationV1.pdf
 */
var Block = function() 
{
	if (!(this instanceof Block)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	/**
	 * This class is the container which holds the VBO Cache Keys.
	 * @type {VBOVertexIdxCacheKeysContainer}
	 */
	this.vBOVertexIdxCacheKeysContainer = new VBOVertexIdxCacheKeysContainer();

	/**
	 * @deprecated
	 * @type {number}
	 * @default -1
	 */
	this.mIFCEntityType = -1;

	/**
	 * small object flag. 
	 * if bbox.getMaxLength() < 0.5, isSmallObj = true
	 * 
	 * @type {Boolean} 
	 * @default false
	 */
	this.isSmallObj = false;

	/**
	 * block radius
	 * 일반적으로 bbox.getMaxLength() / 2.0 로 선언됨.
	 * 
	 * @type {Boolean} 
	 * @default 10
	 */
	this.radius = 10;

	/**
	 * only for test.delete this.
	 * @deprecated
	 */
	this.vertexCount = 0;

	/**
	 * 각각의 사물중 복잡한 모델이 있을 경우 Lego로 처리
	 * 현재는 사용하지 않으나 추후에 필요할 수 있어서 그대로 둠.
	 * legoBlock.
	 * @type {Lego}
	 */
	this.lego;
};

/**
 * block 초기화. gl에서 해당 block 및 lego 삭제
 * 
 * @param {WebGLRenderingContext} gl 
 * @param {VboManager} vboMemManager 
 */
Block.prototype.deleteObjects = function(gl, vboMemManager) 
{
	this.vBOVertexIdxCacheKeysContainer.deleteGlObjects(gl, vboMemManager);
	this.vBOVertexIdxCacheKeysContainer = undefined;
	this.mIFCEntityType = undefined;
	this.isSmallObj = undefined;
	this.radius = undefined;
	// only for test. delete this.
	this.vertexCount = undefined;

	if (this.lego) { this.lego.deleteGlObjects(gl); }

	this.lego = undefined;
};

/**
 * render할 준비가 됬는지 체크
 * 
 * @param {NeoReference} neoReference magoManager의 objectSelected와 비교 하기 위한 neoReference 객체
 * @param {MagoManager} magoManager 
 * @param {Number} maxSizeToRender block의 radius와 비교하기 위한 ref number.
 * @returns {Boolean} block의 radius가 maxSizeToRender보다 크고, block의 radius가 magoManager의 보다 크고, 카메라가 움직이고 있지 않고, magoManager의 objectSelected와 neoReference가 같을 경우 true 반환
 */ 
Block.prototype.isReadyToRender = function(neoReference, magoManager, maxSizeToRender) 
{
	if (maxSizeToRender && (this.radius < maxSizeToRender))
	{ return false; }
	
	if (magoManager.isCameraMoving && this.radius < magoManager.smallObjectSize && magoManager.objectSelected !== neoReference)
	{ return false; }

	return true;
};
