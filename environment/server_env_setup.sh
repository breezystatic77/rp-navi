#!/bin/bash

echo Installing server environment...
echo

sudo apt-get update

#echo
echo Installing compilers...
sudo apt-get install -y gcc
sudo apt-get install -y make

echo
echo Installing vim...
sudo apt-get install -y vim

echo
echo Installing curl...
sudo apt-get install -y curl

echo
echo Instaling node...
curl -sL https://deb.nodesource.com/setup_11.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo apt-get install -y build-essential

echo
echo Installing mongodb...
sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 0C49F3730359A14518585931BC711F9BA15703C6
echo "deb [ arch=amd64,arm64 ] http://repo.mongodb.org/apt/ubuntu xenial/mongodb-org/3.4 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-3.4.list
sudo apt-get update
sudo apt-get install -y mongodb
sudo mkdir -p /data/db

echo Installing monit...
sudo apt-get install -y monit

echo
echo node.js version
node -v

echo
echo NPM version
npm -v

echo
echo Checking mongodb daemon
sudo service mongod start
sleep 2
cat /var/log/mongodb/mongod.log
sudo service mongod stop
