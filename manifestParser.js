var neo4j = require('neo4j');
var db = new neo4j.GraphDatabase('http://localhost:7474');
var async = require('async');

module.exports = (function()
{
	var r = 
	{
		appPName:0,
		filename:0,
		count:0,

		parseXML:function(appPName, callback) {
			that = this;
			var libxmljs = require("libxmljs");
			var fs = require('fs');
			var asyncTasks = [];
			var compNames = [];

			this.appPName = appPName;
			this.filename = appPName + "_AndroidManifest.xml"

			//console.log("fileName=" + this.filename);
			//fs.readFile("hi.html", 'utf8', function(err, data) {

			var data = fs.readFileSync(this.filename, 'utf8');
		      // console.log(data);
		      var xmlDoc = libxmljs.parseXmlString(data);
		      //var permissions = this.findPermission(xmlDoc, 'uses-permission');
		      var permissions = this.find_attribute_in_tag(xmlDoc, 'name', 'uses-permission');
		      //var sharedUserId = this.find_attribute_in_tag(xmlDoc, 'sharedUserId', 'manifest');
		      if (xmlDoc.root().attr("sharedUserId") != null){
		      	var sharedUserId = xmlDoc.root().attr("sharedUserId").value();
		      	//console.log("id: " + sharedUserId);
		      	this.set_sharedUserId_property(sharedUserId);
		      }

		      var t1 = function(final_callback){
		      	that.createPerms(permissions, appPName, final_callback);
		      }

		      
		      compNames.push('activity');
		      compNames.push('service');
		      compNames.push('receiver');

		      var t2 = function(final_callback){
		      	async.each(compNames, function(name, task_callback) {
		      		//console.log("name = " + name);
			      	that.findComponent(xmlDoc, name, task_callback);
			      }, function(err){
			      	if( err ) {
						// One of the iterations produced an error.
						// All processing will now stop.
						console.log('A file failed to process');
					} else {
						console.log('All files have been processed successfully');
						final_callback();
					}
			      });
		      }
			

		      //that.findComponent(xmlDoc, 'activity');
		      //that.findComponent(xmlDoc, 'service');
		      //that.findComponent(xmlDoc, 'receiver');

		      asyncTasks.push(t1);
		      asyncTasks.push(t2);
		      async.parallel(asyncTasks, callback);
		      
		      //callback && callback();
		},

		/* //no use now
		findPermission:function(xmlDoc, tag) {
		    	var element = xmlDoc.find('//' + tag);
		    	var permissions = [];
		    	for (var i = 0; i < element.length; i++) {
		  		//console.log(element.constructor);
		  		//console.log("ele.attr: " + element[i].attr("name").value());
		  		//console.log(element[i].childNodes()[1].name());
		  		//console.log("----------");
		  		permissions.push(element[i].attr("name").value());
		  	}
		  	return permissions;
		},
		*/

		find_attribute_in_tag:function(xmlDoc, attribute, tag) {
		    	var element = xmlDoc.find('//' + tag);
		    	var results = [];
		    	//console.log("ele[0]: " + element[0]);
		    	//console.log("ele.length: " + element.length);
		    	for (var i = 0; i < element.length; i++) {
		  		//console.log(element.constructor);
		  		//console.log(element[i].attr("name").value());
		  		//console.log(element[i].childNodes()[1].name());
		  		//console.log("----------");
		  		results.push(element[i].attr(attribute).value());
		  	}
		  	return results;
		},

		findComponent:function(xmlDoc, tag, task_callback) {
			that = this;
		  	var components = xmlDoc.find('//' + tag);
		  	//console.log("components.length = " + components.length);
		  	var tasks = [];
		  	for (var i = 0; i < components.length; i++) {
		  		//console.log("i = " + i);
		  		
		  		var a = function(){
		 			var value = i;
			  		var permissionAttr = "";

			 		//console.log(components.constructor);
			 		//console.log(components[i].attr("name").value());
			 		//createComp(components[i].name(), components[i].attr("name").value());

			 		if (components[value].attr("permission")) {	//* if permission attribute exist
			 			permissionAttr = components[value].attr("permission").value();
						//console.log(components[value].attr("permission").value());
					}
			 		//* component[value] is a component tag, e.g. <activity> or <receiver>
		 			//console.log("value = " + value);
		 			var findIntentFilter = function(callback){
		 				//console.log("value2 = " + value);
		 				var filter_count = 0;
		 				var count = 0;
		 				//console.log("components[value].childNodes() = " + components[value].childNodes());
			  			//console.log("components[value].childNodes().length = " + components[value].childNodes().length);
		 				if(components[value].childNodes().length > 1){ //if intent-fileter exists
		 					//console.log('t1');

						      for (var i = 0; i < components[value].childNodes().length; i++) { //for each intent-filter
						      	//console.log('t2');
						      	if(components[value].childNodes()[i].name() != 'text'){
						      		filter_count++;
						      		//console.log('t3');
							        	//console.log(components[value].name());
							        	//console.log(components[value].constructor);
							        	var intentFilter = {};
							        	intentFilter.appPName = that.appPName;
							        	//console.log(that.appPName);
							        	intentFilter.permissionAttr = permissionAttr;
							        	intentFilter.componentType = components[value].name();
							        	intentFilter.action = [];
							        	intentFilter.category = [];
							        	intentFilter.data = [];
							        	var intent_filter_tag = components[value].childNodes()[i];
							          	//console.log("pri: " + intent_filter_tag.attr("priority"));
							          	if(intent_filter_tag.attr("priority") != null){
							          		intentFilter.priority = parseInt(intent_filter_tag.attr("priority").value(), 10);
							          	}

							          	for (var j = 0; j < intent_filter_tag.childNodes().length; j++){
							          		//console.log('t4');
								            //if(intent_filter_tag.childNodes()[j].name() != 'text'){
								            if(intent_filter_tag.childNodes()[j].name() == 'action') {
								            	intentFilter.action.push(intent_filter_tag.childNodes()[j].attr("name").value());
								              	//console.log("action: " + intent_filter_tag.childNodes()[j].attr("name").value());
								            } else if(intent_filter_tag.childNodes()[j].name() == 'category'){
								            	intentFilter.category.push(intent_filter_tag.childNodes()[j].attr("name").value());
								              	//console.log("category: " + intent_filter_tag.childNodes()[j].attr("name").value());
								            } else if(intent_filter_tag.childNodes()[j].name() == 'data'){
								            	intentFilter.data.push(intent_filter_tag.childNodes()[j].attr("name").value());
								             	//console.log("data: " + intent_filter_tag.childNodes()[j].attr("name").value());
								            }
								            //console.log(components[value].childNodes()[j].name());
							          	}
							          	//console.log('t5');
							          	var createIntentFilter = function(intentFilter, task_callback){
								          	//console.log('createIntentFilter: ' + JSON.stringify(intentFilter));
								          	
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
											//createIntentFilterRel();
											//console.log("count = " + count);
											//console.log("filter_count = " + filter_count);
											count++;
											if(count == filter_count){
												//console.log("count = filter_count = " + count);
												createIntentFilterRel(task_callback);
												//task_callback();
											}
										});

										//* create IntentFilter Rel
										function createIntentFilterRel(task_callback){
											//console.log('createIntentFilterRel');
											var createIntentFilterRelCypher = [
												"MATCH (a:App),(b:IntentFilter)",
												"WHERE a.appPName = b.appPName",
												"CREATE UNIQUE (b)-[r:BelongTo]->(a)",
												"RETURN r"
											].join('\n');
											
											
											var relParams = {
												//appPName: that.appPName,
											};
											//console.log(appPName);
											//console.log(permissions[i]);
											db.query(createIntentFilterRelCypher, relParams, function (err, results) {
												if (err) throw err;
												task_callback && task_callback();
											});	
										}
									}(intentFilter, callback);
							      }
						      }
					    	} else {
					    		callback();
					    	}
		 			};
		 			return findIntentFilter;
		 		}();
		 		tasks.push(a);
		 	  	//console.log(components[i][i].childNodes()[1].name());
		 		//console.log("----------");
		 		//task_callback && task_callback();
		 	}
		 	async.parallel(tasks, task_callback);
		},

		//* create Perm Nodes
		createPerms:function(permissions, appPName, callback){
			//var permissions = permissions.split('\n');
	  		//console.log(permissions[0]);
	  		//var isAllPermNodesAdded = false;
	  		var countPermNodes=0;
	  		if(permissions[0] != null){
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
					    		createPermRels(permissions, appPName, callback);
					    		//console.log("createPerms");
					    		//callback && callback();
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
			} else {
				//console.log("else");
				callback();
			}

	  		//* create Perm Rels
	  		function createPermRels(permissions, appPName, callback){
			    	//console.log('create Rel');
			    	var countPermRels = 0;
			    	var createRelCypher = [
					"MATCH (a:App),(b:Permission)",
					"WHERE a.appPName = {appPName} AND b.permission = {permission}",
					"CREATE UNIQUE (a)-[r:HasPermission]->(b)",
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
						countPermRels++;
						//console.log("countPermRels = " + countPermRels);
						//console.log("permissions.length = " + permissions.length);
						if (countPermRels == permissions.length){
							callback && callback();	
						}
					});
				}
			}
		},		
		
		/* no use now
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
		}
		*/

		set_sharedUserId_property:function(sharedUserId, callback) {
			var query = [
				"MATCH (a:App {appPName: {appPName} })",
				"SET a.sharedUserId = {sharedUserId}",
				"RETURN a"
			].join('\n');

			var params = {
				appPName: this.appPName,
				sharedUserId: sharedUserId
			};
			//console.log("appPName: " + this.appPName);
			//console.log(permissions[i]);
			db.query(query, params, function (err, results) {
				if (err) throw err;
				//console.log("set sharedUserId success!");
				callback && callback();
			});
		}
	}
	return r;

})();