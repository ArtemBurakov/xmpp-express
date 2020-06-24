# xmpp-express

XMPP-Chat which works with Openfire server and uses strophe.js library.

# Usage:

## Requirements

You need working Openfire server

## Chat Setup:

- move the project files to a web accessible folder

- open `script.js` file and set the following variables:

    - `var server_host_name` your openfire server host name (see openfire administration)

    - `var SOCKET_SERVICE ws://[server_host_name]:7070/ws/` for web socket client connection

# Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.