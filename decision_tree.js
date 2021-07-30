
DecisionTree = function(model) {
    this.sourceIdx = model.readUint16();
    this.targetIdx = model.readUint16();
    this.targetArrayOffset = model.readUint16();
    this.classes = model.readUint16();
    var i = 0, size = model.readUint32();
    this.tree = new Float64Array(size);
    while( i < size ) {
        this.tree[i++] = model.readUint32(); // Left node
        if( this.tree[i-1] == 0 ) {
            for( var c = 0; c < this.classes; c++ )
                this.tree[i++] = model.readFloat64();
        } else {
            this.tree[i++] = model.readUint32(); // Right node
            this.tree[i++] = model.readUint32();  // Feature index
            this.tree[i++] = model.readFloat64(); // Threshold
        }
    }
};

DecisionTree.prototype.execute = function(sandbox) {
    var inputArray = sandbox.vars[this.sourceIdx],
        targetArray = sandbox.vars[this.targetIdx];
    var i = 0;
    while( this.tree[i] != 0 )
        i = this.tree[i + (inputArray.get(this.tree[i+2]) > this.tree[i+3] ? 1 : 0)];

    for( var j = 0; j < this.classes; j++ )
        targetArray.add(this.targetArrayOffset+j, this.tree[i+j+1]);
};

