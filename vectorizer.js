/*
 * Vectorizer functions
 */

TextVectorizer = function(model) {
    this.sourceIdx = model.readUint16();
    this.targetIdx = model.readUint16();
    this.offset = model.readUint16();

    this.nGramMin = model.readUint8();
    this.nGramMax = model.readUint8();

    var flags = model.readUint8();
    var hashing = Math.pow(2, model.readUint8());

    this.stopWords = model.readUtf8StringArray();

    // Create tokenizer
    if( flags & 0x01 ) {
        var re = /\b\w\w+\b/g;  // TODO handle unicode
        this.tokenizer = function (string) {
            return string.match(re);
        };
    } else if( flags & 0x02 ) {
        this.tokenizer = function(string) {


        };
    } else if( flags & 0x04 ) {
        var re = RegExp(model.readUtf8String());
        this.tokenizer = function(string) {
            return string.match(re);
        };
    }
    this.lowercase = (flags & 0x08) != 0;

    // Create hashing function
    if( hashing == 0 ) {
        var dict = model.readUtf8StringArray();
        this.hashFnc = function(token) {
            return dict.indexOf(token);
        };
    } else {
        this.hashFnc = function(token) {
            return Math.abs(ToInt32(murmurhash3_32_gc(token, 0))) % hashing;
        };
    }

};

function ToInt32(uint32) { //TODO use signed always
    if (uint32 >= Math.pow(2, 31)) {
        return uint32 - Math.pow(2, 32)
    } else {
        return uint32;
    }
}

TextVectorizer.prototype.execute = function(sandbox) {

    var sourceString = sandbox.vars[this.sourceIdx];
    if( !sourceString || sourceString.length == 0 ) {
        return;
    }

    var targetVector = sandbox.vars[this.targetIdx];

    var m = this.tokenizer(this.lowercase ? sourceString.toLowerCase() : sourceString), i = 0, mLen;
    if( this.stopWords ) {
        mLen = 0;
        for( i = 0; i < m.length; i++ ) {
            if( this.stopWords.indexOf(m[i]) == -1 ) {
                if (i !== mLen) {
                    m[mLen] = m[i];
                }
                mLen++;
            }
        }
    } else {
        mLen = m.length;
    }

    if( this.nGramMax > 1 ) {
        var iMax = Math.min(this.nGramMax + 1, mLen + 1);
        var tokenCount = 0;
        for( i = this.nGramMin; i < iMax; i++ ) {
            for( j = 0; j < mLen - i + 1; j++ ) {
                // Calculate token index
                var token = "";
                for( var n = j; n < i+j; n++ ) {
                    if( token )
                        token += " ";
                    token += m[n];
                }


                var index = this.hashFnc(token);
                if( index >= 0 ) {
                    // Add token counts to target vector
                    targetVector.increment(index + this.offset);
                    tokenCount += 1;
                }
            }
        }

    } else {
        for( i = 0; i < tokens.length; i++ ) {
            // Calculate token index
            var index = this.hashFnc(tokens[i]);
            if( index >= 0 ) {
                // Add token counts to target vector
                targetVector.increment(index + this.offset);
            }
        }
    }

};

OneHotEncoder = function(model) {
    this.sourceIdx = model.readUint16();
    this.targetIdx = model.readUint16();
    var offset = model.readUint16();
    var doSplit = (model.readUint8() & 0x01) !== 0;
    var hashing = model.readUint8();

    // Create hashing function
    var hashFnc;
    if( hashing === 0 ) {
        var dict = model.readUtf8StringArray();
        hashFnc = function(token) {
            return dict.indexOf(token);
        };
    } else {
        hashing = Math.pow(2, hashing);
        hashFnc = function(token) {
            return murmurhash3_32_gc(token, 0) % hashing;
        };
    }

    // Create tokenizer
    if( doSplit ) {
        this.vectorFnc = function(str, target) {
            var w = str.split();
            for( var i = 0; i < w.length; i++ ) {
                // Calculate token index
                var index = hashFnc(w[i]);
                //console.log(w[i] + ": " );
                if( index >= 0 ) {
                    // Add token counts to target vector
                    targetVector.increment(index + (index + offset));
                }
            }
        }
    } else {
        this.vectorFnc = function(str, targetVector) {
            // Calculate token index
            var index = hashFnc(str);
            //console.log(str + ":: " + (index ));
            if( index >= 0 ) {
                // Add token counts to target vector
                targetVector.increment(index + offset);
            }
        }
    }
};

OneHotEncoder.prototype.execute = function(sandbox) {
    var sourceString = sandbox.vars[this.sourceIdx];
    if( !sourceString || sourceString.length == 0 ) {
        return;
    }
    this.vectorFnc(sourceString, sandbox.vars[this.targetIdx]);
};

NumberEncoder = function(model) {
    this.sourceIdx = model.readUint16();
    this.targetIdx = model.readUint16();
    this.offset = model.readUint16();
    var hashing = Math.pow(2, model.readUint8());
    //TODO implement hashing
};

NumberEncoder.prototype.execute = function(sandbox) {
    //console.log(this.offset + "> " + sandbox.vars[this.sourceIdx]);
    sandbox.vars[this.targetIdx].put(this.offset, sandbox.vars[this.sourceIdx]);
};

