export class Mtree {
    constructor(
        root,
        intermediateHashes,
        index) {
        this.root = root;
        this.intermediateHashes = intermediateHashes;
        this.index = index;
        this.direction = ((idx) => {
            let decStr = idx.toString(16);
            return decStr.substring(0, decStr.length).padStart(32, '0');
        })(this.index);
    }

    toJson() { return JSON.stringify(this, null, 2); }


    toIntermediateHashesJson() {
        let intermediateHashesJson = {};
        for (const [i, e] of this.intermediateHashes.entries()) {
            intermediateHashesJson[i.toString()] = e;
        }
        return intermediateHashesJson;
    }

    static fromJson(merkleTreeDataJson) {
        const dataJson = JSON.parse(merkleTreeDataJson);
        return new Mtree(
            dataJson.root,
            dataJson.intermediateHashes,
            dataJson.index
        );
    }
}

const mtree = (root, intermediateHashes, index) => {
    return new Mtree(root, intermediateHashes, index);
};

export default mtree;