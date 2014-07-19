import os
import sys
import xml.etree.ElementTree as ET

def find_service_intent(file_path):
	#print "find_service_intent: " + file_path
	print "========================================="

	k1 = 0
	k2 = 0
	k3 = 0
	src_pkg=''
	dst_pkg=''
	#for root, dirs, files in os.walk("./smalis/PS_StartServices.apk/smali/com/example/ps_services"):
	#for root, dirs, files in os.walk("./smalis/PS_StartServices.apk/smali/com/"):
	for root, dirs, files in os.walk(file_path):
		for q in files:
			if '.smali' in q:
				joined_path = os.path.join(root, q)
				f = open(joined_path , 'r')
				while True :
					i = f.readline()

					if "Intent;-><init>" in i:
						while True :
							j = f.readline()
							if "iget-object v1, p0" in j:
								tmp = (j.split(', L',1))
								tmp = tmp[1]
								tmp = tmp.split(';')[0]
								tmp = tmp.split('/')
								tmp.pop()
								src_pkg = '.'.join(tmp)
								src_pkg = src_pkg.strip()
								#print('source = '+src_pkg.strip())
								k2 = 1

							if "const-string v1" in j:
								tmp = (j.split('v1,', 2))
								#tmp.strip()
								dst_pkg = tmp[1]
								dst_pkg = dst_pkg.strip()
								dst_pkg = dst_pkg[1:-1]
								#print('destination = '+dst_pkg.strip())
								k1 = 1
							
							#if "const-string v2" in j:
							#	tmp = (j.split('v2,', 2))
							#	j = tmp[1]
							#	#print('destination = '+j.strip())
							#	k2 = 1
							
							if (("startService" in j) or ("bindService" in j)):
								k3 =1
							if "startActivity" in j:
								break
							#if (j =='') or (k1==1 and k2==1 and k3==1): break
							if (k1==1 and k2==1 and k3==1): 
								#print j
								append_node(src_pkg, 'service', dst_pkg)
								k1 = 0
								k2 = 0
								k3 = 0
								break
							if (j ==''): break

					if i=='': break

				f.close()   

def append_node(app_tag, targetType, target):
	#print app_tag + ' ' + targetType + ' ' + target
	print app_tag
	print target
	#print xml_root
	app_node = xml_root.getiterator(app_tag)
	print "****************"
	#app_node = applist.getiterator(app_tag)
	#print app_node
	#print ET.tostring(app_node)
	#print type(app_node)
	for node in app_node:
		#print 'append_node'
		#print app_tag + ' ' + targetType + ' ' + target
		tag_explicitIntent = ET.SubElement(node, 'explicitIntent')
		tag_targetType = ET.SubElement(tag_explicitIntent, 'targetType')
		tag_target = ET.SubElement(tag_explicitIntent, 'target')
		tag_targetType.text = targetType
		tag_target.text = target



if __name__ == '__main__':
	print "======In python script=======" + os.getcwd()

	folder_path = './'
	if(len(sys.argv) > 1):
		imei = sys.argv[1]
		folder_path = '../' + imei + '_folder/'
		#folder_path = './public/' + imei + '_folder/'

	print "====folder_path==== " + folder_path

	doc = ET.parse(folder_path + imei + '.xml')
	xml_root = doc.getroot()

	#append_node("com.saigmn", "type", "tgt")
	#print ET.tostring(applist)

	#for root, dirs, files in os.walk("./apks/"):
	for root, dirs, files in os.walk(folder_path):
		for filename in files:
			if '.apk' in filename:
				#print os.path.join(root, filename)
				#print "///////////////////" + filename

				#cmd = "./apktool d ./apks/" + filename + " ../smalis/" + filename
				apkname = filename[:-6]  #-6 to trim -x.apk
				if(sys.platform == "win32"):
					cmd = "apktool.bat d -f " + folder_path + filename + " " + folder_path + "smalis/" + apkname
					#print cmd
				else:
					cmd = "./apktool d -f " + folder_path + filename + " " + folder_path + "smalis/" + apkname
				
				#print "====cmd==== " + cmd
				os.system(cmd)

				#path = folder_path + "smalis/" + filename + "/smali/com/"
				#print "====path==== " + path
				#find_service_intent(path)

				split_name = filename.split('.')
				final_path = '/'.join(split_name[:-2])
				#final_path = '/'.join(split_name)
				print "final_path = " + final_path
				find_service_intent(folder_path + "smalis/" + apkname + "/smali/" + final_path)

	print "Decompile finished."

	'''
	filename = "com.example.ps_malware-1.apk"
	split_name = filename.split('.')
	final_path = '/'.join(split_name[:-2])
	find_service_intent(folder_path + "smalis/" + filename + "/smali/" + final_path)
	#find_service_intent("./smalis/PS_BindMalware.apk/smali/com/")
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



         
