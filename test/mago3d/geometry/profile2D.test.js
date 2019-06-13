/* eslint-disable strict */

describe("Profile2D 테스트", function()
{
	describe('임시 테스트', function()
	{
        
		var profile2D;
		var polyLine;
		var arc;
		var circle;
		var rect;
		var point3d;
		var star;


		beforeEach(function()
		{
			// Outer ring.**
			profile2D  = new Profile2D();
			outerRing = profile2D.newOuterRing();
			polyLine = outerRing.newElement("POLYLINE");
			point3d = polyLine.newPoint2d(7, 7); // 0
			point3d = polyLine.newPoint2d(0, 7); // 1
			point3d = polyLine.newPoint2d(0, 0); // 2
			point3d = polyLine.newPoint2d(7, 0); // 3
                
			arc = outerRing.newElement("ARC");
			arc.setCenterPosition(7, 3.5);
			arc.setRadius(3.5);
			arc.setStartAngleDegree(-90.0);
			arc.setSweepAngleDegree(180.0);
			arc.numPointsFor360Deg = 24;
                
			// hole.
			innerRing = profile2D.newInnerRing();
			rect = innerRing.newElement("RECTANGLE");
			rect.setCenterPosition(3, 3);
			rect.setDimensions(2, 2);
		});

		it('set outer ring as polyline2D test', function()
		{
            
			expect(profile2D.outerRing.getPoints()[0].x).toEqual(7);
			expect(profile2D.outerRing.getPoints()[0].y).toEqual(7);

			expect(profile2D.outerRing.getPoints()[1].x).toEqual(0);
			expect(profile2D.outerRing.getPoints()[1].y).toEqual(7);

			expect(profile2D.outerRing.getPoints()[2].x).toEqual(0);
			expect(profile2D.outerRing.getPoints()[2].y).toEqual(0);

			expect(profile2D.outerRing.getPoints()[3].x).toEqual(7);
			expect(profile2D.outerRing.getPoints()[3].y).toEqual(0);

			expect(profile2D.outerRing.getPoints()[9].x).toEqual(10.5);
			expect(profile2D.outerRing.getPoints()[9].y).toBeCloseTo(3.5);
  
		});

		it('set inner ring as Rectangle test', function()
		{
            
			expect(profile2D.hasHoles()).toBe(true);

			//Rectangle의 중앙점이 (3,3)으로 설정되었는가
			expect(profile2D.getInnerRingsList().getRing(0).elemsArray[0].centerPoint.x).toEqual(3);
			expect(profile2D.getInnerRingsList().getRing(0).elemsArray[0].centerPoint.y).toEqual(3);

			//Rectangle의 가로,세로가 각각 2로 설정되었는가
			expect(profile2D.getInnerRingsList().getRing(0).elemsArray[0].width).toEqual(2);
			expect(profile2D.getInnerRingsList().getRing(0).elemsArray[0].height).toEqual(2);

		});
		
	});
});