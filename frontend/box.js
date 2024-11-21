import * as Func from "./functions";
import Konva from "konva";

const defaultBoxWidth = 100;
const defaultBoxHeight = 60;
const defaultMarginX = 10;
const defaultMarginY = 10;


/*
* Расчет абсолютных координат объекта
* */
export function getAbsoluteStartPoint(object, objectMap) {
    let absoluteX = object.x;
    let absoluteY = object.y;
    let parentId = object.parent;

    //Получаем абсолютные координаты
    while (Func.notNull(parentId)) {
        let parentObj = objectMap.get(parentId);
        absoluteX += parentObj.x;
        absoluteY += parentObj.y;
        parentId = parentObj.parent;
    }

    return {x: absoluteX, y: absoluteY};
}


/*
* Инициализация объекта и задание его границ
* */
function initObject(obj, lastObj, parent) {
    //Начальная координата для вставки объекта
    let startObjX = 0;
    let startObjY = 0;

    //Абсолютные координаты родителя
    let parentAbsoluteX = 0;
    let parentAbsoluteY = 0;

    //Если это не самый верхний объект
    if (Func.notNull(parent)) {
        startObjX = defaultMarginX;
        startObjY = defaultMarginY;
        parentAbsoluteX = parent.absoluteX;
        parentAbsoluteY = parent.absoluteY;
    }

    //Если какой-то объект (от того же родителя) уже стоит
    if (lastObj != null) {
        //По умолчанию располагаем объекта справа = inline
        startObjX = lastObj.x + lastObj.width + defaultMarginX;
        startObjY = lastObj.y;
        //Если есть родитель у этих объектов, то проверяем ставить справа или вниз
        if (Func.notNull(parent)) {
            if (parent.layout === "column") {
                startObjX = lastObj.x;
                startObjY = lastObj.y + lastObj.height + defaultMarginY;
            }
        }
    }

    //Начальные размеры объекта
    if (Func.isNull(obj.x)) {
        //Обновляем X для объекта
        obj.x = startObjX;
        obj.absoluteX = parentAbsoluteX + startObjX;
    }
    if (Func.isNull(obj.y)) {
        //Обновляем Y для объекта
        obj.y = startObjY;
        obj.absoluteY = parentAbsoluteY + startObjY;
    }
    if (Func.isNull(obj.width)) {
        obj.width = defaultBoxWidth;
    }
    if (Func.isNull(obj.height)) {
        obj.height = defaultBoxHeight;
    }

    return obj;
}


/*
* Расчет координат для каждого объекта.
* Координаты расстановки объектов - относительные
* */
export function calcLayout(object, lastObj, parent) {
    object = initObject(object, lastObj, parent);

    //Для каждого внутреннего объекта рассчитываем куда его поставить
    if (Func.notNull(object.objects)) {
        let innerObjects = new Map(Object.entries(object.objects));
        lastObj = null;
        for (let key of innerObjects.keys()) {
            //Считаем координаты объекта
            const innerObj = calcLayout(innerObjects.get(key), lastObj, object);
            //Обновляем его в коллекции родителя
            innerObjects.set(key, innerObj);
            lastObj = innerObj;
        }

        object.objects = innerObjects;

        let widthObjX = object.width;
        let heightObjX = object.height;

        //Когда посчитали координаты всех внутренних объектов - вычисляем размер родителя-контейнера
        for (let k of innerObjects.keys()) {
            const tempObj = innerObjects.get(k);
            widthObjX = Math.max(widthObjX, tempObj.x + tempObj.width);
            heightObjX = Math.max(heightObjX, tempObj.y + tempObj.height);
        }

        //обновляем вторую границу родительского объекта
        object.width = widthObjX + defaultMarginX;
        object.height = heightObjX + defaultMarginY;
    }

    return object;
}


/*
* Отрисовка объектов
* object - рисуемый объект
* parent - родительский объект
* dx, dy - отступ с учетом относительных координат
* canvasLayer - canvas для рисования
* */
export function draw(object, parent, dx, dy, canvasLayer) {
    if (Func.notNull(parent)) {
        dx += parent.x;
        dy += parent.y;
    }

    const rect = new Konva.Rect({
        x: object.x + dx,
        y: object.y + dy,
        width: object.width,
        height: object.height,
        fill: object.color,
        stroke: 'black',
        strokeWidth: 2,
        draggable: false
    });
    canvasLayer.add(rect);

    const text = new Konva.Text({
        x: object.x + dx,
        y: object.y + dy,
        width: object.width,
        height: object.height,
        text: object.name,
        fontSize: 14,
        fontFamily: 'Calibri',
        align: 'center',
    });
    canvasLayer.add(text);

    //Перебираем все объекты
    const innerObjects = object.objects;
    if (innerObjects != null) {
        for (let key of innerObjects.keys()) {
            const innerObj = innerObjects.get(key);

            draw(innerObj, object, dx, dy, canvasLayer);
        }
    }
}


/*
* Преобразование объекта data и всех внутренних объектов в плоскую map
* Ключ - имя контейнера
* Значение - данные объекта
* */
export function dataObjectToMap(object, parent) {
    let map = new Map();

    //Если есть внутренние объекты
    if (Func.notNull(object.objects)) {
        //смотрим все внутренние объекты
        for (let objKey of object.objects.keys()) {
            let innerObj = object.objects.get(objKey);
            //Если у просматриваемого объекта есть у объекта внутренние
            if (Func.notNull(innerObj.objects)) {
                const subMap = dataObjectToMap(innerObj, objKey);
                //Добавляем объекты в основную map
                for (let key of subMap.keys()) {
                    map.set(key, subMap.get(key));
                }
            }
            innerObj.parent = parent;
            innerObj.objects = null;
            map.set(objKey, innerObj);
        }
    }

    return map;
}
