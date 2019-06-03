/* eslint-disable strict */

describe("SmartTile 테스트", function () 
{
    var smartTile;
    var testTileName = 'testTile';
    var magoManager = new MagoManager();
    var minGeographicCoord = new GeographicCoord(-180, -90, 0);
    var maxGeographicCoord = new GeographicCoord(0, 90, 0);


    var midLongitude = -90; //(maxGeographicCoord.longitude + minGeographicCoord.longitude)/2;
	var midLatitude = 0;//(maxGeographicCoord.latitude + minGeographicCoord.latitude)/2;
	var midAltitude = 0;//(maxGeographicCoord.altitude + minGeographicCoord.altitude)/2;

    var midGeographicCoord = new GeographicCoord(midLongitude, midLatitude, midAltitude);
    describe('객체 생성 시', function()
    {
        it('new 키워드 없이 생성할 경우 예외를 던져야 함', function () 
        {
            expect(function () 
            {
                return SmartTile();
            }).toThrowError(Error);
        });

        beforeEach(function()
		{
            smartTile = new SmartTile(testTileName);
        });

        it('smartTileName을 주입받을 시 this.name에 할당', function()
        {
            expect(smartTile.name === testTileName).toBeTruthy();
        });
    });

    describe('메소드 검사 : ', function ()
    {
        describe('makeSphereExtent(magoManager)', function ()
        {
            var resultSphereExtent;
            describe('computeSphereExtent(magoManager, minGeographicCoord, maxGeographicCoord, resultSphereExtent)', function ()
            {
                it('필수 매개변수 minGeographicCoord, maxGeographicCoord 체크', function ()
                {
                    expect(SmartTile.computeSphereExtent(magoManager, undefined, maxGeographicCoord, resultSphereExtent)).toBeUndefined();
                    expect(SmartTile.computeSphereExtent(magoManager, minGeographicCoord, undefined, resultSphereExtent)).toBeUndefined();
                    expect(SmartTile.computeSphereExtent(magoManager, undefined, undefined, resultSphereExtent)).toBeUndefined();
                });

                beforeEach(function()
                {
                    resultSphereExtent = SmartTile.computeSphereExtent(magoManager, minGeographicCoord, maxGeographicCoord, resultSphereExtent);
                });
                it('결과물 타입 체크', function ()
                {   
                    expect(resultSphereExtent instanceof Sphere).toBeTruthy();
                });

                it('결과물 값 체크', function ()
                {
                    var centerPoint = ManagerUtils.geographicCoordToWorldPoint(midGeographicCoord.longitude, midGeographicCoord.latitude, midGeographicCoord.altitude, centerPoint, magoManager);
                    expect(resultSphereExtent.centerPoint.x).toEqual(centerPoint.x);
                    expect(resultSphereExtent.centerPoint.y).toEqual(centerPoint.y);
                    expect(resultSphereExtent.centerPoint.z).toEqual(centerPoint.z);

                    var cornerPoint = ManagerUtils.geographicCoordToWorldPoint(minGeographicCoord.longitude, minGeographicCoord.latitude, minGeographicCoord.altitude, cornerPoint, magoManager);

                    var expectR = centerPoint.distTo(cornerPoint.x, cornerPoint.y, cornerPoint.z) * 1.1;
                    expect(resultSphereExtent.r).toEqual(expectR);
                });
            });
        });
    })
});