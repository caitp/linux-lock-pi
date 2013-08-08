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

##GPIO Configuration

This module allows for some configuration of GPIO actions to be taken. The default script will use two
configurations, "authorized" and "unauthorized", however there is no real way to limit what you do with
the library manually.

The code uses the WiringPi pin numbering scheme, and non-GPIO pins will not be used by the GPIO module.

Just for convenience, the WiringPi wiring scheme is noted below. The important pins are `&lt;strong&gt;`, for emphasis. Again, other pins will be ignored by the scripts unless I can think of some good reason not to (and there probably is such a reason).

<table>
<th>wiringPi</th><th>Name</th><th>Header</th><th>Name</th><th>wiringPi</th>
<tr><td>–</td><td>3.3v</td><th>01 | 02</th><td>5v</td><td>–</td></tr>
<tr><td>8</td><td>SDA0</td><th>03 | 04</th><td>5v</td><td>–</td></tr>
<tr><td>9</td><td>SCL0</td><th>05 | 06</th><td>0v</td><td>–</td></tr>
<tr><td><strong>7</strong></td><td><strong>GPIO7</strong></td><th>07 | 08</th><td>TxD</td><td>15</td></tr>
<tr><td>–</td><td>0v</td><th>09 | 10</th><td>RxD</td><td>16</td></tr>
<tr><td><strong>0</strong></td><td><strong>GPIO0</strong></td><th>11 | 12</th><td><strong>GPIO1</strong></td><td><strong>1</strong></td></tr>
<tr><td><strong>2</strong></td><td><strong>GPIO2</strong></td><th>13 | 14</th><td>0v</td><td>–</td></tr>
<tr><td><strong>3</strong></td><td><strong>GPIO3</strong></td><th>15 | 16</th><td><strong>GPIO4</strong><td><strong>4</strong></td></tr>
<tr><td>–</td><td>3.3v</td><th>17 | 18</th><td><strong>GPIO5</strong></td><td><strong>5</strong></td></tr>
<tr><td>12</td><td>MOSI</td><th>19 | 20</th><td>0v</td><td>–</td></tr>
<tr><td>13</td><td>MISO</td><th>21 | 22</th><td><strong>GPIO6</strong></td><td><strong>6</strong></td></tr>
<tr><td>14</td><td>SCLK</td><th>23 | 24</th><td>CE0</td><td>10</td></tr>
<tr><td>–</td><td>0v</td><th>25 | 26</th><td>CE1</td><td>11</td></tr>
</table>

Configuring a GPIO action from JSON would look something like this:

```json
{
  "gpio": {
    "authorized": {
      "pin": 4,
      "action": {
        "set": 5000,
      }
    }
  }  
}
```

The above JSON, on notice of authorization, sets pin 4 to 'high' for 5 seconds (5000 milliseconds). **NOTE** The timing is NOT perfect, do not use this to choreograph dance videos. It will not work out.

The "authorized" and "unauthorized" keys can take Objects as well as Arrays. If they are given arrays, then each element of the array is executed asynchronously, and should not expect any synchronization.

However, the "action" key also expects both Objects and Arrays, and if it is an array, then each element in the array will execute in series. It is possible to place "pin" inside of the "action" key, in which case it would override the top-level "pin". This allows a great deal of flexibility and synchronization. 

In future revisions, it is likely that synchronous and asynchronous nature of GPIO commands will be explicitly defined, and default to asynchronous, regardless of which key is used. However, for the time being, it is not really a priority, because we are not needing complex electric actions to be taken.

---

Congratulations, your lock service is now communicating with the LinuxLock server, and can be notified when a user is authorized to enter a door via an RFID swipe, and it takes only milliseconds. Wonderful!

##Caveats

There is some very basic GPIO configuration currently, however the main script will not make use of them, as
of yet. This shall be addressed shortly, with the addition of documentation in README.md regarding the
construction of configuration files. (For now, I've made an effort to document the source code nicely, so
please refer to lib/*.js for details).
