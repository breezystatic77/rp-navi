	# RP Navi Style Guide

## Scope
This document describes the style guide used in RP Navi, in order to establish consistency across the codebase.

## In General
* Indentation will use tab stops

## JavaScript
* camelCase will be used for variable and function naming.
	* If the name contains an initialism or acronym the first letter should be capitalized and the rest should not.
* Do not end lines with semicolon
* Use arrow functions for anonymous functions
* Use string template literals (Example: ```Hello `${foobar}`!```)
* When describing models or data sets, use the following method to name the variables for clarity: `<data name>` + `<thing>`. Exapmles:
	* Model
		* Example: charaModel, postModel
		* Contains the Mongoose Model used to create new documents and conduct queries.
	* Input
		* Example: topicInput, accountInput
		* Contains the input data from a Controller.
	* Record
		* Example: accountRecord, forumRecord
		* Contains the data item from a database query. **Note** the name doesn't imply what type of database is being used.
	* Codes
		* Example: postCodes, topicCodes
		* Points to the object containing reason codes.