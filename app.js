'use strict';

const fs = require('fs');
const express = require('express');
const body_parser = require('body-parser');
const app = express();

app.use(body_parser.json());
app.use(express.static('static'));

const PORT = 8000;
const DATA_FNAME = process.argv[2] || './timelines.json';
const TIMELINES = JSON.parse(fs.readFileSync(DATA_FNAME));

function dig(obj, trail) {
    if (trail.length == 0) return obj;

    const key = trail.shift();
    const value = obj[key];
    
    if (!value) return value;
    return dig(value, trail);
}

function each_in_with_object(src_obj, with_obj, callback) {
    for (let key in src_obj)
        callback(with_obj, key, src_obj[key]);
    return with_obj;
}

function format_response_data(listing) {
    if (Array.isArray(listing))
        // Listing is a timeline
        return listing;

    // Listing is a directory
    return each_in_with_object(
        listing, {},
        (accum, field, value) =>
            accum[field] = Array.isArray(value) ? 'timeline' : 'directory'
    );
}

app.post('/query/', (request, response) => {
    console.log(`Requested '${request.body.trail.join('/')}'`);

    const listing = dig(TIMELINES, request.body.trail);

    if (!listing) return response.status(404).send('Not found.');
    
    response.send(
        JSON.stringify(
            format_response_data(listing)
        )
    );
});

app.listen(PORT, () => {
    console.log(`Serving timeline from '${DATA_FNAME}'`);
    console.log(`Listening on ${PORT}...`);
});
