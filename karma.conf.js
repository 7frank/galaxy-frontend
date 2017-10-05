module.exports = function(config) {
    config.set({
        basePath: '',
        frameworks: ['jasmine'],
        files: [
            'build/node-modules-bundle.js',
            'build/bundle.js',
           // 'build/*.js',
           // 'build/tests/test_*.js',
            'test/*.js'
        ],
        exclude: [
        ],
        preprocessors: {
            'test/*.js':['webpack','sourcemap']
        },
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
        reporters: ['dots','progress'],
        port: 9876,
        colors: true,
        logLevel: config.LOG_INFO,
        autoWatch: true,
        browsers: ['Chrome'],
        singleRun: true
    });
};