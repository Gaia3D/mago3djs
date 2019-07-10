'use strict';

/**
 * This class represents ellipsoid geometry.
 * @class Ellipsoid
 */
var Ellipsoid = function(radiusX, radiusY, radiusZ) 
{
	if (!(this instanceof Ellipsoid)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	// Ellipsoid: x^2/a^2 + y^2/b^2 + z^2/c^2 = 1, (a, b, c) = (radiusX, radiusY, radiusZ).
	// Parametrization:
	// polarAng = 90 - latitude, azimuthAng = longitude.
	// x = a*sin(polarAng)*cos(azimuthAng)
	// y = b*sin(polarAng)*sin(azimuthAng)
	// z = c*cos(polarAng)
	
	this.radiusX;
	this.radiusY;
	this.radiusZ;
	
	this.centerPosition;
	
	this.strLonRad;
	this.endLonRad;
	this.strLatRad;
	this.endLatRad;
	
	this.lonSegments = 120;
	this.latSegments = 60;
	
	// positions(x, y, z), normals, texCoords, colors & indices array.
	this.cartesiansArray;
	this.normalsArray;
	this.texCoordsArray;
	this.colorsArray;
	this.indices;
	
	this.mesh;
	
	if (radiusX !== undefined)
	{ this.radiusX = radiusX; }
	
	if (radiusY !== undefined)
	{ this.radiusY = radiusY; }
	
	if (radiusZ !== undefined)
	{ this.radiusZ = radiusZ; }

	if (this.strLonRad === undefined)
	{ this.strLonRad = 0.0; }
	if (this.endLonRad === undefined)
	{ this.endLonRad = Math.PI*2; }
	if (this.strLatRad === undefined)
	{ this.strLatRad = -Math.PI/2; }
	if (this.endLatRad === undefined)
	{ this.endLatRad = Math.PI/2; }	

	this.strLonRad = 0.0;
	this.endLonRad = Math.PI/8;
	this.strLatRad = 0.0;
	this.endLatRad = Math.PI/8;

};

/**
 * Render this feature
 * @param {MagoManager} magoManager
 * @param {Shader} shader
 * @param {Number} renderType
 */
Ellipsoid.prototype.render = function(magoManager, shader, renderType, glPrimitive)
{
	var gl = magoManager.getGl();
		
	
	if (renderType === 2)
	{
		var colorAux;
		colorAux = magoManager.selectionColor.getAvailableColor(colorAux);
		var idxKey = magoManager.selectionColor.decodeColor3(colorAux.r, colorAux.g, colorAux.b);
		magoManager.selectionManager.setCandidateGeneral(idxKey, this);
		
		gl.uniform1i(shader.colorType_loc, 0); // 0= oneColor, 1= attribColor, 2= texture.
		gl.uniform4fv(shader.oneColor4_loc, [colorAux.r/255.0, colorAux.g/255.0, colorAux.b/255.0, 1.0]);
	}
	
	// render this tinTerrain.
	var renderWireframe = false;
	
	var vboKey = this.vboKeyContainer.vboCacheKeysArray[0];
	
	// Positions.
	if (!vboKey.bindDataPosition(shader, magoManager.vboMemoryManager))
	{ return false; }

	// Normals.***
	if (vboKey.vboBufferNor !== undefined)
	{
		// Has normal data.***
		if (!vboKey.bindDataNormal(shader, magoManager.vboMemoryManager))
		{ return false; }
	}

	// TexCoords (No necessary for depth rendering).
	/*
	if (!bDepth)
	{
		if (!vboKey.bindDataTexCoord(shader, magoManager.vboMemoryManager))
		{ return false; }
	}
	*/
	
	// Colors.
	// todo:
	
	// Indices.
	if (!vboKey.bindDataIndice(shader, magoManager.vboMemoryManager))
	{ return false; }
	
	var indicesCount = vboKey.indicesCount;
	
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
};

/**
 * Makes the vbo mesh.
 */
Ellipsoid.prototype.makeVbo = function(vboMemManager)
{
	if (this.cartesiansArray === undefined)
	{ return; }
	
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
		
	/*
	// Todo:
	if (normal)
	{ vboKey.norVboDataArray = Int8Array.from(norArray); }
	
	if (color)
	{ vboKey.colVboDataArray = Uint8Array.from(colArray); }
	this.cartesiansArray;
	this.texCoordsArray;
	this.colorsArray;
	this.indices;
	*/
};

/**
 * Makes the ellipsoid mesh.
 */
Ellipsoid.prototype.makeMesh = function(options)
{
	var bTrianglesSenseCCW = true;
	if (options !== undefined)
	{
		if (options.bTrianglesSenseCCW !== undefined)
		{ bTrianglesSenseCCW = options.bTrianglesSenseCCW; }
	}
	
	if (this.strLonRad > this.endLonRad)
	{
		this.strLonRad -= 2*Math.PI;
	}
	var increLon = (this.endLonRad - this.strLonRad)/this.lonSegments;
	var increLat = (this.endLatRad - this.strLatRad)/this.latSegments;
	var currLonRad = this.strLonRad;
	var currLatRad = this.strLatRad;
	var radiusX = this.radiusX;
	var radiusY = this.radiusY;
	var radiusZ = this.radiusZ;
	
	var totalPointsCount = (this.lonSegments+1)*(this.latSegments+1);
	this.cartesiansArray = new Float32Array(totalPointsCount*3); // Init.***
	this.normalsArray = new Int8Array(totalPointsCount*3); // Init.***
	var idx = 0;
	
	var bbox = new BoundingBox();
	
	for (var j=0; j<this.latSegments+1; j++)
	{
		currLatRad = this.strLatRad + j*increLat;
		var sinLat = Math.sin(currLatRad);
		var cosLat = Math.cos(currLatRad);
		for (var i = 0; i<this.lonSegments+1; i++)
		{
			currLonRad = this.strLonRad + i*increLon;
			var sinLon = Math.sin(currLonRad);
			var cosLon = Math.cos(currLonRad);
	
			// Position.***
			var x = radiusX * cosLat * cosLon;
			var y = radiusY * cosLat * sinLon;
			var z = radiusZ * sinLat;
			
			this.cartesiansArray[idx*3] = x;
			this.cartesiansArray[idx*3+1] = y;
			this.cartesiansArray[idx*3+2] = z;
			
			// Normal.***
			var point = new Point3D(x, y, z);
			
			// Calculate bbox before of normalizing the point.***
			if (idx === 0)
			{
				bbox.init(point);
			}
			else 
			{
				bbox.addPoint(point);
			}
			
			point.unitary();
			
			if (bTrianglesSenseCCW)
			{
				this.normalsArray[idx*3] = point.x*255;
				this.normalsArray[idx*3+1] = point.y*255;
				this.normalsArray[idx*3+2] = point.z*255;
			}
			else 
			{
				this.normalsArray[idx*3] = -point.x*255;
				this.normalsArray[idx*3+1] = -point.y*255;
				this.normalsArray[idx*3+2] = -point.z*255;
			}
			
			
			idx += 1;
		}
	}
	
	// Calculate the centerPosition of the ellipsoid.***
	this.centerPosition = bbox.getCenterPoint();
	
	for (var i=0; i<totalPointsCount; i++)
	{
		this.cartesiansArray[i*3] -= this.centerPosition.x;
		this.cartesiansArray[i*3+1] -= this.centerPosition.y;
		this.cartesiansArray[i*3+2] -= this.centerPosition.z;
	}
	
	if (this.terrainPositionHIGH === undefined)
	{ this.terrainPositionHIGH = new Float32Array(3); }

	if (this.terrainPositionLOW === undefined)
	{ this.terrainPositionLOW = new Float32Array(3); }
	ManagerUtils.calculateSplited3fv([this.centerPosition.x, this.centerPosition.y, this.centerPosition.z], this.terrainPositionHIGH, this.terrainPositionLOW);
	
	/*
	for (var i = 0; i<this.lonSegments+1; i++)
	{
		currLonRad = this.strLonRad + i*increLon;
		var sinLon = Math.sin(currLonRad);
		var cosLon = Math.cos(currLonRad);
		for (var j=0; j<this.latSegments+1; j++)
		{
			// Position.***
			currLatRad = this.strLatRad + j*increLat;
			var sinLat = Math.sin(currLatRad);
			var x = radiusX * sinLat * cosLon;
			var y = radiusY * sinLat * sinLon;
			var z = radiusZ*Math.cos(currLatRad);
			
			this.cartesiansArray[idx*3] = x;
			this.cartesiansArray[idx*3+1] = y;
			this.cartesiansArray[idx*3+2] = z;
			
			// Normal.***
			var normal = new Point3D(x, y, z);
			normal.unitary();
			
			this.normalsArray[idx*3] = normal.x*255;
			this.normalsArray[idx*3+1] = normal.y*255;
			this.normalsArray[idx*3+2] = normal.z*255;
			
			idx += 1;
		}
	}
	*/
	
	// Finally make indices array.***
	var numCols = this.lonSegments + 1;
	var numRows = this.latSegments + 1;

	this.indices = GeometryUtils.getIndicesTrianglesRegularNet(numCols, numRows, undefined, options);
};



































