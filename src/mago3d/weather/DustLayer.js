'use strict';


/**
 * @class DustLayer
 */
var DustLayer = function(options) 
{
	if (!(this instanceof DustLayer)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	this.weatherStation;
	this.gl;
	
	this.dustMapTexture; // uv encoded wind map.***
	this.dustMapJson;
	this.dustMapFileName;
	this.dustMapJsonFileLoadState = CODE.fileLoadState.READY;
	this.dustMapFolderPath;
	this.dustData;
	this.dustVolume; // volumeOwner.
	
	this.geoExtent;
	this.geoLocDataManager; // the geoLocdata of the center of the tile.

	//this.externalAlpha = 0.7;
	
	// Check if exist options.
	if (options !== undefined)
	{
		// take all options.
		if(options.geoJsonFile)
		{
			this.dustMapJson = options.geoJsonFile;
			this.dustMapJsonFileLoadState = CODE.fileLoadState.LOADING_FINISHED;
		}

		if(options.geoJsonFileFolderPath)
		{
			this.dustMapFolderPath = options.geoJsonFileFolderPath;
		}

		if (options.speedFactor !== undefined)
		{ this.speedFactor = options.speedFactor; }
	
		if (options.dustMapFileName !== undefined)
		{ this.dustMapFileName = options.dustMapFileName; }
	
		if (options.dustMapFolderPath !== undefined)
		{ this.dustMapFolderPath = options.dustMapFolderPath; }

		if (options.pendentPointSize !== undefined)
		{ this.pendentPointSize = options.pendentPointSize; }
	}
};

DustLayer.prototype.getAltitude = function()
{
	if(!this.dustMapJson)
	return undefined;

	return this.dustMapJson.bbox[2];
};

DustLayer.prototype.deleteObjects = function(magoManager)
{
	//this.dustMapTexture; // uv encoded wind map.***
	//this.dustMapJson;
	//this.dustMapFileName;
	//this.dustMapJsonFileLoadState = CODE.fileLoadState.READY;
	//this.dustMapFolderPath;
	//this.dustData;
	//this.dustVolume; // volumeOwner.
	
	//this.geoExtent;
	//this.geoLocDataManager; // the geoLocdata of the center of the tile.

	// Delete dustMapTexture.
	if(this.dustMapTexture)
	{
		var gl = magoManager.getGl();
		this.dustMapTexture.deleteObjects(gl);
	}
	this.dustMapTexture = undefined;

	delete this.dustMapJson;
	this.dustMapFileName = undefined;
	this.dustMapJsonFileLoadState = undefined;
	this.dustMapFolderPath = undefined;
	this.dustData = undefined;
	this.dustVolume = undefined;

	if(this.geoExtent)
	{
		this.geoExtent.deleteObjects();
	}
	this.geoExtent = undefined;

	if(this.geoLocDataManager)
	{
		this.geoLocDataManager.deleteObjects();
	}
	this.geoLocDataManager = undefined;
};

DustLayer.prototype.prepareDustLayer = function()
{
	// Check if the winsMapTexture is loaded.
	if(this.gl === undefined)
	{
		this.gl = this.dustVolume.weatherStation.magoManager.getGl();
	}

	if (this.dustMapTexture === undefined)
	{
		this.dustMapTexture = new Texture();
		this.dustMapTexture.texId = this.gl.createTexture();
	}
	
	if (this.dustMapTexture.fileLoadState === CODE.fileLoadState.READY)
	{
		if(!this.dustMapFileName)
		{
			// Find the png file name inside of the geoJson.***
			if(!this.dustMapJson)
			{ return false; }

			this.dustMapFileName = this.dustMapJson.properties.image.uri;
		}

		if(!this.dustMapFolderPath || this.dustMapFolderPath.length === 0) {
			this.dustMapFolderPath = this.dustMapJson.properties.image.serviceUri.split(this.dustMapFileName)[0];
		}
		
		var dustMapTexturePath = this.dustMapFolderPath + "/" + this.dustMapFileName;
		ReaderWriter.loadImage(this.gl, dustMapTexturePath, this.dustMapTexture);
		return false;
	}
	
	if (this.dustMapJsonFileLoadState === undefined || this.dustMapJsonFileLoadState === CODE.fileLoadState.READY)
	{
		thisdustMapJsonFileLoadState = CODE.fileLoadState.LOADING_STARTED;
		var that = this;
		var dustMapJsonPath = this.dustMapFolderPath + "/" + this.dustMapFileName + ".json";
		loadWithXhr(dustMapJsonPath, undefined, undefined, 'json', 'GET').done(function(res) 
		{
			that.dustMapJsonFileLoadState = CODE.fileLoadState.LOADING_FINISHED;
			that.dustMapJson = res;
		});
		return false;
	}
	
	return true;
};

DustLayer.prototype.getConcentration_biLinearInterpolation = function(s, t, magoManager)
{
	/*
	vec2 px = 1.0 / u_wind_res;
    vec2 vc = (floor(uv * u_wind_res)) * px;
    vec2 f = fract(uv * u_wind_res);
    vec2 tl = texture2D(u_wind, vc).rg;
    vec2 tr = texture2D(u_wind, vc + vec2(px.x, 0)).rg;
    vec2 bl = texture2D(u_wind, vc + vec2(0, px.y)).rg;
    vec2 br = texture2D(u_wind, vc + px).rg;
	return mix(mix(tl, tr, f.x), mix(bl, br, f.x), f.y);
	*/

	var texWidth = this.dustMapTexture.imageWidth;
	var texHeight = this.dustMapTexture.imageHeight;
	var pixelX = Math.floor(s*(texWidth));
	var pixelY = Math.floor(t*(texHeight));
	
	var st = s*texWidth;
	var tt = t*texHeight;
	var fx = Math.ceil(((st < 1.0) ? st : (st % Math.floor(st))) * 10000)/10000;
	var fy = Math.ceil(((tt < 1.0) ? tt : (tt % Math.floor(tt))) * 10000)/10000;

	var pixelXPlus = pixelX+1 < texWidth ? pixelX+1 : pixelX;
	var pixelYPlus = pixelY+1 < texHeight ? pixelY+1 : pixelY;
	var vel_tl = this.getConcentration(pixelX, pixelY, magoManager);
	var vel_tr = this.getConcentration(pixelXPlus, pixelY, magoManager);
	var vel_bl = this.getConcentration(pixelX, pixelYPlus, magoManager);
	var vel_br = this.getConcentration(pixelXPlus, pixelYPlus, magoManager);

	//var xVal = point_a.x * (1.0 - factor) + point_b.x * factor;
	
	var vel_t = vel_tl * (1.0 - fx) + vel_tr * fx;
	var vel_b = vel_bl * (1.0 - fx) + vel_br * fx;

	var result = vel_t * (1.0 - fy) + vel_b * fy;
	return result;
};

DustLayer.prototype.getMinMaxConcentration = function()
{
	if(!this.dustMapJson)
	{ return;}

	var value = this.dustMapJson.properties.value;
	return [value.r.min, value.r.max];
};

DustLayer.prototype.getConcentration = function(pixelX, pixelY, magoManager)
{
	// Note: to call this function MUST BE BINDED the windTexture.
	if(this.dustMapTexture.fileLoadState !== CODE.fileLoadState.BINDING_FINISHED)
	{
		return 0;
	}
	//-------------------------------------------------------------
	// Now, bind windTexture and read the pixel(pixelX, pixelY).
	// Read the picked pixel and find the object.*********************************************************
	var texWidth = this.dustMapTexture.imageWidth;
	var texHeight = this.dustMapTexture.imageHeight;
	if (pixelX < 0){ pixelX = 0; }
	if (pixelY < 0){ pixelY = 0; }

	if(!this.dustConcentrationMap)
	{
		var gl = magoManager.getGl();

		if (this.framebuffer === undefined)
		{ this.framebuffer = gl.createFramebuffer(); }

		// bind framebuffer.
		gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
		// attach the WINDMAP texture to the framebuffer.
		gl.framebufferTexture2D( gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.dustMapTexture.texId, 0);
		var canRead = (gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE);
		if(canRead)
		{
			var totalPixelsCount = texWidth*texHeight;
			this.dustConcentrationMap = new Uint8Array(4 * totalPixelsCount); // 1 pixels select.***
			gl.readPixels(0, 0, texWidth, texHeight, gl.RGBA, gl.UNSIGNED_BYTE, this.dustConcentrationMap);
		}
		// Unbind the framebuffer
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	}

	var idx = pixelY * texWidth + pixelX;
	var red = this.dustConcentrationMap[idx*4]/255.0;
	var green = this.dustConcentrationMap[idx*4+1]/255.0;
	var blue = this.dustConcentrationMap[idx*4+2]/255.0;

	// Now, considering the max-min concentration, calculate the concentration.
	var dustValues = this.dustMapJson.properties.value;
	var uMin = dustValues.r.min;
	//var vMin = dustValues.g.min;
	//var wMin = dustValues.b.min;
	var uMax = dustValues.r.max;
	//var vMax = dustValues.g.max;
	//var wMax = dustValues.b.max;

	var velU = uMin * (1.0 - red) + uMax * red;
	//var velV = vMin * (1.0 - green) + vMax * green;
	//var velW = wMin * (1.0 - blue) + wMax * blue;
	
	return velU;
};