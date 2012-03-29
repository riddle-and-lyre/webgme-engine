define(['./clientquery.js', './clientstorage.js', '/socket.io/socket.io.js'], function(QU, ST){
	var Project = function(projid) {
		this.id = projid;
		this.queries = {};
		this.querycount = 0;
		this.storage = new ST(this);
		this.socket = undefined;
	};

	Project.prototype.open = function () {
		this.storage.clear();
		this.socket = io.connect();
		var that = this;
		this.socket.on('connect', that.onOpen);
		this.socket.on('error', that.onError);
		this.socket.on('updateObjects', function(msg){
			var objectmatrix = {};
			for(var i in msg.objects){
				that.storage.set(msg.objects[i].object);
				for(var j in msg.objects[i].querylist){
					if(objectmatrix[msg.objects[i].querylist[j]] == undefined){
						objectmatrix[msg.objects[i].querylist[j]] = [];
					}
					objectmatrix[msg.objects[i].querylist[j]].push(msg.objects[i].id);
				}
			}
			for(var i in objectmatrix){
				that.queries[i].onRefresh(objectmatrix[i]);
			}
		});
	};
	
	Project.prototype.onOpen = function() {
	};
	
	Project.prototype.close = function () {
	};

	Project.prototype.onError = function(reason){
		console.log("something went wrong because: "+reason);
	};
	/**
 	* Query handling functions
 	*/
	Project.prototype.createQuery = function() {
		var newquery = new QU(this,"q_"+(++this.querycount));
		this.queries[newquery.id] = newquery;
		return newquery;
	};
	Project.prototype.deleteQuery = function(queryid) {
		delete this.queries[queryid];
	};
	Project.prototype.getQueries = function() {
	};
	
	/*storage functions*/
	Project.prototype.getNode = function(nodeid){
		return this.storage.get(nodeid);
	};
	Project.prototype.setNode = function(node){
		if(node !== undefined){
			if(node._id === undefined){
				var date = new Date();
				node._id  = date.getFullYear().toString()+date.getMonth().toString()+date.getDate().toString();
				node._id += date.getHours().toString()+date.getMinutes().toString()+date.getSeconds().toString()+date.getMilliseconds().toString(); 
			}
			var message = {};
			message.objects = [];
			var msgitem = {}; msgitem.id = node._id; msgitem.object = node;
			message.objects.push(msgitem);
			this.storage.set(node);
			this.socket.emit('updateObjects', message);
			return node._id;
		}
		else{
			return undefined;
		}
	}
	Project.prototype.delNode = function(node){
		this.storage.del(node._id || node);
	}
	
	/*
	 * Event functions
	 */
	Project.prototype.onQueryChange = function(queryid){
		/*
		 * currently this event shoots only in case of extension of the query
		 * as the client keep all objects and try to keep them up-to-date
		 */
		var querymessage = this.queries[queryid].get();
		if(this.socket !== undefined && querymessage !== undefined){
			this.socket.emit('updateQuery', querymessage);
		}	
	}

	return Project;
});