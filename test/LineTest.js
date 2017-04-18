'use district';

describe("Line 테스트", function(){
	var line;
	it("Line setPointAndDir", function(){
		line = new Line();
		line.setPointAndDir(1.0,2.0,3.0, 4.0,5.0,6.0);
		expect(line.point.x).toEqual(1.0);
		expect(line.point.y).toEqual(2.0);
		expect(line.point.z).toEqual(3.0);
		expect(line.direction.x).toEqual(0.4558423058385518);
		expect(line.direction.y).toEqual(0.5698028822981898);
		expect(line.direction.z).toEqual(0.6837634587578276);
	});
});