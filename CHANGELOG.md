## v0.2.2
- upgrade to latest hull-node
- add `ship.outgoing.users` metric

## v0.2.1
- hotfix wrong call

## v0.2.0
- upgrade connector to hull-node@0.11.0
- implement new application layout

## v0.1.2
- normalize and validate domains before requests
- improve logging
- adds ELK logger transport

## v0.1.1
- don't filter out users during a batch operation

## v0.1.0
- add segments filtering
- add queueing a background, delayed job if the domain was to be added to Datanyze API
- allow batch to recompute users even if they were already fetched
- save error information to user profile and skip them

