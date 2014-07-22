var neo4j = require('neo4j');
var db = new neo4j.GraphDatabase('http://localhost:7474');

module.exports = (function()
{
	var r = 
	{	
		nodes:[],
		apps:[],
		permissions:[],
		permissionsOfApp:[],
		intentFiltersOfApp:[],

		//* no use now
		init:function(){
		},

		//* no use now
		send:function(){
			http = require('http');
			var contents = {
			  "query" : "START n = node(1) RETURN n",
			  "params" : {
			  }
			};
			var contentsString = JSON.stringify(contents);
			//console.log(contentsString);

			var options = {
				// host: '107.20.224.52',
				// port:80,
				// url: '/ubike/rest/api.php?action=sites_list',
				// method: 'GET',
				host: '127.0.0.1',
				port: 7474,
				url: '/db/data/node/1',
				method: 'POST',
				headers: {
				//	'Content-Type': 'application/json'
				}
			};

			var req = http.request(options, function(res){
			//	var body = '';
				res.setEncoding('utf8');
			//	res.on('data', function(chunk){
			//		body += chunk;
			//	});

				res.on('data', function(data){
					console.log('\n 	\033[90m request complete! \033[39m\n');
					console.log(data);
				});
			});

			//console.log(req.getHeader('Content-Type'));
			//req.write(contentsString);
			req.end(); 
		},

		//* Get all Nodes from db
		getNodes:function(callback){
			var self = this;
			self.nodes.length = 0;

			var queryNodes = [
			  'START node=node(*)',
			  'RETURN node'
			].join('\n');

			var params = {
			  //userId: currentUser.id
			};

			db.query(queryNodes, params, function (err, results) {
			  if (err) throw err;
			  //console.log(results);
			  results.map(function (result) {
			  	//console.log(result);
			  	var data = result['node']['_data']['data'];
			  	console.log(data);
			  	console.log('---');
			  	
		  		self.nodes.push(data);
		  		//console.log(typeof(self.nodes));
		  		//console.log(nodes.pop());
			  });
			  //console.log(self.nodes);
			  //return nodes;
			  callback && callback();
			  //return self.nodes;
			});
		},

		//* Get all Apps(with label "App") from db
		getApps:function(callback){
			var self = this;
			self.apps.length = 0;

			var query = [
			  //'START app=node({nodeId})',
			  //'MATCH (app) -[:HasPermission]-> (permission)',
			  'MATCH (app:App)',
			  'RETURN app'
			  //'START n=node(1)',
			  //'RETURN n'
			].join('\n');

			var params = {
			};

			db.query(query, params, function (err, results) {
			  if (err) throw err;
			  //console.log(results);
			  results.map(function (result) {
			  	//console.log(result);
			  	var app = result['app']['_data']['data'];
			  	//console.log(app);
			  	self.apps.push(app);
			  	//console.log(permission);
			  });
			  
			  callback && callback();
			  //return self.permissions;
			});
		},

		//* Get all Perms(with label "Permission") from db
		getAllPermissions:function(callback){
			var self = this;
			self.permissions.length = 0;

			var query = [
			  //'START app=node({nodeId})',
			  //'MATCH (app) -[:HasPermission]-> (permission)',
			  'MATCH (permission:Permission)',
			  'RETURN permission'
			  //'START n=node(1)',
			  //'RETURN n'
			].join('\n');

			var params = {
			};

			db.query(query, params, function (err, results) {
			  if (err) throw err;
			  results.map(function (result) {
			  	//console.log(result);
			  	var permission = result['permission']['_data']['data'];
			  	self.permissions.push(permission);
			  	//console.log(permission);
			  });

			  callback && callback();
			  //return self.permissions;
			});
		},

		//* Get Perms of an App
		getPermissionsOfApp:function(appPName, callback){
			var self = this;
			//self.permissionsOfApp = [];
			var query = [
			  //'START app=node({nodeId})',
			  //'MATCH (app) -[:HasPermission]-> (permission)',
			  //'RETURN permission'
			  'MATCH (app) -[:HasPermission]-> (permission)',
			  'WHERE app.appPName = {appPName}',
			  'RETURN permission'
			].join('\n');

			var params = {
			  appPName: appPName
			};

			db.query(query, params, function (err, results) {
			  if (err) throw err;
			  self.permissionsOfApp.length = 0;
			 
			  results.map(function (result) {
			  	//console.log(result);
			  	var permission = result['permission']['_data']['data'];
			  	//console.log(permission.permission);
			  	//console.log('===');
			  	self.permissionsOfApp.push(permission.permission);
			  });
			  //console.log(self.permissionsOfApp);

			  callback && callback();
			  
			});
		},

		getIntentFiltersOfApp:function(appPName, callback){
			var self = this
			var query = [
			  //'START app=node({nodeId})',
			  //'MATCH (app) -[:HasPermission]-> (permission)',
			  //'RETURN permission'
			  'MATCH (intent_filter:IntentFilter)',
			  'WHERE intent_filter.appPName = {appPName}',
			  'RETURN intent_filter'
			].join('\n');

			var params = {
			  appPName: appPName
			};

			db.query(query, params, function (err, results) {
			  if (err) throw err;
			  self.intentFiltersOfApp.length = 0;
			 
			  results.map(function (result) {
			  	//console.log(result);
			  	var intent_filter = result['intent_filter']['_data']['data'];
			  	//console.log(intent.intent);
			  	//console.log('===');
			  	self.intentFiltersOfApp.push(intent_filter);
			  });
			  //console.log(self.intentFiltersOfApp);

			  callback && callback();
			  
			});
		},

		cleanDb:function(callback){
			console.log("clean");
			var clean = [
				"START n = node(*)",
				//"MATCH n-[r?]-()",  //* this is for neo4j-2.0.0
				"OPTIONAL MATCH n-[r]-()", //* this is for neo4j-2.0.1
				"DELETE n, r"
			].join('\n');

			var params = {
			};

			db.query(clean, params, function (err, results) {
			  if (err) throw err;
			  callback && callback();
			});
		},

		getSmsInterceptApp:function(callback){
			var query = [
				"match (a:App), (b:Permission), (c:IntentFilter)",
				"where \
					(a) -[:HasPermission]-> (b) and \
					b.permission = 'android.permission.RECEIVE_SMS' and \
					(c) -[:BelongTo] -> (a) and \
					all ( m in c.action where m = 'android.provider.Telephony.SMS_RECEIVED') and \
					c.priority > 0",
				"return a.appPName"
			].join('\n');

			var params = {
				//appPName: appPName,
				//permission: permissions[i]
			};

			db.query(query, params, function (err, results) {
			  if (err) throw err;

			  //console.log("results.length => " + results.length);
			  var results_arr = [];
			  if(results.length !== 0){
			  	//console.log("results.length == 0");
			  	//console.log("results: " + results);
			  	results.map(function (result) {
					//console.log("result['a.appPName']: " + result['a.appPName']);
					//var intent_filter = result['intent_filter']['_data']['data'];
					//console.log(intent.intent);
					//console.log('===');
					results_arr.push(result);
				});	
			  	callback && callback(results_arr);
			  } else {
			  	callback && callback("None");
			  }
			  
			  
			});
		},

		getExternalService:function(callback){
			var query = [
				"match (a:App), (b:App), (c:Explicit)",
				"where (a) -[:SendIntent]-> (c) -[:ReceiveIntent]-> (b) and \
				c.targetType = 'startService'",
				"return a.appPName, b.appPName"
			].join('\n');

			var params = {
				//appPName: appPName,
				//permission: permissions[i]
			};

			db.query(query, params, function (err, results) {
			  if (err) throw err;

			  //console.log("results.length => " + results.length);
			  //var results_arr = [];
			  var callbackCounter = 0; ///* count to check if meets key numbers of results.hash
			  results_hash = {};
			  if(results.length !== 0){
			  	//console.log("results: " + JSON.stringify(results));
			  	results.map(function (result) {
					//console.log('result='+JSON.stringify(result));
					//console.log('result[a]='+result['a.appPName']);
					//console.log('result[b]='+result['b.appPName']);

					//results_arr.push("from: " + result['a.appPName'] + " to: " + result['b.appPName']);
					//results_arr.push(result);
					var from_pName = result['a.appPName'];
					var to_pName = result['b.appPName'];
					
					if(results_hash[from_pName] == null){
						results_hash[from_pName] = [];
					}
					results_hash[from_pName].push(to_pName);
				});	

			  	///*----Do second query to get permissions column----
			  	var permissionsMap = {};
			  	for(var from in results_hash){
			  		//console.log("results_hash[from]: " + results_hash[from]);
			  		//console.log("from: " + from);
			  				
			  		var a = function(){
			  			var from_backup = from;
				  		var qry_from = [
				  			"MATCH (a:App)-[:HasPermission]->(permission)",
							"WHERE a.appPName=" + '\'' + from_backup + '\'',
							"RETURN permission"
						].join('\n');

						///* Query to get permissions of from app
						db.query(qry_from, {}, function (err, results) {
							if (err) throw err;
							var permissionsOfFromApp = []; ///* This app is "from" app
							//console.log("from: " + from);
							//console.log('results: ' + JSON.stringify(results));
							results.map(function (result) {
								//console.log('result: ' + JSON.stringify(result));
								var permission = result['permission']['_data']['data'];
								//console.log(permission.permission);
								permissionsOfFromApp.push(permission.permission);
							});

							var qry_to = [
								"MATCH (a:App)-[:HasPermission]->(permission), (other:App {appPName: {appPName}})",
								"WHERE a.appPName in {to_array} AND NOT (permission)<-[:HasPermission]-(other)",
								"RETURN a.appPName, permission.permission"
							].join('\n')

							/*
							var qry_to = [
								"MATCH (a:App)-[:HasPermission]->(permission)",
								"WHERE a.appPName=" + '\'' + results_hash[from][0] + '\'',
								"RETURN permission"
							].join('\n');;

							for(var i=1; i<results_hash[from].length; i++){
								qry_temp = [
									" UNION",
									"MATCH (a:App)-[:HasPermission]->(permission)",
									"WHERE a.appPName=" + '\'' + results_hash[from][i] + '\'',
									"RETURN permission"
								].join('\n');
								//qry_from = qry_from + qry_to;
								qry_to = qry_to + qry_temp;
							}
							*/

							db.query(qry_to, {appPName: from_backup, to_array: results_hash[from_backup]}, function (err, results) {
								if (err) throw err;
								//var permissionsOfFromApp = [];
								//console.log("from: " + from);
								//console.log('results: ' + JSON.stringify(results));
								results.map(function (result) {
									//console.log('result: ' + JSON.stringify(result));
									var permission = result['permission.permission'];
									var to = result['a.appPName'];
									//var permission = result['permission']['_data']['data'];
									//console.log(permission.permission);
									//console.log("to: " + to);
									//console.log("perm: " + permission);
									permissionsOfFromApp.push("extra: " + permission + " (" + to + ")");
								});
								permissionsMap[from_backup] = permissionsOfFromApp;
								//console.log("poa: " + permissionsOfFromApp);
								//console.log("pm: " + permissionsMap);
								//console.log("from_backup: " + from_backup);
								//console.log("poa: " + permissionsMap[from_backup]);

								///* check if "from" send to itself(the num of "to_pName" is 1(means only itself) and this one is itself)
								if(results_hash[from_backup].length == 1 && from_backup == results_hash[from_backup][0]){
						  			delete results_hash[from_backup]; ///* 自己送給自己不會造成額外permission，故刪除
						  		} else {
						  			callbackCounter++;
						  		}
								//callbackCounter++;
								if(callbackCounter == Object.keys(results_hash).length){
									//console.log('permissionsMap='+JSON.stringify(permissionsMap));
									callback && callback(results_hash, permissionsMap);
								}
							});
						});

						
					}();
			  	}

			  	//callback && callback(results_hash);
			  } else {
			  	callback && callback("None");
			  }
			  			  
			});
		},

		getSameSharedUserId:function(callback){
			//match (n:App) where has(n.sharedUserId) with n.sharedUserId as sharedUserId, collect(n.) as nodelist return sharedUserId, nodelist
			var query = [
				"match (n:App)",
				"where has(n.sharedUserId)",
				"with n.sharedUserId as sharedUserId, collect(n.appPName) as nodelist",
				"return sharedUserId, nodelist"
			].join('\n');

			var params = {
				//appPName: appPName,
				//permission: permissions[i]
			};

			db.query(query, params, function (err, results) {
			  if (err) throw err;

			  //console.log("results.length => " + results.length);
			  var results_arr = [];
			  var callbackCounter = 0;
			  if(results.length !== 0){
			  	//console.log("results.length == 0");
			  	results.map(function (result) {
					//console.log("result['a.appPName']: " + result['a.appPName']);
					//var intent_filter = result['intent_filter']['_data']['data'];
					//console.log(intent.intent);
					//console.log('===');
					//console.log('result='+JSON.stringify(result));
					//console.log('result[a]='+result['a.appPName']);
					//console.log('result[b]='+result['b.appPName']);
					//callback && callback(result);
					
					//results_arr.push("sharedUserId: " + result['sharedUserId'] + " Apps: " + result['nodelist']);
					//console.log('result: ' + result);
					
					var qry = [
						"MATCH (a:App)-[:HasPermission]->(permission)",
						"WHERE a.appPName=" + '\'' + result['nodelist'][0] + '\'',
						"RETURN permission, a.appPName"
					].join('\n');

					for(var i=1; i<result['nodelist'].length; i++){
						qry_temp = [
							" UNION",
							"MATCH (a:App)-[:HasPermission]->(permission)",
							"WHERE a.appPName=" + '\'' + result['nodelist'][i] + '\'',
							"RETURN permission, a.appPName"
						].join('\n');
						//qry_from = qry_from + qry_to;
						qry = qry + qry_temp;
					}

					db.query(qry, {}, function (err, inner_results) {
						if (err) throw err;
						//var permissionsOfApp = [];
						result['permissions'] = [];
						//console.log("from: " + from);
						//console.log('inner_results: ' + JSON.stringify(inner_results));
						inner_results.map(function (inner_result) {
							//console.log('result: ' + JSON.stringify(result));
							var permission = inner_result['permission']['_data']['data'];
							var appPName = inner_result['a.appPName'];
							//console.log(permission.permission);
							//permissionsOfApp.push(permission.permission);
							result['permissions'].push(permission.permission + " (" + appPName + ")");
						});
						results_arr.push(result);

						//console.log('result='+JSON.stringify(result));
						callbackCounter++;
						if(callbackCounter == results.length){
							callback && callback(results_arr);
						}
					});
					
				});	
			  	//console.log('results_arr: ' + JSON.stringify(results_arr[0]['nodelist'].length));
			  	//callback && callback(results_arr);
			  } else {
			  	callback && callback("None");
			  }
			  			  
			});
		},

		getSystemInfo:function(callback){
			var query = [
				"match (n:System)",
				//"where \
				//	(a) -[:HasPermission]-> (b) and \
				//	b.permission = 'android.permission.RECEIVE_SMS' and \
				//	(c) -[:BelongTo] -> (a) and \
				//	all ( m in c.action where m = 'android.provider.Telephony.SMS_RECEIVED') and \
				//	c.priority > 0",
				"return n"
			].join('\n');

			var params = {
				//appPName: appPName,
				//permission: permissions[i]
			};

			db.query(query, params, function (err, results) {
			  if (err) throw err;

			  //console.log("results.length => " + results.length);
			  //console.log("results: " + JSON.stringify(results));
			  var infos = {};
			  var system_info = {};
			  var wifi_info = {};

			  if(results.length !== 0){
			  	//console.log("results.length == 0");
			  	//console.log("results: " + results);
			  	results.map(function (result) {
					//console.log("result: " + JSON.stringify(result['n']['_data']['data']));
					var props = result['n']['_data']['data'];
					//console.log(JSON.stringify(props));
					if(props.id == 'system_info'){
						system_info = props;
						delete system_info.id;
						infos['System Info'] = system_info;
					} else if(props.id == 'wifi_info'){
						wifi_info = props;
						delete wifi_info.id;
						infos['Wifi Info']= wifi_info;
					}
				});

			  	//console.log(JSON.stringify(infos));
			  	callback && callback(infos);
			  } else {
			  	callback && callback("None");
			  }
			  
			  
			});
		}

		
	}
	return r;

})();

//match n return n