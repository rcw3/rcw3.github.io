# Capturing My(self)

Occasionally in my software development career, some code or comment will trigger a bolt of fear through my psyche.  Were my assumptions incorrect?  Have I been doing this wrong all along?  Did I ever really understand why I was doing this in the first place?  Usually, the response includes stepping back, reassessing with a scientific analysis of the situation, writing some test code, and then reconfirmation (or readjustment) of my assumptions.

Recently, while reviewing some technical reviews of a chapter in a book I’m coauthoring, that familiar pang of fear echoed once again through my consciousness.  The target of this loss of faith and understanding revolved around my assumptions and understanding of retain cycles, blocks, and capturing of self.  As in the past, it was time to solidify and reaffirm the foundation of understanding.  

A quick aside, I’m going to assume the reader has at least a basic understanding of blocks and memory management under ARC.  If not, you may want to refresh yourself with Apple's [Blocks Programming](https://developer.apple.com/library/ios/documentation/cocoa/Conceptual/Blocks/Articles/00_Introduction.html) and [Advanced Memory Management](https://developer.apple.com/library/ios/documentation/cocoa/conceptual/memorymgmt/articles/mmpractical.html)  documents before proceeding.

Everyone loves blocks.  Well, I love blocks.  I think many others do as well.  They move code closer to their calling point, can be stored for later use, and capture the context of their environment.  Powerful stuff.  One of the few negatives is the relative ease one can create retain cycles within blocks.  Since blocks capture their context, package it up, and carry it along for the ride, any reference to self  (or implicit reference with an ivar) within a block also will capture a strong reference to self.  This isn’t necessarily an issue, until self happens to also have a strong reference to your block.  At this point, you now have a retain cycle, and unless explicitly broken, self (and the block) will never be deallocated.

### Can't Catch Me!
Avoiding the retain cycle is fairly simple:  create a weak variant of self and use it within your block.  If you want to verify that the weak self hasn’t disappeared halfway through your block,  assign the weak reference to a strong reference at the start of the block and use the strong reference throughout the entire block scope. Realize that your strong self may be nil.

```objc
__weak MyClass *weakSelf = self;
self.completionBlock = ^{
    MyClass *strongSelf = weakSelf;
    if (strongSelf)
    {
        strongSelf.someProperty = xyz; 
    }
};
```

If all you need to capture is the *value* of a property to avoid any references to self, copy the property into a strong local variable and capture that.

```objc
MyPropertyClass *propValue = self.someProperty;
self.completionBlock = ^{
    anotherObject.property = propValue;
};
```

The problem is not necessarily how to resolve the retain cycle.  The trick is understanding when the issue is relevant at all.  

I see people doing the weakSelf dance in many places where it is completely unnecessary.  I see people rifling through hundreds of classes making completely unnecessary and risky changes to code in a blind attempt to stave off the retain cycle boogeyman whether it exists or not. I also see people (myself included) skipping it in places where it might actually be required.  

Like most situations in life and coding, the problem is not always black and white, but lives in the gray areas in-between.  Let’s try to understand the heart of the issue.

In general, you want to insure that your objects are around for some period of time — particularly long enough to be used in whatever piece of code you have developed.  In this case, the objects we’re concerned about are the contextual objects around your block (which very likely may include self).  Your block retains this context so that it will exist when it comes time to run the block at some point in the future.

There isn’t anything intrinsically wrong with *self* maintaining a reference to the block - and most commonly, a strong reference.  Unfortunately, if *self* is captured within the block, a retain cycle now exists. If these retain cycles aren’t managed properly, you will suffer memory leaks. Managing retain cycles is hard, risky work. The best way to handle retain cycles in blocks is to prevent the cycle from occurring in the first place.   Using the weak self dance is easy.

In many cases, there is no retain cycle at all — just a long-standing strong reference held on your block that feels like one. It may feel like a retain cycle, but really, it’s just a strong reference for some unknown (or mostly unknown) period of time before the reference is broken and your block, and the objects it's strongly referencing are released as well.
  
My coworker Paul coined the phrase "unexpected lifetime": You don’t necessarily know when the block (and consequently the strong reference to self) will go out of scope.  Self cannot be deallocated until the block is released, which is most likely the most expected and appropriate outcome (i.e. we are confident the block will be released eventually). Most of the time, you won't have to worry about these unless the block lifetime is very long, completely unknown, or you want the self object released before the block can be.  

To complicate matters, not all blocks are held for any appreciable duration, so a rule like "always use weakSelf in blocks" just adds overhead. UIView's block animation methods, for a commonly-used example, execute the block immediately so unexpected lifetimes are not an issue.

### Common Scenarios 

I’ve attempted to walk through number of the most common situations that I’ve come across with blocks and the potential or perception for a retain cycle. I’ve tried to analyze each to determine when a retain cycle may exist, or when prevention may be necessary.   Remember, with all true retain cycles, you must break them at some point — either manually by reassigning one of the recursive references or by avoiding them in the first place using the weakSelf method above. (Block properties here are assumed to be declared 'copy' unless specified otherwise.)

#####Situation #1
The standard retain cycle is easy - self maintains strong reference to block, block refers to self capturing a strong reference.  Boom. Definitely **DO** need weak-self to avoid.
```objc
self.completionBlock = ^{ self.someProperty = xyz; };  // RETAIN CYCLE
```

#####Situation #2
As expected, you **DO** need weak-self for blocks if the block is contained by another object that self maintains a strong reference to.
```objc
someObject.completionBlock = ^{ self.someProperty = xyz; }; // NO RETAIN CYCLE (YET)
self.someObjectWithCompletionBlock = someObject;            // RETAIN CYCLE
```

#####Situation #3
You **MAY** need weak-self for notification center event handlers.  This isn’t the traditional retain cycle — just a long lifetime object that is holding a strong reference to self through the block— resulting in a strong reference that can feel like a retain cycle, or more accurately, an unexpected lifetime.   By appropriately handling the removal of the observer, the lifetime is no longer unexpected!  That said, due to the long lifetime of notification center observers and the cognitive management load required to insure that the pseudo-cycle is broken, it might be wise to play it safe and use weak-self to avoid the unexpected lifetime in the first place.

```objc
[[NSNotificationCenter defaultCenter] addObserverForName:@“someNotification” 
                                                  object:nil 
												   queue:[NSOperationQueue mainQueue]
                                              usingBlock:^(NSNotification *notification) { 
												  self.someProperty = xyz; }];   // NO RETAIN CYCLE, [LONG] UNEXPECTED LIFETIME
```

#####Situation #4
You should **NOT** need weak-self for animation blocks (the animation blocks are not retained beyond their short existence). There is an unexpected lifetime, but it’s incredibly short and will clearly complete.
```objc
[UIView animateWithDuration:duration animations:^{ [self.superview layoutIfNeeded]; }]; // NO RETAIN CYCLE, UNEXPECTED LIFETIME
```

#####Situation #5
Here is where things become gray.  Normally, the block will run and be discarded, releasing captured references to self.  This theoretically should be a short, intended strong reference on the block that will be broken when the block completes. This assumption of short duration will likely fail at some point unless you are very clear on the lifetime of the operation. Once again, it may be wise to use weak-self to avoid the unexpected lifetime altogether. 
```objc
[[NSOperationQueue mainQueue] addOperationWithBlock:^{ self.someProperty = xyz; }]; // NO RETAIN CYCLE, UNEXPECTED (POTENTIALLY LONG) LIFETIME 
```

#####Situation #6
Similarly, in most cases, you will err on the side of safety and use weak-self for anything with blocks or completion blocks where you kick off the activity immediately and the object maintaining those blocks is retained for the unexpected (and unpredictable) life of the block execution.   
```objc
NSURLSessionDataTask * dataTask = [session dataTaskWithRequest:request completionHandler:^(NSData *data, NSURLResponse *response, NSError *error) { self.someProperty = xyz }]; // NO RETAIN CYCLE, UNEXPECTED (POTENTIALLY LONG) LIFETIME
[dataTask resume]; 
```

###Broken Self
After this review, I must admit that the pangs of fear experienced were not entirely unfounded.  Unfortunately, this problem isn’t one that can be easily solved purely with simple rules or compiler checks.  That said, understanding the cause of the retain cycle, the lifetime of the retain cycle or strong reference, and the ways to avoid it when necessary, you should be able to navigate one of the remaining memory gotchas left in modern, ARC-based Objective-C.