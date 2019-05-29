'use strict';

/**
 * 카메라
 * @class CCTV
 */
var CCTV = function(name) 
{
	if (!(this instanceof CCTV)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
	this.name = "noName";
	if (name !== undefined)
	{ this.name = name; }

	this.geoLocationData = new GeoLocationData();
	this.minHeading = 0.0;
	this.maxHeading = 90.0;
	
	this.heading = 0.0;
	this.pitch = 0.0;
	this.roll = 0.0;
	this.targetHeading;
	this.targetPitch;
	this.targetRoll;
	
	this.rotMat = new Matrix4();
	this.camera = new Camera();
	this.vboKeyContainer; // class: VBOVertexIdxCacheKeyContainer.***
	this.vboKeyContainerEdges; // class: VBOVertexIdxCacheKeyContainer.***
	this.color = new Color();
	this.color.setRGBA(0.0, 0.5, 0.9, 0.3);
	this.greenFactorSpeed = 1.0;
	this.blueFactorSpeed = 2.0;
	this.alphaFactorSpeed = 2.0;
	
	this.headingAngularSpeed = 25.0; // deg per second.***
	this.pitchAngularSpeed;
	this.rollAngularSpeed; 
	this.lastTime;
	
	this.greenFactor = 1.0;
	this.blueFactor = 1.0;
	this.alphaFactor = 1.0;
};

/**
 * Update time as current time
 * @param currTime current time
 */
CCTV.prototype.updateTime = function(currTime)
{
	this.lastTime = currTime;
};

/**
 * Calculate the angularSpped to rotate the CCTV with the three direction : heading, pitch, roll
 * @param headingDeg
 * @param pitchDeg
 * @param rollDeg
 * @param transitionTimeSec
 * 
 */
CCTV.prototype.setOrientation = function(headingDeg, pitchDeg, rollDeg, transitionTimeSec)
{
	this.targetHeading = headingDeg;
	this.targetPitch = pitchDeg;
	this.targetRoll = rollDeg;
	
	// Now, calculate angularSpeeds.***
	// Heading.***
	if (this.targetHeading !== undefined)
	{
		var increHeading = this.targetHeading - this.heading;
		this.headingAngularSpeed = increHeading/transitionTimeSec;
		
		if (this.headingAngularSpeed === 0)
		{
			this.targetHeading = undefined;
			this.headingAngularSpeed = undefined;
		}
	}
	
	// Pitch.***
	if (this.targetPitch !== undefined)
	{
		var increPitch = this.targetPitch - this.pitch;
		this.pitchAngularSpeed = increPitch/transitionTimeSec;
		
		if (this.pitchAngularSpeed === 0)
		{
			this.targetPitch = undefined;
			this.pitchAngularSpeed = undefined;
		}
	}
	
	// Roll.***
	if (this.targetRoll !== undefined)
	{
		var increRoll = this.targetRoll - this.roll;
		this.rollAngularSpeed = increRoll/transitionTimeSec;
		
		if (this.rollAngularSpeed === 0)
		{
			this.targetRoll = undefined;
			this.rollAngularSpeed = undefined;
		}
	}
};

/**
 * Rotate the CCTV with current time and pre-calculated angular speed
 * @param currTime current time 
 */
CCTV.prototype.updateOrientation = function(currTime)
{
	// Check if camera is rotating.***
	if (this.targetHeading === undefined && this.targetPitch === undefined && this.targetRoll === undefined)
	{ return; }
	
	if (this.lastTime === undefined)
	{ this.lastTime = currTime; }

	var timeAmount = (currTime - this.lastTime)/1000;
	
	// Heading.***
	if (this.headingAngularSpeed !== undefined)
	{
		this.heading += timeAmount * this.headingAngularSpeed;
		// Check if heading arrived to targetHeading.***
		if (this.headingAngularSpeed > 0)
		{
			// Camera is rotating ccw.***
			if (this.heading >= this.targetHeading)
			{
				this.heading = this.targetHeading;
				this.targetHeading = undefined;
			}
		}
		else 
		{
			// Camera is rotating cw.***
			if (this.heading <= this.targetHeading)
			{
				this.heading = this.targetHeading;
				this.targetHeading = undefined;
			}
		}
		
		if (this.headingAngularSpeed === 0)
		{
			this.targetHeading = undefined;
			this.headingAngularSpeed = undefined;
		}
	}
	
	// Pitch.***
	if (this.pitchAngularSpeed !== undefined)
	{
		this.pitch += timeAmount * this.pitchAngularSpeed;
		
		// Check if pitch arrived to targetPitch.***
		if (this.pitchAngularSpeed > 0)
		{
			// Camera is rotating ccw.***
			if (this.pitch >= this.targetPitch)
			{
				this.pitch = this.targetPitch;
				this.targetPitch = undefined;
			}
		}
		else
		{
			// Camera is rotating cw.***
			if (this.pitch <= this.targetPitch)
			{
				this.pitch = this.targetPitch;
				this.targetPitch = undefined;
			}
		}
		
		if (this.pitchAngularSpeed === 0)
		{
			this.targetPitch = undefined;
			this.pitchAngularSpeed = 0;
		}
	}
	
	// Roll.***
	if (this.rollAngularSpeed !== undefined)
	{
		this.roll += timeAmount * this.rollAngularSpeed;
		// Check if pitch arrived to targetPitch.***
		if (this.rollAngularSpeed > 0)
		{
			// Camera is rotating ccw.***
			if (this.roll >= this.targetRoll)
			{
				this.roll = this.targetRoll;
				this.targetRoll = undefined;
			}
		}
		else 
		{
			// Camera is rotating cw.***
			if (this.roll <= this.targetRoll)
			{
				this.roll = this.targetRoll;
				this.targetRoll = undefined;
			}
		}
		
		if (this.rollAngularSpeed === 0)
		{
			this.targetRoll = undefined;
			this.rollAngularSpeed = undefined;
		}
	}
	
	this.calculateRotationMatrix();
};

/**
 * only rotating with the heading direction
 * @param currTime current time
 */
CCTV.prototype.updateHeading = function(currTime)
{
	// Old function.***
	if (this.lastTime === undefined)
	{ this.lastTime = currTime; }

	var timeAmount = (currTime - this.lastTime)/1000;
	this.heading += timeAmount * this.headingAngularSpeed;
	
	if (this.heading > this.maxHeading)
	{
		this.heading = this.maxHeading;
		this.headingAngularSpeed *= -1.0;
	}
	else if (this.heading < this.minHeading)
	{
		this.heading = this.minHeading;
		this.headingAngularSpeed *= -1.0;
	}
	
	this.calculateRotationMatrix();
};

/**
 * Update the color of the screen shown at the CCTV
 * @param currTime
 */
CCTV.prototype.updateColor = function(currTime)
{
	if (this.lastTime === undefined)
	{ this.lastTime = currTime; }

	var timeAmount = (currTime - this.lastTime)/1000;
	
	// change color.***
	if (this.greenFactor === undefined)
	{ this.greenFactor = 1.0; }
	
	if (this.blueFactor === undefined)
	{ this.blueFactor = 1.0; }
	
	if (this.alphaFactor === undefined)
	{ this.alphaFactor = 1.0; }
	
	this.greenFactor += this.greenFactorSpeed * timeAmount;
	this.blueFactor += this.blueFactorSpeed * timeAmount;
	
	if (this.greenFactor > 0.5 )
	{
		this.greenFactor = 0.5;
		this.greenFactorSpeed *= -1;
	}
	
	if (this.greenFactor < 0.0 )
	{
		this.greenFactor = 0.0;
		this.greenFactorSpeed *= -1;
	}
	
	if (this.blueFactor > 0.9 )
	{
		this.blueFactor = 0.9;
		this.blueFactorSpeed *= -1;
	}
	
	if (this.blueFactor < 0.0 )
	{
		this.blueFactor = 0.0;
		this.blueFactorSpeed *= -1;
	}
	
	
	if (this.alphaFactor > 0.6 )
	{
		this.alphaFactor = 0.6;
		this.alphaFactorSpeed *= -1;
	}
	
	if (this.alphaFactor < 0.0 )
	{
		this.alphaFactor = 0.0;
		this.alphaFactorSpeed *= -1;
	}
	
	this.color.setRGBA(0.0, this.greenFactor, this.blueFactor, this.alphaFactor);
};

/**
 * Calculate the matrix when update the orientation of the matrix
 */
CCTV.prototype.calculateRotationMatrix = function()
{
	var rotMatAux;
	rotMatAux = Matrix4.getRotationDegZXYMatrix(this.heading, this.pitch, this.roll, rotMatAux);
	this.rotMat = rotMatAux.getMultipliedByMatrix(this.geoLocationData.rotMatrix, this.rotMat);
};

/**
 * get the Vbo of the mesh which consist of the frustum of this CCTV
 * @param resultVboContainer
 * @param resultVboContainerEdges
 * @param vboMemManager
 */
CCTV.prototype.getVbo = function(resultVboContainer, resultVboContainerEdges, vboMemManager)
{
	if (resultVboContainer === undefined)
	{ resultVboContainer = new VBOVertexIdxCacheKeysContainer(); }

	if (this.vboKeyContainerEdges === undefined)
	{ this.vboKeyContainerEdges = new VBOVertexIdxCacheKeysContainer(); }

	var frustumMesh;
	
	// make vbo.***
	frustumMesh = this.makeFrustumGeometry_2(frustumMesh);
	var bIncludeBottomCap = true;
	var bIncludeTopCap = true;
	
	// now rotate in X axis.***
	var rotMatAux = new Matrix4();
	var frustum = this.camera.bigFrustum;
	var halfFovyRad = frustum.fovyRad / 2.0;
	rotMatAux.rotationAxisAngDeg((-halfFovyRad) * 180.0 / Math.PI, 1.0, 0.0, 0.0);
	
	var surfIndepMesh = frustumMesh.getSurfaceIndependentMesh(undefined, bIncludeBottomCap, bIncludeTopCap);
	surfIndepMesh.transformByMatrix4(rotMatAux);
	surfIndepMesh.setColor(0.0, 0.5, 0.9, 0.3);
	
	surfIndepMesh.getVbo(resultVboContainer, vboMemManager);
	surfIndepMesh.getVboEdges(this.vboKeyContainerEdges, vboMemManager);
	
	return resultVboContainer;
};

/**
 * 
 */
CCTV.prototype.render = function(gl, magoManager, shader)
{
	if (this.vboKeyContainer === undefined)
	{ return; }
	
	var cacheKeys_count = this.vboKeyContainer.vboCacheKeysArray.length;
	
	//gl.uniform1i(shader.bApplySpecularLighting_loc, false);
	
	// Must applicate the transformMatrix.***
	gl.uniformMatrix4fv(shader.buildingRotMatrix_loc, false, this.geoLocationData.rotMatrix._floatArrays);
	gl.uniform3fv(shader.buildingPosHIGH_loc, this.geoLocationData.positionHIGH);
	gl.uniform3fv(shader.buildingPosLOW_loc, this.geoLocationData.positionLOW);
	
	gl.uniform1i(shader.hasTexture_loc, false); //.***
	
	gl.enable(gl.POLYGON_OFFSET_FILL);
	gl.polygonOffset(1, 3);
	
	var renderWireframe;
	
	var refMatrixType = 2;
	gl.uniform1i(shader.refMatrixType_loc, refMatrixType);
	gl.uniformMatrix4fv(shader.refMatrix_loc, false, this.rotMat._floatArrays);
	
	var renderer = magoManager.renderer;
	
	// render wireframe.***
	renderWireframe = true;
	renderer.renderNormals = false;
	gl.uniform4fv(shader.oneColor4_loc, [0.0, 0.0, 0.0, 1.0]);
	renderer.renderVboContainer(gl, this.vboKeyContainerEdges, magoManager, shader, renderWireframe);
	
	// now render fill.***
	gl.enable(gl.BLEND);
	renderWireframe = false;
	renderer.renderNormals = true;
	//gl.uniform4fv(shader.oneColor4_loc, [this.blueFactor, this.greenFactor, 0.0, this.alphaFactor]);
	gl.uniform4fv(shader.oneColor4_loc, [this.blueFactor, 0.0, 0.0, this.alphaFactor]);
	renderer.renderVboContainer(gl, this.vboKeyContainer, magoManager, shader, renderWireframe);
	gl.disable(gl.BLEND);
	
	gl.disable(gl.POLYGON_OFFSET_FILL);
};

/**
 * Make Frustum Geometry for this CCTV
 * @param resultMesh the frustum
 */
CCTV.prototype.makeFrustumGeometry_2 = function(resultMesh)
{
	// 1rst, make the profile: icecream shape.***
	if (resultMesh === undefined)
	{ resultMesh = new ParametricMesh(); }

	resultMesh.profile = new Profile2D(); 
	var profileAux = resultMesh.profile; 
	
	// camera geometry values.***
	var frustum = this.camera.bigFrustum;
	var far = frustum.far;
	var halfFovyRad = frustum.fovyRad / 2.0;
	var halfFovxRad = frustum.fovRad / 2.0;
	
	var left = -far * Math.tan(halfFovxRad);
	var right = -left;
	var top = far * Math.tan(halfFovyRad);
	var bottom = -top;
	
	// Outer ring.**************************************
	var outerRing = profileAux.newOuterRing();
	var polyLine, point3d, arc;
	
	polyLine = outerRing.newElement("POLYLINE");
	point3d = polyLine.newPoint2d(-far * Math.sin(halfFovxRad), far * Math.cos(halfFovxRad)); // 0
	point3d = polyLine.newPoint2d(0.0, 0.0); // 1
	point3d = polyLine.newPoint2d(far * Math.sin(halfFovxRad), far * Math.cos(halfFovxRad)); // 2
	
	var startAngDeg = 90.0 - halfFovxRad * 180.0 / Math.PI;
	var endAngDeg = 90.0 + halfFovxRad * 180.0 / Math.PI;
	arc = outerRing.newElement("ARC");
	this.sweepSense = 1;
	arc.setCenterPosition(0.0, 0.0);
	arc.setRadius(far);
	////arc.setStartPoint(far * Math.sin(halfFovxRad), far * Math.cos(halfFovxRad));
	////arc.setEndPoint(-far * Math.sin(halfFovxRad), far * Math.cos(halfFovxRad));
	arc.setStartAngleDegree(startAngDeg);
	arc.setSweepAngleDegree(endAngDeg - startAngDeg);
	arc.numPointsFor360Deg = 36;
	
	// now revolve.***
	var revolveAngDeg, revolveSegmentsCount, revolveSegment2d;
	revolveAngDeg = (halfFovyRad * 2) * 180.0 / Math.PI;
	revolveSegment2d = new Segment2D();
	var strPoint2d = new Point2D(-1, 0);
	var endPoint2d = new Point2D(1, 0);
	revolveSegment2d.setPoints(strPoint2d, endPoint2d);
	revolveSegmentsCount = 6;
	resultMesh.revolve(profileAux, revolveAngDeg, revolveSegmentsCount, revolveSegment2d);
	
	return resultMesh;
};

/**
 * Make Frustum Geometry for this CCTV
 * @param resultMesh the frustum
 */
CCTV.prototype.makeFrustumGeometry = function(resultMesh)
{
	// make a frustum mesh.***
	if (resultMesh === undefined)
	{ resultMesh = new Mesh(); }

	if (resultMesh.hedgesList === undefined)
	{ resultMesh.hedgesList = new HalfEdgesList(); }
	
	// 1rst, calculate the positions of 5 vertices.***
	var focusPosition = new Point3D(0.0, 0.0, 0.0);
	
	var frustum = this.camera.bigFrustum;
	var far = frustum.far;
	var halfFovyRad = frustum.fovyRad / 2.0;
	var halfFovxRad = frustum.fovRad / 2.0;
	
	var left = -far * Math.tan(halfFovxRad);
	var right = -left;
	var top = far * Math.tan(halfFovyRad);
	var bottom = -top;
	
	var farLeftDown = new Point3D(left, bottom, -far);
	var farRightDown = new Point3D(right, bottom, -far);
	var farRightTop = new Point3D(right, top, -far);
	var farLeftTop = new Point3D(left, top, -far);
	
	// now make vertices. 5 vertices in total.***
	var focusVertex = new Vertex(focusPosition);
	var farLeftDownVertex = new Vertex(farLeftDown);
	var farRightDownVertex = new Vertex(farRightDown);
	var farRightTopVertex = new Vertex(farRightTop);
	var farLeftTopVertex = new Vertex(farLeftTop);
	
	// provisionally make wireframe here.***
	if (this.vboKeyContainerEdges === undefined)
	{ this.vboKeyContainerEdges = new VBOVertexIdxCacheKeysContainer(); }

	var face;
	
	// there are no near polygon.***
	// 1- far polygon.***
	var farSurface = resultMesh.newSurface();
	face = farSurface.newFace();
	// ad vertices in ccw order.***
	face.addVertex(farLeftDownVertex);
	face.addVertex(farLeftTopVertex);
	face.addVertex(farRightTopVertex);
	face.addVertex(farRightDownVertex);
	
	// make wireframe vbo.************************************************
	var vertex_1, vertex_2, pos_1, pos_2;
	var next_idx;
	var curr_edge_idx = 0;
	var posDataArray = [];
	var indicesDataArray = [];
	
	var vertexCount = face.vertexArray.length;
	for (var i=0; i<vertexCount; i++)
	{
		vertex_1 = face.vertexArray[i];
		next_idx = VertexList.getNextIdx(i, face.vertexArray);
		vertex_2 = face.vertexArray[next_idx];
		
		pos_1 = vertex_1.point3d;
		pos_2 = vertex_2.point3d;
		
		posDataArray.push(pos_1.x);
		posDataArray.push(pos_1.y);
		posDataArray.push(pos_1.z);
		
		posDataArray.push(pos_2.x);
		posDataArray.push(pos_2.y);
		posDataArray.push(pos_2.z);
		
		indicesDataArray.push(curr_edge_idx); curr_edge_idx++;
		indicesDataArray.push(curr_edge_idx); curr_edge_idx++;
	}
	// end make wireframe vbo.--------------------------------------------
	
	// 2- top polygon.***
	var topSurface = resultMesh.newSurface();
	face = topSurface.newFace();
	// ad vertices in ccw order.***
	face.addVertex(focusVertex);
	face.addVertex(farRightTopVertex);
	face.addVertex(farLeftTopVertex);
	
	// make wireframe vbo.************************************************
	vertexCount = face.vertexArray.length;
	for (var i=0; i<vertexCount; i++)
	{
		vertex_1 = face.vertexArray[i];
		next_idx = VertexList.getNextIdx(i, face.vertexArray);
		vertex_2 = face.vertexArray[next_idx];
		
		pos_1 = vertex_1.point3d;
		pos_2 = vertex_2.point3d;
		
		posDataArray.push(pos_1.x);
		posDataArray.push(pos_1.y);
		posDataArray.push(pos_1.z);
		
		posDataArray.push(pos_2.x);
		posDataArray.push(pos_2.y);
		posDataArray.push(pos_2.z);
		
		indicesDataArray.push(curr_edge_idx); curr_edge_idx++;
		indicesDataArray.push(curr_edge_idx); curr_edge_idx++;
	}
	// end make wireframe vbo.--------------------------------------------
	
	// 3- left polygon.***
	var leftSurface = resultMesh.newSurface();
	face = leftSurface.newFace();
	// ad vertices in ccw order.***
	face.addVertex(focusVertex);
	face.addVertex(farLeftTopVertex);
	face.addVertex(farLeftDownVertex);
	
	// make wireframe vbo.************************************************
	vertexCount = face.vertexArray.length;
	for (var i=0; i<vertexCount; i++)
	{
		vertex_1 = face.vertexArray[i];
		next_idx = VertexList.getNextIdx(i, face.vertexArray);
		vertex_2 = face.vertexArray[next_idx];
		
		pos_1 = vertex_1.point3d;
		pos_2 = vertex_2.point3d;
		
		posDataArray.push(pos_1.x);
		posDataArray.push(pos_1.y);
		posDataArray.push(pos_1.z);
		
		posDataArray.push(pos_2.x);
		posDataArray.push(pos_2.y);
		posDataArray.push(pos_2.z);
		
		indicesDataArray.push(curr_edge_idx); curr_edge_idx++;
		indicesDataArray.push(curr_edge_idx); curr_edge_idx++;
	}
	// end make wireframe vbo.--------------------------------------------
	
	// 4- bottom polygon.***
	var bottomSurface = resultMesh.newSurface();
	face = bottomSurface.newFace();
	// ad vertices in ccw order.***
	face.addVertex(focusVertex);
	face.addVertex(farLeftDownVertex);
	face.addVertex(farRightDownVertex);
	
	// make wireframe vbo.************************************************
	vertexCount = face.vertexArray.length;
	for (var i=0; i<vertexCount; i++)
	{
		vertex_1 = face.vertexArray[i];
		next_idx = VertexList.getNextIdx(i, face.vertexArray);
		vertex_2 = face.vertexArray[next_idx];
		
		pos_1 = vertex_1.point3d;
		pos_2 = vertex_2.point3d;
		
		posDataArray.push(pos_1.x);
		posDataArray.push(pos_1.y);
		posDataArray.push(pos_1.z);
		
		posDataArray.push(pos_2.x);
		posDataArray.push(pos_2.y);
		posDataArray.push(pos_2.z);
		
		indicesDataArray.push(curr_edge_idx); curr_edge_idx++;
		indicesDataArray.push(curr_edge_idx); curr_edge_idx++;
	}
	// end make wireframe vbo.--------------------------------------------
	
	// 5- right polygon.***
	var rightSurface = resultMesh.newSurface();
	face = rightSurface.newFace();
	// ad vertices in ccw order.***
	face.addVertex(focusVertex);
	face.addVertex(farRightDownVertex);
	face.addVertex(farRightTopVertex);
	
	// make wireframe vbo.************************************************
	vertexCount = face.vertexArray.length;
	for (var i=0; i<vertexCount; i++)
	{
		vertex_1 = face.vertexArray[i];
		next_idx = VertexList.getNextIdx(i, face.vertexArray);
		vertex_2 = face.vertexArray[next_idx];
		
		pos_1 = vertex_1.point3d;
		pos_2 = vertex_2.point3d;
		
		posDataArray.push(pos_1.x);
		posDataArray.push(pos_1.y);
		posDataArray.push(pos_1.z);
		
		posDataArray.push(pos_2.x);
		posDataArray.push(pos_2.y);
		posDataArray.push(pos_2.z);
		
		indicesDataArray.push(curr_edge_idx); curr_edge_idx++;
		indicesDataArray.push(curr_edge_idx); curr_edge_idx++;
	}
	// end make wireframe vbo.--------------------------------------------
	var vboEdges = this.vboKeyContainerEdges.newVBOVertexIdxCacheKey();
	vboEdges.posVboDataArray = Float32Array.from(posDataArray);
	vboEdges.idxVboDataArray = Int16Array.from(indicesDataArray);
	vboEdges.indicesCount = vboEdges.idxVboDataArray.length;

	resultMesh.calculateVerticesNormals();
	
	return resultMesh;
};

// CCTVList.*********************************************************************************
/**
 * 카메라
 * @class CCTVList
 */
var CCTVList = function() 
{
	if (!(this instanceof CCTVList)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
	this.camerasList = [];
	this.bDrawCCTVNames = true;
	
};

/**
 * Create CCTV with name
 * @param {String} name
 */
CCTVList.prototype.new_CCTV = function(name)
{
	var cctv = new CCTV();
	if (name !== undefined)
	{ cctv.name = name; }
	
	this.camerasList.push(cctv);
	return cctv;
};

/**
 * Get single CCTV instance as the index of the instance in this CCTV list
 * @param {Number} idx
 * @return {CCTV}
 */
CCTVList.prototype.getCCTV = function(idx)
{
	return this.camerasList[idx];
};

/**
 * Get single CCTV instance as the name of the instance
 * @param {String} cameraName the name of that CCTV
 */
CCTVList.prototype.getCCTVByName = function(cameraName)
{
	var find = false;
	var camerasCount = this.getCCTVCount();
	var i=0;
	var cam, resultCam;
	while (!find && i<camerasCount)
	{
		cam = this.getCCTV(i);
		if (cam.name === cameraName)
		{
			resultCam = cam;
			find = true;
		}
		i++;
	}
	
	return resultCam;
};

/**
 * Get the number of the CCTV in this list 
 * @return {Number} count
 */
CCTVList.prototype.getCCTVCount = function()
{
	return this.camerasList.length;
};

/**
 * Update the properties of the list of CCTV with current time and render the view that each CCTV show
 * @param {MagoManager} magoManager
 * @param shader
 */
CCTVList.prototype.render = function(magoManager, shader)
{
	var cctvsCount = this.getCCTVCount();
	
	if (cctvsCount === 0)
	{ return; }
	
	var gl = magoManager.sceneState.gl;
	shader.resetLastBuffersBinded();
	var shaderProgram = shader.program;
		
	gl.useProgram(shaderProgram);
	gl.uniform1i(shader.bApplySpecularLighting_loc, false);
	gl.disableVertexAttribArray(shader.texCoord2_loc);
	gl.enableVertexAttribArray(shader.position3_loc);
	gl.enableVertexAttribArray(shader.normal3_loc);
		
	shader.bindUniformGenerals();
	gl.uniform1i(shader.textureFlipYAxis_loc, magoManager.sceneState.textureFlipYAxis);
	
	gl.uniform1i(shader.colorType_loc, 0); // 0= oneColor, 1= attribColor, 2= texture.***

	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, magoManager.depthFboNeo.colorBuffer);  // original.***
	gl.activeTexture(gl.TEXTURE1);
	gl.bindTexture(gl.TEXTURE_2D, magoManager.noiseTexture);
	gl.activeTexture(gl.TEXTURE2);
	gl.bindTexture(gl.TEXTURE_2D, magoManager.textureAux_1x1);
	shader.last_tex_id = magoManager.textureAux_1x1;
		
	magoManager.renderer.renderTexture = false;
	var currTime = new Date().getTime();
		
	for (var i=0; i<cctvsCount; i++)
	{
		var cctv = this.getCCTV(i);
		cctv.updateColor(currTime);
		cctv.updateOrientation(currTime);
		cctv.render(gl, magoManager, shader);
		cctv.updateTime(currTime);
	}
	
	if (this.bDrawCCTVNames !== undefined && this.bDrawCCTVNames === true)
	{
		magoManager.drawCCTVNames(this.camerasList);
	}
	
	shader.disableVertexAttribArrayAll();
};
































