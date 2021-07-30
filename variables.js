
DeclareVector = function(model) {
    var FL_SPARSE = 0x01,
        FL_HAS_DEFAULTS = 0x02,
        FL_IS_OUTPUT = 0x04,
        FL_CLASSIFY = 0x08;

    this.index = model.readUint16();
    var flags = model.readUint8();
    var size = model.readUint32();
    this.output = (flags & FL_IS_OUTPUT) != 0;

    if( !(flags & FL_SPARSE ) ) {
        if( flags & FL_HAS_DEFAULTS ) {
            var defaults = model.readFloat64Array(size);
            this.vFnc = function() {
                var result = new Float64Array(size);
                result.set(defaults);
                return new DenseVector(size, result);
            };
        } else {
            this.vFnc = function() { return new DenseVector(size); };
        }
    } else {
        this.vFnc = function() { return new SparseVector(size); };
    }

    if( this.output ) {
        var index = this.index;
        if( flags & FL_CLASSIFY ) { // Classifier
            var dict = model.readUtf8StringArray();
            if( dict ) {
                if( size == 1 ) {
                    this.outFnc = function(sandbox) {
                        return dict[sandbox.vars[index].get(0) > 0 ? 1 : 0];
                    };
                } else {
                    this.outFnc = function(sandbox) {
                        return dict[sandbox.vars[index].argmax()];
                    };
                }
            } else {
                if( size == 1 ) {
                    this.outFnc = function(sandbox) {
                        return sandbox.vars[index].get(0) > 0 ? 1 : 0;
                    };
                } else {
                    this.outFnc = function(sandbox) {
                        return sandbox.vars[index].argmax();
                    };
                }
            }
        } else { // Regressor
            this.outFnc = function(sandbox) {
                return sandbox.vars[index].get(0);
            };
        }
    }
};

DeclareVector.prototype.execute = function(sandbox) {
    sandbox.vars[this.index] = this.vFnc();
};

DeclareVector.prototype.getOutput = function(sandbox) {
    return this.outFnc(sandbox);
};

DeclareVector.prototype.isOutput = function(sandbox) {
    return this.output;
};

DeclareInput = function(model) {
    var FMT_FLOAT64 = 0,
        FMT_STRING = 1,
        FMT_VECTOR = 2;
    var index = model.readUint16(),
        vt = model.readUint8();
    this.inputIdx = model.readUint16();
    this.inputName = model.readUtf8String();

    if( vt === FMT_FLOAT64 ) {
        var inputDefault = model.readFloat64();
        this.inputFnc = function(sandbox, value) {
            if( value == null || value == undefined || isNaN(value) )
                value = inputDefault;
            sandbox.vars[index] = value;
        };

    } else if( vt === FMT_STRING ) {
        var inputDefault = model.readUtf8String();
        this.inputFnc = function(sandbox, value) {
            if( !value )
                value = inputDefault;
            sandbox.vars[index] = value;
        };
    } else if( vt === FMT_VECTOR ) {
        var size = model.readUint32();
        this.inputFnc = function(sandbox, value) {
            if( !value || value.length !== size )
                throw new SimpleMLException("Expecting an array of size " + size + " as input, got "
                                            + (value ? value.length : "nothing") + ".");
            sandbox.vars[index] = new DenseVector(size, new Float64Array(value));
        };
    }
};

DeclareInput.prototype.execute = function(sandbox) {
    this.inputFnc(sandbox, sandbox.inputHasKeys ? sandbox.input[this.inputName] :
                                                  sandbox.input[this.inputIdx]);
};


