/**
 * 환경 설정 클래스. json 으로 할까 고민도 했지만 우선은 이 형태로 하기로 함
 */
var Mago3DConfig = Mago3DConfig || {};

Mago3DConfig.getInformation = (function() {
	
	// 공개 = github, 개발 = dev, 검증 = stage, 운영 = production
	var deployType = 'dev';
	// 3d 가시화 방법
	var productType = "cesium";
	// f4d 파일 읽는 경로
	var dataPath = '/data';
	// 최초 로딩 좌표. 위, 경도
	var startLocation = '';
	// 화면에서 보여줄 객체(빌딩)
	var loadObject = '';
	
	return {
		getDeployType : function() {
			return deployType;
		},
		getProductType : function() {
			return productType;
		},
		getDataPath : function() {
			return dataPath;
		},
		getInitLocation : function() {
			return startLocation;
		},
		getLoadObject : function() {
			return loadObject;
		}
	};
}());
