from firebase import firebase
from flask import Flask, request, jsonify
from flask_socketio import SocketIO, emit
from stream_chat import StreamChat
from flask_cors import CORS
from datetime import datetime
import pytz
import os
from dotenv import load_dotenv

load_dotenv()
app = Flask(__name__)
app.config["SECRET_KEY"] = "secret"
socketio = SocketIO(app, cors_allowed_origins="*")
firebase = firebase.FirebaseApplication('https://power-hour-3d428-default-rtdb.firebaseio.com/', None)
chat_client = StreamChat(api_key=os.environ.get("STREAM_API_KEY"), api_secret=os.environ.get("STREAM_PRIVATE_API_KEY"))
# map stream chat access tokens to user id
TOKEN_USER_ID_MAP = {}
# map user id to web socket connection
CONNECTED_USERS = {}

CORS(app, resources={r"/*": {"origins": "*"}})
app.config['CORS_HEADERS'] = 'Content-Type'
IN_QUEUE_STATUSES = ["Waiting", "In Progress"]
DEFAULT_QUESTION_TIME = 10 # estimated in minutes
NUM_OF_TAs = 1 # number of TAs in the current Office Hours session

@socketio.on('subscribe-notification')
def notificationHandler(json):
    """Adds the incoming connection and its user id to the map

    Args:
        json: in the format of {"id": userId}
    """
    print(f'{request.sid} connected')
    CONNECTED_USERS[json["id"]] = request.sid
    print(CONNECTED_USERS)

@socketio.on('unsubscribe-notification')
def notificationHandler(json):
    """Removes the incoming connection and its user id from the map

    Args:
        json: in the format of {"id": userId}
    """
    print(f'{request.sid} disconnected')
    CONNECTED_USERS.pop(json["id"])
    print(CONNECTED_USERS)


@socketio.on('disconnect')
def disconnect_handler():
    """Removes the disconnected user from the map. The disconnected id is stored
    in the request
    """
    print(f'{request.sid} disconnected')
    disconnected_user_id = None
    for user_id in CONNECTED_USERS:
        if CONNECTED_USERS[user_id] == request.sid:
            disconnected_user_id = user_id
    if disconnected_user_id:
        CONNECTED_USERS.pop(disconnected_user_id)
        print(CONNECTED_USERS)


@app.route('/webhook', methods=['POST'])
def webhookHandler():
    """Handles webhook push from the stream chat API
    request: one of the webhook objects sent via stream chat API upon triggering some event
    for now it only handles new channel created notification message. It will take the webhook
    object and insert a new entry into the notification table, then notify all affected members
    about the new channel (excluding the user who created the channel)
    Returns:
        string: success message
    """
    body = request.json
    # handle create channel notifications
    if body["type"] == "channel.created":
        # extract all relevant members other than the one who initiates room creation
        affected_members = get_affected_users(body)
        initiator = body["user"]["id"]
        for member in affected_members:
             # add entry to notification database
            new_notif = {}
            new_notif["initiator"] = initiator
            new_notif["notifier"] = member
            new_notif["type"] = "channel.created"
            new_notif["channelId"] = body["channel_id"]
            new_notif["channelName"] = body["channel"]["name"]
            firebase.post("/notification", new_notif)
            # ping those users about the new channel
            if member in CONNECTED_USERS:
                socketio.emit('notification', get_notif_for_id(member), room=CONNECTED_USERS[member])
    elif body["type"] == "member.added":
        # figure out the channel id
        channel_id = body["channel_id"]
        initiator = find_owner(body["members"])
        member = body["member"]["user_id"]
        new_notif = {}
        new_notif["initiator"] = initiator
        new_notif["notifier"] = member
        new_notif["type"] = "member.added"
        new_notif["channelId"] = channel_id
        new_notif["channelName"] = ""
        firebase.post("/notification", new_notif)
        if member in CONNECTED_USERS:
            socketio.emit('notification', get_notif_for_id(member), room=CONNECTED_USERS[member])
    return "success"


def find_owner(members):
    for member in members:
        if member["role"] == "owner":
            return member["user_id"]
    return None

@app.route('/get-notifications', methods=['POST'])
def getNotifications():
    """request: {"id": userId}
    Returns:
        array of notifications relevant to given user.
        Each notification has the following structure:
        see get_notif_for_id for structure
    """
    body = request.json
    if missing_fields(body, ["id"]):
        return "Missing required parameters", 400
    id = body["id"]
    return get_notif_for_id(id)

@app.route('/delete-notification', methods=['POST'])
def deleteNotification():
    """request: {"user-id": userId, "notif-id": id of notif to be deleted}
    Removes the given notification for the given user, then sends back updated
    notification info
    Returns:
        updated array of notifications relevant to given user.
        see get_notif_for_id for structure
    """
    body = request.json
    if missing_fields(body, ["notif-id", "user-id"]):
        return "Missing required parameters", 400
    notif_id = body["notif-id"]
    user_id = body["user-id"]
    firebase.delete("/notification", notif_id)
    return get_notif_for_id(user_id)

def get_notif_for_id(id):
    """takes in user id and retrieves notifications relevant to given user
    Relevant notification means the given user id is the notifier for the
    notification

    Args:
        id: user id string

    Returns:
        updated array of notifications relevant to given user.
        Each notification has the following structure:
        {
            "id": the notification entry hash in firebase
            "initiator": initiator id
            "notifier": notifier id
            "type": notification type, channel.created for now
            "channelName": name of the new channel
            "channelId": id of the new channel
        }
    """
    all_notifications = firebase.get("/notification", None)
    if all_notifications:
        user_notifications = []
        for entry in all_notifications:
            if all_notifications[entry]["notifier"] == id:
                all_notifications[entry]["id"] = entry
                user_notifications.append(all_notifications[entry])
        return user_notifications
    else:
        return []

def get_affected_users(channel_created_obj):
    """helper function that takes the channel created webhook object and
    extracts all affected users (excluding the one who created the channel)

    Args:
        channel_created_obj: channel created webhook object

    Returns:
        a list of affected users (excluding the channel creator and bot account)
    """
    members = [member["user_id"] for member in channel_created_obj["channel"]["members"]]
    members.remove(channel_created_obj["user"]["id"])
    members.remove("bot")
    return members

@app.route('/get-wait-time', methods=['GET'])
def getWaitTime():
    id = request.args.get("id")
    if not id:
        return "Missing required parameters", 400
    current_queue = firebase.get("/queue", None)
    sorted_queue_data = sortQueueByTime(current_queue)
    question_types_total_time = {}
    question_types_counts = {}
    total_time = 0
    total_counts = 0
    # get historic time to answer each different type of question so far
    for entry in current_queue:
        if current_queue[entry]["status"] == "Helped":
            start_time = current_queue[entry]["startTime"].total_seconds()
            end_time = current_queue[entry]["endTime"].total_seconds()
            difference = (end_time - start_time) / 60
            total_counts += 1
            total_time += difference
            if current_queue[entry]["questionType"] not in question_types_total_time:
                question_types_total_time[current_queue[entry]["questionType"]] = difference
                question_types_counts[current_queue[entry]["questionType"]] = 1
            else:
                question_types_total_time[current_queue[entry]["questionType"]] += difference
                question_types_counts[current_queue[entry]["questionType"]] += 1
    question_types_avgs = {}
    for q_type in question_types_total_time:
        avg = round(question_types_total_time[q_type] / question_types_counts[q_type])
        question_types_avgs[q_type] = avg
    # get wait times based on historic wait time averages per question type multiplied by that
    # question type that is waiting in the queue
    if total_counts > 0:
        total_avg_per_question = round(total_time / total_counts)
    # get all the in progress students and find the min time estimate based on
    # time elapsed that they have been helped to use that for accurate ETA
    in_progress_students = []
    for entry in sorted_queue_data:
        if entry["status"] == "Waiting":
            break # at this case, we have passed all the In Progress students
        elif entry["status"] == "In Progress":
            in_progress_students.append(entry)
    min_eta = 9999999
    for student in in_progress_students:
        eta = 0
        if student["questionType"] in question_types_avgs:
            eta = question_types_avgs[student["questionType"]]
        elif total_counts > 0:
            eta = total_avg_per_question
        else:
            eta = DEFAULT_QUESTION_TIME
        eta -= (datetime.now(pytz.timezone("America/Los_Angeles")).total_seconds() - student["startTime"].total_seconds()) / 60
        if eta < 0:
            eta = 0
        min_eta = min(min_eta, eta)
    total_eta = min_eta
    for i in range(len(sorted_queue_data)):
        if sorted_queue_data[i]["id"] == id and sorted_queue_data[i]["status"] == "In Progress":
            return 0 # user is currently being helped, don't need to wait
        elif sorted_queue_data[i]["id"] == id and sorted_queue_data[i]["status"] == "Waiting":
            # this is the user's place in the queue, we can return our current accumulated eta at this point
            return str(round(total_eta / NUM_OF_TAs))
        else:
            # in this case, we haven't reached user in the queue yet, meaning this is 
            # a student ahead of the user in the queue who is also waiting and not 
            # being helped by a TA yet, so we add their estimated wait time to the total_eta
            if sorted_queue_data[i]["questionType"] in question_types_avgs:
                total_eta += question_types_avgs[sorted_queue_data[i]["questionType"]]
            elif total_counts > 0:
                # add another layer of specifity by having the average of all wait
                # times so far be returned if there aren't any relevant question
                # type averages yet
                total_eta += total_avg_per_question
            else:
                total_eta += DEFAULT_QUESTION_TIME
    return str(round(total_eta / NUM_OF_TAs)) # shouldn't reach this statement, otherwise user is not in queue??
    


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
        current_queue[found_entry]["startTime"] = datetime.now(pytz.timezone("America/Los_Angeles"))
        current_queue[found_entry]["status"] = "In Progress"
        if found_entry is not None:
            firebase.patch(f"/queue", current_queue)
            socketio.emit("update-queue", getQueueData())
            return f"successfully started helping student {current_queue[found_entry]['name']}"
        else:
            return "user is not waiting in queue", 400
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
            socketio.emit("update-queue", getQueueData())
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
    queue_data = sortQueueByTime(current_queue)
    for record in queue_data:
        record["timestamp"] = record["timestamp"].strftime("%H:%M:%S")
    return queue_data


def sortQueueByTime(current_queue):
    queue_data = []
    if current_queue:
        for entry in current_queue:
            parsed_datetime = datetime.strptime(current_queue[entry]["timestamp"].split(".")[0], "%Y-%m-%dT%H:%M:%S")
            current_queue[entry]["timestamp"] = parsed_datetime
            if request.args.get("type", "") == "" or \
                    (request.args.get("type", "") == "queue" and current_queue[entry]["status"] in IN_QUEUE_STATUSES):
                queue_data.append(current_queue[entry])
        queue_data.sort(key=lambda i: i["timestamp"])
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
            socketio.emit("update-queue", getQueueData())
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
    startTime = "NaN"
    current_queue = firebase.get("/queue", None)
    if current_queue:
        for entry in current_queue:
            if current_queue[entry]["id"] == id and current_queue[entry]["status"] == "Waiting":
                return "Username already in queue", 400
    new_entry = {"inPersonOnline": inPersonOnline, "id": id, "name": name, "openToCollaboration": openToCollaboration,
                 "question": question, "questionType": questionType, "status": status, "timestamp": timestamp,
                 "endTime": endTime, "startTime": startTime}
    firebase.post("/queue", new_entry)
    socketio.emit("update-queue", getQueueData())
    return "Successfully joined queue"

@app.route('/modify-request', methods=['POST'])
def modifyRequest():
    body = request.json
    if missing_fields(body, ["inPersonOnline", "id", "openToCollaboration", "question", "questionType"]):
        return "Missing required parameters", 400
    inPersonOnline = body["inPersonOnline"]
    id = body["id"]
    openToCollaboration = body["openToCollaboration"]
    question = body["question"]
    questionType = body["questionType"]
    current_queue = firebase.get("/queue", None)
    if current_queue:
        found_entry = None
        for entry in current_queue:
            if current_queue[entry]["id"] == id and current_queue[entry]["status"] == "Waiting":
                found_entry = entry
        if found_entry:
            current_queue[found_entry]["inPersonOnline"] = inPersonOnline
            current_queue[found_entry]["openToCollaboration"] = openToCollaboration
            current_queue[found_entry]["question"] = question
            current_queue[found_entry]["questionType"] = questionType
            firebase.patch(f"/queue", current_queue)
            socketio.emit("update-queue", getQueueData())
            return "Successfully edited queue entry"
        else:
            return "No active request for given user", 400
    else:
        return "Queue is empty", 400


@app.route('/logout', methods=['POST'])
def logout():
    body = request.json
    if missing_fields(body, ["token"]):
        return "Missing required parameters", 400
    token = body["token"]
    id = TOKEN_USER_ID_MAP.get(token)
    if token not in TOKEN_USER_ID_MAP:
        return "User does not exist for given token", 400
    current_time = datetime.now(pytz.timezone("America/Los_Angeles"))
    chat_client.revoke_user_token(TOKEN_USER_ID_MAP[token], current_time.isoformat())
    # check that the user leaves queue if they are in the queue when they log out
    current_queue = firebase.get("/queue", None)
    found_entry = None
    if current_queue:
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
    socketio.run(app)
