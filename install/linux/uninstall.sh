#!/bin/bash

root=`pwd`

dir=$root/install/linux

installedFiles=$dir/installedFiles.txt

if [ ! -f $installedFiles ]; then
	echo "No installation found"
	
	exit 1
fi

while read path; do
	echo "Removing $path"
	
	rm $path
done < $installedFiles

rm $installedFiles
