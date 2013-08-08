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

`linux-lock-service` uses JSON configuration files to learn how to configure the system. **BY DEFAULT**, `linux-lock-service` will try to open `~/.linux-lock-service.json`, if a configuration file is not specified on the command line. If no configuration is found, then the application will quit.

Currently, there are 3 configuration keys, for each of the three different concerns of the application: `client`, `gpio`, and `rfidReader`. Each of these keys are special, in that they can be Objects containing the pertinent keys, or they can be Strings, interpretted as paths to JSON files containing the pertinent definition.

EG:

```json
{
  "client": "/var/opt/linux-lock-client.json"
}
````

would attempt to load the JSON file at that path, which should contain a JSON Object literal similar to this:

```json
{
  "server": "http://www.google.com",
  "port": 9000,
}
```

The object defined in `/var/opt/linux-lock-client.json` is then incorporated into the configuration object, as the value for the `client` key.

---

####The `client` key
tells the application which web server we are communicating with. There is no way to manually configure the URLs to be queried, as `Client#checkRFID()` will always request `/api/auth/rfid/:rfidNo.json`. This might be adjusted in the future, but it is not difficult to circumvent, for applications which need to do so.

The supported keys include:

<table>
  <tr><th>key</th><th>value</th></tr>
  <tr><td><code>server</code></td><td>The URL for the web service. The path requested by `Client#checkRFID()` should be relative to that domain. Currently, applications served under subdirectories are not supported. <strong>There is no default value</strong></td></tr>
  <tr><td><code>port</code></td><td>The server port to be used. This is a convenience field, as the port can be inserted directly into the URL and nobody would be the wiser. <strong>Defaults to the default port of the connection scheme being used</strong></td></tr>
  <tr><td><code>version</code></td><td>The version of the JSON API we are expecting. This is a feature which enables Restify to select a route based on a strict API version. LinuxLock is no longer using restify on the server side, however it is kept in place on the client side for applications which may wish to use it. It defaults to <code>"~1.0"</code></td></tr>
</table>

---

####The `gpio` key 
tells the application which electric signals to send to the Raspberry Pi's GPIO headers, when, and for how long.

**warning**: No validation is performed, it is entirely up to you to ensure that your values are safe for you and your machinery. Caitlin Potter and Kaleidus Code are not in any way, shape or form liable should something go wrong.

The API allows for the execution of arbitrary GPIO configurations, however the main application uses only two, which are detailed here. An example configuration:

```json
{
  "gpio": {
    "authorized": {
      "action": [{
        "pin": 11,
        "set": 1000
      },{
        "pin": 15,
        "set": 1000
      }]
    },
    "unauthorized": [{
      "pin": 16,
      "action": {
        "set": 1000
      }
    },{
      "pin": 17,
      "action": {
        "set": 1000
      }
    }]
  }
}
````

The above configuration demonstrates simple GPIO instructions, split into two sets of comments.

The `authorized` command, which is recognized by the `linux-lock-service` application, is told to `set` (raise voltage on) pins 11 and 15, in parallel, for 1 second (`1000 milliseconds`)

The `unauthorized` command, which is also recognized by the `linux-lock-service` application, is told to `set` (raise voltage on) pins 16 and 17, in series.

The reason why `authorized` executes the commands for the two pins in parallel, while `unauthorized` executes them in series, is because of the algorithm which is used to walk the instruction object, detailed further on.

---

####Further GPIO details:

The Pi configuration uses the Raspberry Pi Header Schema for pin numbers. As a reference, here is a diagram relating the Header pin schema to the WiringPi pin schema:

<table>
<th>WiringPi</th><th>Name</th><th>Header</th><th>Name</th><th>WiringPi</th>
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

The structure of a GPIO instruction set is the following:
```js
"authorized": [ // The configuration (or command) name. Its value is an Object
                // or Array of Objects (Sub-configurations)

  { // Sub-configuration #1

    "pin": 22, // Sub-configuration default pin (can be overridden by actions)

    "action": [ // Object, or Array of Objects, denoting actions to be taken
                // (Actions)
              
      { // Action #1

        "set": 1000, // Verb, with Time (Milliseconds) value
      },
      { // Action #2
        "pin": 17, // This action overrides the Sub-configuration default pin
        "set": 2000
      }
    ]
  }
]
```

The algorithm for executing GPIO instructions is the following:

- Execute each Sub-configuration in parallel
  1. Abort processing Sub-configuration if it's not an Object
  2. Cache Sub-configuration Default Pin, if specified
  3. Store Sub-configuration Action, if specified.
  4. Abort processing Sub-configuration if Action is not an Object or Array
  5. Execute each Sub-configuration Action in series
      1. Abort processing Action if it is not an Object, or is an Array
      2. Cache either the Sub-configuration Default Pin, or the Action Pin, if specified
      3. Abort action if there is no specified Pin
      4. For each Supported Verb, execute in parallel:
          1. If the Action specifies the verb, and the value for the Action Verb is a Number, execute the Verb

The Supported Verbs are currently:
<table>
  <tr><th>verb</th><th>description</th></tr>
  <tr><td><code>set</code></td><td>Raise pin for specified duration of time</td></tr>
</table>

Different verbs may be provided in the future, as well as a mechanism for specifying whether a block is executed in series or in parallel.

---

####The `rfidReader` key
Enables the application to specify the means and parameters for communicating with a particular RFID reader.

Currently, only a Serial protocol is supported.

The following options are supported:

<table>
  <tr><th>key</th><th>description</th></tr>
  <tr><td><code>serialPort</code></td><td>The device name to use. Defaults to <code>/dev/ttyUSB0</code></td></tr>
  <tr><td><code>baudRate</code></td><td> Baud Rate, defaults to <code>2400</code>. Must be one of: 115200, 57600, 38400, 19200, 9600, 4800, 2400, 1800, 1200, 600, 300, 200, 150, 134, 110, 75, or 50.</td></tr>
  <tr><td><code>dataBits</code></td><td>Data Bits, defaults to <code>8</code>. Must be one of: 8, 7, 6, or 5.</td></tr>
  <tr><td><code>stopBits</code></td><td>Stop Bits, defaults to <code>1</code>. Must be one of: 1 or 2.</td></tr>
  <tr><td><code>parity</code></td><td>Parity, defaults to <code>none</code>. Must be one of: 'none', 'even', 'mark', 'odd', 'space'</td></tr>
  <tr><td><code>bufferSize</code></td><td>Size of read buffer, defaults to <code>255</code>. Must be an integer value.</td></tr>
</table>

These are passed directly into the [node-serialport](https://github.com/voodootikigod/node-serialport) module, however only supported values are used due to the normalization process. These settings enable the selection of the serial port to be used, as well as the parameters for communicating with it.

In development, we have been using the [Parallax RFID Card Reader (USB Serial)](http://www.trossenrobotics.com/store/p/5852-Parallax-RFID-Card-Reader-USB.aspx). Technical specifications for different RFID Readers should be available on a manufacturer's website.

A very simple `rfidReader` configuration suitable for the **Parallax RFID Card Reader** on a Raspberry Pi, would look like the following:
```json
{
  "rfidReader": {
    "serialPort": "/dev/ttyUSB0",
    "baudRate": 2400
  }
}
```

---

####Further configuration

After building a satisfactory configuration, it is desirable to run the service in perpetuum, using tools such as Debian Services, or [node-forever](https://github.com/nodejitsu/forever)/[nodemon](https://github.com/remy/nodemon)

This configuration is entirely up to the user, however I've provided an example of configuring the service as a Debian Service ([example instructions](http://kvz.io/blog/2009/12/15/run-nodejs-as-a-service-on-ubuntu-karmic/)).

---

In order for the service to communicate with the LinuxLock webserver, we require a static IP which is known to the server itself. It is the task of the network administrator to configure the networking correctly. Using Raspbian Wheezy, network configuration is largely a task of writing /etc/network/interfaces in an effective manner.

---

Congratulations, your lock service is now communicating with the LinuxLock server, and can be notified when a user is authorized to enter a door via an RFID swipe, and it takes only milliseconds. Wonderful!

---

##API Documentation

Due to the separation of concerns, it is possible (and not very difficult) to build an application similar to `linux-lock-service`, using the APIs provided.

---
###Client

This module is responsible for communication with a remote JSON web service. Access it via the following:

```js
var client = require('linux-lock-pi').Client
```

####Client#normalizeConfig(config, done)
<table>
  <tr><td>Parameters</td><td>
<ol><li><code>config</code>: Configuration object, either containing a complete
   linux-lock-pi configuration, or just the 'client' section of
   one.</li>
<li><code>done</code>: A callback, with signature done(err, config), which          allows the routine to be used in routines provided by the 'async' module.</li></ol>
     </td></tr>
  <tr><td>Returns</td><td><code>undefined</code></td></tr>
  <tr><td>Description</td><td>Normalize the client configuration of linux-lock-pi, by removing unknown or invalid keys.</td></tr>
</table>

####Client#loadConfig(path, done)
<table>
  <tr><td>Parameters</td><td>
<ol><li><code>path</code>: An absolute path. Should point to a JSON file.</li>
<li><code>done</code>: A callback, with signature done(err, config), which allows the routine to be used in routines provided by the 'async' module.</li></ol>
     </td></tr>
  <tr><td>Returns</td><td><code>undefined</code></td></tr>
  <tr><td>Description</td><td>Load a client/server configuration from a JSON file, and return an object containing the parsed key/values which are pertinent to the client/server module.</td></tr>
</table>

####Client#createClient(options)
<table>
  <tr><td>Parameters</td><td>
<ol><li><code>options</code>: A URL string, or an object containing parameters for Restify's
JsonClient. Documentation for the JsonClient can be found at
<a href="https://github.com/mcavage/node-restify/blob/master/README.md">https://github.com/mcavage/node-restify/blob/master/README.md</a>

If 'port' is found in options, it will be formatted into the URL
string before being handed to Restify.</li></ol>
     </td></tr>
  <tr><td>Returns</td><td>Object (node-restify JsonClient). This Restify client is a customized instance featuring LinuxLock-specific routines: JsonClient#checkRFID(rfidNo)</td></tr>
  <tr><td>Description</td><td>Create an instance of a JsonClient, which will interact with the LinuxLock JSON web service / API.</td></tr>
</table>

####Client#checkRFID(rfidNo)
<table>
  <tr><td>Parameters</td><td>
<ol><li><code>rfidNo</code>: A string containing a deserialized RFID tag, which shall be URL encoded and passed to the LinuxLock JSON Web Service, in order to determine whether or not the card is authorized.</li></ol>
     </td></tr>
  <tr><td>Returns</td><td><code>undefined</code></td></tr>
  <tr><td>Description</td><td>Sends a request to the web service, which shall in turn emit either an 'authorized' event, or an 'unauthorized' event. The event data  for these events shall contain the deserialized RFID tag under 'tag', and the type 'rfid', EG "{type: 'rfid', tag: '01AB9607AD'}"</td></tr>
</table>

---
###GPIO

This module is responsible for communication with the Raspberry Pi GPIO Header, and sending electric signals to peripheral devices, such as magnetic locks.

```js
var client = require('linux-lock-pi').GPIO
```

####GPIO#normalizeConfig(config, done)
<table>
  <tr><td>Parameters</td><td>
<ol><li><code>config</code>: Configuration object, either containing a complete linux-lock-pi configuration, or just the 'gpio' section of one.</li>
<li><code>done</code>: A callback, with signature done(err, config), which allows the routine to be used in routines provided by the 'async' module.</li></ol>
     </td></tr>
  <tr><td>Returns</td><td><code>undefined</code></td></tr>
  <tr><td>Description</td><td>Normalize the gpio configuration of linux-lock-pi, by removing unknown or invalid keys.</td></tr>
</table>

####GPIO#loadConfig(path, done)
<table>
  <tr><td>Parameters</td><td>
<ol><li><code>path</code>: An absolute path. Should point to a JSON file.</li>
<li><code>done</code>: A callback, with signature done(err, config), which allows the routine to be used in routines provided by the 'async' module.</li></ol>
     </td></tr>
  <tr><td>Returns</td><td><code>undefined</code></td></tr>
  <tr><td>Description</td><td>Load a GPIO configuration from a JSON file, and return an object containing the parsed key/values which are pertinent to the GPIO module.</td></tr>
</table>

####GPIO#GPIO()
<table>
  <tr><td>Returns</td><td><code>Object (instanceof GPIO)</code></td></tr>
  <tr><td>Description</td><td>Construct a GPIO object, which will issue commands to the Raspberry Pi GPIO headers, using instructions parsed from JSON files.</td></tr>
</table>

####GPIO#GPIO#execute(config)
<table>
  <tr><td>Parameters</td><td><ol><li><code>config</code>: An object containing a single GPIO configuration, made up of one or more sub-configurations, each of which made up of one or more actions (containing one or more verbs).
  <tr><td>Returns</td><td><code>undefined</code></trd></tr>
  <tr><td>Description</td><td>Executes a set of GPIO instructions, using the following algorithm:<br /><br />
  
  If configuration is an array, execute each element (sub-configuration) of
  the array in parallel. Otherwise, treat the object as a single
  sub-configuration and execute it.<br /><br />
  
  For each sub-configuration, there should be an "action" key. The value of
  this action key may be an array or object. If it is an array, each element
  in the array shall be executed in series.<br /><br />
  
  If a sub-configuration has a "pin", it shall override the configuration's
  top-level "pin" value (if one was present). If no pin is specified, then
  the instruction shall be ignored.<br /><br />
  
  An action may specify verbs, each of which shall be executed in parallel.
  A verb key's value is a time value, indicating the duration (in
  milliseconds) of the action. The accuracy of the time value is laughable,
  and should not be relied on for fancy light shows at dance parties or
  night clubs. Unknown verbs are ignored.<br /><br />
  
  Currently, the supported verbs are:<br /><ul>
    <li><code>"set"</code></li></ul></td></tr>
</table>

---
###RFIDReader

This module is responsible for communication with a serial RFID Reader/Scanner.

```js
    // Helper methods
var rfidReader = require('linux-lock-pi').rfidReader,
    // Constructor
    RFIDReader = require('linux-lock-pi').RFIDReader
```

####RFIDReader#normalizeConfig(config, done)
<table>
  <tr><td>Parameters</td><td>
<ol><li><code>config</code>: Configuration object, either containing a complete
  linux-lock-pi configuration, or just the 'rfidReader' section of one.</li>
<li><code>done</code>: A callback, with signature done(err, config), which allows the routine to be used in routines provided by the 'async' module.</li></ol>
     </td></tr>
  <tr><td>Returns</td><td><code>undefined</code></td></tr>
  <tr><td>Description</td><td>Normalize the RFIDReader configuration of linux-lock-pi, by removing unknown or invalid keys.</td></tr>
</table>

####RFIDReader#loadConfig(path, done)
<table>
  <tr><td>Parameters</td><td>
<ol><li><code>path</code>: An absolute path. Should point to a JSON file.</li>
<li><code>done</code>: A callback, with signature done(err, config), which allows the routine to be used in routines provided by the 'async' module.</li></ol>
     </td></tr>
  <tr><td>Returns</td><td><code>undefined</code></td></tr>
  <tr><td>Description</td><td>Load an rfid/serial port configuration from a JSON file, and return an object containing the parsed key/values which are pertinent to the RFIDReader module.</td></tr>
</table>

####RFIDReader#RFIDReader(serialPort, config, open)
<table>
  <tr><td>Parameters</td><td>
<ol><li><code>serialPort</code>: A string representing the SerialPort device, eg "/dev/ttyUSB0". This parameter is optional.</li>
<li><code>config</code>: A normalized RFIDReader configuration. If 'serialPort' is omitted, then the 'serialPort' member of 'config' is used in its place.</li><li><code>open</code>: Boolean value, indicating whether or not to open the device on instantiation. This parameter is optional, and defaults to true.</ol></td></tr>
  <tr><td>Returns</td><td><code>Object (instanceof RFIDReader)</code></td></tr>
  <tr><td>Description</td><td>Construct an RFIDReader interface, which manages the communication with a serial port, and emits a 'scanned' event when an RFID tag has been read.</td></tr>
</table>