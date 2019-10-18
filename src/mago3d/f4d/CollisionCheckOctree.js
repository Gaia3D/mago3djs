'use strict';

/**
 * CollisionCheckOctree class object. 
 * @class CollisionCheckOctree
 * @param {CollisionCheckOctree} octreeOwner If octreeOwner is undefined, then this CollisionCheckOctree is the mother CollisionCheckOctree.
 */
var CollisionCheckOctree = function(octreeOwner) 
{
	if (!(this instanceof CollisionCheckOctree)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	/**
	 * The center position in local coordinates of the octree.
	 * @type {Point3D}
	 * @default (0,0,0)
	 */
	this.centerPos = new Point3D();
	this.transformedCenterPos;
	
	/**
	 * The half width of the octree in x-axis.
	 * @type {Number}
	 * @default 0.0
	 */
	this.half_dx = 0.0; 
	
	/**
	 * The half width of the octree in y-axis.
	 * @type {Number}
	 * @default 0.0
	 */
	this.half_dy = 0.0; 
	
	/**
	 * The half width of the octree in z-axis.
	 * @type {Number}
	 * @default 0.0
	 */
	this.half_dz = 0.0; 

	/**
	 * The octree's owner. If octree_owner is undefined, then this octree is the mother octree.
	 * @type {Octree}
	 * @default undefined
	 */
	this.octree_owner;
	if (octreeOwner) 
	{
		this.octree_owner = octreeOwner;
		this.octree_level = octreeOwner.octree_level + 1;
	}
	
	/**
	 * The octree's depth level. Mother octree's depth level is zero.
	 * @type {Number}
	 * @default 0
	 */
	this.octree_level = 0;
	
	// Octree number name.**
	// Bottom           Top              Y
	// +-----+-----+   +-----+-----+     ^
	// |  4  |  3  |   |  8  |  7  |     |
	// +-----+-----+   +-----+-----+     |
	// |  1  |  2  |   |  5  |  6  |     |------> X
	// +-----+-----+   +-----+-----+
	
	/**
	 * The octree's identifier. Accumulative number, starting from mother octree.
	 * @type {Number}
	 * @default 0
	 */
	this.octree_number_name = 0;
	
	/**
	 * The octree's neoBuildingOwner identifier.
	 * @type {String}
	 * @default undefined
	 */
	this.neoBuildingOwnerId;
	
	/**
	 * The octree's neoBuildingOwner.
	 * @type {NeoBuilding}
	 * @default undefined
	 */
	this.neoBuildingOwner;
	
	/**
	 * The octree's global unique identifier. It is compost by neoBuildingOwnerId + octree_number_name.
	 * @type {String}
	 * @default undefined
	 */
	this.octreeKey; 
	
	/**
	 * The octree's current LOD. Assigned by distance to camera when frustumCulling.
	 * @type {Number}
	 * @default undefined
	 */
	this.lod; 
	
	/**
	 * The octree's current fileLoadState.
	 * @type {Number}
	 * @default 0
	 */
	this.fileLoadState = CODE.fileLoadState.READY;

	/**
	 * The octree's children array. Array length must be 8.
	 * @type {Array}
	 * @default 0
	 */
	this.subOctrees_array = [];
	
	/**
	 * Pre-extracted leaf octrees, to speedUp.
	 * @type {Array}
	 * @default undefined
	 */
	this.lowestOctrees_array; // pre extract lowestOctrees for speedUp, if this is motherOctree.
	
	// auxiliar triangles array.
	this.trianglesArray;
	
	this.currentVisibleOctreesArray;
	
	this.collisionState = false;
	this.boundingSphere;
	this.collidedWithMeCollisionOctreesArray;
	this.vboKeysContainer;
	this.geoLocDataManager;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param treeDepth 변수
 */
CollisionCheckOctree.prototype.makeTreeByTrianglesArray = function(options) 
{
	if (this.trianglesArray === undefined || this.trianglesArray.length === 0)
	{ return; }
	
	if (options === undefined)
	{ return; }
	
	var desiredMinOctreeSize = options.desiredMinOctreeSize;
	var desiredHalfSize = desiredMinOctreeSize/2;
	
	if (this.half_dx > desiredHalfSize || this.half_dy > desiredHalfSize || this.half_dz > desiredHalfSize)
	{
		this.createChildren();

		for (var i=0; i<8; i++) 
		{
			this.subOctrees_array[i].takeIntersectedTriangles(this.trianglesArray);
		}
		
		for (var i=0; i<8; i++) 
		{
			this.subOctrees_array[i].makeTreeByTrianglesArray(options);
		}
		
		this.trianglesArray = undefined;
	}
};

/**
 * 어떤 일을 하고 있습니까?
 * @param treeDepth 변수
 */
CollisionCheckOctree.prototype.takeIntersectedTriangles = function(trianglesArray) 
{
	if (trianglesArray === undefined)
	{ return; }

	if (this.trianglesArray === undefined)
	{ this.trianglesArray = []; }

	var bbox = this.getBoundingBox();
	
	var trianglesCount = trianglesArray.length;
	for (var i=0; i<trianglesCount; i++)
	{
		var tri = trianglesArray[i];
		if (bbox.intersectsWithTriangle(tri))
		{
			this.trianglesArray.push(tri);
		}
	}
};

/**
 * 어떤 일을 하고 있습니까?
 * @param result_octreesArray 변수
 */
CollisionCheckOctree.prototype.extractLowestOctreesIfHasTriangles = function(lowestOctreesArray) 
{
	if (this.subOctrees_array === undefined)
	{ return; }
	
	var subOctreesCount = this.subOctrees_array.length;

	if (this.trianglesArray !== undefined && this.trianglesArray.length > 0) 
	{
		lowestOctreesArray.push(this);
	}
	else 
	{
		for (var i=0; i<subOctreesCount; i++) 
		{
			this.subOctrees_array[i].extractLowestOctreesIfHasTriangles(lowestOctreesArray);
		}
	}
};

/**
 * 어떤 일을 하고 있습니까?
 * @param treeDepth 변수
 */
CollisionCheckOctree.prototype.render = function(magoManager, shader, renderType, glPrimitive) 
{
	if (this.sphere === undefined)
	{
		var color4 = new Color();
		color4.setRGB(0.9, 0.1, 0.1);
		var options = {};
		options.color = color4;
		this.sphere = new Sphere(options);
		
		this.sphere.setRadius(this.getRadius());
		this.sphere.setCenterPoint(this.centerPos.x, this.centerPos.y, this.centerPos.z);
		return;
	}
	var bIsSelected = false;
	this.sphere.renderLocal(magoManager, shader, renderType, glPrimitive, bIsSelected);
	
};

/**
 * 어떤 일을 하고 있습니까?
 * @param treeDepth 변수
 */
CollisionCheckOctree.prototype.hasChildren = function() 
{
	if (this.subOctrees_array !== undefined && this.subOctrees_array.length > 0)
	{ return true; }
	else { return false; }
};

/**
 * 어떤 일을 하고 있습니까?
 * @param treeDepth 변수
 */
CollisionCheckOctree.prototype.createChildren = function() 
{
	this.subOctrees_array = []; // Init array.
	
	for (var i=0; i<8; i++) 
	{
		var subOctree = this.new_subOctree();
		subOctree.octree_number_name = this.octree_number_name * 10 + (i+1);
		subOctree.neoBuildingOwnerId = this.neoBuildingOwnerId;
		subOctree.octreeKey = this.neoBuildingOwnerId + "_" + subOctree.octree_number_name;
	}

	this.setSizesSubBoxes();
};

/**
 * Creates a child octree.
 * @returns {Octree} subOctree Returns the created child octree.
 */
CollisionCheckOctree.prototype.new_subOctree = function() 
{
	var subOctree = new CollisionCheckOctree(this);
	subOctree.octree_level = this.octree_level + 1;
	this.subOctrees_array.push(subOctree);
	return subOctree;
};


/**
 * 어떤 일을 하고 있습니까?
 */
CollisionCheckOctree.prototype.setSizesSubBoxes = function() 
{
	// Octree number name.**
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
CollisionCheckOctree.prototype.setBoxSize = function(Min_X, Max_X, Min_Y, Max_Y, Min_Z, Max_Z) 
{
	this.centerPos.x = (Max_X + Min_X)/2.0;
	this.centerPos.y = (Max_Y + Min_Y)/2.0;
	this.centerPos.z = (Max_Z + Min_Z)/2.0;

	this.half_dx = (Max_X - Min_X)/2.0; // half width.
	this.half_dy = (Max_Y - Min_Y)/2.0; // half length.
	this.half_dz = (Max_Z - Min_Z)/2.0; // half height.
};

/**
 * 어떤 일을 하고 있습니까?
 */
CollisionCheckOctree.prototype.getBoundingBox = function(resultBbox) 
{
	if (resultBbox === undefined)
	{ resultBbox = new BoundingBox(); }

	if ( this.transformedCenterPos === undefined)
	{ 
		this.transformedCenterPos = new Point3D(); 
		this.transformedCenterPos.copyFrom(this.centerPos);
	}

	resultBbox.set(this.transformedCenterPos.x - this.half_dx, this.transformedCenterPos.y - this.half_dy, this.transformedCenterPos.z - this.half_dz, 
		this.transformedCenterPos.x + this.half_dx, this.transformedCenterPos.y + this.half_dy, this.transformedCenterPos.z + this.half_dz);
	
	return resultBbox;
};

/**
 * 어떤 일을 하고 있습니까?
 */
CollisionCheckOctree.prototype.getRadius = function() 
{
	var bbox = this.getBoundingBox();
	return bbox.getRadius();
};

/**
 * 어떤 일을 하고 있습니까?
 */
CollisionCheckOctree.prototype.getBoundingSphere = function() 
{
	if ( this.transformedCenterPos === undefined)
	{ 
		this.transformedCenterPos = new Point3D(); 
		this.transformedCenterPos.copyFrom(this.centerPos);
	}
	
	if ( this.boundingSphere === undefined)
	{ this.boundingSphere = new BoundingSphere(this.transformedCenterPos.x, this.transformedCenterPos.y, this.transformedCenterPos.z, this.getRadius()); }

	return this.boundingSphere;
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns intersects
 */
CollisionCheckOctree.prototype.checkCollision = function(collisionOctree, resultCollidedOctreesArray) 
{
	if (collisionOctree === undefined)
	{ return false; }

	var myBSphere = this.getBoundingSphere();
	var bSphere = collisionOctree.getBoundingSphere();
	
	var collisionType = myBSphere.intersectsWithBSphere(bSphere);
	if (collisionType === Constant.INTERSECTION_OUTSIDE)
	{ return false; }
	
	// check the radius of the spheres, and, the bigger collisionOctree descends.
	// check if the collisionOctrees has children.
	if (!this.hasChildren() && !collisionOctree.hasChildren())
	{
		if (collisionOctree.trianglesArray !== undefined && collisionOctree.trianglesArray.length !== 0 && this.trianglesArray !== undefined && this.trianglesArray.length !== 0)
		{ 
			resultCollidedOctreesArray.push(this);
		}

		return true;
	}
	
	if (myBSphere.r > bSphere.r)
	{
		// check if my children collides with bSphere.
		if (this.hasChildren())
		{
			var childrenCount = this.subOctrees_array.length;
			for (var i=0; i<childrenCount; i++)
			{
				var subOctree = this.subOctrees_array[i];
				subOctree.checkCollision(collisionOctree, resultCollidedOctreesArray);
			}
		}
		else
		{
			// check if bSphere children collides with me.
			var childrenCount = collisionOctree.subOctrees_array.length;
			for (var i=0; i<childrenCount; i++)
			{
				var subOctree = collisionOctree.subOctrees_array[i];
				this.checkCollision(subOctree, resultCollidedOctreesArray);
			}
		}
	}
	else 
	{
		// check if bSphere children collides with me.
		if (collisionOctree.hasChildren())
		{
			var childrenCount = collisionOctree.subOctrees_array.length;
			for (var i=0; i<childrenCount; i++)
			{
				var subOctree = collisionOctree.subOctrees_array[i];
				this.checkCollision(subOctree, resultCollidedOctreesArray);
			}
		}
		else
		{
			var childrenCount = this.subOctrees_array.length;
			for (var i=0; i<childrenCount; i++)
			{
				var subOctree = this.subOctrees_array[i];
				subOctree.checkCollision(collisionOctree, resultCollidedOctreesArray);
			}
		}
	}
	
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns intersects
 */
CollisionCheckOctree.prototype.translate = function(translationVector, bTransformFromOrigin) 
{
	if (translationVector === undefined)
	{ return; }
	
	if ( this.transformedCenterPos === undefined)
	{ 
		this.transformedCenterPos = new Point3D(); 
		this.transformedCenterPos.copyFrom(this.centerPos);
	}

	if (bTransformFromOrigin === undefined)
	{ bTransformFromOrigin = false; }
	
	if (bTransformFromOrigin)
	{ this.transformedCenterPos.copyFrom(this.centerPos); }
	
	this.transformedCenterPos.addPoint(translationVector);
	
	if (this.hasChildren())
	{
		var childrenCount = this.subOctrees_array.length;
		for (var i=0; i<childrenCount; i++)
		{
			this.subOctrees_array[i].translate(translationVector, bTransformFromOrigin);
		}
	}
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns intersects
 */
CollisionCheckOctree.prototype.transformByMatrix4 = function(tMat, bTransformFromOrigin) 
{
	if (tMat === undefined)
	{ return; }

	if ( this.transformedCenterPos === undefined)
	{ 
		this.transformedCenterPos = new Point3D(); 
		this.transformedCenterPos.copyFrom(this.centerPos);
	}

	if (bTransformFromOrigin === undefined)
	{ bTransformFromOrigin = false; }
	
	if (bTransformFromOrigin)
	{ this.transformedCenterPos.copyFrom(this.centerPos); }
	
	this.transformedCenterPos = tMat.transformPoint3D(this.transformedCenterPos, this.transformedCenterPos);
	if (this.hasChildren())
	{
		var childrenCount = this.subOctrees_array.length;
		for (var i=0; i<childrenCount; i++)
		{
			this.subOctrees_array[i].transformByMatrix4(tMat, bTransformFromOrigin);
		}
	}
};












































