# Setup
Set up the `.env` files in both `frontend` and `backend` folder.

Use two different terminals to navigate into `frontend` and `backend` respectively.

In `frontend` folder, run `npm install` to install the packages, then run `npm run dev` to start the frontend application.

Use the url in the `frontend` terminal output to access the app interface. Make sure to clear local storage then refresh if it is already logged in, otherwise the server might not have all the informaton to hancle the requests.

In `backend` folder, first install [anaconda](https://www.anaconda.com/), then set up a virtual environment using
`conda env create -n power-hour python`, then `conda activate power-hour`, then `conda install pip`, and finally run `pip install -r requirements.txt` to install all necessary packages.

Run `python server.py` to start the server.

# Enable notifications
The notifications require setting up webhook from stream chat API, and to ensure that the server is listening for those webhooks, we need to do a couple of things:
1. Follow instructions here to [set up ngrok](https://getstream.io/chat/docs/react/debugging_with_ngrok/)
2. Run ngrok with `ngrok http 8001`, this would create a public url that can redirect anything going to that url to our local server running at port 8001.
3. In the ngrok view, copy the link next to Forwarding (note, by default the session lengths are 1 hour, for longer sessions it would be beneficial to set up a ngrok account).
4. Log into the streamchat dashboard (credential shared in Discord), under Chat Messaging -> Overview, there is a Webhooks section where you can enter a webhook URL. Replace it with `<link copied>/webhook`. This would enable stream chat API to forward any of the events to our server's `/webhook` endpoint, and trigger a notification for other connected users.

# Testing the app
First run backend `python server.py`, then run frontend `npm run dev`. If you want to test multi-user scenario, you can open two browser windows at the same frontend localhost url and log in as different users, just make sure to clear the local storage before you do so. Note that if ngrok is not setup the app should still work fine, just won't get live updates on the interface unless we refresh or React decides to rerender.

Valid usernames include (passwords are all abc):
wenq, andrea, amanda

Username & password for bot account:
bot