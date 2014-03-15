var express = require('express');
//var	$ = require('jQuery');
var	dbHelper = require('./dbHelper');

//dbHelper.cleanDb();

app = express();

app.use(express.bodyParser());
app.use(express.cookieParser());
app.use(express.session({ secret: 'my secret' })); //hash
app.use(express.static(__dirname + '/public'));


app.set('view engine', 'ejs');
app.set('views', __dirname + '/views'); // default即為dirname + '/views'，故此行可拿掉
app.set('view options', { layout: false });

app.get('/', function(req,res){
	//res.render('results');
	//console.log(res);
	var nodes = [];
	var apps = [];
	var permissions = [];
	var nodeDataArray = [];
	var linkDataArray = [];

	
	//dbHelper.init();
	dbHelper.getApps(function(){
		apps = dbHelper.apps;

		if (apps.length == 0){
			res.render('results', {
				nodeDataArray: nodeDataArray ,
				linkDataArray: linkDataArray
			});
			//	res.send("no data");
		}

		apps.forEach(function(app){
			var obj = new Object();
			obj.key = app.appPName;
			obj.color = "orange";
			nodeDataArray.push(obj);
		});

		dbHelper.getAllPermissions(function(){
			permissions = dbHelper.permissions;
			permissions.forEach(function(permission){
				var obj = new Object();
				obj.key = permission.permission;
				obj.color = "pink";
				nodeDataArray.push(obj);
			});

			//console.log(nodeDataArray);
			var countPerms = 0;
			var countIntents = 0;
			apps.forEach(function(app){	
				//console.log(app);
				//console.log("apps.forEach");		
				var permissionsOfApp = [];
				dbHelper.getPermissionsOfApp(app.appPName, function(){
					//console.log("countPerms");
					countPerms++;
					permissionsOfApp = dbHelper.permissionsOfApp;
					//console.log(permissionsOfApp);
					permissionsOfApp.forEach(function(perm){
						var obj = new Object();
						obj.from = app.appPName;
						obj.to = perm;
						linkDataArray.push(obj);
						//console.log(obj);
					});
					//console.log(linkDataArray);
					if(countPerms == apps.length && countIntents == apps.length){
						//console.log(linkDataArray);
						//console.log("render1");
						//console.log(linkDataArray);
						res.render('results', {
							nodeDataArray: nodeDataArray ,
							linkDataArray: linkDataArray
						});
					}
				});

				var intentFiltersOfApp = [];
				dbHelper.getIntentFiltersOfApp(app.appPName, function(){
					//console.log("countIntents");
					countIntents++;
					intentFiltersOfApp = dbHelper.intentFiltersOfApp;
					intentFiltersOfApp.forEach(function(intent){
						var itNode = new Object();
						itNode.key = intent.action.join() + '\n' + intent.componentType;
						itNode.color = "lightblue";
						nodeDataArray.push(itNode);

						var itRel = new Object();
						itRel.from = intent.action.join() + '\n' +  intent.componentType;
						itRel.to = intent.appPName;
						linkDataArray.push(itRel);
					});

					if(countPerms == apps.length && countIntents == apps.length){
						//console.log(linkDataArray);
						//console.log("render2");
						//console.log(linkDataArray);
						res.render('results', {
							nodeDataArray: nodeDataArray ,
							linkDataArray: linkDataArray
						});
					}
				});
			});
			//console.log(linkDataArray);
			//console.log(nodeDataArray);
		});

		
	});
	
	/*
	dbHelper.getNodes(function(){
		var apps = [];
		var permissions = [];
		var nodes = dbHelper.nodes;
		var nodeDataArray = [];
		//console.log(nodes);
		
		res.render('results', {
			nodes: nodes ,
		});

		
		nodes.forEach(function(node){
			var obj = new Object();
			for(var prop in node){
				if(prop == 'permission') { 
					obj.key = node[prop];
					permissions.push(node);
					nodeDataArray.push(obj);
				} else if(prop == 'appPName'){
					obj.key = node[prop];
					apps.push(node);
					nodeDataArray.push(obj);
				}
				//res.write(prop + ':' + node[prop] + '\n');
			}
			//console.log('---');
		});
		
		//res.end('');
		//console.log(apps);
		
	});
	*/
});

app.post('/createGraph', function(req,res){
	//dbHelper.cleanDb();
	configParser = require("./configParser.js");
	configParser.parseXML("config.xml");
	setTimeout(function(){ 
	    configParser.createImplicitIntentRel(function(){
	    	res.redirect('/');
	    });
	}, 1000);
	//configParser.createImplicitIntentRel();
});

app.post('/cleanGraph', function(req, res){
	dbHelper.cleanDb(function(){
    	res.redirect('/');
    });
});
//dbHelper.getPermission(1);
//dbHelper.send();

app.listen(3001, function(){
	console.log('\033[96m + \033[39m app listening on *:3001');
});
