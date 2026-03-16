# add possibility for user to add personalized markers on maps

source : https://trello.com/c/eOadG52J/12-add-possibility-for-user-to-add-personalized-markers-on-maps

## Purpose

As a user planning my next roadtrip I want to add routepoints on my track by taping on the map so that I can know where to stop during my trip.

## Description

The user should be able to activate the edit mode for any track. 
It should not be on the same place as the existing toggles on map. 
It should not be possible for a user to edit if not logged in.
In edit mode, the user should be able to click on the map after loading a track. 
It should display a popup allowing the user to enter name and description (optionnal) and submit.
The GPX file should then be edited to include the new routepoint.
The user should be able to edit and delete existing routepoints, the GPX file will be then saved accordingly.
The user should be able to download the edited GPX file.

## Notes

There already is an API endpoint to add waypoints/routepoints.
This feature must make use of it. The endpoint can be editied if needed.
The code must follow existing code structure and be consistent with the current design.