import os
import sys
import xml.etree.ElementTree as ET

def find_intent(file_path, appPName):
	#print "find_intent: " + file_path
	print "========================================="

	k1 = 0
	k2 = 0
	k3 = 0
	is_inter_app_intent = True
	src_pkg='' # not real src_pkg, no use now
	dst_pkg=''
	it_type = ''
	v = {}
	#for root, dirs, files in os.walk("./smalis/PS_StartServices.apk/smali/com/example/ps_services"):
	#for root, dirs, files in os.walk("./smalis/PS_StartServices.apk/smali/com/"):
	for root, dirs, files in os.walk(file_path):
		for q in files:
			if '.smali' in q:
				joined_path = os.path.join(root, q)
				f = open(joined_path , 'r')
				while True :
					line = f.readline()

					if "new-instance v" in line and ", Landroid/content/Intent;" in line:
						#print 'line: ' + line
						tmp = line.split(', ', 2)
						n = tmp[0].split()[1]
						#v[n] = tmp[1]

						#line = line[1:]
						#n = str(int(line) + 1)
						#print 'n: ' + n + ' v[n]: ' + v[n]
						while True :
							j = f.readline()

							if "const-class v" in j:
								is_inter_app_intent = False

							if "const-string v" in j and k1==0:
								tmp = (j.split(', ', 2))
								n = tmp[0].split()[1]
								tmp = tmp[1].strip()
								v[n] = tmp[1:-1]
								k1 = 1

							if "Intent;->setClassName" in j:
								it_type = "explicit"
								n = j.split(', ', 2)[1]
								dst_pkg = v[n]
								#print dst_pkg
								#print "it_type: " + it_type

							if "iget-object v" in j and k2==0:
								tmp = (j.split(', L',1))[1]
								tmp = tmp.split(';')[0]
								tmp = tmp.split('/')
								tmp.pop()
								src_pkg = '.'.join(tmp)
								src_pkg = src_pkg.strip()
								#print('source = '+src_pkg.strip())
								k2 = 1
							
							#if (("startService" in j) or ("bindService" in j) and k3==0):
							if (("startService" in j) and k3==0):
								k3 = 1
								componentType = "service"
								function_call_type = "startService"
							elif (("bindService" in j) and k3==0):
								k3 = 1
								componentType = "service"
								function_call_type = "bindService"
							elif (("startActivity" in j) and k3==0):
								k3 = 1
								componentType = "activity"
								function_call_type = "startActivity"
							elif (("startActivityForResult" in j) and k3==0):
								k3 = 1
								componentType = "activity"
								function_call_type = "startActivityForResult"
							elif (("sendBroadcast" in j) and k3==0):
								k3 = 1
								componentType = "broadcast"
								function_call_type = "sendBroadcast"

							#if ("startActivity" in j) or ("bindService" in j) or ("stopService" in j) or ("sendBroadcast" in j) or ("startActivityForResult" in j):
							#	break

							#if (j =='') or (k1==1 and k2==1 and k3==1): break
							if (k1==1 and k2==1 and k3==1):
								if it_type == "explicit":
									#print 'explicit'
									#print src_pkg, function_call_type, dst_pkg
									if not src_pkg == dst_pkg:
										append_exp_intent(appPName, function_call_type, dst_pkg, componentType)
								elif is_inter_app_intent:
									#print 'implicit ' + function_call_type + ' v: ' + str(v)
									print joined_path
									#print src_pkg
									append_imp_intent(appPName, function_call_type, v, componentType)
								k1 = 0
								k2 = 0
								k3 = 0
								it_type = ''
								v = {}
								break
							if (j ==''): break

					if line=='': break

				f.close()   

def append_exp_intent(app_tag, function_call_type, target, componentType):
	#print app_tag + ' ' + function_call_type + ' ' + target
	#print app_tag
	#print target
	#print xml_root
	app_node = xml_root.getiterator(app_tag)
	#print "*******append_exp_intent*********"
	#app_node = applist.getiterator(app_tag)
	#print app_node
	#print ET.tostring(app_node)
	#print type(app_node)
	for node in app_node:
		#print 'append_exp_intent'
		#print app_tag + ' ' + function_call_type + ' ' + target
		tag_explicitIntent = ET.SubElement(node, 'explicitIntent')
		tag_componentType = ET.SubElement(tag_explicitIntent, 'componentType')
		tag_function_call_type = ET.SubElement(tag_explicitIntent, 'function_call_type')
		tag_target = ET.SubElement(tag_explicitIntent, 'target')

		tag_componentType.text = componentType
		tag_function_call_type.text = function_call_type
		tag_target.text = target

def append_imp_intent(app_tag, function_call_type, v, componentType):
	#print app_tag + ' ' + function_call_type + ' ' + target
	print app_tag + ' ' + function_call_type
	#print target
	#print xml_root
	app_node = xml_root.getiterator(app_tag)
	print "*******append_imp_intent*********"
	#app_node = applist.getiterator(app_tag)
	#print app_node
	#print ET.tostring(app_node)
	#print type(app_node)
	for node in app_node:
		#print 'append_exp_intent'
		#print app_tag + ' ' + function_call_type + ' ' + target
		tag_implicitIntent = ET.SubElement(node, 'implicitIntent')
		tag_componentType = ET.SubElement(tag_implicitIntent, 'componentType')
		tag_function_call_type = ET.SubElement(tag_implicitIntent, 'function_call_type')
		tag_action = ET.SubElement(tag_implicitIntent, 'action')

		tag_componentType.text = componentType
		tag_function_call_type.text = function_call_type
		print 'v: ' + str(v)
		for action in v:
			tag_action.text = v[action] + '\n'
			#print "v[action]: " + v[action]
		#if 'v1' in v:
		#	tag_action.text = v['v1']


if __name__ == '__main__':
	print "======In python script=======" + os.getcwd()

	folder_path = './'
	if(len(sys.argv) > 1):
		imei = sys.argv[1]
		folder_path = '../public/' + imei + '_folder/'
		#folder_path = './public/' + imei + '_folder/'

	print "====folder_path==== " + folder_path

	doc = ET.parse(folder_path + imei + '.xml')
	xml_root = doc.getroot()

	#append_exp_intent("com.saigmn", "type", "tgt")
	#print ET.tostring(applist)

	#for root, dirs, files in os.walk("./apks/"):
	for root, dirs, files in os.walk(folder_path):
		for filename in files:
			if '.apk' in filename:
				#print os.path.join(root, filename)
				#print "///////////////////" + filename

				appPName = filename[:-6]  #-6 to trim -x.apk
				file_smalis = folder_path + "smalis/" + appPName

				if not(os.path.exists(file_smalis)): # skip decompiling if it has already decompiled before
					#cmd = "./apktool d ./apks/" + filename + " ../smalis/" + filename					
					if(sys.platform == "win32"):
						cmd = "apktool.bat d -f " + folder_path + filename + " " + folder_path + "smalis/" + appPName
						#print cmd
					else:
						cmd = "./apktool d -f " + folder_path + filename + " " + folder_path + "smalis/" + appPName
					
					#print "====cmd==== " + cmd
					os.system(cmd)

				#path = folder_path + "smalis/" + filename + "/smali/com/"
				#print "====path==== " + path
				#find_intent(path)

				split_name = filename.split('.')
				final_path = '/'.join(split_name[:-2])
				#final_path = '/'.join(split_name)
				#print "final_path = " + final_path

				find_intent(folder_path + "smalis/" + appPName + "/smali/" + final_path, appPName)

	print "Decompile finished."

	'''
	#filename = "com.example.test1"
	filename = "com.hyonga.snu.lang.edu.lab"
	split_name = filename.split('.')
	final_path = '/'.join(split_name[:-2])
	#print final_path
	find_intent(folder_path + "smalis/" + filename + "/smali/" + final_path, filename)
	#find_intent("./smalis/PS_BindMalware.apk/smali/com/")
	'''
	#print ET.tostring(xml_root)
	#os.unlink(folder_path + imei + '_config.xml');
	
	try:
	    # This will create a new file or **overwrite an existing file**.
	    f = open(folder_path + imei + '_config.xml', "w+")
	    try:
	        f.write(ET.tostring(xml_root)) # Write a string to a file
	        #f.writelines(lines) # Write a sequence of strings to a file
	    finally:
	        f.close()
	except IOError:
	    pass
	
#cmd = "./apktool d ./apks/test1.apk ./smalis/test1"
#os.system("./apktool d ./apks/test1.apk ./smalis/test1")

#print "Start to decompile..."



         
