---
layout: post
title:  "Swift and the Command Line"
date:   2014-06-08
categories: blog
tags: development swift mac ios
author: Rich Wardwell
---

One of the first things that intrigued me with the ease of writing code interactively in the Xcode Playground was the feasibility of using _Swift_ as a possible replacement or supplement to traditional shell scripts.  When Chris Lattner (one of the founders of the language at Apple) posted the following on Twitter, I knew I was on to something:

> Of course _Swift_ supports #! scripts, you can immediately execute a _Swift_ script with "xcrun _Swift_ -i".

Why would you want to do this?  Well, first, _Swift_ is quite easy to build fully functional apps very quickly and efficiently, all while maintaining the full power of Foundation.  _Swift_ discards the old syntactical chrome of Objective-C (or more accurately C), particularly the whole requiring of a main() method as an entry point to your program.  Combined with the ability to actually run an uncompiled _Swift_ file directly from the command line dramatically reduces the friction of using a complete, powerful, system-level language where only simple, barebones scripts would operate before.  _Swift_ can bridge the gap between traditional shell scripts and full blown applications.

One of the first things I started tinkering around with when I got home was making this a reality.  It's actually not quite as simple as the tweet, but it definitely is quite doable, and opens up a whole new realm of possible opportunities from the command line. So, let's make this happen.  

The first step is ensuring that you have the appropriate Xcode selected.  From the terminal, you can determine your currently selected Xcode:

```
xcode-select --print-path
```
<BR>
You are likely still pointed to the original Xcode 5 install that does not include _Swift_.  Unless the response looks something like this: _/Applications/Xcode6-Beta.app/Contents/Developer_, you need to switch over to the new beta:

```
sudo xcode-select --switch /Applications/Xcode6-Beta.app
```
<BR>
The location above presumes you placed the Xcode 6 Beta in your applications folder.  If you chose somewhere else or renamed the app, you'll need to modify accordingly.

At this point, you can actually run a _Swift_ file directly from the command line.  We'll show that as well, but we really want to run our file without having to actually type out the _xcrun_ command. Let's go ahead and create a simple _Swift_ application.  Open up your favorite editor and create a _Swift_ file (e.g. HelloWorld.swift) with the following first line _hashbang_ to instruct the shell on how to handle what follows:

```
#!/usr/bin/xcrun swift -i

println("Hello World!")
```
<BR>
Don't forget to modify the permissions of your newly created shell script.  By default, the script will not be marked as executable.  A simple call to chmod will fix this:

```
chmod +rx  # adds read and execute for everyone
```
<BR>
or my preferred syntax:

```
chmod 755  # read/write/execute for owner and read and execute for everyone else
```
<BR>
While you could now type the following from the command line to run your program:

```
/usr/bin/xcrun swift -i HelloWorld.swift
```
<BR>
...there is a much simpler way.  Due to the _hashbang_ line at the top, you should be able to just type HelloWorld.swift (or ./HelloWorld.swift depending on how your _path_ environment variable is setup) and see the traditional welcoming first words of application life.  

Without the traditional _main_ method, you don't have apparent access to the command line arguments.  These are made available through the `C_ARGC` and `C_ARGV` constants.  You can iterate over `C_ARGV` or address specific arguments directly much like a traditional Swift array.

While this is exciting, we still have one small hurdle.  If you attempt to _import Foundation_, allowing access to the file system or environmental variables or a whole slew of other functionality, you'll receive an odd error.  We need to let _xcrun_ know where the SDK resides.  If you run your Swift file manually, you can use the following: 

```
/usr/bin/xcrun swift -i -sdk $(xcrun --show-sdk-path --sdk macosx)
```
<BR>
Unfortunately, it doesn't appear that the substitution works appropriately when used in the _hashbang_ portion of a shell script.  I was forced to paste the results from the 2nd _xcrun_ manually.  There may be a better way that I'm unware of — until then, replace the first line of your script with the following:

```
#!/usr/bin/xcrun swift -i -sdk /Applications/Xcode6-Beta.app/Contents/Developer/Platforms/MacOSX.platform/Developer/SDKs/MacOSX10.10.sdk
```
<BR>
Now you can access all the goodies Apple provides with a simple import, allowing you to do something like the following:

```
import Foundation

let user = NSProcessInfo.processInfo().environment.objectForKey("USER") as String
println("Hello World, this is \(user.uppercaseString)")

let currentPath = NSFileManager.defaultManager().currentDirectoryPath
println("The current directory is \(currentPath)")

let contentsAtPath = NSFileManager.defaultManager().contentsOfDirectoryAtPath(currentPath, error: nil) as String[]
for contentItem in contentsAtPath
{
    println(contentItem)
}
```
<BR>
Obviously, this doesn't really do much useful, but it hopefully triggers some ideas and possibility of the many things you *could* do.  With a small framework to simplify some of the traditional functionality often used within command line shell scripts, _Swift_ could quickly become the go-to tool for developing everything from simple scripts to full blown command-line apps.  Go forth and code!



