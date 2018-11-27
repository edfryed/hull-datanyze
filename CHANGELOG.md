## v0.3.1
* prevent flatmap-stream@0.1.1 from installing, removing `nodemon` which is unused

## v0.3.0

* upgrade hull to 0.13.10 + add support for smart-notifier
* add `handle_accounts` setting to allow writing at Account level, and fetching datanyze data from account. Will help in saving credits.
* add service_api.call metrics
* add status endpoint

## v0.2.6

* ignore `datanyze/mobile` object

## v0.2.5

* documentation
* improved admin panel

## v0.2.4

* load queue adapter properly

## v0.2.3

* upgrade to hull-node@0.12.0 (including firehose)
* more integration tests and test tooling upgrade

## v0.2.2

* upgrade to latest hull-node
* add `ship.outgoing.users` metric

## v0.2.1

* hotfix wrong call

## v0.2.0

* upgrade connector to hull-node@0.11.0
* implement new application layout

## v0.1.2

* normalize and validate domains before requests
* improve logging
* adds ELK logger transport

## v0.1.1

* don't filter out users during a batch operation

## v0.1.0

* add segments filtering
* add queueing a background, delayed job if the domain was to be added to Datanyze API
* allow batch to recompute users even if they were already fetched
* save error information to user profile and skip them
