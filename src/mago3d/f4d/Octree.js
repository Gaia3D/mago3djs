'use strict';

/**
 * 어떤 일을 하고 있습니까?
 * @class Octree
 *
 * @param octreeOwner 변수
 */
var Octree = function(octreeOwner) 
{
	if (!(this instanceof Octree)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	// Note: an octree is a cube, not a box.***
	this.centerPos = new Point3D();
	this.half_dx = 0.0; // half width.***
	this.half_dy = 0.0; // half length.***
	this.half_dz = 0.0; // half height.***

	this.octree_owner;
	this.octree_level = 0;
	this.octree_number_name = 0;
	this.neoBuildingOwnerId;
	this.neoBuildingOwner;
	this.octreeKey; // ownerBuilding_ID + octreeNumberName, so is unique.***
	this.lod; // lod can be 0, 1 or 2...***
	this.distToCamera;
	this.triPolyhedronsCount = 0; // no calculated. Readed when parsing.***
	this.fileLoadState = CODE.fileLoadState.READY;

	if (octreeOwner) 
	{
		this.octree_owner = octreeOwner;
		this.octree_level = octreeOwner.octree_level + 1;
	}

	this.subOctrees_array = [];
	this.neoReferencesMotherAndIndices; // Asimetric mode.***
	this.lowestOctrees_array; // pre extract lowestOctrees for speedUp, if this is motherOctree.***

	// now, for legoStructure.***
	this.lego; // NetSurfaceMesh or pCloud.***
	
	// PointsCloud pyramidOctree data.***
	this.pCloudPartitionsCount; // pointsCloud-pyramid-tree mode.***
	this.pCloudPartitionsArray;
	
	// v002.***
	this.blocksListsPartitionsCount;
	this.blocksListsPartitionsParsedCount;
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns subOctree 변수
 */
Octree.prototype.new_subOctree = function() 
{
	var subOctree = new Octree(this);
	subOctree.octree_level = this.octree_level + 1;
	this.subOctrees_array.push(subOctree);
	return subOctree;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param treeDepth 변수
 */
Octree.prototype.deleteObjectsModelReferences = function(gl, vboMemManager) 
{
	if (this.neoReferencesMotherAndIndices)
	{ this.neoReferencesMotherAndIndices.deleteObjects(gl, vboMemManager); }

	this.neoReferencesMotherAndIndices = undefined;

	// delete the blocksList.***
	if (this.neoRefsList_Array !== undefined) 
	{
		for (var i=0, neoRefListsCount = this.neoRefsList_Array.length; i<neoRefListsCount; i++) 
		{
			if (this.neoRefsList_Array[i]) 
			{
				this.neoRefsList_Array[i].deleteObjects(gl, vboMemManager);
			}
			this.neoRefsList_Array[i] = undefined;
		}
		this.neoRefsList_Array = undefined;
	}

	if (this.subOctrees_array !== undefined) 
	{
		for (var i=0, subOctreesCount = this.subOctrees_array.length; i<subOctreesCount; i++) 
		{
			this.subOctrees_array[i].deleteObjectsModelReferences(gl, vboMemManager);
		}
	}
};

/**
 * 어떤 일을 하고 있습니까?
 * @param treeDepth 변수
 */
Octree.prototype.deleteObjectsLego = function(gl, vboMemManager) 
{
	if (this.lego !== undefined) 
	{
		// deletes the geometry and the texture.***
		this.lego.deleteObjects(gl, vboMemManager);
		this.lego = undefined;
	}
	
	if (this.subOctrees_array !== undefined) 
	{
		for (var i=0, subOctreesCount = this.subOctrees_array.length; i<subOctreesCount; i++) 
		{
			this.subOctrees_array[i].deleteObjectsLego(gl, vboMemManager);
		}
	}
	
};

/**
 * Deletes all objects of the octree.
 * @param gl : current gl.
 * @param vboMemManager : gpu memory manager
 */
Octree.prototype.deleteObjects = function(gl, vboMemManager) 
{
	if (this.lego !== undefined) 
	{
		this.lego.deleteObjects(gl, vboMemManager);
		this.lego = undefined;
	}
	
	this.legoDataArrayBuffer = undefined;
	if (this.centerPos)
	{ this.centerPos.deleteObjects(); }
	this.centerPos = undefined;
	this.half_dx = undefined; // half width.***
	this.half_dy = undefined; // half length.***
	this.half_dz = undefined; // half height.***

	this.octree_owner = undefined;
	this.octree_level = undefined;
	this.octree_number_name = undefined;
	this.distToCamera = undefined;
	this.triPolyhedronsCount = undefined; // no calculated. Readed when parsing.***
	this.fileLoadState = undefined; // 0 = no started to load. 1 = started loading. 2 = finished loading. 3 = parse started. 4 = parse finished.***

	this.neoBuildingOwner = undefined;

	if (this.neoReferencesMotherAndIndices)
	{ this.neoReferencesMotherAndIndices.deleteObjects(gl, vboMemManager); }

	this.neoReferencesMotherAndIndices = undefined;

	// delete the blocksList.***
	if (this.neoRefsList_Array !== undefined) 
	{
		for (var i=0, neoRefListsCount = this.neoRefsList_Array.length; i<neoRefListsCount; i++) 
		{
			if (this.neoRefsList_Array[i]) 
			{
				this.neoRefsList_Array[i].deleteObjects(gl, vboMemManager);
			}
			this.neoRefsList_Array[i] = undefined;
		}
		this.neoRefsList_Array = undefined;
	}
	
	// before deleteting child:
	this.deletePCloudObjects(gl, vboMemManager);

	if (this.subOctrees_array !== undefined) 
	{
		for (var i=0, subOctreesCount = this.subOctrees_array.length; i<subOctreesCount; i++) 
		{
			this.subOctrees_array[i].deleteObjects(gl, vboMemManager);
			this.subOctrees_array[i] = undefined;
		}
		this.subOctrees_array = undefined;
	}
	
	
};

/**
 * Deletes pointsCloud objects of the octree.
 * @param gl : current gl.
 * @param vboMemManager : gpu memory manager
 */
Octree.prototype.deletePCloudObjects = function(gl, vboMemManager) 
{
	//this.pCloudPartitionsCount; // pointsCloud-pyramid-tree mode.***
	//this.pCloudPartitionsArray;
	
	if (this.pCloudPartitionsArray !== undefined)
	{ 
	
		var pCloudPartitionsCount = this.pCloudPartitionsArray.length;
		for (var i=0; i<pCloudPartitionsCount; i++)
		{
			var pCloudPartition = this.pCloudPartitionsArray[i];
			// Note: provisionally "pCloudPartition" is a lego class object.***
			pCloudPartition.deleteObjects(gl, vboMemManager);
		}
		
		this.pCloudPartitionsArray = undefined;
	}
	
	// Now, delete child.***
	if (this.subOctrees_array !== undefined)
	{
		var childsCount = this.subOctrees_array.length;
		for (var i=0; i<childsCount; i++)
		{
			var subOctree = this.subOctrees_array[i];
			subOctree.deletePCloudObjects(gl, vboMemManager);
		}
	}
};

/**
 * 어떤 일을 하고 있습니까?
 * @param treeDepth 변수
 */
Octree.prototype.deleteLod0GlObjects = function(gl, vboMemManager) 
{
	if (this.neoReferencesMotherAndIndices)
	{ this.neoReferencesMotherAndIndices.deleteObjects(gl, vboMemManager); }

	if (this.subOctrees_array !== undefined) 
	{
		for (var i=0, subOctreesCount = this.subOctrees_array.length; i<subOctreesCount; i++) 
		{
			this.subOctrees_array[i].deleteLod0GlObjects(gl, vboMemManager);
		}
	}
};

/**
 * 어떤 일을 하고 있습니까?
 * @param treeDepth 변수
 */
Octree.prototype.deleteLod2GlObjects = function(gl, vboMemManager) 
{
	if (this.lego !== undefined) 
	{
		this.lego.deleteObjects(gl, vboMemManager);
		this.lego = undefined;
	}
	
	if (this.neoReferencesMotherAndIndices)
	{ this.neoReferencesMotherAndIndices.deleteObjects(gl, vboMemManager); }

	if (this.subOctrees_array !== undefined) 
	{
		for (var i=0, subOctreesCount = this.subOctrees_array.length; i<subOctreesCount; i++) 
		{
			this.subOctrees_array[i].deleteLod2GlObjects(gl, vboMemManager);
		}
	}
};

/**
 * 어떤 일을 하고 있습니까?
 * @param treeDepth 변수
 */
Octree.prototype.makeTree = function(treeDepth) 
{
	if (this.octree_level < treeDepth) 
	{
		for (var i=0; i<8; i++) 
		{
			var subOctree = this.new_subOctree();
			subOctree.octree_number_name = this.octree_number_name * 10 + (i+1);
			subOctree.neoBuildingOwnerId = this.neoBuildingOwnerId;
			subOctree.octreeKey = this.neoBuildingOwnerId + "_" + subOctree.octree_number_name;
		}

		this.setSizesSubBoxes();

		for (var i=0; i<8; i++) 
		{
			this.subOctrees_array[i].makeTree(treeDepth);
		}
	}
};

/**
 * 어떤 일을 하고 있습니까?
 */
Octree.prototype.prepareData = function(magoManager) 
{
	// Function no used. Under construction.***
	// This function prepares data in function of the current lod.***
	if (this.lod < 2)
	{
		// Must prepare modelRefList data.***
		this.prepareModelReferencesListData(magoManager);
	}
	else if (this.lod >= 2)
	{
		// Must prepare skin data.***
		this.prepareSkinData(magoManager);
	}
};

/**
 * 어떤 일을 하고 있습니까?
 */
Octree.prototype.prepareSkinData = function(magoManager) 
{
	if (this.octree_number_name === undefined)
	{ return; }
	
	if (this.lego === undefined) 
	{
		this.lego = new Lego();
		this.lego.birthTime = magoManager.currTime;
		this.lego.fileLoadState = CODE.fileLoadState.READY;
		this.lego.legoKey = this.octreeKey + "_lego";
	}

	var neoBuilding = this.neoBuildingOwner;
	if (neoBuilding === undefined)
	{ return; }
	
	var gl = magoManager.sceneState.gl;
	var geometryDataPath = magoManager.readerWriter.geometryDataPath;
	var projectFolderName = neoBuilding.projectFolderName;
	var buildingFolderName = neoBuilding.buildingFileName;
	
	var headerVersion = neoBuilding.getHeaderVersion();

	if (this.lego.fileLoadState === CODE.fileLoadState.READY)
	{
		// must load the legoStructure of the lowestOctree.***
		var subOctreeNumberName = this.octree_number_name.toString();
		var bricks_folderPath = geometryDataPath + "/" + projectFolderName + "/" + buildingFolderName + "/Bricks";
		var filePathInServer = bricks_folderPath + "/" + subOctreeNumberName + "_Brick";

		// finally check if there are legoSimpleBuildingTexture.***
		if (headerVersion[0] === "v")
		{
			if (this.lego.vbo_vicks_container.vboCacheKeysArray[0] && this.lego.vbo_vicks_container.vboCacheKeysArray[0].meshTexcoordsCacheKey)
			{
				// this is the old version.***
				if (neoBuilding.simpleBuilding3x3Texture === undefined)
				{
					neoBuilding.simpleBuilding3x3Texture = new Texture();
					var buildingFolderName = neoBuilding.buildingFileName;
					var texFilePath = geometryDataPath + "/" + projectFolderName + "/" + buildingFolderName + "/SimpleBuildingTexture3x3.png";
				}
				
				// Direct loading.***
				if (neoBuilding.simpleBuilding3x3Texture !== undefined && neoBuilding.simpleBuilding3x3Texture.fileLoadState === CODE.fileLoadState.READY)
				{ 
					magoManager.readerWriter.readLegoSimpleBuildingTexture(gl, texFilePath, neoBuilding.simpleBuilding3x3Texture, magoManager); 
				}
				
				magoManager.readerWriter.getOctreeLegoArraybuffer(filePathInServer, this, magoManager);
				
			}
			else 
			{
				// there are no texture in this project.***
				magoManager.readerWriter.getOctreeLegoArraybuffer(filePathInServer, this, magoManager);
				
			}
		}
		else 
		{
			// This is the version 001.***
			if (neoBuilding.simpleBuilding3x3Texture === undefined)
			{
				neoBuilding.simpleBuilding3x3Texture = new Texture();
			}

			var imageFilaName = neoBuilding.getImageFileNameForLOD(2);
			var texFilePath = geometryDataPath + "/" + projectFolderName + "/" + buildingFolderName + "/" + imageFilaName;

			// Direct loading.***
			if (neoBuilding.simpleBuilding3x3Texture !== undefined && neoBuilding.simpleBuilding3x3Texture.fileLoadState === CODE.fileLoadState.READY)
			{ 
				magoManager.readerWriter.readLegoSimpleBuildingTexture(gl, texFilePath, neoBuilding.simpleBuilding3x3Texture, magoManager); 
			}
			
			magoManager.readerWriter.getOctreeLegoArraybuffer(filePathInServer, this, magoManager);
		}
	}
};

/**
 * 어떤 일을 하고 있습니까?
 */
Octree.prototype.prepareModelReferencesListData = function(magoManager) 
{
	var neoBuilding = this.neoBuildingOwner;
		
	// 1rst check possibles errors.***
	if (neoBuilding === undefined)
	{ return; }
	
	if (this.triPolyhedronsCount === 0) 
	{ return; }
	
	if (this.octree_number_name === undefined)
	{ return; }

	// Check the version.***
	var version = neoBuilding.getHeaderVersion();
	if (version === "0.0.2")
	{
		this.prepareModelReferencesListData_v002(magoManager);
		return;
	}

	var geometryDataPath = magoManager.readerWriter.geometryDataPath;
	var buildingFolderName = neoBuilding.buildingFileName;
	var projectFolderName = neoBuilding.projectFolderName;
	
	if (this.neoReferencesMotherAndIndices === undefined)
	{
		this.neoReferencesMotherAndIndices = new NeoReferencesMotherAndIndices();
		this.neoReferencesMotherAndIndices.motherNeoRefsList = neoBuilding.motherNeoReferencesArray;
	}
	
	if (this.neoReferencesMotherAndIndices.fileLoadState === CODE.fileLoadState.READY)
	{
		if (this.neoReferencesMotherAndIndices.blocksList === undefined)
		{ this.neoReferencesMotherAndIndices.blocksList = new BlocksList("0.0.1"); }

		var subOctreeNumberName = this.octree_number_name.toString();
		var references_folderPath = geometryDataPath + "/" + projectFolderName + "/" + buildingFolderName + "/References";
		var intRef_filePath = references_folderPath + "/" + subOctreeNumberName + "_Ref";
		magoManager.readerWriter.getNeoReferencesArraybuffer(intRef_filePath, this, magoManager);
	}
	
	
	// 4 = parsed.***
	// now, check if the blocksList is loaded & parsed.***
	var blocksList = this.neoReferencesMotherAndIndices.blocksList;
	if (blocksList === undefined)
	{ return; }
	if (blocksList.fileLoadState === CODE.fileLoadState.READY) 
	{
		// must read blocksList.***
		var subOctreeNumberName = this.octree_number_name.toString();
		var blocks_folderPath = geometryDataPath + "/" + projectFolderName + "/" + buildingFolderName + "/Models";
		var filePathInServer = blocks_folderPath + "/" + subOctreeNumberName + "_Model";
		magoManager.readerWriter.getNeoBlocksArraybuffer(filePathInServer, this, magoManager);
	}

};

/**
 * 어떤 일을 하고 있습니까?
 */
Octree.prototype.prepareModelReferencesListData_v002 = function(magoManager) 
{
	var neoBuilding = this.neoBuildingOwner;
		
	// 1rst check possibles errors.***
	if (neoBuilding === undefined)
	{ return; }
	
	if (this.triPolyhedronsCount === 0) 
	{ return; }
	
	if (this.octree_number_name === undefined)
	{ return; }

	var geometryDataPath = magoManager.readerWriter.geometryDataPath;
	var buildingFolderName = neoBuilding.buildingFileName;
	var projectFolderName = neoBuilding.projectFolderName;
	
	if (this.neoReferencesMotherAndIndices === undefined)
	{
		this.neoReferencesMotherAndIndices = new NeoReferencesMotherAndIndices();
		this.neoReferencesMotherAndIndices.motherNeoRefsList = neoBuilding.motherNeoReferencesArray;
	}
	
	if (this.neoReferencesMotherAndIndices.fileLoadState === CODE.fileLoadState.READY)
	{
		if (this.neoReferencesMotherAndIndices.blocksList === undefined)
		{ 
			var blocksList = new BlocksList("0.0.2"); 
			this.neoReferencesMotherAndIndices.blocksList = blocksList; 
			
			// Set blocksList partitionData.***
			blocksList.blocksArrayPartitionsCount = this.blocksListsPartitionsCount;

			var subOctreeNumberName = this.octree_number_name.toString();
			var blocks_folderPath = geometryDataPath + "/" + projectFolderName + "/" + buildingFolderName + "/Models";
			var masterPathName = blocks_folderPath + "/" + subOctreeNumberName + "_Model_";
			blocksList.blocksArrayPartitionsMasterPathName = masterPathName;
		}

		var subOctreeNumberName = this.octree_number_name.toString();
		var references_folderPath = geometryDataPath + "/" + projectFolderName + "/" + buildingFolderName + "/References";
		var intRef_filePath = references_folderPath + "/" + subOctreeNumberName + "_Ref";
		magoManager.readerWriter.getNeoReferencesArraybuffer(intRef_filePath, this, magoManager);
	}
	
	// BlocksList: must distinguish v001 to v002.***
	// In v002, the blocksList is conformed by partitions.***
	var blocksList = this.neoReferencesMotherAndIndices.blocksList;
	if (blocksList === undefined)
	{ return; }

	// if (blocksList.fileLoadState === CODE.fileLoadState.READY) 
	
	// Load blocksListsPartition.***

	//if(this.blocksListsPartitionsParsedCount === undefined)
	//	this.blocksListsPartitionsParsedCount = 0;

	
	blocksList.prepareData(magoManager, this);
	
	/*
	var partitionIdx = this.blocksListsPartitionsParsedCount;
	if (partitionIdx < this.blocksListsPartitionsCount)
	{
		var subOctreeNumberName = this.octree_number_name.toString();
		var blocks_folderPath = geometryDataPath + "/" + projectFolderName + "/" + buildingFolderName + "/Models";
		var filePathInServer = blocks_folderPath + "/" + subOctreeNumberName + "_Model_" + partitionIdx.toString();
		magoManager.readerWriter.getNeoBlocksArraybuffer_partition(filePathInServer, this, magoManager);
	}
	*/
};

/**
 * 어떤 일을 하고 있습니까?
 * @param intNumber 변수
 * @returns numDigits
 */
Octree.prototype.renderSkin = function(magoManager, neoBuilding, renderType, renderTexture, shader) 
{
	var gl = magoManager.sceneState.gl;
	if (this.lego === undefined) 
	{
		this.lego = new Lego();
		this.lego.fileLoadState = CODE.fileLoadState.READY;
		this.lego.legoKey = this.octreeKey + "_lego";
		return false;
	}
	
	if (this.lego.fileLoadState !== CODE.fileLoadState.PARSE_FINISHED)
	{ return false; }

	// if the building is highlighted, the use highlight oneColor4.*********************
	renderTexture = true;
	gl.uniform1i(shader.refMatrixType_loc, 0); // in this case, there are not referencesMatrix.***
	if (renderType === 1)
	{
		// Solve the color or texture of the skin.***
		if (neoBuilding.isHighLighted)
		{
			gl.uniform1i(shader.colorType_loc, 0); // 0= oneColor, 1= attribColor, 2= texture.***
			gl.uniform4fv(shader.oneColor4_loc, this.highLightColor4); //.***
			renderTexture = false;
		}
		else if (neoBuilding.isColorChanged)
		{
			gl.uniform1i(shader.colorType_loc, 0); // 0= oneColor, 1= attribColor, 2= texture.***
			gl.uniform4fv(shader.oneColor4_loc, [neoBuilding.aditionalColor.r, neoBuilding.aditionalColor.g, neoBuilding.aditionalColor.b, neoBuilding.aditionalColor.a]); //.***
			renderTexture = false;
		}

		//----------------------------------------------------------------------------------
		
		if (neoBuilding.simpleBuilding3x3Texture !== undefined && neoBuilding.simpleBuilding3x3Texture.texId && renderTexture)
		{
			// Provisionally flip tex coords here.***
			gl.uniform1i(shader.textureFlipYAxis_loc, false);//.ppp
			gl.uniform1i(shader.colorType_loc, 2); // 0= oneColor, 1= attribColor, 2= texture.***
			if (shader.last_tex_id !== neoBuilding.simpleBuilding3x3Texture.texId)
			{
				//gl.activeTexture(gl.TEXTURE2); 
				gl.bindTexture(gl.TEXTURE_2D, neoBuilding.simpleBuilding3x3Texture.texId);
				shader.last_tex_id = neoBuilding.simpleBuilding3x3Texture.texId;
			}
		}
		else 
		{
			// Todo: If this building lod2 has no texture, then render with colors.***
			//gl.uniform1i(shader.colorType_loc, 0); // 0= oneColor, 1= attribColor, 2= texture.***
			//shader.disableVertexAttribArray(shader.texCoord2_loc);
			//renderTexture = false;
			//-------------------------------------------------------------------------
			
			// If texture is no ready then return.***
			return false;
		}
	}
	else if (renderType === 2)
	{
		// Color selction mode.***
		var colorAux;
		colorAux = magoManager.selectionColor.getAvailableColor(colorAux);
		var idxKey = magoManager.selectionColor.decodeColor3(colorAux.r, colorAux.g, colorAux.b);
		var currentObjectsRendering = magoManager.renderer.currentObjectsRendering;
		var currentNode = currentObjectsRendering.curNode;
		magoManager.selectionManager.setCandidates(idxKey, undefined, this, neoBuilding, currentNode);
		
		gl.uniform1i(shader.colorType_loc, 0); // 0= oneColor, 1= attribColor, 2= texture.***
		gl.uniform4fv(shader.oneColor4_loc, [colorAux.r/255.0, colorAux.g/255.0, colorAux.b/255.0, 1.0]);
	}
	
	return this.lego.render(magoManager, renderType, renderTexture, shader);
};



/**
 * 어떤 일을 하고 있습니까?
 * @param intNumber 변수
 * @returns numDigits
 */
Octree.prototype.renderContent = function(magoManager, neoBuilding, renderType, renderTexture, shader, minSizeToRender, refMatrixIdxKey, flipYTexCoord) 
{
	// the content of the octree is "neoReferencesMotherAndIndices" & the netSurfaceMesh called "lego".***
	// This function renders the "neoReferencesMotherAndIndices" or the lego.***
	var rendered = false;
	var gl = magoManager.sceneState.gl;

	if (this.lod < 2)
	{
		// 1rst check if the "neoReferencesMotherAndIndices" is ready to be rendered.***
		if (this.neoReferencesMotherAndIndices === undefined)
		{ return; }
		gl.uniform1i(shader.textureFlipYAxis_loc, flipYTexCoord);//.ppp
		rendered = this.neoReferencesMotherAndIndices.render(magoManager, neoBuilding, renderType, renderTexture, shader, minSizeToRender, refMatrixIdxKey);
		if (!rendered)
		{
			// render the skinLego.***
			rendered = this.renderSkin(magoManager, neoBuilding, renderType, renderTexture, shader);
		}
	}
	else if (this.lod === 2)
	{
		// Render the skinLego.***
		rendered = this.renderSkin(magoManager, neoBuilding, renderType, renderTexture, shader);
	}
	
	return rendered;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param intNumber 변수
 * @returns numDigits
 */
Octree.prototype.preparePCloudData = function(magoManager, neoBuilding) 
{
	if (this.pCloudPartitionsCount === undefined && this.pCloudPartitionsCount === 0)
	{ return; }

	if (neoBuilding === undefined)
	{ return; }
	
	if (this.pCloudPartitionsArray === undefined)
	{ this.pCloudPartitionsArray = []; }
	
	var pCloudPartitionsCount = this.pCloudPartitionsCount;
		
	if (this.lod === 0)
	{ 
		pCloudPartitionsCount = Math.ceil(pCloudPartitionsCount/4); 
		if (pCloudPartitionsCount > 25)
		{ pCloudPartitionsCount = 25; }
	}
	if (this.lod === 1)
	{ 
		pCloudPartitionsCount = Math.ceil(pCloudPartitionsCount/4); 
		if (pCloudPartitionsCount > 10)
		{ pCloudPartitionsCount = 10; }
	}
	else if (this.lod > 1)
	{ pCloudPartitionsCount = 1; }

	// Temporary total limiting:
	//if(pCloudPartitionsCount > 15)
	//	pCloudPartitionsCount = 15;
	
	for (var i=0; i<pCloudPartitionsCount; i++)
	{
		if ( i < this.pCloudPartitionsArray.length )
		{
			// Note: "pCloudPartition" is a Lego class object provisionally.***
			var pCloudPartition = this.pCloudPartitionsArray[i];
			if (pCloudPartition !== undefined && pCloudPartition.fileLoadState === CODE.fileLoadState.LOADING_FINISHED)
			{
				// Parse data.***
				if (magoManager.parseQueue.pCloudPartitionsParsed < 2)
				{
					var gl = magoManager.sceneState.gl;
					pCloudPartition.parsePointsCloudData(pCloudPartition.dataArrayBuffer, gl, magoManager);
					magoManager.parseQueue.pCloudPartitionsParsed++;
					return true;
				}
				if (magoManager.parseQueue.pCloudPartitionsParsed >= 2)
				{ return true; }
			}
			
		}
		else
		{
			// Create the pCloudPartition.***
			var readWriter = magoManager.readerWriter;

			if (readWriter.pCloudPartitions_requested < 1 && magoManager.vboMemoryManager.currentMemoryUsage < magoManager.vboMemoryManager.buffersKeyWorld.bytesLimit/1.5)
			{
				var pCloudPartitionLego = new Lego();
				this.pCloudPartitionsArray.push(pCloudPartitionLego);
				pCloudPartitionLego.legoKey = this.octreeKey + "_" + i.toString();
					
				var projectFolderName = neoBuilding.projectFolderName;
				var buildingFolderName = neoBuilding.buildingFileName;
				var geometryDataPath = magoManager.readerWriter.geometryDataPath;
				var subOctreeNumberName = this.octree_number_name.toString();
				var references_folderPath = geometryDataPath + "/" + projectFolderName + "/" + buildingFolderName + "/References";
				var filePath = references_folderPath + "/" + subOctreeNumberName + "_Ref_" + i.toString(); // in this case the fileName is fixed.***
					
				readWriter.getOctreePCloudPartitionArraybuffer(filePath, this, pCloudPartitionLego, magoManager);
				return true;
			}
			
		}
	}
	
	return false;
	
};


/**
 * 어떤 일을 하고 있습니까?
 * @param intNumber 변수
 * @returns numDigits
 */
Octree.prototype.test__renderPCloud = function(magoManager, neoBuilding, renderType, shader, relativeCam, bPrepareData) 
{
	// Test function to render octreePyramid-pointsCloud.***
	// 1rst, check the number of partitions of data.***
	var partitionsCount = this.pCloudPartitionsCount;
	
	if (partitionsCount === undefined || partitionsCount === 0)
	{ return; }
	
	// Determine the distance from camera.***
	var magoPolicy = magoManager.magoPolicy;
	var camera = magoManager.sceneState.camera;
	var cullingVolume = relativeCam.bigFrustum;
	
	// To calculate distToCamera use the relativeCamera.***
	var cameraPosition = relativeCam.position;
	var distCenterToCamera = this.centerPos.distToPoint(cameraPosition);
	var distToCamera = distCenterToCamera - this.getRadiusAprox();
	this.distToCamera = distToCamera; // distCenterToCamera.***
	
	// Put this octree into magoManager.visibleObjControlerPCloudOctrees, to load after.*** 
	if (renderType === 0) // Note: It can be "renderType === 0" or "renderType === 1". The important is do this only once a frame.***
	{
		var vocPCloudOctrees = magoManager.visibleObjControlerPCloudOctrees;
		vocPCloudOctrees.putObjectToArraySortedByDist(vocPCloudOctrees.currentVisibles0, this);
	}
	
	// Provisionally, determine the LOD level by "distToCam".***
	this.lod = magoPolicy.getLod(distToCamera);
	
	// Provisionally compare "this.lod" with "this.octreeLevel".***
	
	
	var gl = magoManager.sceneState.gl;
	var ssao_idx = 1;
	
	var frustumCull = this.intersectionFrustum(cullingVolume, magoManager.boundingSphere_Aux);
	if (frustumCull !== Constant.INTERSECTION_OUTSIDE ) 
	{
		// Erase from deleting queue.***
		magoManager.processQueue.eraseOctreeToDeletePCloud(this);
		
		var ssao_idx = 1;
		if (this.pCloudPartitionsArray === undefined)
		{ return; }
		
		var pCloudPartitionsCount = this.pCloudPartitionsArray.length;
		
		if (this.lod === 0)
		{
			pCloudPartitionsCount = Math.ceil(pCloudPartitionsCount/2);
			if (pCloudPartitionsCount > 25)
			{ pCloudPartitionsCount = 25; }
		}
		else if (this.lod === 1)
		{
			pCloudPartitionsCount = Math.ceil(pCloudPartitionsCount/2);
			if (pCloudPartitionsCount > 10)
			{ pCloudPartitionsCount = 10; }
		}
		else if (this.lod > 1)
		{ 
			pCloudPartitionsCount = 1; 
		}

		
		for (var i=0; i<pCloudPartitionsCount; i++)
		{
			var pCloudPartition = this.pCloudPartitionsArray[i];
			if (pCloudPartition !== undefined && pCloudPartition.fileLoadState === CODE.fileLoadState.PARSE_FINISHED)
			{
				// render.***
				var posCompressed = pCloudPartition.bPositionsCompressed;
				gl.uniform1i(shader.bPositionCompressed_loc, posCompressed);
				var bbox = pCloudPartition.bbox;
				gl.uniform3fv(shader.bboxSize_loc, [bbox.getXLength(), bbox.getYLength(), bbox.getZLength()]); //.***
				gl.uniform3fv(shader.minPosition_loc, [bbox.minX, bbox.minY, bbox.minZ]); //.***
				
				magoManager.renderer.renderPCloud(gl, pCloudPartition, magoManager, shader, renderType, distToCamera, this.lod);
			}
		}
		
		
		for (var i=0, subOctreesArrayLength = this.subOctrees_array.length; i<subOctreesArrayLength; i++ ) 
		{
			var subOctree = this.subOctrees_array[i];
			subOctree.test__renderPCloud(magoManager, neoBuilding, renderType, shader, relativeCam, bPrepareData);
		}
		
	}
	else
	{
		// Delete unnecessary objects if ditToCam is big.***
		if (distToCamera > 50.0)
		{
			// Put octree to delete pCloud, but before, delete from the parseQueue.***
			if (this.pCloudPartitionsArray !== undefined)
			{
				var pCloudPartitionsCount = this.pCloudPartitionsArray.length;
				for (var i=0; i<pCloudPartitionsCount; i++)
				{
					var pCloudPartition = this.pCloudPartitionsArray[i];
					magoManager.parseQueue.eraseOctreePCloudPartitionToParse(pCloudPartition);
				}
			}
			
			// Put octree to delete pCloud.***
			magoManager.processQueue.putOctreeToDeletePCloud(this);
		}
	}
};



/**
 * 어떤 일을 하고 있습니까?
 * @param intNumber 변수
 * @returns numDigits
 */
Octree.prototype.getNumberOfDigits = function(intNumber) 
{
	if (intNumber > 0) 
	{
		var numDigits = Math.floor(Math.log10(intNumber)+1);
		return numDigits;
	}
	else 
	{
		return 1;
	}
};

/**
 * 어떤 일을 하고 있습니까?
 */
Octree.prototype.getMotherOctree = function() 
{
	if (this.octree_owner === undefined) { return this; }

	return this.octree_owner.getMotherOctree();
};

/**
 * 어떤 일을 하고 있습니까?
 * @param octreeNumberName 변수
 * @param numDigits 변수
 * @returns subOctrees_array[idx-1].getOctree(rest_octreeNumberName, numDigits-1)
 */
Octree.prototype.getOctree = function(octreeNumberName, numDigits) 
{
	if (numDigits === 1) 
	{
		if (octreeNumberName === 0) { return this.getMotherOctree(); }
		else { return this.subOctrees_array[octreeNumberName-1]; }
	}

	// determine the next level octree.***
	var exp = numDigits-1;
	var denominator = Math.pow(10, exp);
	var idx = Math.floor(octreeNumberName /denominator) % 10;
	var rest_octreeNumberName = octreeNumberName - idx * denominator;
	return this.subOctrees_array[idx-1].getOctree(rest_octreeNumberName, numDigits-1);
};

/**
 * 어떤 일을 하고 있습니까?
 * @param octreeNumberName 변수
 * @returns motherOctree.subOctrees_array[idx-1].getOctree(rest_octreeNumberName, numDigits-1)
 */
Octree.prototype.getOctreeByNumberName = function(octreeNumberName) 
{
	var motherOctree = this.getMotherOctree();
	var numDigits = this.getNumberOfDigits(octreeNumberName);
	if (numDigits === 1) 
	{
		if (octreeNumberName === 0) { return motherOctree; }
		else { return motherOctree.subOctrees_array[octreeNumberName-1]; }
	}

	if (motherOctree.subOctrees_array.length === 0) { return undefined; }

	// determine the next level octree.***
	var exp = numDigits-1;
	var denominator = Math.pow(10, exp);
	var idx = Math.floor(octreeNumberName /denominator) % 10;
	var rest_octreeNumberName = octreeNumberName - idx * denominator;
	return motherOctree.subOctrees_array[idx-1].getOctree(rest_octreeNumberName, numDigits-1);
};

/**
 * 어떤 일을 하고 있습니까?
 */
Octree.prototype.setSizesSubBoxes = function() 
{
	// Octree number name.********************************
	// Bottom                      Top
	// |---------|---------|     |---------|---------|
	// |         |         |     |         |         |       Y
	// |    3    |    2    |     |    7    |    6    |       ^
	// |         |         |     |         |         |       |
	// |---------+---------|     |---------+---------|       |
	// |         |         |     |         |         |       |
	// |    0    |    1    |     |    4    |    5    |       |
	// |         |         |     |         |         |       |-----------> X
	// |---------|---------|     |---------|---------|

	if (this.subOctrees_array.length > 0) 
	{
		var half_x = this.centerPos.x;
		var half_y = this.centerPos.y;
		var half_z = this.centerPos.z;

		var min_x = this.centerPos.x - this.half_dx;
		var min_y = this.centerPos.y - this.half_dy;
		var min_z = this.centerPos.z - this.half_dz;

		var max_x = this.centerPos.x + this.half_dx;
		var max_y = this.centerPos.y + this.half_dy;
		var max_z = this.centerPos.z + this.half_dz;

		this.subOctrees_array[0].setBoxSize(min_x, half_x, min_y, half_y, min_z, half_z);
		this.subOctrees_array[1].setBoxSize(half_x, max_x, min_y, half_y, min_z, half_z);
		this.subOctrees_array[2].setBoxSize(half_x, max_x, half_y, max_y, min_z, half_z);
		this.subOctrees_array[3].setBoxSize(min_x, half_x, half_y, max_y, min_z, half_z);

		this.subOctrees_array[4].setBoxSize(min_x, half_x, min_y, half_y, half_z, max_z);
		this.subOctrees_array[5].setBoxSize(half_x, max_x, min_y, half_y, half_z, max_z);
		this.subOctrees_array[6].setBoxSize(half_x, max_x, half_y, max_y, half_z, max_z);
		this.subOctrees_array[7].setBoxSize(min_x, half_x, half_y, max_y, half_z, max_z);

		for (var i=0; i<8; i++) 
		{
			this.subOctrees_array[i].setSizesSubBoxes();
		}
	}
};

/**
 * 어떤 일을 하고 있습니까?
 * @param Min_x 변수
 * @param Max_x 변수
 * @param Min_y 변수
 * @param Max_y 변수
 * @param Min_z 변수
 * @param Max_z 변수
 */
Octree.prototype.setBoxSize = function(Min_X, Max_X, Min_Y, Max_Y, Min_Z, Max_Z) 
{
	this.centerPos.x = (Max_X + Min_X)/2.0;
	this.centerPos.y = (Max_Y + Min_Y)/2.0;
	this.centerPos.z = (Max_Z + Min_Z)/2.0;

	this.half_dx = (Max_X - Min_X)/2.0; // half width.***
	this.half_dy = (Max_Y - Min_Y)/2.0; // half length.***
	this.half_dz = (Max_Z - Min_Z)/2.0; // half height.***
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns centerPos
 */
Octree.prototype.getCenterPos = function() 
{
	return this.centerPos;
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns Math.abs(this.half_dx*1.2);
 */
Octree.prototype.getRadiusAprox = function() 
{
	return this.half_dx*1.7;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param result_NeoRefListsArray 변수
 */
Octree.prototype.getNeoRefListArray = function(result_NeoRefListsArray) 
{
	if (result_NeoRefListsArray === undefined) { result_NeoRefListsArray = []; }

	var subOctreesArrayLength = this.subOctrees_array.length;
	if (subOctreesArrayLength > 0) 
	{
		for (var i=0; i<subOctreesArrayLength; i++) 
		{
			this.subOctrees_array[i].getNeoRefListArray(result_NeoRefListsArray);
		}
	}
	else 
	{
		if (this.neoRefsList_Array.length>0) // original.***
		//if(this.triPolyhedronsCount>0)
		{
			result_NeoRefListsArray.push(this.neoRefsList_Array[0]); // there are only 1.***
		}
	}
};

/**
 * 어떤 일을 하고 있습니까?
 * @param cullingVolume 변수
 * @param result_NeoRefListsArray 변수
 * @param boundingSphere_scratch 변수
 * @param eye_x 변수
 * @param eye_y 변수
 * @param eye_z 변수
 */
Octree.prototype.getFrustumVisibleLowestOctreesByLOD = function(cullingVolume, visibleObjControlerOctrees, globalVisibleObjControlerOctrees,
	boundingSphere_scratch, cameraPosition, squaredDistLod0, squaredDistLod1, squaredDistLod2) 
{
	var visibleOctreesArray = [];
	var find = false;

	//this.getAllSubOctrees(visibleOctreesArray); // Test.***
	visibleOctreesArray = this.getFrustumVisibleOctreesNeoBuildingAsimetricVersion(cullingVolume, visibleOctreesArray, boundingSphere_scratch); // Original.***

	// Now, we must sort the subOctrees near->far from eye.***
	var visibleOctrees_count = visibleOctreesArray.length;
	for (var i=0; i<visibleOctrees_count; i++) 
	{
		visibleOctreesArray[i].setDistToCamera(cameraPosition);
	}

	for (var i=0; i<visibleOctrees_count; i++) 
	{
		if (visibleOctreesArray[i].distToCamera < squaredDistLod0) 
		{
			if (visibleOctreesArray[i].triPolyhedronsCount > 0) 
			{
				if (globalVisibleObjControlerOctrees)
				{ this.putOctreeInEyeDistanceSortedArray(globalVisibleObjControlerOctrees.currentVisibles0, visibleOctreesArray[i]); }
				visibleObjControlerOctrees.currentVisibles0.push(visibleOctreesArray[i]);
				visibleOctreesArray[i].lod = 0;
				find = true;
			}
		}
		else if (visibleOctreesArray[i].distToCamera < squaredDistLod1) 
		{
			if (visibleOctreesArray[i].triPolyhedronsCount > 0) 
			{
				if (globalVisibleObjControlerOctrees)
				{ this.putOctreeInEyeDistanceSortedArray(globalVisibleObjControlerOctrees.currentVisibles1, visibleOctreesArray[i]); }
				visibleObjControlerOctrees.currentVisibles1.push(visibleOctreesArray[i]);
				visibleOctreesArray[i].lod = 1;
				find = true;
			}
		}
		else if (visibleOctreesArray[i].distToCamera < squaredDistLod2) 
		{
			if (visibleOctreesArray[i].triPolyhedronsCount > 0) 
			{
				if (globalVisibleObjControlerOctrees)
				{ this.putOctreeInEyeDistanceSortedArray(globalVisibleObjControlerOctrees.currentVisibles2, visibleOctreesArray[i]); }
				visibleObjControlerOctrees.currentVisibles2.push(visibleOctreesArray[i]);
				visibleOctreesArray[i].lod = 2;
				find = true;
			}
		}
		else 
		{
			if (visibleOctreesArray[i].triPolyhedronsCount > 0) 
			{
				if (globalVisibleObjControlerOctrees)
				{ globalVisibleObjControlerOctrees.currentVisibles3.push(visibleOctreesArray[i]); }
				visibleObjControlerOctrees.currentVisibles3.push(visibleOctreesArray[i]);
				visibleOctreesArray[i].lod = 3; // must be 3!!!
				find = true;
			}
		}
	}

	visibleOctreesArray = undefined;
	return find;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param x 변수
 * @param y 변수
 * @param z 변수
 * @returns intersects
 */
Octree.prototype.intersectsWithPoint3D = function(x, y, z) 
{
	//this.centerPos = new Point3D();
	//this.half_dx = 0.0; // half width.***
	//this.half_dy = 0.0; // half length.***
	//this.half_dz = 0.0; // half height.***
	var minX = this.centerPos.x - this.half_dx;
	var minY = this.centerPos.y - this.half_dz;
	var minZ = this.centerPos.z - this.half_dz;
	var maxX = this.centerPos.x + this.half_dx;
	var maxY = this.centerPos.y + this.half_dz;
	var maxZ = this.centerPos.z + this.half_dz;
	
	var intersects = false;
	if (x> minX && x<maxX) 
	{
		if (y> minY && y<maxY) 
		{
			if (z> minZ && z<maxZ) 
			{
				intersects = true;
			}
		}
	}
	
	return intersects;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param x 변수
 * @param y 변수
 * @param z 변수
 * @returns intersectedSubBox
 */
Octree.prototype.getIntersectedSubBoxByPoint3D = function(x, y, z) 
{
	if (this.octree_owner === undefined) 
	{
		// This is the mother_cell.***
		if (!this.intersectsWithPoint3D(x, y, z)) 
		{
			return false;
		}
	}
	
	var intersectedSubBox = undefined;
	var subBoxes_count = this.subOctrees_array.length;
	if (subBoxes_count > 0) 
	{
		var center_x = this.centerPos.x;
		var center_y = this.centerPos.y;
		var center_z = this.centerPos.z;
		
		var intersectedSubBox_aux = undefined;
		var intersectedSubBox_idx;
		if (x<center_x) 
		{
			// Here are the boxes number 0, 3, 4, 7.***
			if (y<center_y) 
			{
				// Here are 0, 4.***
				if (z<center_z) { intersectedSubBox_idx = 0; }
				else { intersectedSubBox_idx = 4; }
			}
			else 
			{
				// Here are 3, 7.***
				if (z<center_z) { intersectedSubBox_idx = 3; }
				else { intersectedSubBox_idx = 7; }
			}
		}
		else 
		{
			// Here are the boxes number 1, 2, 5, 6.***
			if (y<center_y) 
			{
				// Here are 1, 5.***
				if (z<center_z) { intersectedSubBox_idx = 1; }
				else { intersectedSubBox_idx = 5; }
			}
			else 
			{
				// Here are 2, 6.***
				if (z<center_z) { intersectedSubBox_idx = 2; }
				else { intersectedSubBox_idx = 6; }
			}
		}
		
		intersectedSubBox_aux = this.subOctrees_array[intersectedSubBox_idx];
		intersectedSubBox = intersectedSubBox_aux.getIntersectedSubBoxByPoint3D(x, y, z);
		
	}
	else 
	{
		intersectedSubBox = this;
	}
	
	return intersectedSubBox;
};

/**
 * 어떤 일을 하고 있습니까?
 */
Octree.prototype.getMinDistToCamera = function(cameraPosition)
{
	// Old function. dont use this function.***
	// Old function. dont use this function.***
	// Old function. dont use this function.***
	// this function returns the minDistToCamera of the lowestOctrees.***
	var minDistToCam = 1000000.0;
	
	if (this.lowestOctrees_array === undefined)
	{
		this.lowestOctrees_array = [];
		this.extractLowestOctreesIfHasTriPolyhedrons(this.lowestOctrees_array);
	}
	
	var distToCamera;
	var lowestOctree;
	var lowestOctreesCount = this.lowestOctrees_array.length;
	for (var i=0; i<lowestOctreesCount; i++)
	{
		lowestOctree = this.lowestOctrees_array[i];
		distToCamera = lowestOctree.centerPos.distToPoint(cameraPosition) - this.getRadiusAprox();
		if (distToCamera < minDistToCam)
		{ minDistToCam = distToCamera; }
	}
	
	return minDistToCam;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param cullingVolume 변수
 * @param result_NeoRefListsArray 변수
 * @param boundingSphere_scratch 변수
 * @param eye_x 변수
 * @param eye_y 변수
 * @param eye_z 변수
 */
Octree.prototype.extractLowestOctreesByLOD = function(visibleObjControlerOctrees, globalVisibleObjControlerOctrees,
	boundingSphere_scratch, cameraPosition, squaredDistLod0, squaredDistLod1, squaredDistLod2 ) 
{
	var distAux = 0.0;
	var find = false;
	
	var eye_x = cameraPosition.x;
	var eye_y = cameraPosition.y;
	var eye_z = cameraPosition.z;
	if (this.lowestOctrees_array === undefined)
	{
		this.lowestOctrees_array = [];
		this.extractLowestOctreesIfHasTriPolyhedrons(this.lowestOctrees_array);
	}
	
	// Now, we must sort the subOctrees near->far from eye.***
	var visibleOctrees_count = this.lowestOctrees_array.length;
	for (var i=0; i<visibleOctrees_count; i++) 
	{
		this.lowestOctrees_array[i].setDistToCamera(cameraPosition);
	}

	for (var i=0; i<visibleOctrees_count; i++) 
	{
		if (this.lowestOctrees_array[i].distToCamera < squaredDistLod0) 
		{
			if (this.lowestOctrees_array[i].triPolyhedronsCount > 0) 
			{
				if (globalVisibleObjControlerOctrees)
				{ this.putOctreeInEyeDistanceSortedArray(globalVisibleObjControlerOctrees.currentVisibles0, this.lowestOctrees_array[i]); }
				visibleObjControlerOctrees.currentVisibles0.push(this.lowestOctrees_array[i]);
				this.lowestOctrees_array[i].lod = 0;
				find = true;
			}
		}
		else if (this.lowestOctrees_array[i].distToCamera < squaredDistLod1) 
		{
			if (this.lowestOctrees_array[i].triPolyhedronsCount > 0) 
			{
				if (globalVisibleObjControlerOctrees)
				{ this.putOctreeInEyeDistanceSortedArray(globalVisibleObjControlerOctrees.currentVisibles1, this.lowestOctrees_array[i]); }
				visibleObjControlerOctrees.currentVisibles1.push(this.lowestOctrees_array[i]);
				this.lowestOctrees_array[i].lod = 1;
				find = true;
			}
		}
		else if (this.lowestOctrees_array[i].distToCamera < squaredDistLod2) 
		{
			if (this.lowestOctrees_array[i].triPolyhedronsCount > 0) 
			{
				if (globalVisibleObjControlerOctrees)
				{ this.putOctreeInEyeDistanceSortedArray(globalVisibleObjControlerOctrees.currentVisibles2, this.lowestOctrees_array[i]); }
				visibleObjControlerOctrees.currentVisibles2.push(this.lowestOctrees_array[i]);
				this.lowestOctrees_array[i].lod = 2;
				find = true;
			}
		}
		else 
		{
			if (this.lowestOctrees_array[i].triPolyhedronsCount > 0) 
			{
				if (globalVisibleObjControlerOctrees)
				{ globalVisibleObjControlerOctrees.currentVisibles3.push(this.lowestOctrees_array[i]); }
				visibleObjControlerOctrees.currentVisibles3.push(this.lowestOctrees_array[i]);
				this.lowestOctrees_array[i].lod = 3;
				find = true;
			}
		}
	}

	return find;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param cesium_cullingVolume 변수
 * @param result_octreesArray 변수
 * @param boundingSphere_scratch 변수
 */
Octree.prototype.intersectionFrustum = function(cullingVolume, boundingSphere_scratch) 
{
	if (boundingSphere_scratch === undefined) 
	{ boundingSphere_scratch = new Sphere(); } 

	boundingSphere_scratch.centerPoint.x = this.centerPos.x;
	boundingSphere_scratch.centerPoint.y = this.centerPos.y;
	boundingSphere_scratch.centerPoint.z = this.centerPos.z;
	boundingSphere_scratch.r = this.getRadiusAprox();

	return cullingVolume.intersectionSphere(boundingSphere_scratch);
};


/**
 * 어떤 일을 하고 있습니까?
 * @param cesium_cullingVolume 변수
 * @param result_octreesArray 변수
 * @param boundingSphere_scratch 변수
 */
Octree.prototype.getFrustumVisibleOctreesNeoBuildingAsimetricVersion = function(cullingVolume, result_octreesArray, boundingSphere_scratch) 
{
	// cullingVolume: Frustum class.***
	if (this.subOctrees_array === undefined) { return; }

	if (this.subOctrees_array.length === 0 && this.triPolyhedronsCount === 0)
	{ return; }

	if (result_octreesArray === undefined) { result_octreesArray = []; }

	var frustumCull = this.intersectionFrustum(cullingVolume, boundingSphere_scratch);
	if (frustumCull === Constant.INTERSECTION_INSIDE ) 
	{
		this.getAllSubOctreesIfHasRefLists(result_octreesArray);
	}
	else if (frustumCull === Constant.INTERSECTION_INTERSECT  ) 
	{
		if (this.subOctrees_array.length === 0) 
		{
			result_octreesArray.push(this);
		}
		else 
		{
			for (var i=0, subOctreesArrayLength = this.subOctrees_array.length; i<subOctreesArrayLength; i++ ) 
			{
				this.subOctrees_array[i].getFrustumVisibleOctreesNeoBuildingAsimetricVersion(cullingVolume, result_octreesArray, boundingSphere_scratch);
			}
		}
	}
	
	return result_octreesArray;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param cesium_cullingVolume 변수
 * @param result_octreesArray 변수
 * @param boundingSphere_scratch 변수
 */
Octree.prototype.getBBoxIntersectedOctreesNeoBuildingAsimetricVersion = function(bbox, result_octreesArray, bbox_scratch) 
{
	if (this.subOctrees_array === undefined) { return; }

	if (this.subOctrees_array.length === 0 && this.triPolyhedronsCount === 0)
	{ return; }

	if (result_octreesArray === undefined) { result_octreesArray = []; }
	
	if (bbox_scratch === undefined) 
	{ bbox_scratch = new BoundingBox(); } 
	

	bbox_scratch.minX = this.centerPos.x - this.half_dx;
	bbox_scratch.maxX = this.centerPos.x + this.half_dx;
	bbox_scratch.minY = this.centerPos.y - this.half_dy;
	bbox_scratch.maxY = this.centerPos.y + this.half_dy;
	bbox_scratch.minZ = this.centerPos.z - this.half_dz;
	bbox_scratch.maxZ = this.centerPos.z + this.half_dz;

	var intersects = bbox.intersectsWithBBox(bbox_scratch);
	if (intersects)
	{
		this.getAllSubOctreesIfHasRefLists(result_octreesArray);
	}
};

/**
 * 어떤 일을 하고 있습니까?
 * @param eye_x 변수
 * @param eye_y 변수
 * @param eye_z 변수
 */
Octree.prototype.setDistToCamera = function(cameraPosition) 
{
	// distance to camera as a sphere.
	var distToCamera = this.centerPos.distToPoint(cameraPosition) - this.getRadiusAprox();
	this.distToCamera = distToCamera;
	return distToCamera;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param octreesArray 변수
 * @param octree 변수
 * @returns result_idx
 */
Octree.prototype.getIndexToInsertBySquaredDistToEye = function(octreesArray, octree, startIdx, endIdx) 
{
	// this do a dicotomic search of idx in a ordered table.
	// 1rst, check the range.
	if (startIdx === undefined)
	{ startIdx = 0; }
	
	if (endIdx === undefined)
	{ endIdx = octreesArray.length-1; }
	
	var range = endIdx - startIdx;
	
	if (range <= 0)
	{ return 0; }
	
	if (range < 6)
	{
		// in this case do a lineal search.
		var finished = false;
		var i = startIdx;
		var idx;
		var octreesCount = octreesArray.length;
		while (!finished && i<=endIdx)
		{
			if (octree.distToCamera < octreesArray[i].distToCamera)
			{
				idx = i;
				finished = true;
			}
			i++;
		}
		
		if (finished)
		{
			return idx;
		}
		else 
		{
			return endIdx+1;
		}
	}
	else 
	{
		// in this case do the dicotomic search.
		var middleIdx = startIdx + Math.floor(range/2);
		var newStartIdx;
		var newEndIdx;
		if (octreesArray[middleIdx].distToCamera > octree.distToCamera)
		{
			newStartIdx = startIdx;
			newEndIdx = middleIdx;
		}
		else 
		{
			newStartIdx = middleIdx;
			newEndIdx = endIdx;
		}
		return this.getIndexToInsertBySquaredDistToEye(octreesArray, octree, newStartIdx, newEndIdx);
	}
};

/**
 * 어떤 일을 하고 있습니까?
 * @param result_octreesArray 변수
 * @param octree 변수
 */
Octree.prototype.putOctreeInEyeDistanceSortedArray = function(result_octreesArray, octree) 
{
	// sorting is from minDist to maxDist.***
	if (result_octreesArray.length > 0)
	{
		var startIdx = 0;
		var endIdx = result_octreesArray.length - 1;
		var insert_idx= this.getIndexToInsertBySquaredDistToEye(result_octreesArray, octree, startIdx, endIdx);

		result_octreesArray.splice(insert_idx, 0, octree);
	}
	else 
	{
		result_octreesArray.push(octree);
	}
};

/**
 * 어떤 일을 하고 있습니까?
 * @param result_octreesArray 변수
 */
Octree.prototype.getAllSubOctreesIfHasRefLists = function(result_octreesArray) 
{
	if (this.subOctrees_array === undefined) { return; }

	if (result_octreesArray === undefined) { result_octreesArray = []; }

	if (this.subOctrees_array.length > 0) 
	{
		for (var i=0, subOctreesArrayLength = this.subOctrees_array.length; i<subOctreesArrayLength; i++) 
		{
			this.subOctrees_array[i].getAllSubOctreesIfHasRefLists(result_octreesArray);
		}
	}
	else 
	{
		//if(this.neoRefsList_Array.length > 0)
		if (this.triPolyhedronsCount > 0) { result_octreesArray.push(this); } // there are only 1.***
	}
};

/**
 * 어떤 일을 하고 있습니까?
 * @param result_octreesArray 변수
 */
Octree.prototype.getAllSubOctrees = function(result_octreesArray) 
{
	if (result_octreesArray === undefined) { result_octreesArray = []; }

	if (this.subOctrees_array.length > 0) 
	{
		for (var i=0, subOctreesArrayLength = this.subOctrees_array.length; i<subOctreesArrayLength; i++) 
		{
			this.subOctrees_array[i].getAllSubOctrees(result_octreesArray);
		}
	}
	else 
	{
		result_octreesArray.push(this); // there are only 1.***
	}
};

/**
 * 어떤 일을 하고 있습니까?
 * @param result_octreesArray 변수
 */
Octree.prototype.extractLowestOctreesIfHasTriPolyhedrons = function(lowestOctreesArray) 
{
	if (this.subOctrees_array === undefined)
	{ return; }
	
	var subOctreesCount = this.subOctrees_array.length;

	if (subOctreesCount === 0 && this.triPolyhedronsCount > 0) 
	{
		lowestOctreesArray.push(this);
	}
	else 
	{
		for (var i=0; i<subOctreesCount; i++) 
		{
			this.subOctrees_array[i].extractLowestOctreesIfHasTriPolyhedrons(lowestOctreesArray);
		}
	}
};

/**
 * 어떤 일을 하고 있습니까?
 * @param result_octreesArray 변수
 */
Octree.prototype.multiplyKeyTransformMatrix = function(idxKey, matrix) 
{
	var subOctreesCount = this.subOctrees_array.length;

	if (subOctreesCount === 0 && this.triPolyhedronsCount > 0) 
	{
		if (this.neoReferencesMotherAndIndices)
		{ this.neoReferencesMotherAndIndices.multiplyKeyTransformMatrix(idxKey, matrix); }
	}
	else 
	{
		for (var i=0; i<subOctreesCount; i++) 
		{
			this.subOctrees_array[i].multiplyKeyTransformMatrix(idxKey, matrix);
		}
	}
};

/**
 * 어떤 일을 하고 있습니까?
 * @param result_octreesArray 변수
 */
Octree.prototype.parseAsimetricVersion = function(arrayBuffer, readerWriter, bytesReaded, neoBuildingOwner) 
{
	// Check the metaData version.***
	var version = neoBuildingOwner.getHeaderVersion();
	
	
	var octreeLevel = readerWriter.readInt32(arrayBuffer, bytesReaded, bytesReaded+4); bytesReaded += 4;

	if (octreeLevel === 0) 
	{
		// this is the mother octree, so read the mother octree's size.***
		var minX = readerWriter.readFloat32(arrayBuffer, bytesReaded, bytesReaded+4); bytesReaded += 4;
		var maxX = readerWriter.readFloat32(arrayBuffer, bytesReaded, bytesReaded+4); bytesReaded += 4;
		var minY = readerWriter.readFloat32(arrayBuffer, bytesReaded, bytesReaded+4); bytesReaded += 4;
		var maxY = readerWriter.readFloat32(arrayBuffer, bytesReaded, bytesReaded+4); bytesReaded += 4;
		var minZ = readerWriter.readFloat32(arrayBuffer, bytesReaded, bytesReaded+4); bytesReaded += 4;
		var maxZ = readerWriter.readFloat32(arrayBuffer, bytesReaded, bytesReaded+4); bytesReaded += 4;

		this.setBoxSize(minX, maxX, minY, maxY, minZ, maxZ );
		this.octree_number_name = 0;
	}

	var subOctreesCount = readerWriter.readUInt8(arrayBuffer, bytesReaded, bytesReaded+1); bytesReaded += 1; // this must be 0 or 8.***
	this.triPolyhedronsCount = readerWriter.readInt32(arrayBuffer, bytesReaded, bytesReaded+4); bytesReaded += 4;
	if (this.triPolyhedronsCount > 0)
	{ this.neoBuildingOwner = neoBuildingOwner; }

	if (version === "0.0.2")
	{
		// Read ModelLists partitions count.***
		this.blocksListsPartitionsCount = readerWriter.readInt32(arrayBuffer, bytesReaded, bytesReaded+4); bytesReaded += 4;
	}

	// 1rst, create the 8 subOctrees.***
	for (var i=0; i<subOctreesCount; i++) 
	{
		var subOctree = this.new_subOctree();
		subOctree.octree_number_name = this.octree_number_name * 10 + (i+1);
		subOctree.neoBuildingOwnerId = this.neoBuildingOwnerId;
		subOctree.octreeKey = this.neoBuildingOwnerId + "_" + subOctree.octree_number_name;
	}

	// now, set size of subOctrees.***
	this.setSizesSubBoxes();

	for (var i=0; i<subOctreesCount; i++) 
	{
		var subOctree = this.subOctrees_array[i];
		bytesReaded = subOctree.parseAsimetricVersion(arrayBuffer, readerWriter, bytesReaded, neoBuildingOwner);
	}

	return bytesReaded;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param result_octreesArray 변수
 */
Octree.prototype.parsePyramidVersion = function(arrayBuffer, readerWriter, bytesReaded, neoBuildingOwner) 
{
	var octreeLevel = readerWriter.readInt32(arrayBuffer, bytesReaded, bytesReaded+4); bytesReaded += 4;

	if (octreeLevel === 0) 
	{
		// this is the mother octree, so read the mother octree's size.***
		var minX = readerWriter.readFloat32(arrayBuffer, bytesReaded, bytesReaded+4); bytesReaded += 4;
		var maxX = readerWriter.readFloat32(arrayBuffer, bytesReaded, bytesReaded+4); bytesReaded += 4;
		var minY = readerWriter.readFloat32(arrayBuffer, bytesReaded, bytesReaded+4); bytesReaded += 4;
		var maxY = readerWriter.readFloat32(arrayBuffer, bytesReaded, bytesReaded+4); bytesReaded += 4;
		var minZ = readerWriter.readFloat32(arrayBuffer, bytesReaded, bytesReaded+4); bytesReaded += 4;
		var maxZ = readerWriter.readFloat32(arrayBuffer, bytesReaded, bytesReaded+4); bytesReaded += 4;

		this.setBoxSize(minX, maxX, minY, maxY, minZ, maxZ );
		this.octree_number_name = 0;
	}

	var subOctreesCount = readerWriter.readUInt8(arrayBuffer, bytesReaded, bytesReaded+1); bytesReaded += 1; // this must be 0 or 8.***
	this.triPolyhedronsCount = readerWriter.readInt32(arrayBuffer, bytesReaded, bytesReaded+4); bytesReaded += 4;
	if (this.triPolyhedronsCount > 0)
	{ this.neoBuildingOwner = neoBuildingOwner; }

	// Now, read verticesArray partitions count.***
	this.pCloudPartitionsCount = readerWriter.readInt32(arrayBuffer, bytesReaded, bytesReaded+4); bytesReaded += 4;

	// 1rst, create the 8 subOctrees.***
	for (var i=0; i<subOctreesCount; i++) 
	{
		var subOctree = this.new_subOctree();
		subOctree.octree_number_name = this.octree_number_name * 10 + (i+1);
		subOctree.neoBuildingOwnerId = this.neoBuildingOwnerId;
		subOctree.octreeKey = this.neoBuildingOwnerId + "_" + subOctree.octree_number_name;
	}

	// now, set size of subOctrees.***
	this.setSizesSubBoxes();

	for (var i=0; i<subOctreesCount; i++) 
	{
		var subOctree = this.subOctrees_array[i];
		bytesReaded = subOctree.parsePyramidVersion(arrayBuffer, readerWriter, bytesReaded, neoBuildingOwner);
	}

	return bytesReaded;
};

/**
 * 어떤 일을 하고 있습니까?
 */
Octree.prototype.getDistToCamera = function(cameraPosition, boundingSphere_Aux) 
{
	boundingSphere_Aux.setCenterPoint(this.centerPos.x, this.centerPos.y, this.centerPos.z);
	boundingSphere_Aux.setRadius(this.getRadiusAprox());
	return cameraPosition.distToSphere(boundingSphere_Aux);
};

/**
 * 어떤 일을 하고 있습니까?
 */
Octree.prototype.getMinDistToCameraInTree = function(cameraPosition, boundingSphere_Aux, octreesMaxSize) 
{
	// If this octree size > octreesMaxSize -> down in tree.***
	var octreeSize = this.getRadiusAprox();
	var subOctreesCount = this.subOctrees_array.length;
	var dist;
	if (octreeSize > octreesMaxSize && subOctreesCount > 0)
	{
		// Calculate the nearest subOctree to camera.***
		var currDist;
		var distCandidate;
		var subOctreeCandidate;
		for (var i=0; i<subOctreesCount; i++)
		{
			// Check if subOctree has content.***
			var hasContent = false;
			var subOctree = this.subOctrees_array[i];
			if (subOctree.pCloudPartitionsCount && subOctree.pCloudPartitionsCount > 0)
			{ hasContent = true; }
			if (subOctree.triPolyhedronsCount && subOctree.triPolyhedronsCount > 0)
			{ hasContent = true; }
			
			if (!hasContent)
			{ continue; }
			
			//currDist = subOctree.getDistToCamera(cameraPosition, boundingSphere_Aux); // original.***
			currDist = subOctree.centerPos.squareDistToPoint(cameraPosition); // test.***
			if (distCandidate === undefined) 
			{
				distCandidate = currDist;
				subOctreeCandidate = subOctree;
			}
			else 
			{
				if (currDist < distCandidate)
				{
					distCandidate = currDist;
					subOctreeCandidate = subOctree;
				}
			}
		}
		
		if (subOctreeCandidate)
		{
			return subOctreeCandidate.getMinDistToCameraInTree(cameraPosition, boundingSphere_Aux, octreesMaxSize);
		}
	}
	else 
	{
		//dist = this.getDistToCamera(cameraPosition, boundingSphere_Aux); // original.***
		dist = this.centerPos.distToPoint(cameraPosition); // test.***
	}
	
	return dist;
};






























