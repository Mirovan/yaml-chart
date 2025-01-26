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


/**
 * Обновление списка ИСХОДЯЩИХ и ВХОДЯЩИХ связей.
 * Для каждого объекта добавляется 4 списка с исходящими связями от разных сторон и 4 списка с входящими
 * */
export function setObjectsInOutRelations(relations, objectMap) {
    //формируем Map всех связей.
    //Ключ - id объекта, значение - массив его ИСХОДЯЩИХ связей
    const objectOutRelationMap = new Map();
    const objectInRelationMap = new Map();
    for (let rel of relations) {
        const fromObj = objectMap.get(rel.from);
        const toObj = objectMap.get(rel.to);


        //Заполняем коллекцию исходящих линий
        if (Func.notNull(fromObj)) {
            if (!objectOutRelationMap.has(fromObj.id)) {
                objectOutRelationMap.set(fromObj.id, []);
            }
            const relArrOut = objectOutRelationMap.get(fromObj.id);
            relArrOut.push(rel);
            objectOutRelationMap.set(fromObj.id, relArrOut);
        }

        //Заполняем коллекцию входящих линий
        if (Func.notNull(toObj)) {
            if (!objectInRelationMap.has(toObj.id)) {
                objectInRelationMap.set(toObj.id, []);
            }
            const relArrIn = objectInRelationMap.get(toObj.id);
            relArrIn.push(rel);
            objectInRelationMap.set(toObj.id, relArrIn);
        }
    }

    //Перебираем все объекты и добавляем каждому ИСХОДЯЩИЕ связи
    //Для каждого объекта добавляется 4 списка с ИСХОДЯЩИМИ связями от разных сторон
    for (let key of objectMap.keys()) {
        const object = objectMap.get(key);
        const outRelations = objectOutRelationMap.get(object.id);
        const inRelations = objectInRelationMap.get(object.id);

        //Создаем массивы со списком соединительных линий, если надо
        if (Func.isNull(object.outRelations)) {
            object.outRelations = {top: [], right: [], bottom: [], left: []};
        }
        if (Func.isNull(object.inRelations)) {
            object.inRelations = {top: [], right: [], bottom: [], left: []};
        }

        if (Func.notNull(outRelations)) {
            //Обновляем связи для каждого объекта,
            //указывая из какой стороны соединительная линия выходит и куда приходит (если не задано явно)
            for (let rel of outRelations) {
                //обновляем у объекта списки соединительных линий
                if (rel.sideFrom === "right") {
                    object.outRelations.right.push(rel);
                } else if (rel.sideFrom === "bottom") {
                    object.outRelations.bottom.push(rel);
                } else if (rel.sideFrom === "left") {
                    object.outRelations.left.push(rel);
                } else if (rel.sideFrom === "top") {
                    object.outRelations.top.push(rel);
                }
            }

            //Сортируем списки соединительных линий
            object.outRelations.right.sort(verticalComparator);
            object.outRelations.bottom.sort(horizontalComparator);
            object.outRelations.left.sort(verticalComparator);
            object.outRelations.top.sort(horizontalComparator);

            /*
            * Компаратор для соединительных линий.
            * a, b - соединительные линии из yaml.
            * Сортируются по вертикали от меньшего к большему (выше/ниже) для конечных объектов
            * */
            function verticalComparator(a, b) {
                const obj1 = objectMap.get(a.to);
                const obj2 = objectMap.get(b.to);
                if (obj1.absoluteY < obj2.absoluteY) {
                    return -1;
                } else if (obj1.absoluteY > obj2.absoluteY) {
                    return 1;
                } else {
                    return 0;
                }
            }

            function horizontalComparator(a, b) {
                const obj1 = objectMap.get(a.to);
                const obj2 = objectMap.get(b.to);
                if (obj1.absoluteY < obj2.absoluteY) {
                    return -1;
                } else if (obj1.absoluteY > obj2.absoluteY) {
                    return 1;
                } else {
                    return 0;
                }
            }
        }

        if (Func.notNull(inRelations)) {
            for (let rel of inRelations) {
                //обновляем у объекта списки соединительных линий
                if (rel.sideTo === "right") {
                    object.inRelations.right.push(rel);
                } else if (rel.sideTo === "bottom") {
                    object.inRelations.bottom.push(rel);
                } else if (rel.sideTo === "left") {
                    object.inRelations.left.push(rel);
                } else if (rel.sideTo === "top") {
                    object.inRelations.top.push(rel);
                }
            }

            //Сортируем списки соединительных линий
            object.inRelations.right.sort(verticalComparator);
            object.inRelations.bottom.sort(horizontalComparator);
            object.inRelations.left.sort(verticalComparator);
            object.inRelations.top.sort(horizontalComparator);

            /*
            * Компаратор для соединительных линий.
            * a, b - соединительные линии из yaml.
            * Сортируются по вертикали от меньшего к большему (выше/ниже) для конечных объектов
            * */
            function verticalComparator(a, b) {
                const obj1 = objectMap.get(a.to);
                const obj2 = objectMap.get(b.to);
                if (obj1.absoluteY < obj2.absoluteY) {
                    return -1;
                } else if (obj1.absoluteY > obj2.absoluteY) {
                    return 1;
                } else {
                    return 0;
                }
            }

            function horizontalComparator(a, b) {
                const obj1 = objectMap.get(a.to);
                const obj2 = objectMap.get(b.to);
                if (obj1.absoluteY < obj2.absoluteY) {
                    return -1;
                } else if (obj1.absoluteY > obj2.absoluteY) {
                    return 1;
                } else {
                    return 0;
                }
            }
        }

    }
}

