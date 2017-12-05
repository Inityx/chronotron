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

const Menu = {
    recursive_path: function(current, suffix = '') {
        const prefix = current.getAttribute(HTML_DATA_KEY);
        if (!prefix) return suffix;

        return Menu.recursive_path(
            current.parentElement,
            suffix ? prefix + '/' + suffix : prefix
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
    },

    disable_timeline: function(click_event) {
        // Prevent new event listeners from firing on the same click
        click_event.stopPropagation();

        // Change clicked menu entry
        const menu_entry = click_event.target;
        menu_entry.classList.replace('checked', 'unchecked');
        menu_entry.removeEventListener('click', Menu.disable_timeline);
        menu_entry.addEventListener('click', Menu.enable_timeline);
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
        let menu_path = Menu.recursive_path(menu_entry);
        const child_listing = await timeline_query(menu_path);

        // Generate menu entries
        for (let listing_name in child_listing) {
            const type = child_listing[listing_name];
            switch(type) {
                case 'directory': Menu.add_child_menu    (listing_name, menu_entry); break;
                case 'timeline':  Menu.add_child_timeline(listing_name, menu_entry); break;
                default: throw `Unknown listing type '${type}'`;
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

// Document ready function
(fn => {
    if (document.readyState != 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
})(() => {
    const menu = document.getElementById('content-menu');
    Menu.add_child_menu('', menu);
});
