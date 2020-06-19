import time
import unicornhathd
import redis

r = redis.Redis(host='localhost', port=6379, db=0)

while True:
  print(r.get('colorQueue'))
  sleep(5)