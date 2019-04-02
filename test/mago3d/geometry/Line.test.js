'use district';

describe("Line 테스트", function(){
	var line;
	
	it("객체 생성시 new 키워드 없이 생성할 경우 예외를 던져야 함", function() {
		expect(function() {
			line = new Line();
		}).not.toThrowError("이 객체는 new를 사용하여 생성해야 합니다.");
	});
	
	beforeEach(function(){
		line = new Line();
	});
			
	it("Line setPointAndDir 값 설정", function(){
		line.setPointAndDir(1.0,2.0,3.0, 4.0,5.0,6.0);
		expect(line.point.x).toEqual(1.0);
		expect(line.point.y).toEqual(2.0);
		expect(line.point.z).toEqual(3.0);
		expect(line.direction.x).toEqual(0.4558423058385518);
		expect(line.direction.y).toEqual(0.5698028822981898);
		expect(line.direction.z).toEqual(0.6837634587578276);
	});
	
	it("Line setPointAndDir 매개변수가 없어도 상관없다.", function(){
		expect( function (){
			line.setPointAndDir();
		}).not.toThrowError();
	});
	
});