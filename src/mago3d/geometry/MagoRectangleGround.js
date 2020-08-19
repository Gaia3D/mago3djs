'use strict';

/**
 * 직사각형을 표현하는 클래스
 * @exception {Error} Messages.CONSTRUCT_ERROR
 * 
 * @constructor
 * @class MagoRectangle
 * @param {MagoRectangle~MagoRectanglePosition} position position info. min max coordinate and altitude. required.
 * @param {MagoRectangle~MagoRectangleStyle} style rectangle style. optional.
 *  
 * @extends MagoGeometry
 * 
 * @example
 * var position = {minLongitude : 0, minLatitude : 0, maxLongitude : 1, maxLatitude : 1, altitude : 2};
 * var style = {fillColor:'ff0000',opacity:0.8};
 * 
 * var magoRectangle = new Mago3D.MagoRectangle(position, style);
 */
var MagoRectangleGround = function(position, style) 
{
	/**
	 * 
	 * @typedef {object} MagoRectangle~MagoRectanglePosition MagoRectangle position 옵션.
	 * @property {number} minLongitude 
	 * @property {number} minLatitude 
	 * @property {number} maxLongitude 
	 * @property {number} maxLatitude 
	 * @property {number} altitude default is 0.
	 */
	/** 
	 * @typedef {object} MagoRectangle~MagoRectangleStyle MagoRectangle position 옵션.
	 * @property {string} imageUrl image url. 
	 * @property {string} fillColor html color code. if imageUrl defined, ignore this value.
	 * @property {number} opacity range 0-1. default is 1.
	 * @property {number} strokeWidth stroke width.
	 * @property {number} strokeColor stroke color. if strokeWidth isn't define, ignore this value.
	 */
	if (!(this instanceof MagoRectangleGround)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	/**
	 * Minimum coord of this rectangle
	 * @type {GeographicCoord}
	 * @private
	 */
	this.minGeographicCoord;
    
	/**
	 * Maximum coord of this rectangle
	 * @type {GeographicCoord}
	 * @private
	 */
	this.maxGeographicCoord;
    
	MagoGeometry.call(this, position, style);
    
	// Calculate geoLocationData.
	var resultGeographicCoord;
	resultGeographicCoord = GeographicCoord.getMidPoint(this.minGeographicCoord, this.maxGeographicCoord, resultGeographicCoord);
    
	var geoLocDataManager = new GeoLocationDataManager();
	var geoLocData = geoLocDataManager.newGeoLocationData();
	geoLocData = ManagerUtils.calculateGeoLocationData(resultGeographicCoord.longitude, resultGeographicCoord.latitude, resultGeographicCoord.altitude, undefined, undefined, undefined, geoLocData);
	// set the geoLocDataManager of the terrainScanner.
	this.geoLocDataManager = geoLocDataManager;
    
	// Note: the cartesianCoords are rotated, so :
	//geoLocData.rotMatrix.Identity();
    
	if (this.color4 === undefined)
	{
		this.setOneColor(0.7, 0.7, 0.7, 0.5);
	}

	if (this.style)
	{
		if (this.style.fillColor)
		{
			Color.fromHexCode(this.style.fillColor, this.color4);
		}
        
		if (this.style.opacity)
		{
			this.color4.a = this.style.opacity;
		}
	}
};

MagoRectangleGround.prototype = Object.create(MagoGeometry.prototype);
MagoRectangleGround.prototype.constructor = MagoRectangleGround;

/**
 * Makes the geometry mesh.
 * @private
 */
MagoRectangleGround.prototype.makeMesh = function(magoManager)
{
	// check if exist geoCoords extent.
	if (!this.maxGeographicCoord || !this.minGeographicCoord)
	{ 
		return; 
	} // error message.

	var resultGeographicCoord;
	resultGeographicCoord = GeographicCoord.getMidPoint(this.minGeographicCoord, this.maxGeographicCoord, resultGeographicCoord);
    
	var geoLocDataManager = new GeoLocationDataManager();
	var geoLocData = geoLocDataManager.newGeoLocationData();
	geoLocData = ManagerUtils.calculateGeoLocationData(resultGeographicCoord.longitude, resultGeographicCoord.latitude, resultGeographicCoord.altitude, undefined, undefined, undefined, geoLocData);
	// set the geoLocDataManager of the terrainScanner.
	this.geoLocDataManager = geoLocDataManager;

	// make a geoCoordsArray.
	var geoCoordsArray = [];

	var minLon = this.minGeographicCoord.longitude;
	var minLat = this.minGeographicCoord.latitude;
	var minAlt = this.minGeographicCoord.altitude;

	var maxLon = this.maxGeographicCoord.longitude;
	var maxLat = this.maxGeographicCoord.latitude;
    
	// leftDown corner.
	var geoCoord = new GeographicCoord(minLon, minLat, minAlt);
	geoCoordsArray.push(geoCoord);

	// rightDown corner.
	geoCoord = new GeographicCoord(maxLon, minLat, minAlt);
	geoCoordsArray.push(geoCoord);

	// rightUp corner.
	geoCoord = new GeographicCoord(maxLon, maxLat, minAlt);
	geoCoordsArray.push(geoCoord);

	// lefttUp corner.
	geoCoord = new GeographicCoord(minLon, maxLat, minAlt);
	geoCoordsArray.push(geoCoord);

	var geoCoordsList = new GeographicCoordsList(geoCoordsArray);
	var height = 10000.0;
	var bLoop = true;
	var extrudeDirWC = undefined;
	var renderableObj = geoCoordsList.getExtrudedMeshRenderableObject(height, bLoop, undefined, magoManager, extrudeDirWC);
    
	this.objectsArray.push(renderableObj.objectsArray[0]);

	this.setDirty(false);
};

/**
 * set position
 * @param {MagoRectangle~MagoRectanglePosition} position
 * 
 * @example
 * var position = {minLongitude : 0, minLatitude : 0, maxLongitude : 1, maxLatitude : 1, altitude : 2};
 * magoRectangle.setPosition(position);
 */
MagoRectangleGround.prototype.setPosition = function(position) 
{
	if (!position)
	{
		throw new Error(Messages.REQUIRED_EMPTY_ERROR('position'));
	}

	var altitude = position.altitude;
	
	if (position.minLongitude && position.minLatitude)
	{
		this.minGeographicCoord = new GeographicCoord(position.minLongitude, position.minLatitude, altitude);
	}

	if (position.maxLongitude && position.maxLatitude)
	{
		this.maxGeographicCoord = new GeographicCoord(position.maxLongitude, position.maxLatitude, altitude);
	}
	// Check if exist material (texture).
	
};

/**
 * set geometry style, if this geometry has been renderd, init use magomanager.
 * @param {MagoGeometryStyle} style
 * @param {MagoManager} magoManager
 */
MagoRectangleGround.prototype.setStyle = function(style, magoManager) 
{
	if (!style) 
	{
		throw new Error(Messages.REQUIRED_EMPTY_ERROR('style'));
	}

	if (magoManager && magoManager instanceof MagoManager) 
	{
		this.init(magoManager);
	}
	var existModel = magoManager.modeler.existObject(this);
	for (var key in style)
	{
		if (style.hasOwnProperty(key))
		{
			var changedClampToTerrain = (key === 'clampToTerrain') && (style[key] !== this.style[key]);
			
			if (changedClampToTerrain)
			{	
				if (existModel) { magoManager.modeler.removeObject(this); }
			}

			this.style[key] = style[key];

			if (changedClampToTerrain)
			{	
				if (existModel) { magoManager.modeler.addObject(this, 1); }
			}

			if (this.style.clampToTerrain && key === 'imageUrl')
			{
				this.texture = undefined;
				magoManager.tinTerrainManager.imageryLayersChanged();
			}
		}
	}
};
/**
 * make clone this instance
 * @return {MagoRectangle}
 */
MagoRectangleGround.prototype.clone = function()
{
	var position = {
		minLongitude : this.minGeographicCoord.longitude,
		minLatitude  : this.minGeographicCoord.latitude,
		maxLongitude : this.maxGeographicCoord.longitude,
		maxLatitude  : this.maxGeographicCoord.latitude,
		altitude     : -200
	};
	var style = JSON.parse(JSON.stringify(this.style));

	return new MagoRectangle(position, style);
};

/**
 * return area
 * @return {number}
 */
MagoRectangleGround.prototype.getArea = function() 
{
	var edge = new GeographicCoord(this.minGeographicCoord.longitude, this.maxGeographicCoord.latitude, this.maxGeographicCoord.altitude);
	var height = Globe.getArcDistanceBetweenGeographicCoords(this.minGeographicCoord, edge);
	var width = Globe.getArcDistanceBetweenGeographicCoords(edge, this.maxGeographicCoord);
	return Math.abs(width * height);
};

MagoRectangleGround.prototype.render = function(magoManager, shader, renderType, glPrimitive, bIsSelected) 
{
	if (renderType !== 1)
	{ return false; }

	// render to stencil.
	if (this.dirty)
	{ this.makeMesh(magoManager); }
	
	if (this.objectsArray.length === 0)
	{ return false; }
    
	var sceneState = magoManager.sceneState;
	var gl = sceneState.gl;
	var currentShader;
	var shadersManager = magoManager.postFxShadersManager;
    
	if (shader.getName() !== "groundStencilPrimitives")
	{
		currentShader = shadersManager.getShader("groundStencilPrimitives");
	}
	else
	{
		currentShader = shader;
	}
    
	shadersManager.useProgram(currentShader);
	currentShader.resetLastBuffersBinded();

	currentShader.enableVertexAttribArray(currentShader.position3_loc);
	currentShader.bindUniformGenerals();
    
	

	if (renderType === 1)
	{
		currentShader.disableVertexAttribArray(currentShader.color4_loc);
		currentShader.disableVertexAttribArray(currentShader.normal3_loc); 
		currentShader.disableVertexAttribArray(currentShader.texCoord2_loc); // provisionally has no texCoords.
	
		gl.uniform1i(currentShader.colorType_loc, 0); // 0= oneColor, 1= attribColor, 2= texture.
		gl.uniform4fv(currentShader.oneColor4_loc, [this.color4.r, this.color4.g, this.color4.b, this.color4.a]); //.
		gl.uniform1i(currentShader.bApplySsao_loc, true); // apply ssao.
		gl.uniform1i(currentShader.colorType_loc, 1); // 0= oneColor, 1= attribColor, 2= texture.
		gl.uniform1i(currentShader.bApplySpecularLighting_loc, true); // turn on/off specular lighting.
	}
	
	gl.uniform1i(currentShader.refMatrixType_loc, 0); // in this case, there are not referencesMatrix.
	gl.uniform3fv(currentShader.aditionalMov_loc, [0.0, 0.0, 0.0]); //.***
	gl.uniform3fv(currentShader.refTranslationVec_loc, [0.0, 0.0, 0.0]); 
	gl.uniform3fv(currentShader.scaleLC_loc, [1.0, 1.0, 1.0]); // init referencesMatrix.
	
	gl.enable(gl.DEPTH_TEST);
	gl.depthFunc(gl.LEQUAL);
	
	var buildingGeoLocation = this.geoLocDataManager.getCurrentGeoLocationData();
	buildingGeoLocation.bindGeoLocationUniforms(gl, currentShader); // rotMatrix, positionHIGH, positionLOW.
        
	gl.uniform1i(currentShader.bUseLogarithmicDepth_loc, shadersManager.bUseLogarithmicDepth);
	gl.uniform1f(currentShader.uFCoef_logDepth_loc, sceneState.fCoef_logDepth[0]);
    
	// STENCIL SETTINGS.*
	gl.colorMask(false, false, false, false);
	gl.depthMask(false); // No altere depth buffer.
	gl.enable(gl.CULL_FACE);
	gl.enable(gl.STENCIL_TEST);
	//gl.enable(gl.POLYGON_OFFSET_FILL);
	//gl.polygonOffset(1.0, 2.0); // Original.
	//gl.polygonOffset(0.0, 0.0); 
	
	gl.clearStencil(0);
	var glPrimitive = undefined;
	var renderableObjectMesh = this.objectsArray[0];

	// First pass.* (render the negative mesh)
	gl.cullFace(gl.FRONT); // 1rstPass.
	gl.stencilFunc(gl.ALWAYS, 0x0, 0xff);
	gl.stencilOp(gl.KEEP, gl.INCR, gl.KEEP); // stencilOp(fail, zfail, zpass)
	renderableObjectMesh.render(magoManager, currentShader, renderType, glPrimitive);
	

	// Second pass.* (render the positive mesh)
	gl.cullFace(gl.BACK); // 2ndPass.
	gl.stencilFunc(gl.ALWAYS, 0x0, 0xff);
	gl.stencilOp(gl.KEEP, gl.DECR, gl.KEEP); // stencilOp(fail, zfail, zpass)
	renderableObjectMesh.render(magoManager, currentShader, renderType, glPrimitive);

	// Render : (render the negative mesh)
	if (renderType === 1)
	{
		gl.uniform1i(currentShader.colorType_loc, 0); // 0= oneColor, 1= attribColor, 2= texture.
		gl.uniform4fv(currentShader.oneColor4_loc, [this.color4.r, this.color4.g, this.color4.b, this.color4.a]); //.
	}
	
	gl.colorMask(true, true, true, true);
	gl.depthMask(true);
	gl.stencilMask(0x00);

	//gl.stencilFunc(gl.NOTEQUAL, 0, 0xff);
	gl.stencilFunc(gl.LEQUAL, 1, 0xff);
	gl.stencilOp(gl.REPLACE, gl.REPLACE, gl.REPLACE); // stencilOp(fail, zfail, zpass)

	gl.cullFace(gl.FRONT);
	gl.depthFunc(gl.GREATER);
	
	renderableObjectMesh.render(magoManager, currentShader, renderType, glPrimitive);

	gl.enable(gl.DEPTH_TEST);
	gl.depthFunc(gl.LEQUAL);
	gl.disable(gl.STENCIL_TEST);
	gl.stencilOp(gl.KEEP, gl.KEEP, gl.KEEP); // stencilOp(fail, zfail, zpass)
	gl.disable(gl.POLYGON_OFFSET_FILL);
	gl.cullFace(gl.BACK);
	
	gl.stencilMask(0xff);
    
};