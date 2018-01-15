![Build Status](https://travis-ci.org/tompascall/js-to-styles-var-loader.svg?branch=master) [![Coverage Status](https://coveralls.io/repos/github/tompascall/js-to-styles-var-loader/badge.svg?branch=master)](https://coveralls.io/github/tompascall/js-to-styles-var-loader?branch=master)

## js-to-styles-var-loader

### A [Webpack](https://webpack.github.io/) loader to share variable data between javascript modules and sass or less files

This loader is for that special case when you would like to import data from a javascript module into a sass /less file. The [sass](https://github.com/webpack-contrib/sass-loader) / [less](http://lesscss.org/) loader complains, because importing js module is not a valid instruction.

##### The loader only handles the case when you want to inject variable data into a sass / less file via a javascript module.

#### Prerequisites

- Nodejs >= 4.0
- Webpack for module bundling


#### Setting up Webpack config

Probably you use [sass-loader](https://github.com/webpack-contrib/sass-loader) or [less-loader](https://github.com/webpack-contrib/less-loader) with Webpack. The usage in this case is pretty simple: just put the js-to-styles-var-loader before the sass-loader / less-loader in your webpack config:

For sass-loader:
```js
{
  rules: [
    test: /\.scss$/,
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
        loader: "js-to-styles-var-loader"
      }
    ]
  ]
}
```

For less-loader:

```js
{
  rules: [
    test: /\.less$/,
    use: [
      {
        loader: "style-loader"
      },
      {
        loader: "css-loader"
      },
      {
        loader: "less-loader"
      },
      {
        loader: "js-to-styles-var-loader"
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
```sass
require('relative/path/to/colors.js');

// ...
.some-class {
  background-color: $fancy-white
}
// ...
```

**The form of the required data is important**: it must be an object with key/values pair, the key will be the name of the variable.

The js-to-styles-var-loader transforms this sass file and provides it in the following form for the sass-loader:

```js
$fancy-white: #FFFFFE;
$fancy-black: #000001;

.some-class {
  background-color: $fancy-white
}
```

#### Misc

You can import from named exports and properties of those, although the value of these must still be a flat list:

```js
// themes.js

module.exports = {
  themes: {
    blue_theme: {
      some_color: "#00f"
    },
    red_theme: {
      some_color: "#f00"
    }
  },
  default: {
    some_color: "#aaa"
  }
};
```

Variables definitions are inserted into your sass/less file in place of the `require()` statement, so you can override variables inside blocks:

```less

require("themes.js").default;

.someThing {
  color: @some_color;
}

.theme-blue {
  require("themes.js").themes.blue_theme;

  .someThing {
    color: @some_color;
  }
}


```

#### Demo

You can try the loader via a small fake app in the `demo` folder:
```sh
cd demo
npm i
npm run demo
```
The webpack dev server serves the app on `localhost:8030`. In the app we share data between js, less and sass modules.

#### Development

Run tests with `npm test` or `npm run test:watch`.

The transformer is developed with tdd, so if you would like to contribute, please, write your tests for your new functionality, and send pull request to integrate your changes.
