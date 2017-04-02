![Build Status](https://travis-ci.org/tompascall/js-to-sass-var-loader.svg?branch=master) [![Coverage Status](https://coveralls.io/repos/github/tompascall/js-to-sass-var-loader/badge.svg?branch=master)](https://coveralls.io/github/tompascall/js-to-sass-var-loader?branch=master)

## js-to-sass-var-loader

### A [Webpack]() loader to share data for sass variables between javascript modules and sass files

This loader is for that special case when you would like to import data from a javascript module into a sass file. The [sass loader](https://github.com/webpack-contrib/sass-loader) complains, because importing js module is not a valid sass instruction.

##### The loader only handles the case when you want to inject sass variables into a sass file via a javascript module.

#### Prerequisites

- Nodejs >= 4.0
- [sass](http://sass-lang.com/) for css pre-processing
- Webpack for module bundle


#### Setting up Webpack config

Probably you use [sass-loader](https://github.com/webpack-contrib/sass-loader) with Webpack. The usage in this case is pretty simple: just put this loader before sass-loader in your webpack config:

```js
{
  rules: [
    test: /\.sass$/,
    use: [
      {
        loader: "style-loader"
      },
      {
        loader: "css-loader"
      },
      {
        loader: "sass-loader"
      },
      {
        loader: "js-to-sass-var-loader"
      }
    ]
  ]
}
```

#### Usage

Let's assume we would like to store some variable data in a module like this:

```js
// colors.js

const colors = {
  'fancy-white': '#FFFFFE',
  'fancy-black': '#000001'
};

module.exports = colors;
```

You can use this module in your favorite templates / frameworks etc., and you don't want to repeat yourself when using these colors in a sass file as variable (e.g. `$fancy-white: #FFFFFE; /*...*/ background-color: $fancy-white`). In this situation just require your module in the beginning of your sass module:
```js
require('relative/path/to/colors.js');

// ...
.some-class {
  background-color: $fancy-white
}
// ...
```

**The form of the required data is important**: it must be an object with key/values pair, the key will be the name of the sass variable.

#### Misc

You can use other require form (`require('relative/path/to/module').someProperty`), too.  

#### Demo

You can try the loader via a small fake app in the `demo` folder:  
```sh
cd demo
npm i
npm run demo
```
The webpack dev server serves the app on `localhost:8030`. In the app we share data between js and sass modules.

#### Development

Run tests with `npm test` or `npm run test:watch`.  

The transformer is developed with tdd, so if you would like to contribute, please, write your tests for your new functionality, and send pull request to integrate your changes.
