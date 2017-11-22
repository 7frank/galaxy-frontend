
# TODO

## documentation for classes

cluster.elements.*

cluster.refactor.*

<s>cluster.particles.*</s>

<s>cluster.text.*</s>

cluster.utils.*

cluster.*

data,gui,utils,view

## fix

pg_connect by removing code? or adding section for php.ini? rather first one to not rely in php code



# galaxy-webcomponent

One Paragraph of project description goes here

The following repository contains the source of a webcomponent that renders a graph of nodes via WebGL / THREE.js.
The component can be used in other projects to render a data set of nodes and edges.
By default it is configured to work with a graphql datasource.
For local testing the alternative is to use a  local JSON-formatted source file

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes. See deployment for notes on how to deploy the project on a live system.

### Prerequisites

What things you need to install the software and how to install them

+ First of all you will need to - if you not did that already - install a copy of a git client and  node package manager (npm) 
+ also you'll need to grab a copy of nodejs to be able to compile and resolve dependencies (aswell as using npm which comes bundled with nodejs)
+ note: you might need to use a tool like putty to manage your ssh-keys when cloning reopsitories later on and  to streamline access for production
+ when using php-storm, for local debugging you will need to install and configure an additional php interpreter like "xampp" 

```
Give examples
```

### Installing

A step by step series of examples that tell you have to get a development env running

Say what the step will be

```
Give the example
```

And repeat

```
until finished
```

End with an example of getting some data out of the system or using it for a little demo


+ clone repository / download source files 

```
git clone ssh://git@bitbucket.org/galaxystone/galaxy.git
```

+ install dependencies (after installing nodejs)
```
npm install
```

+ to compile the sample.. this will generate ./build/index.html which is the entry point of the application. (if you are using a separate webserver like 'xampp')

```
npm run build-graph
```

+  to run the sample with the build in webserver in PHPStorm create a 'npm' debug configuration with the values above
+ afterwards create an additional Javascript-Debug configuration
+ in the before launch section create/add another configuration (the npm-one created previously) or one with the values above 

+ to be able to resolve break points  => "remote urls of local files"
++ File/Directory <local-path-to-repository>   remote URL: http://webpack:




+ when using crome in addition you will need to install the "JetBrains IDE Support" plugin from the chrome web store
+ also you will need a copy of a php interpreter to run the internal webserver of phpstorm
```
TODO
```



## Running the tests

Explain how to run the automated tests for this system

### Break down into end to end tests

Explain what these tests test and why

```
Give an example
```


For unit tests 'karma' was used. To run some basic tests
```
TODO code for karma.config.js
```


### And coding style tests

Explain what these tests test and why

```
Give an example
```

## Deployment

Add additional notes about how to deploy this on a live system

+ to install it on a target device, first clone the git repository as shown in the 'installing' section

+ if you are using a already installed weberver, make sure the installation path is acessible 



## Built With

* [Dropwizard](http://www.dropwizard.io/1.0.2/docs/) - The web framework used
* [Maven](https://maven.apache.org/) - Dependency Management
* [ROME](https://rometools.github.io/rome/) - Used to generate RSS Feeds



## Contributing

Please read [CONTRIBUTING.md](https://gist.github.com/PurpleBooth/b24679402957c63ec426) for details on our code of conduct, and the process for submitting pull requests to us.

## Versioning

We use [SemVer](http://semver.org/) for versioning. For the versions available, see the [tags on this repository](https://github.com/your/project/tags). 

## Authors

* **Frank Reimann** - *Initial work* - [nkre](https://github.com/nkre1147)

See also the list of [contributors](https://github.com/your/project/contributors) who participated in this project.

## License

This project does have a propriatery license, all rights reseved - see the [LICENSE.md](LICENSE.md) file for details

## Acknowledgments

* Hat tip to anyone who's code was used
* Inspiration
* etc

