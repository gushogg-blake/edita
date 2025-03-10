#!/bin/bash

root=`pwd`
dir=$root/install/linux
installedFiles=$dir/installedFiles.txt

function prompt {
	prompt=$1
	defaultValue=$2
	
	read -p "$prompt [$defaultValue]: " value
	
	value=${value:-$defaultValue}
	
	echo $value
}

function createOrUpdate {
	template=$1
	path=$2
	
	if [ -f $path ]; then
		echo "Updating $path"
	else
		echo "Creating $path"
	fi
	
	_path="$root" _bin="$bin" "$dir/utils/template.js" < "$template" > "$path"
	
	echo $path >> $installedFiles
}

if [ -f $installedFiles ]; then
	uninstallExisting=$(prompt "Remove existing installation first? (y/n)" y)
	
	if [[ $uninstallExisting == "y" ]]; then
		$dir/uninstall.sh
	fi
fi

installDesktop=$(prompt "Install desktop entry? (y/n)" y)
addToDesktop=$(prompt "Add to desktop? (y/n)" y)

bin=$(prompt "Command location" "$HOME/bin/edita")

createOrUpdate $dir/files/edita $bin

if [[ $installDesktop == "y" ]]; then
	createOrUpdate $dir/files/edita.desktop "$HOME/.local/share/applications/edita.desktop"
fi

if [[ $addToDesktop == "y" ]]; then
	createOrUpdate $dir/files/edita.desktop "$HOME/Desktop/Edita.desktop"
fi
