import textwrap
from PIL import Image, ImageFont, ImageDraw
import urllib.request
from string import ascii_letters
import sys
import os 

# Open image
img = Image.open(sys.argv[1])

# Load custom font
size = 30
font = ImageFont.truetype(font='static/font/RobotoCondensed-Regular.ttf', size=size)

# Create DrawText object
draw = ImageDraw.Draw(im=img)

# Define our text
# text = """Hello World Hello World Hello World Hello World"""
text = (sys.argv[3])
newFile = text.split('_')
newFileName = ' '.join(newFile)

para = textwrap.wrap(newFileName, width=15)
para = '\n'.join(para)

checkCount = para.count("\n")
if checkCount > 3:
    size = 15
elif checkCount > 2:
    size=20

font = ImageFont.truetype(font='static/font/RobotoCondensed-Regular.ttf', size=size)


# Get Text width and height
text_width, text_height = draw.textsize(para, font=font)
xCordinate = (img.size[0] - text_width)/2;


# Add text to the image
draw.text(xy=(xCordinate, img.size[1]/2), text=para, font=font, fill="white" ,align= 'center' )

# view the result
img.save('server/upload/'+(sys.argv[4]))  