'use strict';

/**
 * 카메라
 * @class Camera
 */
var Camera = function() 
{
	if (!(this instanceof Camera)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this.position = new Point3D();
	this.direction = new Point3D();
	this.up = new Point3D();
	this.right = new Point3D();
	this.frustum = new Frustum();
	this.dirty = true;
	
	// auxiliar vars.
	// points.
	this.nearCenterPoint = new Point3D();
	this.farCenterPoint = new Point3D();
	
	this.farLeftBottomPoint = new Point3D();
	this.farLeftTopPoint = new Point3D();
	this.farRightBottomPoint = new Point3D();
	this.farRightTopPoint = new Point3D();
	
	this.nearLeftBottomPoint = new Point3D();
	this.nearLeftTopPoint = new Point3D();
	this.nearRightBottomPoint = new Point3D();
	this.nearRightTopPoint = new Point3D();
	
	// directions.
	this.leftBottomDir = new Point3D();
	this.rightTopDir = new Point3D();
	
	// normals.
	this.leftNormal = new Point3D();
	this.rightNormal = new Point3D();
	this.bottomNormal = new Point3D();
	this.topNormal = new Point3D();
};

/**
 * 카메라
 * @class Camera
 */
Camera.prototype.setDirty = function(cameraIsDirty)
{
	this.dirty = cameraIsDirty;
};

/**
 * 카메라
 * @class Camera
 */
Camera.prototype.getDirty = function()
{
	return this.dirty;
};



/**
 * 카메라
 * @class Camera
 */
Camera.prototype.calculateFrustumPlanes = function()
{
	var plane;
	
	// calculate nearWidth, nearHeight, farWidth & farHeight.
	var nearHeight = this.frustum.tangentOfHalfFovy*this.frustum.near*2;
	var farHeight = this.frustum.tangentOfHalfFovy*this.frustum.far*2;
	var nearWidth = nearHeight * this.frustum.aspectRatio;
	var farWidht = farHeight * this.frustum.aspectRatio;
	
	// calculate right direction. "up" and "direction" must be unitaries.
	this.right = this.direction.crossProduct(this.up, this.right);
	
	// calculate the near and far points.
	this.nearCenterPoint.set(this.position.x + this.direction.x * this.frustum.near, this.position.y + this.direction.y * this.frustum.near, this.position.z + this.direction.z * this.frustum.near);
	this.farCenterPoint.set(this.position.x + this.direction.x * this.frustum.far, this.position.y + this.direction.y * this.frustum.far, this.position.z + this.direction.z * this.frustum.far);
	
	// far plane points.
	this.farLeftBottomPoint.set(this.farCenterPoint.x - this.right.x*farWidht*0.5 - this.up.x*farHeight*0.5, 
		this.farCenterPoint.y - this.right.y*farWidht*0.5 - this.up.y*farHeight*0.5, 
		this.farCenterPoint.z - this.right.z*farWidht*0.5 - this.up.z*farHeight*0.5);
								
	this.farLeftTopPoint.set(this.farLeftBottomPoint.x + this.up.x*farHeight, 
		this.farLeftBottomPoint.y + this.up.y*farHeight, 
		this.farLeftBottomPoint.z + this.up.z*farHeight);
								
	this.farRightBottomPoint.set(this.farLeftBottomPoint.x + this.right.x*farWidht, 
		this.farLeftBottomPoint.y + this.right.y*farWidht, 
		this.farLeftBottomPoint.z + this.right.z*farWidht);
								
	this.farRightTopPoint.set(this.farLeftTopPoint.x + this.right.x*farWidht, 
		this.farLeftTopPoint.y + this.right.y*farWidht, 
		this.farLeftTopPoint.z + this.right.z*farWidht);
								
	// near plane points.						
	this.nearLeftBottomPoint.set(this.nearCenterPoint.x - this.right.x*nearWidth*0.5 - this.up.x*nearHeight*0.5, 
		this.nearCenterPoint.y - this.right.y*nearWidth*0.5 - this.up.y*nearHeight*0.5, 
		this.nearCenterPoint.z - this.right.z*nearWidth*0.5 - this.up.z*nearHeight*0.5);
	
	this.nearLeftTopPoint.set(this.nearLeftBottomPoint.x + this.up.x*nearHeight, 
		this.nearLeftBottomPoint.y + this.up.y*nearHeight, 
		this.nearLeftBottomPoint.z + this.up.z*nearHeight);
								
	this.nearRightBottomPoint.set(this.nearLeftBottomPoint.x + this.right.x*nearWidth, 
		this.nearLeftBottomPoint.y + this.right.y*nearWidth, 
		this.nearLeftBottomPoint.z + this.right.z*nearWidth);
								
	this.nearRightTopPoint.set(this.nearLeftTopPoint.x + this.right.x*nearWidth, 
		this.nearLeftTopPoint.y + this.right.y*nearWidth, 
		this.nearLeftTopPoint.z + this.right.z*nearWidth);
	
	// calculate directions.
	this.leftBottomDir.set(this.farLeftBottomPoint.x - this.nearLeftBottomPoint.x, this.farLeftBottomPoint.y - this.nearLeftBottomPoint.y, this.farLeftBottomPoint.z - this.nearLeftBottomPoint.z);
	this.leftBottomDir.unitary(); // no necessary.
	
	this.rightTopDir.set(this.farRightTopPoint.x - this.nearRightTopPoint.x, this.farRightTopPoint.y - this.nearRightTopPoint.y, this.farRightTopPoint.z - this.nearRightTopPoint.z);
	this.rightTopDir.unitary(); // no necessary.
	
	// near plane.
	plane = this.frustum.planesArray[0];
	plane.setPointAndNormal(this.nearCenterPoint.x, this.nearCenterPoint.y, this.nearCenterPoint.z, this.direction.x, this.direction.y, this.direction.z);
							
	// far plane.
	plane = this.frustum.planesArray[1];
	plane.setPointAndNormal(this.farCenterPoint.x, this.farCenterPoint.y, this.farCenterPoint.z, -this.direction.x, -this.direction.y, -this.direction.z);

	// left plane.
	this.leftNormal = this.leftBottomDir.crossProduct(this.up, this.leftNormal);
	this.leftNormal.unitary();
	plane = this.frustum.planesArray[2];
	plane.setPointAndNormal(this.position.x, this.position.y, this.position.z, this.leftNormal.x, this.leftNormal.y, this.leftNormal.z);
							
	// bottom plane.
	this.bottomNormal = this.right.crossProduct(this.leftBottomDir, this.bottomNormal);
	this.bottomNormal.unitary();
	plane = this.frustum.planesArray[3];
	plane.setPointAndNormal(this.position.x, this.position.y, this.position.z, this.bottomNormal.x, this.bottomNormal.y, this.bottomNormal.z);
							
	// right plane.
	this.rightNormal = this.up.crossProduct(this.rightTopDir, this.rightNormal);
	this.rightNormal.unitary();
	plane = this.frustum.planesArray[4];
	plane.setPointAndNormal(this.position.x, this.position.y, this.position.z, this.rightNormal.x, this.rightNormal.y, this.rightNormal.z);
	
	// top plane.
	this.topNormal = this.rightTopDir.crossProduct(this.right, this.topNormal);
	this.topNormal.unitary();
	plane = this.frustum.planesArray[5];
	plane.setPointAndNormal(this.position.x, this.position.y, this.position.z, this.topNormal.x, this.topNormal.y, this.topNormal.z);
};























