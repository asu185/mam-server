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
				      		var intentInfo = [];
				      		var appPName = apps[i].name();
				      		appInfo.push(appPName);
						      //console.log(apps[i].name());
						      for(var j=0; j<apps[i].childNodes().length; j++) {
						      	if(apps[i].childNodes()[j].name() == 'explicitIntent') {
						      		var explicit_intent_tag = apps[i].childNodes()[j];
						      		var intent = getIntent(appPName, explicit_intent_tag, true);
						      		intentInfo.push(intent);

						      	} else if (apps[i].childNodes()[j].name() == 'implicitIntent') {
						      		var implicit_intent_tag = apps[i].childNodes()[j];
						      		var intent = getIntent(appPName, implicit_intent_tag, false);
						      		intentInfo.push(intent);

						      	} else if(apps[i].childNodes()[j].name() != 'text') {
							      	//console.log(apps[i].childNodes()[j].text());
							      	appInfo.push(apps[i].childNodes()[j].text());
							      }
						      }
						      //console.log(appInfo);
						      console.log('-----------------------------');
						      
						      //var b = that.createGraphOfApp(appInfo, intentInfo, task_callback);
						      generateGraphOfApp = function(task_callback) {
						      	var inner_tasks = [];
						      	var appPName = appInfo[0];
							      	appName = appInfo[1],
							      	appType = appInfo[2], 
							      	singature = 'testSig',
							      	version = appInfo[3];
						      	var	expIntent = intentInfo[0],
						      		impIntent = intentInfo[1];
						      	var createExpIntent = function(callback){callback()};
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

								if(expIntent.action.length > 0) {	//* Check it's not empty intent
									createExpIntent = function(callback){
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
									}
								}

								if(impIntent.action.length > 0){
									createImpIntent = function(callback){
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
									};
								}

								inner_tasks.push(createApp);
								inner_tasks.push(parseManifest);
								inner_tasks.push(createExpIntent);
								inner_tasks.push(createImpIntent);	
		
								async.parallel(inner_tasks, task_callback);
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