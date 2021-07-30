/**
 * SimpleML Model Evaluator
 */

SimpleMLException = function (message) {
    this.message = message;
    this.name = "SimpleMLException";
};

SimpleMLException.prototype = new Error();


SimpleML = function() {
    this.model = null;
};

SimpleML.prototype.loadModel = function(url, callback) {
    var oReq = new XMLHttpRequest(), oSML = this;
    oReq.open("GET", url, true);
    oReq.responseType = "arraybuffer";

    oReq.onload = function (oEvent) {
        var arrayBuffer = oReq.response;
        if (arrayBuffer) {
            oSML.model = new Model();
            oSML.model.load(arrayBuffer);
            if( callback ) {
                callback();
            }
        } else {
            throw new SimpleMLException("Failed to download model '" + url + "'.");
        }
    };
    oReq.onreadystatechange = function(oEvent) {
       // TODO handle 404
    };

    oReq.send(null);

};

SimpleML.prototype.predict = function() {
    if( this.model ) {
        return this.model.execute(arguments);
    } else {
        throw new SimpleMLException("No model was loaded, please use SimpleML.loadModule('...') first.");
    }
};




