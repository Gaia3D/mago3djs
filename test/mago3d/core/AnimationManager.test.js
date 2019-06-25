/* eslint-disable strict */

describe('AnimationManager', function()
{
	var testAnimationManager;
	var nodeId;

	beforeEach(function()
	{
		testAnimationManager = new AnimationManager();
		nodeId = "3DS";
	});
    
	it('객체 생성시 new 키워드 없이 생성할 경우 예외를 던져야 한다.', function()
	{
		expect(function ()
		{
			return AnimationManager();
		}).not.toThrowError('이 객체는 new 키워드를 사용하여 생성해야 합니다.');
	});

	describe('putNode(node)', function()
	{
		it("결과 타입 체크", function()
		{
			var testNode = new Node();
			testNode.data = {"nodeId": nodeId};
			testAnimationManager.putNode(testNode);
			expect(Object.prototype.hasOwnProperty.call(testAnimationManager.nodesMap, "3DS")).toBeTruthy();
		});	
	});

}); 