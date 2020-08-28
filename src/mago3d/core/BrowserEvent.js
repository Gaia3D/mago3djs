'use strict';

/**
 * browser event instance
 * @param {string} type required. 
 * @param {object} position is screen coord, if mousemove has startPosition and endPositon, otherwise one position
 * @param {MagoManager} magoManager 
 */
var BrowserEvent = function(type, position, magoManager) 
{

	if (!(this instanceof BrowserEvent)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
    
	if (isEmpty(type))
	{
		throw new Error(Messages.REQUIRED_EMPTY_ERROR('type'));
	}

	this.type = type;
	this.timestamp = new Date();
	if (position && typeof position === 'object') 
	{
		if (position.hasOwnProperty('x') && position.hasOwnProperty('y'))
		{
			var worldCoordinate;
			var sceneState = magoManager.sceneState;
			var gl = magoManager.getGl();
			var camera = sceneState.camera;

			var maxDepth = 0.996;
			var currentDepthFbo;
			var currentFrustumFar;
			var currentFrustumNear;
			var currentLinearDepth;
			var depthDetected = false;
			var frustumsCount = magoManager.numFrustums;
			for (var i = 0; i < frustumsCount; i++)
			{
				var frustumVolume = magoManager.frustumVolumeControl.getFrustumVolumeCulling(i); 
				var depthFbo = frustumVolume.depthFbo;

				currentLinearDepth = ManagerUtils.calculatePixelLinearDepth(gl, position.x, position.y, depthFbo, magoManager);
				if (currentLinearDepth < maxDepth) // maxDepth/255 = 0.99607...
				{ 
					currentDepthFbo = depthFbo;
					var frustum = camera.getFrustum(i);
					currentFrustumFar = frustum.far[0];
					currentFrustumNear = frustum.near[0];
					depthDetected = true;
					break;
				}
			}

			if (!depthDetected && magoManager.isCesiumGlobe())
			{
				var scene = magoManager.scene;
				var camera = scene.frameState.camera;
				var ray = camera.getPickRay(new Cesium.Cartesian2(position.x, position.y));
				worldCoordinate = scene.globe.pick(ray, scene);
			} else 
			{
				var camCoord = MagoWorld.screenToCamCoord(position.x, position.y, magoManager, camCoord);
				if(!camCoord)
				{
					worldCoordinate = undefined;
				} 
				else 
				{
					worldCoordinate = ManagerUtils.cameraCoordPositionToWorldCoord(camCoord, worldCoordinate, magoManager);
				}
			}

			var eventCoordinate = {};
			eventCoordinate.screenCoordinate = new Point2D(position.x, position.y);
			if (worldCoordinate)
			{
				eventCoordinate.worldCoordinate = worldCoordinate;
				eventCoordinate.geographicCoordinate = ManagerUtils.pointToGeographicCoord(worldCoordinate);
			}
            
			this.point = eventCoordinate;
		} 
		else if (position.hasOwnProperty('startPosition') && position.hasOwnProperty('endPosition'))
		{
			var startEventCoordinate = ManagerUtils.getComplexCoordinateByScreenCoord(magoManager.getGl(), position.startPosition.x, position.startPosition.y, undefined, undefined, undefined, magoManager);
			if (!startEventCoordinate)
			{
				startEventCoordinate = {screenCoordinate: new Point2D(position.startPosition.x, position.startPosition.y)};
			}
	        var endEventCoordinate = ManagerUtils.getComplexCoordinateByScreenCoord(magoManager.getGl(), position.endPosition.x, position.endPosition.y, undefined, undefined, undefined, magoManager);
			if (!endEventCoordinate)
			{
				endEventCoordinate = {screenCoordinate: new Point2D(position.endPosition.x, position.endPosition.y)};
			}
            
			this.startEvent = startEventCoordinate;
			this.endEvent = endEventCoordinate;
		}
		else 
		{
			this.position = position;
		}
	}
};