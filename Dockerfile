FROM node:12.21.0
RUN apt-get update && apt-get install -y \
    python-dev python-pip python-setuptools poppler-utils \
    libffi-dev python3 python3-pip libxml2-dev libxslt1-dev \
    libtiff5-dev libjpeg62-turbo-dev zlib1g-dev libfreetype6-dev \
    liblcms2-dev libwebp-dev tcl8.5-dev tk8.5-dev python-tk && pip install Pillow \
    && pip3 install pdf2image==1.16.0 && apt-get install -y img2pdf && pip3 install docx2pdf \
    && apt install -y libreoffice
RUN mkdir /app
WORKDIR /app
COPY package.json /app
RUN npm i
COPY . /app
RUN npm run build:next
CMD npm run start
