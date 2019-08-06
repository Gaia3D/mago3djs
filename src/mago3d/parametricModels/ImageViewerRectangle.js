'use strict';

/**
 * ImageViewerRectangle.
 * @class ImageViewerRectangle
 */
var ImageViewerRectangle = function(width, height) 
{
	if (!(this instanceof ImageViewerRectangle)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
	this.width = width;
	this.height = height;
	this.geoLocDataManager;
	this.vboKeysContainer;
};

/**
 * Render this box feature
 * @param {MagoManager} magoManager
 * @param {Shader} shader
 */
ImageViewerRectangle.prototype.makeMesh = function(magoManager)
{
	// There are only 4 vertices.***
	var semiWidth = this.width/2;
	var semiHeight = this.height/2;
	
	var vertex_ld = new Vertex();
	vertex_ld.point3d.set(-semiWidth, -semiHeight, 0);
	vertex_ld.normal = new Point3D(0, 0, 1);
	vertex_ld.texCoord = new Point2D(0, 0);
	
	var vertex_rd = new Vertex();
	vertex_rd.point3d.set(semiWidth, -semiHeight, 0);
	vertex_rd.normal = new Point3D(0, 0, 1);
	vertex_rd.texCoord = new Point2D(1, 0);
	
	var vertex_ru = new Vertex();
	vertex_ru.point3d.set(semiWidth, semiHeight, 0);
	vertex_ru.normal = new Point3D(0, 0, 1);
	vertex_ru.texCoord = new Point2D(1, 1);
	
	var vertex_lu = new Vertex();
	vertex_lu.point3d.set(-semiWidth, semiHeight, 0);
	vertex_lu.normal = new Point3D(0, 0, 1);
	vertex_lu.texCoord = new Point2D(0, 1);
	
	var verticesArray = [vertex_ld, vertex_rd, vertex_ru, vertex_lu];
	
	if (this.vboKeysContainer === undefined)
	{ this.vboKeysContainer = new VBOVertexIdxCacheKeysContainer(); }
	
	var vboMemManager = magoManager.vboMemoryManager;
	var vbo = this.vboKeysContainer.newVBOVertexIdxCacheKey();
	VertexList.setIdxInList(verticesArray);
	VertexList.getVboDataArrays(verticesArray, vbo, vboMemManager);
	
	// Finally make the indices.***
	var idxDataArray = new Uint16Array([0, 1, 3, 1, 2, 3]);
	vbo.setDataArrayIdx(idxDataArray, vboMemManager);
};

/**
 * Render this box feature
 * @param {MagoManager} magoManager
 * @param {Shader} shader
 */
ImageViewerRectangle.prototype.render = function(magoManager, shader, glPrimitive)
{
	if (this.vboKeysContainer === undefined)
	{
		this.makeMesh(magoManager);
	}
	
	var vboMemManager = magoManager.vboMemoryManager;
	var gl = magoManager.sceneState.gl;
	var primitive;
	
	if (this.color4)
	{ gl.uniform4fv(shader.oneColor4_loc, [this.color4.r, this.color4.g, this.color4.b, 1.0]); }

	shader.useProgram();
	shader.resetLastBuffersBinded();

	shader.enableVertexAttribArray(shader.position3_loc);
	shader.disableVertexAttribArray(shader.color4_loc);
	shader.enableVertexAttribArray(shader.normal3_loc); 
	shader.enableVertexAttribArray(shader.texCoord2_loc); 
	
	shader.bindUniformGenerals();
	
	var buildingGeoLocation = this.geoLocDataManager.getCurrentGeoLocationData();
	buildingGeoLocation.bindGeoLocationUniforms(gl, shader); // rotMatrix, positionHIGH, positionLOW.
	
	
	var vboKeysCount = this.vboKeysContainer.vboCacheKeysArray.length;
	for (var i=0; i<vboKeysCount; i++)
	{
		var vboKey = this.vboKeysContainer.vboCacheKeysArray[i];
		
		// Positions.
		if (!vboKey.bindDataPosition(shader, vboMemManager))
		{ return false; }
		
		// Normals.
		if (vboKey.vboBufferNor)
		{
			if (!vboKey.bindDataNormal(shader, vboMemManager))
			{ return false; }
		}
		else 
		{
			shader.disableVertexAttribArray(shader.normal3_loc);
		}
		
		// Colors.
		if (vboKey.vboBufferCol)
		{
			if (!vboKey.bindDataColor(shader, vboMemManager))
			{ return false; }
		}
		else 
		{
			shader.disableVertexAttribArray(shader.color4_loc);
		}
		
		// TexCoords.
		if (vboKey.vboBufferTCoord)
		{
			if (!vboKey.bindDataTexCoord(shader, vboMemManager))
			{ return false; }
		}
		else 
		{
			shader.disableVertexAttribArray(shader.texCoord2_loc);
		}
		
		// Indices.
		if (!vboKey.bindDataIndice(shader, vboMemManager))
		{ return false; }
		
		if (glPrimitive)
		{ primitive = glPrimitive; }
		else
		{ primitive = gl.TRIANGLES; }
		
		gl.drawElements(primitive, vboKey.indicesCount, gl.UNSIGNED_SHORT, 0);
	}
};


















































