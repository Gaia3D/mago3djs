'use strict';

/**
 * This class is used to render the earth.
 * @class TinTerrain
 * @constructor
 * 
 */
var TinTerrain = function(owner) 
{
	if (!(this instanceof TinTerrain)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
	
	this.owner; // undefined if depth = 0.
	this.depth; 
	if (owner)
	{
		this.owner = owner;
		this.depth = owner.depth + 1;
	}
	else 
	{
		this.depth = 0;
	}
	
	this.childArray; // child array.
	this.childMap; // example: this.childMap["LU"] = tinTerrainChild.
	
	// Data.
	this.X; // tile index X.
	this.Y; // tile index Y.
	
	// CencerPosition.
	this.centerX; // Float64Array.
	this.centerY; // Float64Array.
	this.centerZ; // Float64Array.
	
	// positions(x, y, z), normals, texCoords, colors & indices array.
	this.cartesiansArray;
	this.normalsArray;
	this.texCoordsArray;
	this.colorsArray;
	this.indices;
	
	this.skirtCartesiansArray;
	this.skirtTexCoordsArray;
	
	// Tile extent.
	this.geographicExtent;
	this.sphereExtent;
	this.webMercatorExtent;
	
	// Tile geometry data.
	this.fileLoadState = 0;
	this.dataArrayBuffer;
	this.vboKeyContainer; // class: VBOVertexIdxCacheKeysContainer.
	this.terrainPositionHIGH;
	this.terrainPositionLOW;
	
	this.indexName; // example: "LU".
	this.pathName; // example: "14//4567//516".
	this.texture = {};// must change name.***
	this.textureMaster;
	this.textureElevation = {};
	this.visible;
	
	this.tinTerrainManager;
	
	this.isAdult = false;
	this.birthTime;
	
	/**
	 * Object's current rendering phase. Parameter to avoid duplicated render on scene.
	 * @type {Boolean}
	 * @default false
	 */
	this.renderingFase = 0;
};

TinTerrain.prototype.deleteObjects = function(magoManager)
{
	var gl = magoManager.sceneState.gl;
	
	// delete all tree under this tinTerrain. no delete tiles if depth < 2.
	if (this.childMap !== undefined)
	{
		// subTile 0 (Left-Up).
		var subTile_LU = this.childMap.LU;
		if (subTile_LU !== undefined)
		{
			subTile_LU.deleteObjects(magoManager);
			delete this.childMap.LU;
		}
		
		// subTile 1 (Left-Down).
		var subTile_LD = this.childMap.LD;
		if (subTile_LD !== undefined)
		{
			subTile_LD.deleteObjects(magoManager);
			delete this.childMap.LD;
		}
		
		// subTile 2 (Right-Up).
		var subTile_RU = this.childMap.RU;
		if (subTile_RU !== undefined)
		{
			subTile_RU.deleteObjects(magoManager);
			delete this.childMap.RU;
		}
		
		// subTile 3 (Right-Down).
		var subTile_RD = this.childMap.RD;
		if (subTile_RD !== undefined)
		{
			subTile_RD.deleteObjects(magoManager);
			delete this.childMap.RD;
		}
		
		this.childMap = undefined;
	}
	
	// no delete tiles if depth < 2.
	if (this.depth < 3)
	{ return; }
		
	// now delete objects of this tinTerrain.
	this.owner = undefined;
	this.depth = undefined; 
	this.childArray = undefined;
	this.childMap = undefined; 
	
	// Data.
	this.X = undefined; // index X.
	this.Y = undefined; // index Y.
	
	// Tile extent.
	if (this.geographicExtent !== undefined)
	{
		this.geographicExtent.deleteObjects();
		this.geographicExtent = undefined;
	}
	
	if (this.sphereExtent !== undefined)
	{
		this.sphereExtent.deleteObjects();
		this.sphereExtent = undefined;
	}
	
	// Tile geometry data.
	this.fileLoadState = 0;
	this.dataArrayBuffer = undefined;
	
	if (this.vboKeyContainer !== undefined)
	{
		this.vboKeyContainer.deleteGlObjects(gl, magoManager.vboMemoryManager);
		this.vboKeyContainer = undefined; // class: VBOVertexIdxCacheKeysContainer.
		
	}
	this.terrainPositionHIGH = undefined;
	this.terrainPositionLOW = undefined;
	
	this.indexName = undefined;
	this.pathName = undefined; // example: "14//4567//516".
	
	
	if (this.texture !== undefined)
	{
		var textureKeys = Object.keys(this.texture);
		for (var i=0, len=textureKeys.length;i<len;i++) 
		{
			var texture = this.texture[textureKeys[i]];
			texture.deleteObjects(gl);
			delete this.texture[textureKeys[i]];
			texture = undefined;
		}
		this.texture = {};
	}
	this.visible = undefined;

	delete this.altArray;
	delete this.boundingSphereCenterX;
	delete this.boundingSphereCenterY;
	delete this.boundingSphereCenterZ;
	delete this.boundingSphereRadius;

	delete this.cartesiansArray;
	delete this.cartesiansArraySea;
	delete this.centerX;
	delete this.centerY;
	delete this.centerZ;

	delete this.eastIndices;
	delete this.eastVertexCount;
	delete this.westIndices;
	delete this.westVertexCount;
	delete this.extensionId;
	delete this.extensionLength;

	delete this.hValues;
	delete this.uValues;
	delete this.vValues;
	delete this.horizonOcclusionPointX;
	delete this.horizonOcclusionPointY;
	delete this.horizonOcclusionPointZ;

	delete this.indices;
	delete this.latArray;
	delete this.lonArray;
	delete this.maxHeight;
	delete this.minHeight;
	delete this.normalsArray;
	delete this.normalsArraySea;
	delete this.northIndices;
	delete this.northVertexCount;
	delete this.skirtAltitudesArray;
	delete this.skirtCartesiansArray;
	delete this.skirtCartesiansArraySea;
	delete this.skirtTexCoordsArray;
	delete this.skirtTexCoordsArraySea;
	delete this.southIndices;
	delete this.southVertexCount;
	delete this.texCoordsArray;
	delete this.texture;
	delete this.textureElevation;

	if (this.textureMaster)
	{  gl.deleteTexture(this.textureMaster); }

	delete this.textureMaster;
	delete this.vertexCount;
};

TinTerrain.prototype.getPathName = function()
{
	// this returns a string as: L//X//Y.
	// example: "14//4567//516".
	return this.depth.toString() + "/" + this.X.toString() + "/" + this.Y.toString();
};

TinTerrain.prototype.getPathInfo = function()
{
	return {z: this.depth.toString(), x: this.X.toString(), y: this.Y.toString()};
};

TinTerrain.prototype.checkAvailableTerrain = function()
{
	var pathInfo = this.getPathInfo();

	var terrainInfoObject = this.tinTerrainManager.terrainTilesInfo;
	var availables = terrainInfoObject.available;
	
	var valid = true;
	var z = pathInfo.z;
	var x = pathInfo.x;
	var y = pathInfo.y;
	for (var i=0, availableLen = availables.length; i<availableLen; i++) 
	{
		var available = availables[i];
		if (!available.hasOwnProperty(z))
		{
			valid = false;
			break;
		}

		var terrainInfos = available[z];

		for (var j=0, infoLen=terrainInfos.length; j<infoLen; j++ ) 
		{
			var terrainInfo = terrainInfos[j];

			var minx = terrainInfo.startX;
			var miny = terrainInfo.startY;
			var maxx = terrainInfo.endX;
			var maxy = terrainInfo.endY;

			if (x < minx || x>maxx || y<miny || y>maxy) 
			{
				valid = false;
				break;
			}
		}
	}

	return valid;
};


/**
 * Returns the blending alpha value in current time.
 * 
 * @param {Number} currTime The current time.
 */
TinTerrain.prototype.getBlendAlpha = function(currTime) 
{
	if (!this.isAdult)
	{
		if (this.birthTime === undefined)
		{ this.birthTime = currTime; }
	
		if (this.blendAlpha === undefined)
		{ this.blendAlpha = 0.1; }
		
		var increAlpha = (currTime - this.birthTime)*0.0001;
		this.blendAlpha += increAlpha;
		
		if (this.blendAlpha >= 1.0)
		{
			this.blendAlpha = 1.0;
			this.isAdult = true;
		}
	}
	else
	{ return 1.0; }
	
	return this.blendAlpha;
};
/**
 * 
 */
TinTerrain.prototype.setWebMercatorExtent = function(minX, minY, maxX, maxY)
{
	if (this.webMercatorExtent === undefined)
	{ this.webMercatorExtent = new Rectangle2D(); }
	
	this.webMercatorExtent.setExtension(minX, minY, maxX, maxY);
	// Note: the minX & maxX are no util values.
};
/**
 * 
 */
TinTerrain.prototype.setGeographicExtent = function(minLon, minLat, minAlt, maxLon, maxLat, maxAlt)
{
	if (this.geographicExtent === undefined)
	{ this.geographicExtent = new GeographicExtent(); }
	
	var geoExtent = this.geographicExtent;
	
	if (geoExtent.minGeographicCoord === undefined)
	{ geoExtent.minGeographicCoord = new GeographicCoord(); }
	
	if (geoExtent.maxGeographicCoord === undefined)
	{ geoExtent.maxGeographicCoord = new GeographicCoord(); }
	
	geoExtent.minGeographicCoord.setLonLatAlt(minLon, minLat, minAlt);
	geoExtent.maxGeographicCoord.setLonLatAlt(maxLon, maxLat, maxAlt);
};

TinTerrain.prototype.isChildrenPrepared = function()
{
	if (this.childMap === undefined)
	{ return false; }
	
	if (this.childMap.length < 4)
	{ return false; }

	var luVisible = this.childMap.LU.isVisible();
	var ldVisible = this.childMap.LD.isVisible();
	var ruVisible = this.childMap.RU.isVisible();
	var rdVisible = this.childMap.RD.isVisible();

	if ((this.childMap.LU.isPrepared() || !luVisible) && (this.childMap.LD.isPrepared() || !ldVisible) && (this.childMap.RU.isPrepared() || !ruVisible) &&  (this.childMap.RD.isPrepared() || !rdVisible))
	{ return true; }
	else
	{ return false; }
};

TinTerrain.prototype.hasAnyChildVisible = function()
{
	if (this.childMap === undefined)
	{ return false; }
	
	if (this.childMap.length < 4)
	{ return false; }

	if (this.childMap.LU.isVisible())
	{ return true; }
	else if (this.childMap.LD.isVisible())
	{ return true; }
	else if (this.childMap.RU.isVisible())
	{ return true; }
	else if (this.childMap.RD.isVisible())
	{ return true; }
	
	return false;
};

TinTerrain.prototype.isVisible = function()
{
	if (this.intersectionType === Constant.INTERSECTION_INTERSECT || this.intersectionType === Constant.INTERSECTION_INSIDE )
	{ return true; }
	else { return false; }
	//return this.intersectionType !== Constant.INTERSECTION_OUTSIDE;
};

TinTerrain.prototype.isTexturePrepared = function(texturesMap)
{
	var isTexturePrepared = true;
	var textureKeys = Object.keys(texturesMap);
	var textureLength = textureKeys.length;

	var L = this.depth.toString();
	var imageryLayers = this.tinTerrainManager.getImageryLayers();
	var imageryLength = imageryLayers.length;
	for (var i=0;i<imageryLength;i++) 
	{
		var imagery = imageryLayers[i];
		if (!this.texture[imagery._id] && (imagery.show && imagery.maxZoom > parseInt(L) && imagery.minZoom < parseInt(L))) 
		{
			isTexturePrepared = false;
			break;
		}
	}
	if (!isTexturePrepared) { return isTexturePrepared; }

	//if (!imagery.show || imagery.maxZoom < parseInt(L) || imagery.minZoom > parseInt(L)) { continue; }
	
	for (var i=0;i<textureLength;i++) 
	{
		var texture = texturesMap[textureKeys[i]];
		if (texture.fileLoadState !== CODE.fileLoadState.LOADING_FINISHED || !texture.texId) 
		{
			isTexturePrepared = false;
			break;
		}
	}
	return isTexturePrepared;
};

TinTerrain.prototype.isPrepared = function()
{
	// a tinTerrain is prepared if this is parsed and vbo maked and texture binded.
	if (this.fileLoadState !== CODE.fileLoadState.PARSE_FINISHED)
	{ return false; }
	
	
	if (!this.isTexturePrepared(this.texture)) { return false; }
	
	if (this.vboKeyContainer === undefined || 
		this.vboKeyContainer.vboCacheKeysArray === undefined || 
		this.vboKeyContainer.vboCacheKeysArray.length === 0)
	{ return false; }

	if (this.depth > 2 && !this.textureMasterPrepared)
	{ return false; }
	
	return true;
};

TinTerrain.prototype.getTexCoordsOfGeoExtent = function(geoExtent)
{
	// Calculate the texCoords of geoExtent relative to this tile.
	var minGeoCoord = geoExtent.geographicExtent.minGeographicCoord;
	var maxGeoCoord = geoExtent.geographicExtent.maxGeographicCoord;
	
	var minLon = minGeoCoord.longitude;
	var minLat = minGeoCoord.latitude;
	var maxLon = maxGeoCoord.longitude;
	var maxLat = maxGeoCoord.latitude;

	// This tile geoExtent.
	var thisMinGeoCoord = this.geographicExtent.minGeographicCoord;
	var thisMaxGeoCoord = this.geographicExtent.maxGeographicCoord;
	
	var thisMinLon = thisMinGeoCoord.longitude;
	var thisMinLat = thisMinGeoCoord.latitude;
	var thisMaxLon = thisMaxGeoCoord.longitude;
	var thisMaxLat = thisMaxGeoCoord.latitude;
	var thisLonRange = thisMaxLon - thisMinLon;
	var thisLatRange = thisMaxLat - thisMinLat;

	var minS = (minLon - thisMinLon)/thisLonRange;
	var maxS = (maxLon - thisMinLon)/thisLonRange;
	var minT = (minLat - thisMinLat)/thisLatRange;
	var maxT = (maxLat - thisMinLat)/thisLatRange;
	

};

TinTerrain.prototype.mergeTexturesToTextureMaster = function(gl, shader, texturesArray)
{
	// Private function.
	// Note: the max length is 8 textures in the texturesArray.
	var texturesCount = texturesArray.length;
	if (texturesCount > 8)
	{ texturesCount = 8; }

	var activeTexturesLayers = new Int32Array([0, 0, 0, 0, 0, 0, 0, 0]); 
	var externalAlphaLayers = new Float32Array([1, 1, 1, 1, 1, 1, 1, 1]); 

	// externalTexCoordsArray = (minS, minT, maxS, maxT, 
	// minS, minT, maxS, maxT, 
	// minS, minT, maxS, maxT, ...)
	var externalTexCoordsArray; 
	var thereAreCustomImages = false;

	for (var i=0; i<texturesCount; i++)
	{
		var texture = texturesArray[i];
		gl.activeTexture(gl.TEXTURE0 + i); 
		gl.bindTexture(gl.TEXTURE_2D, texture.texId);
		
		activeTexturesLayers[i] = texture.activeTextureType;
		externalAlphaLayers[i] = texture.opacity;
		if (texture.activeTextureType === 2)
		{
			// custom image.
			if (externalTexCoordsArray === undefined)
			{
				externalTexCoordsArray = new Float32Array([0, 0, 1, 1, 
					0, 0, 1, 1, 
					0, 0, 1, 1, 
					0, 0, 1, 1, 
					0, 0, 1, 1, 
					0, 0, 1, 1, 
					0, 0, 1, 1,
					0, 0, 1, 1]); 
			}
			thereAreCustomImages = true;

			externalTexCoordsArray[i*4] = texture.temp_clampToTerrainTexCoord[0];
			externalTexCoordsArray[i*4+1] = texture.temp_clampToTerrainTexCoord[1];
			externalTexCoordsArray[i*4+2] = texture.temp_clampToTerrainTexCoord[2];
			externalTexCoordsArray[i*4+3] = texture.temp_clampToTerrainTexCoord[3];
		}
		else if (texture.activeTextureType === 10)
		{
			// bathymetry image.
			gl.uniform2fv(shader.uMinMaxAltitudes_loc, [texture.imagery.minAltitude, texture.imagery.maxAltitude]);
		}
	}

	gl.uniform1iv(shader.uActiveTextures_loc, activeTexturesLayers);
	gl.uniform1fv(shader.externalAlphasArray_loc, externalAlphaLayers);
	if (thereAreCustomImages)
	{ gl.uniform4fv(shader.uExternalTexCoordsArray_loc, externalTexCoordsArray); }
	gl.drawArrays(gl.TRIANGLES, 0, 6);
};

TinTerrain.prototype.makeTextureMaster = function()
{
	if (this.textureMasterPrepared)
	{ 
		return; 
	}

	// If there are 2 or more layers, then merge all layers into one texture.
	var magoManager = this.tinTerrainManager.magoManager;
	var postFxShaderManager = magoManager.postFxShadersManager;
	var gl = magoManager.getGl();

	if (this.textureMaster === undefined)
	{ 
		var emptyPixels = new Uint8Array(256* 256 * 4);
		this.textureMaster = Texture.createTexture(gl, gl.LINEAR, emptyPixels, 256, 256); 
	}

	var texturesMergerFbo = this.tinTerrainManager.texturesMergerFbo;
	FBO.bindFramebuffer(gl, texturesMergerFbo, this.textureMaster);
	gl.viewport(0, 0, 256, 256);
	gl.clear(gl.COLOR_BUFFER_BIT);

	if (this.tinTerrainManager.quadBuffer === undefined)
	{
		var data = new Float32Array([0, 0,   1, 0,   0, 1,   0, 1,   1, 0,   1, 1]);
		this.tinTerrainManager.quadBuffer = FBO.createBuffer(gl, data);
	}
	
	//var currShader = postFxShaderManager.getCurrentShader(); // to restore current active shader.
	var shader =  postFxShaderManager.getShader("texturesMerger");
	postFxShaderManager.useProgram(shader);

	for (var i=0; i<8; i++)
	{
		gl.activeTexture(gl.TEXTURE0 + i); 
		gl.bindTexture(gl.TEXTURE_2D, null);
	}

	gl.enableVertexAttribArray(shader.position2_loc);
	FBO.bindAttribute(gl, this.tinTerrainManager.quadBuffer, shader.position2_loc, 2);
	
	// Now, make texturesArrayMatrix. 
	// texturesArrayMatrix is an array that contains textures array with 8 textures as maximum.
	var textureKeys = Object.keys(this.texture);
	var textureLength = textureKeys.length; 
	var texturesToMergeMatrix = []; // array of "texturesToMergeArray".
	var texturesToMergeArray = [];


	var imageryLayers = this.tinTerrainManager.imagerys;
	var layersCount = imageryLayers.length;
	for (var i=0; i<layersCount; i++)
	{
		var layer = imageryLayers[i];
		var texture = this.texture[layer._id];
		if (!texture)
		{ continue; }

		var textureKey = layer._id;
		var activeTexType = 1;

		var filter = texture.imagery.filter;
		if (filter === CODE.imageFilter.BATHYMETRY) 
		{ 
			activeTexType = 10;
		}
		
		if (!(texture.texId instanceof WebGLTexture)) 
		{ continue; }

		if (this.tinTerrainManager.textureIdDeleteMap[textureKey]) 
		{
			this.tinTerrainManager.eraseTexture(texture, magoManager);
			delete this.texture[textureKey];
			continue;
		}
		
		if (!texture.imagery.show) { continue; }

		texture.setOpacity(texture.imagery.opacity); // update to the current imagery opacity.
		texture.setActiveTextureType(activeTexType);
		texturesToMergeArray.push(texture);
		if (texturesToMergeArray.length === 8)
		{
			texturesToMergeMatrix.push(texturesToMergeArray);
			texturesToMergeArray = [];
		}
	}

	// Last step: finally, if there are any texture in the "texturesToMergeArray", then push it.
	if (texturesToMergeArray.length > 0)
	{ texturesToMergeMatrix.push(texturesToMergeArray); }

	
	// Now, check if exist objects to clamp to terrain.
	var objectsToClampToTerrainExistsAndBibded = true;
	var objectsToClampToTerrain = this.tinTerrainManager.objectsToClampToTerrainArray;
	if (objectsToClampToTerrain && objectsToClampToTerrain.length > 0)
	{
		// check if objects intersects with this tile.
		var objToClampCount = objectsToClampToTerrain.length;
		for (var i=0; i<objToClampCount; i++)
		{
			var objToClamp = objectsToClampToTerrain[i];
			if (objToClamp instanceof MagoRectangle)
			{
				
				var minGeoCoord = objToClamp.minGeographicCoord;
				var maxGeoCoord = objToClamp.maxGeographicCoord;
				var objMinLon = minGeoCoord.longitude;
				var objMinLat = minGeoCoord.latitude;
				var objMaxLon = maxGeoCoord.longitude;
				var objMaxLat = maxGeoCoord.latitude;
				var geoExtent = new GeographicExtent(objMinLon, objMinLat, minGeoCoord.altitude, objMaxLon, objMaxLat, maxGeoCoord.altitude);
				if (this.geographicExtent.intersects2dWithGeoExtent(geoExtent))
				{
					if (objToClamp.texture === undefined)
					{
						// load texture 1rst.
						objToClamp.texture = new Texture();
						objToClamp.texture.setActiveTextureType(2);
						var style = objToClamp.style;
						if (style)
						{
							//clampToTerrain: true
							//fillColor: "#00FF00"
							var imageUrl = style.imageUrl;//: "/images/materialImages/factoryRoof.jpg"
							objToClamp.texture.url = imageUrl;
							var flipYTexCoord = false;
							TexturesManager.loadTexture(imageUrl, objToClamp.texture, magoManager, flipYTexCoord);
						}

						continue;
					}
					else if (!(objToClamp.texture.texId instanceof WebGLTexture))
					{
						// there are 2 possibilities.
						// 1- there are a blob.
						// 2- there are a imageUrl.
						if (objToClamp.texture.blob)
						{
							// load by blob.
							TexturesManager.newWebGlTextureByBlob(gl, objToClamp.texture.blob, objToClamp.texture);
						}
						else if (objToClamp.texture.url)
						{
							// load by url.
							TexturesManager.loadTexture(objToClamp.texture.url, objToClamp.texture, magoManager, flipYTexCoord);
						}

						continue;
					}

					// calculate the relative texCoords of the rectangle.
					var thisMinLon = this.geographicExtent.minGeographicCoord.longitude;
					var thisMinLat = this.geographicExtent.minGeographicCoord.latitude;
					var thisMaxLon = this.geographicExtent.maxGeographicCoord.longitude;
					var thisMaxLat = this.geographicExtent.maxGeographicCoord.latitude;
					var thisLonRange = thisMaxLon - thisMinLon;
					var thisLatRange = thisMaxLat - thisMinLat;

					var minS = (objMinLon - thisMinLon)/thisLonRange;
					var minT = (objMinLat - thisMinLat)/thisLatRange;

					var maxS = (objMaxLon - thisMinLon)/thisLonRange;
					var maxT = (objMaxLat - thisMinLat)/thisLatRange;

					objToClamp.texture.temp_clampToTerrainTexCoord = [minS, minT, maxS, maxT];

					if (texturesToMergeArray.length === 8)
					{
						texturesToMergeMatrix.push(texturesToMergeArray);
						texturesToMergeArray = [];
					}

					if (objToClamp.texture.fileLoadState === CODE.fileLoadState.BINDING_FINISHED)
					{ 
						texturesToMergeArray.push(objToClamp.texture); 
					}
					else
					{
						objectsToClampToTerrainExistsAndBibded = false;
					}
					
					var hola = 0;
				}
			}
		} 
	}

	// Last step: finally, if there are any texture in the "texturesToMergeArray", then push it.
	if (texturesToMergeArray.length > 0)
	{ texturesToMergeMatrix.push(texturesToMergeArray); }
	

	// Merge textures into textureMaster.
	gl.enable(gl.BLEND);
	var texturesArraysCount = texturesToMergeMatrix.length;
	for (var i=0; i<texturesArraysCount; i++)
	{
		this.mergeTexturesToTextureMaster(gl, shader, texturesToMergeMatrix[i]);
	}
	gl.disable(gl.BLEND);

	if (objectsToClampToTerrainExistsAndBibded && this.isTexturePrepared(this.texture))
	{ 
		// If this textures are prepared => all textures was merged into textureMaster.
		this.textureMasterPrepared = true; 
		this.layersStyleId = this.tinTerrainManager.layersStyleId;
	}

	FBO.bindFramebuffer(gl, null);
};

TinTerrain.prototype.bindTexture = function(gl, shader)
{
	// Binding textureMaster.
	var activeTexturesLayers = new Int32Array([1, 1, 0, 0, 1, 0, 0, 0]); // note: the 1rst & 2nd are shadowMap textures.
	var externalAlphaLayers = new Float32Array([1, 1, 1, 1, 1, 1, 1, 1]); 

	if (this.textureMaster)// && this.textureMasterPrepared === true)
	{
		gl.activeTexture(gl.TEXTURE4 + 0); 
		gl.bindTexture(gl.TEXTURE_2D, this.textureMaster);

		// bind filter texture (Bathymetry).
		var textureKeys = Object.keys(this.texture);
		var textureLength = textureKeys.length; 
		for (var i=0;i<textureLength;i++) 
		{
			var textureKey = textureKeys[i];
			var texture = this.texture[textureKey];
			if (!(texture.texId instanceof WebGLTexture)) 
			{
				continue;
			}

			if (this.tinTerrainManager.textureIdDeleteMap[textureKey]) 
			{
				this.tinTerrainManager.eraseTexture(texture, magoManager);
				delete this.texture[textureKey];
				continue;
			}
			
			if (!texture.imagery.show) { continue; }
			
			var filter = texture.imagery.filter;
			if (filter) 
			{
				if (filter === CODE.imageFilter.BATHYMETRY) 
				{
					activeTexturesLayers[4+1] = 10;
					gl.activeTexture(gl.TEXTURE4 + 1);
					gl.bindTexture(gl.TEXTURE_2D, texture.texId);
				}
			}
		}	

		gl.uniform1iv(shader.uActiveTextures_loc, activeTexturesLayers);
		gl.uniform1fv(shader.externalAlphasArray_loc, externalAlphaLayers);
		//////////////////////////////////

		return;
	}

	// If no exist textureMaster, then provisionally render textures individually.
	
	var textureKeys = Object.keys(this.texture);
	var textureLength = textureKeys.length; 
	for (var i=0;i<textureLength;i++) 
	{
		var textureKey = textureKeys[i];
		var texture = this.texture[textureKey];
		if (!(texture.texId instanceof WebGLTexture)) 
		{
			continue;
		}

		if (this.tinTerrainManager.textureIdDeleteMap[textureKey]) 
		{
			this.tinTerrainManager.eraseTexture(texture, magoManager);
			delete this.texture[textureKey];
			continue;
		}
		
		if (!texture.imagery.show) { continue; }
		
		gl.activeTexture(gl.TEXTURE4 + i); 
		gl.bindTexture(gl.TEXTURE_2D, texture.texId);
		
		activeTexturesLayers[4+i] = 1;
		externalAlphaLayers[4+i] = texture.imagery.opacity;
		var filter = texture.imagery.filter;
		if (filter) 
		{
			if (filter === CODE.imageFilter.BATHYMETRY) 
			{
				activeTexturesLayers[4+i] = 10;
				gl.bindTexture(gl.TEXTURE_2D, texture.texId);
			}
		}
	}	

	gl.uniform1iv(shader.uActiveTextures_loc, activeTexturesLayers);
	gl.uniform1fv(shader.externalAlphasArray_loc, externalAlphaLayers);
	
};

TinTerrain.prototype.prepareTexture = function(texturesMap, imagerys, magoManager, tinTerrainManager)
{
	var gl = magoManager.sceneState.gl;

	var L = this.depth.toString();
	var X = this.X.toString();
	var Y = this.Y.toString();

	for (var i = 0, len = imagerys.length; i < len; i++) 
	{
		var imagery = imagerys[i];
		if (!imagery.show || imagery.maxZoom < parseInt(L) || imagery.minZoom > parseInt(L)) { continue; }
		var id = imagery._id;
		if (this.texture[id]) { continue; }

		// In the new version check if exist blob : todo.***
		
		var texture = new Texture();
		var textureUrl = imagery.getUrl({x: X, y: Y, z: L});

		this.texFilePath__TEST = textureUrl;
		var flip_y_texCoords = false;
		magoManager.readerWriter.loadWMSImage(gl, textureUrl, texture, magoManager, flip_y_texCoords);

		this.texture[id] = texture;
		this.texture[id].imagery = imagery;

		tinTerrainManager.addTextureId(id);
	}	
};

TinTerrain.prototype.prepareTinTerrainPlain = function(magoManager, tinTerrainManager)
{
	// first, read terrainTiles-info.json
	if (!this.tinTerrainManager.terrainReady) 
	{
		return false;
	}
	// Earth considering as an ellipsoid (no elevation data of terrain).***
	// This function 1- loads file & 2- parses file & 3- makes vbo.
	// 1rst, check if the parent is prepared. If parent is not prepared, then prepare the parent.
	
	if (this.owner === undefined || this.owner.isPrepared())
	{
		// 1rst, try to erase from procesQueue_deleting if exist.
		magoManager.processQueue.eraseTinTerrainToDelete(this);
		
		// Prepare this tinTerrain.
		this.fileLoadState = CODE.fileLoadState.PARSE_FINISHED;
		if (this.fileLoadState === CODE.fileLoadState.PARSE_FINISHED && this.vboKeyContainer === undefined)
		{
			this.calculateCenterPosition();
			this.makeMeshVirtually(20, 20, undefined, undefined);
			this.makeVbo(magoManager.vboMemoryManager);
			return false;
		}
		else if (!this.isTexturePrepared(this.texture))
		{
			this.prepareTexture(this.texture, tinTerrainManager.imagerys, magoManager, tinTerrainManager);
			return false;
		}

		return true;
	}
	else
	{
		// Prepare ownerTinTerrain.
		return this.owner.prepareTinTerrainPlain(magoManager, tinTerrainManager);
	}
	
	return true;
};

TinTerrain.prototype.prepareTinTerrain = function(magoManager, tinTerrainManager)
{
	// first, read terrainTiles-info.json
	if (!this.tinTerrainManager.terrainReady) 
	{
		return false;
	}

	/*
	if (!this.isVisible())
	{
		if (this.owner.isVisible())
		{
			return this.owner.prepareTinTerrain(magoManager, tinTerrainManager);
		}
	
		return false;
	}*/

	// This function 1- loads file & 2- parses file & 3- makes vbo.
	// 1rst, check if the parent is prepared. If parent is not prepared, then prepare the parent.
	if (this.owner === undefined || (this.owner.isPrepared() &&  this.owner.hasAnyChildVisible()))
	{
		// 1rst, try to erase from procesQueue_deleting if exist.
		magoManager.processQueue.eraseTinTerrainToDelete(this);
		
		// Prepare this tinTerrain.
		if (this.fileLoadState === CODE.fileLoadState.READY)
		{
			//해당 터레인 xyz를 terrainInfo와 비교하여 유효한 파일이면 통과, 아닐시 plain으로 처리
			if (!this.checkAvailableTerrain()) 
			{
				this.fileLoadState = CODE.fileLoadState.LOAD_FAILED;
				return false;
			}

			var pathName = this.getPathName();
			var geometryDataPath = magoManager.readerWriter.geometryDataPath;
			//var fileName = geometryDataPath + "/Terrain/" + pathName + ".terrain";

			var fileName = this.tinTerrainManager.terrainValue + pathName + ".terrain";
			magoManager.readerWriter.loadTINTerrain(fileName, this, magoManager);
			
			return false;
		}
		else if (this.fileLoadState === CODE.fileLoadState.LOADING_FINISHED)
		{
			// put the terrain into parseQueue.
			magoManager.parseQueue.putTinTerrainToParse(this, 0);
			return false;
		}
		else if (this.fileLoadState === CODE.fileLoadState.PARSE_STARTED) 
		{
			var parsedTerrainMap = tinTerrainManager.textureParsedTerrainMap;
			var z = this.depth;
			var x = this.X;
			var y = this.Y;
			if (!parsedTerrainMap[z]) { return; }
			if (!parsedTerrainMap[z][x]) { return; }
			if (!parsedTerrainMap[z][x][y]) { return; }

			var result = parsedTerrainMap[z][x][y];

			this.centerX = result.centerX;
			this.centerY = result.centerY;
			this.centerZ = result.centerZ;
			
			this.minHeight = result.minHeight;
			this.maxHeight = result.maxHeight;
			
			// In this moment set the altitudes for the geographicExtension.
			this.geographicExtent.setExtent(undefined, undefined, this.minHeight[0], undefined, undefined, this.maxHeight[0]);
			
			this.boundingSphereCenterX = result.boundingSphereCenterX;
			this.boundingSphereCenterY = result.boundingSphereCenterY;
			this.boundingSphereCenterZ = result.boundingSphereCenterZ;
			this.boundingSphereRadius = result.boundingSphereRadius;
			
			this.horizonOcclusionPointX = result.horizonOcclusionPointX;
			this.horizonOcclusionPointY = result.horizonOcclusionPointY;
			this.horizonOcclusionPointZ = result.horizonOcclusionPointZ;
			
			// 2. vertex data.
			this.vertexCount = result.vertexCount;
			this.uValues = result.uValues;
			this.vValues = result.vValues;
			this.hValues = result.hValues;
			
			// 3. indices.
			this.trianglesCount = result.trianglesCount;
			this.indices = result.indices;
			
			// 4. edges indices.
			this.westVertexCount = result.westVertexCount;
			this.westIndices = result.westIndices;
			
			this.southVertexCount = result.southVertexCount;
			this.southIndices = result.southIndices;
			
			this.eastVertexCount = result.eastVertexCount; 
			this.eastIndices = result.eastIndices;
			
			this.northVertexCount = result.northVertexCount;
			this.northIndices = result.northIndices;

			// 5. extension header.
			this.extensionId = result.extensionId;
			this.extensionLength = result.extensionLength;
			
			this.fileLoadState = CODE.fileLoadState.PARSE_FINISHED;
			delete this.tinTerrainManager.textureParsedTerrainMap[z][x][y];

			return false;
		}
		else if (this.fileLoadState === CODE.fileLoadState.PARSE_FINISHED && this.vboKeyContainer === undefined)
		{
			if (!this.requestDecodeData) 
			{ 
				this.decodeData(tinTerrainManager.imageryType); 
				return false;
			}
			
			var z = this.depth;
			var x = this.X;
			var y = this.Y;
			var decodedTerrainMap = tinTerrainManager.textureDecodedTerrainMap;
			if (!decodedTerrainMap[z]) { return false; }
			if (!decodedTerrainMap[z][x]) { return false; }
			if (!decodedTerrainMap[z][x][y]) { return false; }

			var result = decodedTerrainMap[z][x][y];

			this.texCoordsArray = result.texCoordsArray;
			this.cartesiansArray = result.cartesiansArray;
			this.skirtCartesiansArray = result.skirtCartesiansArray;
			this.skirtTexCoordsArray = result.skirtTexCoordsArray;
			this.skirtAltitudesArray = result.skirtAltitudesArray;
			this.altArray = result.altArray;
			this.normalsArray = result.normalsArray;
			this.lonArray = result.longitudesArray;
			this.latArray = result.latitudesArray;

			delete this.tinTerrainManager.textureDecodedTerrainMap[z][x][y];
			this.makeVbo(magoManager.vboMemoryManager);

			// Make sea mesh too.
			this.makeSeaMeshVirtually(undefined);
			this.makeVboSea(magoManager.vboMemoryManager);
			return false;
		}
		else if (!this.isTexturePrepared(this.texture))
		{
			this.prepareTexture(this.texture, tinTerrainManager.imagerys, magoManager, tinTerrainManager);
			return false;
		}
		else if (this.fileLoadState === CODE.fileLoadState.LOAD_FAILED)
		{
			// Test.***
			return this.prepareTinTerrainPlain(magoManager, tinTerrainManager);
			return false;
			// End test.---
		}

		// Test making textureMaster.
		// If there are 2 or more layers, then must create textureMaster.
		// Check if tinTerrain is syncronized with this.tinTerrainManager.
		if (this.layersStyleId !== this.tinTerrainManager.layersStyleId)
		{ 
			this.textureMasterPrepared = undefined; 
		}

		if (this.textureMasterPrepared === undefined && this.isTexturePrepared(this.texture))
		{
			this.makeTextureMaster();
		}


		return true;
	}
	else
	{
		// Prepare ownerTinTerrain.
		return this.owner.prepareTinTerrain(magoManager, tinTerrainManager);
	}
};

TinTerrain.prototype.prepareTinTerrainRealTimeElevation = function(magoManager, tinTerrainManager)
{
	if (this.depth < 10)
	{
		return this.prepareTinTerrainPlain(magoManager, tinTerrainManager);
		//return;
	}
	
	// This function 1- loads file & 2- parses file & 3- makes vbo.
	// 1rst, check if the parent is prepared. If parent is not prepared, then prepare the parent.
	if (this.owner === undefined || this.owner.isPrepared())
	{
		// 1rst, try to erase from procesQueue_deleting if exist.
		magoManager.processQueue.eraseTinTerrainToDelete(this);
		
		// 1rst, load the elevation data image.
		if (!this.isTexturePrepared(this.textureElevation))
		{
			this.prepareTexture(this.textureElevation, tinTerrainManager.imagerysDEM, magoManager, tinTerrainManager);
			return false;
		}
		else if (this.fileLoadState === CODE.fileLoadState.READY)
		{
			var textureKeys = Object.keys(this.textureElevation);
			if (textureKeys.length > 0)
			{
				var texture = this.textureElevation[textureKeys[0]];
				if (texture)
				{
					var lonSegs = 16;
					var latSegs = 16;
					this.minHeight = new Float32Array([-200.0]); 
					this.maxHeight = new Float32Array([1943.15]); 
					var altArray = this.makeAltitudesSliceByTexture(lonSegs, latSegs, undefined, texture, magoManager);
					this.test_mesh = 1;
					
					var options = {};
					options.altitudesSlice = altArray;
					this.makeMeshVirtually(lonSegs, latSegs, undefined, options);
					this.fileLoadState = CODE.fileLoadState.PARSE_FINISHED;
				}
			}
			return false;
		}
		else if (this.fileLoadState === CODE.fileLoadState.PARSE_FINISHED && this.vboKeyContainer === undefined)
		{
			//this.calculateCenterPosition();
			//this.makeMeshVirtually(20, 20, undefined, undefined);
			this.makeVbo(magoManager.vboMemoryManager);
			return false;
		}
		else if (!this.isTexturePrepared(this.texture))
		{
			//if (magoManager.fileRequestControler.tinTerrainTexturesRequested < 2)
			{
				this.prepareTexture(this.texture, tinTerrainManager.imagerys, magoManager, tinTerrainManager);
			}
			return false;
		}
		else if (this.fileLoadState === CODE.fileLoadState.LOAD_FAILED)
		{
			// Test.***
			return this.prepareTinTerrainPlain(magoManager, tinTerrainManager);
			// End test.---
		}

		return true;
	}
	else
	{
		// Prepare ownerTinTerrain.
		return this.owner.prepareTinTerrainRealTimeElevation(magoManager, tinTerrainManager);
		//return;
	}
	
	return true;
};

TinTerrain.prototype.hasChildren = function()
{
	if (this.childMap !== undefined )
	{ 
		if (this.childMap.LD || this.childMap.RD || this.childMap.RU || this.childMap.LU)
		{ return true; } 
	}
	
	return false;
};

TinTerrain.prototype.deleteTinTerrain = function(magoManager)
{
	// The quadTree must be deleted lowest-quads first.
	// Check if this has child. If this has child, then, 1rst delete child.
	if (this.hasChildren())
	{
		// Delete children 1rst.
		for (var key in this.childMap)
		{
			if (Object.prototype.hasOwnProperty.call(this.childMap, key))
			{
				var child = this.childMap[key];
				child.deleteTinTerrain(magoManager);
			}
		}
		
		return false;
	}
	else
	{
		// 1rst, delete from parse-queue if exist.
		magoManager.parseQueue.eraseTinTerrainToParse(this);
		// put this tinTerrain into deleteQueue.
		magoManager.processQueue.putTinTerrainToDelete(this, 0);
		
		return true;
	}
};

TinTerrain.prototype.renderBorder = function(currentShader, magoManager)
{
	// TODO:
};

TinTerrain.prototype.render = function(currentShader, magoManager, bDepth, renderType, succesfullyRenderedTilesArray)
{	
	if (this.depth === 0)
	{ return true; }

	//if (this.isChildrenPrepared())
	//{ 
	//	this.subTile_LU.
	//	return false; 
	//}
	
	if (this.owner === undefined || (this.owner.isPrepared() && this.owner.isChildrenPrepared()))
	{
		if (this.isPrepared())
		{
			if (this.fileLoadState === CODE.fileLoadState.LOAD_FAILED) // provisional solution.
			{ return false; }
		
			if (!this.isTexturePrepared(this.texture))
			{ return false; }

			if (this.renderingFase === this.tinTerrainManager.renderingFase)
			{ 
				return; 
			}

			if (this.owner.renderingFase === this.tinTerrainManager.renderingFase)
			{ 
				// If my owner rendered, then do no render me.
				return; 
			}
		
			var gl = magoManager.getGl();
			if (renderType === 2)
			{
				var colorAux;
				colorAux = magoManager.selectionColor.getAvailableColor(colorAux);
				var idxKey = magoManager.selectionColor.decodeColor3(colorAux.r, colorAux.g, colorAux.b);
				magoManager.selectionManager.setCandidateGeneral(idxKey, this);
				
				gl.uniform1i(currentShader.colorType_loc, 0); // 0= oneColor, 1= attribColor, 2= texture.
				gl.uniform4fv(currentShader.oneColor4_loc, [colorAux.r/255.0, colorAux.g/255.0, colorAux.b/255.0, 1.0]);
			}
			else if (renderType === 1)
			{
				var activeTexturesLayers = new Int32Array([1, 1, 0, 0, 0, 0, 0, 0]); // note: the 1rst & 2nd are shadowMap textures.
				gl.uniform1i(currentShader.colorType_loc, 2); // 0= oneColor, 1= attribColor, 2= texture.
				gl.uniform1f(currentShader.externalAlpha_loc, 1);
				gl.uniform2fv(currentShader.uMinMaxAltitudes_loc, [-200.0, 1943.14]);
				gl.uniform1i(currentShader.bApplySsao_loc, this.depth > 8); // apply ssao default.***

				// Caustics.***************************************
				var time = new Date().getTime()/(1000.0);
				var fractionalTime = (time%1000);

				if (this.timeRandomFactor === undefined)
				{ this.timeRandomFactor = Math.random()*1000.0; }

				fractionalTime += this.timeRandomFactor;
				if (fractionalTime > 1000.0)
				{ fractionalTime -= 1000.0; }

				gl.uniform1f(currentShader.uTime_loc, fractionalTime);
				// End caustics.----------------------------------------

				this.bindTexture(gl, currentShader);

			}
			
			// render this tinTerrain.
			var renderWireframe = false;
			var vboMemManager = magoManager.vboMemoryManager;
			
			gl.uniform3fv(currentShader.buildingPosHIGH_loc, this.terrainPositionHIGH);
			gl.uniform3fv(currentShader.buildingPosLOW_loc, this.terrainPositionLOW);
			
			gl.uniform1i(currentShader.uTileDepth_loc, this.depth);
			gl.uniform1i(currentShader.uSeaOrTerrainType_loc, 0); // terrain.
			//gl.uniform1i(currentShader.uSeaOrTerrainType_loc, 1); // ocean.
			
			var vboKey = this.vboKeyContainer.vboCacheKeysArray[0]; // the idx = 0 is the terrain. idx = 1 is the skirt.
			
			// Positions.
			if (!vboKey.bindDataPosition(currentShader, vboMemManager))
			{ 
				if (this.owner !== undefined)
				{ this.owner.render(currentShader, magoManager, bDepth, renderType, succesfullyRenderedTilesArray); }
				return false; 
			}
		
			// TexCoords (No necessary for depth rendering).
			if (!bDepth)
			{
				if (!vboKey.bindDataTexCoord(currentShader, vboMemManager))
				{
					if (this.owner !== undefined)
					{ this.owner.render(currentShader, magoManager, bDepth, renderType, succesfullyRenderedTilesArray); }					
					return false; 
				}
			}
			
			// Normals.
			if (!vboKey.bindDataNormal(currentShader, vboMemManager))
			{ 
				if (this.owner !== undefined)
				{ this.owner.render(currentShader, magoManager, bDepth, renderType, succesfullyRenderedTilesArray); }
				return false; 
			}
			
			// Colors.
			// todo:
			
			
			/*
			if (vboKey.bindDataCustom(currentShader, vboMemManager, "altitudes"))
			{
				gl.uniform1i(currentShader.bExistAltitudes_loc, true);
			}
			else 
			{
				gl.uniform1i(currentShader.bExistAltitudes_loc, false);
			}
			*/
			
			// Indices.
			if (!vboKey.bindDataIndice(currentShader, vboMemManager))
			{ 
				if (this.owner !== undefined)
				{ this.owner.render(currentShader, magoManager, bDepth, renderType, succesfullyRenderedTilesArray); }
				return false; 
			}
			
			var indicesCount = vboKey.indicesCount;
			
			//var currSelObject = magoManager.selectionManager.getSelectedGeneral();
			//if (currSelObject !== this)
			{
				if (renderWireframe)
				{
					var trianglesCount = indicesCount;
					for (var i=0; i<trianglesCount; i++)
					{
						gl.drawElements(gl.LINE_LOOP, 3, gl.UNSIGNED_SHORT, i*3); // Fill.
					}
				}
				else
				{
					var currSelObject = magoManager.selectionManager.getSelectedGeneral();
					if (currSelObject !== this)
					{ gl.drawElements(gl.TRIANGLES, indicesCount, gl.UNSIGNED_SHORT, 0); } // Fill.
				}
			}
			
			succesfullyRenderedTilesArray.push(this);

			// Init the intersectionType.
			this.intersectionType = Constant.INTERSECTION_OUTSIDE;
			
			// Test Render wireframe if selected.*************************************************************
			
			if (renderType === 1)
			{
				gl.uniform1i(currentShader.colorType_loc, 2); // 0= oneColor, 1= attribColor, 2= texture.
				var currSelObject = magoManager.selectionManager.getSelectedGeneral();
				if (currSelObject === this)
				{
					gl.uniform1i(currentShader.colorType_loc, 0); // 0= oneColor, 1= attribColor, 2= texture.
					gl.uniform4fv(currentShader.oneColor4_loc, [0.0, 0.9, 0.9, 1.0]);
					
					//gl.drawElements(gl.LINES, indicesCount-1, gl.UNSIGNED_SHORT, 0); 
					
					//if (this.tinTerrainManager.getTerrainType() === 0)
					//{
					//	gl.drawElements(gl.LINE_STRIP, indicesCount-1, gl.UNSIGNED_SHORT, 0); 
					//}
					//else 
					//{
					var trianglesCount = indicesCount;
					for (var i=0; i<trianglesCount-1; i++)
					{
						gl.drawElements(gl.LINE_LOOP, 3, gl.UNSIGNED_SHORT, i*3); 
					}
					//}
					
					this.drawTerrainName(magoManager);
				}

			}
			// End test.--------------------------------------------------------------------------------------
			
			// Render skirt if exist.
			
			var vboKey = this.vboKeyContainer.vboCacheKeysArray[1]; // the idx = 0 is the terrain. idx = 1 is the skirt.
			if (vboKey === undefined)
			{ return; }
			
			// Positions.
			if (!vboKey.bindDataPosition(currentShader, vboMemManager))
			{ 
				return false; 
			}
		
			// TexCoords (No necessary for depth rendering).
			if (renderType === 1)
			{
				if (!vboKey.bindDataTexCoord(currentShader, vboMemManager))
				{				
					return false; 
				}
			}
			
			//if (vboKey.bindDataCustom(currentShader, vboMemManager, "altitudes"))
			//{
			//	gl.uniform1i(currentShader.bExistAltitudes_loc, true);
			//}
			//else 
			//{
			//	gl.uniform1i(currentShader.bExistAltitudes_loc, false);
			//}
			gl.uniform1i(currentShader.bApplySsao_loc, false); // no apply ssao on skirt.***

			var currSelObject = magoManager.selectionManager.getSelectedGeneral();
			if (currSelObject !== this)// && renderType !== 0)
			{ 
				//gl.depthRange(0.5, 1);
				gl.drawArrays(gl.TRIANGLE_STRIP, 0, vboKey.vertexCount); 
				//gl.depthRange(0, 1);
			} 
			
			this.renderingFase = this.tinTerrainManager.renderingFase;
		}
		else 
		{
			// render the owner tinTerrain.
			if (this.owner !== undefined)
			{ this.owner.render(currentShader, magoManager, bDepth, renderType, succesfullyRenderedTilesArray); }
		}
	}
	else 
	{
		// render the owner tinTerrain.
		if (this.owner !== undefined)
		{ this.owner.render(currentShader, magoManager, bDepth, renderType, succesfullyRenderedTilesArray); }
	}
	
	return true;
};

/**
 * Draw terrain names on scene.
 */
TinTerrain.prototype.renderSea = function(currentShader, magoManager, bDepth, renderType) 
{
	if (this.depth === 0)
	{ return true; }

	if (this.minHeight[0] > 0.0)
	{ return false; }
	
	if (this.vboKeyContainer === undefined)
	{ return; }
	
	var vboKeySea = this.vboKeyContainer.vboCacheKeysArray[2];
	if (vboKeySea === undefined)
	{ return; }
	
	//if (this.owner === undefined || (this.owner.isPrepared() && this.owner.isChildrenPrepared()))
	{
		//if (this.isPrepared())
		{
			//if (this.fileLoadState === CODE.fileLoadState.LOAD_FAILED) // provisional solution.
			//{ return false; }
		
			//if (!this.isTexturePrepared(this.texture))
			//{ return false; }
		
			var gl = magoManager.getGl();
			(renderType === 1);
			{
				var activeTexturesLayers = new Int32Array([1, 1, 0, 0, 0, 0, 0, 0]);
				gl.uniform1i(currentShader.colorType_loc, 2); // 0= oneColor, 1= attribColor, 2= texture.
				gl.uniform1f(currentShader.externalAlpha_loc, 1);
				gl.uniform2fv(currentShader.uMinMaxAltitudes_loc, [-200.0, 1943.14]);
				
				var textureKeys = Object.keys(this.texture);
				var textureLength = textureKeys.length; 
				for (var i=0;i<textureLength;i++) 
				{
					gl.activeTexture(gl.TEXTURE2 + i); 
					var texture = this.texture[textureKeys[i]];
					gl.bindTexture(gl.TEXTURE_2D, texture.texId);
					
					activeTexturesLayers[2+i] = 1;
					var filter = texture.imagery.filter;
					if (filter) 
					{
						if (filter === CODE.imageFilter.BATHYMETRY) 
						{
							activeTexturesLayers[2+i] = 10;
						}
					}
				}	

				gl.uniform1iv(currentShader.uActiveTextures_loc, activeTexturesLayers);
			}
			
			// render this tinTerrain.
			var renderWireframe = false;
			var vboMemManager = magoManager.vboMemoryManager;
			
			gl.uniform3fv(currentShader.buildingPosHIGH_loc, this.terrainPositionHIGH);
			gl.uniform3fv(currentShader.buildingPosLOW_loc, this.terrainPositionLOW);
			
			gl.uniform1i(currentShader.uTileDepth_loc, this.depth);
			
			var vboKey = this.vboKeyContainer.vboCacheKeysArray[0]; // the idx = 0 is the terrain. idx = 1 is the skirt.
			
			// Check if exist sea.
			if (renderType === 1 && vboKeySea)
			{
				gl.uniform1i(currentShader.colorType_loc, 0); // 0= oneColor, 1= attribColor, 2= texture.
				gl.uniform4fv(currentShader.oneColor4_loc, [0.1, 0.7, 0.9, 0.5]);
				gl.uniform1i(currentShader.uSeaOrTerrainType_loc, 1); // sea.
					
				// Positions.
				if (!vboKeySea.bindDataPosition(currentShader, vboMemManager))
				{ 
					//if (this.owner !== undefined)
					//{ this.owner.renderSea(currentShader, magoManager, bDepth, renderType); }	
					return false; 
				}

				// Normals.
				if (!vboKeySea.bindDataNormal(currentShader, vboMemManager))
				{ 
					return false; 
				}
				
				if (!vboKey.bindDataTexCoord(currentShader, vboMemManager))
				{
					//if (this.owner !== undefined)
					//{ this.owner.renderSea(currentShader, magoManager, bDepth, renderType); }					
					return false; 
				}
				
				// Indices.
				var vboKey = this.vboKeyContainer.vboCacheKeysArray[0]; // the idx = 0 is the terrain. idx = 1 is the skirt. idx = 2 is the sea.
				if (!vboKey.bindDataIndice(currentShader, vboMemManager))
				{ 
					//if (this.owner !== undefined)
					//{ this.owner.renderSea(currentShader, magoManager, bDepth, renderType); }	
					return false; 
				}
				
				var indicesCount = vboKey.indicesCount;
				
				renderWireframe = false;
				if (renderWireframe)
				{
					var trianglesCount = indicesCount;
					for (var i=0; i<trianglesCount; i++)
					{
						gl.drawElements(gl.LINE_LOOP, 3, gl.UNSIGNED_SHORT, i*3); // Fill.
					}
				}
				else
				{
					gl.drawElements(gl.TRIANGLES, indicesCount, gl.UNSIGNED_SHORT, 0); // Fill.
				}

				// Render skirt if exist.
				/*
				var vboKeySeaSkirt = this.vboKeyContainer.vboCacheKeysArray[3]; // the idx = 0 is the terrain. idx = 1 is the skirt.
				if (vboKeySeaSkirt === undefined)
				{ return; }
				
				// Positions.
				if (!vboKeySeaSkirt.bindDataPosition(currentShader, vboMemManager))
				{ 
					return false; 
				}
			
				// TexCoords (No necessary for depth rendering).
				if (!bDepth)
				{
					if (!vboKeySeaSkirt.bindDataTexCoord(currentShader, vboMemManager))
					{				
						return false; 
					}
				}
				
				gl.drawArrays(gl.TRIANGLE_STRIP, 0, vboKeySeaSkirt.vertexCount); // Fill.
				*/
			}

		}

	}

	
	return true;
};

/**
 * Draw terrain names on scene.
 */
TinTerrain.prototype.drawTerrainName = function(magoManager) 
{
	var canvas = magoManager.getObjectLabel();
	var ctx = canvas.getContext("2d");

	var gl = magoManager.getGl();
	var screenCoord;
	
	// Calculate the middle geoLocation.
	var midGeoCoord = this.geographicExtent.getMidPoint();
	var pointWC = ManagerUtils.geographicCoordToWorldPoint(midGeoCoord.longitude, midGeoCoord.latitude, midGeoCoord.altitude, undefined);
	screenCoord = ManagerUtils.calculateWorldPositionToScreenCoord(gl, pointWC.x, pointWC.y, pointWC.z, screenCoord, magoManager);
	
	if (screenCoord.x >= 0 && screenCoord.y >= 0)
	{
		ctx.font = "13px Arial";
		var pathName = this.getPathName();
		ctx.strokeText(pathName, screenCoord.x, screenCoord.y);
		ctx.fillText(pathName, screenCoord.x, screenCoord.y);
		
		magoManager.canvasDirty = true;
	}
	
	ctx.restore(); 
};

TinTerrain.prototype.extractLowestTinTerrains = function(resultLowestTilesArray)
{
	if (hasChildren())
	{
		for (var key in this.childMap)
		{
			if (Object.prototype.hasOwnProperty.call(this.childMap, key))
			{
				var child = this.childMap[key];
				child.visible = false;
				//child.extractLowestTinTerrains(resultLowestTilesArray);
				resultLowestTilesArray.push(child);
			}
		}
	}
	else 
	{
		//resultLowestTilesArray.push(this);
	}
};

TinTerrain.prototype.getObjectIdxSortedByDist = function(objectsArray, startIdx, endIdx, object) 
{
	// this do a dicotomic search of idx in a ordered table.
	// 1rst, check the range.
	var range = endIdx - startIdx;
	if (range < 6)
	{
		// in this case do a lineal search.
		var finished = false;
		var i = startIdx;
		var idx;

		while (!finished && i<=endIdx)
		{
			var anObject = objectsArray[i];
			if (object.distToCam < anObject.distToCam)
			{
				idx = i;
				finished = true;
			}
			i++;
		}
		
		if (finished)
		{ return idx; }
		else 
		{ return endIdx+1; }
	}
	else 
	{
		// in this case do the dicotomic search.
		var middleIdx = startIdx + Math.floor(range/2);
		var newStartIdx;
		var newEndIdx;
		var middleObject = objectsArray[middleIdx];
		if (middleObject.distToCam > object.distToCam)
		{
			newStartIdx = startIdx;
			newEndIdx = middleIdx;
		}
		else 
		{
			newStartIdx = middleIdx;
			newEndIdx = endIdx;
		}
		return this.getObjectIdxSortedByDist(objectsArray, newStartIdx, newEndIdx, object);
	}
};

/**
 * Put the object by distance from camera
 */
TinTerrain.prototype.putObjectToArraySortedByDist = function(objectsArray, object) 
{
	if (objectsArray.length > 0)
	{
		var startIdx = 0;
		var endIdx = objectsArray.length - 1;
		var idx = this.getObjectIdxSortedByDist(objectsArray, startIdx, endIdx, object);
		               
		
		objectsArray.splice(idx, 0, object);
	}
	else 
	{
		objectsArray.push(object);
	}
};


TinTerrain.prototype.getFrustumIntersectedTinTerrainsQuadTree = function(frustum, maxDepth, camPos, magoManager, visibleTilesArrayMap, noVisibleTilesArray)
{
	// Note: this is NO frustum intersection. Select tiles by distance to camera. Function name must to be change.
	if (this.geographicExtent === undefined || this.geographicExtent.minGeographicCoord === undefined || this.geographicExtent.maxGeographicCoord === undefined)
	{ return; }
	
	var currMinGeographicCoords = this.geographicExtent.minGeographicCoord;
	var currMaxGeographicCoords = this.geographicExtent.maxGeographicCoord;
		
	if (this.sphereExtent === undefined)
	{
		this.sphereExtent = SmartTile.computeSphereExtent(magoManager, currMinGeographicCoords, currMaxGeographicCoords, this.sphereExtent);
	}
	
	var sphereExtentAux = this.sphereExtent;

	var currDepth = this.depth;

	// FrustumCulling.***************************************************
	this.intersectionType = frustum.intersectionSphere(this.sphereExtent);
	//this.intersectionType === Constant.INTERSECTION_OUTSIDE
	//this.intersectionType === Constant.INTERSECTION_INSIDE
	//this.intersectionType === Constant.INTERSECTION_INTERSECT
	// End frustumCulling.--------------------------------------------------

	this.distToCam = camPos.distToSphere(sphereExtentAux);

	if (this.intersectionType === Constant.INTERSECTION_OUTSIDE && this.depth > 0)
	{
		if (this.distToCam < 0.0)
		{ this.distToCam =1; }
		
		this.distToCam *= 100000;
	}


	var distLimit = this.tinTerrainManager.distLimitByDepth[currDepth];
	
	if (this.distToCam > distLimit)
	{
		// finish the process.
		this.visible = true;
		if (visibleTilesArrayMap[this.depth] === undefined)
		{ visibleTilesArrayMap[this.depth] = []; }

		this.putObjectToArraySortedByDist(visibleTilesArrayMap[this.depth], this);
		
		// Now, extract all lowest-child and put into "noVisibleTilesArray".***
		if (this.hasChildren())
		{
			//this.extractLowestTinTerrains(noVisibleTilesArray);
			noVisibleTilesArray.push(this.childMap.LU);
			noVisibleTilesArray.push(this.childMap.LD);
			noVisibleTilesArray.push(this.childMap.RU);
			noVisibleTilesArray.push(this.childMap.RD);
		}
		return;
	}
	
	if (currDepth < maxDepth)
	{
		// must descend.
		var curX = this.X;
		var curY = this.Y;
		var minLon = currMinGeographicCoords.longitude;
		var minLat = currMinGeographicCoords.latitude;
		var minAlt = currMinGeographicCoords.altitude;
		var maxLon = currMaxGeographicCoords.longitude;
		var maxLat = currMaxGeographicCoords.latitude;
		var maxAlt = currMaxGeographicCoords.altitude;
		var midLon = (minLon + maxLon)/ 2;
		var midLat = (minLat + maxLat)/ 2;
	
		// create children if no exist.
		// +--------------+--------------+
		// | subTile 0(LU)| subTile 2(RU)|
		// | X = curX*2   | X = curX*2+1 |
		// | Y = curY*2   | Y = curY*2   |
		// |              |              |
		// +--------------+--------------+
		// | subTile 1(LD)| subTile 3(RD)|
		// | X = curX*2   | X = curX*2+1 |
		// | Y = curY*2+1 | Y = curY*2+1 |
		// |              |              |
		// +--------------+--------------+
		
		if (this.tinTerrainManager.imageryType === CODE.imageryType.WEB_MERCATOR)
		{
			midLat = this.getMidLatitudeRadWebMercator()*180/Math.PI;
		}
		
		var wmMinX = this.webMercatorExtent.minX;
		var wmMinY = this.webMercatorExtent.minY;
		var wmMaxX = this.webMercatorExtent.maxX;
		var wmMaxY = this.webMercatorExtent.maxY;
		var wmMidX = (wmMaxX + wmMinX)/2.0;
		var wmMidY = (wmMaxY + wmMinY)/2.0;
			
		if (this.childMap === undefined)
		{ this.childMap = {}; }
		
		// subTile 0 (Left-Up).
		var subTile_LU = this.childMap.LU;
		if (subTile_LU === undefined)
		{
			// if no exist -> create it.
			subTile_LU = new TinTerrain(this);
			subTile_LU.X = curX*2;
			subTile_LU.Y = curY*2;
			subTile_LU.setGeographicExtent(minLon, midLat, minAlt,  midLon, maxLat, maxAlt); 
			subTile_LU.indexName = "LU";
			subTile_LU.tinTerrainManager = this.tinTerrainManager;
			this.childMap.LU = subTile_LU;
			
			subTile_LU.setWebMercatorExtent(wmMinX, wmMidY, wmMidX, wmMaxY);
		}
		
		// subTile 1 (Left-Down).
		var subTile_LD = this.childMap.LD;
		if (subTile_LD === undefined)
		{
			// if no exist -> create it.
			subTile_LD = new TinTerrain(this);
			subTile_LD.X = curX*2;
			subTile_LD.Y = curY*2+1;
			subTile_LD.setGeographicExtent(minLon, minLat, minAlt,  midLon, midLat, maxAlt); 
			subTile_LD.indexName = "LD";
			subTile_LD.tinTerrainManager = this.tinTerrainManager;
			this.childMap.LD = subTile_LD;
			
			subTile_LD.setWebMercatorExtent(wmMinX, wmMinY, wmMidX, wmMidY);
		}
		
		// subTile 2 (Right-Up).
		var subTile_RU = this.childMap.RU;
		if (subTile_RU === undefined)
		{
			subTile_RU = new TinTerrain(this);
			subTile_RU.X = curX*2+1;
			subTile_RU.Y = curY*2;
			subTile_RU.setGeographicExtent(midLon, midLat, minAlt,  maxLon, maxLat, maxAlt); 
			subTile_RU.indexName = "RU";
			subTile_RU.tinTerrainManager = this.tinTerrainManager;
			this.childMap.RU = subTile_RU;
			
			subTile_RU.setWebMercatorExtent(wmMidX, wmMidY, wmMaxX, wmMaxY);
		}
		
		// subTile 3 (Right-Down).
		var subTile_RD = this.childMap.RD;
		if (subTile_RD === undefined)
		{
			subTile_RD = new TinTerrain(this);
			subTile_RD.X = curX*2+1;
			subTile_RD.Y = curY*2+1;
			subTile_RD.setGeographicExtent(midLon, minLat, minAlt,  maxLon, midLat, maxAlt);
			subTile_RD.indexName = "RD";
			subTile_RD.tinTerrainManager = this.tinTerrainManager;
			this.childMap.RD = subTile_RD;
			
			subTile_RD.setWebMercatorExtent(wmMidX, wmMinY, wmMaxX, wmMidY);
		}

		// If this is no prepared then stop process.
		
		if (!this.isPrepared())
		{
			this.visible = true;
			if (visibleTilesArrayMap[this.depth] === undefined)
			{ visibleTilesArrayMap[this.depth] = []; }
			this.putObjectToArraySortedByDist(visibleTilesArrayMap[this.depth], this);

			var childrenDepth = this.depth+1;
			if (visibleTilesArrayMap[childrenDepth] === undefined)
			{ visibleTilesArrayMap[childrenDepth] = []; }
			this.putObjectToArraySortedByDist(visibleTilesArrayMap[childrenDepth], this.childMap.LU);
			this.putObjectToArraySortedByDist(visibleTilesArrayMap[childrenDepth], this.childMap.LD);
			this.putObjectToArraySortedByDist(visibleTilesArrayMap[childrenDepth], this.childMap.RU);
			this.putObjectToArraySortedByDist(visibleTilesArrayMap[childrenDepth], this.childMap.RD);

			return;
		}
		

		// now, do frustumCulling for each childTiles.
		subTile_LU.getFrustumIntersectedTinTerrainsQuadTree(frustum, maxDepth, camPos, magoManager, visibleTilesArrayMap, noVisibleTilesArray);
		subTile_LD.getFrustumIntersectedTinTerrainsQuadTree(frustum, maxDepth, camPos, magoManager, visibleTilesArrayMap, noVisibleTilesArray);
		subTile_RU.getFrustumIntersectedTinTerrainsQuadTree(frustum, maxDepth, camPos, magoManager, visibleTilesArrayMap, noVisibleTilesArray);
		subTile_RD.getFrustumIntersectedTinTerrainsQuadTree(frustum, maxDepth, camPos, magoManager, visibleTilesArrayMap, noVisibleTilesArray);
	}
	else 
	{
		// finish the process.
		this.visible = true;
		if (visibleTilesArrayMap[this.depth] === undefined)
		{ visibleTilesArrayMap[this.depth] = []; }

		this.putObjectToArraySortedByDist( visibleTilesArrayMap[this.depth], this);
		return;
	}
	
};

TinTerrain.prototype.calculateCenterPosition = function()
{
	// Note: The centerPosition is Float64Array type.
	// The centerPosition of tiles are calculate with "altitude" = 0;.
	// Note: if the earth is made in only 1 tile, then this calculations is bad.
	if (this.depth === 0)
	{
		this.centerX = new Float64Array([0]);
		this.centerY = new Float64Array([0]);
		this.centerZ = new Float64Array([0]);
	}
	else
	{
		var altitude = 0.0;
		var resultGeographicCoord;
		resultGeographicCoord = this.geographicExtent.getMidPoint(resultGeographicCoord);
		
		var centerLon = resultGeographicCoord.longitude;
		var centerLat = resultGeographicCoord.latitude;
		
		var resultCartesian;
		resultCartesian = Globe.geographicToCartesianWgs84(centerLon, centerLat, altitude, resultCartesian);
		
		// Float64Array.
		this.centerX = new Float64Array([resultCartesian[0]]);
		this.centerY = new Float64Array([resultCartesian[1]]);
		this.centerZ = new Float64Array([resultCartesian[2]]);
		
		
	}
	
};

TinTerrain.prototype.getMidLatitudeRadWebMercator = function()
{
	if (this.webMercatorExtent === undefined)
	{ return undefined; }
	
	var midMercatorY = (this.webMercatorExtent.maxY + this.webMercatorExtent.minY)/2.0;
	var latRad = 2*Math.atan(Math.pow(Math.E, midMercatorY)) - Math.PI/2;

	return latRad;
};

TinTerrain.prototype.makeAltitudesSliceByTexture = function(lonSegments, latSegments, resultAltArray, texture, magoManager)
{
	var gl = magoManager.getGl();
	
	// Bind texture and read pixel on it.
	// make a framebuffer
	var fb = gl.createFramebuffer();

	// make this the current frame buffer
	gl.bindFramebuffer(gl.FRAMEBUFFER, fb);

	// attach the texture to the framebuffer.
	gl.framebufferTexture2D(
		gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0,
		gl.TEXTURE_2D, texture.texId, 0);

	// check if you can read from this type of texture.
	var canRead = (gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE);

	if (canRead)
	{
		var texWidth = texture.imageWidth;
		var texHeight = texture.imageHeight;

		var pixels = new Uint8Array(4); 
		var vertexCount = (lonSegments + 1)*(latSegments + 1);
		var altArray = new Float32Array(vertexCount);
		this.minHeight[0] = -200.0; 
		this.maxHeight[0] = 1943.15; 
		var minHeight = this.minHeight[0]; 
		var maxHeight = this.maxHeight[0]; 
		if (minHeight === undefined)
		{ minHeight = 0; }
		
		if (maxHeight === undefined)
		{ maxHeight = 0; }
		
		var heightRange = maxHeight - minHeight;
	
		var idx = 0;
		for (var currLatSeg = 0; currLatSeg<latSegments+1; currLatSeg++)
		{
			var pixelY = Math.floor((1.0 - (currLatSeg/(latSegments+1))) * texHeight);
			if (pixelY < 0){ pixelY = 0; }
			if (pixelY > 255){ pixelY = 255; }
			
			for (var currLonSeg = 0; currLonSeg<lonSegments+1; currLonSeg++)
			{
				var pixelX = Math.floor((currLonSeg/(lonSegments+1)) * texWidth);
				if (pixelX < 0){ pixelX = 0; }

				gl.readPixels(pixelX, pixelY, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
				
				var altitude = minHeight + pixels[0]/256 * heightRange;
				altArray[idx] = altitude;
				idx += 1;
			}
			
		}
	}
	// Unbind the framebuffer
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	
	return altArray;
};

TinTerrain.prototype.makeMeshVirtually = function(lonSegments, latSegments, altitude, options)
{
	// WEB_MERCATOR.
	// This function makes an ellipsoidal mesh for tiles that has no elevation data.
	// note: "altitude" & "altitudesSlice" are optionals.
	var altitudesSlice;
	if (options)
	{
		if (options.altitudesSlice)
		{ altitudesSlice = options.altitudesSlice; }
	}
	
	var degToRadFactor = Math.PI/180.0;
	var minLon = this.geographicExtent.minGeographicCoord.longitude * degToRadFactor;
	var minLat = this.geographicExtent.minGeographicCoord.latitude * degToRadFactor;
	var maxLon = this.geographicExtent.maxGeographicCoord.longitude * degToRadFactor;
	var maxLat = this.geographicExtent.maxGeographicCoord.latitude * degToRadFactor;
	
	if (this.minHeight === undefined)
	{ this.minHeight = new Float32Array([0]); } 

	if (this.maxHeight === undefined)
	{ this.maxHeight = new Float32Array([0]); } 
	
	var lonRange = maxLon - minLon;
	var latRange = maxLat - minLat;
	var depth = this.depth;
	
	var lonIncreDeg = lonRange/lonSegments;
	var latIncreDeg = latRange/latSegments;
	
	// calculate total verticesCount.
	var vertexCount = (lonSegments + 1)*(latSegments + 1);
	var lonArray = new Float32Array(vertexCount);
	var latArray = new Float32Array(vertexCount);
	var altArray = new Float32Array(vertexCount);
	this.texCoordsArray = new Float32Array(vertexCount*2);
	
	var currLon = minLon; // init startLon.
	var currLat = minLat; // init startLat.
	var idx = 0;
	var s, t;

	var PI = Math.PI;
	var aConst = (1.0/(2.0*PI))*Math.pow(2.0, depth);
	
	// check if exist altitude.
	var alt = 0;
	if (altitude)
	{ alt = altitude; }
	
	// https://en.wikipedia.org/wiki/Web_Mercator_projection
	var PI_DIV_4 = PI/4;
	var minT = Math.round(aConst*(PI-Math.log(Math.tan(PI_DIV_4+minLat/2))));
	var maxT = Math.round(aConst*(PI-Math.log(Math.tan(PI_DIV_4+maxLat/2))));
	var minS = Math.round(aConst*(minLon+PI));
	var maxS = Math.round(aConst*(maxLon+PI));
	var floorMinS = Math.floor(minS);
	
	// Flip texCoordY for minT & maxT.***
	minT = 1.0 - minT;
	maxT = 1.0 - maxT;

	var texCorrectionFactor = this.tinTerrainManager.getTexCorrection(depth);
	
	for (var currLatSeg = 0; currLatSeg<latSegments+1; currLatSeg++)
	{
		currLat = minLat + latIncreDeg * currLatSeg;
		if (currLat > maxLat)
		{ currLat = maxLat; }
	
		t = aConst*(PI-Math.log(Math.tan(PI_DIV_4+currLat/2)));
		t = 1.0 - t;
			
		// Substract minT to "t" to make range [0 to 1].***
		t -= minT; 

		if (s<0.0)
		{ s = 0.0; }
		else if (s>1.0)
		{ s = 1.0; }

		if (t<0.0)
		{ t = 0.0; }
		else if (t>1.0)
		{ t = 1.0; }
		
		// Texture correction in borders.***
		/*
		if (currLatSeg === 0)
		{
			t = (texCorrectionFactor);
		}
		else if (currLatSeg === latSegments)
		{
			t = (1-texCorrectionFactor);
		}
		*/
		
		for (var currLonSeg = 0; currLonSeg<lonSegments+1; currLonSeg++)
		{
			currLon = minLon + lonIncreDeg * currLonSeg;
			
			if (currLon > maxLon)
			{ currLon = maxLon; }
			
			lonArray[idx] = currLon;
			latArray[idx] = currLat;
			// Now set the altitude.
			if (altitudesSlice)
			{
				//altArray[idx] = altitudesSlice.getValue(currLonSeg, currLatSeg);
				altArray[idx] = altitudesSlice[idx];
			}
			else
			{ altArray[idx] = alt; }

			s = aConst*(currLon+PI);
			s -= floorMinS;
			
			// Texture correction in borders.***
			if (currLonSeg === 0)
			{
				s += texCorrectionFactor/2;
			}
			else if (currLonSeg === lonSegments)
			{
				s += -texCorrectionFactor/2;
			}
			
			this.texCoordsArray[idx*2] = s;
			this.texCoordsArray[idx*2+1] = t;
			
			// actualize current values.
			idx++;
		}
	}
	
	this.cartesiansArray = Globe.geographicRadianArrayToFloat32ArrayWgs84(lonArray, latArray, altArray, undefined);
	
	
	// Make normals using the cartesians.***
	
	
	this.normalsArray = new Int8Array(vertexCount*3);
	var point = new Point3D();
	for (var i=0; i<vertexCount; i++)
	{
		point.set(this.cartesiansArray[i*3], this.cartesiansArray[i*3+1], this.cartesiansArray[i*3+2]);
		point.unitary();
		
		this.normalsArray[i*3] = point.x*126;
		this.normalsArray[i*3+1] = point.y*126;
		this.normalsArray[i*3+2] = point.z*126;
	}
	
	
	// finally make indicesArray.
	var numCols = lonSegments + 1;
	var numRows = latSegments + 1;
	var options = {
		bCalculateBorderIndices: true
	};
	
	
	var resultObject = GeometryUtils.getIndicesTrianglesRegularNet(numCols, numRows, undefined, undefined, undefined, undefined, undefined, options);
	this.indices = resultObject.indicesArray;
	this.southIndices = resultObject.southIndicesArray;
	this.eastIndices = resultObject.eastIndicesArray;
	this.northIndices = resultObject.northIndicesArray;
	this.westIndices = resultObject.westIndicesArray;
	
	this.westVertexCount = this.westIndices.length;
	this.southVertexCount = this.southIndices.length;
	this.eastVertexCount = this.eastIndices.length;
	this.northVertexCount = this.northIndices.length;
	
	//this.normalsArray = TinTerrain.getNormalCartesiansArray(this.cartesiansArray, this.indices, undefined, undefined);
	
	// make skirtMesh data.
	var options = {
		skirtDepth          : 10000,
		texCorrectionFactor : texCorrectionFactor
	};

	var skirtResultObject = TinTerrain.getSkirtTrianglesStrip(lonArray, latArray, altArray, this.texCoordsArray, this.southIndices, this.eastIndices, this.northIndices, this.westIndices, options);
	this.skirtCartesiansArray = skirtResultObject.skirtCartesiansArray;
	this.skirtTexCoordsArray = skirtResultObject.skirtTexCoordsArray;
	
	this.calculateCenterPosition();
};

TinTerrain.prototype.makeSeaMeshVirtually = function(options)
{
	// Use the existent latitudesArray & longitudesArray & texCoordsArray of this tile.
	var vertexCount = this.lonArray.length;
	var altArray = new Float32Array(vertexCount);
	this.cartesiansArraySea = Globe.geographicRadianArrayToFloat32ArrayWgs84(this.lonArray, this.latArray, altArray, undefined);
	
	// Make normals using the cartesians.***
	this.normalsArraySea = new Int8Array(vertexCount*3);
	var point = new Point3D();
	for (var i=0; i<vertexCount; i++)
	{
		point.set(this.cartesiansArraySea[i*3], this.cartesiansArraySea[i*3+1], this.cartesiansArraySea[i*3+2]);
		point.unitary();
		
		this.normalsArraySea[i*3] = point.x*126;
		this.normalsArraySea[i*3+1] = point.y*126;
		this.normalsArraySea[i*3+2] = point.z*126;
	}

	var texCorrectionFactor = this.tinTerrainManager.getTexCorrection(this.depth);
	// make skirtMesh data.
	var options = {
		skirtDepth          : 10000,
		texCorrectionFactor : texCorrectionFactor
	};
	
	var skirtResultObject = TinTerrain.getSkirtTrianglesStrip(this.lonArray, this.latArray, altArray, this.texCoordsArray, this.southIndices, this.eastIndices, this.northIndices, this.westIndices, options);
	this.skirtCartesiansArraySea = skirtResultObject.skirtCartesiansArray;
	this.skirtTexCoordsArraySea = skirtResultObject.skirtTexCoordsArray;
};

TinTerrain.prototype.makeMeshVirtuallyCRS84 = function(lonSegments, latSegments, altitude, altitudesSlice)
{
	// This function makes an ellipsoidal mesh for tiles that has no elevation data.
	// note: "altitude" & "altitudesSlice" are optionals.
	var degToRadFactor = Math.PI/180.0;
	var minLon = this.geographicExtent.minGeographicCoord.longitude * degToRadFactor;
	var minLat = this.geographicExtent.minGeographicCoord.latitude * degToRadFactor;
	var maxLon = this.geographicExtent.maxGeographicCoord.longitude * degToRadFactor;
	var maxLat = this.geographicExtent.maxGeographicCoord.latitude * degToRadFactor;
	var lonRange = maxLon - minLon;
	var latRange = maxLat - minLat;
	var depth = this.depth;
	
	var lonIncreDeg = lonRange/lonSegments;
	var latIncreDeg = latRange/latSegments;
	
	// calculate total verticesCount.
	var vertexCount = (lonSegments + 1)*(latSegments + 1);
	var lonArray = new Float32Array(vertexCount);
	var latArray = new Float32Array(vertexCount);
	var altArray = new Float32Array(vertexCount);
	this.texCoordsArray = new Float32Array(vertexCount*2);
	
	var currLon = minLon; // init startLon.
	var currLat = minLat; // init startLat.
	var idx = 0;
	var s, t;

	
	// check if exist altitude.
	var alt = 0;
	if (altitude)
	{ alt = altitude; }
	
	for (var currLatSeg = 0; currLatSeg<latSegments+1; currLatSeg++)
	{
		currLat = minLat + latIncreDeg * currLatSeg;
		if (currLat > maxLat)
		{ currLat = maxLat; }
		
		
		for (var currLonSeg = 0; currLonSeg<lonSegments+1; currLonSeg++)
		{
			currLon = minLon + lonIncreDeg * currLonSeg;
			
			if (currLon > maxLon)
			{ currLon = maxLon; }
			
			lonArray[idx] = currLon;
			latArray[idx] = currLat;
			// Now set the altitude.
			if (altitudesSlice)
			{
				altArray[idx] = altitudesSlice.getValue(currLonSeg, currLatSeg);
			}
			else
			{ altArray[idx] = alt; }


			// make texcoords CRS84.***
			s = (currLon - minLon)/lonRange;
			t = (currLat - minLat)/latRange;
			
			this.texCoordsArray[idx*2] = s;
			this.texCoordsArray[idx*2+1] = t;
			
			// actualize current values.
			idx++;
		}
	}
	
	this.cartesiansArray = Globe.geographicRadianArrayToFloat32ArrayWgs84(lonArray, latArray, altArray, this.cartesiansArray);
	
	// Make normals using the cartesians.***
	this.normalsArray = new Int8Array(vertexCount*3);
	var point = new Point3D();
	for (var i=0; i<vertexCount; i++)
	{
		point.set(this.cartesiansArray[i*3], this.cartesiansArray[i*3+1], this.cartesiansArray[i*3+2]);
		point.unitary();
		
		this.normalsArray[i*3] = point.x*126;
		this.normalsArray[i*3+1] = point.y*126;
		this.normalsArray[i*3+2] = point.z*126;
	}
	
	// finally make indicesArray.
	var numCols = lonSegments + 1;
	var numRows = latSegments + 1;
	var options = {
		bCalculateBorderIndices: true
	};
	var resultObject = GeometryUtils.getIndicesTrianglesRegularNet(numCols, numRows, undefined, undefined, undefined, undefined, undefined, options);
	this.indices = resultObject.indicesArray;
	this.southIndices = resultObject.southIndicesArray;
	this.eastIndices = resultObject.eastIndicesArray;
	this.northIndices = resultObject.northIndicesArray;
	this.westIndices = resultObject.westIndicesArray;
	
	this.westVertexCount = this.westIndices.length;
	this.southVertexCount = this.southIndices.length;
	this.eastVertexCount = this.eastIndices.length;
	this.northVertexCount = this.northIndices.length;
	
	this.calculateCenterPosition();
};

TinTerrain.prototype.zigZagDecode = function(value)
{
	return (value >> 1) ^ (-(value & 1));
};

TinTerrain.prototype.makeVbo = function(vboMemManager)
{
	if (this.cartesiansArray === undefined)
	{ return; }

	// rest the CenterPosition to the this.cartesiansArray.
	var coordsCount = this.cartesiansArray.length/3;
	for (var i=0; i<coordsCount; i++)
	{
		this.cartesiansArray[i*3] -= this.centerX[0];
		this.cartesiansArray[i*3+1] -= this.centerY[0];
		this.cartesiansArray[i*3+2] -= this.centerZ[0];
	}
	
	if (this.terrainPositionHIGH === undefined)
	{ this.terrainPositionHIGH = new Float32Array(3); }

	if (this.terrainPositionLOW === undefined)
	{ this.terrainPositionLOW = new Float32Array(3); }
	ManagerUtils.calculateSplited3fv([this.centerX[0], this.centerY[0], this.centerZ[0]], this.terrainPositionHIGH, this.terrainPositionLOW);
	
	if (this.vboKeyContainer === undefined)
	{ this.vboKeyContainer = new VBOVertexIdxCacheKeysContainer(); }
	
	var vboKey = this.vboKeyContainer.newVBOVertexIdxCacheKey();
	
	// Positions.
	vboKey.setDataArrayPos(this.cartesiansArray, vboMemManager);

	
	// Normals.
	if (this.normalsArray)
	{
		vboKey.setDataArrayNor(this.normalsArray, vboMemManager);
	}
	
	// TexCoords.
	if (this.texCoordsArray)
	{
		vboKey.setDataArrayTexCoord(this.texCoordsArray, vboMemManager);
	}
		
	// Indices.
	vboKey.setDataArrayIdx(this.indices, vboMemManager);
	
	// Aditional data.
	// Altitudes.
	/*
	if (this.altArray !== undefined)
	{
		var dimensions = 1;
		var name = "altitudes";
		var attribLoc = 3;
		vboKey.setDataArrayCustom(this.altArray, vboMemManager, dimensions, name, attribLoc);
	}
	*/

	// Make skirt.
	if (this.skirtCartesiansArray === undefined)
	{ return; }

	var skirtCartasiansCount = this.skirtCartesiansArray.length;
	for (var i=0; i<skirtCartasiansCount; i++)
	{
		this.skirtCartesiansArray[i*3] -= this.centerX[0];
		this.skirtCartesiansArray[i*3+1] -= this.centerY[0];
		this.skirtCartesiansArray[i*3+2] -= this.centerZ[0];
	}

	
	var vboKeySkirt = this.vboKeyContainer.newVBOVertexIdxCacheKey();

	// Positions.
	vboKeySkirt.setDataArrayPos(this.skirtCartesiansArray, vboMemManager);
	
	// TexCoords.
	if (this.skirtTexCoordsArray)
	{
		vboKeySkirt.setDataArrayTexCoord(this.skirtTexCoordsArray, vboMemManager);
	}
	
	// Altitudes for skirtData.
	/*
	if (this.skirtAltitudesValuesArray)
	{
		var dimensions = 1;
		var name = "altitudes";
		var attribLoc = 3;
		vboKeySkirt.setDataArrayCustom(this.skirtAltitudesValuesArray, vboMemManager, dimensions, name, attribLoc);
	}
	*/
	
	// Check if exist sea.
	if (this.seaCartesiansArray !== undefined)
	{
		// Make sea.
		var vboKeySea = this.vboKeyContainer.newVBOVertexIdxCacheKey();

		// Positions.
		vboKeySea.setDataArrayPos(this.seaCartesiansArray, vboMemManager);
	}
};

TinTerrain.prototype.makeVboSea = function(vboMemManager)
{
	if (this.cartesiansArraySea === undefined)
	{ return; }

	// rest the CenterPosition to the this.cartesiansArraySea.
	var coordsCount = this.cartesiansArraySea.length/3;
	for (var i=0; i<coordsCount; i++)
	{
		this.cartesiansArraySea[i*3] -= this.centerX[0];
		this.cartesiansArraySea[i*3+1] -= this.centerY[0];
		this.cartesiansArraySea[i*3+2] -= this.centerZ[0];
	}
	
	if (this.vboKeyContainer === undefined)
	{ this.vboKeyContainer = new VBOVertexIdxCacheKeysContainer(); }
	
	var vboKey = this.vboKeyContainer.newVBOVertexIdxCacheKey();
	
	// Positions.
	vboKey.setDataArrayPos(this.cartesiansArraySea, vboMemManager);

	
	// Normals.
	if (this.normalsArraySea)
	{
		vboKey.setDataArrayNor(this.normalsArraySea, vboMemManager);
	}
	
	// TexCoords.
	if (this.texCoordsArraySea)
	{
		vboKey.setDataArrayTexCoord(this.texCoordsArraySea, vboMemManager);
	}
		
	// Indices.
	vboKey.setDataArrayIdx(this.indicesSea, vboMemManager);
	
	

	// Make skirt.
	if (this.skirtCartesiansArraySea === undefined)
	{ return; }

	var skirtCartasiansCount = this.skirtCartesiansArraySea.length;
	for (var i=0; i<skirtCartasiansCount; i++)
	{
		this.skirtCartesiansArraySea[i*3] -= this.centerX[0];
		this.skirtCartesiansArraySea[i*3+1] -= this.centerY[0];
		this.skirtCartesiansArraySea[i*3+2] -= this.centerZ[0];
	}

	
	var vboKeySkirt = this.vboKeyContainer.newVBOVertexIdxCacheKey();

	// Positions.
	vboKeySkirt.setDataArrayPos(this.skirtCartesiansArraySea, vboMemManager);
	
	// TexCoords.
	if (this.skirtTexCoordsArraySea)
	{
		vboKeySkirt.setDataArrayTexCoord(this.skirtTexCoordsArraySea, vboMemManager);
	}

	
};

TinTerrain.getSkirtTrianglesStrip = function(lonArray, latArray, altArray, texCoordsArray, southIndices, eastIndices, northIndices, westIndices, options)
{
	// Given "lonArray", "latArray" & "altArray", this function makes skirtCartesiansArray & skirtTexCoordsArray.***
	// Note: skirtMesh is trianglesStrip, so, there are no indices.***
	var skirtDepth = 1000.0;
	var texCorrectionFactor = 1.0;
	var bMakeAltitudesArray = false;
	if (options)
	{
		if (options.skirtDepth !== undefined)
		{ skirtDepth = options.skirtDepth; }
	
		if (options.texCorrectionFactor !== undefined)
		{ texCorrectionFactor = options.texCorrectionFactor; }
	
		if (options.bMakeAltitudesArray)
		{ bMakeAltitudesArray = true; }
	}
	
	// Texture correction in borders & make skirt data.***
	var westVertexCount = westIndices.length;
	var southVertexCount = southIndices.length;
	var eastVertexCount = eastIndices.length;
	var northVertexCount = northIndices.length;
	
	var totalVertexCount = westVertexCount + southVertexCount + eastVertexCount + northVertexCount;
	
	var skirtLonArray = new Float32Array(totalVertexCount * 2);
	var skirtLatArray = new Float32Array(totalVertexCount * 2);
	var skirtAltArray = new Float32Array(totalVertexCount * 2);
	var skirtTexCoordsArray = new Float32Array(totalVertexCount * 4);
	var skinAltitudes = new Float32Array(totalVertexCount * 4);
	var counter = 0;
	
	for (var j=0; j<westVertexCount; j++)
	{
		var idx = westIndices[j];
		
		texCoordsArray[idx*2] += texCorrectionFactor;
		//var texCoord_x = texCoordsArray[idx*2];
		//var texCoord_y = texCoordsArray[idx*2+1];
		
		
		skirtLonArray[counter] = lonArray[idx];
		skirtLatArray[counter] = latArray[idx];
		skirtAltArray[counter] = altArray[idx];
		
		skirtTexCoordsArray[counter*2] = texCoordsArray[idx*2];   // s.
		skirtTexCoordsArray[counter*2+1] = texCoordsArray[idx*2+1]; // t.
		if (bMakeAltitudesArray){ skinAltitudes[counter] = altArray[idx]; }
		counter += 1;
		
		skirtLonArray[counter] = lonArray[idx];
		skirtLatArray[counter] = latArray[idx];
		skirtAltArray[counter] = altArray[idx]-skirtDepth;
		
		skirtTexCoordsArray[counter*2] = texCoordsArray[idx*2];   // s.
		skirtTexCoordsArray[counter*2+1] = texCoordsArray[idx*2+1]; // t.
		if (bMakeAltitudesArray){ skinAltitudes[counter] = altArray[idx]; }
		counter += 1;

	}
	
	for (var j=0; j<southVertexCount; j++)
	{
		var idx = southIndices[j];
		
		texCoordsArray[idx*2+1] = (texCorrectionFactor);
		//var texCoord_x = texCoordsArray[idx*2];
		//var texCoord_y = texCoordsArray[idx*2+1]
		
		skirtLonArray[counter] = lonArray[idx];
		skirtLatArray[counter] = latArray[idx];
		skirtAltArray[counter] = altArray[idx];
		
		skirtTexCoordsArray[counter*2] = texCoordsArray[idx*2];   // s.
		skirtTexCoordsArray[counter*2+1] = texCoordsArray[idx*2+1]; // t.
		if (bMakeAltitudesArray){ skinAltitudes[counter] = altArray[idx]; }
		counter += 1;
		
		skirtLonArray[counter] = lonArray[idx];
		skirtLatArray[counter] = latArray[idx];
		skirtAltArray[counter] = altArray[idx]-skirtDepth;
		
		skirtTexCoordsArray[counter*2] = texCoordsArray[idx*2];   // s.
		skirtTexCoordsArray[counter*2+1] = texCoordsArray[idx*2+1]; // t.
		if (bMakeAltitudesArray){ skinAltitudes[counter] = altArray[idx]; }
		counter += 1;
	}
	
	for (var j=0; j<eastVertexCount; j++)
	{
		var idx = eastIndices[j];
		
		texCoordsArray[idx*2] -= texCorrectionFactor;
		//var texCoord_x = texCoordsArray[idx*2];
		//var texCoord_y = texCoordsArray[idx*2+1];
		
		skirtLonArray[counter] = lonArray[idx];
		skirtLatArray[counter] = latArray[idx];
		skirtAltArray[counter] = altArray[idx];
		
		skirtTexCoordsArray[counter*2] = texCoordsArray[idx*2];   // s.
		skirtTexCoordsArray[counter*2+1] = texCoordsArray[idx*2+1]; // t.
		if (bMakeAltitudesArray){ skinAltitudes[counter] = altArray[idx]; }
		counter += 1;
		
		skirtLonArray[counter] = lonArray[idx];
		skirtLatArray[counter] = latArray[idx];
		skirtAltArray[counter] = altArray[idx]-skirtDepth;
		
		skirtTexCoordsArray[counter*2] = texCoordsArray[idx*2];   // s.
		skirtTexCoordsArray[counter*2+1] = texCoordsArray[idx*2+1]; // t.
		if (bMakeAltitudesArray){ skinAltitudes[counter] = altArray[idx]; }
		counter += 1;
	}
	
	for (var j=0; j<northVertexCount; j++)
	{
		var idx = northIndices[j];
		
		
		texCoordsArray[idx*2+1] = (1-texCorrectionFactor);
		//var texCoord_x = texCoordsArray[idx*2];
		//var texCoord_y = texCoordsArray[idx*2+1];
		
		skirtLonArray[counter] = lonArray[idx];
		skirtLatArray[counter] = latArray[idx];
		skirtAltArray[counter] = altArray[idx];
		
		skirtTexCoordsArray[counter*2] = texCoordsArray[idx*2];   // s.
		skirtTexCoordsArray[counter*2+1] = texCoordsArray[idx*2+1]; // t.
		if (bMakeAltitudesArray){ skinAltitudes[counter] = altArray[idx]; }
		counter += 1;
		
		skirtLonArray[counter] = lonArray[idx];
		skirtLatArray[counter] = latArray[idx];
		skirtAltArray[counter] = altArray[idx]-skirtDepth;
		
		skirtTexCoordsArray[counter*2] = texCoordsArray[idx*2];   // s.
		skirtTexCoordsArray[counter*2+1] = texCoordsArray[idx*2+1]; // t.
		if (bMakeAltitudesArray){ skinAltitudes[counter] = altArray[idx]; }
		counter += 1;
	}
	
	var skirtCartesiansArray = Globe.geographicRadianArrayToFloat32ArrayWgs84(skirtLonArray, skirtLatArray, skirtAltArray, undefined);
	
	var resultObject = {
		skirtCartesiansArray : skirtCartesiansArray,
		skirtTexCoordsArray  : skirtTexCoordsArray,
		skirtAltitudesArray  : skirtAltArray
	};
	
	if (bMakeAltitudesArray)
	{
		resultObject.skirtAltitudesValuesArray = skinAltitudes;
	}
	
	return resultObject;
};

TinTerrain.getNormalCartesiansArray = function(cartesiansArray, indicesArray, resultNormalCartesiansArray, options)
{
	var idx_1, idx_2, idx_3;
	var point_1, point_2, point_3;
	var normal;
	var normalsArray = [];
	var trianglesCount = indicesArray.length/3;
	for (var i=0; i<trianglesCount; i++)
	{
		idx_1 = indicesArray[i*3];
		idx_2 = indicesArray[i*3+1];
		idx_3 = indicesArray[i*3+2];
		
		point_1 = new Point3D(cartesiansArray[idx_1*3], cartesiansArray[idx_1*3+1], cartesiansArray[idx_1*3+2]);
		point_2 = new Point3D(cartesiansArray[idx_2*3], cartesiansArray[idx_2*3+1], cartesiansArray[idx_2*3+2]);
		point_3 = new Point3D(cartesiansArray[idx_3*3], cartesiansArray[idx_3*3+1], cartesiansArray[idx_3*3+2]);
		
		// Calculate the normal for this triangle.
		normal = Triangle.calculateNormal(point_1, point_3, point_2, undefined);
		
		// Accum normals for each points.
		// Point 1.***
		if (normalsArray[idx_1] !== undefined)
		{
			normalsArray[idx_1].addPoint(normal);
		}
		else
		{
			normalsArray[idx_1] = normal;
		}
		
		// Point 2.***
		if (normalsArray[idx_2] !== undefined)
		{
			normalsArray[idx_2].addPoint(normal);
		}
		else
		{
			normalsArray[idx_2] = normal;
		}
		
		// Point 3.***
		if (normalsArray[idx_3] !== undefined)
		{
			normalsArray[idx_3].addPoint(normal);
		}
		else
		{
			normalsArray[idx_3] = normal;
		}
	}
	
	// finally, normalize all normals.
	var normalsCount = normalsArray.length;
	if (resultNormalCartesiansArray === undefined)
	{ resultNormalCartesiansArray = new Int8Array(normalsCount*3); }
	
	for (var i=0; i<normalsCount; i++)
	{
		var normal = normalsArray[i];
		normal.unitary();
		
		resultNormalCartesiansArray[i*3] = Math.floor(normal.x*255);
		resultNormalCartesiansArray[i*3+1] = Math.floor(normal.y*255);
		resultNormalCartesiansArray[i*3+2] = Math.floor(normal.z*255);
	}
	
	return resultNormalCartesiansArray;
	
};

TinTerrain.prototype.getAltitudes_byAltitudesMap = function(geoCoordsArray, resultGeoCoordsArray, magoManager)
{
	// To call this function, must exist DEM image in this tile.
	
};

TinTerrain.prototype.getAltitudes_byAltitudesOwnMap = function(geoCoordsArray, resultGeoCoordsArray, magoManager)
{
	// No used yet.
	if (this.altitudesFbo === undefined) 
	{ 
		this.makeAltitudesOwnMap(magoManager);
	}
	
	// Bind this.altitudesFbo and read pixels, then decode the altitude.
	// Convert longitude & latitude to normalized coordinates.
	var minLon = this.geographicExtent.minGeographicCoord.longitude;
	var minLat = this.geographicExtent.minGeographicCoord.latitude;
	var maxLon = this.geographicExtent.maxGeographicCoord.longitude;
	var maxLat = this.geographicExtent.maxGeographicCoord.latitude;
	var lonRange = maxLon - minLon;
	var latRange = maxLat - minLat;
	
	var minHeight = this.minHeight[0];
	var maxHeight = this.maxHeight[0];
	var heightRange = maxHeight - minHeight;
	
	var uValue; // normalized longitude.
	var vValue; // normalized latitude.
	var pixels = new Uint8Array(4); // 4 RGBA.***
	
	var imageWidth = this.altitudesFbo.width;
	var imageHeight = this.altitudesFbo.height;
	
	if (resultGeoCoordsArray === undefined)
	{ resultGeoCoordsArray = []; }

	this.altitudesFbo.bind();
		
	var geoCoordsCount = geoCoordsArray.length;
	for (var i=0; i<geoCoordsCount; i++)
	{
		var geoCoord = geoCoordsArray[i];
		
		uValue = (geoCoord.longitude - minLon)/lonRange;
		vValue = (geoCoord.latitude - minLat)/latRange;
		
		var pixelX = uValue * imageWidth;
		var pixelY = vValue * imageHeight;
		
		gl.readPixels(pixelX, pixelY, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
		
		var decodedAltitude = pixels[0]/(256.0*256.0*256.0) + pixels[1]/(256.0*256.0) + pixels[2]/256.0 + pixels[3]; // 0 to 256 range depth.
		var linearAltitude = decodedAltitude / 256.0; // LinearDepth. Convert to [0.0, 1.0] range depth.
		var realAltitude = minHeight + linearAltitude * heightRange;
		geoCoord.altitude = realAltitude;
		resultGeoCoordsArray.push(geoCoord);
	}
	
	this.altitudesFbo.unbind();
	
	return resultGeoCoordsArray;
};

TinTerrain.prototype.makeAltitudesOwnMap = function(magoManager)
{
	var gl = magoManager.getGl();
	
	if (this.altitudesFbo === undefined) 
	{ 
		var imageWidth = 256;
		var imageHeight = 256;
		this.altitudesFbo = new FBO(gl, imageWidth, imageHeight ); 
	}
	
	var uValues = this.uValues;
	var vValues = this.vValues;
	var hValues = this.hValues;
	var indices = this.indices;
	
	// Make VBO.
	var test_maxUValue;
	var test_maxVValue;
	var test_maxHValue;
	
	var test_minUValue;
	var test_minVValue;
	var test_minHValue;
	
	var shortMax = 32767;
	var vertexCount = uValues.length;
	var cartesiansArray = new Float32Array(vertexCount*3);
	for (var i=0; i<vertexCount; i++)
	{
		cartesiansArray[i*3] = uValues[i]/shortMax;
		cartesiansArray[i*3+1] = vValues[i]/shortMax;
		cartesiansArray[i*3+2] = hValues[i]/shortMax;
		
		// Test to debug.
		if (i === 0)
		{
			test_maxUValue = cartesiansArray[i*3];
			test_maxVValue = cartesiansArray[i*3+1];
			test_maxHValue = cartesiansArray[i*3+2];
			
			test_minUValue = cartesiansArray[i*3];
			test_minVValue = cartesiansArray[i*3+1];
			test_minHValue = cartesiansArray[i*3+2];
		}
		else
		{
			if (cartesiansArray[i*3] < test_minUValue)
			{ test_minUValue = cartesiansArray[i*3]; }
			else if (cartesiansArray[i*3] > test_maxUValue)
			{ test_maxUValue = cartesiansArray[i*3]; }
				
			if (cartesiansArray[i*3+1] < test_minVValue)
			{ test_minVValue = cartesiansArray[i*3+1]; }
			else if (cartesiansArray[i*3+1] > test_maxVValue)
			{ test_maxVValue = cartesiansArray[i*3+1]; }
				
			if (cartesiansArray[i*3+2] < test_minHValue)
			{ test_minHValue = cartesiansArray[i*3+2]; }
			else if (cartesiansArray[i*3+2] > test_maxHValue)
			{ test_maxHValue = cartesiansArray[i*3+2]; }
		}
	}
	
	if (this.vboKeyContainerAltitudes === undefined)
	{ this.vboKeyContainerAltitudes = new VBOVertexIdxCacheKeysContainer(); }
	
	var vboKeyAltitudes = this.vboKeyContainerAltitudes.newVBOVertexIdxCacheKey();
	var vboKey = this.vboKeyContainer.vboCacheKeysArray[0]; // the idx = 0 is the terrain. idx = 1 is the skirt.
	var vboMemManager = magoManager.vboMemoryManager;
	
	// Positions.
	vboKeyAltitudes.setDataArrayPos(cartesiansArray, vboMemManager);
	
	// Indices. 
	// For indices use the tinTerrain VBO indices.
	
	// Calculate the modelViewProjectionMatrix.
	var mvMat = new Matrix4();
	var ortho = new Matrix4();
	this.altitudesMapMVPMat = new Matrix4();
	var nRange = 1.0;
	var left = -nRange, right = nRange, bottom = -nRange, top = nRange, near = -depthFactor*nRange, far = depthFactor*nRange;
	ortho._floatArrays = glMatrix.mat4.ortho(ortho._floatArrays, left, right, bottom, top, near, far);
	
	this.altitudesMapMVPMat = mvMat.getMultipliedByMatrix(ortho, this.altitudesMapMVPMat);
	
	// Now render.
	this.altitudesFbo.bind();
	
	var shaderName = "tinTerrainAltitudes";
	var shader = magoManager.postFxShadersManager.getShader(shaderName); 

	shader.useProgram();
	shader.enableVertexAttribArray(shader.position3_loc);
	
	// Positions.
	if (!vboKeyAltitudes.bindDataPosition(shader, vboMemManager))
	{ 
		return false; 
	}
	
	// Indices.
	if (!vboKey.bindDataIndice(shader, vboMemManager))
	{ 
		return false; 
	}
	
	var indicesCount = vboKey.indicesCount;
	gl.drawElements(gl.TRIANGLES, indicesCount, gl.UNSIGNED_SHORT, 0); // Fill.
	
	this.altitudesFbo.unbind();
};

TinTerrain.prototype.decodeData = function(imageryType)
{
	if (this.geographicExtent === undefined)
	{ return; }
	
	if (this.vertexArray === undefined)
	{ this.vertexArray = []; }

	var tinTerrainManager = this.tinTerrainManager;
	if (!this.tinTerrainManager.workerDecodedTerrain) 
	{ 
		this.tinTerrainManager.workerDecodedTerrain = new Worker(MagoConfig.scriptRootPath + 'Worker/workerDecodeTerrain.js'); 
		this.tinTerrainManager.workerDecodedTerrain.onmessage = function(e)
		{
			var tileInfo = e.data.info;
			var result = e.data.decodedTerrain;
			var decodedTerrainMap = tinTerrainManager.textureDecodedTerrainMap;
			if (!decodedTerrainMap[tileInfo.z]) { decodedTerrainMap[tileInfo.z] = {}; }
			if (!decodedTerrainMap[tileInfo.z][tileInfo.x]) { decodedTerrainMap[tileInfo.z][tileInfo.x] = {}; }
			if (!decodedTerrainMap[tileInfo.z][tileInfo.x][tileInfo.y]) { decodedTerrainMap[tileInfo.z][tileInfo.x][tileInfo.y] = result; }
		};
	}
	
	var bMakeNormals = true;

	this.tinTerrainManager.workerDecodedTerrain.postMessage({
		param: {
			minGeographicLongitude : this.geographicExtent.minGeographicCoord.longitude,
			minGeographicLatitude  : this.geographicExtent.minGeographicCoord.latitude,
			maxGeographicLongitude : this.geographicExtent.maxGeographicCoord.longitude,
			maxGeographicLatitude  : this.geographicExtent.maxGeographicCoord.latitude,
			minHeight              : this.minHeight,
			maxHeight              : this.maxHeight,
			vertexCount            : this.vertexCount,
			uValues                : this.uValues,
			vValues                : this.vValues,
			hValues                : this.hValues,
			imageryType            : imageryType,
			depth                  : this.depth,
			southIndices           : this.southIndices,
			eastIndices            : this.eastIndices,
			northIndices           : this.northIndices,
			westIndices            : this.westIndices,
			bMakeNormals           : bMakeNormals,
			indices                : this.indices,
			X                      : this.X,
			Y                      : this.Y
		}, 
		info: {x: this.X, y: this.Y, z: this.depth}
	});
	this.requestDecodeData = true;
};

TinTerrain.prototype.parseData = function(dataArrayBuffer)
{
	var tinTerrainManager = this.tinTerrainManager;
	this.fileLoadState = CODE.fileLoadState.PARSE_STARTED;
	if (!this.tinTerrainManager.workerParseTerrain) 
	{ 
		this.tinTerrainManager.workerParseTerrain = new Worker(MagoConfig.scriptRootPath + 'Worker/workerParseTerrain.js'); 
		this.tinTerrainManager.workerParseTerrain.onmessage = function(e)
		{
			var tileInfo = e.data.info;
			var result = e.data.parsedTerrain;
			var parsedTerrainMap = tinTerrainManager.textureParsedTerrainMap;
			if (!parsedTerrainMap[tileInfo.z]) { parsedTerrainMap[tileInfo.z] = {}; }
			if (!parsedTerrainMap[tileInfo.z][tileInfo.x]) { parsedTerrainMap[tileInfo.z][tileInfo.x] = {}; }
			if (!parsedTerrainMap[tileInfo.z][tileInfo.x][tileInfo.y]) { parsedTerrainMap[tileInfo.z][tileInfo.x][tileInfo.y] = result; }
		};
	}
	this.tinTerrainManager.workerParseTerrain.postMessage({dataArrayBuffer: dataArrayBuffer, info: {x: this.X, y: this.Y, z: this.depth}});
};






















































