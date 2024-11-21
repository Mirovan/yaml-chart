import * as Func from "./functions.js";
import * as Box from "./box.js";
import {ResearchPoint} from "./research-point.js";
import FlatQueue from 'flatqueue';

//Размер первого сегмента линии от объекта
const marginFirst = 5;
//Размер шага для поиска пути
const defaultStepX = 10;
const defaultStepY = 10;


/*
* Расчет линий
* */
export function calcAllPathes(relationObject, object, canvasLayer) {
    //Список всех объектов в плоской структуре
    const objectMap = Box.dataObjectToMap(object, null);

    //Map связей
    let relations = new Map(Object.entries(relationObject));

    //Проходим по всем связям объектов
    for (let key of relations.keys()) {
        const rel = relations.get(key);
        const fromObj = objectMap.get(rel.from);
        const toObj = objectMap.get(rel.to);

        //Точки для рисования линии
        let relExtremePoints = getRelationPoints(fromObj, toObj, objectMap);

        //Линия, состоящая из точек от одного объекта до другого
        let pathPoint = calcPath(relExtremePoints, objectMap, canvasLayer);

        //Рисуем для дебага
        let circle = new Konva.Circle({
            x: relExtremePoints.startX,
            y: relExtremePoints.startY,
            radius: 6,
            fill: 'green',
            stroke: 'black',
            strokeWidth: 2,
        });
        canvasLayer.add(circle);

        circle = new Konva.Circle({
            x: relExtremePoints.endX,
            y: relExtremePoints.endY,
            radius: 6,
            fill: 'green',
            stroke: 'black',
            strokeWidth: 2,
        });
        canvasLayer.add(circle);
    }

}


/*
* Определение координаты первой точки соединительной линии
* */
function getRelationPoints(fromObj, toObj, objectMap) {
    //Координаты (точек верхнего угла) объектов которые надо соединить
    const absolutePointFromObj = Box.getAbsoluteStartPoint(fromObj, objectMap);
    const absolutePointToObj = Box.getAbsoluteStartPoint(toObj, objectMap);

    //Координаты по дефолту
    let startX = absolutePointFromObj.x + fromObj.width;
    let startY = absolutePointFromObj.y + fromObj.height / 2;
    let endX = absolutePointToObj.x;
    let endY = absolutePointToObj.y + toObj.height / 2;

    //↗️ ➡️ ↘️  fromObj слева, toObj справа
    if (absolutePointFromObj.x < absolutePointToObj.x) {
        startX = absolutePointFromObj.x + fromObj.width;
        startY = absolutePointFromObj.y + fromObj.height / 2;
        endX = absolutePointToObj.x;
        endY = absolutePointToObj.y + toObj.height / 2;
    }
    //↙️ ⬅️ ↖️  fromObj справа, toObj слева
    else if (absolutePointToObj.x < absolutePointFromObj.x) {
        startX = absolutePointFromObj.x;
        startY = absolutePointFromObj.y + fromObj.height / 2;
        endX = absolutePointToObj.x + toObj.width;
        endY = absolutePointToObj.y + toObj.height / 2;
    }
    //⬆️ fromObj снизу, toObj сверху
    else if (absolutePointFromObj.x === absolutePointToObj.x && absolutePointFromObj.y > absolutePointToObj.y) {
        startX = absolutePointFromObj.x + fromObj.width / 2;
        startY = absolutePointFromObj.y;
        endX = absolutePointToObj.x + toObj.width / 2;
        endY = absolutePointToObj.y + toObj.height;
    }
    //⬇️ fromObj снизу, toObj сверху
    else if (absolutePointFromObj.x === absolutePointToObj.x && absolutePointFromObj.y < absolutePointToObj.y) {
        startX = absolutePointFromObj.x + fromObj.width / 2;
        startY = absolutePointFromObj.y + fromObj.height;
        endX = absolutePointToObj.x + toObj.width / 2;
        endY = absolutePointToObj.y;
    }

    return {startX: startX, startY: startY, endX: endX, endY: endY};
}


/*
* Расчет точек для соединительной линии
* Используется алгоритм А* и манхеттеновские расстояния
*
* relExtremePoints - содержит начальную и конечную точку для соединения
* objectMap - плоская Map с объектами
* */
function calcPath(relExtremePoints, objectMap, canvasLayer) {
    const startPoint = new ResearchPoint(relExtremePoints.startX, relExtremePoints.startY, 1);

    //множество частных решений
    const open = new FlatQueue();
    open.push(startPoint, startPoint.level);

    //множество уже пройденных вершин
    const closed = new Set();

    //Результирующий массив - путь
    const result = [];

    //Мапа с объектами которых нельзя пересекать линиями
    const cleanedObjectMap = getCleanedObjectMap(objectMap);
    console.log(objectMap);
    console.log(cleanedObjectMap);
    console.log("----------------");


    let temp = 0;
    while (open.length > 0) {
        temp++;
        if (temp > 10) break;

        const point = open.pop();
        closed.add(point);

        // console.log(point);
        let circle = new Konva.Circle({
            x: point.x,
            y: point.y,
            radius: 3,
            fill: '#ff0d00',
            stroke: '#8a2924',
            strokeWidth: 1,
        });
        canvasLayer.add(circle);

        //вверх
        tryStep(new ResearchPoint(point.x, point.y - defaultStepY, point.level + 1), open, closed, cleanedObjectMap);
        //вправо
        tryStep(new ResearchPoint(point.x + defaultStepX, point.y, point.level + 1), open, closed, cleanedObjectMap);
        //вниз
        tryStep(new ResearchPoint(point.x, point.y + defaultStepY, point.level + 1), open, closed, cleanedObjectMap);
        //влево
        tryStep(new ResearchPoint(point.x - defaultStepX, point.y, point.level + 1), open, closed, cleanedObjectMap);
    }

    return result;
}


/*
* Мапа с объектами которых нельзя пересекать соединительными линиями
* */
function getCleanedObjectMap(objectMap) {
    const map = new Map(
        [...objectMap]
            .filter(([k, v]) => v.type === "box")
    );
    return map;
}


/*
* Попытка пойти в точку с координатами x,y
* */
function tryStep(point, open, closed, objectMap) {
    //Условно можем идти только по положительны координатам
    if (point.x >= 0 && point.y >= 0) {
        //Проверяем что эту точку мы еще не посещали
        if (!closed.has(point)) {
            //Если точка доступна(не принадлежит объекту) - добавляем в очередь
            if (isPointAvailable(point, objectMap)) {
                open.push(point, point.level + 1);
            }
        }
    }
}


/*
* Определение доступна ли точка, т.е. через неё можно нарисовать линию
* */
function isPointAvailable(point, objectMap) {
    console.log("-----------------");

    console.log(point);

    //ToDo: использовать для objectMap абсолютные значения

    //Проверяем что точка не лежит ни в одном объекте
    for (const objItem of objectMap.values()) {
        console.log(objItem);
        if (objItem.x < point.x && point.x < objItem.x + objItem.width
            && objItem.y < point.y && point.y < objItem.y + objItem.height) {
            return false;
        }
    }
    return true;
}