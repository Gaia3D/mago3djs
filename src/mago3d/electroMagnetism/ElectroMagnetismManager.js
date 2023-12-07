'use strict';

/**
 * @class ElectroMagnetismManager
 */
var ElectroMagnetismManager = function(options) 
{
	if (!(this instanceof ElectroMagnetismManager)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
	this._EMSurfLayersArray;
	this.magoManager;
	
	// Box.
	//this.dustDisplayBox;
	

	// data.
	this._geoJsonIndexFileLoadState = CODE.fileLoadState.READY;
	this._geoJsonIndexFile;
	this._geoJsonIndexFilePath;
	this._geoJsonIndexFileFolderPath;
	this._allLayersArePrepared = false;
	this._geoJsonIndexFilePathsArray; // no used yet.***

	// highVoltageCables.***
	this._highVoltageCablesJsonFile;
	this._highVoltageCablesJsonFilePath = undefined;
	this._highVoltageCablesJsonFileLoadState = CODE.fileLoadState.READY;
	this._vectorMeshCablesArray;

	// Animation state controls.
	this._animationState = 0; // 0= paused. 1= play.
	this._animationStartTime = 0;
	this._totalAnimTime;
	this._increTime;

	// color type.// 0= oneColor, 1= attribColor, 2= texture, 3= colorByHeight, 4= grayByHeight, 5= color-legend.***
	this._colorType = 5;

	// color legend.***
	this._legendColors4;
	this._legendValues;
	//this._TEST_setLegendsColors(); // test.***

	// Options.***
	if (options)
	{
		if (options.magoManager !== undefined)
		{
			this.magoManager = options.magoManager;
		}

		if (options.geoJsonIndexFilePath)
		{
			this._geoJsonIndexFilePath = options.geoJsonIndexFilePath;
		}

		if (options.geoJsonIndexFilePathsArray)// no used yet.***
		{
			this._geoJsonIndexFilePathsArray = options.geoJsonIndexFilePathsArray;// no used yet.***
		}

		if (options.geoJsonIndexFileFolderPath)
		{
			this._geoJsonIndexFileFolderPath = options.geoJsonIndexFileFolderPath;
		}

		if (options.animationSpeed !== undefined)
		{
			// AnimationSpeed by default is 1. If want to render faster, try to set animationSpeed = 2 or animationSpeed = 3.***
			this._animationSpeed = options.animationSpeed;
		}

		if (options.highVoltageCablesJsonFilePath)
		{
			this._highVoltageCablesJsonFilePath = options.highVoltageCablesJsonFilePath;
		}
	}
};

ElectroMagnetismManager.prototype._loadGeoJsonIndexFile = function ()
{
	// This is the geoJson version. 2021.
	if (this._geoJsonIndexFileLoadState === CODE.fileLoadState.READY)
	{
		this._geoJsonIndexFileLoadState = CODE.fileLoadState.LOADING_STARTED;
		var that = this;
		loadWithXhr(this._geoJsonIndexFilePath, undefined, undefined, 'json', 'GET').done(function(res) 
		{
			that._geoJsonIndexFileLoadState = CODE.fileLoadState.LOADING_FINISHED;
			that._geoJsonIndexFile = res;
		});
	}
};

ElectroMagnetismManager.prototype._loadHighVoltageCablesJsonIndexFile = function ()
{
	// This is the geoJson version. 2021.
	if (this._highVoltageCablesJsonFileLoadState === CODE.fileLoadState.READY)
	{
		this._highVoltageCablesJsonFileLoadState = CODE.fileLoadState.LOADING_STARTED;
		var that = this;
		loadWithXhr(this._highVoltageCablesJsonFilePath, undefined, undefined, 'json', 'GET').done(function(res) 
		{
			that._highVoltageCablesJsonFileLoadState = CODE.fileLoadState.LOADING_FINISHED;
			that._highVoltageCablesJsonFile = res;
		});
	}
};

ElectroMagnetismManager.prototype._prepareEMSurfaceGeoJsonIndexFile = function ()
{
	if (this._geoJsonIndexFileLoadState === CODE.fileLoadState.READY)
	{
		this._loadGeoJsonIndexFile();
		return false;
	}
	else if (this._geoJsonIndexFileLoadState !== CODE.fileLoadState.LOADING_FINISHED)
	{
		return false;
	}

	return true;
};

ElectroMagnetismManager.prototype._prepareHighVoltageCablesJsonIndexFile = function ()
{
	if (this._highVoltageCablesJsonFilePath === undefined)
	{
		return true;
	}
	else
	{
		if (this._highVoltageCablesJsonFileLoadState === CODE.fileLoadState.READY)
		{
			this._loadHighVoltageCablesJsonIndexFile();
			return false;
		}
		else if (this._highVoltageCablesJsonFileLoadState !== CODE.fileLoadState.LOADING_FINISHED)
		{
			return false;
		}
	}

	return true;
};

ElectroMagnetismManager.prototype.getEMSurfacesLayersCount = function()
{
	if (this._EMSurfLayersArray === undefined)
	{
		return 0;
	}

	return this._EMSurfLayersArray.length;
};

ElectroMagnetismManager.prototype.newEMSurfaceLayer = function (options)
{
	if (this._EMSurfLayersArray === undefined)
	{
		this._EMSurfLayersArray = [];
	}
	
	var layer = new ElectroMagnetismLayer(options);
	this._EMSurfLayersArray.push(layer);
	return layer;
};

ElectroMagnetismManager.prototype._prepareEMSurfacesLayers = function (magoManager)
{
	if (this._allLayersArePrepared === true)
	{
		return true;
	}

	// Check if layers exist.***
	var EMLayersCount = this.getEMSurfacesLayersCount();
	if (EMLayersCount === 0)
	{
		// use "GeoJsonIndexFile" to create EMLayers.***
		var layersCount = this._geoJsonIndexFile.layersCount;
		var timeSliceFileFolderPath = this._geoJsonIndexFileFolderPath;

		for (var i=0; i<layersCount; i++)
		{
			var layer = this._geoJsonIndexFile.layers[i];
			var options = {
				electroMagnetismManagerOwner : this, 
				timeInterval_min             : layer.timeInterval_min,
				timeSlicesCount              : layer.timeSlicesCount,
				timeSliceFileNames           : layer.timeSliceFileNames,
				timeSliceFileFolderPath      : timeSliceFileFolderPath
			};
			var EMSurfaceLayer = this.newEMSurfaceLayer(options);
		}
	}

	// Now, check if all EMLayers are prepared.***
	var allLayersArePrepared = true;
	var EMLayersCount = this.getEMSurfacesLayersCount();
	for (var i=0; i<EMLayersCount; i++)
	{
		var EMLayer = this._EMSurfLayersArray[i];
		if (!EMLayer._prepareLayer())
		{
			allLayersArePrepared = false;
		}
	}

	this._allLayersArePrepared = allLayersArePrepared;

	return false;
};

ElectroMagnetismManager.prototype._prepareVectorMeshCables = function ()
{
	if (this._highVoltagesCablesPrepared)
	{
		return true;
	}

	if (this._highVoltageCablesJsonFilePath !== undefined)
	{
		var cablesCount = this._highVoltageCablesJsonFile.cablesCount;
		var cables = this._highVoltageCablesJsonFile.cables;
		var options = {};
		var magoManager = this.magoManager;

		if (this.geoLocDataManagerHighVoltageCables === undefined)
		{ this.geoLocDataManagerHighVoltageCables = new GeoLocationDataManager(); }

		var geoLocData = this.geoLocDataManagerHighVoltageCables.getCurrentGeoLocationData();
		if (geoLocData === undefined)
		{
			geoLocData = this.geoLocDataManagerHighVoltageCables.newGeoLocationData("default");
		}

		var heading = 0.0;
		var pitch = 0.0;
		var roll = 0.0;
		var centerGeoCoord = this._highVoltageCablesJsonFile.centerGeoCoord;
		geoLocData = ManagerUtils.calculateGeoLocationData(centerGeoCoord.longitude, centerGeoCoord.latitude, centerGeoCoord.altitude, heading, pitch, roll, geoLocData);

		for (var i=0; i<cablesCount; i++)
		{
			var cable = cables[i];
			var startPosLC = new Point3D(cable.startCartesianCoordLC.x, cable.startCartesianCoordLC.y, cable.startCartesianCoordLC.z);
			var endPosLC = new Point3D(cable.endCartesianCoordLC.x, cable.endCartesianCoordLC.y, cable.endCartesianCoordLC.z);
			var posLCArray = [startPosLC, endPosLC];
			
			var vectorMesh = VectorMesh.getVectorMeshItineraryFromPoints3dLCArray(posLCArray, geoLocData, magoManager, options);

			if (this._lineThickness === undefined)
			{
				this._lineThickness = 3.5;
			}
			// Provisionally set a random color.***
			if (this._thickLineColor === undefined)
			{
				this._thickLineColor = new Color();
				Color.getColorPastelRGBRandom(this._thickLineColor);
			}
			//Color.getColorPastelRGBRandom(this.vectorMesh.color4);
			if (vectorMesh.color4 === undefined)
			{
				vectorMesh.color4 = new Color();
			}

			vectorMesh.color4.setRGB(this._thickLineColor.r, this._thickLineColor.g, this._thickLineColor.b);
			vectorMesh.thickness = this._lineThickness;

			if (this._vectorMeshCablesArray === undefined)
			{ this._vectorMeshCablesArray = []; }

			this._vectorMeshCablesArray.push(vectorMesh);

			var hola = 0;

			// const redLine = magoManager.scene.viewer.entities.add({
			// 	name: "Red line on terrain",
			// 	polyline: {
			// 	  positions: Cesium.Cartesian3.fromDegreesArray([-75, 35, -125, 35]),
			// 	  width: 5,
			// 	  material: Cesium.Color.RED,
			// 	  clampToGround: true,
			// 	},
			//   });
		}

		this._highVoltagesCablesPrepared = true;
	}

	return true;
};

ElectroMagnetismManager.prototype.prepareVolume = function ()
{
	// We need:
	// 1- GeoJsonIndexFile.
	// 2- electroMagnetism-layers (if GeoJsonIndexFile is loaded).
	//-------------------------------------------
	// 1rst, check if the geoJson is loaded.***
	if (!this._prepareEMSurfaceGeoJsonIndexFile())
	{
		return false;
	}

	if (!this._prepareHighVoltageCablesJsonIndexFile())
	{
		return false;
	}

	if (this._highVoltageCablesJsonFilePath !== undefined)
	{
		this._prepareVectorMeshCables();
	}

	// Now, check if EMLayers are prepared.***
	if (!this._prepareEMSurfacesLayers())
	{
		return false;
	}

	return true;
};

ElectroMagnetismManager.prototype.getEMLayersCount = function()
{
	if (this._EMSurfLayersArray === undefined)
	{
		return 0;
	}

	return this._EMSurfLayersArray.length;
};

ElectroMagnetismManager.prototype._TEST_setLegendsColors = function ()
{
	this._legendColors4 = new Float32Array([0/255, 0/255, 143/255, 128/255,    // 0
		0/255, 15/255, 255/255, 128/255,   // 1
		0/255, 95/255, 255/255, 128/255,   // 2
		0/255, 175/255, 255/255, 128/255,  // 3
		0/255, 255/255, 255/255, 128/255,  // 4
		79/255, 255/255, 175/255, 128/255, // 5
		159/255, 255/255, 95/255, 128/255, // 6
		239/255, 255/255, 15/255, 128/255, // 7
		255/255, 191/255, 0/255, 128/255,  // 8
		255/255, 111/255, 0/255, 128/255,  // 9
		255/255, 31/255, 0/255, 128/255,   // 10
		207/255, 0/255, 0/255, 128/255,    // 11
		127/255, 0/255, 0/255, 128/255,
		127/255, 0/255, 0/255, 128/255,   // 13
		0, 0, 0, 0,   // 14
		0, 0, 0, 0, ]);  // 15

	var min = 0.0;
	var max = 1.3;
	var range = max - min;
	var legendColorsCount = this._legendColors4.length / 4;
	var incre = range / (legendColorsCount - 1);
	var valuesArray = [];
	for (var i=0; i<legendColorsCount; i++)
	{
		valuesArray.push(incre * i + min);
	}
	this._legendValues = new Float32Array(valuesArray);
};

ElectroMagnetismManager.prototype.render = function ()
{
	if (!this.prepareVolume(this.magoManager))
	{ return false; }

	var EMLayersCount = this.getEMLayersCount();
	if (EMLayersCount === 0)
	{
		return false;
	}

	// // Render layers.***
	if (this.currLayerIdx === undefined)
	{
		this.currLayerIdx = 0;
	}
	
	//for (var i=0; i<soundLayersCount; i++)
	{
		var EMLayer = this._EMSurfLayersArray[this.currLayerIdx];
		EMLayer.render(this.magoManager);
	}

	// render highVoltageCables, if exist.***
	if (this._vectorMeshCablesArray)
	{
		var magoManager = this.magoManager;
		var sceneState = magoManager.sceneState;
		var extbuffers = magoManager.extbuffers;
		var gl = magoManager.getGl();
		magoManager.bindMainFramebuffer();
		gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT1_WEBGL, gl.TEXTURE_2D, magoManager.depthTex, 0);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT2_WEBGL, gl.TEXTURE_2D, magoManager.normalTex, 0);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT3_WEBGL, gl.TEXTURE_2D, magoManager.albedoTex, 0);

		extbuffers.drawBuffersWEBGL([
			extbuffers.COLOR_ATTACHMENT0_WEBGL, // gl_FragData[0] - colorBuffer
			extbuffers.COLOR_ATTACHMENT1_WEBGL, // gl_FragData[1] - depthTex
			extbuffers.COLOR_ATTACHMENT2_WEBGL, // gl_FragData[2] - normalTex
			extbuffers.COLOR_ATTACHMENT3_WEBGL // gl_FragData[3] - albedoTex
		]);

		var thickLineShader = magoManager.postFxShadersManager.getShader("thickLine"); // (thickLineVS, thickLineFS)
		thickLineShader.useProgram();
		thickLineShader.bindUniformGenerals();

		gl.enableVertexAttribArray(thickLineShader.prev_loc);
		gl.enableVertexAttribArray(thickLineShader.current_loc);
		gl.enableVertexAttribArray(thickLineShader.next_loc);

		gl.uniform2fv(thickLineShader.viewport_loc, [sceneState.drawingBufferWidth[0], sceneState.drawingBufferHeight[0]]);
		gl.uniform1i(thickLineShader.bUseLogarithmicDepth_loc, magoManager.postFxShadersManager.bUseLogarithmicDepth);
		gl.uniform1i(thickLineShader.bUseMultiRenderTarget_loc, magoManager.postFxShadersManager.bUseMultiRenderTarget);
		gl.uniform1i(thickLineShader.uFrustumIdx_loc, magoManager.currentFrustumIdx);
		gl.uniform1i(thickLineShader.bUseOutline_loc, true);

		// gl.blendEquationSeparate(gl.FUNC_ADD, gl.FUNC_ADD);
		// gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

		gl.enable(gl.BLEND);

		var geoLocData = this.geoLocDataManagerHighVoltageCables.getCurrentGeoLocationData();

		var cablesCount = this._vectorMeshCablesArray.length;
		for (var i=0; i<cablesCount; i++)
		{
			var vectorMesh = this._vectorMeshCablesArray[i];
			gl.uniform4fv(thickLineShader.oneColor4_loc, [0.3, 0.9, 0.5, 1.0]);
			gl.uniform1i(thickLineShader.colorType_loc, 0); // 0= oneColor, 1= attribColor, 2= texture.
			gl.uniform1f(thickLineShader.thickness_loc, vectorMesh.thickness);

			var renderType = 1;

			geoLocData.bindGeoLocationUniforms(gl, thickLineShader);
			if (this._thisckLineDepthTest)
			{
				gl.enable(gl.DEPTH_TEST);
			}
			else
			{
				gl.disable(gl.DEPTH_TEST);
			}
			vectorMesh.render(magoManager, thickLineShader, renderType);
			gl.enable(gl.DEPTH_TEST); // return to default.***
		}

		// return to the current shader.
		gl.useProgram(null);
		gl.disable(gl.BLEND);
	}
	
	return true;
};