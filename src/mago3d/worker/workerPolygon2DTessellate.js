'use strict';

importScripts('./src/BoundingRectangle_.js');
importScripts('./src/Constant_.js');
importScripts('./src/Point2D_.js');
importScripts('./src/Line2D_.js');
importScripts('./src/Point2DList_.js');
importScripts('./src/Segment2D_.js');
importScripts('./src/Polygon2D_.js');
importScripts('./src/CODE_.js');
importScripts('./src/Utils_.js');

var worker = self;

worker.onmessage = function (e) 
{
    // workerPolygon2DTessellate.***
    var cartesiansArray = e.data.positions;

    // now, create point2dArray.***
	var point2dList = new Point2DList_();
    //var point2dArray = [];
    var pointsCount = cartesiansArray.length / 2.0;
    var point2d;
    var x, y;
    for(var i=0; i<pointsCount; i++)
    {
        x = cartesiansArray[i * 2];
        y = cartesiansArray[i *2 + 1];
        point2d = new Point2D_(x, y);
        //point2dArray.push(point2d);
		point2dList.addPoint(point2d);
    }

    var polygon2d = new Polygon2D_({point2dList : point2dList});
    var concaveVerticesIndices = polygon2d.calculateNormal(undefined);
    
    // Now tessellate.***
    var convexPolygonsArray = [];
    convexPolygonsArray = polygon2d.tessellate(concaveVerticesIndices, convexPolygonsArray);

    // now, make convexPolygonsIndicesArray.***
    var convexPolygonIndicesArray = [];
    
    polygon2d.setIdxInList();
    var convexPolygonsCount = convexPolygonsArray.length;
    for(var i=0; i<convexPolygonsCount; i++)
    {
        var convexPolygonIndices = [];
        var convexPolygon = convexPolygonsArray[i];
        var pointsCount = convexPolygon.point2dList.getPointsCount();
        for(var j=0; j<pointsCount; j++)
        {
            var point2d = convexPolygon.point2dList.getPoint(j);
            convexPolygonIndices.push(point2d.idxInList);
        }

        // finally put the indices into result "convexPolygonIndicesArray".***
        convexPolygonIndicesArray.push(convexPolygonIndices);
    }

    worker.postMessage({result : 
        {
            convexPolygonIndicesArray : convexPolygonIndicesArray,
            concaveVerticesIndices : concaveVerticesIndices
        }
    });
	
}


