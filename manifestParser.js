var neo4j = require('neo4j');
var db = new neo4j.GraphDatabase('http://localhost:7474');

module.exports = (function()
{
	var r = 
	{
		appPName:0,
		filename:0,

		parseXML:function(appPName, callback){

			var libxmljs = require("libxmljs");
			var fs = require('fs');

			this.appPName = appPName;
			this.filename = appPName + "_AndroidManifest.xml"

			//console.log("fileName=" + this.filename);
			//fs.readFile("hi.html", 'utf8', function(err, data) {
			
			var data = fs.readFileSync(this.filename, 'utf8');
		    // console.log(data);
		    var xmlDoc = libxmljs.parseXmlString(data);
		    var permissions = this.findPermission(xmlDoc, 'uses-permission');
		    this.createPerms(permissions, appPName);
		    this.findComponent(xmlDoc, 'activity');
		    this.findComponent(xmlDoc, 'service');
		    this.findComponent(xmlDoc, 'receiver');
		},

		findPermission:function(xmlDoc, tag){
		  	var element = xmlDoc.find('//' + tag);
		  	var permissions = [];
		  	for (var i = 0; i < element.length; i++){
		  	  //console.log(element.constructor);
		  	  //console.log(element[i].attr("name").value());
		  	  //console.log(element[i].childNodes()[1].name());
		  	  console.log("----------");
		  	  permissions.push(element[i].attr("name").value());
		  	}
		  	return permissions;
		},
	
		findComponent:function(xmlDoc, tag){
		 	var components = xmlDoc.find('//' + tag);
		 	for (var i = 0; i < components.length; i++){
		 		var permissionAttr = '';
		 	  //console.log(components.constructor);
		 	  //console.log(components[i].attr("name").value());
		 	  //createComp(components[i].name(), components[i].attr("name").value());

		 	  if(components[i].attr("permission")){	//* if permission attribute exist
				permissionAttr = components[i].attr("permission").value();
				//console.log(components[i].attr("permission").value());
			}
		 	  //* component[i] is a component tag, e.g. <activity> or <receiver>
		 	  this.findIntentFilter(components[i], permissionAttr);

		 	  //console.log(component[i].childNodes()[1].name());
		 	  console.log("----------");
		 	}
		},
		
		findIntentFilter:function(component, permissionAttr){
		    //console.log('findIntentFilter');
		    if(component.childNodes().length > 0){ //if intent-fileter exists
		      for (var i = 0; i < component.childNodes().length; i++){ //for each intent-filter
		        if(component.childNodes()[i].name() != 'text'){
		        	//console.log(component.name());
		        	//console.log(component.constructor);
		        	var intentFilter = {};
		        	intentFilter.appPName = this.appPName;
		        	//console.log(this.appPName);
		        	intentFilter.permissionAttr = permissionAttr;
		        	intentFilter.componentType = component.name();
			    	intentFilter.action = [];
			    	intentFilter.category = [];
			    	intentFilter.data = [];
		          var intent_filter_tag = component.childNodes()[i];
		          //console.log("pri: " + intent_filter_tag.attr("priority"));
		          if(intent_filter_tag.attr("priority") != null)
		          	intentFilter.priority = intent_filter_tag.attr("priority").value();
  
		          for (var j = 0; j < intent_filter_tag.childNodes().length; j++){
		            //if(intent_filter_tag.childNodes()[j].name() != 'text'){
		            if(intent_filter_tag.childNodes()[j].name() == 'action'){
		            	intentFilter.action.push(intent_filter_tag.childNodes()[j].attr("name").value());
		              //console.log("action: " + intent_filter_tag.childNodes()[j].attr("name").value());
		            } else if(intent_filter_tag.childNodes()[j].name() == 'category'){
		            	intentFilter.category.push(intent_filter_tag.childNodes()[j].attr("name").value());
		              //console.log("category: " + intent_filter_tag.childNodes()[j].attr("name").value());
		            } else if(intent_filter_tag.childNodes()[j].name() == 'data'){
		            	intentFilter.data.push(intent_filter_tag.childNodes()[j].attr("name").value());
		              //console.log("data: " + intent_filter_tag.childNodes()[j].attr("name").value());
		            }
		            //console.log(component.childNodes()[j].name());
		          }
		        	this.createIntentFilter(intentFilter);
		        }     
		      }
		    }
		},

		//* create Perm Nodes
		createPerms:function(permissions, appPName){
			//var permissions = permissions.split('\n');
	  		//console.log(permissions);
	  		//var isAllPermNodesAdded = false;
	  		var countPermNodes=0;
	  		if(permissions[0] != ''){
	  			for(var i=0; i<permissions.length; i++){
					var createPermsCypher = [
					  //"CREATE (n:Permission {permission: {permission}})",
					  "MERGE (n:Permission {permission: {permission}})", ///* not create if perm node already exists
					  "RETURN n"
					].join('\n');
					//console.log(permissions[i]);
					var permParams = {
						permission: permissions[i]
					};
					//console.log(permParams.permission);
					
					db.query(createPermsCypher, permParams, function (err, results) {
					    if (err) throw err;

					    countPermNodes++;
					    if(countPermNodes == permissions.length){
					    	//isAllPermNodesAdded = true;
					    	createPermRels(permissions, appPName);
					    }
					    //console.log(countPermNodes);
					    //console.log(isAllPermNodesAdded);
					    //while(isAllPermNodesAdded){
			      		//	//console.log(isAllPermNodesAdded);
			      		//	createPermRels(permissions);
			      		//	break;
			      		//}  
					});
				}
	  		}

	  		//* create Perm Rels
			function createPermRels(permissions, appPName){
			    //console.log('create Rel');
				var createRelCypher = [
				  "MATCH (a:App),(b:Permission)",
				  "WHERE a.appPName = {appPName} AND b.permission = {permission}",
				  "CREATE (a)-[r:HasPermission]->(b)",
				  "RETURN r"
				].join('\n');
				//console.log(appPName);
				for(var i=0; i<permissions.length; i++){
					var relParams = {
						appPName: appPName,
						permission: permissions[i]
					};
					//console.log(appPName);
					//console.log(permissions[i]);
					db.query(createRelCypher, relParams, function (err, results) {
				    	if (err) throw err;
				    });
				}
			}   
		},		
		
		//* no use now
		createComp:function(compType, compPName){
			that = this;
			console.log(compType);
			console.log(compPName);
			var createCompCypher = [
			  "CREATE (n:Component {compType: {compType}, compPName: {compPName}})",
			  "RETURN n"
			].join('\n');

			var params = {
			  compType: compType,
			  compPName: compPName
			};

			db.query(createCompCypher, params, function (err, results) {
			  if (err) throw err;
			  that.createCompRel(compPName);
			  console.log('success');
			});

			//* no use now
			//* create Component Rel
			function createCompRel(compPName){
				//console.log('create Rel');
				var createCompRelCypher = [
				  "MATCH (a:App),(b:Component)",
				  "WHERE a.appPName = {appPName} AND b.compPName = {compPName}",
				  "CREATE (a)-[r:HasComponent]->(b)",
				  "RETURN r"
				].join('\n');
				
				var relParams = {
					appPName: appPName,
					compPName: compPName
				};
				//console.log(appPName);
				//console.log(permissions[i]);
				db.query(createCompRelCypher, relParams, function (err, results) {
			    	if (err) throw err;
			    });	
			}
		},

		//* create IntentFilters
		createIntentFilter:function(intentFilter){
			//console.log('createIntentFilter');
			var createIntentFilterCypher = [
			  "CREATE (n:IntentFilter)",
			  //"CREATE (n:App {appName: {appName}, appPName: {appPName}, appType: {appType}})",
			  "SET n = { props }",
			  "RETURN n"
			].join('\n');

			var params = {
				"props" : intentFilter,
			};

			db.query(createIntentFilterCypher, params, function (err, results) {
			  if (err) throw err;
			  createIntentFilterRel();
			});

			//* create IntentFilter Rel
			function createIntentFilterRel(){
				//console.log('create Rel');
				var createIntentFilterRelCypher = [
				  "MATCH (a:App),(b:IntentFilter)",
				  "WHERE a.appPName = b.appPName",
				  "CREATE (b)-[r:BelongTo]->(a)",
				  "RETURN r"
				].join('\n');
				
				
				var relParams = {
					//appPName: this.appPName,
				};
				//console.log(appPName);
				//console.log(permissions[i]);
				db.query(createIntentFilterRelCypher, relParams, function (err, results) {
			    	if (err) throw err;
			    });	
			}
		}

	}
	return r;

})();