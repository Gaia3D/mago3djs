'use strict';

/**
 * PlaneGrid on 3D space. 
 * @class PlaneGrid
 */
var PlaneGrid = function() 
{
	if (!(this instanceof PlaneGrid)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
	//this.plane; // plane 3d.***
	this.geoLocationData;
	this.width;
	this.height;
	this.altitude = 0.0;
	this.numCols;
	this.numRows;
	this.vboKeyContainer;
};

/**
 * 어떤 일을 하고 있습니까?
 */
PlaneGrid.prototype.setSize = function(width, height, numCols, numRows) 
{
	if(width !== undefined)
		this.width = width;
	
	if(height !== undefined)
		this.height = height;
	
	if(numCols !== undefined)
		this.numCols = numCols;
	
	if(numRows !== undefined)
		this.numRows = numRows;
};

/**
 * 어떤 일을 하고 있습니까?
 */
PlaneGrid.prototype.render = function(magoManager) 
{
	if(this.vboKeyContainer === undefined)
		return;
	
	var vboKeysCount = this.vboKeysContainer.vboCacheKeysArray.length;
	for (var i=0; i<vboKeysCount; i++)
	{
		var vboKey = this.vboKeysContainer.vboCacheKeysArray[i];
		if (!vboKey.isReadyPositions(gl, vboMemManager))
		{ return false; }
		
		if (!vboKey.isReadyPositions(gl, vboMemManager) || 
			!vboKey.isReadyNormals(gl, vboMemManager) || 
			!vboKey.isReadyFaces(gl, vboMemManager))
		{ return false; }
		
		vboKey.isReadyColors(gl, vboMemManager);
		
		// Positions.***
		if (vboKey.meshVertexCacheKey !== shader.last_vboPos_binded)
		{
			gl.bindBuffer(gl.ARRAY_BUFFER, vboKey.meshVertexCacheKey);
			gl.vertexAttribPointer(shader.position3_loc, 3, gl.FLOAT, false, 0, 0);
			shader.last_vboPos_binded = vboKey.meshVertexCacheKey;
		}
		
		// Normals.***
		if (vboKey.meshNormalCacheKey)
		{
			if (shader.normal3_loc && shader.normal3_loc !== -1) 
			{
				shader.enableVertexAttribArray(shader.normal3_loc);
				if (vboKey.meshNormalCacheKey !== shader.last_vboNor_binded)
				{
					gl.bindBuffer(gl.ARRAY_BUFFER, vboKey.meshNormalCacheKey);
					gl.vertexAttribPointer(shader.normal3_loc, 3, gl.BYTE, true, 0, 0);
					shader.last_vboNor_binded = vboKey.meshNormalCacheKey;
				}
			}
		}
		else{
			shader.disableVertexAttribArray(shader.normal3_loc);
		}
		
		// Colors.***
		if (vboKey.meshColorCacheKey)
		{
			if (shader.color4_loc && shader.color4_loc !== -1) 
			{
				shader.enableVertexAttribArray(shader.color4_loc);
				if (vboKey.meshColorCacheKey !== shader.last_vboCol_binded)
				{
					gl.bindBuffer(gl.ARRAY_BUFFER, vboKey.meshColorCacheKey);
					gl.vertexAttribPointer(shader.color4_loc, 4, gl.UNSIGNED_BYTE, true, 0, 0);
					shader.last_vboCol_binded = vboKey.meshColorCacheKey;
				}
			}
		}
		else{
			shader.disableVertexAttribArray(shader.color4_loc);
		}
		
		//gl.drawElements(primitive, vboKey.indicesCount, gl.UNSIGNED_SHORT, 0);
		gl.drawArrays(gl.LINES, 0, vertices_count);
	}
};

/**
 * 어떤 일을 하고 있습니까?
 */
PlaneGrid.prototype.makeVbo = function() 
{
	// Calculate positions.***
	var halfWidth = this.width/2;
	var halfHeight = this.height/2;
	var alt = this.altitude;
	
	var leftDownPoint = new Point3D(-halfWidth, -halfHeight, alt);
	var rightDownPoint = new Point3D(halfWidth, -halfHeight, alt);
	var rightUpPoint = new Point3D(halfWidth, halfHeight, alt);
	var leftUpPoint = new Point3D(-halfWidth, halfHeight, alt);
	
	var increX = this.width/(this.numCols + 1);
	var increY = this.height/(this.numRows + 1);
	
	var pointsCount = this.numCols * this.numRows;
	var positionsArray = new Float32Array(pointsCount*3);
	
	// Now, calculate all lines points.***
	var x1, y1, z1;
	var x2, y2, z2;
	var idx = 0;
	
	// Vertical lines. "y" are constant.***
	y1 = leftDownPoint.y; // down.***
	y2 = leftUpPoint.y; // up.***
	for(var col = 0; col < this.numCols; col++)
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
	
	// Horizontal lines.***
	x1 = leftDownPoint.x; // left.***
	x2 = rightDownPoint.x; // right.***
	for(var row = 0; row<this.numRows; row++)
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
	
	if(this.vboKeyContainer === undefined)
		this.vboKeyContainer = new VBOVertexIdxCacheKeysContainer();
	
	var vbo = this.vboKeyContainer.newVBOVertexIdxCacheKey();
	vbo.posVboDataArray = positionsArray;
	vbo.vertexCount = pointsCount;
};

























































