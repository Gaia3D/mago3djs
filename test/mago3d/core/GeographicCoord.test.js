/* eslint-disable strict */

describe("GeographicCoord 테스트", function () 
{
	var geographicCoord;
	var testLon = -180;
	var testLat = -90;
	var testAlt = 0;

	describe('객체 생성 시', function()
	{
		it('new 키워드 없이 생성할 경우 예외를 던져야 함', function () 
		{
			expect(function () 
			{
				return GeographicCoord();
			}).toThrowError(Error);
		});

		beforeEach(function()
		{
			geographicCoord = new GeographicCoord(testLon, testLat, testAlt);
		});

		it('lon, lat, alt를 주입받을 시 각각 할당', function()
		{
			expect(geographicCoord.longitude === testLon).toBeTruthy();
			expect(geographicCoord.latitude === testLat).toBeTruthy();
			expect(geographicCoord.altitude === testAlt).toBeTruthy();
		});
	});
});