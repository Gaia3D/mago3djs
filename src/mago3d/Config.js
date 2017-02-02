var Mago3DConfig = Mago3DConfig || {};

Mago3DConfig.getInformation = (function() {
	
	// 공개 = github, 개발 = dev, 검증 = stage, 운영 = production
	var deployType = 'dev';
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