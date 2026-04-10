# add possibility for user to add personalized markers on maps

source : <https://trello.com/c/H0hqhLnI/47-calculate-elevation-if-missing-in-gpx-file>

## Purpose

As a user planning my next roadtrip I want to get elevation added to my track automatically so that weather data is more accurate.

## Description

The user often adds GPX files without complete data. Elevation is generally missing from coordinates. The goal here is to edit the GPX file after it has been submitted by the user to fetch the correct elevation for the coordinates and add to the GPX.

## Notes

- The request to fetch missing elevation should happen after the GPX has been submitted and not block any other request. It has the lowest priority, the goal is to improve the data provided by the user. The weather and other features have an higher priority.
- The API to fetch the missing elevation should be decided among several choices provided when starting this task.
- The request to fetch the missing elevation should try as much as possible to group coordinates in a single request. If several requests must be made, all can be waited to get a single grouped result.
- If no elevation can reliably be found for a coordinate, it should not be added.
- Elevation must be fetched for a GPX only when the GPX is submitted, existing GPX should not be handled.
- Upon successfully adding elevation that was missing, these needs to happen:
  - a single edit request for the GPX should be enqueued with this new elevation data
  - the weather must be refetched for the coordinates with a new elevation after incorporating the new elevation in the request for weather
