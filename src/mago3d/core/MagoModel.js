'use strict';

/**
 * This is the model from f4d. Is the minimum independent project.
 * @class MagoModel
 * 
 * @param {object} model model object.
 * @param {BuildingSeed} seed require. model bounding box seed.
 */
var MagoModel = function(model, seed) 
{
    if (!(this instanceof MagoModel)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

    if(isEmpty(model.dataId))
    {
        throw new Error(Messages.REQUIRED_EMPTY_ERROR('dataId'));
    }

    if(isEmpty(model.dataGroupId))
    {
        throw new Error(Messages.REQUIRED_EMPTY_ERROR('dataGroupId'));
    }

    if(isEmpty(model.longitude) || isEmpty(model.latitude))
    {
        throw new Error(Messages.REQUIRED_EMPTY_ERROR('longitude','latitude'));
    }

    if(!seed || (seed instanceof BuildingSeed && !seed.hasOwnProperty('bBox'))) {
        throw new Error(Messages.REQUIRED_EMPTY_ERROR('BuildingSeed'));
    }

    this.id = model.dataId;
    this.layerId = model.dataGroupId;
    this.key = model.dataKey;
    this.name = model.dataName;
    this.dataType = model.dataType;
    this.mappingType = defaultValue(model.mappingType, MagoModel.MAPPING_TYPE.ORIGIN);
    this.reference = defaultValue(model.reference, false);
    
    this.geographicCoord = new GeographicCoord(model.longitude, model.latitude, defaultValue(model.altitude, 0));
    this.rotationsDegree = new Point3D(defaultValue(model.pitch, 0), defaultValue(model.roll, 0), defaultValue(model.heading, 0));
    this.bbox = new BoundingBox();

    this.buildingSeed = seed; 

    if (this.buildingSeed.geographicCoord === undefined)
    { this.buildingSeed.geographicCoord = new GeographicCoord(); }

    if (this.buildingSeed.rotationsDegree === undefined)
    { this.buildingSeed.rotationsDegree = new Point3D(); }
    // now calculate the geographic coord of the center of the bbox.
    if (this.buildingSeed.geographicCoordOfBBox === undefined) 
    { this.buildingSeed.geographicCoordOfBBox = new GeographicCoord(); }

    //값
    this._calculate();

    this.style = Object.assign({}, MagoModel.DEFAULT_STYLE, model.style||{});
}

MagoModel.prototype._calculate = function() {
    this.buildingSeed.geographicCoord.setLonLatAlt(this.geographicCoord.longitude, this.geographicCoord.latitude, this.geographicCoord.altitude);
    this.buildingSeed.rotationsDegree.set(this.rotationsDegree.pitch, this.rotationsDegree.roll, this.rotationsDegree.heading);

    var tMatrix = this.getTmatrix();

    // now calculate the geographicCoord of the center of the bBox.
    var bboxCenterPoint = this.buildingSeed.bBox.getCenterPoint(bboxCenterPoint);
    var bboxCenterPointWorldCoord = tMatrix.transformPoint3D(bboxCenterPoint, bboxCenterPointWorldCoord);
    this.buildingSeed.geographicCoordOfBBox = ManagerUtils.pointToGeographicCoord(bboxCenterPointWorldCoord, this.buildingSeed.geographicCoordOfBBox); // original.

    // Set the altitude as the original. This method has little error
    this.buildingSeed.geographicCoordOfBBox.altitude = this.buildingSeed.geographicCoord.altitude;

    // now, calculate the bbox.
    this.bbox.copyFrom(this.buildingSeed.bBox);

    // calculate the geographicCoordOfTheBBox.***
    if (tMatrix !== undefined)
    {
        if (this.mappingType.toLowerCase() === MagoModel.MAPPING_TYPE.ORIGIN)
        {
            bboxCenterPoint = this.bbox.getCenterPoint(bboxCenterPoint);
            var bboxCenterPointWorldCoord = tMatrix.transformPoint3D(bboxCenterPoint, bboxCenterPointWorldCoord);
            this.bbox.geographicCoord = ManagerUtils.pointToGeographicCoord(bboxCenterPointWorldCoord, this.bbox.geographicCoord);
        }
        else if (this.mappingType.toLowerCase() === MagoModel.MAPPING_TYPE.BOUNDINGBOXCENTER)
        {
            this.bbox.geographicCoord = new GeographicCoord();
            this.bbox.geographicCoord.setLonLatAlt(longitude, latitude, height);
        }
    }
}

MagoModel.prototype.getTmatrix = function() {
    var geoCoord = this.geographicCoord;
    var rotateInfo = this.rotationsDegree;

    // calculate the transformation matrix at (longitude, latitude, height).
    var worldCoordPosition = ManagerUtils.geographicCoordToWorldPoint(geoCoord.longitude, geoCoord.latitude, geoCoord.altitude, worldCoordPosition);
    return ManagerUtils.calculateTransformMatrixAtWorldPosition(worldCoordPosition, rotateInfo.heading, rotateInfo.pitch, rotateInfo.roll, undefined);
}

MagoModel.DEFAULT_STYLE = {
    visible : true
}
MagoModel.MAPPING_TYPE = {
    ORIGIN : 'origin',
    BOUNDINGBOXCENTER : 'boundingboxcenter'
}