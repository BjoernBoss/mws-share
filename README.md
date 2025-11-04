# \[MAWS\] Application to Share Files
![JavaScript](https://img.shields.io/badge/language-JavaScript-blue?style=flat-square)
[![License](https://img.shields.io/badge/license-BSD--3--Clause-brightgreen?style=flat-square)](LICENSE.txt)

This application is designed to be used with the [`MAWS-Host`](https://github.com/BjoernBoss/maws-host.git).

It provides file sharing of the content of a directory in the `storage path` of the server. For this, it provides enumerating directory contents, and downloading it.

## Using the Application
To use this application, setup the `maws-host`. Then, simply clone the current application into the apps directory:

	$ git clone https://github.com/BjoernBoss/maws-app-share.git apps/maws-share

Afterwards, transpile the entire server application, and set it up in the `setup.js Run` method as:

```JavaScript
const app = await import("./maws-share/app.js");
server.registerPath('/share', new app.Application('path/to/shared/data'));
```
