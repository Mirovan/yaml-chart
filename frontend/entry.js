import "./css/styles.scss";

import Konva from 'konva';
import YAML from 'yaml';
import * as Func from "./functions.js";
import * as Relation from "./relation.js";

const defaultBoxWidth = 100;
const defaultBoxHeight = 60;
const defaultMarginX = 10;
const defaultMarginY = 10;

/*Инициализация объекта и задание его границ*/

function initObject(obj, lastObj, parent) {
    //Начальная координата для вставки объекта
    let startObjX = defaultMarginX;
    let startObjY = defaultMarginY;

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
    }
    if (Func.isNull(obj.y)) {
        //Обновляем Y для объекта
        obj.y = startObjY;
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
* startX, startY - начальные координаты расчета установки относительно родителя
* */
function calcLayout(object, lastObj, parent) {
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
function draw(object, parent, dx, dy, canvasLayer) {
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
function dataObjectToMap(object, parent) {
    let map = new Map();

    console.log(object.objects);

    //Если есть внутренние объекты
    if (Func.notNull(object.objects)) {
        //смотрим все внутренние объекты
        for (let objKey of object.objects.keys()) {
            let innerObj = object.objects.get(objKey);
            //Если у просматриваемого объета есть у объекта внутренние
            if (Func.notNull(innerObj.objects)) {
                const subMap = dataObjectToMap(innerObj, objKey);
                //Join to main map
                // map = new Map([map, subMap]);
                for (let key of subMap.keys()) {
                    map.set(key, subMap.get(key));
                }
            }
            innerObj.parent = parent;
            innerObj.objects = null;
            map.set(objKey, innerObj);
        }
    }

    console.log(map);

    return map;
}

/**********************************************************************************/


document.addEventListener('DOMContentLoaded', function () {
    const stage = new Konva.Stage({
        container: 'watman',
        width: 800,
        height: 600,
    });

    const canvasLayer = new Konva.Layer({
        x: 0,
        y: 0,
    });
    stage.add(canvasLayer);

    const yamlData = YAML.parse(document.getElementById("yaml-text").value);

    //Вычисление координат
    const object = calcLayout(yamlData.data, null, null);

    //Отрисовка
    draw(object, null, 0, 0, canvasLayer);

    //Список всех объектов в плоской структуре
    const objectMap = dataObjectToMap(object, null);
    // console.log(objectMap);


    //Вычисление координат
    const relations = Relation.calcPathes(yamlData.relations, objectMap);
});