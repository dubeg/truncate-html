function repeatString(pattern, count) {
    if (count < 1) return '';
    var result = '';
    while (count > 1) {
        if (count & 1) result += pattern;
        count >>= 1, pattern += pattern;
    }
    return result + pattern;
}

var NodeType = {
	TEXT: 1,
	TAG: 2
}

var Status = {
	VALID: 1,   // 
	IGNORED: 2, // Ignore tags and content.
	INVALID: 3  // Ignore tags.
	// Note on invalid block tags:
	// perhaps replace the tag with 'p' ?
}

function Node(tag, name, type)
{
	this.tag = tag 
	this.name = name
	this.type = type
	this.text = ''
	this.parent = null
	this.isVoid = false
	this.isRoot = false
	this.nodes = []
	this.status = Status.VALID
}
Node.prototype = {
	// ---------------------------------------------------------
	// AddChild
	// ---------------------------------------------------------
	addChild : function(node)
	{
		this.nodes.push(node);
		node.parent = this;
	},
	// ---------------------------------------------------------
	// ToString
	// ---------------------------------------------------------
	toString: function(level)
	{
		let prefix = ""
		if(level > 0) prefix = repeatString("  ", level)
		let result = ""
		// Overwrite default value.
		if(this.status !== Status.IGNORED)
		{
			switch(this.type)
			{
				case NodeType.TEXT:
					console.log(prefix + this.text)
					result = this.text;
					break;
				case NodeType.TAG:
					// opening
					let tagStart = ""
					let tagEnd = ""

					if(!this.isRoot && this.status !== Status.INVALID)
					{
						tagStart = this.tag
						if(!this.isVoid)
							tagEnd = "</" + this.name + ">";
					}

					if(tagStart.trim().length > 0) console.log(prefix + tagStart)
					result = tagStart

					for (var i = 0; i < this.nodes.length; i++)
						result += this.nodes[i].toString(level + 1);

					if(tagEnd.length > 0) console.log(prefix + tagEnd)
					result += tagEnd
					break;
			}
		}
		return result;
	}
};

var parser = {
	// ---------------------------------------------------------
	// Parse 
	// ---------------------------------------------------------
	parse: function(htmlString) {
		var MODE_TEXT = 0
		var MODE_TAG = 1

		var root = new Node('<root>', 'root', NodeType.TAG)
		root.isRoot = true

		var state = {
			mode: MODE_TEXT,
			currentNode: root,
			buffer: '',
			paragraphCount: 0,
			wordCount: 0,
			characterCount: 0
		}
		var result = "";
		var c = ''
		for(var i = 0; i < htmlString.length; ++i)
		{
			c = htmlString[i]
			switch(state.mode)
			{
				case MODE_TEXT:
					if( c === "<")
					{
						console.log("Parsing: " + state.buffer)
						this.flush(state)
						state.mode = MODE_TAG;
						state.buffer += c;
					}
					else
					{
						state.buffer += c;
					}
					break;
				case MODE_TAG:
					state.buffer += c;
					if( c === ">")
					{
						console.log("Parsing: " + state.buffer)
						this.parseTag(state);
						state.mode = MODE_TEXT;
						state.buffer = "";
					}
					break;
			}
		}
		this.flush(state);
		result += root.toString(-1);
		return result;
	},
	// ---------------------------------------------------------
	// Flush
	// ---------------------------------------------------------
	flush: function(state) {
		if(state.buffer.trim().length > 0)
		{
			// TODO: count words/chars.
			// if state.currentNode.isAllowed:
			// 		countWords(state.buffer)
			//      countChars(state.buffer)
			let node = new Node(state.buffer, '', NodeType.TEXT);
			node.text = state.buffer;
			state.currentNode.addChild(node);
		}
		state.buffer = '';
	},
	// ---------------------------------------------------------
	// ParseTag
	// ---------------------------------------------------------
	parseTag: function(state) 
	{
		let node = state.currentNode;
		let tag = state.buffer;
		let tagName = this.getNameOfTag(tag)

		// </..>
		if(this.tagIsClosing(tag))
		{
			if(tagName == node.name)
			{
				if(node.status !== Status.IGNORED)
					state.paragraphCount += 1;

				state.currentNode = node.parent
			}
			else
			{
				// Ignore tag.
			}
		}
		// <..>
		else
		{
			let newNode = new Node(tag, tagName, NodeType.TAG, '')

			if(!this.tagIsAllowed(tagName)) 
			{
				newNode.status = Status.INVALID;
			}
			else if(this.tagIsIgnored(tagName))
			{
				newNode.status = Status.IGNORED;
			}
			
			if(this.tagIsVoid(tag, tagName))
			{
				newNode.isVoid = true
				node.addChild(newNode)
			}
			else
			{
				node.addChild(newNode)
				state.currentNode = newNode
			}
		}
	},

	// ====================================================

    _rgxNameOfTag : new RegExp(/<\/?([a-zA-Z0-9\:\-\_]+)/),
    getNameOfTag : function(tag) {
        var result = this._rgxNameOfTag.exec(tag);
        return result === null ? "" : result[1];
    },
    ALLOWED_ELEMENTS : 
        [
        "a", "abbr", "b", "bdi", "bdo", "blockquote", "br", "cite", "code", "data", "dd", "del"
        , "dfn", "dl", "dt", "em", "i", "ins", "kbd", "mark", "p", "pre", "q", "rp"
        , "rt", "rtc", "ruby", "s", "samp", "small", "span", "sub", "sup", "time", "u"
        , "var", "wbr"
        , "ul", "ol", "li",  //"strong"
        //, "h2"
        ],
    IGNORED_ELEMENTS :
        [
            "area", "audio", "map", "track", "video",// Multimedia
            "embed", "object", "param", "source",// Embedded content
            "canvas", "noscript", "script",// Scripting
            "iframe", "style"// Others
        ],
    PARAGRAPH_ELEMENTS :
        [
            "ul", "ol", "p", "pre", "code", "blockquote",
            "h1", "h2", "h3", "h4", "h5", "h6"
        ],      
    VOID_ELEMENTS :  
        [
        "area", "base", "br", "col", "command", "embed", "hr", "img", "input",
        "keygen", "link", "meta", "param", "source", "track", "wbr"
        ],    
    isKeyInArray : function(key, array) { 
        return array.indexOf(key) > -1 ? true : false; 
    },    
    tagIsParagraph : function(tagName) { 
            return this.isKeyInArray(tagName, this.PARAGRAPH_ELEMENTS); 
    },
    tagIsIgnored : function(tagName) { 
        return this.isKeyInArray(tagName, this.IGNORED_ELEMENTS); 
    },
    tagIsAllowed : function(tagName) { 
        return this.isKeyInArray(tagName, this.ALLOWED_ELEMENTS); 
    },
    tagIsClosing : function(tag) 
    {
        return tag.startsWith("</");
    },
    tagIsVoid : function(tag, tagName) 
    {
        return tag.endsWith("/>") || this.isKeyInArray(tagName, this.VOID_ELEMENTS);
    },    
}