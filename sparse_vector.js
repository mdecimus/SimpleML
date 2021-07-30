SparseVector = function(size, nz, idx, data) {
    this.size = size;
    if( nz ) {
        this.nz = nz;
        this.idx = idx;
        this.data = data;
        this.needInit = false;
    } else {
        this.needInit = true;
        //this.idx = new Int32Array(200000);
        //this.data = new Float64Array(200000);
        this.tArray = [];
        this.nz = 0;
    }
};

// TODO check performance vs sorted maps

SparseVector.prototype.put = function(i, value) {
    this.tArray[i] = value;
};

SparseVector.prototype.increment = function(i) {
    this.add(i, 1);
};

SparseVector.prototype.add = function(i, value) {
    if( i in this.tArray ) {
        this.tArray[i] += value;
    } else {
        this.tArray[i] = value;
        this.nz++;
    }
};

SparseVector.prototype.initialize = function() {
    if( this.nz > 0 ) {
        this.idx = new Int32Array(this.nz);
        this.data = new Float64Array(this.nz);
        var sortedKeys = Object.keys(this.tArray).sort(function(a,b){return a - b});
        for( var i = 0; i < this.nz; i++ ) {
            this.idx[i] = sortedKeys[i];
            this.data[i] = this.tArray[sortedKeys[i]];
        }
    }
    this.needInit = false;
    this.tArray = null;
};

SparseVector.prototype.get = function(i) {
    // Initialize
    if( this.needInit ) {
        this.initialize();
    }

    var minIndex = 0;
    var maxIndex = this.nz - 1;
    var currentIndex;
    var currentElement;

    // Binary search
    while (minIndex <= maxIndex) {
        currentIndex = (minIndex + maxIndex) / 2 | 0;
        currentElement = this.idx[currentIndex];

        if (currentElement < i) {
            minIndex = currentIndex + 1;
        } else if (currentElement > i) {
            maxIndex = currentIndex - 1;
        } else {
            return this.data[this.idx[currentIndex]];
        }
    }

    return 0;
};

DenseVector.prototype.getSize = function() {
    return this.size;
};

SparseVector.prototype.getNonZeros = function() {
    return this.nz;
};

SparseVector.prototype.getIndexes = function() {
    return this.idx;
};

SparseVector.prototype.getData = function() {
    return this.data;
};

SparseVector.prototype.dot = function(vec) {
    // Initialize
    if( this.needInit ) {
        this.initialize();
    }

    var a_idx, a_nz, a_val, b_idx, b_val, b_nz;
    if( vec.getNonZeros() > this.nz ) {
        a_idx = this.idx;
        a_val = this.data;
        a_nz = this.nz;
        b_idx = vec.getIndexes();
        b_val = vec.getData();
        b_nz = vec.getNonZeros();
    } else {
        a_idx = vec.getIndexes();
        a_val = vec.getData();
        a_nz = vec.getNonZeros();
        b_idx = this.idx;
        b_val = this.data;
        b_nz = this.nz;
    }
    //console.log(a_nz + ", " + b_nz)

    var dot = 0, j = 0;
    for( var i = 0; i < a_nz && j < b_nz; i++ ) {
        while( (j < b_nz) && (b_idx[j] < a_idx[i])) {
            j++;
        }
        if( (j < b_nz) && (a_idx[i] === b_idx[j]) ) {
            dot += a_val[i] * b_val[j];
        }
    }
    return dot;
};

SparseVector.prototype.squaredDistance = function(vec) {
    // Initialize
    if( this.needInit ) {
        this.initialize();
    }

    var a_idx = this.idx,
        a_val = this.data,
        a_nz = this.nz,
        b_idx = vec.getIndexes(),
        b_val = vec.getData(),
        b_nz = vec.getNonZeros(),
        sum = 0, i = 0, j = 0;

    while(i < a_nz && j < b_nz) {
        if(a_idx[i] == b_idx[j]) {
            var d = a_val[i++] - b_val[j++];
            sum += d*d;
        } else if(a_idx[i] > b_idx[j]) {
            sum += b_val[j] * b_val[j];
            ++j;
        } else {
            sum += a_val[i] * a_val[i];
            ++i;
        }
    }

    while(i < a_nz) {
        sum += a_val[i] * a_val[i];
        ++i;
    }

    while(j < b_nz) {
        sum += b_val[j] * b_val[j];
        ++j;
    }

    return sum;
};

SparseVector.prototype.multiply = function(vec) {
    // Initialize
    if( this.needInit ) {
        this.initialize();
    }

    var a_idx = this.idx,
        a_val = this.data,
        a_nz = this.nz,
        b_idx = vec.getIndexes(),
        b_val = vec.getData(),
        b_nz = vec.getNonZeros();

    var j = 0;
    for( var i = 0; i < a_nz; i++ ) {
        while( (j < b_nz) && (b_idx[j] < a_idx[i])) {
            j++;
        }
        if( (j < b_nz) && (a_idx[i] === b_idx[j]) ) {
            a_val[i] *= b_val[j];
        } else {
            a_val[i] = 0;
        }
    }
};

SparseVector.prototype.divide = function(vec) {
    // Initialize
    if( this.needInit ) {
        this.initialize();
    }

    var a_idx = this.idx,
        a_val = this.data,
        a_nz = this.nz,
        b_idx = vec.getIndexes(),
        b_val = vec.getData(),
        b_nz = vec.getNonZeros();

    var j = 0;
    for( var i = 0; i < a_nz; i++ ) {
        while( (j < b_nz) && (b_idx[j] < a_idx[i])) {
            j++;
        }
        if( (j < b_nz) && (a_idx[i] === b_idx[j]) ) {
            a_val[i] /= b_val[j];
        } else {
            a_val[i] = 0;
        }
    }
};

SparseVector.prototype.minus = function(vec) {
    // Initialize
    if( this.needInit ) {
        this.initialize();
    }

    var a_idx = this.idx,
        a_val = this.data,
        a_nz = this.nz,
        b_idx = vec.getIndexes(),
        b_val = vec.getData(),
        b_nz = vec.getNonZeros();

    var j = 0;
    for( var i = 0; i < a_nz; i++ ) {
        while( (j < b_nz) && (b_idx[j] < a_idx[i])) {
            j++;
        }
        if( (j < b_nz) && (a_idx[i] === b_idx[j]) ) {
            a_val[i] -= b_val[j];
        }
    }
};

SparseVector.prototype.mask = function(mask) {
    // Initialize
    if( this.needInit ) {
        this.initialize();
    }

    var a_idx = this.idx,
        a_val = this.data,
        a_nz = this.nz,
        b_idx = mask,
        b_nz = mask.length,
        j = 0;
    this.nz = 0;

    for( var i = 0; i < a_nz; i++ ) {
        while( (j < b_nz) && (b_idx[j] < a_idx[i])) {
            j++;
        }
        if( (j < b_nz) && (a_idx[i] === b_idx[j]) ) {
            a_idx[this.nz] = j;
            a_val[this.nz] = a_val[i];
            this.nz++;
        }
    }
};

SparseVector.prototype.maskDirect = function(mask) {
    // Initialize
    if( this.needInit ) {
        this.initialize();
    }

    var a_idx = this.idx,
        a_val = this.data,
        a_nz = this.nz,
        b_idx = mask,
        b_nz = mask.length,
        j = 0;

    for( var i = 0; i < a_nz; i++ ) {
        while( (j < b_nz) && (b_idx[j] < a_idx[i])) {
            j++;
        }
        if( !((j < b_nz) && (a_idx[i] === b_idx[j])) ) {
            a_val[i] = 0;
        }
    }
};

SparseVector.prototype.norm1 = function() {
    // Initialize
    if( this.needInit ) {
        this.initialize();
    }

    var norm = 0, i;
    for( i = 0; i < this.nz; i++ ) {
        norm += Math.abs(this.data[i]);
    }
    if( norm != 0 ) {
        for( i = 0; i < this.nz; i++ ) {
            this.data[i] /= norm;
        }
    }
};

SparseVector.prototype.norm2 = function() {
    // Initialize
    if( this.needInit ) {
        this.initialize();
    }

    var norm = 0, i;
    for( i = 0; i < this.nz; i++ ) {
        norm += this.data[i] * this.data[i];
    }
    if( norm != 0 ) {
        norm = Math.sqrt(norm);
        for( i = 0; i < this.nz; i++ ) {
            this.data[i] /= norm;
        }
    }
};

SparseVector.prototype.argmax = function() {
    var result = -1, maxVal = 0;
    for( var i = 0; i < this.nz; i++ ) {
        if( result == -1 || this.data[i] > maxVal ) {
            result = i;
            maxVal = this.data[i];
        }
    }
    return this.idx[result];
};

SparseVector.prototype.average = function() {
    var result = 0;
    for( var i = 0; i < this.nz; i++ ) {
        result += this.data[i];
    }
    return result / this.nz;
};

