/* eslint-disable strict */

describe("Sphere 테스트", function () 
{
    var sphere;
    var testLon = -180;
    var testLat = -90;
    var testAlt = 0;

    describe('객체 생성 시', function()
    {
        it('new 키워드 없이 생성할 경우 예외를 던져야 함', function () 
        {
            expect(function () 
            {
                return Sphere();
            }).toThrowError(Error);
        });

        beforeEach(function()
		{
            sphere = new Sphere();
        });

        it('default 값 체크', function()
        {
            expect(sphere.r === 0.0).toBeTruthy();
            expect(sphere.centerPoint instanceof Point3D).toBeTruthy();
        });
    });
});