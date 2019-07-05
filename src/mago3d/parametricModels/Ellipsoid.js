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
	// polarAng = latitude, azimuthAng = longitude.
	// x = a*sin(polarAng)*cos(azimuthAng)
	// y = b*sin(polarAng)*sin(azimuthAng)
	// z = c*cos(polarAng)
	
	this.radiusX;
	this.radiusY;
	this.radiusZ;
	
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
	{ this.strLatRad = -Math.PI; }
	if (this.endLatRad === undefined)
	{ this.endLatRad = Math.PI; }	

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
		
		gl.uniform1i(currentShader.colorType_loc, 0); // 0= oneColor, 1= attribColor, 2= texture.
		gl.uniform4fv(currentShader.oneColor4_loc, [colorAux.r/255.0, colorAux.g/255.0, colorAux.b/255.0, 1.0]);
	}
	
	// Test.******************************************************************************************
	if (renderType === 1)
	{
		gl.uniform1i(currentShader.colorType_loc, 2); // 0= oneColor, 1= attribColor, 2= texture.
	}
	// End test.--------------------------------------------------------------------------------------
	
	// render this tinTerrain.
	var renderWireframe = false;
	
	gl.bindTexture(gl.TEXTURE_2D, this.texture.texId);
	
	gl.uniform3fv(currentShader.buildingPosHIGH_loc, this.terrainPositionHIGH);
	gl.uniform3fv(currentShader.buildingPosLOW_loc, this.terrainPositionLOW);
	
	var vboKey = this.vboKeyContainer.vboCacheKeysArray[0];
	
	// Positions.
	if (!vboKey.bindDataPosition(currentShader, magoManager.vboMemoryManager))
	{ return false; }

	// TexCoords (No necessary for depth rendering).
	if (!bDepth)
	{
		if (!vboKey.bindDataTexCoord(currentShader, magoManager.vboMemoryManager))
		{ return false; }
	}
	
	// Normals.
	// todo:
	
	// Colors.
	// todo:
	
	// Indices.
	if (!vboKey.bindDataIndice(currentShader, magoManager.vboMemoryManager))
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
	
	// Test Render wireframe if selected.*************************************************************
	if (renderType === 1)
	{
		gl.uniform1i(currentShader.colorType_loc, 2); // 0= oneColor, 1= attribColor, 2= texture.
		var currSelObject = magoManager.selectionManager.getSelectedGeneral();
		if (currSelObject === this)
		{
			gl.uniform1i(currentShader.colorType_loc, 0); // 0= oneColor, 1= attribColor, 2= texture.
			gl.uniform4fv(currentShader.oneColor4_loc, [0.0, 0.9, 0.9, 1.0]);
			gl.drawElements(gl.LINE_LOOP, indicesCount, gl.UNSIGNED_SHORT, 0); // Fill.
		}
	}
	// End test.--------------------------------------------------------------------------------------
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
	this.normalsArray;
	this.texCoordsArray;
	this.colorsArray;
	this.indices;
	*/
};

/**
 * Makes the ellipsoid mesh.
 */
Ellipsoid.prototype.makeMesh = function()
{
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
	this.cartesiansArray = new Float32Array(totalPointsCount); // Init.***
	var idx = 0;
	for (var i = 0; i<this.lonSegments+1; i++)
	{
		currLonRad = this.strLonRad + i*increLon;
		var sinLon = Math.sin(currLonRad);
		var cosLon = Math.cos(currLonRad);
		for (var j=0; j<this.latSegments+1; j++)
		{
			currLatRad = this.strLatRad + j*increLat;
			var sinLat = Math.sin(currLatRad);
			var x = radiusX * sinLat * cosLon;
			var y = radiusY * sinLat * sinLon;
			var z = radiusZ*Math.cos(currLatRad);
			
			this.cartesiansArray[idx*3] = x;
			this.cartesiansArray[idx*3+1] = y;
			this.cartesiansArray[idx*3+2] = z;
			
			idx += 1;
		}
	}
	
	// Finally make indices array.***
	var numCols = this.lonSegments + 1;
	var numRows = this.latSegments + 1;
	var options = {
		"bLoopColumns": true
	};
	
	this.indices = GeometryUtils.getIndicesTrianglesRegularNet(numCols, numRows, undefined, options);
};



































