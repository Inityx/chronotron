"use strict";

const express = require('express');
const body_parser = require('body-parser');
const app = express();

app.use(body_parser.urlencoded({extended: false}));
app.use(body_parser.json());
app.use(express.static('static'))

const PORT = 8000;
const TIMELINES = require('./timelines.json');

function dig(obj, trail) {
    if (trail.length == 0) return obj;

    const key = trail.shift();
    const value = obj[key];
    
    if (!value) return value;
    return dig(value, trail);
}

app.post('/query/', (request, response) => {
    const keys = JSON.parse(request.body.keys);
    const value = dig(TIMELINES, keys);

    if (!value) {
        response.status = 404;
        response.send('Not found.');
    }
    
    const response_data = Array.isArray(value) ?
        value :             // Value is a timeline
        Object.keys(value); // Value is a directory

    res.send(JSON.stringify(response_data));
});

app.listen(PORT, () => {
    console.log(`Listening on ${PORT}...`);
});
