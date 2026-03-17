# Global cleanup (multiple goals)

source : <https://trello.com/c/Yv1XfwmS/53-upgrade-libraries>

## Purpose

The goal here is to take a critical look at our codebase and assess our choices. Is there unnecessary complexity, can we reduce duplication, is it easy to comprehend and what can we do better?

## Description

There are several paths to explore here. The first is a general assessment of our whole codebase and what could be done better, with an emphasis on how to simplify things and make it easy to manage in the future. The second is to upgrade our libraries and make sure everything works correctly. I am especially motivated to upgrade Vite with the latest release of Vite 8.0. Third and finally, I want to improve our design system. For example, I want all colors and general settings to be defined in `:root` in index.css so that CSS variables are used in the rest of the code. There are more things to do than just that, be critical and explore the best ways to improve our design system.

## Notes

Command `npx npm-check-updates -u` may be used to upgrade our libraries.
