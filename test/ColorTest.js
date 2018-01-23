'use district';

describe("Color 테스트", function(){
	var color;
	
	it('객체 생성시 new 키워드 없이 생성할 경우 예외를 던져야 함', function() {
		expect(function() {
			color = new Color();
		}).not.toThrowError('이 객체는 new를 사용하여 생성해야 합니다.');
	});
	
	beforeEach(function (){
		color = new Color();
	});
	
	it("color 기본 값", function() {
		expect(color.r).toEqual(0.0);
		expect(color.g).toEqual(0.0);
		expect(color.b).toEqual(0.0);
		expect(color.a).toEqual(0.0)
	})
	it("color setRGB Alhpa값은 0", function (){
		color.setRGB(1.0,2.0,3.0);
		expect(color.a).toEqual(0);
	});
	
})
