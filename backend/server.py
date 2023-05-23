from firebase import firebase
from flask import Flask, request, jsonify
from stream_chat import StreamChat
from flask_cors import CORS
from datetime import datetime
import pytz
import os
from dotenv import load_dotenv

load_dotenv()
app = Flask(__name__)
firebase = firebase.FirebaseApplication('https://power-hour-3d428-default-rtdb.firebaseio.com/', None)
chat_client = StreamChat(api_key=os.environ.get("STREAM_API_KEY"), api_secret=os.environ.get("STREAM_PRIVATE_API_KEY"))
# map stream chat access tokens to user id
TOKEN_USER_ID_MAP = {}
CORS(app, resources={r"/*": {"origins": "*"}})
app.config['CORS_HEADERS'] = 'Content-Type'
IN_QUEUE_STATUSES = ["Waiting", "In Progress"]


@app.route('/get-wait-time', methods=['GET'])
def getWaitTime():
    # TODO: complete wait time logic
    current_queue = firebase.get("/queue", None)
    question_types = {}
    for entry in current_queue:
        if current_queue[entry]["questionType"] not in question_types:
            question_types[current_queue[entry]["questionType"]] =
        else:

        parsed_datetime = datetime.strptime(current_queue[entry]["timestamp"].split(".")[0], "%Y-%m-%dT%H:%M:%S")
        current_queue[entry]["timestamp"] = parsed_datetime
        if request.args.get("type", "") == "":
            queue_data.append(current_queue[entry])
        elif request.args.get("type", "") == "" or \
                (request.args.get("type", "") == "queue" and current_queue[entry]["status"] in IN_QUEUE_STATUSES):
            queue_data.append(current_queue[entry])
    queue_data.sort(key=lambda i: i["timestamp"])
    for record in queue_data:
        record["timestamp"] = record["timestamp"].strftime("%H:%M:%S")
    question_avg_sums = 0
    return queue_data


@app.route('/start-help', methods=['POST'])
def startHelp():
    body = request.json
    if missing_fields(body, ["id"]):
        return "Missing required parameters", 400
    id = body["id"]
    current_queue = firebase.get("/queue", None)
    if current_queue:
        found_entry = None
        for entry in current_queue:
            if current_queue[entry]["id"] == id and current_queue[entry]["status"] == "Waiting":
                found_entry = entry
        current_queue[found_entry]["status"] = "In Progress"
        if found_entry is not None:
            firebase.patch(f"/queue", current_queue)
            return f"successfully started helping student {current_queue[found_entry]['name']}"
        else:
            return "user is not waiting in queue", 400
    else:
        return "queue is empty", 400


@app.route('/modify-request', methods=['POST'])
def modifyRequest():
    body = request.json
    if missing_fields(body, ["InPersonOnline", "id", "openToCollaboration", "question", "questionType"]):
        return "Missing required parameters", 400
    inPersonOnline = body["InPersonOnline"]
    id = body["id"]
    openToCollaboration = body["openToCollaboration"]
    question = body["question"]
    questionType = body["questionType"]
    current_queue = firebase.get("/queue", None)
    if current_queue:
        for entry in current_queue:
            if current_queue[entry]["id"] == id:
                current_queue[entry]["inPersonOnline"] = inPersonOnline
                current_queue[entry]["openToCollaboration"] = openToCollaboration
                current_queue[entry]["question"] = question
                current_queue[entry]["questionType"] = questionType
                firebase.patch(f"/queue", current_queue)
    else:
        return "queue is empty", 400


@app.route('/end-help', methods=['POST'])
def endHelp():
    body = request.json
    if missing_fields(body, ["id"]):
        return "Missing required parameters", 400
    id = body["id"]
    current_queue = firebase.get("/queue", None)
    if current_queue:
        found_entry = None
        for entry in current_queue:
            if current_queue[entry]["id"] == id and current_queue[entry]["status"] == "In Progress":
                found_entry = entry
        current_queue[found_entry]["status"] = "Helped"
        current_queue[found_entry]["endTime"] = datetime.now(pytz.timezone("America/Los_Angeles"))
        if found_entry is not None:
            firebase.patch(f"/queue", current_queue)
            return f"successfully finish helping student {current_queue[found_entry]['name']}"
        else:
            return "user is being helped in queue", 400
    else:
        return "queue is empty", 400


# takes in optional parameter type, if /get-queue-data?type=queue, then only waiting and in progress records are
# returned
@app.route('/get-queue-data', methods=['GET'])
def getQueueData():
    current_queue = firebase.get("/queue", None)
    queue_data = []
    for entry in current_queue:
        parsed_datetime = datetime.strptime(current_queue[entry]["timestamp"].split(".")[0], "%Y-%m-%dT%H:%M:%S")
        current_queue[entry]["timestamp"] = parsed_datetime
        if request.args.get("type", "") == "":
            queue_data.append(current_queue[entry])
        elif request.args.get("type", "") == "" or \
                (request.args.get("type", "") == "queue" and current_queue[entry]["status"] in IN_QUEUE_STATUSES):
            queue_data.append(current_queue[entry])
    queue_data.sort(key=lambda i: i["timestamp"])
    for record in queue_data:
        record["timestamp"] = record["timestamp"].strftime("%H:%M:%S")
    return queue_data


@app.route('/leave-queue', methods=['POST'])
def leaveQueue():
    body = request.json
    if missing_fields(body, ["id"]):
        return "Missing required parameters", 400
    id = body["id"]
    current_queue = firebase.get("/queue", None)
    if current_queue:
        found_entry = None
        for entry in current_queue:
            if current_queue[entry]["id"] == id and current_queue[entry]["status"] == "Waiting":
                found_entry = entry
        if found_entry is not None:
            firebase.delete("/queue", found_entry)
            return "successfully left queue"
        else:
            return "user does not have an active request in queue", 400
    else:
        return "queue is empty", 400


@app.route('/join-queue', methods=['POST'])
def joinQueue():
    body = request.json
    if missing_fields(body, ["inPersonOnline", "id", "name", "openToCollaboration", "question", "questionType"]):
        return "Missing required parameters", 400
    inPersonOnline = body["inPersonOnline"]
    id = body["id"]
    name = body["name"]
    openToCollaboration = body["openToCollaboration"]
    question = body["question"]
    questionType = body["questionType"]
    status = "Waiting"
    timestamp = datetime.now(pytz.timezone("America/Los_Angeles"))
    endTime = "NaN"
    current_queue = firebase.get("/queue", None)
    if current_queue:
        for entry in current_queue:
            if current_queue[entry]["id"] == id and current_queue[entry]["status"] == "Waiting":
                return "Username already in queue", 400
    new_entry = {"inPersonOnline": inPersonOnline, "id": id, "name": name, "openToCollaboration": openToCollaboration,
                 "question": question, "questionType": questionType, "status": status, "timestamp": timestamp,
                 "endTime": endTime}
    firebase.post("/queue", new_entry)
    return "Successfully joined queue"


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
    # check that the user leaves queue if they are in the queue when they log out
    current_queue = firebase.get("/queue", None)
    if current_queue:
        found_entry = None
        for entry in current_queue:
            if current_queue[entry]["id"] == id and current_queue[entry]["status"] == "Waiting":
                found_entry = entry
        if found_entry:
            firebase.delete("/queue", found_entry)
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


def missing_fields(d, fields):
    for field in fields:
        if field not in d or d[field] == "":
            return True
    return False


if __name__ == "__main__":
    app.run()
