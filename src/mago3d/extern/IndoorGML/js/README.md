# JavaScript files for Indoor Viewer in Cesium

This briefly describe the main functions to make it easier for you to use.</br>
A detailed description of each module can be found in the library of [the demo site](https://tntweb.herokuapp.com/) or comments on source code.

## Objects
Newly defined objects for development usability of project.

### CellSpaceMember
Objects storing CellSpaceMember in IndoorGML.

| function name | description |
|:-------------------------|:-------------------------------|
| new CellSpaceMember | Create new CellSpaceMember object. |

### Coordinate
Coordinate data format.

| function name | description |
|:-------------------------|:-------------------------------|
| new Coordinate | Create new Coordinate object. |

### MoveState
Status variables that are used for moving the movement in IndoorNavigation.

| function name | description |
|:-------------------------|:-------------------------------|
| new MoveState | Create new MoveState object. |

### PrimitiveOption
PrimitiveOption is an object used to give the property of a polygon that constitutes a building when creating a building in [DisplayHelper](https://github.com/STEMLab/3DINV/blob/master/Cesium/js/DisplayHelper.js). The member variable of this object is used to define [Cesium.Material](https://cesiumjs.org/Cesium/Build/Documentation/Material.html).

| function name | description |
|:-------------------------|:-------------------------------|
| new PrimitiveOption | Create new PrimitiveOption object. |
| getMaterial | Using member variables of PrimitiveOption generates [Cesium.Material](https://cesiumjs.org/Cesium/Build/Documentation/Material.html). If this type is not both of "Image" and "Color" returns below. |

### RoomInfo
Storing data about room parsed from cellSpaceMember and edges.

| function name | description |
|:-------------------------|:-------------------------------|
| new RoomInfo | Create new RoomInfo object. |

### StateMember
State Member Class. This can be thought of as simply a node.

| function name | description |
|:-------------------------|:-------------------------------|
| new StateMember | Create new StateMember object. |

### SurfaceMember
Objects storing CellSpaceMember in IndoorGML. Creating the surfaceMember Class.

| function name | description |
|:-------------------------|:-------------------------------|
| new SurfaceMember | Create new SurfaceMember object. |

### TransitionMember
Transition member Class. This can be thought of as simply a edge.

| function name | description |
|:-------------------------|:-------------------------------|
| new TransitionMember | Create new TransitionMember object. |

## Modules
### GMLDataContainer
A module containing Data from IndoorGML.</br>
This module contains the variables required to navigate in 3D buildings built in DisplayHelper and the functions required for parsing that variables from json object.

| function name | description |
|:-------------------------|:-------------------------------|
| new GMLDataContainer | Create new GMLDataContainer object.</br>When this function is called,  the constructor parses the json file input as its parameter and stores it in the module object. |
| rotateBuilding | When the inputted coordinates differs from the actual world, this tries to rotate and re-locate the building to reduce the gap. |

### DisplayHelper
DisplayHelper draw simple building using geometry data of cellSpaceMember from IndoorGML file.</br>
The building that drawing by this module will be consist of simple polygon and you can add some color or texture(image) on it.

| function name | description |
|:-------------------------|:-------------------------------|
| new DisplayHelper | Create new DisplayHelper object.</br> When this function is called , the constructor make geometry instances from cellspaceMember of GMLDataContainer and stores it in the module object. |
| displayBuilding | Display building on Cesuim viewer.</br> You can add color or texture for each instances using parameter. And these options are defined in Objects.PrimitiveOption. |
| displayPathAsPolyline | Display paths on viewer using edges value of GMLDataContainer.</br>With this function, path will draw by polyline. |
| displayPathAsPolygon | Display paths on viewer using edges value of GMLDataContainer.</br>With this function, path will draw by polygon. This will supply more clear line for path than `displayPathAsPolyline`. |

### IndoorNavigation
This module provides functions using for navigating building that drew by DisplayHelper.
You can navigate the building simply giving these functions to button as onClick action or some the other way.

| function name | description |
|:-------------------------|:-------------------------------|
| new IndoorNavigation | Create new IndoorNavigation object.</br> The GMLDataContainer entered as the parameter must be the same as that given to the DisplyHelper. |
| setTreeViewNavigation | If you want to use tree view containg room data, you can use this function for calling setting function of tree view in html.</br>Recommand tree view plugin is jstree.</br>Make sure that name of function which setting tree view are `setTreeView(data)`. |
| onClickTreeView | If click one value of tree view, camera move to a space where that value pointed.</br> To set onclick this function to tree view, you should call function in `main.js`. |
| actionTurnLeft | This function make camera turn to left as much as IndoorNavigation.turnRate. |
| actionTurnRight | This function make camera turn to right as much as IndoorNavigation.turnRate. |
| actionMoveFront | This function make camera move front, if module:IndoorNavigation.nowMoveState and the camera is on the right condition.</br>The right conditions include: </br> 1.  nowMoveState should have proper source and destination. This will be checked by `checkAndAssignDst`.</br> 2. The heading of the camera should direct source and destination of nowMoveState. This will be checked by `getDirection`.|
| actionMoveBack | This function make camera move back, if module:IndoorNavigation.nowMoveState and the camera is on the right condition.</br>3The conditions for moving is same as `actionMoveFront`, different is in `actionMoveFront` when both of condition appropriate satisfied the camera move to front but in this function the will move to back. |
| actionTurnStraight | This function make the camera turn to due east and place it horizontally on the ground. |
| actionZoomIn | This function make camera zoom in as much as IndoorNavigation.zoomRate. |
| actionZoomOut | This function make camera zoom out as much as IndoorNavigation.zoomRate. |
| onClickEdge | This function make camera move to direction of clicked edge. |
