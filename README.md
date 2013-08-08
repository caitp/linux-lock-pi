LinuxLock
=========

##About

Kaleidus Code LinuxLock service for Raspberry Pi

##Installation

Dependencies:

- Stable Node.js for Raspberry Pi ([currently 0.10.13](http://nodejs.org/dist/v0.10.13/node-v0.10.13-linux-arm-pi.tar.gz)). We can not use the Debian repository's copy of Node, as it is unfortunately very old and out of date. Further, it renames the `node` executable, which is terribly inconvenient. Installation instructions:

```bash
# Download binary tarball
wget http://nodejs.org/dist/v0.10.13/node-v0.10.13-linux-arm-pi.tar.gz

# Install for the entire system
sudo tar -xzf node-v0.10.13-linux-arm-pi.tar.gz --strip 1 -C /usr/local
```

---

To install, download the package with `sudo npm install -g linux-lock-pi`, on a Raspberry Pi, equipped with the Raspbian Wheezy operating system.

##Setup

Currently, the script communicates with a hardcoded webserver, and so it is necessary to find the line in `bin/linux-lock-service` where `restify.createJsonClient()` is called, and change the 'url' to the installation of your own LinuxLock web server.

---

Following this, configure the service to run perpetually, either as a Debian service ([example instructions](http://kvz.io/blog/2009/12/15/run-nodejs-as-a-service-on-ubuntu-karmic/)), or use a tool such as node-forever.

---

In order for the service to communicate with the LinuxLock webserver, we require a static IP which is known to the server itself. It is the task of the network administrator to configure the networking correctly. Using Raspbian Wheezy, network configuration is largely a task of writing /etc/network/interfaces in an effective manner.

---

Congratulations, your lock service is now communicating with the LinuxLock server, and can be notified when a user is authorized to enter a door via an RFID swipe, and it takes only milliseconds. Wonderful!

##Caveats

There is some very basic GPIO configuration currently, however the main script will not make use of them, as
of yet. This shall be addressed shortly, with the addition of documentation in README.md regarding the
construction of configuration files. (For now, I've made an effort to document the source code nicely, so
please refer to lib/*.js for details).
