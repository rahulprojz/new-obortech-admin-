#!/usr/local/bin/python3.6

from PIL import Image
import sys

try:

    image1 = Image.open(sys.argv[1])
    im1 = image1.convert('RGB')
    im1.save(sys.argv[2])

except:
    e = sys.exc_info()[0]
    print("Error: {0}".format(e))
