# Scanoptes
#### A basic tool to watch web pages for changes

(A portmanteau of "scan" and "panoptes")

Scanoptes may be run with the following commands:
* Desktop
* Watcher
* Notifier
* Generate Key

### Watcher
`scanoptes.js watcher --help`

This mode will watch/scan web pages and send out notifications

### Notifier
`scanoptes.js notifier --help`

This will listen for notifications from a Watcher and invoke desktop alerts

### Desktop mode
`scanoptes.js desktop --help`

This will run as both the Watcher and Notifier in one

### Generate Key
`scanoptes.js genkey --help`

Generate an excryption key used for watcher/notifier mode

#### Note
When running in watcher/notifier mode, it is recommended to start the notifier first. This is because by default the
watcher will send out a startup notification to the notifier to ensure notifications are seen.

## Building
typescript is required
1. `npm install`
2. `npm run build`

## Usage
Invoke through `npm run` commands or as `node build/scanoptes.js` with `--help` for CLI arguments

## Watchers
Page changes are watched via a watch definition file (default: watches.json) with the following structure (keys ending with "?" denote optional):

```javascript
[{
    // The watch name,
    "name": "google inspector",

    // A description
    "description?": "the google homepage has changed",

    // URL of the page to watch,
    "url": "https://www.google.com",

    // http headers to send
    "headers": {},

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
