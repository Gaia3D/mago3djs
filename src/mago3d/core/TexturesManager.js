'use strict';

/**
 * Manages textures of the Mago3D.
 * @class TexturesManager
 */
var TexturesManager = function(magoManager) 
{
	// class used by "neoBuilding" class.
	if (!(this instanceof TexturesManager)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
	/**
	 * Textures loaded array.
	 * @type {Array}
	 */
	this._texturesLoaded = []; 
	this.texturesMap = {};// map<textureName, Texture>
};


/**
 * Handles the loaded image.
 * 
 * @param {WebGLRenderingContext} gl WebGL rendering context.
 * @param {image} image 
 * @param {WebGLTexture} texture 
 * @param {Boolean} flip_y_texCoords //if need vertical mirror of the image
 */
TexturesManager.handleTextureLoaded = function(gl, image, flip_y_texCoords) 
{
	if (flip_y_texCoords === undefined)
	{ flip_y_texCoords = true; }

	if (image === undefined)
	{ return undefined; }
	
	var texture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, texture);
	gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, flip_y_texCoords); // if need vertical mirror of the image.
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image); // Original.
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
	gl.generateMipmap(gl.TEXTURE_2D);
	gl.bindTexture(gl.TEXTURE_2D, null);
	return texture;
};

TexturesManager.prototype.getTexture = function(textureIdx)
{
	if (textureIdx === undefined)
	{ return undefined; }
	
	if (textureIdx < 0)
	{ return undefined; }

	if (this._texturesLoaded[textureIdx] === undefined)
	{ return undefined; }

	return this._texturesLoaded[textureIdx];
};

TexturesManager.prototype.getOrNewTexture = function(textureIdx)
{
	if (textureIdx === undefined)
	{ return undefined; }
	
	if (textureIdx < 0)
	{ return undefined; }

	if (this._texturesLoaded[textureIdx] === undefined)
	{
		var texture = new Texture();
		this._texturesLoaded[textureIdx] = texture;
	}

	return this._texturesLoaded[textureIdx];
};

TexturesManager.prototype.getTextureByName = function(textureName)
{
	return texturesMap[textureName];
};

TexturesManager.loadTexture = function(imagePath, texture, magoManager, flip_y_texCoord)
{
	var imageToLoad = new Image();
	texture.fileLoadState = CODE.fileLoadState.LOADING_STARTED;

	imageToLoad.onload = function() 
	{
		var gl = magoManager.getGl();
		
		if (texture.texId === undefined) 
		{ texture.texId = gl.createTexture(); }
		
		if (flip_y_texCoord === undefined)
		{ flip_y_texCoord = false; }
		
		handleTextureLoaded(gl, imageToLoad, texture.texId, flip_y_texCoord);
		texture.fileLoadState = CODE.fileLoadState.LOADING_FINISHED;
	};

	imageToLoad.onerror = function() 
	{
		texture.fileLoadState = CODE.fileLoadState.LOAD_FAILED;
	};

	imageToLoad.src = imagePath;
};

TexturesManager.newWebGlTextureByEmbeddedImage = function(gl, embeddedImage, texture)
{
	var blob = new Blob([embeddedImage], {type: 'application/octet-binary'});
	var url = URL.createObjectURL(blob);
	
	var img = new Image();
	img.onload = function() 
	{
		URL.revokeObjectURL(url);
		texture.texId = TexturesManager.handleTextureLoaded(gl, img);
		texture.fileLoadState = CODE.fileLoadState.LOADING_FINISHED; // file load finished.***
	};
	img.src = url;
};




































