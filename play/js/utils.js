export class Utils {
    static deepFreeze(obj) {
        Object.freeze(obj);
        for (const value of Object.values(obj)) {
            if (value && typeof value === 'object') {
                Utils.deepFreeze(value);
            }
        }
        return obj;
    }
}