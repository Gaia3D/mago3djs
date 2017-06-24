
// Code examples for the future.*********************************************************************
/*
var _getAllFilesFromFolder = function(dir) 
	{
		// http://stackoverflow.com/questions/20822273/best-way-to-get-folder-and-file-list-in-javascript
		
		var filesystem = require('fs');
		var results = [];

		filesystem.readdirSync(dir).forEach(function(file) {

			file = dir+'/'+file;
			var stat = filesystem.statSync(file);

			if (stat && stat.isDirectory()) {
				//results = results.concat(_getAllFilesFromFolder(file))
			} else results.push(file);

		});

		return results;
		
	};
	*/
		
// End code examples.------------------------------------------------------------------------------------

var f4d_ReaderWriter = function()
{
	this.temp_var_to_waste = undefined;
	this.vi_arrays_Container = new VertexIdxVBO_ArraysContainer();
	this.byteColorsVBO_ArraysContainer = new ByteColorsVBO_ArraysContainer();
		//var simpleBuildingImage = new Image();
		
	this.i_counter = undefined;
	this.j_counter = undefined;
	this.k_counter = undefined;
		
	this.GL = undefined;
	this.incre_latAng = 0.001;
	this.incre_longAng = 0.001;
	this.GAIA3D__offset_latitude = -0.001;
	this.GAIA3D__offset_longitude = -0.001;
	this.GAIA3D__counter = 0;
		
		// Var for reading files.***Var for reading files.***Var for reading files.***Var for reading files.***Var for reading files.***
		// Var for reading files.***Var for reading files.***Var for reading files.***Var for reading files.***Var for reading files.***
	this.uint32 = undefined;
	this.uint16 = undefined;
	this.int16 = undefined;
	this.float32 = undefined;
    this.float16 = undefined;
    this.int8 = undefined;
    this.int8_value = undefined;
	this.max_color_value = 126;
		
	this.startBuff = undefined;
	this.endBuff = undefined;
};

// Basic readers.****************************************************************************************
f4d_ReaderWriter.prototype.readUInt32 = function(buffer, start, end)
{
	 uint32 = new Uint32Array(buffer.slice(start, end));
	 return uint32[0];
};

f4d_ReaderWriter.prototype.readInt32 = function(buffer, start, end)
{
	 int32 = new Int32Array(buffer.slice(start, end));
	 return int32[0];
};

f4d_ReaderWriter.prototype.readUInt16 = function(buffer, start, end)
{
	 uint16 = new Uint16Array(buffer.slice(start, end));
	 return uint16[0];
};

f4d_ReaderWriter.prototype.readInt16 = function(buffer, start, end)
{
	 int16 = new Int16Array(buffer.slice(start, end));
	 return int16[0];
};

f4d_ReaderWriter.prototype.readFloat64 = function(buffer, start, end)
{
	 float64 = new Float64Array(buffer.slice(start, end));
	 return float64[0];
};

f4d_ReaderWriter.prototype.readFloat32 = function(buffer, start, end)
{
	 float32 = new Float32Array(buffer.slice(start, end));
	 return float32[0];
};

f4d_ReaderWriter.prototype.readFloat16 = function(buffer, start, end)
{
	 float16 = new Float32Array(buffer.slice(start, end));
	 return float16[0];
};

f4d_ReaderWriter.prototype.readInt8 = function(buffer, start, end)
{
	 int8 = new Int8Array(buffer.slice(start, end));
	 return int8[0];
};

f4d_ReaderWriter.prototype.readUInt8 = function(buffer, start, end)
{
	 uint8 = new Uint8Array(buffer.slice(start, end));
	 return uint8[0];
};

f4d_ReaderWriter.prototype.readInt8_byteColor = function(buffer, start, end)
{
	int8 = new Int8Array(buffer.slice(start, end));
	int8_value = int8[0];

	if(int8_value > max_color_value)
	   int8_value = max_color_value;

	 if(int8_value < 0)
	   int8_value += 256;

	 return int8_value;
};
// End basic readers.----------------------------------------------------------------------------------------

f4d_ReaderWriter.prototype.readF4D_Blocks_V4_0 = function(GL, arrayBuffer, blocksList, BR_BuildingProject)
{
	var bytes_readed = 0;
	  var blocks_count = this.readUInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
	  var tringles_count = 0;
		
	  for(var i=0; i<blocks_count; i++)
	  {
		  var block = blocksList.newBlock();
			//var fpolyhedron = block._fpolyhedron;

			// 1) Ifc Entity.***************************************
			block.mIFCEntityType = this.readUInt16(arrayBuffer, bytes_readed, bytes_readed+2); bytes_readed += 2;

			// 2) Fitted Box.*******************************************************
			var has_fitted_box = this.readInt8(arrayBuffer, bytes_readed, bytes_readed+1); bytes_readed += 1;
			if(has_fitted_box)
			{
				// Provisionally lost information....
				var points_count =  8; // Fitted Box has 8 points Allways.!!!
				for(var j=0; j<points_count; j++)
				{
					// HalfFloat mode.***
//                           var x_halffloat =  readUInt16(arrayBuffer, bytes_readed, bytes_readed+2); bytes_readed += 2;
//                           var y_halffloat =  readUInt16(arrayBuffer, bytes_readed, bytes_readed+2); bytes_readed += 2;
//                           var z_halffloat =  readUInt16(arrayBuffer, bytes_readed, bytes_readed+2); bytes_readed += 2;
				   
				   this.temp_var_to_waste =  this.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
				   this.temp_var_to_waste =  this.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
				   this.temp_var_to_waste =  this.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
				}
			}

			// 3) FPolyhedrons VBO arrays.************************************************************
			//var vi_arrays_Container = new VertexIdxVBO_ArraysContainer(); // Old.***
			this.vi_arrays_Container._meshArrays.length = 0;
			//var scale = 100.0;
			
			
			
			var vi_arrays_count = this.readUInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
			for(var j=0; j<vi_arrays_count; j++)
			{
				var verticesFloatValues_count = this.readUInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
				startBuff = bytes_readed;
				endBuff = bytes_readed + 4*verticesFloatValues_count;
				
				// Vertices.************************
				  var vbo_vi_cacheKey = block._vbo_VertexIdx_CacheKeys_Container.new_VBO_VertexIdxCacheKey();
				  
					vbo_vi_cacheKey.MESH_VERTEX_cacheKey = GL.createBuffer ();
					GL.bindBuffer(GL.ARRAY_BUFFER, vbo_vi_cacheKey.MESH_VERTEX_cacheKey);
					GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(arrayBuffer.slice(startBuff, endBuff)), GL.STATIC_DRAW); // Original.***
				  
					bytes_readed = bytes_readed + 4*verticesFloatValues_count; // updating data.***
				  

				var shortIndicesValues_count =  this.readUInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
				vbo_vi_cacheKey.indices_count = shortIndicesValues_count;
				// Now, make the VBO of the block readed.******************************
				
				  
				  // Indices.***********************
				  startBuff = bytes_readed;
				  endBuff = bytes_readed + 2*shortIndicesValues_count;
				  
				  vbo_vi_cacheKey.MESH_FACES_cacheKey= GL.createBuffer ();
				  GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, vbo_vi_cacheKey.MESH_FACES_cacheKey);
				  GL.bufferData(GL.ELEMENT_ARRAY_BUFFER, new Uint16Array(arrayBuffer.slice(startBuff, endBuff)), GL.STATIC_DRAW);
				  
				  bytes_readed = bytes_readed + 2*shortIndicesValues_count; // updating data.***
				  
				  // Test, triangles counting. Delete this in the future.***
				  tringles_count = shortIndicesValues_count/3;
				  block._triangles_count += tringles_count;
			}
								  
	   }
};

f4d_ReaderWriter.prototype.readF4D_CompoundReferences_V4_0 = function(GL, arrayBuffer, compoundRefsList, BR_BuildingProject)
{
	var bytes_readed = 0;
	var compoundRefs_count = this.readUInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
	
	for(var i=0; i<compoundRefs_count; i++)
	{
		var compRef = compoundRefsList.newCompoundReference();
		var refs_count = this.readUInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
		for(var j=0; j<refs_count; j++)
		{
			var reference = compRef.newReference();
			// 1) Id.***
			var ref_ID =  this.readUInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
			reference._id = ref_ID;
			
			// 2) Block's Idx.***
			var blockIdx =   this.readUInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
			reference._block_idx = blockIdx;
			
			// 3) Transform Matrix4 (col-major).***
			//var scale_temp = 10000.0; // Delete this.!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
			reference._matrix4._floatArrays[0] =  this.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
			reference._matrix4._floatArrays[1] =  this.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
			reference._matrix4._floatArrays[2] =  this.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
			reference._matrix4._floatArrays[3] =  this.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
			
			reference._matrix4._floatArrays[4] =  this.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
			reference._matrix4._floatArrays[5] =  this.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
			reference._matrix4._floatArrays[6] =  this.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
			reference._matrix4._floatArrays[7] =  this.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
			
			reference._matrix4._floatArrays[8] =  this.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
			reference._matrix4._floatArrays[9] =  this.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
			reference._matrix4._floatArrays[10] =  this.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
			reference._matrix4._floatArrays[11] =  this.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
			
			reference._matrix4._floatArrays[12] =  this.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4; 
			reference._matrix4._floatArrays[13] =  this.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4; 
			reference._matrix4._floatArrays[14] =  this.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4; 
			reference._matrix4._floatArrays[15] =  this.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
			
			//reference._matrix4._floatArrays[12] *= scale_temp; // Delete scale_temp!!!!!!!!!!!!!!!!
			//reference._matrix4._floatArrays[13] *= scale_temp; // Delete scale_temp!!!!!!!!!!!!!!!!
			//reference._matrix4._floatArrays[14] *= scale_temp; // Delete scale_temp!!!!!!!!!!!!!!!!

			
			// 4) ByteColors List.***
			this.byteColorsVBO_ArraysContainer._meshArrays.length = 0; // New mode.***
			
			// Test.****************************************************************************************
			var vbo_ByteColorsCacheKeys_Container = new VBO_ByteColorCacheKeys_Container(); // Test version (with use of workers).***
			var vbo_bc_cacheKey_idx = BR_BuildingProject._VBO_ByteColorsCacheKeysContainer_List.length;
			BR_BuildingProject._VBO_ByteColorsCacheKeysContainer_List.push(vbo_ByteColorsCacheKeys_Container);
			reference._VBO_ByteColorsCacheKeys_Container_idx = vbo_bc_cacheKey_idx; // Test version (with use of workers).***
			// End test.------------------------------------------------------------------------------------
			
			var byteColorsArrays_count = this.readUInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
			for(var k=0; k<byteColorsArrays_count; k++)
			{
				var byteColorValues_count = this.readUInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
				
				// Now, make the VBO of the block readed.***
				// byte version.***
				startBuff = bytes_readed;
				endBuff = bytes_readed + byteColorValues_count;
				
				var vbo_bc_cacheKey = vbo_ByteColorsCacheKeys_Container.new_VBO_ByteColorsCacheKey(); // Original version (without workers).***

				vbo_bc_cacheKey.MESH_COLORS_cacheKey = GL.createBuffer ();
				GL.bindBuffer(GL.ARRAY_BUFFER, vbo_bc_cacheKey.MESH_COLORS_cacheKey);
				GL.bufferData(GL.ARRAY_BUFFER, new Int8Array(arrayBuffer.slice(startBuff, endBuff)), GL.STATIC_DRAW);
				
				bytes_readed = bytes_readed + byteColorValues_count; // update data.***
			}
		}
	}
	
	// Occlusion culling octree data.*****
	var ocCullBox = compoundRefsList._ocCulling._ocCulling_box; 
	bytes_readed = this.readF4D_OcclusionCullingOctree_Cell(arrayBuffer, bytes_readed, ocCullBox);
	ocCullBox.set_sizesSubBoxes();
	
	var infiniteOcCullBox = compoundRefsList._ocCulling._infinite_ocCulling_box;
	bytes_readed = this.readF4D_OcclusionCullingOctree_Cell(arrayBuffer, bytes_readed, infiniteOcCullBox);
	infiniteOcCullBox.expandBox(1000); // Only for the infinite box.***
	infiniteOcCullBox.set_sizesSubBoxes();
			
};

f4d_ReaderWriter.prototype.readF4D_OcclusionCullingOctree_Cell = function(arrayBuffer, bytes_readed, ocCullingOctree_Cell)
{
	// Note: This function must return the total_bytes_readed.***
	
	var is_mother_cell = this.readInt8(arrayBuffer, bytes_readed, bytes_readed+1); bytes_readed += 1;
	if(is_mother_cell)
	{
		// read the mother dimensions.***
		var minX = this.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
		var maxX = this.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
		var minY = this.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
		var maxY = this.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
		var minZ = this.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
		var maxZ = this.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
		
		ocCullingOctree_Cell.set_dimensions(minX, maxX, minY, maxY, minZ, maxZ);
	}
	else{
		// do nothing.***
	}
	
	var subBoxes_count = this.readUInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
	
	if(subBoxes_count == 0)
	{
		var compRefObjects_count = this.readUInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
		for(var i=0; i<compRefObjects_count; i++)
		{
			var compRefObjects_idxInList = this.readUInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
			ocCullingOctree_Cell._indicesArray.push(compRefObjects_idxInList);
			//ocCullingOctree_Cell._indicesUInt16Array
		}
	}
	else{
		for(var i=0; i<subBoxes_count; i++)
		{
			var subOcclusionBox = ocCullingOctree_Cell.new_subBox();
			bytes_readed = this.readF4D_OcclusionCullingOctree_Cell(arrayBuffer, bytes_readed, subOcclusionBox);
		}
	}
	
	return bytes_readed;
};

f4d_ReaderWriter.prototype.readF4D_SimpleBuilding_V4_0 = function(GL, arrayBuffer, simpleBuilding)
{
	var bytes_readed = 0;
	var storeys_count = this.readUInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
	
	var scale = 1.0;
	
	for(var i=0; i<storeys_count; i++)
	{
		var storey = simpleBuilding.new_simpleStorey();
		var objects_count = this.readUInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
		for(var j=0; j<objects_count; j++)
		{
			var simpleObject = storey.new_simpleObject();
			var vt_arrays_count = this.readUInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
			for(var k=0; k<vt_arrays_count; k++)
			{
				var vt_array_cacheKey = simpleObject._vtCacheKeys_container.new_VertexTexcoordsArraysCacheKey();
				var vt_array = new f4d_VertexTexcoords_Arrays();
				
				// 1) Vertex arrays.**********************************
				var vertexFloatValues_count = this.readUInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
				for(var a=0; a<vertexFloatValues_count; a++)
				{
					var vertexFloatValue = this.readFloat32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
					vertexFloatValue *= scale;
					vt_array._vertices_array.push(vertexFloatValue);
				}
				
				var vertices_count = vertexFloatValues_count/3;
				vt_array_cacheKey._vertices_count = vertices_count;
				
				// 2) textcoords arrays.*******************************
				var texcoordByteValues_count = this.readUInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
				for(var a=0; a<texcoordByteValues_count; a++)
				{
					var texcoordByteValue = this.readInt8(arrayBuffer, bytes_readed, bytes_readed+1); bytes_readed += 1;
					vt_array._texcoords_array.push(texcoordByteValue);
				}
				
				var texcoords_count = texcoordByteValues_count/2;
				
				// Test.********************
				if(vertices_count != texcoords_count)
				{
					vt_array_cacheKey._vertices_count = texcoords_count;
				}
				
				// Now, make VBO for this simpleObject.**************************************************
				
				vt_array_cacheKey._verticesArray_cacheKey = GL.createBuffer ();
				GL.bindBuffer(GL.ARRAY_BUFFER, vt_array_cacheKey._verticesArray_cacheKey);
				GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(vt_array._vertices_array), GL.STATIC_DRAW);
				
				vt_array_cacheKey._texcoordsArray_cacheKey = GL.createBuffer ();
				GL.bindBuffer(GL.ARRAY_BUFFER, vt_array_cacheKey._texcoordsArray_cacheKey);
				GL.bufferData(GL.ARRAY_BUFFER, new Int8Array(vt_array._texcoords_array), GL.STATIC_DRAW);
				
			}	
		}
	}
	
	// Now, the 1extrude simpleBuilding.**********************************************************
	
};
		
		
f4d_ReaderWriter.prototype.readF4D_Blocks_inServer = function(GL, filePath_inServer, blocksList, BR_BuildingProject, f4d_readerWriter)
{
	// https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/Sending_and_Receiving_Binary_Data
	var oReq = new XMLHttpRequest();
	oReq.open("GET", filePath_inServer, true);
	oReq.responseType = "arraybuffer";

	oReq.onload = function (oEvent)
	{
	  var arrayBuffer = oReq.response; // Note: not oReq.responseText
	  if (arrayBuffer)
	  {
		  f4d_readerWriter.readF4D_Blocks_V4_0(GL, arrayBuffer, blocksList, BR_BuildingProject);
	  }
	  
	  arrayBuffer = null;
	};

	oReq.send(null);
};
		
f4d_ReaderWriter.prototype.readF4D_CompoundReferences_inServer = function(GL, filePath_inServer, compRefList_Container, compoundReferenceList_name, 
																		  lodLevel, blocksList, transformMat, BR_BuildingProject, f4d_readerWriter, subOctreeNumberName)
{
	// https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/Sending_and_Receiving_Binary_Data
	var oReq = new XMLHttpRequest();
	oReq.open("GET", filePath_inServer, true);
	oReq.responseType = "arraybuffer";

	oReq.onload = function (oEvent)
	{
	  var arrayBuffer = oReq.response; // Note: not oReq.responseText
	  if (arrayBuffer)
	  {
		   if(f4d_readerWriter == undefined)
		  {
			  f4d_readerWriter = new f4d_ReaderWriter();
		  }
		  //------------------------------------------------------
		  var octree = undefined;
		  if(subOctreeNumberName)
		  {
			  // we are reading interior comRefs.***
			  octree = BR_BuildingProject.octree.getOctree_byNumberName(subOctreeNumberName);
		  }
		  
		  var compRefList = new f4d_CompoundReferencesList();
		
			f4d_readerWriter.readF4D_CompoundReferences_V4_0(GL, arrayBuffer, compRefList, BR_BuildingProject); // New.***
		  
		  if(compRefList._compoundRefsArray.length > 0)
		  {
			  if(transformMat)
			  {
				  compRefList.multiplyReferencesMatrices(transformMat);
			  }
			  compRefList._name = compoundReferenceList_name;
			  compRefList._lodLevel = lodLevel;
			  //compRefList._myBlocksList = blocksList;// Original. Delete this if want use workers.***
			  if(octree)
			  {
				  octree._compRefsList_Array.push(compRefList);
			  }
			  else
			  {
				compRefList_Container._compRefsList_Array.push(compRefList);
			  }
		  }
	  }
	  arrayBuffer = null;
	};

	oReq.send(null);
};		
		

f4d_ReaderWriter.prototype.readF4D_SimpleBuilding_inServer = function(GL, filePath_inServer, simpleBuilding, f4d_readerWriter)
{
	// https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/Sending_and_Receiving_Binary_Data
	var oReq = new XMLHttpRequest();
	oReq.open("GET", filePath_inServer, true);
	oReq.responseType = "arraybuffer";

	oReq.onload = function (oEvent)
	{
	  var arrayBuffer = oReq.response; // Note: not oReq.responseText
	  if (arrayBuffer)
	  {
		   if(f4d_readerWriter == undefined)
		  {
			  f4d_readerWriter = new f4d_ReaderWriter();
		  }
		  //------------------------------------------------------
		  f4d_readerWriter.readF4D_SimpleBuilding_V4_0(GL, arrayBuffer, simpleBuilding );
	  }
	  arrayBuffer = null;
	};

	oReq.send(null);
	
};	

f4d_ReaderWriter.prototype.readF4D_NailImage_ofArrayBuffer = function(GL, imageArrayBuffer, BR_Project, f4d_readerWriter, f4d_manager, imageLod)
{
	function handleTextureLoaded(gl, image, texture) 
	{
		// https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Tutorial/Using_textures_in_WebGL
		//var gl = viewer.scene.context._gl;
	  gl.bindTexture(gl.TEXTURE_2D, texture);
	  //gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true); // if need vertical mirror of the image.***
	  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image); // Original.***
	  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
	  gl.generateMipmap(gl.TEXTURE_2D);
	  gl.bindTexture(gl.TEXTURE_2D, null);
	}; // ^This is only in www version.*** i dont know why...
	
	var simpBuildingV1 = BR_Project._simpleBuilding_v1;
	//--------------------------------------------------------------------------
	var blob = new Blob( [ imageArrayBuffer ], { type: "image/jpeg" } );
	var urlCreator = window.URL || window.webkitURL;
	var imagenUrl = urlCreator.createObjectURL(blob);
	var simpleBuildingImage = new Image();
	
	simpleBuildingImage.onload = function () {
		//console.log("Image Onload");
		if(imageLod == 0)// Biggest image.***
		{
			if(simpBuildingV1._texture_0 == undefined)
			simpBuildingV1._texture_0 = GL.createTexture();
			handleTextureLoaded(GL, simpleBuildingImage, simpBuildingV1._texture_0); 
			BR_Project._f4d_lod0Image_readed_finished = true;
			imageArrayBuffer = null;
			BR_Project._simpleBuilding_v1.textureArrayBuffer_lod0 = null;
		}
		else if(imageLod == 3)// Embedded image.***
		{
			if(simpBuildingV1._simpleBuildingTexture == undefined)
			simpBuildingV1._simpleBuildingTexture = GL.createTexture();
			handleTextureLoaded(GL, simpleBuildingImage, simpBuildingV1._simpleBuildingTexture); 
			BR_Project._f4d_nailImage_readed_finished = true;
			imageArrayBuffer = null;
			BR_Project._simpleBuilding_v1.textureArrayBuffer = null;
		}
		
		if(f4d_manager.backGround_imageReadings_count > 0)
		{
			f4d_manager.backGround_imageReadings_count--;
		}
		
	};
	
	simpleBuildingImage.onerror = function() {
		// doesn't exist or error loading
		
		//BR_Project._f4d_lod0Image_readed_finished = false;
		//BR_Project._f4d_lod0Image_exists = false;
		//if(f4d_manager.backGround_fileReadings_count > 0 )
		//	  f4d_manager.backGround_fileReadings_count -=1;
		  
		return;
	};
	
	simpleBuildingImage.src = imagenUrl;
							
}

f4d_ReaderWriter.prototype.readF4D_NailImage_inServer = function(GL, filePath_inServer, BR_Project, f4d_readerWriter, f4d_manager, imageLod)
{
	function handleTextureLoaded(gl, image, texture) 
	{
		// https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Tutorial/Using_textures_in_WebGL
		//var gl = viewer.scene.context._gl;
	  gl.bindTexture(gl.TEXTURE_2D, texture);
	  //gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true); // if need vertical mirror of the image.***
	  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image); // Original.***
	  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
	  gl.generateMipmap(gl.TEXTURE_2D);
	  gl.bindTexture(gl.TEXTURE_2D, null);
	};
	
	
	
	if(imageLod == undefined)
		imageLod = 3; // The lowest lod.***
	
	if(imageLod == 3)
		BR_Project._f4d_nailImage_readed = true;
	else if(imageLod == 0)
		BR_Project._f4d_lod0Image_readed  = true;
	
	if(BR_Project._simpleBuilding_v1 == undefined)
		BR_Project._simpleBuilding_v1 = new f4d_simpleBuilding_v1();
	
	var simpBuildingV1 = BR_Project._simpleBuilding_v1;
	
	var simpleBuildingImage = new Image();
	simpleBuildingImage.onload = function() 
	{ 
	/*
		if(f4d_manager.render_time > 20)// for the moment is a test.***
		{
			if(imageLod == 3)
				BR_Project._f4d_nailImage_readed = false;
			else if(imageLod == 0)
				BR_Project._f4d_lod0Image_readed  = false;
			
			if(f4d_manager.backGround_fileReadings_count > 0 )
			  f4d_manager.backGround_fileReadings_count -=1;
		  
			return;
		}
		*/
		
		if(imageLod == 3)
		{
			handleTextureLoaded(GL, simpleBuildingImage, simpBuildingV1._simpleBuildingTexture); 
		    BR_Project._f4d_nailImage_readed_finished = true;
		}
	    else if(imageLod == 0)
		{
			if(simpBuildingV1._texture_0 == undefined)
				simpBuildingV1._texture_0 = GL.createTexture();
			
			handleTextureLoaded(GL, simpleBuildingImage, simpBuildingV1._texture_0);
			BR_Project._f4d_lod0Image_readed_finished = true;
		}
		
		if(f4d_manager.backGround_fileReadings_count > 0 )
			  f4d_manager.backGround_fileReadings_count -=1;
		  
		
	};
	
	simpleBuildingImage.onerror = function() {
		// doesn't exist or error loading
		BR_Project._f4d_lod0Image_readed_finished = false;
		BR_Project._f4d_lod0Image_exists = false;
		if(f4d_manager.backGround_fileReadings_count > 0 )
			  f4d_manager.backGround_fileReadings_count -=1;
		return;
    };
	
		var filePath_inServer_SimpleBuildingImage = filePath_inServer;
		simpleBuildingImage.src = filePath_inServer_SimpleBuildingImage;
};

f4d_ReaderWriter.prototype.readF4D_ImageAsArrayBuffer_inServer = function(GL, filePath_inServer, BR_Project, image_lod)
{
	var oReq = new XMLHttpRequest();

	oReq.open("GET", filePath_inServer, true);
	oReq.responseType = "arraybuffer";
	
	BR_Project._f4d_lod0Image_readed = true;
	
	if(BR_Project._simpleBuilding_v1 == undefined)
		BR_Project._simpleBuilding_v1 = new f4d_simpleBuilding_v1();
	
	var simpBuildingV1 = BR_Project._simpleBuilding_v1;

	oReq.onload = function (oEvent)
	{
		var arrayBuffer = oReq.response; // Note: not oReq.responseText
		if (arrayBuffer)
		{
			//BR_Project._f4d_lod0Image_readed_finished = true; // No here.***
			
			if(image_lod == 0) // Biggest image.***
			{
				simpBuildingV1.textureArrayBuffer_lod0 = arrayBuffer;
				BR_Project._f4d_lod0Image_readed_finished = true;
			}
			else if(image_lod == 3) // Embedded image.***
			{
				simpBuildingV1.textureArrayBuffer = arrayBuffer;
				BR_Project._f4d_nailImage_readed_finished = true;
			}
			
			//if(f4d_wwwLayer.backGround_fileReadings_count > 0 )
			//  f4d_wwwLayer.backGround_fileReadings_count -=1;
		  
		  arrayBuffer = null;
		}
		
	};

	oReq.send(null);
};

f4d_ReaderWriter.prototype.readF4D_TerranTileFile = function(GL, arrayBuffer, filePath_inServer, terranTile, f4d_readerWriter, bytes_readed)
{
	//var bytes_readed = 0;
	var f4d_headerPathName_length = 0;
	var BP_Project = undefined;
	var idxFile = undefined;
	var subTile = undefined;
	
	terranTile._depth = this.readInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
	if(terranTile._depth == 0)
	{
		// Read dimensions.***
		terranTile.longitude_min = this.readFloat64(arrayBuffer, bytes_readed, bytes_readed+8); bytes_readed += 8;
		terranTile.longitude_max = this.readFloat64(arrayBuffer, bytes_readed, bytes_readed+8); bytes_readed += 8;
		terranTile.latitude_min = this.readFloat64(arrayBuffer, bytes_readed, bytes_readed+8); bytes_readed += 8;
		terranTile.latitude_max = this.readFloat64(arrayBuffer, bytes_readed, bytes_readed+8); bytes_readed += 8;
	}
	
	// Read the max_depth of the quadtree.***
	var max_dpeth = this.readInt32(arrayBuffer, bytes_readed, bytes_readed+4); bytes_readed += 4;
	
	// Now, make the quadtree.***
	terranTile.make_tree(max_dpeth);
	
	return bytes_readed;
};

f4d_ReaderWriter.prototype.readF4D_TerranTileFile_inServer = function(GL, filePath_inServer, terranTile, f4d_readerWriter, wwd)
{
	// https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/Sending_and_Receiving_Binary_Data
	var oReq = new XMLHttpRequest();
	oReq.open("GET", filePath_inServer, true);
	oReq.responseType = "arraybuffer";

	oReq.onload = function (oEvent)
	{
		var arrayBuffer = oReq.response; // Note: not oReq.responseText
		if (arrayBuffer)
		{
			if(f4d_readerWriter == undefined)
			{
				f4d_readerWriter = new f4d_ReaderWriter();
			}
			//------------------------------------------------------
			var bytes_readed = 0;
			f4d_readerWriter.readF4D_TerranTileFile(GL, arrayBuffer, filePath_inServer, terranTile, f4d_readerWriter, bytes_readed)
			
			// Once readed the terranTilesFile, must make all the quadtree.***
			terranTile.set_dimensionsSubTiles();
			terranTile.calculate_position_byLonLat_subTiles(wwd);
			terranTile.terranIndexFile_readed = true;
		}
		arrayBuffer = null;
	};

	oReq.send(null);
	
};

f4d_ReaderWriter.prototype.openF4d_TerranTile = function(GL, terranTile, f4d_readerWriter, wwd )
{
	var filePath_inServer = "/F4D_GeometryData/Result_xdo2f4d/f4dTerranTileFile.txt"; // *** !!!
	f4d_readerWriter.readF4D_TerranTileFile_inServer(GL, filePath_inServer, terranTile, f4d_readerWriter, wwd);

};	

f4d_ReaderWriter.prototype.readF4D_TileArrayBuffer_inServer = function(GL, filePath_inServer, terranTile, f4d_readerWriter, f4d_wwwLayer)
{
	// https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/Sending_and_Receiving_Binary_Data
	terranTile.fileReading_started = true;
	var oReq = new XMLHttpRequest();

	oReq.open("GET", filePath_inServer, true);
	oReq.responseType = "arraybuffer";

	oReq.onload = function (oEvent)
	{
		var arrayBuffer = oReq.response; // Note: not oReq.responseText
		if (arrayBuffer)
		{
			//var BR_Project = new f4d_BR_buildingProject(); // Test.***
			//f4d_readerWriter.readF4D_Header(GL, arrayBuffer, BR_Project ); // Test.***
			terranTile.fileArrayBuffer = arrayBuffer;
			terranTile.fileReading_finished = true;
			
			if(f4d_wwwLayer.backGround_fileReadings_count > 0 )
			  f4d_wwwLayer.backGround_fileReadings_count -=1;
		  
		  arrayBuffer = null;
		}
		
	};

	oReq.send(null);
};

f4d_ReaderWriter.prototype.readF4D_Header_Original = function(GL, arrayBuffer, BR_Project)
{
	var bytes_readed = 0;
	var version_string_length = 5;
	var intAux_scratch = 0;
	var auxScratch = undefined;
	var header = BR_Project._header;
	
	// 0) Version. char 5.*************************************************
	for(var j=0; j<version_string_length; j++){
		header._version += String.fromCharCode(new Int8Array(arrayBuffer.slice(bytes_readed, bytes_readed+ 1)));bytes_readed += 1;
	}
	
	// 1) Project. char 10.****************************************************
	for(var j=0; j<10; j++){
		auxScratch = String.fromCharCode(new Int8Array(arrayBuffer.slice(bytes_readed, bytes_readed+ 1)));bytes_readed += 1;
	}
	
	// 2) Building object type.*********************************************
	header._type = (new Int32Array(arrayBuffer.slice(bytes_readed, bytes_readed+ 4)))[0];bytes_readed += 4;
	
	// 3) DB_idx_1rst_number + Building GUID (4byte + 22 char).**********************
	auxScratch = (new Int32Array(arrayBuffer.slice(bytes_readed, bytes_readed+ 4)))[0];bytes_readed += 4;
	for(var j=0; j<22; j++){
		auxScratch = String.fromCharCode(new Int8Array(arrayBuffer.slice(bytes_readed, bytes_readed+ 1)));bytes_readed += 1;
	}
	
	// 4) Original IFC File name.******************************************************
	intAux_scratch = (new Int32Array(arrayBuffer.slice(bytes_readed, bytes_readed+ 4)))[0];bytes_readed += 4;
	for(var j=0; j<intAux_scratch; j++){
		auxScratch = String.fromCharCode(new Int16Array(arrayBuffer.slice(bytes_readed, bytes_readed+ 1)));bytes_readed += 1;
	}
	
	// 5) Exterior LODs count. byte.***************************************************
	intAux_scratch = (new Uint8Array(arrayBuffer.slice(bytes_readed, bytes_readed+ 1)))[0];bytes_readed += 1;
	
	// 5.1) Interior LODs count. byte.************************************************
	intAux_scratch = (new Uint8Array(arrayBuffer.slice(bytes_readed, bytes_readed+ 1)))[0];bytes_readed += 1;
	
	// 6) Location, Orientation and Scale.***
	// (Lat, Long, Alt).***
	auxScratch = (new Float64Array(arrayBuffer.slice(bytes_readed, bytes_readed+8)))[0];bytes_readed += 8;
	auxScratch = (new Float64Array(arrayBuffer.slice(bytes_readed, bytes_readed+8)))[0];bytes_readed += 8;
	auxScratch = (new Float64Array(arrayBuffer.slice(bytes_readed, bytes_readed+8)))[0];bytes_readed += 8;
	
	// (Yaw, Pitch, Roll).***
	auxScratch = (new Float32Array(arrayBuffer.slice(bytes_readed, bytes_readed+4)))[0];bytes_readed += 4;
	auxScratch = (new Float32Array(arrayBuffer.slice(bytes_readed, bytes_readed+4)))[0];bytes_readed += 4;
	auxScratch = (new Float32Array(arrayBuffer.slice(bytes_readed, bytes_readed+4)))[0];bytes_readed += 4;
	
	// Scale (sx, sy, sz).***
	auxScratch = (new Float32Array(arrayBuffer.slice(bytes_readed, bytes_readed+4)))[0];bytes_readed += 4;
	auxScratch = (new Float32Array(arrayBuffer.slice(bytes_readed, bytes_readed+4)))[0];bytes_readed += 4;
	auxScratch = (new Float32Array(arrayBuffer.slice(bytes_readed, bytes_readed+4)))[0];bytes_readed += 4;
	
	// 9) Bounding box.************************************************************************
	header._boundingBox._maxX = (new Float32Array(arrayBuffer.slice(bytes_readed, bytes_readed+4)))[0];bytes_readed += 4;
	header._boundingBox._maxY = (new Float32Array(arrayBuffer.slice(bytes_readed, bytes_readed+4)))[0];bytes_readed += 4;
	header._boundingBox._maxZ = (new Float32Array(arrayBuffer.slice(bytes_readed, bytes_readed+4)))[0];bytes_readed += 4;
	
	header._boundingBox._minX = (new Float32Array(arrayBuffer.slice(bytes_readed, bytes_readed+4)))[0];bytes_readed += 4;
	header._boundingBox._minY = (new Float32Array(arrayBuffer.slice(bytes_readed, bytes_readed+4)))[0];bytes_readed += 4;
	header._boundingBox._minZ = (new Float32Array(arrayBuffer.slice(bytes_readed, bytes_readed+4)))[0];bytes_readed += 4;
	  
	// 10) Octree Levels Count. byte.************************************************************
	intAux_scratch = new Uint8Array(arrayBuffer.slice(bytes_readed, bytes_readed+ 1));bytes_readed += 1;
	
	// 11) Octree Mother Box.*****************************************************************
	header._octZerothBox._maxX = (new Float32Array(arrayBuffer.slice(bytes_readed, bytes_readed+4)))[0]; bytes_readed += 4; 
	header._octZerothBox._maxY = (new Float32Array(arrayBuffer.slice(bytes_readed, bytes_readed+4)))[0]; bytes_readed += 4;
	header._octZerothBox._maxZ = (new Float32Array(arrayBuffer.slice(bytes_readed, bytes_readed+4)))[0]; bytes_readed += 4;
	header._octZerothBox._minX = (new Float32Array(arrayBuffer.slice(bytes_readed, bytes_readed+4)))[0]; bytes_readed += 4; 
	header._octZerothBox._minY = (new Float32Array(arrayBuffer.slice(bytes_readed, bytes_readed+4)))[0]; bytes_readed += 4; 
	header._octZerothBox._minZ = (new Float32Array(arrayBuffer.slice(bytes_readed, bytes_readed+4)))[0]; bytes_readed += 4; 
	
	// **************************************************************************************************************************
	// After readed the header, make the octree.*********************************************************************************
	// octrees must have absolute positions for fast frustum culling process.***
	/*
	var posMat = new f4d_Matrix4();
	posMat.setByFloat32Array(BR_Project.move_matrix);
	var minPoint3d = new f4d_point3d();
	var maxPoint3d = new f4d_point3d();
	var transformed_minPoint3d = new f4d_point3d();
	var transformed_maxPoint3d = new f4d_point3d();
	
	maxPoint3d.set(header._octZerothBox._maxX, header._octZerothBox._maxY, header._octZerothBox._maxZ);
	minPoint3d.set(header._octZerothBox._minX, header._octZerothBox._minY, header._octZerothBox._minZ);
	
	transformed_minPoint3d = posMat.transformPoint3D(minPoint3d, transformed_minPoint3d);
	transformed_maxPoint3d = posMat.transformPoint3D(maxPoint3d, transformed_maxPoint3d);
	
	transformed_minPoint3d.add(BR_Project._buildingPosition.x, BR_Project._buildingPosition.y, BR_Project._buildingPosition.z);
	transformed_maxPoint3d.add(BR_Project._buildingPosition.x, BR_Project._buildingPosition.y, BR_Project._buildingPosition.z);
	
	BR_Project.octree.setBoxSize(transformed_minPoint3d.x, transformed_maxPoint3d.x,  
										transformed_minPoint3d.y, transformed_maxPoint3d.y,  
										transformed_minPoint3d.z, transformed_maxPoint3d.z);
										*/
			
		
		
	
	BR_Project.octree.setBoxSize(header._octZerothBox._minX, header._octZerothBox._maxX,  
								header._octZerothBox._minY, header._octZerothBox._maxY,  
								header._octZerothBox._minZ, header._octZerothBox._maxZ);
										
	BR_Project.octree.makeTree(3);
	BR_Project.octree.setSizesSubBoxes();
	
};

f4d_ReaderWriter.prototype.readF4D_HeaderOriginal_inServer = function(GL, filePath_inServer, BR_Project, f4d_readerWriter, f4d_manager)
{
	// https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/Sending_and_Receiving_Binary_Data
	BR_Project._f4d_header_readed = true;
	
	var oReq = new XMLHttpRequest();
	oReq.open("GET", filePath_inServer, true);
	oReq.responseType = "arraybuffer";

	oReq.onload = function (oEvent)
	{
	  var arrayBuffer = oReq.response; // Note: not oReq.responseText
	  if (arrayBuffer)
	  {
		   if(f4d_readerWriter == undefined)
		  {
			  f4d_readerWriter = new f4d_ReaderWriter();
		  }
		  //------------------------------------------------------
		  f4d_readerWriter.readF4D_Header_Original(GL, arrayBuffer, BR_Project );
		  if(f4d_manager.backGround_fileReadings_count > 0 )
			  f4d_manager.backGround_fileReadings_count -=1;
		  
		  BR_Project._f4d_header_readed_finished = true;
	  }
	  arrayBuffer = null;
	};

	oReq.send(null);
};

		
f4d_ReaderWriter.prototype.openBuildingProject = function(wwd, f4d_wwwLayer, projectNumber, latitude, longitude, height, f4d_readerWriter)
{
	
	//The problem is that all files are read at the same time and when the files have a total size (sum) that is very large the browser crashes.
	//I want to read one file after another, so that the memory consumption is reduced.
	// http://stackoverflow.com/questions/13975031/reading-multiple-files-with-javascript-filereader-api-one-at-a-time
	//----------------------------------------------------------------------------------------------------------------------
	//----------------------------------------------------------------------------------------------------------------------
  //var files = evt.target.files; // FileList object // Old.***
	// Open f4d.***
  // New mode: read files in local server.*********************************************
	// Create a new buildingProject.**************************************************************
	// https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/Sending_and_Receiving_Binary_Data
	
	//alert('cp1');
	
	function handleTextureLoaded(gl, image, texture) 
	{
		// https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Tutorial/Using_textures_in_WebGL
		//var gl = viewer.scene.context._gl;
	  gl.bindTexture(gl.TEXTURE_2D, texture);
	  //gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true); // if need vertical mirror of the image.***
	  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image); // Original.***
	  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
	  gl.generateMipmap(gl.TEXTURE_2D);
	  gl.bindTexture(gl.TEXTURE_2D, null);
	}
	
	f4dGeoModifier = new f4d_geometryModifier();
		
	var BR_ProjectsList = f4d_wwwLayer.f4dBR_buildingProjectsList;
	var BR_buildingProject = BR_ProjectsList.new_BR_Project();
	var f4d_shadersManager = f4d_wwwLayer.f4d_shadersManager;
	BR_buildingProject.f4d_shadersManager = f4d_shadersManager;
	var blocksListContainer = BR_buildingProject._blocksList_Container;
	
	var project_number = projectNumber; // House with car and mini park to children.***
	
	
	var projectNumStr = project_number.toString();
	
	//    	  Entity.prototype._getModelMatrix = function(time, result) {
	//    	        var position = Property.getValueOrUndefined(this._position, time, positionScratch);
	//    	        if (!defined(position)) {
	//    	            return undefined;
	//    	        }
	//    	        var orientation = Property.getValueOrUndefined(this._orientation, time, orientationScratch);
	//    	        if (!defined(orientation)) {
	//    	            result = Transforms.eastNorthUpToFixedFrame(position, undefined, result);
	//    	        } else {
	//    	            result = Matrix4.fromRotationTranslation(Matrix3.fromQuaternion(orientation, matrix3Scratch), position, result);
	//    	        }
	//    	        return result;
	//    	    };
	
	// 0) PositionMatrix.************************************************************************
	//var height = elevation;
	//var position = Cesium.Cartesian3.fromDegrees(longitude, latitude, height); // Cesium version.***
	var position = new WorldWind.Position(longitude, latitude, height); // NO.***
	BR_buildingProject._buildingPosition = position; 
	
	// High and Low values of the position.****************************************************
	// WebWorldWind version.**********************************
	// Provisionally assign the same values for high and low position values.***
	BR_buildingProject._buildingPositionHIGH = new Float32Array(3);
	BR_buildingProject._buildingPositionLOW = new Float32Array(3);
	// End.-----------------------------------------------------------------------------------
	
	//****************************************************************************************************************************
	// example from wwj : "this.positionMatrix = globe.computeSurfaceOrientationAtPosition(this.geodeticPosition);".***
	// in www : "Matrix.prototype.multiplyByLocalCoordinateTransform = function (origin, globe);".***
	//----------------------------------------------------------------------------------------------------------------------------
	var dc = wwd.drawContext;
    var GL = dc.currentGlContext;
	var globe = wwd.globe;

	// code parcially copied from BoundingBox.js of www.***
	// Note: in WWW, the Matrix is row-major order by default. You can call Matrix.columnMajorComponents(m) and this returns col-major order matrix.***
	var matrix = WorldWind.Matrix.fromIdentity();

	var xAxis = new WorldWind.Vec3(0, 0, 0),
		yAxis = new WorldWind.Vec3(0, 0, 0),
		zAxis = new WorldWind.Vec3(0, 0, 0);
		
	var origin = new WorldWind.Vec3(latitude, longitude, height);
	var result = new WorldWind.Vec3(0, 0, 0);
	origin = globe.computePointFromPosition(latitude, longitude, height, result);
	
	var buildingPosSplit_x = new f4d_splitValue();
	buildingPosSplit_x = f4dGeoModifier.Calculate_splitValues(origin[0], buildingPosSplit_x);
	var buildingPosSplit_y = new f4d_splitValue();
	buildingPosSplit_y = f4dGeoModifier.Calculate_splitValues(origin[1], buildingPosSplit_y);
	var buildingPosSplit_z = new f4d_splitValue();
	buildingPosSplit_z = f4dGeoModifier.Calculate_splitValues(origin[2], buildingPosSplit_z);
	
	BR_buildingProject._buildingPositionHIGH[0] = buildingPosSplit_x.high; 
	BR_buildingProject._buildingPositionHIGH[1] = buildingPosSplit_y.high;
	BR_buildingProject._buildingPositionHIGH[2] = buildingPosSplit_z.high;
	
	BR_buildingProject._buildingPositionLOW[0] = buildingPosSplit_x.low;
	BR_buildingProject._buildingPositionLOW[1] = buildingPosSplit_y.low;
	BR_buildingProject._buildingPositionLOW[2] = buildingPosSplit_z.low;
	
	WorldWind.WWMath.localCoordinateAxesAtPoint(origin, globe, xAxis, yAxis, zAxis);
	/*
	matrix.set(
		xAxis[0], yAxis[0], zAxis[0], origin[0],
		xAxis[1], yAxis[1], zAxis[1], origin[1],
		xAxis[2], yAxis[2], zAxis[2], origin[2],
		0, 0, 0, 1);
		*/
		
		matrix.set(
		xAxis[0], yAxis[0], zAxis[0], 0,
		xAxis[1], yAxis[1], zAxis[1], 0,
		xAxis[2], yAxis[2], zAxis[2], 0,
		0, 0, 0, 1);
		
	var columnMajorArrayAux = WorldWind.Matrix.fromIdentity();
	var columnMajorArray = matrix.columnMajorComponents(columnMajorArrayAux); // Original.***
	
		
	//BR_buildingProject.move_matrix = columnMajorArray; // No. move_matrix must be a Float32Array.***
	//columnMajorArray[12] = 0;
	//columnMajorArray[13] = 0;
	//columnMajorArray[14] = 0;
	
	var matrixInv = WorldWind.Matrix.fromIdentity();
	matrixInv.invertMatrix(matrix);
	var columnMajorArrayAux_inv = WorldWind.Matrix.fromIdentity();
	var columnMajorArray_inv = matrixInv.columnMajorComponents(columnMajorArrayAux_inv); // Original.***
	
	//columnMajorArray_inv[12] = 0;
	//columnMajorArray_inv[13] = 0;
	//columnMajorArray_inv[14] = 0;
	
	for(var i=0; i<16; i++)
	{
		BR_buildingProject.move_matrix[i] = columnMajorArray[i];
	}
	
	
	BR_buildingProject._buildingPosition = origin;
	
	// Calculate the move_matriz inverse. Pendent.***
	//Cesium.Matrix4.inverse(BR_buildingProject.move_matrix, BR_buildingProject.move_matrix_inv);  // Cesium version.***
	for(var i=0; i<16; i++)
	{
		BR_buildingProject.move_matrix_inv[i] = columnMajorArray_inv[i];
	}
	
	//*********************************************************
	 if(f4d_readerWriter == undefined)
	  {
		  f4d_readerWriter = new f4d_ReaderWriter();
	  }
	  //------------------------------------------------------
	  if(BR_buildingProject.octree == undefined)
		BR_buildingProject.octree = new f4d_octree(undefined);
	
	// 0) Header, the original version.*********************************************************************************************************
	var filePath_header_inServer = "/F4D_GeometryData/"+projectNumStr+"/Header";
	f4d_readerWriter.readF4D_HeaderOriginal_inServer(GL, filePath_header_inServer, BR_buildingProject, f4d_readerWriter, f4d_manager);
	
	// 1) Blocks.******************************************************************
	var filePath_inServer = "/F4D_GeometryData/"+projectNumStr+"/Blocks1";
	var blocksList = blocksListContainer.get_BlockList("Blocks1");
	f4d_readerWriter.readF4D_Blocks_inServer(GL, filePath_inServer, blocksList, BR_buildingProject, f4d_readerWriter);
	
	var filePath_inServer_2 = "/F4D_GeometryData/"+projectNumStr+"/Blocks2";
	var blocksList_2 = blocksListContainer.get_BlockList("Blocks2");
	f4d_readerWriter.readF4D_Blocks_inServer(GL, filePath_inServer_2, blocksList_2, BR_buildingProject, f4d_readerWriter);
	
	var filePath_inServer_3 = "/F4D_GeometryData/"+projectNumStr+"/Blocks3";
	var blocksList_3 = blocksListContainer.get_BlockList("Blocks3");
	f4d_readerWriter.readF4D_Blocks_inServer(GL, filePath_inServer_3, blocksList_3, BR_buildingProject, f4d_readerWriter);
	
	var filePath_inServer_bone = "/F4D_GeometryData/"+projectNumStr+"/BlocksBone";
	var blocksList_bone = blocksListContainer.get_BlockList("BlocksBone");
	f4d_readerWriter.readF4D_Blocks_inServer(GL, filePath_inServer_bone, blocksList_bone, BR_buildingProject, f4d_readerWriter);
	
	var filePath_inServer_4 = "/F4D_GeometryData/"+projectNumStr+"/Blocks4"; // Interior Objects.***
	var blocksList_4 = blocksListContainer.get_BlockList("Blocks4");
	f4d_readerWriter.readF4D_Blocks_inServer(GL, filePath_inServer_4, blocksList_4, BR_buildingProject, f4d_readerWriter);

	// 2) CompReferences.******************************************************************
	var moveMatrix = new f4d_Matrix4();
	moveMatrix.setByFloat32Array(BR_buildingProject.move_matrix);
	
	var compRefList_container = BR_buildingProject._compRefList_Container;
	
	filePath_inServer = "/F4D_GeometryData/"+projectNumStr+"/Ref_Skin1";
	f4d_readerWriter.readF4D_CompoundReferences_inServer(GL, filePath_inServer, compRefList_container, "Ref_Skin1", 0, blocksList, moveMatrix, BR_buildingProject, f4d_readerWriter);
	
	filePath_inServer_2 = "/F4D_GeometryData/"+projectNumStr+"/Ref_Skin2";
	f4d_readerWriter.readF4D_CompoundReferences_inServer(GL, filePath_inServer_2, compRefList_container, "Ref_Skin2", 1, blocksList_2, moveMatrix, BR_buildingProject, f4d_readerWriter);
	
	filePath_inServer_3 = "/F4D_GeometryData/"+projectNumStr+"/Ref_Skin3";
	f4d_readerWriter.readF4D_CompoundReferences_inServer(GL, filePath_inServer_3, compRefList_container, "Ref_Skin3", 2, blocksList_3, moveMatrix, BR_buildingProject, f4d_readerWriter);
	
	filePath_inServer_bone = "/F4D_GeometryData/"+projectNumStr+"/Ref_Bone";
	f4d_readerWriter.readF4D_CompoundReferences_inServer(GL, filePath_inServer_bone, compRefList_container, "Ref_Bone", 3, blocksList_bone, moveMatrix, BR_buildingProject, f4d_readerWriter);
	
	// Now, read the interior objects in octree format.*****************************************************************
	var interiorCompRefList_Container = BR_buildingProject._interiorCompRefList_Container;
	var interiorCRef_folderPath = "/F4D_GeometryData/"+projectNumStr+"/inLOD4";
	//var interiorCRef_files = _getAllFilesFromFolder(interiorCRef_folderPath);
	var interior_base_name = "Ref_NodeData";
	var subOctreeName_counter = -1;
	for(var i=1; i<9; i++)
	{
		for(var j=1; j<9; j++)
		{
			for(var k=1; k<9; k++)
			{
				subOctreeName_counter = i*100 + j*10 + k;
				var interiorCRef_fileName = interior_base_name + subOctreeName_counter.toString();

				// Create a "compoundRefList".************************************************
				var intCompRef_filePath = interiorCRef_folderPath + "/" + interiorCRef_fileName;
				//f4d_readerWriter.readF4D_CompoundReferences_inServer(GL, intCompRef_filePath, interiorCompRefList_Container, interiorCRef_fileName, 4, blocksList_4, moveMatrix, BR_buildingProject, f4d_readerWriter);
				f4d_readerWriter.readF4D_CompoundReferences_inServer(GL, intCompRef_filePath, interiorCompRefList_Container, interiorCRef_fileName, 4, blocksList_4, moveMatrix, BR_buildingProject, f4d_readerWriter, subOctreeName_counter);
			}
		}
	}
	
	// Now, the SimpleBuilding.*********************************************************************************************
	var filePath_inServer_SimpleBuilding = "/F4D_GeometryData/"+projectNumStr+"/SimpleBuilding";
	var simpleBuilding = BR_buildingProject._simpleBuilding;
	f4d_readerWriter.readF4D_SimpleBuilding_inServer(GL, filePath_inServer_SimpleBuilding, simpleBuilding, f4d_readerWriter);
	//readF4D_SimpleBuilding_inServer(filePath_inServer_SimpleBuilding, simpleBuilding);
	
	// Simple building texture.*********************************************************************************************
	// https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Tutorial/Using_textures_in_WebGL
	simpleBuilding._simpleBuildingTexture = GL.createTexture();
	
	// Test wait for texture to load.********************************************
	//http://stackoverflow.com/questions/19722247/webgl-wait-for-texture-to-load
	GL.bindTexture(GL.TEXTURE_2D, simpleBuilding._simpleBuildingTexture);
	GL.texImage2D(GL.TEXTURE_2D, 0, GL.RGBA, 1, 1, 0, GL.RGBA, GL.UNSIGNED_BYTE, new Uint8Array([255, 0, 0, 255])); // red
	GL.bindTexture(GL.TEXTURE_2D, null);
	// End test.-----------------------------------------------------------------//
	
	var simpleBuildingImage = new Image();
	simpleBuildingImage.onload = function() { handleTextureLoaded(GL, simpleBuildingImage, simpleBuilding._simpleBuildingTexture); }
	var filePath_inServer_SimpleBuildingImage = "/F4D_GeometryData/"+projectNumStr+"/SimpleBuildingTexture.bmp";
	simpleBuildingImage.src = filePath_inServer_SimpleBuildingImage;
	
	// For WebWorldWind, insert the buildingLayer to Layers of the wwd.**************************************************************
	//wwd.addLayer(BR_buildingProject);
	//f4dBuildingsLayer.addRenderable(BR_buildingProject);
	
};		
	

//# sourceURL=f4d_readWriter.js	
	
		
		
		
		
		
		
		
		
		