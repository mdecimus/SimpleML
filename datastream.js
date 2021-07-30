
DataStream = function(arrayBuffer) {
    //this.buffer = arrayBuffer;
    this.bufferLength = arrayBuffer.byteLength;
    this.uint8buffer = new Uint8Array(arrayBuffer, 0, this.bufferLength);
    this.dv = new DataView(arrayBuffer, 0, this.bufferLength);
    this.pos = 0;
};

DataStream.prototype.readUint32Array = function(length) {
    var result = new Uint32Array(length);
    for( var i = 0; i < length; i++ ) {
        result[i] = this.readUint32();
    }
    return result;
};

DataStream.prototype.readFloat64Array = function(length) {
    var result = new Float64Array(length);
    for( var i = 0; i < length; i++ ) {
        result[i] = this.readFloat64();
    }
    return result;
};

DataStream.prototype.readUint8 = function() {
    var result = this.dv.getUint8(this.pos, true);
    this.pos++;
    return result;
};

DataStream.prototype.readUint16 = function() {
    var result = this.dv.getUint16(this.pos, true);
    this.pos += 2;
    return result;
};

DataStream.prototype.readUint32 = function() {
    var result = this.dv.getUint32(this.pos, true);
    this.pos += 4;
    return result;
};

DataStream.prototype.readFloat64 = function() {
    var result = this.dv.getFloat64(this.pos, true);
    this.pos += 8;
    return result;
};

DataStream.prototype.readFloat32 = function() {
    var result = this.dv.getFloat32(this.pos, true);
    this.pos += 4;
    return result;
};

DataStream.prototype.readUtf8String = function () {
    var out, c;
    var char2, char3;

    out = "";
    while( (c = this.uint8buffer[this.pos++]) != 0 ) {
        switch(c >> 4) {
            case 0: case 1: case 2: case 3: case 4: case 5: case 6: case 7:
                // 0xxxxxxx
                out += String.fromCharCode(c);
                break;
            case 12: case 13:
                // 110x xxxx   10xx xxxx
                char2 = this.uint8buffer[this.pos++];
                out += String.fromCharCode(((c & 0x1F) << 6) | (char2 & 0x3F));
                break;
            case 14:
                // 1110 xxxx  10xx xxxx  10xx xxxx
                char2 = this.uint8buffer[this.pos++];
                char3 = this.uint8buffer[this.pos++];
                out += String.fromCharCode(((c & 0x0F) << 12) |
                    ((char2 & 0x3F) << 6) |
                    ((char3 & 0x3F) << 0));
                break;
        }
    }

    return out;
};

DataStream.prototype.readUtf8StringArray = function () {
    len = this.readUint32();
    if( len > 0 ) {
        result = new Array(len);
        for( var i = 0; i < len; i++ ) {
            result[i] = this.readUtf8String();
        }
        return result;
    } else {
        return null;
    }
};

DataStream.prototype.isEOF = function () {
    return this.pos >= this.bufferLength;
};
