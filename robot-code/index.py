import time
import json
import unicornhathd
import redis

r = redis.Redis(host='localhost', port=6379, db=0)

while True:
  color_queue = r.get('colorQueue')
  if color_queue == None:
    color_queue = []
  else:
    color_queue = json.loads(color_queue)
  print(color_queue)
  x = 0
  y = 0
  index = 0
  for color in color_queue:
    unicornhathd.set_pixel(x, y, color['r'], color['g'], color['b'])
    x += 1
    index +=1
    if x > 15:
      x = 0
      y += 1
  unicornhathd.show()
  time.sleep(5)