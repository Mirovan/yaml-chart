export function notNull(obj) {
    return obj !== undefined && obj != null;
}

export function isNull(obj) {
    return obj === undefined || obj == null;
}


/*
* Преобразовывает рекурсивно объект в Map с вложенными объектам
* */
export function toMap(objects) {
    let map = new Map(Object.entries(objects));
    for (let key of map.keys()) {
        if (map.get(key).objects != null) {
            map.get(key).objects = toMap(map.get(key).objects);
        }
    }
    return map;
}