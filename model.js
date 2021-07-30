
Model = function() {
    this.operations = [];
    this.variables = 0;
    this.inputs = 0;
    this.output = 0;
};

Model.prototype.load = function(stream) {
    // Obtain version
    stream = new DataStream(stream);
    var version = stream.readUint8();
    if( version !== 1 ) {
        throw new SimpleMLException("Unsupported model version " + version + ".");
    }

    // Supported operations
    var operations = {
        0: DeclareVector,
        1: DeclareInput,
        2: TextVectorizer,
        3: NumberEncoder,
        4: OneHotEncoder,
        5: LinearModel,
        6: SVM,
        7: DecisionTree,
        8: null,
        9: Multiply,
        10: Norm,
        11: Mask,
        12: Average,
        13: Divide,
        14: Minus
    };

    while( !stream.isEOF() ) {
        var opCode = stream.readUint8();
        console.log("Read op: " + opCode);
        var op = new operations[opCode](stream);
        if( opCode < 2 ) {
            this.variables++;
            if( opCode === 1 ) {
                this.inputs++;
            } else if( op.isOutput() ) {
                this.output = op;
            }
        }
        this.operations.push(op);
    }

};

Model.prototype.execute = function(arguments) {
    var hasKeys = false;
    var objectType = Object.prototype.toString.call(arguments[0]).slice(8, -1).toLowerCase();
    if( arguments.length === 1 && this.inputs > 1 && (objectType === 'object' || objectType === 'array')) {
        arguments = arguments[0];
        hasKeys = (objectType === 'object');
    } else if( arguments.length !== this.inputs ) {
        throw new SimpleMLException("Insufficient arguments provided, expecting " + this.inputs + "." );
    }

    // Setup sandbox
    var sandbox = {
        vars: new Array(this.variables),
        input: arguments,
        inputHasKeys: hasKeys
    };

    // Run model
    //console.log("Will execute "+this.operations.length + " ops.");
    for( i = 0; i < this.operations.length; i++ ) {
        //console.time('op'+i);
        this.operations[i].execute(sandbox);
        //console.timeEnd('op'+i);
    }

    // Return model results
    return this.output.getOutput(sandbox);
};

loadMatrix = function(model) {
    var isSparse = (model.readUint8() === 1),
        rows = model.readUint32(),
        cols = model.readUint32();
    //console.log(isSparse + " Rows " + rows + ", cols " + cols);
    var matrix = new Array(rows);
    for( var i = 0; i < rows ; i++ ) {
        var nz;
        matrix[i] = isSparse ? new SparseVector(cols,
                                                nz = model.readUint32(),
                                                model.readUint32Array(nz),
                                                model.readFloat64Array(nz)) :
                               new DenseVector(cols, model.readFloat64Array(cols));
    }
    return matrix;
};
