'use strict';

/**
 */
var LodBuilding = function() 
{
	if (!(this instanceof LodBuilding)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
	this.attributes; // object.
	
	this.skinLego;
	this.texture;
	
};

/**
 * render할 준비가 됬는지 체크
 * @returns {Boolean} this.fileLoadState가 CODE.fileLoadState.PARSE_FINISHED(4)이거나 this.texture, this.texture.texId가 존재할때 true 반환
 */
LodBuilding.prototype.isReadyToRender = function()
{
	if (this.skinLego === undefined)
	{ return false; }
	
	if (this.skinLego.fileLoadState !== CODE.fileLoadState.PARSE_FINISHED)
	{ return false; }
	
	if (this.texture === undefined || this.texture.texId === undefined) // In the future, a skin can has no texture. TODO:
	{ return false; }
	
	return true;
};

/**
 * F4D Lego 자료를 gl에 렌더
 * 
 * @param {MagoManager} magoManager
 * @param {Number} renderType
 * @param {Boolean} renderTexture
 * @param {PostFxShader} shader 
 */
LodBuilding.prototype.render = function(magoManager, renderType, renderTexture, shader, owner)
{
	return this.skinLego.render(magoManager, renderType, renderTexture, shader, owner);
};