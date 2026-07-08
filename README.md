# Pokemon Auto Chess

#### Author: Petter Andersson

Based on the game Dota Auto Chess

Frontend in React/Redux environment

Backend in NodeJS

## Hosting (petterbuilds.com)

- **Frontend:** `https://pkmn.petterbuilds.com` via the web-platform static host.
  Deploy with `cd app && npm run deploy`.
- **Backend:** scale-to-zero Fargate at `https://pkmn-api.petterbuilds.com` — wakes on
  page load, sleeps (~$0) when idle. Deploy with `cd infra && ./deploy.sh`.

First-time order: deploy the backend → copy the `WakerUrl` output into
`app/.env.production` (`VITE_WAKER_URL`) → deploy the frontend.

## Unit sheet

Sheet of unit stats and information can be found [here](https://docs.google.com/spreadsheets/d/1ZIxd55wfgdav-15bVCv33NrRvHGXY9IXot63FsUZrgg/)

