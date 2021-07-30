Norm = function(model) {
    targetIdx = model.readUint16();
    this.normFnc = ( model.readUint8() == 2 ) ?
        function(vars) {
            vars[targetIdx].norm2();
        } :
        function(vars) {
            vars[targetIdx].norm1();
        };
};

Norm.prototype.execute = function(sandbox) {
    this.normFnc(sandbox.vars);
};

Multiply = function(model) {
    this.targetIdx = model.readUint16();
    this.vector = loadMatrix(model)[0];
};

Multiply.prototype.execute = function(sandbox) {
    sandbox.vars[this.targetIdx].multiply(this.vector);
};

Divide = function(model) {
    this.targetIdx = model.readUint16();
    this.vector = loadMatrix(model)[0];
};

Divide.prototype.execute = function(sandbox) {
    sandbox.vars[this.targetIdx].divide(this.vector);
};

Minus = function(model) {
    this.targetIdx = model.readUint16();
    this.vector = loadMatrix(model)[0];
};

Minus.prototype.execute = function(sandbox) {
    sandbox.vars[this.targetIdx].minus(this.vector);
};

Mask = function(model) {
    this.targetIdx = model.readUint16();
    this.mask = model.readUint32Array(model.readUint32());
};

Mask.prototype.execute = function(sandbox) {
    sandbox.vars[this.targetIdx].mask(this.mask);
};

Average = function(model) {
    this.targetIdx = model.readUint16();
    this.sourceIdx = model.readUint16();
};

Average.prototype.execute = function(sandbox) {
    sandbox.vars[this.targetIdx].put(0, sandbox.vars[this.sourceIdx].average() );

};
