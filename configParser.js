var neo4j = require('neo4j');
var db = new neo4j.GraphDatabase('http://localhost:7474');

module.exports = (function()
{
	var r = 
	{
		//appsInfo:[],

		parseXML:function(filename, callback){
			that = this;

			var libxmljs = require("libxmljs");
			var fs = require('fs');
			//var indexer = require('./indexer');
			
			fs.readFile(filename, 'utf8', function(err, data) {
			  if (err) throw err;
			  var xmlDoc = libxmljs.parseXmlString(data);
			  var apps = xmlDoc.childNodes();

			  for(var i=0; i<apps.length; i++){
			    //var appAttr = app[i]; 
			    if(apps[i].name() != 'text'){ ///* apps[i] is xmlDoc.childNodes()[i]
			      var appInfo = [];
			      var intentInfo = [];
			      var appPName = apps[i].name();
			      appInfo.push(appPName);
			      //console.log(apps[i].name());
			      for(var j=0; j<apps[i].childNodes().length; j++){
			        if(apps[i].childNodes()[j].name() == 'explicitIntent'){
			          var explicit_intent_tag = apps[i].childNodes()[j];
			          var intent = getIntent(appPName, explicit_intent_tag, true);
			          intentInfo.push(intent);

			        } else if (apps[i].childNodes()[j].name() == 'implicitIntent'){
			          var implicit_intent_tag = apps[i].childNodes()[j];
			          var intent = getIntent(appPName, implicit_intent_tag, false);
			          intentInfo.push(intent);

			        } else if(apps[i].childNodes()[j].name() != 'text'){
			          //console.log(apps[i].childNodes()[j].text());
			          appInfo.push(apps[i].childNodes()[j].text());
			        }
			      }
			      //console.log(appInfo);
			      console.log('-----------------------------');
			      that.createGraphOfApp(appInfo, intentInfo);
			      //that.appsInfo.push(appInfo);
			    }
			    //console.log(that.appsInfo);
			  }

			  //* match implicit intent here
			  //that.matchImplicitIntent();


			  //return that.appsInfo;
			  //indexer.createApp('test', 'test', '[System app]', 'no');
			});
	
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

		createGraphOfApp:function(appInfo, intentInfo){
			var that = this;
			var appPName = appInfo[0];
			//	appName = appInfo[1],
			//	appType = appInfo[2], 
			//	singature = 'testSig',
			//	version = appInfo[3],
			var	expIntent = intentInfo[0],
				impIntent = intentInfo[1];
				//console.log(expIntent);
				//console.log(impIntent);
				//manifest = appInfo[4];
				//permissions = appInfo[4],
				//activities = appInfo[5],
				//services = appInfo[6],
				//providers = appInfo[7],
				//receivers = appInfo[8];

			this.createApp(appInfo);

			//console.log("appPName=" + appPName);

			manifestParser = require("./manifestParser.js");
			manifestParser.parseXML(appPName);

			if(expIntent.action.length > 0)	//* Check it's not empty intent
				this.createIntent(expIntent, true);
			if(impIntent.action.length > 0)
				this.createIntent(impIntent, false);	
		},

		//* create the App Node
		createApp:function(appInfo){
			var appPName = appInfo[0],
				appName = appInfo[1],
				appType = appInfo[2], 
				singature = 'testSig',
				version = appInfo[3];

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
			});
		},

		//* create Intent
		createIntent:function(intent, isExplicit){
			console.log(intent);
			that = this;
			var createIntentCypher = [
			  "CREATE (n:Intent)",
			  //"CREATE (n:App {appName: {appName}, appPName: {appPName}, appType: {appType}})",
			  "SET n = { props }",
			  "RETURN n"
			].join('\n');

			var params = {
				"props" : intent,
			};

			db.query(createIntentCypher, params, function (err, results) {
			  if (err) throw err;
			  console.log("success");

			  if(isExplicit)
			  	that.createIntentRel();
			});
		},

		//* create Intent Rel
		createIntentRel:function(){
			//console.log('create Rel');
			var createIntentRelCypher = [
			  "MATCH (a:App),(b:Intent),(c:App)",
			  "WHERE a.appPName = b.appPName AND b.target = c.appPName",
			  "CREATE (a)-[r:SendIntent]->(b)-[r:ReceiveIntent]->(c)",
			  "RETURN r"
			].join('\n');
			
			
			var relParams = {
				//appPName: appPName,
			};
			//console.log(appPName);
			//console.log(permissions[i]);
			db.query(createIntentRelCypher, relParams, function (err, results) {
		    	if (err) throw err;
		    	console.log("success2");
		    });	
		},

		matchImplicitIntent:function(){
			//that.permissionsOfApp = [];
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
			  that.permissionsOfApp.length = 0;
			 
			  results.map(function (result) {
			  	//console.log(result);
			  	var permission = result['permission']['_data']['data'];
			  	//console.log(permission.permission);
			  	//console.log('===');
			  	that.permissionsOfApp.push(permission.permission);
			  });
			  //console.log(that.permissionsOfApp);

			  callback && callback();
			  
			});
		}

	}
	return r;

})();