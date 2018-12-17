'use strict';

/**
 * @class TinTerrain
 */
var TinTerrain = function(owner) 
{
	if (!(this instanceof TinTerrain)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	this.owner; // undefined if depth = 0.***
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
	
	this.childArray; // child array.***
	this.childMap; // example: this.childMap["LU"] = tinTerrainChild.***
	
	// Data.***
	this.X; // index X.***
	this.Y; // index Y.***
	
	// positions(x, y, z), normals, texCoords, colors & indices array.***
	this.cartesiansArray;
	this.normalsArray;
	this.texCoordsArray;
	this.colorsArray;
	this.indices;
	
	// Tile extent.***
	this.geographicExtent;
	this.sphereExtent;
	
	// Tile geometry data.***
	this.fileLoadState = 0;
	this.dataArrayBuffer;
	this.vboKeyContainer; // class: VBOVertexIdxCacheKeysContainer.***
	this.terrainPositionHIGH;
	this.terrainPositionLOW;
	
	this.indexName; // example "LU".***
	this.pathName; // example: "14//4567//516".***
	this.texture;
	this.visible;
};

TinTerrain.prototype.deleteObjects = function(magoManager)
{
	var gl = magoManager.sceneState.gl;
	
	// delete all tree under this tinTerrain. no delete tiles if depth < 2.******
	if (this.childMap !== undefined)
	{
		// subTile 0 (Left-Up).***
		var subTile_LU = this.childMap.LU;
		if (subTile_LU !== undefined)
		{
			subTile_LU.deleteObjects(magoManager);
			delete this.childMap.LU;
		}
		
		// subTile 1 (Left-Down).***
		var subTile_LD = this.childMap.LD;
		if (subTile_LD !== undefined)
		{
			subTile_LD.deleteObjects(magoManager);
			delete this.childMap.LD;
		}
		
		// subTile 2 (Right-Up).***
		var subTile_RU = this.childMap.RU;
		if (subTile_RU !== undefined)
		{
			subTile_RU.deleteObjects(magoManager);
			delete this.childMap.RU;
		}
		
		// subTile 3 (Right-Down).***
		var subTile_RD = this.childMap.RD;
		if (subTile_RD !== undefined)
		{
			subTile_RD.deleteObjects(magoManager);
			delete this.childMap.RD;
		}
		
		this.childMap = undefined;
	}
	
	// no delete tiles if depth < 2.***
	if (this.depth < 2)
	{ return; }
		
	// now delete objects of this tinTerrain.***
	this.owner = undefined;
	this.depth = undefined; 
	this.childArray = undefined;
	this.childMap = undefined; 
	
	// Data.***
	this.X = undefined; // index X.***
	this.Y = undefined; // index Y.***
	
	// Tile extent.***
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
	
	// Tile geometry data.***
	this.fileLoadState = 0;
	this.dataArrayBuffer = undefined;
	
	if (this.vboKeyContainer !== undefined)
	{
		this.vboKeyContainer.deleteGlObjects(gl, magoManager.vboMemoryManager);
		this.vboKeyContainer = undefined; // class: VBOVertexIdxCacheKeysContainer.***
		
	}
	this.terrainPositionHIGH = undefined;
	this.terrainPositionLOW = undefined;
	
	this.indexName = undefined;
	this.pathName = undefined; // example: "14//4567//516".***
	
	if (this.texture !== undefined)
	{
		this.texture.deleteObjects(gl);
		this.texture = undefined;
	}
	this.visible = undefined;
};

TinTerrain.prototype.getPathName = function()
{
	// this returns a string as: L//X//Y.
	// example: "14//4567//516".***
	return this.depth.toString() + "\\" + this.X.toString() + "\\" + this.Y.toString();
};

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

TinTerrain.prototype.isPrepared = function()
{
	// a tinTerrain is prepared if this is parsed and vbo maked and texture binded.***
	
	// Provisional solution.**********************************
	// Provisional solution.**********************************
	// Provisional solution.**********************************
	if (this.fileLoadState === CODE.fileLoadState.LOAD_FAILED)
	{ return true; }
	// End provisional solution.------------------------------
	// End provisional solution.------------------------------
	// End provisional solution.------------------------------
	
	if (this.fileLoadState !== CODE.fileLoadState.PARSE_FINISHED)
	{ return false; }
	
	if (this.texture === undefined || this.texture.fileLoadState !== CODE.fileLoadState.LOADING_FINISHED)
	{ return false; }
	
	if (this.vboKeyContainer === undefined || 
		this.vboKeyContainer.vboCacheKeysArray === undefined || 
		this.vboKeyContainer.vboCacheKeysArray.length === 0)
	{ return false; }
	
	return true;
};

TinTerrain.prototype.prepareTinTerrain = function(magoManager, tinTerrainManager)
{
	// This function 1- loads file & 2- parses file & 3- makes vbo.***
	// 1rst, check if the parent is prepared. If parent is not prepared, then prepare the parent.***
	
	if (this.owner === undefined || this.owner.isPrepared())
	{
		// 1rst, try to erase from procesQueue_deleting if exist.***
		magoManager.processQueue.eraseTinTerrainToDelete(this);
		
		// Prepare this tinTerrain.***
		if (this.fileLoadState === CODE.fileLoadState.READY)
		{
			var pathName = this.getPathName();
			var fileName = "CesiumTerrain/" + pathName + ".terrain";
			magoManager.readerWriter.loadTINTerrain(fileName, this, magoManager);
		}
		else if (this.fileLoadState === CODE.fileLoadState.LOADING_FINISHED)
		{
			// put the terrain into parseQueue.***
			magoManager.parseQueue.putTinTerrainToParse(this, 0);
		}
		else if (this.fileLoadState === CODE.fileLoadState.PARSE_FINISHED && this.vboKeyContainer === undefined)
		{
			this.decodeData();
			this.makeVbo(magoManager.vboMemoryManager);
		}
		else if (this.texture === undefined)
		{
			var gl = magoManager.sceneState.gl;
			this.texture = new Texture();
			
			// Provisionally test.******************************************************************************************
			var imagesDataPath = "\\images\\ko";
			var textureFilePath = imagesDataPath +  "\\funny_" + this.depth + ".jpg";
			magoManager.readerWriter.readLegoSimpleBuildingTexture(gl, textureFilePath, this.texture, magoManager);
			// End test.----------------------------------------------------------------------------------------------------
					
			var geoServURL = tinTerrainManager.geoServURL;
			var L = this.depth;
			var X = this.X;
			var Y = this.Y;

			var tilePath = L.toString() + "&TileRow=" + Y.toString() + "&TileCol=" + X.toString();
			var textureFilePath = geoServURL + "?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&Layer=mago3d:SejongBGM&Format=image/png&TileMatrixSet=EPSG:4326&TileMatrix=EPSG:4326:" + tilePath;
			magoManager.readerWriter.loadWMSImage(gl, textureFilePath, this.texture, magoManager);
		}

		return;
	}
	else
	{
		// Prepare ownerTinTerrain.***
		this.owner.prepareTinTerrain(magoManager, tinTerrainManager);
		return;
	}
};

TinTerrain.prototype.hasChildren = function()
{
	if (this.childMap !== undefined && this.childMap.length > 0)
	{ return true; }
	
	return false;
};

TinTerrain.prototype.deleteTinTerrain = function(magoManager)
{
	// The quadTree must be deleted lowest-quads first.***
	// Check if this has child. If this has child, then, 1rst delete child.***
	if (this.hasChildren())
	{
		// Delete children 1rst.***
		for (var key in this.childMap)
		{
			var child = this.childMap[key];
			child.deleteTinTerrain(magoManager);
		}
		
		return false;
	}
	else
	{
		// 1rst, delete from parse-queue if exist.***
		magoManager.parseQueue.eraseTinTerrainToParse(this);
		// put this tinTerrain into deleteQueue.***
		magoManager.processQueue.putTinTerrainToDelete(this, 0);
		
		// now, must erase from myOwner-childrenMap.***
		delete this.owner.childMap[this.indexName];
		
		if (this.owner.childMap.length === 0)
		{ this.owner.childMap = undefined; }
		
		return true;
	}
};

TinTerrain.prototype.render = function(currentShader, magoManager, bDepth)
{
	if (this.owner === undefined || this.owner.isPrepared())
	{
		if (this.isPrepared())
		{
			if (this.fileLoadState === CODE.fileLoadState.LOAD_FAILED) // provisional solution.***
			{ return; }
			
			// render this tinTerrain.***
			var gl = magoManager.sceneState.gl;
			var renderWireframe = false;
			
			gl.bindTexture(gl.TEXTURE_2D, this.texture.texId);
			
			gl.uniform3fv(currentShader.buildingPosHIGH_loc, this.terrainPositionHIGH);
			gl.uniform3fv(currentShader.buildingPosLOW_loc, this.terrainPositionLOW);
			
			var vboKey = this.vboKeyContainer.vboCacheKeysArray[0];
			if (vboKey.isReadyPositions(gl, magoManager.vboMemoryManager) && 
				vboKey.isReadyTexCoords(gl, magoManager.vboMemoryManager) && 
				vboKey.isReadyFaces(gl, magoManager.vboMemoryManager))
			{ 
				// Positions.***
				gl.bindBuffer(gl.ARRAY_BUFFER, vboKey.meshVertexCacheKey);
				gl.vertexAttribPointer(currentShader.position3_loc, 3, gl.FLOAT, false, 0, 0);
				
				// TexCoords.***
				if (!bDepth)
				{
					gl.bindBuffer(gl.ARRAY_BUFFER, vboKey.meshTexcoordsCacheKey);
					gl.vertexAttribPointer(currentShader.texCoord2_loc, 2, gl.FLOAT, false, 0, 0);
				}
				
				var indicesCount = vboKey.indicesCount;

				gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, vboKey.meshFacesCacheKey);
				
				if (renderWireframe)
				{
					var trianglesCount = indicesCount;
					for (var i=0; i<trianglesCount; i++)
					{
						gl.drawElements(gl.LINE_LOOP, 3, gl.UNSIGNED_SHORT, i*3); // Fill.***
					}
				}
				else
				{
					gl.drawElements(gl.TRIANGLES, indicesCount, gl.UNSIGNED_SHORT, 0); // Fill.***
					
					var glError = gl.getError();
					if(glError !== gl.NO_ERROR)
						var hola = 0;
					/*
					gl.disableVertexAttribArray(currentShader.texCoord2_loc);
					gl.uniform1i(currentShader.hasTexture_loc, false); //.***
					gl.uniform4fv(currentShader.oneColor4_loc, [0.0, 0.0, 0.0, 1.0]);
					gl.drawElements(gl.LINES, indicesCount, gl.UNSIGNED_SHORT, 0); // Wireframe.***
					
					gl.enableVertexAttribArray(currentShader.texCoord2_loc);
					gl.uniform1i(currentShader.hasTexture_loc, true); //.***
					*/
				}
			}
		}
		else 
		{
			// render the owner tinTerrain.***
			if (this.owner !== undefined)
			{ this.owner.render(currentShader, magoManager, bDepth); }
		}
	}
	else 
	{
		// render the owner tinTerrain.***
		this.owner.render(currentShader, magoManager, bDepth);
	}
};

TinTerrain.prototype.getFrustumIntersectedTinTerrainsQuadTree = function(frustum, maxDepth, camPos, magoManager, visibleTilesArray, noVisibleTilesArray)
{
	if (this.geographicExtent === undefined || this.geographicExtent.minGeographicCoord === undefined || this.geographicExtent.maxGeographicCoord === undefined)
	{ return; }
	
	var currMinGeographicCoords = this.geographicExtent.minGeographicCoord;
	var currMaxGeographicCoords = this.geographicExtent.maxGeographicCoord;
		
	if (this.sphereExtent === undefined)
	{
		this.sphereExtent = SmartTile.computeSphereExtent(magoManager, currMinGeographicCoords, currMaxGeographicCoords, this.sphereExtent);
	}
	
	var sphereExtentAux = this.sphereExtent;
	var intersectionType = frustum.intersectionSphere(sphereExtentAux);
	
	if (intersectionType === Constant.INTERSECTION_OUTSIDE)
	{ 
		this.visible = false;
		noVisibleTilesArray.push(this); // collect no visible tiles to delete it.***
		return; 
	}
	else if (intersectionType === Constant.INTERSECTION_INSIDE)
	{
		// finish the process.***
		this.visible = true;
		visibleTilesArray.push(this);
		return;
	}
	else if (intersectionType === Constant.INTERSECTION_INTERSECT)
	{
		// check distance to camera.***
		var distToCam = camPos.distToSphere(sphereExtentAux);
		if (distToCam > 1000)
		{
			// finish the process.***
			this.visible = true;
			visibleTilesArray.push(this);
			return;
		}
		
		var currDepth = this.depth;
		if (currDepth < maxDepth)
		{
			// must descend.***
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
		
			// create children if no exist.***************
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
				
			if (this.childMap === undefined)
			{ this.childMap = {}; }
			
			// subTile 0 (Left-Up).***
			var subTile_LU = this.childMap.LU;
			if (subTile_LU === undefined)
			{
				// if no exist -> create it.***
				subTile_LU = new TinTerrain(this);
				subTile_LU.X = curX*2;
				subTile_LU.Y = curY*2;
				subTile_LU.setGeographicExtent(minLon, midLat, minAlt,  midLon, maxLat, maxAlt); 
				subTile_LU.indexName = "LU";
				this.childMap.LU = subTile_LU;
			}
			
			// subTile 1 (Left-Down).***
			var subTile_LD = this.childMap.LD;
			if (subTile_LD === undefined)
			{
				// if no exist -> create it.***
				subTile_LD = new TinTerrain(this);
				subTile_LD.X = curX*2;
				subTile_LD.Y = curY*2+1;
				subTile_LD.setGeographicExtent(minLon, minLat, minAlt,  midLon, midLat, maxAlt); 
				subTile_LD.indexName = "LD";
				this.childMap.LD = subTile_LD;
			}
			
			// subTile 2 (Right-Up).***
			var subTile_RU = this.childMap.RU;
			if (subTile_RU === undefined)
			{
				subTile_RU = new TinTerrain(this);
				subTile_RU.X = curX*2+1;
				subTile_RU.Y = curY*2;
				subTile_RU.setGeographicExtent(midLon, midLat, minAlt,  maxLon, maxLat, maxAlt); 
				subTile_RU.indexName = "RU";
				this.childMap.RU = subTile_RU;
			}
			
			// subTile 3 (Right-Down).***
			var subTile_RD = this.childMap.RD;
			if (subTile_RD === undefined)
			{
				subTile_RD = new TinTerrain(this);
				subTile_RD.X = curX*2+1;
				subTile_RD.Y = curY*2+1;
				subTile_RD.setGeographicExtent(midLon, minLat, minAlt,  maxLon, midLat, maxAlt);
				subTile_RD.indexName = "RD";
				this.childMap.RD = subTile_RD;
			}
			
			// now, do frustumCulling for each childTiles.***
			subTile_LU.getFrustumIntersectedTinTerrainsQuadTree(frustum, maxDepth, camPos, magoManager, visibleTilesArray, noVisibleTilesArray);
			subTile_LD.getFrustumIntersectedTinTerrainsQuadTree(frustum, maxDepth, camPos, magoManager, visibleTilesArray, noVisibleTilesArray);
			subTile_RU.getFrustumIntersectedTinTerrainsQuadTree(frustum, maxDepth, camPos, magoManager, visibleTilesArray, noVisibleTilesArray);
			subTile_RD.getFrustumIntersectedTinTerrainsQuadTree(frustum, maxDepth, camPos, magoManager, visibleTilesArray, noVisibleTilesArray);
		}
		else 
		{
			// finish the process.***
			this.visible = true;
			visibleTilesArray.push(this);
			return;
		}
	}
};

TinTerrain.prototype.makeMesh = function(lonSegments, latSegments, altitude, altitudesSlice)
{
	// This function makes an ellipsoidal mesh for tiles.***
	// 1rst, make the cartesiansArray:
	this.makeMeshVirtually(lonSegments, latSegments, altitude, altitudesSlice);
	
	// now, with "this.cartesiansArray" & "this.indicesArray" make a mesh.***
	
	
};

TinTerrain.prototype.makeMeshVirtually = function(lonSegments, latSegments, altitude, altitudesSlice)
{
	// This function makes an ellipsoidal mesh for tiles that has no elevation data.***
	// note: "altitude" & "altitudesSlice" are optionals.***
	var degToRadFactor = Math.PI/180.0;
	var minLon = this.geographicExtent.minGeographicCoord.longitude * degToRadFactor;
	var minLat = this.geographicExtent.minGeographicCoord.latitude * degToRadFactor;
	var maxLon = this.geographicExtent.maxGeographicCoord.longitude * degToRadFactor;
	var maxLat = this.geographicExtent.maxGeographicCoord.latitude * degToRadFactor;
	var lonRange = maxLon - minLon;
	var latRange = maxLat - minLat;
	
	var lonIncreDeg = lonRange/lonSegments;
	var latIncreDeg = latRange/latSegments;
	
	// use a vertexMatrix to make the regular net.***
	var vertexMatrix;
	
	// calculate total verticesCount.***
	var vertexCount = (lonSegments + 1)*(latSegments + 1);
	var lonArray = new Float32Array(vertexCount);
	var latArray = new Float32Array(vertexCount);
	var altArray = new Float32Array(vertexCount);
	this.texCoordsArray = new Float32Array(vertexCount*2);
	
	var currLon = minLon; // init startLon.***
	var currLat = minLat; // init startLat.***
	var idx = 0;
	
	// check if exist altitude.***
	var alt = 0;
	if (altitude)
	{ alt = altitude; }

	// Note: If exist "altitudesSlice", then use it.***
	
	for (var currLatSeg = 0; currLatSeg<latSegments+1; currLatSeg++)
	{
		currLon = minLon;
		for (var currLonSeg = 0; currLonSeg<lonSegments+1; currLonSeg++)
		{
			lonArray[idx] = currLon;
			latArray[idx] = currLat;
			// Now set the altitude.***
			if(altitudesSlice)
			{
				altArray[idx] = altitudesSlice.getValue(currLonSeg, currLatSeg);
			}
			else
				altArray[idx] = alt;

			// make texcoords.***
			this.texCoordsArray[idx*2] = (currLon - minLon)/lonRange;
			this.texCoordsArray[idx*2+1] = (currLat - minLat)/latRange;
			
			if (this.texCoordsArray[idx*2] > 1.0 || this.texCoordsArray[idx*2+1] > 1.0)
			{ var hola = 0; }
			
			// actualize current values.***
			currLon += lonIncreDeg;
			idx++;
		}
		currLat += latIncreDeg;
	}
	
	this.cartesiansArray = Globe.geographicRadianArrayToFloat32ArrayWgs84(lonArray, latArray, altArray, this.cartesiansArray);
	
	// finally make indicesArray.***
	var numCols = lonSegments + 1;
	var numRows = latSegments + 1;
	this.indices = this.getIndicesTrianglesRegularNet(numCols, numRows, undefined);
};

TinTerrain.prototype.getIndicesTrianglesRegularNet = function(numCols, numRows, resultIndicesArray)
{
	// given a regular net this function returns triangles indices of the net.***
	var verticesCount = numCols * numRows;
	var trianglesCount = (numCols-1) * (numRows-1) * 2;
	if (resultIndicesArray === undefined)
	{ resultIndicesArray = new Uint16Array(trianglesCount * 3); }
	
	var idx_1, idx_2, idx_3;
	var idxCounter = 0;
	
	for (var row = 0; row<numRows-1; row++)
	{
		for (var col=0; col<numCols-1; col++)
		{
			// there are 2 triangles: triA, triB.***
			idx_1 = VertexMatrix.getIndexOfArray(numCols, numRows, col, row);
			idx_2 = VertexMatrix.getIndexOfArray(numCols, numRows, col+1, row);
			idx_3 = VertexMatrix.getIndexOfArray(numCols, numRows, col, row+1);
			resultIndicesArray[idxCounter] = idx_1; idxCounter++;
			resultIndicesArray[idxCounter] = idx_2; idxCounter++;
			resultIndicesArray[idxCounter] = idx_3; idxCounter++;
			
			idx_1 = VertexMatrix.getIndexOfArray(numCols, numRows, col+1, row);
			idx_2 = VertexMatrix.getIndexOfArray(numCols, numRows, col+1, row+1);
			idx_3 = VertexMatrix.getIndexOfArray(numCols, numRows, col, row+1);
			resultIndicesArray[idxCounter] = idx_1; idxCounter++;
			resultIndicesArray[idxCounter] = idx_2; idxCounter++;
			resultIndicesArray[idxCounter] = idx_3; idxCounter++;
		}
	}
	
	return resultIndicesArray;
};

TinTerrain.prototype.zigZagDecode = function(value)
{
	return (value >> 1) ^ (-(value & 1));
};

TinTerrain.prototype.makeVbo = function(vboMemManager)
{
	if (this.cartesiansArray === undefined)
	{ return; }
	
	// rest the CenterPosition to the this.cartesiansArray.***
	var coordsCount = this.cartesiansArray.length/3;
	for (var i=0; i<coordsCount; i++)
	{
		this.cartesiansArray[i*3] -= this.centerX;
		this.cartesiansArray[i*3+1] -= this.centerY;
		this.cartesiansArray[i*3+2] -= this.centerZ;
	}
	
	if (this.terrainPositionHIGH === undefined)
	{ this.terrainPositionHIGH = new Float32Array(3); }

	if (this.terrainPositionLOW === undefined)
	{ this.terrainPositionLOW = new Float32Array(3); }
	ManagerUtils.calculateSplited3fv([this.centerX[0], this.centerY[0], this.centerZ[0]], this.terrainPositionHIGH, this.terrainPositionLOW);
	
	if (this.vboKeyContainer === undefined)
	{ this.vboKeyContainer = new VBOVertexIdxCacheKeysContainer(); }
	
	var vboKey = this.vboKeyContainer.newVBOVertexIdxCacheKey();
	
	// Positions.***
	var vertexCount = coordsCount;
	var posByteSize = vertexCount * 3;
	var classifiedPosByteSize = vboMemManager.getClassifiedBufferSize(posByteSize);
	vboKey.posVboDataArray = new Float32Array(classifiedPosByteSize);
	vboKey.posVboDataArray.set(this.cartesiansArray);
	
	// TexCoords.***
	var tCoordByteSize = 2 * vertexCount;
	var classifiedTCoordByteSize = vboMemManager.getClassifiedBufferSize(tCoordByteSize);
	vboKey.tcoordVboDataArray = new Float32Array(classifiedTCoordByteSize);
	vboKey.tcoordVboDataArray.set(this.texCoordsArray);
		
	// Indices.***
	var idxByteSize = this.indices.length;
	var classifiedIdxByteSize = vboMemManager.getClassifiedBufferSize(idxByteSize);
	vboKey.idxVboDataArray = new Uint16Array(classifiedIdxByteSize);
	vboKey.idxVboDataArray.set(this.indices);
		
	vboKey.indicesCount = this.indices.length;
	/*
	if (normal)
	{ vboKey.norVboDataArray = Int8Array.from(norArray); }
	
	if (color)
	{ vboKey.colVboDataArray = Uint8Array.from(colArray); }
	
*/
};

TinTerrain.prototype.decodeData = function()
{
	if (this.geographicExtent === undefined)
	{ return; }
	
	if (this.vertexArray === undefined)
	{ this.vertexArray = []; }
	
	var degToRadFactor = Math.PI/180.0;
	// latitude & longitude in RADIANS.***
	var minLon = this.geographicExtent.minGeographicCoord.longitude * degToRadFactor;
	var minLat = this.geographicExtent.minGeographicCoord.latitude * degToRadFactor;
	var maxLon = this.geographicExtent.maxGeographicCoord.longitude * degToRadFactor;
	var maxLat = this.geographicExtent.maxGeographicCoord.latitude * degToRadFactor;
	var lonRange = maxLon - minLon;
	var latRange = maxLat - minLat;
	
	var minHeight = this.minHeight[0];
	var maxHeight = this.maxHeight[0];
	var heightRange = maxHeight - minHeight;
	
	var vertexCount = this.vertexCount[0];
	this.texCoordsArray = new Float32Array(vertexCount*2);
	var lonArray = new Float32Array(vertexCount);
	var latArray = new Float32Array(vertexCount);
	var altArray = new Float32Array(vertexCount);
	var shortMax = 32767; // 65536
	var lonRangeDivShortMax = lonRange/shortMax;
	var latRangeDivShortMax = latRange/shortMax;
	var heightRangeDivShortMax = heightRange/shortMax;
	var uValues = this.uValues;
	var vValues = this.vValues;
	var hValues = this.hValues;
	for (var i=0; i<vertexCount; i++)
	{
		lonArray[i] = minLon + uValues[i]*lonRangeDivShortMax;
		latArray[i] = minLat + vValues[i]*latRangeDivShortMax;
		altArray[i] = minHeight + hValues[i]*heightRangeDivShortMax;
		
		// hardCoding.***
		//altArray[i] *= 0.5;
		//altArray[i] += 80.0;
		
		// debug.***
		var debugAlt = altArray[i];
		if (debugAlt > 257)
		{ var hola = 0; }
		
		// make texcoords.***
		this.texCoordsArray[i*2] = uValues[i]/shortMax;
		this.texCoordsArray[i*2+1] = vValues[i]/shortMax;
	}
	
	this.cartesiansArray = Globe.geographicRadianArrayToFloat32ArrayWgs84(lonArray, latArray, altArray, this.cartesiansArray);
	
	// free memory.***
	this.uValues = undefined;
	this.vValues = undefined;
	this.hValues = undefined;
	
	lonArray = undefined;
	latArray = undefined;
	altArray = undefined;
	
};

TinTerrain.prototype.parseData = function(dataArrayBuffer)
{
	this.fileLoadState = CODE.fileLoadState.PARSE_STARTED;
	var bytes_readed = 0;
	
	// 1. header.***
	this.centerX = new Float64Array(dataArrayBuffer.slice(bytes_readed, bytes_readed+8)); bytes_readed+=8;
	this.centerY = new Float64Array(dataArrayBuffer.slice(bytes_readed, bytes_readed+8)); bytes_readed+=8;
	this.centerZ = new Float64Array(dataArrayBuffer.slice(bytes_readed, bytes_readed+8)); bytes_readed+=8;
	
	this.minHeight = new Float32Array(dataArrayBuffer.slice(bytes_readed, bytes_readed+4)); bytes_readed+=4;
	this.maxHeight = new Float32Array(dataArrayBuffer.slice(bytes_readed, bytes_readed+4)); bytes_readed+=4;
	
	this.boundingSphereCenterX = new Float64Array(dataArrayBuffer.slice(bytes_readed, bytes_readed+8)); bytes_readed+=8;
	this.boundingSphereCenterY = new Float64Array(dataArrayBuffer.slice(bytes_readed, bytes_readed+8)); bytes_readed+=8;
	this.boundingSphereCenterZ = new Float64Array(dataArrayBuffer.slice(bytes_readed, bytes_readed+8)); bytes_readed+=8;
	this.boundingSphereRadius = new Float64Array(dataArrayBuffer.slice(bytes_readed, bytes_readed+8)); bytes_readed+=8;
	
	this.horizonOcclusionPointX = new Float64Array(dataArrayBuffer.slice(bytes_readed, bytes_readed+8)); bytes_readed+=8;
	this.horizonOcclusionPointY = new Float64Array(dataArrayBuffer.slice(bytes_readed, bytes_readed+8)); bytes_readed+=8;
	this.horizonOcclusionPointZ = new Float64Array(dataArrayBuffer.slice(bytes_readed, bytes_readed+8)); bytes_readed+=8;
	
	// 2. vertex data.***
	this.vertexCount = new Uint32Array(dataArrayBuffer.slice(bytes_readed, bytes_readed+4)); bytes_readed+=4;
	var vertexCount = this.vertexCount[0];
	this.uValues = new Uint16Array(dataArrayBuffer.slice(bytes_readed, bytes_readed + 2 * vertexCount)); bytes_readed += 2 * vertexCount;
	this.vValues = new Uint16Array(dataArrayBuffer.slice(bytes_readed, bytes_readed + 2 * vertexCount)); bytes_readed += 2 * vertexCount;
	this.hValues = new Uint16Array(dataArrayBuffer.slice(bytes_readed, bytes_readed + 2 * vertexCount)); bytes_readed += 2 * vertexCount;
	
	// decode data.***
	var u = 0;
	var v = 0;
	var height = 0;
	for (var i=0; i<vertexCount; i++)
	{
		u += this.zigZagDecode(this.uValues[i]);
		v += this.zigZagDecode(this.vValues[i]);
		height += this.zigZagDecode(this.hValues[i]);
		
		this.uValues[i] = u;
		this.vValues[i] = v;
		this.hValues[i] = height;
		
		// debug.***
		if (height > 0)
		{ var hola = 0; }
	}
	
	// 3. indices.***
	this.trianglesCount = new Uint32Array(dataArrayBuffer.slice(bytes_readed, bytes_readed + 4)); bytes_readed += 4;
	var trianglesCount = this.trianglesCount;
	if (vertexCount > 65536 )
	{
		this.indices = new Uint32Array(dataArrayBuffer.slice(bytes_readed, bytes_readed + 4 * trianglesCount * 3)); bytes_readed += 4 * trianglesCount * 3;
	}
	else 
	{
		this.indices = new Uint16Array(dataArrayBuffer.slice(bytes_readed, bytes_readed + 2 * trianglesCount * 3)); bytes_readed += 2 * trianglesCount * 3;
	}
	
	// decode indices.***
	var code;
	var highest = 0;
	var indicesCount = this.indices.length;
	for (var i=0; i<indicesCount; i++)
	{
		code = this.indices[i];
		this.indices[i] = highest - code;
		if (code === 0) 
		{
			++highest;
		}
	}
	
	// 4. edges indices.***
	if (vertexCount > 65536 )
	{
		this.westVertexCount = new Uint32Array(dataArrayBuffer.slice(bytes_readed, bytes_readed + 4)); bytes_readed += 4;
		this.westIndices = new Uint32Array(dataArrayBuffer.slice(bytes_readed, bytes_readed + 4 * this.westVertexCount)); bytes_readed += 4 * this.westVertexCount;
		
		this.southVertexCount = new Uint32Array(dataArrayBuffer.slice(bytes_readed, bytes_readed + 4)); bytes_readed += 4;
		this.southIndices = new Uint32Array(dataArrayBuffer.slice(bytes_readed, bytes_readed + 4 * this.southVertexCount)); bytes_readed += 4 * this.southVertexCount;
		
		this.eastVertexCount = new Uint32Array(dataArrayBuffer.slice(bytes_readed, bytes_readed + 4)); bytes_readed += 4;
		this.eastIndices = new Uint32Array(dataArrayBuffer.slice(bytes_readed, bytes_readed + 4 * this.eastVertexCount)); bytes_readed += 4 * this.eastVertexCount;
		
		this.northVertexCount = new Uint32Array(dataArrayBuffer.slice(bytes_readed, bytes_readed + 4)); bytes_readed += 4;
		this.northIndices = new Uint32Array(dataArrayBuffer.slice(bytes_readed, bytes_readed + 4 * this.northVertexCount)); bytes_readed += 4 * this.northVertexCount;
	}
	else
	{
		this.westVertexCount = new Uint32Array(dataArrayBuffer.slice(bytes_readed, bytes_readed + 4)); bytes_readed += 4;
		this.westIndices = new Uint16Array(dataArrayBuffer.slice(bytes_readed, bytes_readed + 2 * this.westVertexCount)); bytes_readed += 2 * this.westVertexCount;
		
		this.southVertexCount = new Uint32Array(dataArrayBuffer.slice(bytes_readed, bytes_readed + 4)); bytes_readed += 4;
		this.southIndices = new Uint16Array(dataArrayBuffer.slice(bytes_readed, bytes_readed + 2 * this.southVertexCount)); bytes_readed += 2 * this.southVertexCount;
		
		this.eastVertexCount = new Uint32Array(dataArrayBuffer.slice(bytes_readed, bytes_readed + 4)); bytes_readed += 4;
		this.eastIndices = new Uint16Array(dataArrayBuffer.slice(bytes_readed, bytes_readed + 2 * this.eastVertexCount)); bytes_readed += 2 * this.eastVertexCount;
		
		this.northVertexCount = new Uint32Array(dataArrayBuffer.slice(bytes_readed, bytes_readed + 4)); bytes_readed += 4;
		this.northIndices = new Uint16Array(dataArrayBuffer.slice(bytes_readed, bytes_readed + 2 * this.northVertexCount)); bytes_readed += 2 * this.northVertexCount;
	}
	
	// 5. extension header.***
	this.extensionId = new Uint8Array(dataArrayBuffer.slice(bytes_readed, bytes_readed + 1)); bytes_readed += 1;
	this.extensionLength = new Uint32Array(dataArrayBuffer.slice(bytes_readed, bytes_readed + 4)); bytes_readed += 4;
	
	this.fileLoadState = CODE.fileLoadState.PARSE_FINISHED;
	
	if (this.extensionId.length === 0)
	{
		dataArrayBuffer = undefined;
		return;
	}
	
	dataArrayBuffer = undefined;
};






















































