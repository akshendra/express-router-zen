
const co = require('co');
const _ = require('lodash');
const path = require('path');
const express = require('express');


/**
 * Check is value is a generator
 * @private
 *
 * @param {*} value
 * @return {Boolean}
 */
function isGenerator(value) {
  return typeof value === 'function' &&
    value.constructor &&
    value.constructor.name === 'GeneratorFunction';
}


/**
 * Take a value and return a wrapped function
 *
 * @param {*} value
 *
 * @return {Function} - a function that can be used as middleware
 * @throws {Error} when the value is not function or generator
 */
function wrap(value) {
  if (isGenerator(value)) {
    const fn = co.wrap(value);
    // if it's an error handler
    if (value.length === 4) {
      return (err, req, res, next) => {
        fn(err, req, res, next).catch(next);
      };
    }
    // normal function
    return (req, res, next) => {
      fn(req, res, next).catch(next);
    };
  } else if (_.isFunction(value)) {
    return value;
  }
  throw new Error(`Controller function must be a function or generator but found ${typeof value}`);
}


/**
 * Take a configuration object and return a router
 *
 * @param {Object} object - the configuration object
 *
 * @return {Object} router
 * @throws {Error} when configuration object is not and object
 * @throws {Error} when the route key is not is proper format
 */
function better(object) {
  if (_.isObject(object) === false) {
    throw new Error(`Configuration value must be an object but found ${typeof object}`);
  }

  const before = (object.before || []).map(wrap);
  const after = (object.after || []).map(wrap);
  const prefix = object.prefix || '/';
  const routes = object.routes || {};
  const regex = /(get|post|delete|patch|put) => (.*)/;

  const router = new express.Router();
  Object.keys(routes).forEach((key) => {
    const match = key.match(regex);
    if (!match) {
      throw new Error(`Use proper format '<method> => <path>', found ${key}`);
    }
    const routeMethod = match[1];
    const routePath = path.join(prefix, match[2]);
    const value = routes[key];
    if (_.isObject(value) && !_.isArray(value) && !_.isFunction(value)) {
      const moreBefore = (value.before || []).map(wrap);
      const moreAfter = (value.after || []).map(wrap);
      const fn = value.controller;
      const v = _.flatten([before, moreBefore, wrap(fn), moreAfter, after]);
      router[routeMethod](routePath, v);
    } else {
      const v = _.flattenDeep([before, wrap(value), after]);
      router[routeMethod](routePath, v);
    }
  });
  return router;
}

module.exports = {
  better,
  wrap,
};
