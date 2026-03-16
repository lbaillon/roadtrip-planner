# migrate application to PWA

source : <https://trello.com/c/mfqJTEr0/37-pass-to-pwa>

## Purpose

As a user while on a roadtrip, I want to use the app offline and be sure it will get synchronized when connection comes back, so that I can check the trip info even without network during the trip.

## Description

To make it easier for users to use it on phone during their trips and make sure they can use the app even without network, it will migrate to a PWA.
The scenario is that users check the track in the morning to see what the weather is like on the road so we load all the info while there is network, then during the trip, they sometimes get to area without any connection but they must still be able to check the app and even make some edits. When they get network back, their changes get synchronized with the server.

## Notes

This will be an opportunity for a big refactoring of what we already have. Especially the waypoints update, I think it would be better to edit the GPX locally on the frontend and to send the whole GPX in a PUT update when the network is back.
