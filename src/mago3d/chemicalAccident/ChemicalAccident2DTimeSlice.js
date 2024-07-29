'use strict';

/**
 * @class ChemicalAccident2DTimeSlice
 */
var ChemicalAccident2DTimeSlice = function(options) 
{
	 if (!(this instanceof ChemicalAccident2DTimeSlice)) 
	 {
		 throw new Error(Messages.CONSTRUCT_ERROR);
	 }

	 this._fileLoadState = CODE.fileLoadState.READY;
	 this._filePath;
	 this._jsonFile;
	 this._isPrepared = false;
	 this._glTexture;
	 this.owner = undefined;

	 this._texture3dCreated = false;
	 this._texture3d;
	 this._mosaicTexture; // note : the mosaicTexture is a Texture3D too.***
	 this._texture2dAux;	// aux texture.***

	 this._startUnixTimeMiliseconds;
	 this._endUnixTimeMiliseconds;

	 // uniforms.***
	this.uMinMaxAltitudeSlices = undefined; // the uniform (vec2) is limited to 32.***

	 if (options !== undefined)
	 {
		if (options.filePath)
		{
			this._filePath = options.filePath;
		}

		if (options.owner)
		{
			this.owner = options.owner;
		}

		if (options.startUnixTimeMiliseconds !== undefined)
		{
			this._startUnixTimeMiliseconds = options.startUnixTimeMiliseconds;
		}

		if (options.endUnixTimeMiliseconds !== undefined)
		{
			this._endUnixTimeMiliseconds = options.endUnixTimeMiliseconds;
		}
	 }
};

ChemicalAccident2DTimeSlice.prototype._prepare = function (chemAccidentLayer)
{
	// chemAccidentLayer = owner.***
	if (this._isPrepared)
	{
		return true;
	}

	if (this._fileLoadState === CODE.fileLoadState.READY)
	{
		this._fileLoadState = CODE.fileLoadState.LOADING_STARTED;
		var that = this;

		loadWithXhr(this._filePath, undefined, undefined, 'json', 'GET').done(function(res) 
		{
			that._fileLoadState = CODE.fileLoadState.LOADING_FINISHED;
			that._jsonFile = res;
		});
	}

	if (this._fileLoadState !== CODE.fileLoadState.LOADING_FINISHED)
	{
		return false;
	}

	if (this.uMinMaxAltitudeSlices === undefined)
	{
		this.uMinMaxAltitudeSlices = new Float32Array(2 * 1); // 32 is the max slices count.***

		this.uMinMaxAltitudeSlices[0] = this._jsonFile.minAltitude;
		this.uMinMaxAltitudeSlices[1] = this._jsonFile.maxAltitude;
		
	}

	// load the mosaicTexture.***
	if (this._mosaicTexture === undefined)
	{
		this._mosaicTexture = new MagoTexture3D();
	}

	if (this._texture2dAux === undefined)
	{
		this._texture2dAux = new Texture();
	}

	if (this._texture2dAux.fileLoadState === CODE.fileLoadState.READY)
	{
		this._texture2dAux.fileLoadState = CODE.fileLoadState.LOADING_STARTED;
		var that = this;
		var mosaicTextureFolderPath = this.owner.chemicalAccident2DManager._geoJsonIndexFileFolderPath;
		var imageFileName = this._jsonFile.imagefileName;
		var imageFilePath = mosaicTextureFolderPath + "\\" + imageFileName;
		var flip_y_texCoord = false;

		var byteDataArray = this._jsonFile.byteData; // embeded data.***
		var mosaicTexWidth = this._jsonFile.width;
		var mosaicTexHeight = this._jsonFile.height;

		// check if exist blob data.***
		var chemAccidentManager = chemAccidentLayer.chemicalAccident2DManager;
		var blobArrayBuffer = chemAccidentManager.getBlobArrayBuffer(imageFileName);
		var blob = new Blob([blobArrayBuffer], { type: "image/png" });

		if (blob !== undefined)
		{
			var img = new Image();
			img.src = URL.createObjectURL(blob);
			var texture = this._texture2dAux;
			img.onload = function() 
			{
				var gl = chemAccidentManager.magoManager.getGl();
		
				if (texture.texId !== undefined && texture.texId !== null) 
				{ 
					gl.deleteTexture(texture.texId);
				}
				
				if (flip_y_texCoord === undefined)
				{ flip_y_texCoord = false; }
				
				texture.imageWidth = img.width;
				texture.imageHeight = img.height;

				var texWrap = gl.CLAMP_TO_EDGE;
				var filter = gl.NEAREST;
				var bPremultiplyAlphaWebgl = false;

				texture.texId = Texture.createTexture(gl, filter, img, texture.imageWidth, texture.imageHeight, texWrap, bPremultiplyAlphaWebgl);
				texture.fileLoadState = CODE.fileLoadState.BINDING_FINISHED;

			};
			
			img.onerror = function() 
			{
				this._texture2dAux.fileLoadState = CODE.fileLoadState.LOAD_FAILED;
			};
		}

		// check if exist embeded data.***
		else if (byteDataArray === undefined)
		{
			// load the mosaicTexture from file.***
			ChemicalAccidentTimeSlice.loadTexture(mosaicTextureFilePath, this._texture2dAux, this.owner.chemicalAccident2DManager.magoManager, flip_y_texCoord);
			return false;
		}
		else 
		{
			var dataLength = byteDataArray.length;
			var uint8Array = new Uint8Array(dataLength); // rgba.***
			for (var i=0; i<dataLength; i++)
			{
				uint8Array[i] = byteDataArray[i];
			}

			// make texture with the embedded data into json file.***
			var magoManager = this.owner.chemicalAccident2DManager.magoManager;
			var gl = magoManager.getGl();
			
			var texWrap = gl.CLAMP_TO_EDGE;
			var filter = gl.NEAREST;
			if (this.textureFilterType === 1)
			{
				filter = gl.LINEAR;
			}
			var bPremultiplyAlphaWebgl = false;

			this._texture2dAux.texId = Texture.createTexture(gl, filter, uint8Array, mosaicTexWidth, mosaicTexHeight, texWrap, bPremultiplyAlphaWebgl);
			this._texture2dAux.fileLoadState = CODE.fileLoadState.BINDING_FINISHED;

			this._jsonFile.byteData = undefined; // free memory.***

			this._mosaicTexture.texturesArray.push(this._texture2dAux.texId);
			this._mosaicTexture.finalTextureXSize = mosaicTexWidth;
			this._mosaicTexture.finalTextureYSize = mosaicTexHeight;
			this._mosaicTexture.fileLoadState = CODE.fileLoadState.BINDING_FINISHED;
			this._isPrepared = true;
		}

		return false;
	}

	if (this._texture2dAux.fileLoadState === CODE.fileLoadState.LOAD_FAILED )
	{
		return false;
	}
	
	// check if the mosaicTexture is loaded.***
	if (this._texture2dAux.fileLoadState !== CODE.fileLoadState.BINDING_FINISHED )
	{
		return false;
	}

	if (this._texture2dAux.fileLoadState === CODE.fileLoadState.BINDING_FINISHED && this._mosaicTexture.fileLoadState !== CODE.fileLoadState.BINDING_FINISHED)
	{
		// this._mosaicTexture.texturesArray.push(this._texture2dAux.texId);
		// this._texture2dAux.texId = undefined;
		// this._mosaicTexture.finalTextureXSize = this._mosaicTexture.mosaicXCount * this._texture2dAux.imageWidth;
		// this._mosaicTexture.finalTextureYSize = this._mosaicTexture.mosaicYCount * this._texture2dAux.imageHeight;
		// this._mosaicTexture.fileLoadState = CODE.fileLoadState.BINDING_FINISHED;
		this._isPrepared = true;
	}


	return false;
};

ChemicalAccident2DTimeSlice.prototype.getQuantizedMinMaxValues = function ()
{
	if (this.minMaxValues === undefined)
	{
		if (this._jsonFile === undefined)
		{
			return undefined;
		}

		this.minMaxValues = new Float32Array([this._jsonFile.minValue, this._jsonFile.maxValue]);
	}

	return this.minMaxValues;
};