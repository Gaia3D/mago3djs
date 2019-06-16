/* eslint-disable strict */

describe("특정 데이터(vehicle, F4D_AutonomousBus)를 대상으로 BuildingSeedList 테스트, 사전작업으로 objectIndexFile 로드", function () 
{
	var seedList;

	var path = 'http://localhost';
	var geometrySubDataPath = 'vehicle';
	var dummyCacheVersion = undefined;
	var fileName = path + "/f4d/" + geometrySubDataPath + Constant.OBJECT_INDEX_FILE + Constant.CACHE_VERSION + dummyCacheVersion;

	beforeAll(function()
	{
		return getXhrPromise(fileName).then(function(res) 
		{
			seedList = new BuildingSeedList();
			//Promise 정상 수행됬을 때 ArrayBuffer 할당.
			seedList.dataArrayBuffer = res;
		});
	});

	it('완료 후 dataArrayBuffer 할당 체크', function() 
	{	
		expect(seedList.dataArrayBuffer).toBeDefined();
	});
	describe('parseBuildingSeedArrayBuffer 테스트', function() 
	{
		var correctSeedCnt = 1;
		var correctSeedId = 'AutonomousBus';
		var correctSeedFileName = 'F4D_AutonomousBus';
		var correctLon = 128.593909;
		var correctLan = 34.903708;
		var correctAlt = 10;
		var correctMinX = -1.1302670240402222;
		var correctMinY = -2.580000162124634;
		var correctMinZ = -1.2879274929344546e-16;
		var correctMaxX = 1.1302670240402222;
		var correctMaxY = 2.580000162124634;
		var correctMaxZ = 2.42134952545166;
		
		beforeAll(function() 
		{
			seedList.parseBuildingSeedArrayBuffer();
		});
		
		it('buildingseed length check', function() 
		{
			var buildSeedLength = seedList.getBuildingSeedLength();
			expect(buildSeedLength).toEqual(correctSeedCnt);
		});

		it('buildingseed 속성 check', function() 
		{
			for (var i=0, len = seedList.getBuildingSeedLength(); i < len; i++) 
			{
				var buildingSeed = seedList.getBuildingSeed(i);
				expect(buildingSeed.buildingId).toEqual(correctSeedId);
				expect(buildingSeed.buildingFileName).toEqual(correctSeedFileName);
				expect(buildingSeed.geographicCoord.longitude).toEqual(correctLon);
				expect(buildingSeed.geographicCoord.latitude).toEqual(correctLan);
				expect(buildingSeed.geographicCoord.altitude).toEqual(correctAlt);
				expect(buildingSeed.bBox.minX).toEqual(correctMinX);
				expect(buildingSeed.bBox.minY).toEqual(correctMinY);
				expect(buildingSeed.bBox.minZ).toEqual(correctMinZ);
				expect(buildingSeed.bBox.maxX).toEqual(correctMaxX);
				expect(buildingSeed.bBox.maxY).toEqual(correctMaxY);
				expect(buildingSeed.bBox.maxZ).toEqual(correctMaxZ);
			}
		});
	});
});

describe('BuildingSeedList', function () 
{
	var buildingSeedList;
	describe('객체 생성 시', function()
	{
		it('new 키워드 없이 생성할 경우 예외를 던져야 함', function () 
		{
			expect(function () 
			{
				return BuildingSeedList();
			}).toThrowError(Error);
		});
	});

	describe('메소드 테스트 :', function () 
	{
		beforeEach(function () 
		{
			buildingSeedList = new BuildingSeedList();
		});
		describe('getBuildingSeed(idx) 실행 시', function() 
		{
			var testCnt = 5;
			beforeEach(function () 
			{
				for (var i=0; i<testCnt; i++) 
				{
					buildingSeedList.newBuildingSeed();
				}
			});
			it('idx가 string이나 number가 아닐 시 에러를 표출 하는가?', function() 
			{
				//TODO : 함수빼기.
				var errorTargets = [function(){}, {}, [], true, null, undefined]; 
				for (var i in errorTargets) 
				{
					if ( errorTargets.hasOwnProperty(i)) 
					{
						var errorTarget = errorTargets[i];
						expect(function() 
						{
							buildingSeedList.getBuildingSeed(errorTarget);
						}).toThrowError(Error, 'idx is required to be a string or number.');
					}
				}
			});

			it('idx가 배열 범위를 벗어 났을 시 에러를 표출 하는가?', function () 
			{
				var errorTargets = [-1, testCnt];
				for (var i in errorTargets) 
				{
					if ( errorTargets.hasOwnProperty(i)) 
					{
						var errorTarget = errorTargets[i];
						expect(function() 
						{
							buildingSeedList.getBuildingSeed(errorTarget);
						}).toThrowError(Error, 'range over.');
					}
				}
			});
		});
	});
});