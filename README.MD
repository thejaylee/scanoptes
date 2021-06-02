# Pricy
#### A basic tool to monitoring web pages for changes

Pricy is writen it can be run in one of three modes:
* Desktop
* Watcher
* Notifier

### Watcher
This mode will perform the watching and send out notifications

### Notifier
This will listen for notifications from a Watcher and invoke desktop alerts

### Desktop mode
This will run as both the watcher and notifier in one


## Usage
Invoke with `--help` for CLI arguments

## Watchers
Page changes are watched via a watch definition file (default: watches.json) with the following structure (keys ending with "?" denote optional):

```javascript
[{
    // The watch name,
    "name": "google inspector",

    // A description
    "description?": "the google homepage has changed",

    // URL of the page to watch,
    // https only and "https://" is required
    "url": "https://www.google.com",

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

            // if the Number() parsed text of the node evaluates to less than this value
            "lessThan?": 1000.00,
        }
    }],

    // same structure as all but any of these may pass for the watch to pass
    "any?": [{}]
}]
```
