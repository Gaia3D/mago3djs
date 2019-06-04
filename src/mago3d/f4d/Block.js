'use strict';

/**
 * 블럭 모델
 * @class Block
 */
var Block = function() 
{
	if (!(this instanceof Block)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	// This has "VertexIdxVBOArraysContainer" because the "indices" cannot to be greater than 65000, because indices are short type.
	this.vBOVertexIdxCacheKeysContainer = new VBOVertexIdxCacheKeysContainer(); // Change this for "vbo_VertexIdx_CacheKeys_Container__idx".
	this.mIFCEntityType = -1;
	this.isSmallObj = false;
	this.radius = 10;
	this.vertexCount = 0; // only for test. delete this.

	this.lego; // legoBlock.
};

/**
 * 블럭이 가지는 데이터 삭제
 * @returns block
 */
Block.prototype.deleteObjects = function(gl, vboMemManager) 
{

	this.vBOVertexIdxCacheKeysContainer.deleteGlObjects(gl, vboMemManager);
	this.vBOVertexIdxCacheKeysContainer = undefined;
	this.mIFCEntityType = undefined;
	this.isSmallObj = undefined;
	this.radius = undefined;
	this.vertexCount = undefined; // only for test. delete this.

	if (this.lego) { this.lego.deleteGlObjects(gl); }

	this.lego = undefined;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param 
  * @returns {boolean} returns if the Block is ready to render.
 */
Block.prototype.isReadyToRender = function(neoReference, magoManager, maxSizeToRender) 
{
	if (maxSizeToRender && (this.radius < maxSizeToRender))
	{ return false; }
	
	if (magoManager.isCameraMoving && this.radius < magoManager.smallObjectSize && magoManager.objectSelected !== neoReference)
	{ return false; }

	return true;
};
