"use strict";

const React = require('react');
const ReactDOM = require('react-dom');
const IndexPage = require('./IndexPage');

ReactDOM.hydrate(
  <IndexPage
    {...window.INITIAL_PROPS}
  />,
  document
);
