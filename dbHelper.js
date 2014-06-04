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
				c.targetType = 'service'",
				"return a.appPName, b.appPName"
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
			  	results.map(function (result) {
					//console.log("result['a.appPName']: " + result['a.appPName']);
					//var intent_filter = result['intent_filter']['_data']['data'];
					//console.log(intent.intent);
					//console.log('===');
					//console.log('result='+JSON.stringify(result));
					//console.log('result[a]='+result['a.appPName']);
					//console.log('result[b]='+result['b.appPName']);
					//callback && callback(result);

					//results_arr.push("from: " + result['a.appPName'] + " to: " + result['b.appPName']);
					results_arr.push(result);
				});	
			  	callback && callback(results_arr);
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
					results_arr.push(result);
				});	
			  	callback && callback(results_arr);
			  } else {
			  	callback && callback("None");
			  }
			  			  
			});
		}


		
	}
	return r;

})();

//match n return n