from firebase import firebase
from flask import Flask, request, jsonify
from stream_chat import StreamChat
from flask_cors import CORS
from datetime import datetime
import pytz
import os

app = Flask(__name__)
firebase = firebase.FirebaseApplication('https://power-hour-3d428-default-rtdb.firebaseio.com/', None)
chat_client = StreamChat(api_key=os.environ.get("STREAM_API_KEY"), api_secret=os.environ.get("STREAM_PRIVATE_API_KEY"))
# map stream chat access tokens to user id
TOKEN_USER_ID_MAP = {}
CORS(app, resources={r"/*": {"origins": "*"}})
app.config['CORS_HEADERS'] = 'Content-Type'


@app.route('/sendBotMessage', methods=['POST'])
def sendBotMessage():
  body = request.json
  if missing_fields(body, ["channelId"]):
    return "Missing required parameters", 400
  channel = chat_client.channel("messaging", body["channelId"])
  channel.send_message({
    "text": "Hi there! Welcome to a new collaboration session! As a reminder, here is the collaboration policy for CSE 311: ... Happy collaborating!",
  }, "bot")
  return "Message sent"

@app.route('/logout', methods=['POST'])
def logout():
  body = request.json
  if missing_fields(body, ["token"]):
    return "Missing required parameters", 400
  token = body["token"]
  if token not in TOKEN_USER_ID_MAP:
    return "User does not exist for given token", 400
  current_time = datetime.now(pytz.timezone("America/Los_Angeles"))
  chat_client.revoke_user_token(TOKEN_USER_ID_MAP[token], current_time.isoformat())
  TOKEN_USER_ID_MAP.pop(token)
  return "User has been logged out"

@app.route('/login', methods=['POST'])
def login():
  body = request.json
  if missing_fields(body, ["id", "password"]):
    return "Missing required parameters", 400
  username = body["id"]
  password = body["password"]
  result = firebase.get('/student', None)
  has_user = False
  for i in result:
    if result[i]["id"] == username and result[i]["password"] == password:
        has_user = True
  user_match = chat_client.query_users({"id": {"$eq": username}})["users"]
  if len(user_match) == 0:
    has_user = False
  chat_user = user_match[0]
  if not has_user:
    return "Login failed! Are you sure your password and username are correct?", 401
  stream_chat_token = chat_client.create_token(username)
  TOKEN_USER_ID_MAP[stream_chat_token] = username
  response = jsonify({
    "token": stream_chat_token,
    "user": {
      "id": chat_user["id"],
      "name": chat_user["name"],
      "password": chat_user["password"]
    }
  })
  return response

@app.route('/signup', methods=['POST'])
def signup():
  body = request.json
  if missing_fields(body, ["id", "password", "name"]):
    return "Missing required parameters", 400
  username = body["id"]
  password = body["password"]
  name = body["name"]
  # Check for duplicate usernames in firebase
  existing_users = firebase.get("/student", None)
  if existing_users:
    for user in existing_users:
      if existing_users[user]["id"] == username:
        return "Username already exists", 400
  new_data = {"name": name, "password": password, "id": username}
  firebase.post("/student", new_data)
  # Check for duplicate usernames in streamchat
  user_match = chat_client.query_users({"id": {"$eq": username}})["users"]
  if len(user_match) > 0:
    return "Username already exists", 400
  # Add user to streamchat
  chat_client.upsert_users([{"id": username, "password": password, "name": name}])
  return "New student added!"

def missing_fields(d, fields):
  for field in fields:
    if field not in d or d[field] == "":
      return True
  return False

if __name__ == "__main__":
  app.run()