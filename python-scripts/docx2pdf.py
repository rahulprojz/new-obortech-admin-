#!/usr/local/bin/python3.6

from docx2pdf import convert
import sys

try:

    convert(sys.argv[1], sys.argv[2])

except:
    e = sys.exc_info()[0]
    print("Error: {0}".format(e))
