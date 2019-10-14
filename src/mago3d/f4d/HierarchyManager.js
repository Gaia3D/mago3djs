'use strict';
/**
 * 프로젝트와 노드 목록 관리 객체.
 * 실질적으로 화면에 표출될 프로젝트와 노드들을 보관하고 있음.
 * @exception {Error} Messages.CONSTRUCT_ERROR
 * 
 * @class HierarchyManager
 */
var HierarchyManager = function() 
{
	if (!(this instanceof HierarchyManager)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	/**
	 * 프로젝트 보관 객체
	 * @type {Object}
	 */
	this.projectsMap = {};
	
	/**
	 * StaticModelManager
	 * @type {StaticModelManager}
	 */
	this.staticModelsManager;
	
	this.localDatasArray;
};

/**
 * node array와 prjectMap을 초기화. gl Context에서 그려진 내용들 제거
 */
HierarchyManager.prototype.deleteNodes = function(gl, vboMemoryManager) 
{
	for (var key in this.projectsMap)
	{
		if (Object.prototype.hasOwnProperty.call(this.projectsMap, key))
		{
			var nodesMap = this.projectsMap[key];
			
			for (var nodesKey in nodesMap)
			{
				if (Object.prototype.hasOwnProperty.call(nodesMap, nodesKey))
				{
					var node = nodesMap[nodesKey];
					if (node instanceof Node)
					{						
						node.deleteObjects(gl, vboMemoryManager);
						delete nodesMap[nodesKey];
					}
				}
			}
			//nodesMap.clear();
			delete this.projectsMap[key];
		}
	}
	//this.projectsMap.clear();
	this.projectsMap = {};
};

/**
 * StaticModelsManager 반환
 * @returns {StaticModelsManager} 선언된 StaticModelsManager가 없을 시 인스턴스 생성하여 등록 후 반환.
 */
HierarchyManager.prototype.getStaticModelsManager = function() 
{
	if (this.staticModelsManager === undefined)
	{ this.staticModelsManager = new StaticModelsManager(); }
	
	return this.staticModelsManager;
};

/**
 * nodesMap에 있는 Node의 data의 attribute에 해당하는 값을 가진 Node를 반환.
 * @param {String} projectId
 * @param {String} dataName attribute 이름, 보통 nodeId 사용.
 * @param {String} dataNameValue attribute 값
 * 
 * @returns {Node}
 */
HierarchyManager.prototype.getNodeByDataName = function(projectId, dataName, dataNameValue) 
{
	// note: here "dataName" refers "nodeId", or other datas that can be inside of"data".
	var nodesMap = this.getNodesMap(projectId);
	
	if (nodesMap === undefined)
	{ return undefined; }
	
	var resultNode;
	
	//for (var value of nodesMap.values()) 
	for (var key in nodesMap)
	{
		if (Object.prototype.hasOwnProperty.call(nodesMap, key))
		{
			var value = nodesMap[key];
			if (value.data !== undefined && value.data[dataName] === dataNameValue)
			{
				resultNode = value;
				break;
			}
		}
	}
	
	return resultNode;
};

/**
 * projectId와 dataKey를 이용하여 nodesMap에 있는 Node를 반환.
 * @param {String} projectId
 * @param {String} dataKey
 * 
 * @returns {Node|undefined} nodesMap이 선언되지 않았을 경우 undefined반환.
 */
HierarchyManager.prototype.getNodeByDataKey = function(projectId, dataKey) 
{
	var nodesMap = this.getNodesMap(projectId);
	
	if (nodesMap === undefined)
	{ return undefined; }
	
	var resultNode = nodesMap[dataKey];
	
	return resultNode;
};

/**
 * node의 parent 속성이 비어있는 root node들을 반환.
 * @param {Array.<Node>} resultRootNodesArray
 * @returns {Array.<Node>}
 */
HierarchyManager.prototype.getRootNodes = function(projectId, resultRootNodesArray) 
{
	if (resultRootNodesArray === undefined)
	{ resultRootNodesArray = []; }

	var nodesMap = this.projectsMap[projectId];	
	for (var nodesKey in nodesMap)
	{
		if (Object.prototype.hasOwnProperty.call(nodesMap, nodesKey))
		{
			var node = nodesMap[nodesKey];
			if (node instanceof Node)
			{						
				if (node.parent === undefined)
				{
					resultRootNodesArray.push(node);
				}
			}
		}
	}
	
	return resultRootNodesArray;
};

/**
 * 넘겨받은 projectId에 해당하는 project가 projectMap에 등록되있는지 유무 반환.
 * @param {String} projectId
 * @returns {Boolean}
 */
HierarchyManager.prototype.existProject = function(projectId) 
{
	return this.projectsMap.hasOwnProperty(projectId);
};

/**
 * 넘겨받은 projectId에 해당하는 nodesMap을 반환.
 * @param {String} projectId
 * @param {Object} attributes undefined가 아닐 경우 해당 nodesMap에 등록.
 * @returns {Object} projectId에 해당하는 nodesMap 없으면 생성 후 반환.
 */
HierarchyManager.prototype.getNodesMap = function(projectId, attributes) 
{
	// 1rst, check if exist.
	var nodesMap = this.projectsMap[projectId];
	if (nodesMap === undefined)
	{
		nodesMap = {};
		if (attributes !== undefined)
		{ nodesMap.attributes = attributes; }
		this.projectsMap[projectId] = nodesMap;
	}
	else 
	{
		if (attributes !== undefined && nodesMap.attributes === undefined)
		{ nodesMap.attributes = attributes; }
	}
	return nodesMap;
};


/**
 * 넘겨받은 projectId와 id, attribute로 Node를 생성 후 반환. Node 생성 후 nodesArray와 nodesMap에 등록
 * @param {String} id datakey
 * @param {String} projectId
 * @param {Object} attributes undefined가 아닐 경우 해당 nodesMap에 등록.
 * @returns {Node}
 */
HierarchyManager.prototype.newNode = function(id, projectId, attributes) 
{
	var nodesMap = this.getNodesMap(projectId, attributes);
	
	var node = nodesMap[id];
	if (node === undefined)
	{
		var node = new Node();
		node.data = {"nodeId": id};
		nodesMap[id] = node;
	}

	return node;
};
































