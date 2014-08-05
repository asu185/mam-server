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


app.get('/graph', function(req,res){
	//res.render('results');
	//console.log(res);
	var nodes = [];
	var apps = [];
	var permissions = [];
	var nodeDataArray = [];
	var linkDataArray = [];
	var expIntent_flows = [];
	var impIntent_flows = [];
	
	//dbHelper.init();
	dbHelper.getApps(function(){
		apps = dbHelper.apps;

		if (apps.length == 0){
			res.render('graph', {
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
						//console.log("nodeDataArray: " + JSON.stringify(nodeDataArray));
						//console.log("linkDataArray: " + JSON.stringify(linkDataArray));
						res.render('graph', {
							nodeDataArray: nodeDataArray ,
							linkDataArray: linkDataArray ,
							expIntent_flows: expIntent_flows ,
							impIntent_flows: impIntent_flows
						});
					}
				});

				var intentsOfApp = [];
				dbHelper.getIntentsOfApp(app.appPName, function(){
					//console.log("countIntents");
					countIntents++;
					intentsOfApp = dbHelper.intentsOfApp;
					//console.log("intentsOfApp: " + JSON.stringify(intentsOfApp));
					//intentsOfApp.forEach(function(intent){
					for(var id in intentsOfApp){
						//console.log("target: " + intentsOfApp[id].target);
						if(intentsOfApp[id].target != null){
							var itNode = new Object();
							//itNode.key = intent.action.join() + '\n' + intent.function_call_type;
							itNode.key = id + intentsOfApp[id].function_call_type;
							itNode.color = "lightgreen";
							nodeDataArray.push(itNode);

							var itSendRel = new Object();
							itSendRel.from = intentsOfApp[id].appPName;
							itSendRel.to = id + intentsOfApp[id].function_call_type;
							linkDataArray.push(itSendRel);

							var itRcvRel = new Object();
							itRcvRel.from = id + intentsOfApp[id].function_call_type;
							itRcvRel.to = intentsOfApp[id].target;
							linkDataArray.push(itRcvRel);

							var exp_intent_flow = {};
							exp_intent_flow.from = intentsOfApp[id].appPName;
							exp_intent_flow.thru = intentsOfApp[id].function_call_type;
							exp_intent_flow.to = intentsOfApp[id].target;
							expIntent_flows.push(exp_intent_flow);
						} else {
							var imp_intent_flow = {};
							imp_intent_flow.from = intentsOfApp[id].appPName;
							imp_intent_flow.thru = intentsOfApp[id].function_call_type;
							imp_intent_flow.action = intentsOfApp[id].action;
							console.log("id: " + id);
							console.log("action: " + imp_intent_flow.action);
							impIntent_flows.push(imp_intent_flow);
						}
					}

					if(countPerms == apps.length && countIntents == apps.length){
						//console.log("nodeDataArray: " + JSON.stringify(nodeDataArray));
						//console.log("linkDataArray: " + JSON.stringify(linkDataArray));
						res.render('graph', {
							nodeDataArray: nodeDataArray ,
							linkDataArray: linkDataArray ,
							expIntent_flows: expIntent_flows
						});
					}
				});
			});
			//console.log(linkDataArray);
			//console.log(nodeDataArray);
		});
	});
});


app.get('/', function(req,res){
	res.render('index');
	//res.end('Welcome!');
});

app.get('/system_info', function(req, res){
	dbHelper.getSystemInfo(function(infos){
		//console.log('result='+JSON.stringify(infos));
		res.render('system_info', {
			//results: JSON.stringify("from: "+results[a.appPName] + "to: " + results[b.appPName])
			infos: infos
		});
	});
})

app.get('/sms_intercept', function(req, res){
	dbHelper.getSmsInterceptApp(function(results){
		//console.log('results: ' + results);
		if(results != null){
			res.render('sms_intercept', {
				results: results
			});
		}
	});
});

app.get('/ps_service', function(req, res){
	dbHelper.getExternalService(function(results_hash, permissionsMap){
		//console.log('results_hash='+JSON.stringify(results_hash));
		//console.log('permissionsMap='+JSON.stringify(permissionsMap));
		res.render('ps_service', {
			//results: JSON.stringify("from: "+results[a.appPName] + "to: " + results[b.appPName])
			results_hash: results_hash,
			permissionsMap: permissionsMap
		});
	});
})

app.get('/ps_suid', function(req, res){
	dbHelper.getSameSharedUserId(function(results){
		//console.log('result='+JSON.stringify(results));
		res.render('ps_suid', {
			//results: JSON.stringify("from: "+results[a.appPName] + "to: " + results[b.appPName])
			results: results
		});
	});
})

app.post('/clean_graph', function(req, res){
	dbHelper.cleanDb(function(){
		res.redirect('/');
	});
});

var count = 0;
app.post('/upload', function(req, res) {
	count++;
	console.log("count = " + count);
	res.charset = 'utf-8';
	res.contentType('text');

	console.log("uploading...");
	//console.log(req);
    
    // get the temporary location of the file
    var imei = req.body.imei;
	var tmp_path = req.files.information.path;
	//console.log('tmp_path: ' + tmp_path);

	if(req.files.information.size > 0){
    	var target_dir = './public/' + imei + '_folder/';
    	//fs.mkdirSync(target_dir)
    	if(!fs.existsSync(target_dir)){
			fs.mkdirSync(target_dir, 0766, function(err){
				if(err){ 
					console.log(err);
					response.send("ERROR! Can't make the directory! \n");    // echo the result back
				}
			});   
		}

    	//var target_path = './public/' + req.session.loggedIn + '/' + req.files.information.name;
    	var target_path = target_dir + req.files.information.name;
    	//module.exports.fileName = req.files.information.name;
    	//var target_path = './public/' + req.files.information.name;
    	// move the file from the temporary location to the intended location
    	fs.rename(tmp_path, target_path, function(err) {
	      	if (err) throw err;
	      	// delete the temporary file, so that the explicitly set temporary upload dir does not get filled with unwanted files
	      	fs.unlink(tmp_path, function() {
	      	      if (err) throw err;      	      
	      	      //res.send(req.files);
				//delete require.cache[require.resolve('./analyzer')]

				//res.write('File uploaded to: ' + target_path + ' - ' + req.files.information.size + ' bytes');
		      	//res.end('');

		      	//console.log(req.files);
		      	console.log('File uploaded to: ' + target_path + ' - ' + req.files.information.size + ' bytes');
		      	console.log('successfully deleted ' + tmp_path);

		      	//res.redirect('/');
		      	//console.log('------------------')
		      	//console.log(req);
		      	res.end('successfully upload.');

	      	});

	      	if(req.body.finish == "true"){ ///* true if the last file has been uploaded.

		    	
		    	console.log("Upload finished.");	
		    	//console.log('imei = ' + imei);

				//var shellSyntaxCommand = 'python readfile_explicit_intent.py ' + imei;
				var shellSyntaxCommand = 'python readfile_explicit_intent.py 351565051501952';
				console.log('shellSyntaxCommand = ' + shellSyntaxCommand);

				var child_process = require('child_process');
				console.log("Start to decompile...");
				child_process.exec(shellSyntaxCommand, {cwd: './py_code/'}, function(err, stdout, stderr) {
					
					dbHelper.cleanDb(function(){
	      				var path_to_configxml = target_dir + imei + '_config.xml';
						console.log(stdout);
						console.log('callback.');
						console.log('path_to_configxml = ' + path_to_configxml);

						generate_graph(target_dir, imei, function(){
				      		//res.redirect('/');
				      		console.log('==========finish!!!!!========');
				      	});
	      			});
					
				});
		    }
	      	
    	});
	} else {
		fs.unlink(tmp_path); //* remove empty tmp file.
		res.end('Please chose a config xml file.');
	}
});

app.post('/generate_graph', function(req,res){
	generate_graph('./public/351565051501952_folder/', "351565051501952",function(){
		res.redirect('/system_info');
		console.log('==========finish!!!!!========');
	});
});

function generate_graph(target_dir, imei, callback) {
//app.post('/generate_graph', function(req,res){
	//dbHelper.cleanDb();
	console.log('==========target_dir========' + target_dir);
	///*----Create all permission nodes first----
	var neo4j = require('neo4j');
	var db = new neo4j.GraphDatabase('http://localhost:7474');

	var permissions  = [
		{ permission:'android.permission.RECEIVE_SMS' }, 
		{ permission:'android.permission.READ_PHONE_STATE' }, 
		{ permission:'android.permission.ACCESS_WIFI_STATE' }, 
		{ permission:'android.permission.ACCESS_NETWORK_STATE' }, 
		{ permission:'android.permission.ACCESS_FINE_LOCATION' }, 
		{ permission:'android.permission.ACCESS_COARSE_LOCATION' }, 
		{ permission:'android.permission.INTERNET' }, 
		{ permission:'android.permission.WRITE_EXTERNAL_STORAGE' }
	];
	var createPermsCypher = [
	  	//"FOREACH (props IN [{ permission:'android.permission.RECEIVE_SMS' }, { permission:'android.permission.ACCESS_COARSE_LOCATION' }, { permission:'android.permission.INTERNET' }, { permission:'android.permission.WRITE_EXTERNAL_STORAGE' }]| ",
	  	"FOREACH (props IN {permissions}| ",
      	"MERGE ( p:Permission { permission:props.permission }))"
	].join('\n');

	db.query(createPermsCypher, {permissions: permissions}, function (err, results) {
		if (err) throw err;
		//console.log("callback");
		//callback && callback();

		var configParser = require("./configParser.js");
		configParser.parseXML(target_dir, imei, function(){
		//configParser.parseXML("config4.xml", function(){
		//configParser.parseXML("config_0621.xml", function(){
			configParser.createImplicitIntentRel(function(){
				//res.redirect('/');
				callback && callback();
			});
			//res.redirect('/');
		});

    });
}


app.listen(3001, function(){
	console.log('\033[96m + \033[39m app listening on *:3001');
});
