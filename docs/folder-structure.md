# RP Navi Directory Structure

## Scope
This document describes the structure of the RP Navi directories. This layout is subject to change as the project moves along.

## Directories

### app
Contains all of the application code and configuration files that may be needed to run the server.

#### app/bin
Entry point code files when using ``npm`` to start the server.

#### app/controller
Server business logic (i.e., should **not** manage server state)

#### app/messages
Templates and definitions for text messages. Contained here as a means to centralize localization (if anyone wants to do another language)

#### app/model
Database handling code (i.e., manages server state)

#### app/public
Resources for client-side use. Used to help build the web pages

#### app/routes
Routers for web address handlers

#### app/tests
Code for running tests against the server for QA purposes

#### app/utils
Utility functions

#### app/views
HTML/HTML template files to build web pages.

### docs
Contains documentation regarding the server itself

### environment
Contains files meant to either set up the environment or templates for configuring the server environment.