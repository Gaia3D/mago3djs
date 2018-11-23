'use strict';

/**
 * Network.***
 * 
 * @alias Network
 * @class Network
 */
var Network = function(owner) 
{
	if (!(this instanceof Network)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
	this.nodeOwner;
	if(owner)
		this.nodeOwner = owner;
	
	this.id; // network id.***
	this.nodesArray;
	this.edgesArray;
	this.spacesArray;
	
	this.attributes;
	this.edgesVboKeysContainer; // to draw edges with an unique vbo.***
	this.nodesVboKeysContainer; // to draw nodes with an unique vbo.***
	
	this.renderSpaces = true;
	this.spacesAlpha = 0.2;
};

/**
 * 
 */
Network.prototype.newNode = function()
{
	if (this.nodesArray === undefined)
	{ this.nodesArray = []; }
	
	var networkNode = new NetworkNode(this);
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
	
	var networkEdge = new NetworkEdge(this);
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
	
	var networkSpace = new NetworkSpace(this);
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
 * start rendering.
 * @param scene 변수
 * @param isLastFrustum 변수
 */
Network.prototype.parseTopologyData = function(magoManager, gmlDataContainer) 
{
	// gmlDataContainer.cellSpaceMembers
	// gmlDataContainer.edges
	// gmlDataContainer.nodes
	// cityGML Lower point (78.02094, -82.801873, 18).***
	// cityGML Upper point (152.17466, 19.03087, 39).***
	// cityGML Center point {x=115.09780549999999 y=-31.885501999999999 z=28.500000000000000 ...}
	
	var bbox = new BoundingBox();
	bbox.minX = gmlDataContainer.min_X;
	bbox.minY = gmlDataContainer.min_Y;
	bbox.minZ = gmlDataContainer.min_Z;
	bbox.maxX = gmlDataContainer.max_X;
	bbox.maxY = gmlDataContainer.max_Y;
	bbox.maxZ = gmlDataContainer.max_Z;
	
	//bbox.maxX = 56.19070816040039;
	//bbox.maxY = 71.51078033447266;
	//bbox.maxZ = 10.5;
	//bbox.minX = -379.18280029296875;
	//bbox.minY = -142.4878387451172;
	//bbox.minZ = -46.5;
	
	var offsetVector = new Point3D();
	var zOffset = 0.1;
	offsetVector.set(-115.0978055, 31.885502, -28.5); // cityGML ORIGINAL Center point inversed.***
	
	var nodesMap = {};
	var nodesCount = gmlDataContainer.nodes.length;
	for (var i=0; i<nodesCount; i++)
	{
		var node = gmlDataContainer.nodes[i];
		var networkNode = this.newNode();
		networkNode.id = "#" + node.id;
		
		networkNode.position = new Point3D(node.coordinates[0], node.coordinates[1], node.coordinates[2]);
		networkNode.position.addPoint(offsetVector); // rest bbox centerPoint.***
		networkNode.position.add(0.0, 0.0, zOffset); // aditional pos.***
		networkNode.box = new Box(0.6, 0.6, 0.6);
		
		nodesMap[networkNode.id] = networkNode;
	}
	
	
	var cellSpaceMap = {};
	var cellSpacesCount = gmlDataContainer.cellSpaceMembers.length;
	for (var i=0; i<cellSpacesCount; i++)
	{
		var cellSpace = gmlDataContainer.cellSpaceMembers[i];
		var id = cellSpace.href;
		var networkSpace = this.newSpace();
		var mesh = new Mesh();
		networkSpace.mesh = mesh; // assign mesh to networkSpace provisionally.***
		var vertexList = mesh.getVertexList();
		
		var surfacesMembersCount = cellSpace.surfaceMember.length;
		for (var j=0; j<surfacesMembersCount; j++)
		{
			var surface = mesh.newSurface();
			var face = surface.newFace();
			
			var coordinates = cellSpace.surfaceMember[j].coordinates;
			var coordinatedCount = coordinates.length;
			var pointsCount = coordinatedCount/3;
			
			if (pointsCount > 10)
			{ var hola = 0; }
			
			for (var k=0; k<pointsCount; k++)
			{
				var x = coordinates[k * 3];
				var y = coordinates[k * 3 + 1];
				var z = coordinates[k * 3 + 2];
				
				var vertex = vertexList.newVertex();
				vertex.setPosition(x, y, z);
				vertex.point3d.addPoint(offsetVector); // rest bbox centerPoint.***
				face.addVertex(vertex);
				
			}
			face.solveUroborus(); // Check & solve if the last point is coincident with the 1rst point.***
			face.calculateVerticesNormals();
			var hola = 0;
		}
		
		cellSpaceMap[cellSpace.href] = cellSpace;
	}
	
	var edgesCount = gmlDataContainer.edges.length;
	for (var i=0; i<edgesCount; i++)
	{
		var edge = gmlDataContainer.edges[i];
		var networkEdge = this.newEdge();
		
		var point1 = edge.stateMembers[0].coordinates;
		var point2 = edge.stateMembers[1].coordinates;
		var vertex1 = new Vertex();
		var vertex2 = new Vertex();
		vertex1.setPosition(point1[0], point1[1], point1[2]);
		vertex2.setPosition(point2[0], point2[1], point2[2]);
		vertex1.point3d.addPoint(offsetVector); // rest bbox centerPoint.***
		vertex1.point3d.add(0.0, 0.0, zOffset); // aditional pos.***
		vertex2.point3d.addPoint(offsetVector); // rest bbox centerPoint.***
		vertex2.point3d.add(0.0, 0.0, zOffset); // aditional pos.***
		var vtxSegment = new VtxSegment(vertex1, vertex2);
		networkEdge.vtxSegment = vtxSegment; // assign vtxSegment to networkEdge provisionally.***
		
		var connect_1_id = edge.connects[0];
		var connect_2_id = edge.connects[1];
		
		networkEdge.strNodeId = connect_1_id;
		networkEdge.endNodeId = connect_2_id;
		
		// Test.***
		var cellSpace_1 = cellSpaceMap[connect_1_id];
		var cellSpace_2 = cellSpaceMap[connect_2_id];
		var hola = 0;
	}
	
	this.test__makeVbos(magoManager);
};

/**
 * 
 */
Network.prototype.renderColorCoding = function(magoManager, shader, renderType)
{
	// Provisional function.***
	// render nodes & edges.***
	var selectionColor = magoManager.selectionColor;
	//selectionColor.init(); 
	
	// Check if exist selectionFamilies.***
	var selFamilyNameNodes = "networkNodes";
	var selManager = magoManager.selectionManager;
	var selCandidateNodes = selManager.getSelectionCandidatesFamily(selFamilyNameNodes);
	if(selCandidateNodes === undefined)
	{
		selCandidateNodes = selManager.newCandidatesFamily(selFamilyNameNodes);
	}
	
	var selFamilyNameEdges = "networkEdges";
	var selManager = magoManager.selectionManager;
	var selCandidateEdges = selManager.getSelectionCandidatesFamily(selFamilyNameEdges);
	if(selCandidateEdges === undefined)
	{
		selCandidateEdges = selManager.newCandidatesFamily(selFamilyNameEdges);
	}
	
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
		//gl.uniform4fv(shader.oneColor4_loc, [0.3, 0.3, 0.9, 1.0]);
		var nodeMaster = this.nodesArray[0]; // render all with an unique box.***
		for (var i=0; i<nodesCount; i++)
		{
			var node = this.nodesArray[i];
			
			// nodes has a position, so render a point or a box.***
			gl.uniform3fv(shader.refTranslationVec_loc, [node.position.x, node.position.y, node.position.z]); 
			
			var selColor4 = selectionColor.getAvailableColor(undefined); // new.
			var idxKey = selectionColor.decodeColor3(selColor4.r, selColor4.g, selColor4.b);
			selManager.setCandidateCustom(idxKey, selFamilyNameNodes, node);
			gl.uniform4fv(shader.color4Aux_loc, [selColor4.r/255.0, selColor4.g/255.0, selColor4.b/255.0, 1.0]);

			nodeMaster.box.render(magoManager, shader, renderType);
			
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
			
			// Positions.***
			if (vboKey.meshVertexCacheKey !== shader.last_vboPos_binded)
			{
				gl.bindBuffer(gl.ARRAY_BUFFER, vboKey.meshVertexCacheKey);
				gl.vertexAttribPointer(shader.position3_loc, 3, gl.FLOAT, false, 0, 0);
				shader.last_vboPos_binded = vboKey.meshVertexCacheKey;
			}
				
			var edgesCount = this.edgesArray.length;
			for(var i=0; i<edgesCount; i++)
			{
				var edge = this.edgesArray[i];
				var selColor4 = selectionColor.getAvailableColor(undefined); // new.
				var idxKey = selectionColor.decodeColor3(selColor4.r, selColor4.g, selColor4.b);
				selManager.setCandidateCustom(idxKey, selFamilyNameEdges, edge);
				gl.uniform4fv(shader.color4Aux_loc, [selColor4.r/255.0, selColor4.g/255.0, selColor4.b/255.0, 1.0]);
				gl.drawArrays(gl.LINES, i*2, 2);
			}
		}
	}
	
};

/**
 * 
 */
Network.prototype.render = function(magoManager, shader, renderType)
{
	if(renderType === 2)
	{
		this.renderColorCoding(magoManager, shader, renderType);
		return;
	}
	
	// Check if ready smallBox and bigBox.***
	
	
	var selectionColor = magoManager.selectionColor;
	selectionColor.init(); 
	
	// Check if exist selectionFamilies.***
	var selFamilyNameNodes = "networkNodes";
	var selManager = magoManager.selectionManager;
	var selCandidateNodes = selManager.getSelectionCandidatesFamily(selFamilyNameNodes);
	if(selCandidateNodes === undefined)
	{
		selCandidateNodes = selManager.newCandidatesFamily(selFamilyNameNodes);
	}
	
	var selFamilyNameEdges = "networkEdges";
	var selManager = magoManager.selectionManager;
	var selCandidateEdges = selManager.getSelectionCandidatesFamily(selFamilyNameEdges);
	if(selCandidateEdges === undefined)
	{
		selCandidateEdges = selManager.newCandidatesFamily(selFamilyNameEdges);
	}
	
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
			
			// check if is selected.***
			if(node === selCandidateNodes.currentSelected)
			{
				gl.uniform4fv(shader.oneColor4_loc, [0.9, 0.5, 0.1, 1.0]);
			}
			
			// nodes has a position, so render a point or a box.***
			gl.uniform3fv(shader.refTranslationVec_loc, [node.position.x, node.position.y, node.position.z]); 
			nodeMaster.box.render(magoManager, shader, renderType);
			
			// restore defaultColor.***
			if(node === selCandidateNodes.currentSelected)
			{
				gl.uniform4fv(shader.oneColor4_loc, [0.3, 0.3, 0.9, 1.0]);
			}
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
			
			//gl.drawArrays(gl.LINES, 0, vboKey.segmentsCount*2);
			
			var edgesCount = this.edgesArray.length;
			for(var i=0; i<edgesCount; i++)
			{
				var edge = this.edgesArray[i];
				if(edge === selCandidateEdges.currentSelected)
				{
					gl.uniform4fv(shader.oneColor4_loc, [0.0, 1.0, 0.0, 1.0]);
				}
				gl.drawArrays(gl.LINES, i*2, 2);
				
				// restore default color.***
				if(edge === selCandidateEdges.currentSelected)
				{
					gl.uniform4fv(shader.oneColor4_loc, [0.1, 0.1, 0.6, 1.0]);
				}
			}
		}
	}
	
	// Spaces.************************************************
	this.renderSpaces = magoManager.tempSettings.renderSpaces;
	this.spacesAlpha = magoManager.tempSettings.spacesAlpha;
	
	if(renderType === 1)
		shader.enableVertexAttribArray(shader.normal3_loc); 
	
	if(this.renderSpaces)
	{
		refMatrixType = 0;
		gl.uniform1i(shader.refMatrixType_loc, refMatrixType);
		gl.uniform4fv(shader.oneColor4_loc, [0.8, 0.8, 0.8, this.spacesAlpha]);
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
	}
};






































