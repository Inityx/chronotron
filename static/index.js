const QUERY_URL = '/query/';
const HTML_DATA_KEY = 'data-key';

function timeline_query(keys) {
    return new Promise(
        (resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('POST', QUERY_URL);
            
            xhr.onload = () => {
                if (xhr.status == 200) resolve(JSON.parse(xhr.responseText));
                else reject(xhr.responseText);
            }
            xhr.onerr = () => reject(xhr.statusTest);

            xhr.setRequestHeader("Content-type", "application/json");
            xhr.send(JSON.stringify({path: keys}));
        }
    );
}

function recursive_path(current, suffix = '') {
    const prefix = current.getAttribute(HTML_DATA_KEY);
    if (!prefix) return suffix;

    return recursive_path(
        current.parentElement,
        suffix ? prefix + '/' + suffix : prefix
    );
}

// Menu child adders
function add_menu_child_menu(key, parent) {
    const is_root = !parent.classList.contains('menu-entry');
    const entry = document.createElement('div');

    entry.classList.add('menu-entry', 'closed');
    entry.setAttribute(HTML_DATA_KEY, key);
    entry.innerHTML = is_root ? 'Timelines' : key;
    entry.addEventListener('click', expand_menu);
    
    parent.appendChild(entry);
}

function add_menu_child_timeline(key, parent) {
    const entry = document.createElement('div');

    entry.classList.add('menu-entry', 'unchecked');
    entry.setAttribute(HTML_DATA_KEY, key);
    entry.innerHTML = key;
    entry.addEventListener('click', enable_timeline);

    parent.appendChild(entry);
}

// Timeline toggle
async function enable_timeline(click_event) {
    // Prevent new event listeners from firing on the same click
    click_event.stopPropagation();

    // Change clicked menu entry
    const menu_entry = click_event.target;
    menu_entry.classList.replace('unchecked', 'checked');
    menu_entry.removeEventListener('click', enable_timeline);
    menu_entry.addEventListener('click', disable_timeline);
}

function disable_timeline(click_event) {
    // Prevent new event listeners from firing on the same click
    click_event.stopPropagation();

    // Change clicked menu entry
    const menu_entry = click_event.target;
    menu_entry.classList.replace('checked', 'unchecked');
    menu_entry.removeEventListener('click', disable_timeline);
    menu_entry.addEventListener('click', enable_timeline);
}

// Menu entry toggle
async function expand_menu(click_event) {
    // Prevent new event listeners from firing on the same click
    click_event.stopPropagation();

    // Change clicked menu entry
    const menu_entry = click_event.target;

    menu_entry.classList.replace('closed', 'open');
    menu_entry.removeEventListener('click', expand_menu);
    menu_entry.addEventListener('click', collapse_menu);

    // Query server
    let menu_path = recursive_path(menu_entry);
    const child_listing = await timeline_query(menu_path);

    // Generate menu entries
    for (let listing_name in child_listing) {
        const type = child_listing[listing_name];
        switch(type) {
            case 'directory': add_menu_child_menu    (listing_name, menu_entry); break;
            case 'timeline':  add_menu_child_timeline(listing_name, menu_entry); break;
            default: throw `Unknown listing type '${type}'`;
        }
    }
}

function collapse_menu(click_event) {
    // Prevent new event listeners from firing on the same click
    click_event.stopPropagation();

    // Change clicked menu entry
    const menu_entry = click_event.target;

    menu_entry.classList.replace('open', 'closed');
    menu_entry.removeEventListener('click', collapse_menu);
    menu_entry.addEventListener('click', expand_menu);

    // Delete child div elements
    Array.from(menu_entry.children)
        .filter(child => child.tagName.toLowerCase() == 'div')
        .forEach(div_child => menu_entry.removeChild(div_child));
}

// Document ready function
(fn => {
    if (document.readyState != 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
})(() => {
    const menu = document.getElementById('content-menu');
    add_menu_child_menu('', menu);
});
