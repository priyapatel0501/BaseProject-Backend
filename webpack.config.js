const { sentryWebpackPlugin } = require('@sentry/webpack-plugin');

const path = require('path');

module.exports = {
    mode: 'development',
    // Entry point of your application
    entry: './server.js',

    output: {
        path: path.resolve(__dirname, 'dist'), // Output directory
        filename: 'bundle.js', // Output bundle file
    },
    stats: {
        errorDetails: true,
    },
    module: {
        rules: [
            {
                test: /\.js$/, // Apply babel-loader to .js files
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env'],
                    },
                },
            },
            {
                test: /\.html$/,
                exclude: /node_modules/,
                loader: 'ignore-loader',
            },
            {
                test: /\.node$/,
                use: 'ignore-loader',
            },
            {
                test: /\.html$/,
                exclude: /node_modules/,
                loader: 'html-loader',
            },
        ],
    },
    target: 'node',
    devtool: 'source-map',

    plugins: [
        sentryWebpackPlugin({
            authToken: process.env.SENTRY_AUTH_TOKEN,
            org: process.env.ORG,
            project: process.env.PROJECT,
            include: '.',
            ignore: ['node_modules', 'webpack.config.js'],
            release: {
                name: 'MyApp-1.0.0',
            },
            configFile: 'sentry.properties',
            stripPrefix: ['webpack://_N_E/'],
        }),
    ],
};
