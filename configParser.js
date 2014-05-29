var neo4j = require('neo4j');
var db = new neo4j.GraphDatabase('http://localhost:7474');
var async = require('async');

module.exports = (function()
{
	var r = 
	{
		//appsInfo:[],

		parseXML:function(filename, callback){
			//that = this;

			var libxmljs = require("libxmljs");
			var fs = require('fs');
			//var indexer = require('./indexer');
			
			fs.readFile(filename, 'utf8', function(err, data) {
				if (err) throw err;
				var xmlDoc = libxmljs.parseXmlString(data);
				var apps = xmlDoc.childNodes();
				var tasks = [];

				for(var i=0; i<apps.length; i++) {
			      	//var appAttr = app[i]; 
				      if(apps[i].name() != 'text'){ ///* apps[i] is xmlDoc.childNodes()[i]
				      	var a = function() {
				      		var generateGraphOfApp;
				      		var appInfo = [];
				      		var expIntentInfo = [];
				      		var impIntentInfo = [];
				      		var appPName = apps[i].name();
				      		appInfo.push(appPName);
						      //console.log(apps[i].name());
						      for(var j=0; j<apps[i].childNodes().length; j++) {
						      	if(apps[i].childNodes()[j].name() == 'explicitIntent') {
						      		var explicit_intent_tag = apps[i].childNodes()[j];
						      		var intent = getIntent(appPName, explicit_intent_tag, true);
						      		expIntentInfo.push(intent);

						      	} else if (apps[i].childNodes()[j].name() == 'implicitIntent') {
						      		var implicit_intent_tag = apps[i].childNodes()[j];
						      		var intent = getIntent(appPName, implicit_intent_tag, false);
						      		impIntentInfo.push(intent);

						      	} else if(apps[i].childNodes()[j].name() != 'text') {
							      	//console.log(apps[i].childNodes()[j].text());
							      	appInfo.push(apps[i].childNodes()[j].text());
							      }
						      }
						      //console.log(appInfo);
						      console.log('-----------------------------');
						      
						      //var b = that.createGraphOfApp(appInfo, expIntentInfo, task_callback);
						      generateGraphOfApp = function(task_callback) {
						      	var inner_tasks = [];
						      	var appPName = appInfo[0];
							      	appName = appInfo[1],
							      	appType = appInfo[2], 
							      	singature = 'testSig',
							      	version = appInfo[3];
							      var exp_Intent_tasks = [];
							      var imp_Intent_tasks = [];
						      	//var	expIntent = expIntentInfo,
						      	//var impIntent = impIntentInfo[0];
						      	//var createExpIntent = function(callback){callback()};
						      	var createImpIntent = function(callback){callback()};
						      	var manifestParser;
						      	var parseManifest;
						      	var createApp;

								//* create the App Node
								createApp = function(callback){
									var createApp = [
										"CREATE (n:App {appName: {appName}, appPName: {appPName}, appType: {appType}, singature: {singature}})",
										//"CREATE (n:App {appName: {appName}, appPName: {appPName}, appType: {appType}})",
										"RETURN n"
									].join('\n');

									var params = {
										appName: appName,
										appPName: appPName,
										appType: appType, 
										singature: singature
									};

									db.query(createApp, params, function (err, results) {
										if (err) throw err;
										callback && callback();
									});
								};

								manifestParser = require("./manifestParser.js");
								parseManifest = function(callback){
									manifestParser.parseXML(appPName, callback);
								};
								//console.log("expInfo: " + JSON.stringify(expIntentInfo));
								//console.log("expInfo.length: " + expIntentInfo.length);
								//console.log("expInfo[0].string: " + JSON.stringify(expIntentInfo[0]));
								//console.log("expInfo[0]: " + expIntentInfo[0]);
																
								var createExpIntent = function(expIntent, callback){
									if(expIntent.action.length > 0 || expIntent.target != null) {	//* Check it's not empty intent
										var	type = "Explicit";

										var createIntentCypher = [
											"CREATE (n:Intent:" + type + ")",
											//"CREATE (n:App {appName: {appName}, appPName: {appPName}, appType: {appType}})",
											"SET n = { props }",
											"RETURN n"
										].join('\n');

										var params = {
									 		"props" : expIntent,
										};

										db.query(createIntentCypher, params, function (err, results) {
										  	if (err) throw err;
										  	console.log("expIntent creation succeed");

										  	var createIntentRelCypher = [
										  		"MATCH (a:App),(b:Intent),(c:App)",
										  		"WHERE a.appPName = b.appPName AND b.target = c.appPName",
										  		"CREATE (a)-[r1:SendIntent]->(b)-[r2:ReceiveIntent]->(c)",
										  		"RETURN r1, r2"
										  	].join('\n');


										  	var relParams = {
												//appPName: appPName,
											};
											//console.log(appPName);
											//console.log(permissions[i]);
											db.query(createIntentRelCypher, relParams, function (err, results) {
												if (err) throw err;
												console.log("createIntentRel succeed");
												callback();
											});
										});
									} else {
										callback();
									}
								}

								var exp_Intent_tasks = function(final_callback){
							      	async.each(expIntentInfo, function(expIntent, task_callback) {
							      		//console.log("name = " + name);
								      	createExpIntent(expIntent, task_callback);
								      }, function(err){
								      	if( err ) {
											// One of the iterations produced an error.
											// All processing will now stop.
											console.log('A file failed to process');
										} else {
											console.log('Explicit Intent have been processed successfully');
											final_callback();
										}
								      });
							      }

								
								var	createImpIntent = function(impIntent, callback){
									if(impIntent.action.length > 0){
										var	type = "Implicit";

										var createIntentCypher = [
											"CREATE (n:Intent:" + type + ")",
											//"CREATE (n:App {appName: {appName}, appPName: {appPName}, appType: {appType}})",
											"SET n = { props }",
											"RETURN n"
										].join('\n');

										var params = {
										  	"props" : impIntent,
										};

										db.query(createIntentCypher, params, function (err, results) {
										  	if (err) throw err;
										  	console.log("impIntent creation succeed");
										  	callback();
										});
									} else {
										callback();
									}
								};
								
								var imp_Intent_tasks = function(final_callback){
							      	async.each(impIntentInfo, function(impIntent, task_callback) {
							      		//console.log("name = " + name);
								      	createImpIntent(impIntent, task_callback);
								      }, function(err){
								      	if( err ) {
											// One of the iterations produced an error.
											// All processing will now stop.
											console.log('A file failed to process');
										} else {
											console.log('Explicit Intent have been processed successfully');
											final_callback();
										}
								      });
							      }

								//inner_tasks.push(createApp);
								inner_tasks.push(parseManifest);
								inner_tasks.push(exp_Intent_tasks);
								inner_tasks.push(imp_Intent_tasks);
		
								//async.parallel(inner_tasks, task_callback);
								
								async.series([
									createApp,
									function(callback){
										async.parallel(inner_tasks, callback);
									}
								], function(err){
									if (err) return next(err);
									task_callback();
								});
								
							}

							return generateGraphOfApp;
					      	//that.appsInfo.push(appInfo);
					      }(); //* end a

					      tasks.push(a);
					}
				//console.log(that.appsInfo);
				}

				async.parallel(tasks, callback);

				//* match implicit intent here
				//that.createImplicitIntentRel();


				//return that.appsInfo;
				//indexer.createApp('test', 'test', '[System app]', 'no');

			}); ///* end fs.readFile

			function getIntent(appPName, intent_tag, isExplicit){
				var intent = {};
				intent.appPName = appPName;
				intent.action = [];
				intent.category = [];
				intent.data = [];
				if(isExplicit)
					intent.type = 'explicit';
				else
					intent.type = 'implicit';

				for (var j = 0; j < intent_tag.childNodes().length; j++){
					if(intent_tag.childNodes()[j].name() == 'action'){
						intent.action.push(intent_tag.childNodes()[j].text());
						  //console.log("action: " + intent_tag.childNodes()[j].text());
					} else if(intent_tag.childNodes()[j].name() == 'category'){
						intent.category.push(intent_tag.childNodes()[j].text());
					  //console.log("category: " + intent_tag.childNodes()[j].text());
					} else if(intent_tag.childNodes()[j].name() == 'data'){
						intent.data.push(intent_tag.childNodes()[j].text());
					  //console.log("data: " + intent_tag.childNodes()[j].text());
					} else if(isExplicit && intent_tag.childNodes()[j].name() == 'target'){
						intent.target = intent_tag.childNodes()[j].text();
					//console.log(component.childNodes()[j].name());
					} else if(intent_tag.childNodes()[j].name() == 'targetType'){
						intent.targetType = intent_tag.childNodes()[j].text();
					}
				}
				return intent;
			}
		},		

		createImplicitIntentRel:function(callback){
			//that.permissionsOfApp = [];
			var query = [
				//"MATCH (a:App),(b:Implicit),(c:IntentFilter)",
				//"WHERE a.appPName = b.appPName AND b.action IN c.action",
				//"CREATE (a)-[r1:SendIntent]->(b)-[r2:MatchFilter]->(c)",
				"MATCH (a:App),(b:Implicit),(c:IntentFilter)",
				"WHERE a.appPName = b.appPName AND all ( m in b.action where m IN c.action )",
				"CREATE (a)-[r1:SendIntent]->(b)-[r2:MatchFilter]->(c)",
				"RETURN r1, r2"
			].join('\n');

			var relParams = {
				//appPName: appPName,
			};
			//console.log(appPName);
			//console.log(permissions[i]);
			db.query(query, relParams, function (err, results) {
				if (err) throw err;
				console.log("createImplicitIntentRel succeed");
				callback && callback();
			});
		}

	} ///* end r
	return r;

})();