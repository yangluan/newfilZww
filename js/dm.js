(function () {
    var __gameTime = 25;

    MachineEvent = {
        updateStatus: '0',
        updateGameTime: '1'
    }

    MachineStatus = {
        ready: 1,
        starting: 2,
        playing: 3,
        catching: 4,
        waitResult: 5,
        gameOver: 6
    }

    function DollMachine(deviceName, mqtt, hljoy) {
        var _mqtt = mqtt,
        _hljoy = hljoy,
        _deviceName = deviceName,
        _machineStatus = MachineStatus.ready,
        _gameTimer = null,
        _gameTime = 0,
        _events = {},
        _self = this;

        function exec(cmd) {
            _mqtt.controlWawaji(_deviceName, cmd);
        }

        this.deviceMessage = function(message) {
            console.log(message);
        }

        this.updateGameTime = function() {
            if (_gameTime > 1) {
                _gameTime --;
                if (_events[MachineStatus.updateGameTime]) {
                    var events = _events[MachineStatus.updateGameTime], len = events.length;
                    for (var i = 0; i < len; i ++)
                        events[i](value);
                }
            } else {
                _self.catch();
            }
        }

        this.addEventListener = function(event, cb) {
            if (!_events[event]) {
                _events[event] = [];
            } else {
                var len = _events[event].length;
                for (var i = len - 1; i >= 0; i --) {
                    if (_events[event][i] == cb) {
                        return;
                    }
                }
            }
            _events[event].push(cb);
        }

        this.removeEventListener = function(event, cb) {
            if (_events[event]) {
                var len = _events[event].length;
                for (var i = len - 1; i >= 0; i --) {
                    if (_events[event][i] == cb) {
                        _events[event].splice(i, 1);
                        break;
                    }
                }
            }
        }

        this.start = function() {
            var _self = this;
            this.setStatus(MachineStatus.starting);            
            /*_hljoy.startPlay(_deviceName, {
                onload: function() {
                    var res = JSON.parse(this.responseText);
                    if (res) {*/
                        /*if (res.data[0] == 'error') {
                            alert('设备没有准备好, 请稍后再试!');
                        } else if (res.data[0] == 'playing' || res.data[0] == 'result' || res.data[0] == 'catching') {
                            alert('糟糕! 没抢到机器.');
                        } else*/ {
                            exec(_mqtt.Wawaji_CMD_start);
                            _gameTime = __gameTime;
                            _gameTimer = setInterval(_self.updateGameTime, 1000);
                            _self.setStatus(MachineStatus.playing);
                        }
                   /* } else
                        alert('网络错误, 请稍后再试!');
                },
                onerror: function() {
                    alert('网络错误, 请稍后再试!');
                }*/
            //});
        }

        this.catch = function() {
            if (_machineStatus == MachineStatus.playing) {
                _machineStatus = MachineStatus.catching;
                exec(_mqtt.Wawaji_CMD_catch);
            }
            if (_gameTimer) {
                clearInterval(_gameTimer);
                _gameTimer = null;
            }
        }

        this.moveLeft = function() {
            if (_machineStatus == MachineStatus.playing) {
                exec(_mqtt.Wawaji_CMD_left);
            }
        }

        this.moveRight = function() {
            if (_machineStatus == MachineStatus.playing) {
                exec(_mqtt.Wawaji_CMD_right);
            }
        }

        this.moveFornt = function() {
            if (_machineStatus == MachineStatus.playing) {
                exec(_mqtt.Wawaji_CMD_bottom);
            }
        }

        this.moveBack = function() {
            if (_machineStatus == MachineStatus.playing) {
                exec(_mqtt.Wawaji_CMD_top);
            }
        }

        this.stopMove = function() {
            exec(_mqtt.Wawaji_CMD_stopmove);
        }

        this.leave = function() {
            exec(_mqtt.Wawaji_CMD_leave);
        }

        this.back = function() {
            exec(_mqtt.Wawaji_CMD_back);
        }

        this.cancelRetry = function() {
            exec(_mqtt.Wawaji_CMD_notretry);
        }

        this.setStatus = function(value) {
            if (value != _machineStatus) {
                _machineStatus = value;
                if (_events[MachineStatus.updateStatus]) {
                    var events = _events[MachineStatus.updateStatus], len = events.length;
                    for (var i = 0; i < len; i ++)
                        events[i](value);
                }
            }
        }

        _mqtt.subscribe(_deviceName, this.deviceMessage);
    }

    window.DollMachine = DollMachine;
}());