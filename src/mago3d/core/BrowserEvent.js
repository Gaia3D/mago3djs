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
			// Enters here when mouse-drag.***
			var worldCoordinate;
			var sceneState = magoManager.sceneState;
			var gl = magoManager.getGl();
			var camera = sceneState.camera;

			// Test the new method: depth + normal + frustumIdx.************************************************************************
			var texturesMergerFbo = magoManager.texturesManager.texturesMergerFbo;
			var depthTex = texturesMergerFbo.colorBuffer;
			var normalTex = texturesMergerFbo.colorBuffer1;
			var resultObject = ManagerUtils.calculatePixelLinearDepthV2(gl, position.x, position.y, depthTex, normalTex, magoManager);
			/* resultObject = {linearDepth : linearDepth,
								normal4    : floatNormalPixels,
								frustumIdx : frustumIdx,
								near       : near,
								far        : far };
				*/
			//---------------------------------------------------------------------------------------------------------------------------
			
			var currentFrustumFar;
			var currentFrustumNear;
			var currentLinearDepth;
			var depthDetected = false;
			if(resultObject.frustumIdx < magoManager.numFrustums)
			{
				depthDetected = true;
				currentFrustumFar = resultObject.far;
				currentLinearDepth = resultObject.linearDepth;
			}

			if (!depthDetected && magoManager.isCesiumGlobe())
			{
				var scene = magoManager.scene;
				var camera = scene.frameState.camera;
				var ray = camera.getPickRay(new Cesium.Cartesian2(position.x, position.y));
				worldCoordinate = scene.globe.pick(ray, scene);
			}
			else 
			{
				var camCoord = MagoWorld.screenToCamCoord(position.x, position.y, magoManager, camCoord, resultObject);
				if (!camCoord)
				{
					worldCoordinate = undefined;
				} 
				else 
				{
					worldCoordinate = ManagerUtils.cameraCoordPositionToWorldCoord(camCoord, worldCoordinate, magoManager, resultObject);
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
			// Enters here when mouse-move.***
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
			// Enters here when mouse-wheel.***
			this.position = position;
		}
	}
};