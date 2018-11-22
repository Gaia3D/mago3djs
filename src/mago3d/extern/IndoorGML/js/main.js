require.config({
  waitSeconds: 2,
  paths: {
    text: "../json/text",
    json: "../json/json" //alias to plugin
  }
});

require([
  "./GMLDataContainer",
  "./DisplayHelper",
  "./Objects/PrimitiveOption",
  "./IndoorNavigationData",
  "./IndoorNavigationAction",
  "json!../json/SAMPLE_DATA_LWM_3D_1.0.3.json"
], function(
  GMLDataContainer,
  DisplayHelper,
  PrimitiveOption,
  IndoorNavigationData,
  IndoorNavigationAction,
  SampleIndoorJson
) {
  'use strict';

  console.log(SampleIndoorJson);

  var gmlDataContainer = new GMLDataContainer(SampleIndoorJson, "1.0.3");

  gmlDataContainer.rotateBuilding(
   viewer,
   new Cesium.Cartesian3.fromDegrees(127.1034, 37.51283, 0), 0.43);

  var displayHelper = new DisplayHelper(gmlDataContainer, viewer);

  displayHelper.displayBuilding(viewer,
    new PrimitiveOption("Image", false, "./Texture/reddish.png", null),
    new PrimitiveOption("Image", false, "./Texture/white_wall.png", null),
    new PrimitiveOption("Image", false, "./Texture/gray_floor.png", null),
    new PrimitiveOption("Image", false, "./Texture/white_wall.png", null));

  displayHelper.displayPathAsPolygon(viewer);

  var canvas = viewer.canvas;
  canvas.setAttribute('tabindex', '0'); // needed to put focus on the canvas
  canvas.onclick = function() {
    canvas.focus();
  };

  var indoorNavigationData = new IndoorNavigationData(gmlDataContainer);
  var indoorNavigationAction = new IndoorNavigationAction(viewer, indoorNavigationData);
  indoorNavigationData.setEntranceHref("YOUR BUILDING ENTRANCE HREF");
  indoorNavigationAction.setTreeViewNavigation();
  indoorNavigationAction.flyToBuilding(new Cesium.Cartesian3(-3056126.738880351, 4040419.643528764, 3862636.211338415), 6.283185307179427, -0.785455165823338, 6.283185307179586);

  // set onclick funtion for navigation
  $('#jstree').on("changed.jstree", function(e, data) {
    indoorNavigationAction.onClickTreeView(data.selected);
  });


  var handler = new Cesium.ScreenSpaceEventHandler(viewer.canvas);
  handler.setInputAction(function(movement) {
    var feature = viewer.scene.pick(movement.position);
    if (Cesium.defined(feature)) {
      indoorNavigationAction.onClickPolygonPath(feature);
    }
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK);


  $('#controller').click(function(event){
    var offsetX = event.offsetX == undefined ? event.layerX : event.offsetX;
    var offsetY = event.offsetY == undefined ? event.layerY : event.offsetY;
    checkButtonAndExcuteOnClick(offsetX, offsetY);
  });

  function checkButtonAndExcuteOnClick(offsetX, offsetY){

    if( 66 <= offsetX && offsetX <= 81 && 37 <= offsetY && offsetY <= 56 ){
      console.log("onclick moveFront");
      indoorNavigationAction.actionMoveFront();
    } else if( 66 <= offsetX && offsetX <= 81 && 91 <= offsetY && offsetY <= 111 ){
      console.log("onclick moveBack");
      indoorNavigationAction.actionMoveBack();
    } else if( 37 <= offsetX && offsetX <= 57 && 65 <= offsetY && offsetY <= 80 ){
      console.log("onclick TurnLeft");
      indoorNavigationAction.actionTurnLeft();
    } else if( 92 <= offsetX && offsetX <= 111 && 65 <= offsetY && offsetY <= 80 ){
      console.log("onclick TurnRight");
      indoorNavigationAction.actionTurnRight();
    } else if( 225 <= offsetX && offsetX <= 255 && 36 <= offsetY && offsetY <= 64 ){
      console.log("onclick TurnStraight");
      indoorNavigationAction.actionTurnStraight();
    } else if( 204 <= offsetX && offsetX <= 234 && 74 <= offsetY && offsetY <= 104 ){
      console.log("onclick ZoomIn");
      indoorNavigationAction.actionZoomIn();
    } else if( 249 <= offsetX && offsetX <= 279 && 77 <= offsetY && offsetY <= 107 ){
      console.log("onclick ZoomOut");
      indoorNavigationAction.actionZoomOut();
    }
  }

});
