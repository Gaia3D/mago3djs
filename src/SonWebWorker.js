
//importScripts('../Build/CesiumUnminified/SonGeometryJScript.js'); // No.***
importScripts('SonGeometryJScript.js'); // Yes.***
importScripts('SonGeometryModifier.js'); 
//importScripts('CullingVolume.js');



// Test son.*****************************************************
var currentCamPos = new f4d_point3d();
var lastCamPos = new f4d_point3d();
var squareDistUmbral = 22.0;
var building_project = undefined;
var compRefList_array_background = undefined;

//var compRefList_Container = new f4d_CompoundReferencesList_Container();
//var interiorCompRefList_Container = new f4d_CompoundReferencesList_Container();

var f4d_geoModifier = new f4d_geometryModifier();
// End test son.-------------------------------------------------

onmessage = function(e) {
  console.log('Message received from main script');
  var workerResult = 'Result: sonete';
  
  
  
  console.log('Posting message back to main script');
  //postMessage(workerResult);
  var result = possibleCameraPositionChanged(e);
  postMessage([result]);
};

function setTest(value)
{
	squareDistUmbral = value;
	
};

/*
function getFrustumIntersectedProjectBuildings(f4d_projectsList, cullingVolume)
{
	var buildings_array = [];
	var last_squared_dist = undefined;
	var detailed_building = undefined;
	var building_projects_count = f4d_projectsList._BR_buildingsArray.length;
	
	for(var p_counter = 0; p_counter<building_projects_count; p_counter++)
	{
		var BR_Project = f4d_projectsList._BR_buildingsArray[p_counter];
		var squaredDistToCamera = Cartesian3.distanceSquared(cameraPosition, BR_Project._buildingPosition);
		var min_squaredDist_to_see_detailed = 40000;
		var min_squaredDist_to_see = 10000000;
		
		if(squaredDistToCamera > min_squaredDist_to_see)
			continue;
		
		var boundingSphere_Aux = new BoundingSphere();
		boundingSphere_Aux.center = BR_Project._buildingPosition;
		boundingSphere_Aux.radius = 50.0; // 50m. Provisional.***
		
		//----------------------------------------------------------------------------------------------------------------------------
		// var frameState = scene._frameState;
		
		var frustumCull = frameState.cullingVolume.computeVisibility(boundingSphere_Aux);
		if(frustumCull !== Intersect.OUTSIDE) 
		{
			if(squaredDistToCamera < min_squaredDist_to_see_detailed)// min dist to see detailed.***
			{
				if(last_squared_dist)
				{
					if(squaredDistToCamera < last_squared_dist)
					{
						last_squared_dist = squaredDistToCamera;
						buildings_array.push(detailed_building);
						detailed_building = BR_Project;
					}
					else{
						buildings_array.push(BR_Project);
					}
				}
				else{
					last_squared_dist = squaredDistToCamera;
					detailed_building = BR_Project;
				}
			}
			else{
				buildings_array.push(BR_Project);
			}
		}
		
	}
	
	
	return buildings_array;
};
*/

function possibleCameraPositionChanged(e)
{
	var compRefList_Container = e.data[0];
	var interiorCompRefList_Container = e.data[1];
	var camPos = e.data[2];
	//var compRefList_array = e.data[2];
	
	var eye_x = camPos.x;
	var eye_y = camPos.y;
	var eye_z = camPos.z;
	
	var interior_visibleCompRefLists = f4d_geoModifier.f4dCompoundReferencesListContainer_getVisibleCompRefObjectsList(interiorCompRefList_Container, eye_x, eye_y, eye_z);
	var visibleCompRefLists = f4d_geoModifier.f4dCompoundReferencesListContainer_getVisibleCompRefObjectsList(compRefList_Container, eye_x, eye_y, eye_z);
	var total_visibleCompRefLists = visibleCompRefLists.concat(interior_visibleCompRefLists);
	//var interior_visibleCompRefLists = interiorCompRefList_Container.get_visibleCompRefObjectsList(eye_x, eye_y, eye_z); // Cannot use alien functions.***
	//var visibleCompRefLists = compRefList_Container.get_visibleCompRefObjectsList(eye_x, eye_y, eye_z); // Cannot use alien functions.***
	//var total_visibleCompRefLists = visibleCompRefLists.concat(interior_visibleCompRefLists);

	return total_visibleCompRefLists;
	  /*
	// 1rst, frustum culling.*******************
	var f4d_projectsList = e.data[0];
	var cullingVolume = e.data[1];
	//var projects_list = getFrustumIntersectedProjectBuildings(f4d_projectsList, cullingVolume);
	
	
	var squaredDist = lastCamPos.squareDistTo(currentCamPos.x, currentCamPos.y, currentCamPos.z);
	if(squaredDist > squareDistUmbral)
	{
		// Camera position changed.***
		lastCamPos.set(currentCamPos.x, currentCamPos.y, currentCamPos.z); 
		
	}
	else{
		// Camera doesnt moved.***
	}
	*/
};

/*
// An example.***
var i = 0;

function timedCount() {
    i = i + 1;
    postMessage(i);
    setTimeout("timedCount()",500);
}

//timedCount();
*/
/*
var n = 1;
search: while (true) {
  n += 1;
  for (var i = 2; i <= Math.sqrt(n); i += 1)
    if (n % i == 0)
     continue search;
  // found a prime!
  postMessage(n);
}
*/
//# sourceURL=sonWorker.js