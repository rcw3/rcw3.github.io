---
layout: post
title:  "Capture My(self)"
date:   2014-02-01
categories: Development Objective-C
author: Rich Wardwell
---

Occasionally in my software development career, some code or comment will trigger a bolt of fear through my psyche.  Were my assumptions incorrect?  Have I been doing this wrong all along?  Did I ever really understand why I was doing this in the first place?  Usually, the response includes stepping back, reassessing with a scientific analysis of the situation, writing some test code, and then reconfirmation (or readjustment) of my assumptions.

Recently, while reviewing some technical reviews of a chapter in a book I’m coauthoring, that familiar pang of fear echoed once again through my consciousness.  The target of this loss of faith and understanding revolved around my assumptions and understanding of retain cycles, blocks, and capturing of `self`.  As in the past, it was time to solidify and reaffirm the foundation of understanding.  

A quick aside, I’m going to assume the reader has at least a basic understanding of blocks and memory management under ARC.  If not, you may want to refresh yourself with Apple's [Blocks Programming](https://developer.apple.com/library/ios/documentation/cocoa/Conceptual/Blocks/Articles/00_Introduction.html) and [Advanced Memory Management](https://developer.apple.com/library/ios/documentation/cocoa/conceptual/memorymgmt/articles/mmpractical.html)  documents before proceeding.

Everyone loves blocks.  Well, I love blocks.  I think many others do as well.  They move code closer to their calling point, can be stored for later use, and capture the context of their environment.  Powerful stuff.  One of the few negatives is the relative ease one can create retain cycles within blocks.  Since blocks capture their context, package it up, and carry it along for the ride, any reference to `self`  (or implicit reference with an ivar) within a block also will capture a strong reference to `self`.  This isn’t necessarily an issue, until `self` happens to also have a strong reference to your block.  At this point, you now have a retain cycle, and unless explicitly broken, `self` (and the block) will never be deallocated:

```objc
self.myBlock = ^{ self.someProperty = xyz; };               // RETAIN CYCLE
```

The compiler is pretty good at catching these straightforward retain cycles, and will warn you appropriately. 

Similarly, a retain cycle is created if the block is contained by another object that `self` maintains a strong reference to:

```objc
someObject.someBlock = ^{ self.someProperty = xyz; };       // NO RETAIN CYCLE (YET)
self.someObjectWithABlock = someObject;                     // RETAIN CYCLE
```

Unfortunately, the compiler won't help you in this very common case.

### Can't Catch Me!
Avoiding the retain cycle is fairly simple:  create a weak variant of `self` and use it within your block.  Unless you're confident about the behavior of your references when `nil` (and probably even then), you'll want to verify that the weak `self` hasn’t disappeared halfway through your block.  Simply assign the weak reference to a strong reference at the start of the block and use the strong reference throughout the entire block scope. As noted, realize that your strong `self` may be `nil`.

```objc
__weak __typeof__(self) weakSelf = self;
self.myBlock = ^{
    __typeof__(self) strongSelf = weakSelf;
    if (strongSelf)
    {
        strongSelf.someProperty = xyz; 
    }
};
```

If all you need to capture is the *value* of a property to avoid any references to `self`, copy the property into a strong local variable and capture that.

```objc
MyPropertyClass * propValue = self.someProperty;
self.myBlock = ^{
    anotherObject.property = propValue;
};
```


### Unexpected Lifetime

The problem is not necessarily how to resolve the retain cycle, which is quite black and white. Like most situations in life and coding, the complexities live in the gray areas in-between.

In general, you want to ensure that your objects are around for some period of time — particularly long enough to be used in whatever piece of code you have developed.  In this case, the objects we’re concerned about are the contextual objects around your block (which very likely may include `self`).  Your block retains this context so that it will exist when it comes time to run the block at some point in the future.

We've already discussed the retain cycle. The best way to handle retain cycles in blocks is to prevent the cycle from occurring in the first place. Using the `weakSelf` dance is easy.

More often than not, your blocks will be held by a strong reference from an object other than `self`. In these instances, the lifetime of the owning object may be unknown. If this block holds a reference to `self`, the lifetime of `self` may now be unclear as well.  At some point in the future, the block's owner will presumably relinquish control of the block, and the objects it's strongly referencing are released as well, but that moment may be outside the hands of the developer or difficult to discern.
  
My coworker, Paul Goracke, coined the phrase "unexpected lifetime" for this scenario.  You don’t necessarily know when the block (and consequently the strong reference to `self`) will go out of scope, and `self` cannot be deallocated until the block is released.  

To complicate matters, not all blocks are held for any appreciable duration, so a rule like "always use weakSelf in blocks" just adds overhead and may actually contradict your actual needs. UIView's block animation methods, for a commonly used example, execute the block immediately so unexpected lifetimes are not an issue:

```objc
[UIView animateWithDuration:duration animations:^{ [self.superview layoutIfNeeded]; }]; 
```
There is an unexpected lifetime, but it’s incredibly short and will clearly complete. The strong reference to self for this short period is perfectly acceptable if not desired.

With some block methods, you may explicitly wish that the block keep self alive until after the completion of the block. In others, you may want `self` to be deallocated immediately, even if a block maintains a reference, by using `weakSelf`.  It is a judgement call based on your needs and your expectations for `self`'s lifetime.   It will likely depend on the situation, including block lifetime length or determinability, or a specific need for `self` to be released before the block can be. 

Blocks are often passed to long-living system objects:

```objc
[[NSOperationQueue mainQueue] addOperationWithBlock:^{ self.someProperty = xyz; }]; 
```
This theoretically should be a short, intended strong reference on the block that will be broken when the block completes, relinquishing its hold on `self`.  You must determine the most appropriate handling of the situation:

*  Use `weakSelf` to allow `self` to potentially be deallocated prior to the block running.

or:
	
*  Not use `weakSelf` and ensure that `self` will be alive when the block operation runs.

Again, you will need to make a judgement call on the expected lifetime of self and your desire for self to exist during the block execution — based on the needs of your app. 


### Notify my(self)

One specific unexpected lifetime issue is worth noting. As expected, `NSNotificationCenter` block-based observers can create an unexpected lifetime for the block and the objects it retains:

```objc
[[NSNotificationCenter defaultCenter] addObserverForName:@"someNotification" 
                                                  object:nil 
						   queue:[NSOperationQueue mainQueue]
                                              usingBlock:^(NSNotification * notification) {
                                                    self.someProperty = xyz; }]; // UNEXPECTED LIFETIME
```

When using `NSNotificationCenter` and block-based observers, if you listen to notifications through the entirety of the object's lifetime (for example, removing your observers in `dealloc`), you will need to use the `weakSelf` dance.  Without `weakSelf`, the unexpected lifetime will prevent `dealloc` from being called.  If you explicitly unregister your observers at some point, `weakSelf` is not required except in the cases already discussed.


###Broken Self
After this review, I must admit that the pangs of fear experienced were not entirely unfounded.  Unfortunately, this problem isn’t one that can be easily solved purely with simple rules or compiler checks.  That said, by understanding the lifetime of strong references to your blocks, be it a retain cycle with `self` or purely an unexpected lifetime, and the ways to avoid the issues these situations may cause, you should be able to navigate one of the remaining memory gotchas left in modern, ARC-based Objective-C.