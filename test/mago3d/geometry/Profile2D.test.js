/* eslint-disable strict */

describe("Profile2D 테스트", function()
{
    var profile2D;
    var polyLine;
    var arc;
    var circle;
    var rect;
    var point3d;
    var star;
    var profile2D;


    beforeEach(function()
    {
        // Outer ring.**
        profile2D  = new Profile2D();
        var outerRing = profile2D.newOuterRing();
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

    });

	describe('Outer ring', function()
	{
        it('is set as polyline2D and Arc', function()
		{
            
			expect(profile2D.outerRing.getPoints()[0].getX()).toEqual(7);
			expect(profile2D.outerRing.getPoints()[0].getY()).toEqual(7);

			expect(profile2D.outerRing.getPoints()[1].getX()).toEqual(0);
			expect(profile2D.outerRing.getPoints()[1].getY()).toEqual(7);

			expect(profile2D.outerRing.getPoints()[2].getX()).toEqual(0);
			expect(profile2D.outerRing.getPoints()[2].getY()).toEqual(0);

			expect(profile2D.outerRing.getPoints()[3].getX()).toEqual(7);
			expect(profile2D.outerRing.getPoints()[3].getY()).toEqual(0);

			expect(profile2D.outerRing.getPoints()[9].getX()).toEqual(10.5);
			expect(profile2D.outerRing.getPoints()[9].getY()).toBeCloseTo(3.5,10);
  
		});


    });
    describe('Inner ring', function(){
        describe('is defaulty not set',function(){
            it('with checking hasHoles returns false',function(){
                expect(profile2D.hasHoles()).toBe(false);
            });
        });

        describe('is set',function(){
            beforeEach(function(){
                //Set a inner hole as a rectangle.
                var innerRing;
                innerRing = profile2D.newInnerRing();
                rect = innerRing.newElement("RECTANGLE");
                //set center point of the rectangle
                rect.setCenterPosition(3, 3);
                //set the width and height of the rectangle
                rect.setDimensions(2, 2);
            });

            it('and check it as hasHole returning true',function(){
                expect(profile2D.hasHoles()).toBe(true);
            });

            it('as a rectangle and check it', function()
            {
                //Rectangle의 중앙점이 (3,3)으로 설정되었는가
                expect(profile2D.getInnerRingsList().getRing(0).getElement(0).getCenterPosition(0).getX()).toEqual(3);
                expect(profile2D.getInnerRingsList().getRing(0).getElement(0).getCenterPosition(0).getY()).toEqual(3);

                //Rectangle의 가로,세로가 각각 2로 설정되었는가
                expect(profile2D.getInnerRingsList().getRing(0).getElement(0).getWidth()).toEqual(2);
                expect(profile2D.getInnerRingsList().getRing(0).getElement(0).getHeight()).toEqual(2);

            });
        });
    });
});