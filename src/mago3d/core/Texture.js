'use strict';


/**
 * 맵 이미지. 머티리얼에는 텍스처에 대한 참조가 포함될 수 있으므로 머티리얼의 셰이더는 객체의 표면색을 계산하는 동안 텍스처를 사용할 수 있습니다.
 * 오브제의 표면의 기본 색상 (알베도) 외에도 텍스쳐는 반사율이나 거칠기와 같은 재질 표면의 많은 다른면을 나타낼 수 있습니다.
 * This class deals the image of the map which will express the texture
 * @class Texture
 */
var Texture = function() 
{
	if (!(this instanceof Texture)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this.textureTypeName = "";
	this.textureImageFileName = "";
	this.texId; // webGlTexture.
	this.fileLoadState = CODE.fileLoadState.READY;
	this.imageBinaryData;
};

/**
 * Delete the texture Id and clear the data of this instance
 * @param gl
 */
Texture.prototype.deleteObjects = function(gl)
{
	this.textureTypeName = undefined;
	this.textureImageFileName = undefined;
	if (this.texId !== undefined)
	{
		gl.deleteTexture(this.texId);
	}
	this.texId = undefined;
	this.fileLoadState = undefined;
	this.imageBinaryData = undefined;
};

/**
 * Create the instance of texture
 * @param gl
 * @param filter the filter of this texture
 * @param data the data of image source
 * @param width the width of the texture image
 * @param height the height of the texture image
 */
Texture.createTexture = function(gl, filter, data, width, height) 
{
	// static function.
	// example of filter: gl.NEAREST
	var texture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, texture);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
	if (data instanceof Uint8Array) 
	{
		//Reference : https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/texImage2D
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
	}
	else 
	{
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, data);
	}
	gl.bindTexture(gl.TEXTURE_2D, null);
	return texture;
};
