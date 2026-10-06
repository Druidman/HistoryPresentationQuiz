import json

from datetime import datetime, timedelta
def format_data(to_format):
  formatedData = []
  # format it
  for entry in to_format:
    formatedData.append(entry['jsonb_build_object'])

  return formatedData
dataFileName = 'data_handfiltered.json'


data = None
with open(dataFileName, 'r') as file:
  data = json.load(file)

# data is ready so format it
data = format_data(data)

# print(data)

# SET CONSTANTS
QUESTIONS_COUNT = 10
QUESTIONS_MAX_TIME_MAP = [
  15,
  15,
  15,
  15,
  15,
  20,
  30,
  20,
  50,
  20
]
user_and_score = {}
user_data = {}
mapped_users = {}
for user_entry in data:
  result = {}

  result['nickname'] = user_entry['nickname']

  
  # get user test score
  map = []
  score = 0
  answered = 0
  for answer_entry in user_entry['answers']:
    if not answer_entry:
      map.append(0)
      continue

    if answer_entry['is_correct']:
      map.append(1)
      score += 1
    else:
      map.append(0)
    answered += 1
  
  result['score'] = {'answered': answered,'got': score, 'of': QUESTIONS_COUNT}
  user_and_score[user_entry['nickname']] = score
  mapped_users[user_entry['nickname']] = map
  # handle response times


# print(user_and_score)
print(mapped_users)
leaderBoard = {}

for entry_key in user_and_score.keys():
  if user_and_score[entry_key] in leaderBoard:
    leaderBoard[user_and_score[entry_key]].append(entry_key)
  else:
    leaderBoard[user_and_score[entry_key]] = [entry_key]
# print(leaderBoard)

