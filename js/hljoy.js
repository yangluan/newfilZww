(function () {

    function HLJoy() {
        var _apiUrl = 'http://zhuawawa-debug.hljoy.com/api/1.0.3/';
        var _token = '10004:1512099830:0af71dc955a2b146fbd93ab6d84900b1';

        this.get = function(cmd, params, cb) {
            var xhr = new XMLHttpRequest();
            var url = _apiUrl + cmd.replace('.', '/');
            
            for (var i = 0; i < params.length; i ++) {
                url += '/' + params[i];
            }

            xhr.open('GET', url + '?token=' + _token);
            if (cb) {
                xhr.onload = cb.onload ? cb.onload : null;
                xhr.onerror = cb.onerror ? cb.onerror : null;
            }
            xhr.send(null);
        }

        this.getOne = function(cmd, param1, cb) {
            var params = [];
            params.push(param1);
            this.get(cmd, params, cb);
        }

        this.refreshToken = function() {
            this.get('play.GetRoomList', [], {
                onload: function() {

                }
            });
        }

        this.playerLogin = function(player, cb) {
            this.getOne('device.PlayerQuickLogin', player, cb);
        }

        this.getRoomList = function(cb) {
            this.get('play.GetRoomList', [], cb);
        }

        this.startPlay = function(room, cb) {
            this.getOne('play.StartPlay', room, cb);
        }

        this.getPlayResult = function(room, cb) {
            this.getOne('play.GetResult', room, cb);
        }
    }

    hljoy = new HLJoy();
}());