> Route shorthand for express

### Install
```sh
npm install -g express-router-gen
```

### Usage
```js
  const express = require('express');
  const app = express();
  const zen = require('express-router-gen');

  // this is your controller
  const conf = {
    before: Function[], // middlewares to run before every route
    after: Function[], // middlewares to add after every route
    prefix: String, // prefix to add before every return 
    routes: {
      'get => /user/:id': function* (req, res, next) {},
      'post => /user': function (req, res, next) {},
      'put => /user/:id': {
        before: Function[],
        controller: function* (req, res, next) {},
      },
      'delete => /user/:id' => {
        before: Funtion[],
        after: Function[],
        controller: function (req, res, next) {},
      },
    },
  }

  // now use it
  app.use('/', zen(conf));
```