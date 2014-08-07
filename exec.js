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
							//console.log("id: " + id);
							//console.log("action: " + imp_intent_flow.action);
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

		if(fs.existsSync(target_dir + req.files.information.name)){
			res.end("apk already exist.")
			console.log("apk already exist!");
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

				var shellSyntaxCommand = 'python readfile_explicit_intent.py ' + imei;
				//var shellSyntaxCommand = 'python readfile_explicit_intent.py 351565051501952';
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
	//generate_graph('./public/351565051501952_folder/', "351565051501952",function(){
	generate_graph('./public/860955028172850_folder/', "860955028172850",function(){
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
		{ permission:'android.permission.WAKE_LOCK' }, 
		{ permission:'android.permission.WRITE_EXTERNAL_STORAGE' },
		{ permission: "android.permission.VIBRATE" }, 
		{ permission: "android.permission.READ_LOGS" }, 
		{ permission: "android.permission.ACCESS_FIND_LOCATION" }, 
		{ permission: "android.permission.WRITE_SETTINGS" }, 
		{ permission: "com.google.android.providers.gsf.permission.READ_GSERVICES" }, 
		{ permission: "android.permission.MOUNT_UNMOUNT_FILESYSTEMS" }, 
		{ permission: "com.addcn.android.house591.permission.C2D_MESSAGE" }, 
		{ permission: "com.google.android.c2dm.permission.RECEIVE" }, 
		{ permission: "android.permission.GET_ACCOUNTS" }, 
		{ permission: "android.permission.AUTHENTICATE_ACCOUNTS" }, 
		{ permission: "android.permission.MANAGE_ACCOUNTS" }, 
		{ permission: "android.permission.READ_CONTACTS" }, 
		{ permission: "android.permission.READ_PROFILE" }, 
		{ permission: "com.twitter.android.permission.AUTH_APP" }, 
		{ permission: "co.vine.android.permission.C2D_MESSAGE" }, 
		{ permission: "android.permission.RECORD_AUDIO" }, 
		{ permission: "com.sonyericsson.permission.CAMERA_EXTENDED" }, 
		{ permission: "com.android.launcher.permission.INSTALL_SHORTCUT" }, 
		{ permission: "android.permission.CAMERA" }, 
		{ permission: "com.adobe.reader.provider.permission.READ" }, 
		{ permission: "com.arpp.trigo.mobile.permission.C2D_MESSAGE" }, 
		{ permission: "android.permission.MODIFY_AUDIO_SETTINGS" }, 
		{ permission: "android.permission.CHANGE_CONFIGURATION" }, 
		{ permission: "android.permission.RECEIVE_BOOT_COMPLETED" }, 
		{ permission: "android.permission.WRITE_CONTACTS" }, 
		{ permission: "android.permission.READ_SMS" }, 
		{ permission: "com.android.launcher.permission.READ_SETTINGS" }, 
		{ permission: "android.permission.BROADCAST_STICKY" }, 
		{ permission: "com.android.launcher.permission.UNINSTALL_SHORTCUT" }, 
		{ permission: "android.permission.BLUETOOTH_ADMIN" }, 
		{ permission: "android.permission.BLUETOOTH" }, 
		{ permission: "android.permission.CHANGE_WIFI_STATE" }, 
		{ permission: "android.permission.SYSTEM_ALERT_WINDOW" }, 
		{ permission: "com.android.vending.BILLING" }, 
		{ permission: "android.permission.GET_TASKS" }, 
		{ permission: "android.permission.USE_CREDENTIALS" }, 
		{ permission: "android.permission.READ_SYNC_SETTINGS" }, 
		{ permission: "com.beetalk.permission.C2D_MESSAGE" }, 
		{ permission: "android.permission.WRITE_SYNC_SETTINGS" }, 
		{ permission: "com.beetalk.permission.MAPS_RECEIVE" }, 
		{ permission: "android.permission.SET_DEBUG_APP" }, 
		{ permission: "android.permission.ACCESS_MOCK_LOCATION" }, 
		{ permission: "android.permission.READ_EXTERNAL_STORAGE" }, 
		{ permission: "android.permission.FLASHLIGHT" }, 
		{ permission: "android.permission.DISABLE_KEYGUARD" }, 
		{ permission: "android.permission.CALL_PHONE" }, 
		{ permission: "tw.com.mobimedia.movibon.permission.C2D_MESSAGE" }, 
		{ permission: "com.eztable.shareshopping.permission.C2D_MESSAGE" }, 
		{ permission: "android.permission.RECEIVE_MMS" }, 
		{ permission: "android.permission.WRITE_SMS" }, 
		{ permission: "android.permission.SEND_SMS" }, 
		{ permission: "com.facebook.orca.permission.CROSS_PROCESS_BROADCAST_MANAGER" }, 
		{ permission: "com.chocolabs.bus.permission.SEND_ALARM" }, 
		{ permission: "android.permission.NETWORK" }, 
		{ permission: "com.chocolabs.imusee.permission.C2D_MESSAGE" }, 
		{ permission: "com.chocolabs.youbike.permission.C2D_MESSAGE" }, 
		{ permission: "com.example.permission.MAPS_RECEIVE" }, 
		{ permission: "com.chocolabs.youbike.permission.TIME_RECEIVER" }, 
		{ permission: "com.chocolabs.youbike.permission.TIME_SENDER" }, 
		{ permission: "android.permission.GET_PACKAGE_SIZE" }, 
		{ permission: "android.permission.RESTART_PACKAGES" }, 
		{ permission: "com.djages.taipeifoodblogs.permission.C2D_MESSAGE" }, 
		{ permission: "android.permission.SET_WALLPAPER" }, 
		{ permission: "android.permission.WRITE_MEDIA_STORAGE" }, 
		{ permission: "android.permission.ACCESS_SUPERUSER" }, 
		{ permission: "android.permission.CHANGE_WIFI_MULTICAST_STATE" }, 
		{ permission: ".PERMISSION" }, 
		{ permission: "com.dropbox.android.service.ACCOUNT_INFO_ALARM_TRIGGER" }, 
		{ permission: "com.dropbox.android.permission.C2D_MESSAGE" }, 
		{ permission: "com.facebook.orca.provider.ACCESS" }, 
		{ permission: "com.facebook.pages.app.provider.ACCESS" }, 
		{ permission: "android.permission.DOWNLOAD_WITHOUT_NOTIFICATION" }, 
		{ permission: "com.facebook.katana.provider.ACCESS" }, 
		{ permission: "com.facebook.receiver.permission.ACCESS" }, 
		{ permission: "android.permission.WRITE_CALENDAR" }, 
		{ permission: "com.facebook.permission.debug.SYSTEM_COMMUNICATION" }, 
		{ permission: "com.facebook.permission.prod.FB_APP_COMMUNICATION" }, 
		{ permission: "android.permission.READ_CALENDAR" }, 
		{ permission: "android.permission.CHANGE_NETWORK_STATE" }, 
		{ permission: "com.facebook.katana.permission.CROSS_PROCESS_BROADCAST_MANAGER" }, 
		{ permission: "android.permission.REORDER_TASKS" }, 
		{ permission: "android.permission.EXPAND_STATUS_BAR" }, 
		{ permission: "android.permission.SET_WALLPAPER_HINTS" }, 
		{ permission: "android.permission.BATTERY_STATS" }, 
		{ permission: "com.htc.launcher.permission.READ_SETTINGS" }, 
		{ permission: "com.sec.android.provider.badge.permission.READ" }, 
		{ permission: "com.sonyericsson.home.permission.BROADCAST_BADGE" }, 
		{ permission: "com.sec.android.provider.badge.permission.WRITE" }, 
		{ permission: "com.htc.launcher.permission.UPDATE_SHORTCUT" }, 
		{ permission: ".home.permission.WRITE_BADGES" }, 
		{ permission: "com.amazon.device.messaging.permission.RECEIVE" }, 
		{ permission: "com.facebook.katana.permission.C2D_MESSAGE" }, 
		{ permission: "com.nokia.pushnotifications.permission.RECEIVE" }, 
		{ permission: "com.facebook.katana.permission.RECEIVE_ADM_MESSAGE" }, 
		{ permission: "com.google.android.voicesearch.AUDIO_FILE_ACCESS" }, 
		{ permission: "com.facebook.orca.permission.C2D_MESSAGE" }, 
		{ permission: "com.facebook.orca.permission.RECEIVE_ADM_MESSAGE" }, 
		{ permission: "com.getone.getweatherAPP.permission.C2D_MESSAGE" }, 
		{ permission: "android.permission.ACCESS_PHONE_STATE" }, 
		{ permission: "android.permission.NFC" }, 
		{ permission: "android.permission.READ_CALL_LOG" }, 
		{ permission: "com.glympse.android.glympse.permission.C2D_MESSAGE" }, 
		{ permission: "com.glympse.android.glympse.permission.RECEIVE_ADM_MESSAGE" }, 
		{ permission: "com.google.android.gms.permission.ACTIVITY_RECOGNITION" }, 
		{ permission: "android.permission.ACCESS_COARSE_UPDATES" }, 
		{ permission: "android.permission.ACCESS_LOCATION_EXTRA_COMMANDS" }, 
		{ permission: "com.samsung.accessory.permission.ACCESSORY_FRAMEWORK" }, 
		{ permission: "pioneer.permission.appradio.ADVANCED_APPMODE" }, 
		{ permission: "com.samsung.android.sdk.permission.SAMSUNG_CUP_SERVICE" }, 
		{ permission: "com.google.android.apps.adm.permission.C2D_MESSAGE" }, 
		{ permission: "com.google.android.gms.permission.LAUNCH_MDM_SETTINGS" }, 
		{ permission: "com.google.android.apps.chrometophone.permission.C2D_MESSAGE" }, 
		{ permission: "android.permission.WRITE_USER_DICTIONARY" }, 
		{ permission: "android.permission.READ_USER_DICTIONARY" }, 
		{ permission: "android.permission.WRITE_SYNC_STATS" }, 
		{ permission: "android.permission.READ_SYNC_STATS" }, 
		{ permission: "com.google.android.googleapps.permission.GOOGLE_AUTH" }, 
		{ permission: "android.permission.SUBSCRIBED_FEEDS_READ" }, 
		{ permission: "com.google.android.gm.permission.READ_GMAIL" }, 
		{ permission: "com.google.android.googleapps.permission.GOOGLE_AUTH.OTHER_SERVICES" }, 
		{ permission: "android.permission.SUBSCRIBED_FEEDS_WRITE" }, 
		{ permission: "com.google.android.googleapps.permission.GOOGLE_AUTH.writely" }, 
		{ permission: "com.google.android.googleapps.permission.GOOGLE_AUTH.ALL_SERVICES" }, 
		{ permission: "com.google.android.googleapps.permission.GOOGLE_AUTH.wise" }, 
		{ permission: "com.google.android.apps.docs.permission.READ_MY_DATA" }, 
		{ permission: "com.google.android.apps.docs.permission.SYNC_STATUS" }, 
		{ permission: "com.hellotalk.permission.C2D_MESSAGE" }, 
		{ permission: "com.hellotalk.permission.MAPS_RECEIVE" }, 
		{ permission: "com.jumplife.movieinfo.permission.C2D_MESSAGE" }, 
		{ permission: "com.jumplife.tvvariety.permission.C2D_MESSAGE" }, 
		{ permission: "android.permission.READ_FRAME_BUFFER" }, 
		{ permission: "android.permission.SET_ORIENTATION" }, 
		{ permission: "com.instagram.android.permission.RECEIVE_ADM_MESSAGE" }, 
		{ permission: "com.instagram.android.permission.C2D_MESSAGE" }, 
		{ permission: "android.permission.READ_OWNER_DATA" }, 
		{ permission: "android.permission.WRITE_INTERNAL_STORAGE" }, 
		{ permission: "com.skt.aom.permission.AOM_RECEIVE" }, 
		{ permission: "com.kakao.talk.permission.AOM_MESSAGE" }, 
		{ permission: "com.kakao.talk.permission.C2D_MESSAGE" }, 
		{ permission: "com.kakao.talk.permission.RECEIVE_NOTIFICATION" }, 
		{ permission: "com.kakao.talk.permission.FRIENDS_PICKER" }, 
		{ permission: "com.kakao.home.permission.SNOOZE" }, 
		{ permission: "com.kakao.talk.permission.START_CHAT" }, 
		{ permission: "com.kakao.talk.permission.ADD_FRIEND_AND_START_CHAT" }, 
		{ permission: "com.kakao.talk.permission.INTERNAL" }, 
		{ permission: "com.liquable.nemo.permission.C2D_MESSAGE" }, 
		{ permission: "com.liquable.nemo.android.INTERNAL_PERMISSION" }, 
		{ permission: "com.orangefish.app.delicacy.permission.C2D_MESSAGE" }, 
		{ permission: "com.orangefish.app.delicacy.MAPS_RECEIVE" }, 
		{ permission: "com.newmobilelife.permission.C2D_MESSAGE" }, 
		{ permission: "com.orangefish.app.finddrink.MAPS_RECEIVE" }, 
		{ permission: "com.nike.plusgps.permission.C2D_MESSAGE" }, 
		{ permission: "com.dsi.ant.permission.ANT" }, 
		{ permission: "com.dsi.ant.permission.ANT_ADMIN" }, 
		{ permission: "com.google.android.googleapps.permission.GOOGLE_AUTH.local" }, 
		{ permission: "com.google.android.apps.mytracks.READ_TRACK_DATA" }, 
		{ permission: "com.google.android.apps.mytracks.MYTRACKS_NOTIFICATIONS" }, 
		{ permission: "com.google.android.apps.mytracks.WRITE_TRACK_DATA" }, 
		{ permission: "com.google.android.maps.mytracks.permission.MAPS_RECEIVE" }, 
		{ permission: "android.permission.WRITE_OWNER_DATA" }, 
		{ permission: "com.ideashower.readitlater.pro.permission.C2D_MESSAGE" }, 
		{ permission: "com.pro.iniu.permission.C2D_MESSAGE" }, 
		{ permission: "com.paktor.fragments.permission.MAPS_RECEIVE" }, 
		{ permission: "com.paktor.permission.C2D_MESSAGE" }, 
		{ permission: "com.ninja.sms.CHOOSE_RESTORE_FILE" }, 
		{ permission: "com.perracolabs.permission.cameringo" }, 
		{ permission: "android.permission.RECORD_VIDEO" }, 
		{ permission: "com.google.android.providers.gmail.permission.READ_GMAIL" }, 
		{ permission: "org.kman.AquaMail.datax.GET_ACCOUNTS" }, 
		{ permission: "com.google.android.gm.permission.READ_CONTENT_PROVIDER" }, 
		{ permission: "com.google.android.providers.talk.permission.READ_ONLY" }, 
		{ permission: "com.fsck.k9.permission.READ_MESSAGES" }, 
		{ permission: "com.sonyericsson.illumination.permission.ILLUMINATION" }, 
		{ permission: "com.sonyericsson.extras.liveware.aef.EXTENSION_PERMISSION" }, 
		{ permission: "android.permission.WRITE_CALL_LOG" }, 
		{ permission: "com.skout.android.permission.C2D_MESSAGE" }, 
		{ permission: "android.permission.READ_INTERNAL_STORAGE" }, 
		{ permission: "com.shazam.android.permission.C2D_MESSAGE" }, 
		{ permission: "com.shazam.android.preloadinfo.provider.ACCESS_DATA" }, 
		{ permission: "com.skysoft.kkbox.android.permission.C2D_MESSAGE" }, 
		{ permission: "android.permission.RAISED_THREAD_PRIORITY" }, 
		{ permission: "com.sothree.umano.permission.C2D_MESSAGE" }, 
		{ permission: "com.spotify.music.permission.C2D_MESSAGE" }, 
		{ permission: "com.sparkslab.dcardreader.permission.C2D_MESSAGE" }, 
		{ permission: "com.thetransitapp.droid.permission.MAPS_RECEIVE" }, 
		{ permission: "com.tinder.permission.MAPS_RECEIVE" }, 
		{ permission: "com.tinder.permission.C2D_MESSAGE" }, 
		{ permission: "android.permission.STORAGE" }, 
		{ permission: "com.videohya.mvwiki.permission.C2D_MESSAGE" }, 
		{ permission: "com.chocolabs.ubike.permission.C2D_MESSAGE" }, 
		{ permission: "android.permission.INSTALL_SHORTCUT" }, 
		{ permission: "com.whatsapp.permission.MAPS_RECEIVE" }, 
		{ permission: "com.whatsapp.permission.C2D_MESSAGE" }, 
		{ permission: "com.whatsapp.permission.VOIP_CALL" }, 
		{ permission: "com.yahoo.mobile.client.android.permissions.YAHOO_INTER_APP" }, 
		{ permission: "com.yahoo.snp.android.permission.ACCESS_PUSHAGENT" }, 
		{ permission: "com.yahoo.mobile.client.android.weather.permission.MAPS_RECEIVE" }, 
		{ permission: "android.permission.MODIFY_PHONE_STATE" }, 
		{ permission: "android.permission.WRITE_APN_SETTINGS" }, 
		{ permission: "android.permission.CLEAR_APP_CACHE" }, 
		{ permission: "com.android.browser.permission.READ_HISTORY_BOOKMARKS" }, 
		{ permission: "android.permission.KILL_BACKGROUND_PROCESSES" }, 
		{ permission: "com.android.browser.permission.WRITE_HISTORY_BOOKMARKS" }, 
		{ permission: "jp.naver.line.android.permission.C2D_MESSAGE" }, 
		{ permission: "jp.naver.android.npush.permission.PUSH_MESSAGE" }, 
		{ permission: "jp.naver.line.android.permission.LINE_ACCESS" }, 
		{ permission: "com.kddi.market.permission.USE_ALML" }, 
		{ permission: "com.linecorp.snapmovie.permission.RECORD_MOVIE" }, 
		{ permission: "jp.naver.line.android.permission.AOM_MESSAGE" }, 
		{ permission: "sstream.app.broadcast.SYNC_USER" }, 
		{ permission: "flipboard.app.permission.C2D_MESSAGE" }, 
		{ permission: "la.droid.qr.permission.C2D_MESSAGE" }, 
		{ permission: "nexti.android.bustaipei.permission.MAPS_RECEIVE" }, 
		{ permission: "android.permission.PROCESS_OUTGOING_CALLS" }, 
		{ permission: "com.sec.android.provider.logsprovider.permission.READ_LOGS" }, 
		{ permission: "com.sec.android.provider.logsprovider.permission.WRITE_LOGS" }, 
		{ permission: "gogolook.callgogolook2.permission.C2D_MESSAGE" }, 
		{ permission: "com.google.android.providers.gsf.permisson.READ_GSERVICES" }, 
		{ permission: "org.cohortor.PV" }, 
		{ permission: "tw.com.mcd.mcdalarm.tools.permission.C2D_MESSAGE" }, 
		{ permission: "com.android.vending.CHECK_LICENSE" }, 
		{ permission: ".permission.MAPS_RECEIVE" }, 
		{ permission: "tw.goodlife.a_gas.permission.C2D_MESSAGE" }, 
		{ permission: "tw.com.ipeen.ipeenapp.view.permission.C2D_MESSAGE" }
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
