#!/usr/local/bin/python3.6

# import module
import sys
import os
import pathlib
from pdf2image import pdfinfo_from_path,convert_from_path
info = pdfinfo_from_path(sys.argv[1], userpw=None, poppler_path=None)

response = convert_from_path(
    sys.argv[1],
    dpi=100,
    output_folder="server/upload",
    fmt = "jpeg",
    thread_count = 10,
    output_file = 'page-' +sys.argv[3]+'-',
    paths_only = True
)

# Rename filename for required pattern
for file in response:
    pathName = pathlib.Path(file).stem
    filePattern = pathName.split('-')
    newFileName = "server/upload/page_"+sys.argv[2]+"_"+filePattern[3].lstrip('0')+"_"+sys.argv[3]+".jpg"
    os.rename(file, newFileName)