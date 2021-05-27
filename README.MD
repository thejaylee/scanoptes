# Pricy
#### A basic tool to monitoring web pages for changes

There are two tools in this package:
1. pricy-watcher - for monitoring changes on pages
2. pricy-notifier - a desktop tool for notifications

Pricy is designed so that the watcher can be rnu as a daemon out of the way on some other computer, and will send events to the notifier which will alert the user.

Page changes are watched via a watch definition file (default: watches.json) will the following structure (keys ending with "?" denote optional):

```javascript
[{
    // The watch name,
    "name": "google inspector",

    // URL of the page to watch,
    // https only and "https://" is required
    "url": "https://google.com",

    // cookie header to send
    "cookie": "",

    // Interval for inspections in seconds
    "interval": 600,

    // all of the items in this array must pass for the watch to be pass
    "all?": [{

        // Cheerio.js selector to check
        "selector": ".sample-class #sample-id",

        // parse the element to either text (default) or html
        // note: the HTML isn't parsed exactly as-is. it is first loaded via Cheerio and then extracted via `html()`
        "context?": "TEXT | HTML ",

        // a name of the item to watch
        "name?": "sample",

        // various conditions to test for
        "condition": {

            // monitor for any change in either the html or text
            // when set to true this will ignore all other conditions
            "anyChange?": false,

            // case sensitive comparisons. this only applies to `includes` when context is TEXT
            "caseSensitive?": false,

            // must include the text
            "includes?": "Price",

            // a string Regex to match against, along with Regex flags
            "match?": [ "regex", "flags" ],

            // track and notify if the text of this node changes
            "shouldTrack?": false,

            // if the Number() parsed text of the node evaluates to less than this value
            "lessThan?": 1000.00,
        }
    }],

    // same structure as all but any of these may pass for the watch to pass
    "any?": [{}]
}]
```
