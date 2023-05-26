# Power Hour frontend code
The main frontend code for this app can be found in the `src` folder.

The `pages` folder include the main views of the app, the Signup page, Login page, and the Home page. The Home page includes information cards with wait time and number of TAs, the queue table, and a chat view for collaboration. The components used on the home page are defined in `Home.tsx` and some are factored out and stored inside the `pages/objects` folder.

The `context` folder includes contexts and hooks that manages the state of the application, such as the state of the user and the chat state.

The `components` folder includes definitions for some of the very basic components used in the app.