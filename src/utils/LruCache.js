class LruCache {
	constructor(max) {
		this.max = max;
		
		this.items = {};
		this.count = 0;
		this.lru = null;
		this.mru = null;
	}
	
	has(key) {
		return this.items[key];
	}
	
	get(key) {
		return this.items[key].value;
	}
	
	set(key, value) {
		let item = {
			key,
			value,
			next: null,
		};
		
		this.items[key] = item;
		this.count++;
		
		if (!this.lru) {
			this.lru = item;
		}
		
		if (this.mru) {
			this.mru.next = item;
		}
		
		this.mru = item;
		
		if (this.count > this.max) {
			delete this.items[this.lru.key];
			this.count--;
			
			this.lru = this.lru.next;
		}
	}
}

module.exports = LruCache;
