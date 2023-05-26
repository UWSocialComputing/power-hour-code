# Power Hour backend code
All backend code for the app is included in `server.py`. See the `README.md` in the repository for more detailed setup instructions.

Some of the major endpoints includes:
- `/signup`: allows users to sign up for a new account, will check to ensure the provided username does not already exist in the database.
- `/login`: logs the given user in and returns the stream chat session token and the user information.
- `/logout`: logs the given user out and remove their entry in the queue if applicable.
- `/join-queue`: puts the given user into the queue with the provided information.
- `/modify-request`: takes the modified information and updates the user request in the queue.
- `/leave-queue`: deletes the given user's request from the queue.
- `/get-queue-data`: returns the most up-to-date queue data. If passed in query parameter `type=queue`, then it will only return requests that are either "Waiting" or "In progress".
- `/get-wait-time`: returns the predicted wait time for the given user based on queue information and historical data.
- `/get-notifications`: returns all notifications for a given user.
- `/delete-notification`: removes a given notification from the database.
- `/webhook`: when received webhook event notifications from the Stream Chat API, generate corresponding notifications for when a user is being added to a new chat or an existing chat. Also notifies the client on the new notification they have.
- `/sendBotMessage`: an endpoint that sends an automated OH bot message to newly created channels.

The endpoints below are not used by the frontend, but can be useful later if we implement a TA view:
- `/start-help`: an endpoint used by TAs to indicate they are started helping a particular student.
- `/end-help`: an endpoint used by TAs to indicate they have finished helping a particular student.
