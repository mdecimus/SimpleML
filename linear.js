LinearModel = function(model) {
    this.sourceIdx = model.readUint16();
    this.targetIdx = model.readUint16();
    this.targetArrayOffset = model.readUint16();
    this.classes = model.readUint16();
    this.intercept = model.readFloat64Array(this.classes);
    this.coef = loadMatrix(model);
};

LinearModel.prototype.execute = function(sandbox) {
    var targetArray = sandbox.vars[this.targetIdx],
        sourceArray = sandbox.vars[this.sourceIdx];
    for( var i = 0; i < this.classes; i++ )
        targetArray.add(this.targetArrayOffset+i, sourceArray.dot(this.coef[i]) + this.intercept[i] );
};
