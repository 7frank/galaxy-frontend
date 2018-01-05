module.exports = function(config) {
    config.set({
        basePath: '',
        frameworks: ['jasmine'],
        files: [
           // 'build/node-modules-bundle.js',
           // 'build/bundle.js',
            // 'build/*.js',
            // 'build/tests/test_*.js',

            'test/**/*.js',
            'js/**/*.js'

        ],
        exclude: [
        ],
        preprocessors: {
           // 'js/**/*.js':['babel'], //,'webpack','sourcemap'
            'test/**/*.js':['babel',
                //'webpack',
               // 'sourcemap'
            ]
        },
        /* coverageReporter: {
             type : 'html',
             dir : 'coverage/'
         },*/
        //contains partial copy of webpack.config.js
        webpack: {
            devtool: 'inline-source-map',
            module: {
                rules: [
                    {
                        test: /\.(png|jpg|gif|json)$/,
                        use: [
                            {
                                loader: 'url-loader',
                                options: {
                                    limit: 8192
                                }
                            }

                        ]
                    },
                    {
                        test: /\.css$/,
                        use: [ 'style-loader', 'css-loader' ]
                    },
                    {
                        test: /\.(html)$/,
                        use: {
                            loader: 'html-loader',
                            options: {
                                attrs: [':data-src']
                            }
                        }
                    }

                ]
            }

        },
        reporters: ['coverage-istanbul'],

        coverageIstanbulReporter: {
            reports: ['json-summary'],
            dir:"./coverage/"
        },

        loggers: [{
            type: 'file',
            filename: "fu.txt"
            //filename: OUTPUT_LOG_FILE
        }],

        //reporters: ['dots','progress'],  //,'coverage'
        port: 9876,
        colors: true,
        logLevel: config.LOG_INFO,
        autoWatch: true,
        browsers: ['Chrome'],
        singleRun: true
    });
};


//module.exports.OUTPUT_LOG_FILE = OUTPUT_LOG_FILE;