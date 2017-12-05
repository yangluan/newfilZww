
function MqttProxy(facade, productKey, deviceId, deviceName, deviceSecret, clientId, onConnect, onFail) {

    // 娃娃机控制指令
    this.Wawaji_CMD_start = "start";          // 开始
    this.Wawaji_CMD_catch = "catch";          // 下抓
    this.Wawaji_CMD_stopmove = "stopmove";    // 停止移动
    this.Wawaji_CMD_left = "left";            // 左移
    this.Wawaji_CMD_right = "right";          // 右移
    this.Wawaji_CMD_top = "top";              // 上移(远离)
    this.Wawaji_CMD_bottom = "bottom";        // 下移(靠近)

    this.Wawaji_CMD_leave = "leave";          // 玩家中途离开
    this.Wawaji_CMD_back = "back";            // 玩家重新回来
    this.Wawaji_CMD_notretry = "notretry";    // 取消重试
    
    this.client = null;
    this.facade = facade;

    this.productKey = productKey;
    this.deviceId = deviceId;
    this.deviceName = deviceName;
    this.deviceSecret = deviceSecret;
    this.clientId = clientId;

    var _messageArrived = null,
    _onConnect = onConnect;

    function messageArrived(message) {
        if (_messageArrived)
            _messageArrived(message);
    }

    // 设置topicRoot地址
    this.topicRoot = "/" + this.productKey + "/" + this.deviceName + "/";

    // 广播topicRoot地址
    this.broadcastTopicRoot = "/broadcast/" + this.productKey + "/";

    // 订阅娃娃机的广播消息
    this.subscribeWawajiBroadcast = function(deviceNames) {
        var contains, topic, existDeviceNames = this.getSubscribeTopics();
        for (var i = 0; i < deviceNames.length; i++) {
            topic = deviceNames[i];
            contains = false;
            for (var j = 0; j < existDeviceNames.length; j++) {
                if (existDeviceNames[j] == topic) {
                    contains = true;
                    break;
                }
            }
            if (contains) continue;

            existDeviceNames.push(topic);
            this.subscribe(topic, {
                onMessageArrived: function(s, mqttMessage) {
                    var payload = mqttMessage.getPayload();
                    //EventBus.getDefault().post(new Message(deviceName, payload));
                }
            });
        }
        this.setSubscribeTopics(existDeviceNames);
    }

    // 取消订阅娃娃机的广播消息
    this.unSubscribeWawajiBroadcast = function(deviceNames) {
        var contains, topic, existDeviceNames = this.getSubscribeTopics();
        for (var i = deviceNames.length - 1; i <= 0; i--) {
            topic = deviceNames[i];
            contains = false;
            for (var j = 0; j < existDeviceNames.length; j++) {
                if (existDeviceNames[j] == topic) {
                    contains = true;
                    break;
                }
            }
            if (!contains) continue;

            existDeviceNames.splice(i, 1);
            this.unSubscribe(topic);
        }
        this.setSubscribeTopics(existDeviceNames);
    }

    // 远程控制娃娃机
    this.controlWawaji = function(deviceName, controlType) {
        console.log("MqttProxy.controlWawaji: " + deviceName + ", " + controlType);

        var payload = {};
        payload["targetDevice"] = deviceName;
        payload["messageType"] = "control";
        payload["controlType"] = controlType;
        if (controlType == this.Wawaji_CMD_start ||
                controlType == this.Wawaji_CMD_leave ||
                controlType == this.Wawaji_CMD_back) {
            payload["playerId"] = this.facade.userId;
        }
        this.publish(payload);
    }

    // 取消所有对娃娃机广播的订阅
    this.clearAllWawajiBroadcastSubscribes = function() {
        var topics = this.getSubscribeTopics();
        for (var i = 0; i < topics.length; i ++) {
            this.unSubscribe(topics[i]);
        }
        this.setSubscribeTopics([]);
    }

    // 设备认证并连接
    // TODO 使用HTTPS认证再连接模式 + TLS安全连接
    this.startUp = function() {
        if (this.client != null) {
            return;
        }

        // 获取当前时间
        var t = (new Date()).getTime();

        //设备认证
        var params = 'clientId' + this.clientId + 'deviceName' + this.deviceName + 'productKey' + this.productKey + 'timestamp' + t;

        var mqttClientId = this.clientId + "|securemode=3,signmethod=hmacsha1,timestamp=" + t + "|";
        var mqttUsername = deviceName + "&" + productKey;
        var mqttPassword = CryptoJS.HmacSHA1(params, this.deviceSecret).toString(CryptoJS.enc.Hex).toUpperCase();
        var mqttHost = this.productKey + this.facade.config.aliyunIotHost;
        try {
            this.client = new Paho.MQTT.Client(mqttHost, 443, mqttClientId);
            this.client.onMessageArrived = messageArrived;
        } catch (e) {
            console.log(e);
        }

        var connOpts = {
            invocationContext: {host : mqttHost, port: 443, clientId: mqttClientId},
            mqttVersion: 4,
            timeout: 3,
            keepAliveInterval: 180,
            cleanSession: false, //如果是true，那么清理所有离线消息，即QoS1或者2的所有未接收内容
            userName: mqttUsername,
            password: mqttPassword,
            reconnect: true,
            onSuccess: function() {
                if (_onConnect) _onConnect();
            },
            onFailure: onFail
          };
        try {
            this.client.connect(connOpts);
        } catch (e) {
            console.log(e);
        }
    }

    // 关闭连接
    this.shutDown = function() {
        if (this.client == null) {
            return;
        }

        if (!this.client.isConnected()) {
            this.client = null;
            return;
        }

        // 取消订阅get主题
        this.unSubscribe(this.topicRoot + "get");

        // 取消娃娃机广播订阅
        this.clearAllWawajiBroadcastSubscribes();

        // 关闭连接
        try {
            this.client.disconnect(250);
        } catch (e) {
            console.log(e);
        }

        this.client = null;
    }

    // 订阅主题
    this.subscribe = function(topic, callback) {
        if (this.client == null || !this.client.isConnected()) {
            return;
        }

        
        try {
            this.client.subscribe(this.broadcastTopicRoot + topic, {qos: 0});
        } catch (e) {
            console.log(e);
        }
    }

    // 取消订阅主题
    this.unSubscribe = function(topic) {
        if (this.client == null || !this.client.isConnected()) {
            return;
        }

        try {
            this.client.unsubscribe(this.broadcastTopicRoot + topic);
        } catch (e) {
            console.log(e);
        }
    }

    // 发布消息
    this.publish = function(payload) {
        if (this.client == null || !this.client.isConnected()) {
            return;
        }

        var message = JSON.stringify(payload);

        try {
            this.client.publish(this.topicRoot + "update", message, 0);
        } catch (e) {
            console.log(e);
        }

        console.log("publish: " + message);
    }

    // 发布错误
    this.publishError = function(payload) {
        if (this.client == null || !this.client.isConnected()) {
            return;
        }

        var message = JSON.stringify(payload);

        try {
            this.client.publish(this.topicRoot + "update/error", message, 0);
        } catch (e) {
            console.log(e);
        }
    }

    this.getSubscribeTopics = function() {
        var topics = JSON.parse(localStorage.getItem('subscribeTopics'));
        return (topics) ? topics : [];
    }

    this.setSubscribeTopics = function(topics) {
        localStorage.setItem('subscribeTopics', JSON.stringify(topics));
    }

    // 认证并连接到Iot服务器
    this.startUp();
    // 首先尝试取消掉对之前所有娃娃机广播的订阅，避免因为进程退出导致的无效订阅
    this.clearAllWawajiBroadcastSubscribes();

    this.setmessageArrived = function(value) {
        _messageArrived = value;
    }
}