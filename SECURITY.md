# Security Policy

## Supported Versions

Any version created after September 20th is supported

## Reporting a Vulnerability

Kindly open an issue if a critical vulnerability is found


## Architecture and threat model

Games Hub is a static-hosted browser application. It intentionally does not rely on a custom application server for the launcher, games, or chat. The chat uses an external MQTT broker for message transport and browser storage/GitHub snapshots for persistence and recovery.

The chat is designed around a small, trusted community rather than as a production-grade public messaging service. Client-side usernames, moderation state, and application state are therefore not equivalent to cryptographically authenticated accounts. In particular, direct messages are not end-to-end encrypted by the current transport model.

The client now validates message schemas, bounds payloads, avoids treating remote usernames as executable HTML, and restricts browser-to-parent messaging to the expected origin. These controls improve safety and reliability but do not turn the static client into a server-enforced security boundary.
