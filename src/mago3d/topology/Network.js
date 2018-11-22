'use strict';

/**
 * Network.***
 * 
 * @alias Network
 * @class Network
 */
var Network = function() 
{
	if (!(this instanceof Network)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
	this.id; // network id.***
	this.nodesArray;
	this.edgesArray;
	this.spacesArray;
	
	this.attributes;
	this.edgesVboKeysContainer; // to draw edges with an unique vbo.***
	this.nodesVboKeysContainer; // to draw nodes with an unique vbo.***
};

/**
 * 
 */
Network.prototype.newNode = function()
{
	if (this.nodesArray === undefined)
	{ this.nodesArray = []; }
	
	var networkNode = new NetworkNode();
	this.nodesArray.push(networkNode);
	return networkNode;
};

/**
 * 
 */
Network.prototype.newEdge = function()
{
	if (this.edgesArray === undefined)
	{ this.edgesArray = []; }
	
	var networkEdge = new NetworkEdge();
	this.edgesArray.push(networkEdge);
	return networkEdge;
};

/**
 * 
 */
Network.prototype.newSpace = function()
{
	if (this.spacesArray === undefined)
	{ this.spacesArray = []; }
	
	var networkSpace = new NetworkSpace();
	this.spacesArray.push(networkSpace);
	return networkSpace;
};

/**
 * 
 */
Network.prototype.test__makeVbos = function(magoManager)
{
	// Here makes meshes and vbos.***
	// For edges, make an unique vbo for faster rendering.***
	var edgesCount = 0;
	if (this.edgesArray)
	{ edgesCount = this.edgesArray.length; }
	
	var pointsArray = [];
	
	for (var i=0; i<edgesCount; i++)
	{
		var edge = this.edgesArray[i];
		var vtxSegment = edge.vtxSegment;
		var point1 = vtxSegment.startVertex.point3d;
		var point2 = vtxSegment.endVertex.point3d;
		pointsArray.push(point1.x);
		pointsArray.push(point1.y);
		pointsArray.push(point1.z);
		
		pointsArray.push(point2.x);
		pointsArray.push(point2.y);
		pointsArray.push(point2.z);
	}
	
	if (this.edgesVboKeysContainer === undefined)
	{
		this.edgesVboKeysContainer = new VBOVertexIdxCacheKeysContainer();
	}
	
	var vboKey = this.edgesVboKeysContainer.newVBOVertexIdxCacheKey();
	
	var vboMemManager = magoManager.vboMemoryManager;
	var pointsCount = edgesCount * 2;
	var posByteSize = pointsCount * 3;
	var classifiedPosByteSize = vboMemManager.getClassifiedBufferSize(posByteSize);
	vboKey.posVboDataArray = new Float32Array(classifiedPosByteSize);
	vboKey.posVboDataArray.set(pointsArray);
	vboKey.posArrayByteSize = pointsArray.length;
	vboKey.segmentsCount = edgesCount;
	
};

/**
 * 
 */
Network.prototype.renderColorCoding = function(magoManager, shader)
{
	// Provisional function.***
	// render nodes & edges.***
	var selectionColor = magoManager.selectionColor;
	selectionColor.init(); 
	
	var vboMemManager = magoManager.vboMemoryManager;
	var gl = magoManager.sceneState.gl;
	var vboKey;
	
	shader.disableVertexAttribArray(shader.texCoord2_loc); 
	shader.enableVertexAttribArray(shader.normal3_loc); 
	gl.uniform1i(shader.hasTexture_loc, false); //.***
	gl.uniform4fv(shader.oneColor4_loc, [0.8, 0.8, 0.8, 1.0]);
	
	if (!shader.last_isAditionalMovedZero)
	{
		gl.uniform1i(shader.hasAditionalMov_loc, false);
		gl.uniform3fv(shader.aditionalMov_loc, [0.0, 0.0, 0.0]); //.***
		shader.last_isAditionalMovedZero = true;
	}
	
	// Nodes.**************************************************************
	var nodesCount = 0;
	if (this.nodesArray)
	{ nodesCount = this.nodesArray.length; }
	
	if (nodesCount > 0 )//&& !magoManager.isCameraMoving)
	{
		var refMatrixType = 1; // translation-type.***
		gl.uniform1i(shader.refMatrixType_loc, refMatrixType);
		gl.uniform4fv(shader.oneColor4_loc, [0.3, 0.3, 0.9, 1.0]);
		var nodeMaster = this.nodesArray[0]; // render all with an unique box.***
		for (var i=0; i<nodesCount; i++)
		{
			var node = this.nodesArray[i];
			
			// nodes has a position, so render a point or a box.***
			gl.uniform3fv(shader.refTranslationVec_loc, [node.position.x, node.position.y, node.position.z]); 
			nodeMaster.box.render(magoManager, shader);
			
		}
	}
	
	// Edges.**************************************************************
	// Render with a unique vbo.***
	if (this.edgesVboKeysContainer)
	{
		var vboKey = this.edgesVboKeysContainer.vboCacheKeysArray[0];
		if (vboKey.isReadyPositions(gl, vboMemManager))
		{ 
			shader.disableVertexAttribArray(shader.texCoord2_loc); 
			shader.disableVertexAttribArray(shader.normal3_loc); 
			refMatrixType = 0;
			gl.uniform1i(shader.refMatrixType_loc, refMatrixType);
			gl.uniform4fv(shader.oneColor4_loc, [0.1, 0.1, 0.6, 1.0]);
	
			// Positions.***
			if (vboKey.meshVertexCacheKey !== shader.last_vboPos_binded)
			{
				gl.bindBuffer(gl.ARRAY_BUFFER, vboKey.meshVertexCacheKey);
				gl.vertexAttribPointer(shader.position3_loc, 3, gl.FLOAT, false, 0, 0);
				shader.last_vboPos_binded = vboKey.meshVertexCacheKey;
			}
			
			gl.drawArrays(gl.LINES, 0, vboKey.segmentsCount*2);
		}
	}
};

/**
 * 
 */
Network.prototype.render = function(magoManager, shader)
{
	// Provisional function.***
	// render nodes & edges.***
	var vboMemManager = magoManager.vboMemoryManager;
	var gl = magoManager.sceneState.gl;
	var vboKey;
	
	shader.disableVertexAttribArray(shader.texCoord2_loc); 
	shader.enableVertexAttribArray(shader.normal3_loc); 
	gl.uniform1i(shader.hasTexture_loc, false); //.***
	gl.uniform4fv(shader.oneColor4_loc, [0.8, 0.8, 0.8, 1.0]);
	
	if (!shader.last_isAditionalMovedZero)
	{
		gl.uniform1i(shader.hasAditionalMov_loc, false);
		gl.uniform3fv(shader.aditionalMov_loc, [0.0, 0.0, 0.0]); //.***
		shader.last_isAditionalMovedZero = true;
	}
	
	// Nodes.**************************************************************
	var nodesCount = 0;
	if (this.nodesArray)
	{ nodesCount = this.nodesArray.length; }
	
	if (nodesCount > 0 )//&& !magoManager.isCameraMoving)
	{
		var refMatrixType = 1; // translation-type.***
		gl.uniform1i(shader.refMatrixType_loc, refMatrixType);
		gl.uniform4fv(shader.oneColor4_loc, [0.3, 0.3, 0.9, 1.0]);
		var nodeMaster = this.nodesArray[0]; // render all with an unique box.***
		for (var i=0; i<nodesCount; i++)
		{
			var node = this.nodesArray[i];
			
			// nodes has a position, so render a point or a box.***
			gl.uniform3fv(shader.refTranslationVec_loc, [node.position.x, node.position.y, node.position.z]); 
			nodeMaster.box.render(magoManager, shader);
			
		}
	}
	
	// Edges.**************************************************************
	// Render with a unique vbo.***
	if (this.edgesVboKeysContainer)
	{
		var vboKey = this.edgesVboKeysContainer.vboCacheKeysArray[0];
		if (vboKey.isReadyPositions(gl, vboMemManager))
		{ 
			shader.disableVertexAttribArray(shader.texCoord2_loc); 
			shader.disableVertexAttribArray(shader.normal3_loc); 
			refMatrixType = 0;
			gl.uniform1i(shader.refMatrixType_loc, refMatrixType);
			gl.uniform4fv(shader.oneColor4_loc, [0.1, 0.1, 0.6, 1.0]);
	
			// Positions.***
			if (vboKey.meshVertexCacheKey !== shader.last_vboPos_binded)
			{
				gl.bindBuffer(gl.ARRAY_BUFFER, vboKey.meshVertexCacheKey);
				gl.vertexAttribPointer(shader.position3_loc, 3, gl.FLOAT, false, 0, 0);
				shader.last_vboPos_binded = vboKey.meshVertexCacheKey;
			}
			
			gl.drawArrays(gl.LINES, 0, vboKey.segmentsCount*2);
		}
	}
	
	// Spaces.************************************************
	shader.enableVertexAttribArray(shader.normal3_loc); 
	
	refMatrixType = 0;
	gl.uniform1i(shader.refMatrixType_loc, refMatrixType);
	gl.uniform4fv(shader.oneColor4_loc, [0.8, 0.8, 0.8, 0.2]);
	gl.enable(gl.BLEND);
	var spacesCount = 0;
	if (this.spacesArray)
	{ spacesCount = this.spacesArray.length; }
	
	for (var i=0; i<spacesCount; i++)
	{
		var space = this.spacesArray[i];
		space.mesh.render(magoManager, shader);
	}
	
	gl.disable(gl.BLEND);
};






































