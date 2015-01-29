var KBLED = '/sys/devices/platform/clevo_wmi/kbled/raw';
var FADE_DURATION = 1000; // in ms

var exec = require('child_process').exec;
var skype = require('skype-dbus');
var pidgin = require('pidgin');

exec("cat " + KBLED, function(er, kbled, errout) {
    kbled = kbled.trim();
    console.log('current keyboard setting: ', kbled);

    var brightness = 0;
    var fade = function() {
        if (brightness > 0) {
            send('brightness', brightness--);
            setTimeout(fade, FADE_DURATION / 10);
        } else {
            send('raw', kbled);
        }
    };
    var blink = function() {
        if (brightness > 0) {
            brightness = 10;
        } else {
            brightness = 10;
            exec("echo 0xa222 | sudo tee /sys/devices/platform/clevo_wmi/kbled/raw", function(error, stdout, stderr) {
                fade();
            });
        }
    };
    var sink = function(er, out, errmsg) {};
    var send = function(key, value) {
        exec("echo " + value + " | sudo tee /sys/devices/platform/clevo_wmi/kbled/" + key, sink);
    };

    var connectSkype = function connectSkype() {
        skype.createClient('led-notify', null, function(err, client) {
            if (err) {
                console.log('[skype] retrying in 1 sec');
                setTimeout(connectSkype, 1000);
            } else
            if (typeof client !== "undefined" && client !== null) {
                console.log('[skype] connected');
                client.on('notification', function(msg) {
                    console.log('Skype message', msg);
                    blink();
                });
                client.testSignal('Notify', function(msg) {
                    console.log('Skype signal Notify', msg);
                });
                client.testSignal('Reply', function(msg) {
                    console.log('Skype signal Reply', msg);
                });
                client.on('error', function(err) {
                    console.log('skype error', err);
                });
                client.on('disconnect', function(err) {
                    console.log('skype disconnect', err);
                });
            }
        });
    };
  
    connectSkype();

    console.log('pidgin:', pidgin.createClient().on('ReceivedImMsg', function(account, sender, message, conversation, flags) {
        console.log('Pidgin message', account, sender, message, conversation, flags);

        blink();
    }));
});