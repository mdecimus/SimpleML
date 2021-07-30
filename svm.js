SVM = function(model) {
    var sourceIdx = model.readUint16(),
        targetIdx = model.readUint16(),
        targetArrayOffset = model.readUint16(),
        decisionFunction;
    var SVM_LINEAR = 0x01,
        SVM_POLY = 0x02,
        SVM_RBF = 0x04,
        SVM_SIGMOID = 0x08,
        SVM_ONE_CLASS = 0x10;

    var flags = model.readUint8();

    if( flags & SVM_LINEAR ) {
        decisionFunction = function (a, b) {
            return a.dot(b);
        };
    } else if( flags & SVM_POLY ) {
        var gamma = model.readFloat64();
        var degree = model.readFloat64();
        var coef0 = model.readFloat64();
        decisionFunction = function(a, b) {
            return Math.pow(gamma * a.dot(b) + coef0, degree);
        };
    } else if( flags & SVM_RBF ) {
        var gamma = model.readFloat64();
        decisionFunction = function(a, b) {
            return Math.exp(-gamma * a.squaredDistance(b));
        };
    } else if( flags & SVM_SIGMOID ) {
        var gamma = model.readFloat64();
        var coef0 = model.readFloat64();
        decisionFunction = function(a, b) {
            var x = gamma * a.dot(b) + coef0;
            return (Math.exp(x) - Math.exp(-x)) / (Math.exp(x) + Math.exp(-x));
        };
    }

    var SV = loadMatrix(model),
        coef = loadMatrix(model),
        intercept = model.readFloat64Array(model.readUint16());

    if( (flags & SVM_ONE_CLASS) == 0 ) {
        var classes = model.readUint16(),
            nSV = model.readUint32Array(classes),
            l = SV.length,
            kvalue = new Float64Array(l),
            start = new Uint32Array(classes);

        // Calculate start values
        start[0] = 0;
        for(var i=1; i < classes; i++)
            start[i] = start[i-1] + nSV[i-1];

        this.svmFunc = function(sandbox) {
            var targetArray = sandbox.vars[targetIdx],
                sourceArray = sandbox.vars[sourceIdx];

            for( i = 0; i < l ; i++ ) {
                kvalue[i] = decisionFunction(sourceArray, SV[i]);
            }

            var i = 0, j, k, p=0;
            for( i = 0 ; i < classes ; i++ ) {
                for( j = i + 1 ; j < classes; j++ ) {
                    var sum = 0,
                        si = start[i],
                        sj = start[j],
                        ci = nSV[i],
                        cj = nSV[j];

                    var coef1 = coef[j-1],
                        coef2 = coef[i];
                    for( k = 0; k < ci ; k++ )
                        sum += coef1.get(si+k) * kvalue[si+k];
                    for(k=0;k<cj;k++)
                        sum += coef2.get(sj+k) * kvalue[sj+k];

                    targetArray.increment(targetArrayOffset + ((sum + intercept[p++] > 0 )?i:j) );
                }
            }
        }
    } else {
        var sv_coef = coef[0], l = SV.length;
        this.svmFunc = function(sandbox) {
            var targetArray = sandbox.vars[targetIdx],
                sourceArray = sandbox.vars[sourceIdx];

            var sum = 0;
            for(i=0;i< SV.length;i++)
                sum += sv_coef.get(i) * decisionFunction(sourceArray, SV[i]);
            targetArray.put(targetArrayOffset, sum + intercept[0]);
        }
    }

};

SVM.prototype.execute = function(sandbox) {
    this.svmFunc(sandbox);
};

