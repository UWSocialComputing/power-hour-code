# Setup
Set up the `.env` files in both `frontend` and `backend` folder.

## `.env` for testing locally
`frontend/.env`
```
VITE_SERVER_URL=http://localhost:8000
VITE_WEBSOCKET_SERVER_URL=ws://localhost:8000
VITE_STREAM_API_KEY=<Check stream api dashboard>
```
`backend/.env`
```
CLIENT_URL=http://127.0.0.1:5173/
STREAM_API_KEY=<Check stream api dashboard>
STREAM_PRIVATE_API_KEY=<Check stream api dashboard>
```

## `.env` for testing with deployed Azure server
`frontend/.env`
```
VITE_SERVER_URL=https://power-hour.azurewebsites.net
VITE_WEBSOCKET_SERVER_URL=wss://power-hour.azurewebsites.net
VITE_STREAM_API_KEY=<Check stream api dashboard>
```
`backend/.env`
```
CLIENT_URL=http://127.0.0.1:5173/
STREAM_API_KEY=<Check stream api dashboard>
STREAM_PRIVATE_API_KEY=<Check stream api dashboard>
```
## Install packages
Use two different terminals to navigate into `frontend` and `backend` respectively.

In `frontend` folder, run `npm install` to install the packages, then run `npm run dev` to start the frontend application.

Use the url in the `frontend` terminal output to access the app interface. Make sure to clear local storage then refresh if it is already logged in, otherwise the server might not have all the informaton to handle the requests.

In `backend` folder, first install [anaconda](https://www.anaconda.com/), then set up a virtual environment using
`conda env create -n power-hour python`, then `conda activate power-hour`, then `conda install pip`, and finally run `pip install -r requirements.txt` to install all necessary packages.

# Enable notifications
## Testing local version of the server
The notifications require setting up webhook from stream chat API, and to ensure that the server is listening for those webhooks, we need to do a couple of things:
1. Follow instructions here to [set up ngrok](https://getstream.io/chat/docs/react/debugging_with_ngrok/)
2. Run ngrok with `ngrok http 8001`, this would create a public url live on the internet that can redirect anything going to that url to our local server running at port 8001.
3. In the ngrok view, copy the link next to Forwarding (note, by default the session lengths are 1 hour, for longer sessions it would be beneficial to set up a ngrok account).
4. Log into the streamchat dashboard (credential shared in Discord), under Chat Messaging -> Overview, there is a Webhooks section where you can enter a webhook URL. Replace it with `<link copied>/webhook`. This would enable stream chat API to forward any of the events to our server's `/webhook` endpoint, and trigger a notification for other connected users.

## Testing deployed server
A version of the server has been deployed in Azure, so the webhook URL to use is https://power-hour.azurewebsites.net. Note that the Azure copy of the server require manual upload from a different repository.

# Testing the app
## Testing backend locally
First run backend `gunicorn --worker-class geventwebsocket.gunicorn.workers.GeventWebSocketWorker
-w 1 server:app` which starts a gevent server that can accept websocket requests at port 8000, then run frontend `npm run dev`. If you want to test multi-user scenario, you can open two browser windows at the same frontend localhost url and log in as different users, just make sure to clear the local storage before you do so. Note that if ngrok is not setup the app should still work fine, just won't get live updates on the interface unless we refresh or React decides to rerender.

## Testing the backend with Azure server
Just make sure to update the `.env` with the url in the frontend accordingly. This should handle multi-user scenarios on different computers as well!

Valid usernames include (passwords are all abc):
wenq, andrea, amanda

Username & password for bot account:
bot
