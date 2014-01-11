---
layout: default
title: Knowledgebase
---

###Knowledgebase

I'm hoping to move this to a searchable, category, timeline based system at some point in the future!

---

####Mac OS X
---
######Reset Application Services Database
```
/System/Library/Frameworks/CoreServices.framework/Versions/A/Frameworks/LaunchServices.framework/Versions/A/Support/lsregister -kill -r -domain local -domain system -domain user
```
---
######Change Password from Terminal *(running as root removes old password requirement)*
```
dscl . -passwd /Users/USERNAME OLDPASSWORD NEWPASSWORD
```
---
######Building a Robust, Modern,  Mac-friendly `rsync`	
```
curl -O http://rsync.samba.org/ftp/rsync/src/rsync-3.0.8.tar.gz
tar -xzvf rsync-3.0.8.tar.gz
rm rsync-3.0.8.tar.gz
curl -O http://rsync.samba.org/ftp/rsync/src/rsync-patches-3.0.8.tar.gz
tar -xzvf rsync-patches-3.0.8.tar.gz
rm rsync-patches-3.0.8.tar.gz
cd rsync-3.0.8
patch -p1 <patches/fileflags.diff
patch -p1 <patches/crtimes.diff
patch -p1 <patches/hfs-compression.diff
./prepare-source
./configure --prefix /usr/local --disable-debug --enable-ipv6
make
sudo make install
```
---
######Enable text selection in Quick Look	
```
defaults write com.apple.finder QLEnableTextSelection -boolean YES;
killall Finder
```
---
######Enable Debug Menu in Safari (replace 1 with 0 to disable)	
```
defaults write com.apple.safari IncludeDebugMenu 1
```
---
######Turn off waking up on lid opening	
```
sudo pmset lidwake 0
```
---
######Show Battery Information	
```
ioreg -w0 -l | grep Capacity
```
---


<BR>
####Bash
---
######Defining directory trees with one command	
```
mkdir -p tmp/a/b/c
```
---
	
######Defining complex directory trees with one command	
```
mkdir -p project/{lib/ext,bin,src,doc/{html,info,pdf},demo/stat/a}	
```
---
######Find all text files with a certain extension — then do a text find/replace on the contents of said file	
```
find . -name "*.md" -print0 2>/dev/null | xargs -0 sed -i '' 's/Rick/Rich/g'
```
---

<BR>
####Xcode
---
######`NSLog` in Debugger Breakpoint
```
p (void)NSLog(@"%s: %@", _cmd, someObject)
```

