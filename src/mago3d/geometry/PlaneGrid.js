'use strict';

/**
 * PlaneGrid on 3D space. (Draw on the ground or plane in 3D space)
 * Now under implementation 
 * @class PlaneGrid
 */
var PlaneGrid = function(width, height, numCols, numRows) 
{
	if (!(this instanceof PlaneGrid)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
	//this.plane; // plane 3d.
	this.geoLocDataManager;
	this.width;
	this.height;
	this.altitude = 0.0;
	this.numCols;
	this.numRows;
	this.vboKeysContainer;
	
	this.setSize(width, height, numCols, numRows);
};

/**
 * 어떤 일을 하고 있습니까?
 */
PlaneGrid.prototype.setSize = function(width, height, numCols, numRows) 
{
	if (width !== undefined)
	{ this.width = width; }
	
	if (height !== undefined)
	{ this.height = height; }
	
	if (numCols !== undefined)
	{ this.numCols = numCols; }
	
	if (numRows !== undefined)
	{ this.numRows = numRows; }
};

/**
 * 어떤 일을 하고 있습니까?
 */
PlaneGrid.prototype.render = function(magoManager, shader) 
{
	if (this.vboKeysContainer === undefined)
	{ return; }
	
	var gl = magoManager.sceneState.gl;
	var vboMemManager = magoManager.vboMemoryManager;
	
	// Set uniforms.
	var geoLoc = this.geoLocDataManager.getCurrentGeoLocationData();
	gl.uniformMatrix4fv(shader.buildingRotMatrix_loc, false, geoLoc.rotMatrix._floatArrays);
	gl.uniform3fv(shader.buildingPosHIGH_loc, geoLoc.positionHIGH);
	gl.uniform3fv(shader.buildingPosLOW_loc, geoLoc.positionLOW);
	
	gl.uniform1i(shader.refMatrixType_loc, 0); // in this case, there are not referencesMatrix.
	gl.uniform1i(shader.hasAditionalMov_loc, false);
	shader.disableVertexAttribArray(shader.texCoord2_loc); // Grid has no texCoords.
	
	gl.uniform1i(shader.colorType_loc, 0); // 0= oneColor, 1= attribColor, 2= texture.
	gl.uniform4fv(shader.oneColor4_loc, [1.0, 1.0, 1.0, 1.0]);
	
	gl.uniform1i(shader.bApplySpecularLighting_loc, false); // turn off specular lighting.
	
	// disable All AttribPointer.
	shader.disableVertexAttribArrayAll(); // init.
	
	var vboKeysCount = this.vboKeysContainer.vboCacheKeysArray.length;
	for (var i=0; i<vboKeysCount; i++)
	{
		var vboKey = this.vboKeysContainer.vboCacheKeysArray[i];

		// Positions.
		if (vboKey.vboBufferPos!== undefined && !vboKey.bindDataPosition(shader, magoManager.vboMemoryManager))
		{ return false; }

		// Normals.
		if (vboKey.vboBufferNor!== undefined)
		{
			if (!vbo_vicky.bindDataNormal(shader, magoManager.vboMemoryManager))
			{ return false; }
		}
		else 
		{
			shader.disableVertexAttribArray(shader.normal3_loc);
		}

		// Colors.
		if (vboKey.vboBufferCol!== undefined)
		{
			if (!vbo_vicky.bindDataColor(shader, magoManager.vboMemoryManager))
			{ return false; }
		}
		else 
		{
			shader.disableVertexAttribArray(shader.color4_loc);
		}
		
		// TexCoords.
		if (vboKey.vboBufferTCoord!== undefined)
		{
			if (!vbo_vicky.bindDataTexCoord(shader, magoManager.vboMemoryManager))
			{ return false; }
		}
		else 
		{
			shader.disableVertexAttribArray(shader.texCoord2_loc);
		}
		
		//gl.drawElements(primitive, vboKey.indicesCount, gl.UNSIGNED_SHORT, 0);
		gl.drawArrays(gl.LINES, 0, vboKey.vertexCount);
	}
};

/**
 * 어떤 일을 하고 있습니까?
 */
PlaneGrid.prototype.makeVbo = function(vboMemManager) 
{
	// Calculate positions.
	var halfWidth = this.width/2;
	var halfHeight = this.height/2;
	var alt = this.altitude;
	
	var leftDownPoint = new Point3D(-halfWidth, -halfHeight, alt);
	var rightDownPoint = new Point3D(halfWidth, -halfHeight, alt);
	var rightUpPoint = new Point3D(halfWidth, halfHeight, alt);
	var leftUpPoint = new Point3D(-halfWidth, halfHeight, alt);
	
	var increX = this.width/(this.numCols - 1);
	var increY = this.height/(this.numRows - 1);
	
	var pointsCount = this.numCols * 2 + this.numRows * 2;
	var positionsArray = new Float32Array(pointsCount*3);
	
	// Now, calculate all lines points.
	var x1, y1, z1;
	var x2, y2, z2;
	var idx = 0;
	
	// Vertical lines. "y" are constant.
	y1 = leftDownPoint.y; // down.
	y2 = leftUpPoint.y; // up.
	for (var col = 0; col < this.numCols; col++)
	{
		x1 = leftDownPoint.x + col * increX;
		x2 = x1;
		positionsArray[idx] = x1; idx++;
		positionsArray[idx] = y1; idx++;
		positionsArray[idx] = alt; idx++;
		positionsArray[idx] = x2; idx++;
		positionsArray[idx] = y2; idx++;
		positionsArray[idx] = alt; idx++;
	}
	
	// Horizontal lines.
	x1 = leftDownPoint.x; // left.
	x2 = rightDownPoint.x; // right.
	for (var row = 0; row < this.numRows; row++)
	{
		y1 = leftDownPoint.y + row * increY;
		y2 = y1;
		positionsArray[idx] = x1; idx++;
		positionsArray[idx] = y1; idx++;
		positionsArray[idx] = alt; idx++;
		positionsArray[idx] = x2; idx++;
		positionsArray[idx] = y2; idx++;
		positionsArray[idx] = alt; idx++;
	}
	
	if (this.vboKeysContainer === undefined)
	{ this.vboKeysContainer = new VBOVertexIdxCacheKeysContainer(); }
	
	var vbo = this.vboKeysContainer.newVBOVertexIdxCacheKey();
	vbo.setDataArrayPos(positionsArray, vboMemManager);
	
	
};

























































