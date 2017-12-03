"use strict";

var express = require('express');
var body_parser = require('body-parser');
var app = express();

app.use(body_parser.urlencoded({extended: false}));
app.use(body_parser.json());
app.use(express.static('static'))

var PORT = 8000;
var TIMELINES = require('./timelines.json');

function dig(obj, trail) {
    if (trail.length == 0) return obj;

    let key = trail.shift();
    let value = obj[key];
    
    if (!value) return value;
    return dig(value, trail);
}

app.post('/query/', (request, response) => {
    let keys = JSON.parse(request.body.keys);
    let value = dig(TIMELINES, keys);

    if (!value) {
        response.status = 404;
        response.send('Not found.');
    }
    
    let response_data;
    if (Array.isArray(value))
        // Value is a timeline
        response_data = value;
    else
        // Value is a directory
        response_data = Object.keys(value);

    res.send(JSON.stringify(response_data));
});

app.listen(PORT, () => {
    console.log(`Listening on ${PORT}...`);
});
