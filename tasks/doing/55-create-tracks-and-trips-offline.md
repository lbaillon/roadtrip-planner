# create tracks and trips offline

source : <https://trello.com/c/aeoI4mHy/55-create-tracks-and-trips-offline>

## Purpose

As a user while on a roadtrip, I want to use the app offline and be sure it will get synchronized when connection comes back, so that I can manipulate my tracks and trips even without network during the trip.

## Description

The user should be able to manipulate tracks and trips without being connected and everything should synchronize in the correct order once the backend comes back online. Not all features are critical for offline, for now we are mostly interested in tracks and trips (signing up for example is certainly NOT something that should work offline). But adding new tracks and GPX files, creating or modifying trips, adding or removing tracks to a trip, etc. should be possible even offline. For the weather data, it is only accessible online but we still want it to be cached for the next 48 hours.

## Notes

We already used uuids in the backend so it should not be an issue to generate uuids on the frontend to make it work offline. We could migrate to uuid-V7 since generation time is not sensitive. Make sure to write down any concern you have, especially security-related, and possible remediation.
