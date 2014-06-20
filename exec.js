var express = require('express');
//var	$ = require('jQuery');
var	dbHelper = require('./dbHelper');
var fs = require('fs');

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

app.get('/smsInterceptList', function(req, res){
	dbHelper.getSmsInterceptApp(function(results){
		//console.log('results: ' + results);
		if(results != null){
			res.render('smsInterceptList', {
				results: results
			});
		}
	});
});

app.get('/PS_Service', function(req, res){
	dbHelper.getExternalService(function(results_hash, permissionsMap){
		//console.log('result='+JSON.stringify(results));
		//console.log('permissionsMap='+JSON.stringify(permissionsMap));
		res.render('PS_Service', {
			//results: JSON.stringify("from: "+results[a.appPName] + "to: " + results[b.appPName])
			results_hash: results_hash,
			permissionsMap: permissionsMap
		});
	});
})

app.get('/PS_SUID', function(req, res){
	dbHelper.getSameSharedUserId(function(results){
		//console.log('result='+JSON.stringify(results));
		res.render('PS_SUID', {
			//results: JSON.stringify("from: "+results[a.appPName] + "to: " + results[b.appPName])
			results: results
		});
	});
})

app.post('/generateGraph', function(req,res){
	//dbHelper.cleanDb();

	///*----Create all permission nodes first----
	var neo4j = require('neo4j');
	var db = new neo4j.GraphDatabase('http://localhost:7474');
	var createPermsCypher = [
	  	"FOREACH (props IN [{ permission:'android.permission.RECEIVE_SMS' }, { permission:'android.permission.ACCESS_COARSE_LOCATION' }, { permission:'android.permission.INTERNET' }, { permission:'android.permission.WRITE_EXTERNAL_STORAGE' }]| ",
      	"CREATE ( p:Permission { permission:props.permission }))"
	].join('\n');

	db.query(createPermsCypher, {}, function (err, results) {
		if (err) throw err;

		var configParser = require("./configParser.js");
		configParser.parseXML("config3.xml", function(){
			configParser.createImplicitIntentRel(function(){
				res.redirect('/');
			});
			//res.redirect('/');
		});
    	});
	
	//setTimeout(function(){ 
	//	configParser.createImplicitIntentRel(function(){
	//		res.redirect('/');
	//	});
	//}, 1000);
});

app.post('/cleanGraph', function(req, res){
	dbHelper.cleanDb(function(){
		res.redirect('/');
	});
});
//dbHelper.getPermission(1);
//dbHelper.send();

app.post('/upload', function(req, res) {
	res.charset = 'utf-8';
	res.contentType('text');
	//console.log(req);
    	// get the temporary location of the file
    	
	var tmp_path = req.files.config.path;
	//console.log('tmp_path: ' + tmp_path);

	if(req.files.config.size > 0){
	    	//fs.mkdir('./public/' + req.session.loggedIn);
	    	//fs.mkdir('./public/' + req.session.loggedIn);
	    	//var target_path = './public/' + req.session.loggedIn + '/' + req.files.config.name;
	    	var target_path = './public/' + req.files.config.name;
	    	//module.exports.fileName = req.files.config.name;
	    	//var target_path = './public/' + req.files.config.name;
	    	// move the file from the temporary location to the intended location
	    	fs.rename(tmp_path, target_path, function(err) {
	      	if (err) throw err;
	      	// delete the temporary file, so that the explicitly set temporary upload dir does not get filled with unwanted files
	      	fs.unlink(tmp_path, function() {
	      	      if (err) throw err;      	      
	      	      //res.send(req.files);
				//delete require.cache[require.resolve('./analyzer')]

				res.write('File uploaded to: ' + target_path + ' - ' + req.files.config.size + ' bytes');
		      	res.end('');

		      	console.log(req.files);
		      	console.log('File uploaded to: ' + target_path + ' - ' + req.files.config.size + ' bytes');
		      	console.log('successfully deleted ' + tmp_path);

		      	//res.redirect('/');
		      	//console.log('------------------')
		      	//console.log(req);
	      	});
	    	});
	} else {
		fs.unlink(tmp_path); //* remove empty tmp file.
		res.end('Please chose a config xml file.');
	}
});


app.listen(3001, function(){
	console.log('\033[96m + \033[39m app listening on *:3001');
});
