'use strict';

const QUERY_URL = '/query/';
const HTML_DATA_KEY = 'data-key';

function timeline_query(trail) {
    return new Promise(
        (resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('POST', QUERY_URL);
            
            xhr.onload = () => {
                if (xhr.status == 200) resolve(JSON.parse(xhr.responseText));
                else reject(xhr.responseText);
            };
            xhr.onerr = () => reject(xhr.statusTest);

            xhr.setRequestHeader('Content-type', 'application/json');
            xhr.send(JSON.stringify({trail: trail}));
        }
    );
}

const TimelineStore = {
    root: new Object(),

    inject: function(value, trail, node = TimelineStore.root) {
        if (trail.length == 0) throw 'inject called with empty trail';

        const key = trail.shift();

        // If end of trail, try insertion
        if (trail.length == 0) {
            if (node[key]) throw 'inject attempted to overwrite existing data';
            return node[key] = value;
        }

        // Create empty node if not exists
        if (!node[key]) node[key] = new Object();
            
        return TimelineStore.inject(value, trail, node[key]);
    },

    gc_delete: function(trail, prev_node = TimelineStore.root) {
        if (trail.length == 0) throw 'gc_delete called with empty trail';

        const current_key = trail.shift();
        const current_node = prev_node[current_key];
        const next_key = trail[0];
        
        // Error check
        if (!current_node || (next_key && Array.isArray(current_node)))
            throw 'Specified gc_delete trail does not exist.';

        // Recurse if not at end of trail
        if (next_key) TimelineStore.gc_delete(trail, current_node);

        // Delete if end of trail or garbage collection
        if (!next_key || Object.keys(current_node).length == 0)
            delete prev_node[current_key];
    },
};

const Menu = {
    // Helpers
    recursive_trail: function(current, trail = new Array()) {
        const prefix = current.getAttribute(HTML_DATA_KEY);
        if (!prefix) return trail;

        return Menu.recursive_trail(
            current.parentElement,
            [prefix].concat(trail)
        );
    },

    // Child adders
    add_child_menu: function(key, parent) {
        const is_root = !parent.classList.contains('menu-entry');
        const entry = document.createElement('div');

        entry.classList.add('menu-entry', 'closed');
        entry.setAttribute(HTML_DATA_KEY, key);
        entry.innerHTML = is_root ? 'Timelines' : key;
        entry.addEventListener('click', Menu.expand);
        
        parent.appendChild(entry);
    },

    add_child_timeline: function(key, parent) {
        const entry = document.createElement('div');

        entry.classList.add('menu-entry', 'unchecked');
        entry.setAttribute(HTML_DATA_KEY, key);
        entry.innerHTML = key;
        entry.addEventListener('click', Menu.enable_timeline);

        parent.appendChild(entry);
    },

    // Timeline toggle
    enable_timeline: async function(click_event) {
        // Prevent new event listeners from firing on the same click
        click_event.stopPropagation();

        // Change clicked menu entry
        const menu_entry = click_event.target;
        menu_entry.classList.replace('unchecked', 'checked');
        menu_entry.removeEventListener('click', Menu.enable_timeline);
        menu_entry.addEventListener('click', Menu.disable_timeline);

        // Fetch and add timeline object
        const menu_trail = Menu.recursive_trail(menu_entry);
        const timeline_data = await timeline_query(menu_trail);
        TimelineStore.inject(timeline_data, menu_trail);
    },

    disable_timeline: function(click_event) {
        // Prevent new event listeners from firing on the same click
        click_event.stopPropagation();

        // Change clicked menu entry
        const menu_entry = click_event.target;
        menu_entry.classList.replace('checked', 'unchecked');
        menu_entry.removeEventListener('click', Menu.disable_timeline);
        menu_entry.addEventListener('click', Menu.enable_timeline);

        // Delete timeline object
        const menu_trail = Menu.recursive_trail(menu_entry);
        TimelineStore.gc_delete(menu_trail);
    },

    // Entry toggle
    expand: async function(click_event) {
        // Prevent new event listeners from firing on the same click
        click_event.stopPropagation();

        // Change clicked menu entry
        const menu_entry = click_event.target;

        menu_entry.classList.replace('closed', 'open');
        menu_entry.removeEventListener('click', Menu.expand);
        menu_entry.addEventListener('click', Menu.collapse);

        // Query server
        let menu_trail = Menu.recursive_trail(menu_entry);
        const child_listing = await timeline_query(menu_trail);

        // Generate menu entries
        for (let listing_name in child_listing) {
            const type = child_listing[listing_name];
            switch(type) {
            case 'directory': Menu.add_child_menu    (listing_name, menu_entry); break;
            case 'timeline':  Menu.add_child_timeline(listing_name, menu_entry); break;
            default:          console.error(`Unknown listing type '${type}'`);
            }
        }
    },

    collapse: function(click_event) {
        // Prevent new event listeners from firing on the same click
        click_event.stopPropagation();

        // Change clicked menu entry
        const menu_entry = click_event.target;

        menu_entry.classList.replace('open', 'closed');
        menu_entry.removeEventListener('click', Menu.collapse);
        menu_entry.addEventListener('click', Menu.expand);

        // Delete child div elements
        Array.from(menu_entry.children)
            .filter(child => child.tagName.toLowerCase() == 'div')
            .forEach(div_child => menu_entry.removeChild(div_child));
    },
};

const Viewport = {
    // Attributes and setters
    timelines: undefined,
    canvas: undefined,
    
    bind_timelines: function(timelines) {
        if (Viewport.timelines) throw 'Viewport.timelines has already been bound';
        Viewport.timelines = timelines;
    },

    bind_canvas: function(canvas) {
        if (Viewport.canvas) throw 'Viewport.canvas has already been bound';
        Viewport.canvas = canvas;
    },

    // Viewport actions
    calibrate: function() {

    },

    render: function() {

    },
};

// Document ready function
(fn => {
    if (document.readyState != 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
})(() => {
    Menu.add_child_menu('', document.getElementById('content-menu'));
    Viewport.bind_canvas(document.getElementById('viewport'));
});
