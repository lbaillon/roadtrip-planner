# change order of tracks in trips (drag and drop)

source : <https://trello.com/c/xmL8RCmw/45-change-order-of-tracks-in-trips-drag-and-drop>

## Purpose

As a user planning his next roadtrip, I wan to reorder my tracks in my trip so that I can easily see what's next and all the steps in my trip.

## Description

The user can reorder the tracks in a trip.
This is only possible for authenticated users.
This is only possible on a trip details since tracks only have a order from within a trip.

## Notes

I want to use a drag and drop feature to reorder tracks on the frontend side (similar to what gitlab does for an issue tasks).
I want the update to use a PUT that sends the whole list of tracks ids for this trip so that everything is updated in a single request. This is useful for a future use case with offline capabilities for the app as it will allows multiple changes before a single save.
The code must follow existing code structure and be consistent with the current design.
