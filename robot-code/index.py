import time
import json
import unicornhathd
import redis

r = redis.Redis(host='localhost', port=6379, db=0)

r.set('colorQueue', json.dumps([{'r':123, 'g': 0, 'b':0}, {'r':0, 'g':0, 'b':100}]))

while True:
  print(json.loads(r.get('colorQueue')))
  time.sleep(5)