---
layout: post
title:  "Backing up with Borg"
---

# Backing up with Borg

## Make sure you have Borg
First make sure you have installed Borg on your system. If you have a Debian based distro, it's as easy as:

```bash
sudo apt-get install python3 python3-dev python3-pip python-virtualenv \
libssl-dev openssl \
libacl1-dev libacl1 \
build-essential
sudo apt-get install libfuse-dev fuse pkg-config    # optional, for FUSE support
```

The complete install guide can be found on the [Borg website](https://borgbackup.readthedocs.io/en/stable/installation.html).

## Running a backup to a remote repository

In order to use Borg to backup to a remote repository, e.g. a NAS, I have made a script. In order to use this script, you have to make sure that your network attached storage is mounted to `$MOUNT_POINT` or that the mount point location exists. If the latter is the case, the script will try to mount the NAS on `$IP_ADDRESS` to `$MOUNT_POINT`. If the mount point does not exist, the script will make a new directory at the given location.

The script shown below will initiate a backup but excludes the following directories:
- `/home/` because it is common to have a separate volume for `/home/`. If you'd wish to include `/home/`, simply remove it from the script.
- `/dev/`
- `/run/`
- `/mnt/`
- `/proc/`
- `/sys/`
- `/tmp/`

```bash
#!/bin/bash

# First define variables
MOUNT_POINT="<mount point where nas is mounted>"
NAS_ADDRESS="<nas ip address>"
NAS_FOLDER="<nas directory to be used>"
NAS_BORG_BACKUP_REPO="<nas repository to be used, this will be a subdirectory of $NAS_FOLDER>"
NAS_USERNAME="<nas username"
NAS_PASSWD="<nas password>"

echo "*****************************"
echo "Starting Borg backup sequence"
echo "*****************************"

# first check if directory exists, if not create in order to mount the NAS dir
if [ ! -d $MOUNT_POINT ] ; then
        sudo mkdir $MOUNT_POINT
       
# check if valid mountpoint and unmount if incorrect NAS dir is mounted
elif mountpoint -q $MOUNT_POINT && [ ! -d $MOUNT_POINT/$NAS_BORG_BACKUP_REPO ] ; then
	#sudo umount $MOUNT_POINT
	echo "* Valid mountpoint detected: $MOUNT_POINT"
	echo "* Borg backup repository: $NAS_BORG_BACKUP_REPO"
	echo "  Full path: $MOUNT_POINT/$NAS_BORG_BACKUP_REPO"
	
# if no valid mountpoint and/or NAS dir is detected, unmount and remount the correct dir
else
	echo "- Invalid mountpoint and/or NAS directory detected."
	echo "- Unmounting $MOUNT_POINT"
	sudo umount $MOUNT_POINT
	echo "* Mounting NAS backup dir //$NAS_ADDRESS/$NAS_FOLDER to $MOUNT_POINT"
    	#echo //$NAS_ADDRESS/$NAS_FOLDER
        sudo mount -t cifs -o username=$NAS_USERNAME,password=$NAS_PASSWD,uid=1000,file_mode=0777,dir_mode=0777,rw //$NAS_ADDRESS/$NAS_FOLDER $MOUNT_POINT
        echo "* Success -> mounted."
fi

# Now start borg backup sequency
echo "*****************************"
echo "* Starting Borg backup"
echo "> Please enter a backup tag, e.g. 20200801"
read -p "Backup tag: " TAG
sudo borg create $MOUNT_POINT/$NAS_BORG_BACKUP_REPO::$TAG / --exclude '/home/*' --exclude '/dev/*' --exclude '/run/*' --exclude '/mnt/*' --exclude '/proc/*' --exclude '/sys/*' --exclude '/tmp/*' --one-file-system --info
echo "* Ready"

echo "*****************************"
while true; do
    read -p "> Backup successful. Would you like to check the repository? [y/n]" yn
    case $yn in
        [Yy]* ) sudo borg info $MOUNT_POINT/$NAS_BORG_BACKUP_REPO --info; break;;
        [Nn]* ) exit;;
        * ) echo "Please answer yes or no.";;
    esac
done
echo "* Unmounting NAS"
sudo umount $MOUNT_POINT

```
