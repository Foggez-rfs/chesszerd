export class TranspositionTable {
    constructor(size = 1000000) {
        this.table = new Map();
    }
    get(key) { return this.table.get(key); }
    set(key, value, depth) { this.table.set(key, { value, depth }); }
}
