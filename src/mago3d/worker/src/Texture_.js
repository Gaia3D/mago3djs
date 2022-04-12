'use strict';


/**
 * 맵 이미지. 머티리얼에는 텍스처에 대한 참조가 포함될 수 있으므로 머티리얼의 셰이더는 객체의 표면색을 계산하는 동안 텍스처를 사용할 수 있습니다.
 * 오브제의 표면의 기본 색상 (알베도) 외에도 텍스쳐는 반사율이나 거칠기와 같은 재질 표면의 많은 다른면을 나타낼 수 있습니다.
 * This class deals the image of the map which will express the texture
 * @class Texture
 */
var Texture_ = function(options) 
{
	if (!(this instanceof Texture_)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this.textureTypeName = "";
	this.textureImageFileName = "";
	this.textureImageFileExtension = "";
	this.texId; // webGlTexture.
    //CODE.fileLoadState.READY
	this.fileLoadState = 0;
	this.imageBinaryData;
	this.imageWidth = 32;
	this.imageHeight = 32;
	this.url;
	this.blob; 
	this.opacity = 1.0;
	this.activeTextureType = 1; // 0= inactive. 1= XYZLayer, WMSLayer. 2= Custom image. 10= Bathymetry.

	if (options)
	{
		if (options.opacity !== undefined)
		{
			this.opacity = options.opacity;
		}

		if (options.url !== undefined)
		{
			this.url = options.url;
		}
	}
};

Texture_.prototype.deleteObjects = function(gl)
{
	this.deleteGlObjects(gl);

	this.textureTypeName = undefined;
	this.textureImageFileName = undefined;
	this.textureImageFileExtension = undefined;
	this.texId = undefined; // webGlTexture.
	this.fileLoadState = undefined;
	this.imageBinaryData = undefined;
	this.imageWidth = undefined;
	this.imageHeight = undefined;
	this.url = undefined;
	this.blob = undefined; 
	this.opacity = undefined;
	this.activeTextureType = undefined;
};

Texture_.prototype.deleteGlObjects = function(gl)
{
	gl.deleteTexture(this.texId);
};

/**
 * Sets the activeTextureType of the texture.
 * 0= inactive. 1= XYZLayer, WMSLayer. 2= Custom image. 10= Bathymetry.
 * @param {Number} activeTextureType
 */
 Texture_.prototype.setActiveTextureType = function(activeTextureType)
{
	this.activeTextureType = activeTextureType;
};

/**
 * Sets the opacity of the texture.
 * @param {Number} opacity
 */
 Texture_.prototype.setOpacity = function(opacity)
{
	this.opacity = opacity;
};

/**
 * Delete the texture Id and clear the data of this instance
 * @param gl
 */
 Texture_.prototype.deleteObjects = function(gl)
{
	this.textureTypeName = undefined;
	this.textureImageFileName = undefined;
	if (this.texId !== undefined)
	{
		if (this.texId instanceof WebGLTexture)
		{ gl.deleteTexture(this.texId); }
		else 
		{ var hola = 0; }
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
 Texture_.resetTexture = function(texture, gl, filter, texWrap, width, height) 
{
	if (filter === undefined) 
	{
		filter = gl.LINEAR;
	}

	if (texWrap === undefined) 
	{
		texWrap = gl.CLAMP_TO_EDGE;
	}

	gl.bindTexture(gl.TEXTURE_2D, texture.texId);
	gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, texWrap);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, texWrap);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
	gl.bindTexture(gl.TEXTURE_2D, null);
};

/**
 * Create the instance of texture
 * @param gl
 * @param filter the filter of this texture
 * @param data the data of image source
 * @param width the width of the texture image
 * @param height the height of the texture image
 */
 Texture_.createTexture = function(gl, filter, data, width, height, texWrap) 
{
	// static function.
	// example of filter: gl.NEAREST
	if (!texWrap)
	{
		texWrap = gl.CLAMP_TO_EDGE;
	}

	if (!filter)
	{
		filter = gl.NEAREST;
	}

	if (data === undefined)
	{
		data = null;
	}

	var texture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, texture);
	gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, texWrap);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, texWrap);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
	if (data instanceof Uint8Array || data === null) 
	{
		//Reference : https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/texImage2D
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
	}
	else 
	{
		// here, "data" must to be "image" type object.
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, data); 
	}
	gl.bindTexture(gl.TEXTURE_2D, null);
	return texture;
};

Texture_._swapTextures = function (texA, texB)
{
	var texAux = texA.texId;
	texA.texId = texB.texId;
	texB.texId = texAux;
};
