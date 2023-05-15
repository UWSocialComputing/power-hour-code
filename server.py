from firebase import firebase
from flask import Flask, render_template, request
import json
import time


app = Flask(__name__)
firebase = firebase.FirebaseApplication('https://power-hour-3d428-default-rtdb.firebaseio.com/', None)


# @app.route('/logout', methods=['GET', 'POST'])
# def logout():
#   if request.method == 'POST' and len(dict(request.form)) > 0:
#     result = firebase.get('/student', None)
#     for i in result:
#         if result[i]["username"] == request.form["username"] and result[i]["password"] == request.form["password"]:
#             return "Login successful!"
#     return "Login failed! Are you sure your password and username are correct?"
#   else:
#     return "Sorry, there was an error."


@app.route('/login', methods=['GET', 'POST'])
def login():
  if request.method == 'POST' and len(dict(request.form)) > 0:
    result = firebase.get('/student', None)
    for i in result:
        if result[i]["username"] == request.form["username"] and result[i]["password"] == request.form["password"]:
            return "Login successful!"
    return "Login failed! Are you sure your password and username are correct?"
  else:
    return "Sorry, there was an error."

@app.route('/signup', methods=['GET', 'POST'])
def signup():
  if request.method == 'POST' and len(dict(request.form)) > 0:
    userdata = dict(request.form)
    username = userdata["username"][0]
    password = userdata["password"][0]
    name = userdata["name"][0]
    new_data = {"name": name, "password": password, "username": username}
    firebase.post("/student", new_data)
    return "New student added!"
  else:
    return "Sorry, there was an error. Try another username!"

if __name__ == "__main__":
  app.run()