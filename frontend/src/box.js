import * as Func from "./functions";
import Konva from "konva";
import {updateManualRelation} from "./manual-relation.js";
import {config} from './config.js';


const defaultBoxWidth = 100;
const defaultBoxHeight = 60;
const defaultMarginX = 20;
const defaultMarginY = 20;


class Box {
    /*
    * object - объект-прямоугольник на диаграмме
    * */
    constructor(object) {
        Object.assign(this, object);
    }
}


/*
* Расчет абсолютных координат объекта
* object - объект для которого вычисляем абсолютное положение
* objectMap - сптсок всех объектов
* */
export function getAbsolutePoint(object, objectMap) {
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
function initObjectLayout(obj, lastObj, parent) {
    obj = new Box(obj);

    //Начальная координата для вставки объекта
    let startObjX = 0;
    let startObjY = 0;

    //Абсолютные координаты родителя
    let parentAbsoluteX = 0;
    let parentAbsoluteY = 0;

    //Если это не самый верхний объект, т.е. обычный объект
    if (Func.notNull(parent)) {
        //Если у родителя border=none
        if (Func.notNull(parent) && Func.notNull(parent.border) && parent.border === "none") {
            //Нет предыдущего объекта у этого родителя
            if (Func.isNull(lastObj)) {
                //Добавление отступа по умолчанию, если он не указан
                if (Func.isNull(obj.marginX)) obj.marginX = 0;
                if (Func.isNull(obj.marginY)) obj.marginY = 0;

                startObjX = obj.marginX;
                startObjY = obj.marginY;
            } else {
                //Добавление отступа по умолчанию, если он не указан
                if (Func.isNull(obj.marginX)) obj.marginX = defaultMarginX;
                if (Func.isNull(obj.marginY)) obj.marginY = defaultMarginY;

                //По умолчанию располагаем объекта справа = inline
                if (Func.isNull(parent.layout) || parent.layout === "inline") {
                    startObjX = lastObj.x + lastObj.width + obj.marginX;
                    startObjY = 0;
                } else if (parent.layout === "column") {
                    startObjX = 0;
                    startObjY = lastObj.y + lastObj.height + obj.marginY;
                }
            }
        } else {
            //Добавление отступа по умолчанию, если он не указан
            if (Func.isNull(obj.marginX)) obj.marginX = defaultMarginX;
            if (Func.isNull(obj.marginY)) obj.marginY = defaultMarginY;

            startObjX = obj.marginX;
            startObjY = obj.marginY;

            //Нет предыдущего объекта у этого родителя
            if (Func.notNull(lastObj)) {
                //По умолчанию располагаем объекта справа = inline
                if (Func.isNull(parent.layout) || parent.layout === "inline") {
                    startObjX = lastObj.x + lastObj.width + obj.marginX;
                    startObjY = obj.marginY;
                } else if (parent.layout === "column") {
                    startObjX = obj.marginX;
                    startObjY = lastObj.y + lastObj.height + obj.marginY;
                }
            }
        }

        parentAbsoluteX = parent.absoluteX;
        parentAbsoluteY = parent.absoluteY;
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
* Определение точек для соединительных линий
* */
function initObjectConnectionPoints(object) {
    //Очереди возможных точек слева/справа
    let verticalPointsQueue = [];
    for (let i = config.defaultStepY; i <= object.height / 2; i = i + config.defaultStepY) {
        verticalPointsQueue.unshift(i);
        if (object.height - i !== i) {
            verticalPointsQueue.unshift(object.height - i);
        }
    }

    //Очереди возможных точек внизу/вверху
    let horizontalPointsQueue = [];
    for (let i = config.defaultStepX; i <= object.width / 2; i = i + config.defaultStepX) {
        horizontalPointsQueue.unshift(i);
        if (object.width - i !== i) {
            horizontalPointsQueue.unshift(object.width - i);
        }
    }

    object.pointsQueueRight = verticalPointsQueue;
    object.pointsQueueLeft = verticalPointsQueue;
    object.pointsQueueTop = horizontalPointsQueue;
    object.pointsQueueBottom = horizontalPointsQueue;

    return object;
}


/*
* Расчет координат для каждого объекта.
* Координаты расстановки объектов - относительные
* */
export function calcLayout(object, lastObj, parent) {
    object = initObjectLayout(object, lastObj, parent);

    //Для каждого внутреннего объекта рассчитываем куда его поставить
    if (Func.notNull(object.objects)) {
        let innerObjects = new Map(Object.entries(object.objects));
        lastObj = null;
        for (let key of innerObjects.keys()) {
            //Считаем координаты объекта
            let innerObj = innerObjects.get(key);
            innerObj.id = key;
            innerObj = calcLayout(innerObj, lastObj, object);
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

        //обновляем вторую границу объекта
        if (Func.notNull(object.border) && object.border === "none") {
            object.width = widthObjX;
            object.height = heightObjX;
        } else {
            object.width = widthObjX + defaultMarginX;
            object.height = heightObjX + defaultMarginY;
        }
    }

    object = initObjectConnectionPoints(object);

    return object;
}


/*
* Отрисовка объектов
* object - рисуемый объект
* parent - родительский объект
* dx, dy - отступ с учетом относительных координат
* canvasLayer - canvas для рисования
* */
export function draw(object, canvasLayer) {
    let strokeWidth = 2;
    if (Func.notNull(object.border) && object.border === "none") {
        strokeWidth = 0;
    }
    const rect = new Konva.Rect({
        x: object.absoluteX,
        y: object.absoluteY,
        width: object.width,
        height: object.height,
        fill: object.color,
        stroke: 'black',
        strokeWidth: strokeWidth,
        draggable: false,
        opacity: 0.5,
    });
    // rect.setAttr('id', object.id);
    // rect.setAttr('name', object.name);
    // rect.on('click', function () {
    //     console.log("ID:", rect.getAttr("id"), "| Name:", rect.getAttr("name"));
    // });
    canvasLayer.add(rect);

    const text = new Konva.Text({
        x: object.absoluteX,
        y: object.absoluteY,
        width: object.width,
        height: object.height,
        text: object.name,
        fontSize: 12,
        fontFamily: 'Calibri',
        align: 'center',
    });
    text.on('click', function () {
        // console.log("ID:", object.id, "| Name:", object.name);
        updateManualRelation(object.id);
    });
    canvasLayer.add(text);

    //Перебираем все внутренние объекты и рекурсивно рисуем их
    const innerObjects = object.objects;
    if (innerObjects != null) {
        for (let key of innerObjects.keys()) {
            const innerObj = innerObjects.get(key);

            draw(innerObj, canvasLayer);
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
