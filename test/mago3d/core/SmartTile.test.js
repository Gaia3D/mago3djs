/* eslint-disable strict */

describe("SmartTile 테스트", function () 
{
	var smartTile;
	var testTileName = 'testTile';
	MagoConfig.serverPolicy.basicGlobe = 'cesium';
	var magoManager = new MagoManager({getPolicy:function(){
		return {
			basicGlobe:'cesium'
		}
	}});

	var minLongitude = -180;
	var minLatitude = -90;
	var minAltitude = 0;

	var maxLongitude = 0;
	var maxLatitude = 90;
	var maxAltitude = 0;

	var minGeographicCoord = new GeographicCoord(minLongitude, minLatitude, minAltitude);
	var maxGeographicCoord = new GeographicCoord(maxLongitude, maxLatitude, maxAltitude);

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

		describe('newSubTile(parentTile)', function ()
		{
			beforeEach(function()
			{
				smartTile = new SmartTile(testTileName);
				smartTile.depth = 0;
			});
			describe('서브타일 생성 시', function() 
			{
				it('정상적인 부모타일이 들어왔을 때, depth가  정상적으로 추가되는지 체크', function ()
				{
					var subTile = smartTile.newSubTile(smartTile);
					expect(subTile.depth).toEqual(smartTile.depth+1);
				});

				it('비정상적인 부모타일(SmartTile형태가 아닌)이 들어왔을 때, 밸리데이션이 작동하는지?', function ()
				{
					var garbage = [undefined, null, 'a', 1, {}, []];
					for (var i=0, len = garbage.length; i<len; i++)
					{
						expect(function()
						{
							smartTile.newSubTile(garbage[i]);
						}).withContext('밸리데이션 코드 추가.').not.toThrowError(TypeError);
					}
				});
				// TODO : 
				// it('비정상적인 부모타일(depth가 없음)이 들어왔을 때, 밸리데이션이 작동하는지?', function ()
				// {});
				// it('비정상적인 부모타일(targetDepth가 없음)이 들어왔을 때, 밸리데이션이 작동하는지?', function ()
				// {});
			});
		});

		describe('setSizesToSubTiles()', function ()
		{
			beforeEach(function()
			{
				smartTile = new SmartTile(testTileName);
				smartTile.depth = 0;
				smartTile.targetDepth = 17;
				smartTile.setSize(minLongitude, minLatitude, minAltitude, maxLongitude, maxLatitude, maxAltitude);

				smartTile.newSubTile(smartTile);
				smartTile.newSubTile(smartTile);
			});
			describe('서브타일 영역 계산 시', function() 
			{
				it('서브타일의 갯수가 4개가 아닐 시, 밸리데이션이 존재하는지?', function ()
				{
					expect(function()
					{
						smartTile.setSizesToSubTiles();
					}).toThrowError(Error, 'When subTiles length is 4, setSizesToSubTiles is ok.');
				});
			});
		});

		describe('intersectsNode()', function ()
		{
			
		});

		describe('intersectPoint()', function ()
		{
			
		});
	});
});