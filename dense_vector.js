
DenseVector = function(size, array) {
    this.size = size;
    this.data = (array) ? array : new Float64Array(size);
};

DenseVector.prototype.getSize = function() {
    return this.size;
};

DenseVector.prototype.getData = function() {
    return this.data;
};

DenseVector.prototype.put = function(i, value) {
    this.data[i] = value;
};

DenseVector.prototype.add = function(i, value) {
    this.data[i] += value;
};

DenseVector.prototype.increment = function(i) {
    this.data[i]++;
};

DenseVector.prototype.get = function(i) {
    return this.data[i];
};

DenseVector.prototype.dot = function(vec) {
    var result = 0;
    for( var i = 0; i < this.size; i++ )
        result += this.data[i] * vec.get(i);
    return result;
};

DenseVector.prototype.squaredDistance = function(vec) {
    var result = 0;
    for( var i = 0; i < this.size; i++ ) {
        var diff = this.data[i] - vec.get(i);
        result += diff * diff;
    }
    return result;
};

DenseVector.prototype.multiply = function(vec) {
    for( var i = 0; i < this.size; i++ )
        this.data[i] *= vec.get(i);
};

DenseVector.prototype.divide = function(vec) {
    for( var i = 0; i < this.size; i++ )
        this.data[i] /= vec.get(i);
};

DenseVector.prototype.minus = function(vec) {
    for( var i = 0; i < this.size; i++ )
        this.data[i] -= vec.get(i);
};

DenseVector.prototype.mask = function(mask) {
    var j = 0, maskLen = mask.length;
    this.size = 0;
    for( var i = 0; i < this.size; i++ ) {
        while( (j < maskLen) && (mask[j] < i) )
            j++;
        if( (j < maskLen ) && (i === mask[j]) ) {
            this.data[this.size] = this.data[i];
            this.size++;
        }
    }
};

DenseVector.prototype.maskDirect = function(mask) {
    var j = 0, maskLen = mask.length;
    for( var i = 0; i < this.size; i++ ) {
        while( (j < maskLen) && (mask[j] < i) )
            j++;
        if( !((j < maskLen ) && (i === mask[j])) ) {
            this.data[i] = 0;
        }
    }
};

DenseVector.prototype.norm1 = function() {
    var norm = 0, i;
    for( i = 0; i < this.size; i++ ) {
        norm += Math.abs(this.data[i]);
    }
    if( norm != 0 ) {
        for( i = 0; i < this.size; i++ ) {
            this.data[i] /= norm;
        }
    }
};

DenseVector.prototype.norm2 = function() {
    var norm = 0, i;
    for( i = 0; i < this.size; i++ ) {
        norm += this.data[i] * this.data[i];
    }
    if( norm != 0 ) {
        norm = Math.sqrt(norm);
        for( i = 0; i < this.size; i++ ) {
            this.data[i] /= norm;
        }
    }
};

DenseVector.prototype.argmax = function() {
    var result = -1, maxVal = 0;
    for( var i = 0; i < this.size; i++ ) {
        if( result === -1 || this.data[i] > maxVal ) {
            result = i;
            maxVal = this.data[i];
        }
    }
    return result;
};

DenseVector.prototype.average = function() {
    var result = 0;
    for( var i = 0; i < this.size; i++ ) {
        result += this.data[i];
    }
    return result / this.size;
};

