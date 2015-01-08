objectory
=========

> When asked what he might do differently if he had to rewrite Java from scratch, James Gosling suggested that he might [do away with class inheritance](http://www.javaworld.com/article/2073649/core-java/why-extends-is-evil.html) and write a [delegation only](http://www.artima.com/intv/gosling34.html) language.
>
> Source: [delegation vs inheritance](http://javascriptweblog.wordpress.com/2010/12/22/delegation-vs-inheritance-in-javascript/)

### Why it exists
When ES6 arrives classes will become a standard of the JavaScript language. The problem with classes is that developers has become accustomed to it in other languages and wants to bring that concept into JavaScript. The thing is that there is a reason JavaScript does not have classes initially, it does not need to. JavaScript has powerful mechanisms for creating, composing and linking objects (delegation). In JavaScript objects can be linked to a chain called the prototype chain that consists of other objects, called delegates. These delegates can act on behalf of the instantiated object at the end of the chain.

Read more about it in this article: [Think twice about ES6 classes](http://christianalfoni.github.io/javascript/2015/01/01/think-twice-about-classes.html)

### What it does
There are several ways to create an object in JavaScript. Using a literal, a constructor, a function returning a literal etc. But there is one construct that gives you a lot of power, and that is an object factory:

- Create empty object by default
- Pass existing object and extend it in the factory
- Compose object in factory with other objects, constructors/prototypes and other factories
- Use private values and functions
- Leaves a trace of what factory(ies) an object came from

Objectory exposes a very simple API that lets you create objects in JavaScript in a very powerful way.

### What is a delegate?
```javascript
// This "obj"-object has a native delegate. The delegate is 
// stored on Object.prototype and linked on instantiation
var obj = {
  foo: 'bar' 
};

// We can run this method not defined, due to the fact that
// the linked delegate has it and can run it on behalf of "obj"
obj.toString(); // "[object Object]"
```
```javascript
// We create our own delegate which is linked to Object.prototype
var delegate = {
  getFoo: function () {
    return this.foo;
  }
};

// This "obj"-object is now linked to delegate, which 
// again is linked to Object.prototype
var obj = Object.create(delegate);
obj.foo = 'bar';
obj.getFoo(); // "bar"
obj.toString(); // "[object Object]"
```

You might have heard of the "prototype chain" in JavaScript. You might also have heard the term "prototypal inheritance". JavaScript does not have inheritance in the traditional sense, but delegation. Delegate means: "act on behalf of", which in practical terms means that the "getFoo"-method in the example above acted on behalf of the "obj"-object. But why do we have this delegation? First of all it uses a lot less memory and instantiating objects gets a lot faster. Second it allows for sharing behavior across different objects, as one delegate can be used by many different objects.

Objectory will optimize with delegates for you. Every object created has a default delegate, but it can be extended by composing other objects, constructors and factories.

### How to use
#### Create a factory
```javascript
var Obj = objectory(function (obj) {
  obj.foo = 'bar';
});

var myObjectA = Obj(); // {foo: "bar"}
var myObjectB = Obj(); // {foo: "bar"}
```

#### Compose
Composing is a very smart way to build optimized objects with instance properties and a linked delegate. It uses a single method to compose any kind of construct in JavaScript.

##### Compose an object
```javascript
var someObject = {foo: 'bar'};
var Obj = objectory(function (obj) {
  obj.compose(someObj);
  obj.instanceProp = true;
});

var myObject = Obj(); // {instanceProp: true}
myObject.foo; // "bar"
```
A composed object will be part of the delegate.

##### Compose a constructor with prototype
```javascript
var Obj = objectory(function (obj) {
  obj.compose(Backbone.Model, obj.attributes);
  obj.compose(EventEmitter);
});

var myObject = Obj(); // {_changing: false, _events: {}, _pending: false...}
myObject.on('change', function () {}); // works
```
When pointing to a constructor the prototype of that constructor will be part of the delegate. The constructor will be run
in context of the object being created. Any arguments to the constructor is passed as second, third, fourth argument and so on.

##### Compose an object factory
```javascript
var ObjA = objectfactory(function (obj) {
  obj.compose(Backbone.Model, obj.attributes);
});
var ObjB = objectory(function (obj) {
  obj.compose(ObjA);
  obj.foo = 'bar';
});

var myObject = Obj(); // {foo: "bar", _changing: false, _events: {}...}
myObject.on('change', function () {}); // works
```
When pointing to an other object factory it will bring that object factory delegate into its own. In this example that would be the prototype of Backbone Model. Then it runs the object factory constructor passing the object being created.

#### Privates
```javascript
var Obj = objectory(function (obj) {
  var myPrivate = 'foo';
  obj.getPrivate = function () {
    return myPrivate;
  };
});

var myObject = Obj(); // {getPrivate: function () {...}}
myObject.getPrivate(); // "foo"
```

#### Identifyer
```javascript
var someDelegate = {foo: 'bar'};
var Person = objectory(function (person) {
  person.compose(someDelegate);
  person.compose(Backbone.Model);
  person.age = 0;
});
var Student = objectory(function (student) {
  student.compose(Person);
  student.grade = 'A';
});

var studentA = Student();
studentA.composedOf(someDelegate); // true
studentA.composedOf(Backbone.Model); // true
studentA.composedOf(Person); // true
studentA.composedOf(Student); // true
```
Works just like "instanceof", but since it is composition, "composedOf". 

#### Merge other objects
```javascript
var someOtherObject = {foo: 'bar'};
var Obj = objectory(function (obj) {
  obj.assign(someOtherObject); // Can pass multiple objects to assign
});

var myObject = Obj(); // {foo: 'bar'}
```
Merging is not the same as composing. It is a conveniance method for using Object.assign.

#### Delegate a method to run on behalf of object
```javascript
var addDefaultList = function (item) { 
  this.list = ['foo', item]
};
var Obj = objectory(function (obj) {
  addDefaultList.call(obj, 'bar');
});

var myObject = Obj(); // {list: ['foo', 'bar']}
```
This is vanilla JavaScript.

### Compatability
You can use compose with any object, constructor+prototype or factory. If you or some external lib would use the **new** keyword on a factory everything behaves the same way. A factory constructor works just like any other constructor.

### Performance
Compared to ES6 classes I do not know yet, but compared to vanilla JavaScript it is around 50% slower. That said, creating objects in JavaScript is insanely fast. Looking at [jsPerf](http://jsperf.com/compose-vs-delegation/2) you will absolutely not get into trouble unless you are creating hundreds of thousands of objects in a loop.
