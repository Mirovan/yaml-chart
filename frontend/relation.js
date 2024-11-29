import * as Func from "./functions.js";
import * as Box from "./box.js";
import {NodePoint} from "./node-point.js";
import FlatQueue from 'flatqueue';
import Konva from "konva";
import {Point} from "./point.js";

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

        //Крайние точки для рисования линии (начальная и конечная)
        let relExtremePoints = getExtremePoints(fromObj, toObj, objectMap);


        //////////////////////////////////////////////////
        //Рисуем для дебага
        let circle = new Konva.Circle({
            x: relExtremePoints.startX,
            y: relExtremePoints.startY,
            radius: 6,
            // fill: 'green',
            stroke: '#068400',
            strokeWidth: 2,
        });
        canvasLayer.add(circle);

        circle = new Konva.Circle({
            x: relExtremePoints.endX,
            y: relExtremePoints.endY,
            radius: 6,
            // fill: 'green',
            stroke: '#068400',
            strokeWidth: 2,
        });
        canvasLayer.add(circle);
        //////////////////////////////////////////////////


        //Линия, состоящая из точек от одного объекта до другого
        let pathPoints = calcPath(relExtremePoints, objectMap, canvasLayer);
        for (let p of pathPoints) {
            let circle = new Konva.Circle({
                x: p.x,
                y: p.y,
                radius: 3,
                fill: '#ff0d00',
                stroke: '#8a2924',
                strokeWidth: 1,
            });
            canvasLayer.add(circle);
        }
    }

}


/*
* Определение координаты первой точки соединительной линии
* */
function getExtremePoints(fromObj, toObj, objectMap) {
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
* extremePoints - содержит начальную и конечную точку для соединения
* objectMap - плоская Map с объектами
* */
function calcPath(extremePoints, objectMap, canvasLayer) {
    //Стартовая точка с координатами x, y. Приоритет в очереди = 1
    const startNodePoint = new NodePoint(new Point(extremePoints.startX, extremePoints.startY), 1, null);

    //Конечная точка
    const endPoint = new Point(extremePoints.endX, extremePoints.endY);

    //Условное расстояние от начальной точки до конечной (плюс некий дополнительный отступ)
    // const startPointWayCost = Math.abs(endPoint.x - startNodePoint.point.x) + Math.abs(endPoint.y - startNodePoint.point.y) + defaultStepX + defaultStepY;
    // console.log("startPointWayCost", startPointWayCost);

    //множество частных решений
    const open = new FlatQueue();
    open.push(startNodePoint, startNodePoint.level);

    //множество уже пройденных вершин
    const closed = new Set();

    //Результирующий массив - путь
    const result = [];

    //Мапа с объектами которых нельзя пересекать линиями
    const cleanedObjectMap = getCleanedObjectMap(objectMap);

    let temp = 0;
    //Пока очередь не пустая
    while (open.length > 0) {
        //Достам точку из очереди, помечаем как посещенную
        const nodePoint = open.pop();
        const pointHashCode = nodePoint.point.x + "," + nodePoint.point.y;

        //Если еще эту точку не посещали, и значит не просматривали смежные с ней
        if (!closed.has(pointHashCode)) {
            closed.add(pointHashCode);

            //Если пришли к финальной точке
            if (nodePoint.point.x === endPoint.x && nodePoint.point.y === endPoint.y) {
                const path = buildPathByPoint(nodePoint);

                //Результат, включая стартовую точку
                return compressPoints([startNodePoint.point, ...path]);
            }


            // let circle = new Konva.Circle({
            //     x: nodePoint.point.x,
            //     y: nodePoint.point.y,
            //     radius: 3,
            //     fill: '#62a0ce',
            //     stroke: '#458ba9',
            //     strokeWidth: 1,
            // });
            // canvasLayer.add(circle);


            //Защита от зацикливания
            temp++;
            if (temp > 10000) break;


            //вверх
            let stepNodePoint = new NodePoint(new Point(nodePoint.point.x, nodePoint.point.y - defaultStepY), nodePoint.level * 10 + 1, nodePoint);
            if (tryStep(stepNodePoint, closed, cleanedObjectMap, endPoint)) {
                open.push(stepNodePoint, stepNodePoint.level);
            }
            //вправо
            stepNodePoint = new NodePoint(new Point(nodePoint.point.x + defaultStepX, nodePoint.point.y), nodePoint.level * 10 + 2, nodePoint);
            if (tryStep(stepNodePoint, closed, cleanedObjectMap, endPoint)) {
                open.push(stepNodePoint, stepNodePoint.level);
            }
            //вниз
            stepNodePoint = new NodePoint(new Point(nodePoint.point.x, nodePoint.point.y + defaultStepY), nodePoint.level * 10 + 2, nodePoint);
            if (tryStep(stepNodePoint, closed, cleanedObjectMap, endPoint)) {
                open.push(stepNodePoint, stepNodePoint.level);
            }
            //влево
            stepNodePoint = new NodePoint(new Point(nodePoint.point.x - defaultStepX, nodePoint.point.y), nodePoint.level * 10 + 4, nodePoint);
            if (tryStep(stepNodePoint, closed, cleanedObjectMap, endPoint)) {
                open.push(stepNodePoint, stepNodePoint.level);
            }
        }
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
* nodePoint - точка в которую пытаемся пойти
* close - коллекция всех посещенных точек
* objectMap - коллекция объектов через которые нельзя рисовать линию
* endPoint - конечная точка куда надо нарисовать линию
* startPointWayCost - предельное расстояние где может находится предполагаемая точка nodePoint
* */
function tryStep(nodePoint, closed, objectMap, endPoint) {
    const pointHashCode = nodePoint.point.x + "," + nodePoint.point.y;

    //Проверяем что эту точку мы еще не посещали
    if (!closed.has(pointHashCode)) {
        //Отсекаем точки в которые нет смысла идти - они удаляют наш искомый путь
        if (Func.notNull(nodePoint.parent)
            && Func.notNull(nodePoint.parent.parent)
            && Func.notNull(nodePoint.parent.parent.parent)) {
            //Смотрим на предка и если мы отдаляемся от конечной точки - то эту точку не рассматриваем
            const parentWayCost = Math.abs(endPoint.x - nodePoint.parent.parent.parent.point.x) + Math.abs(endPoint.y - nodePoint.parent.parent.parent.point.y);
            const pointWayCost = Math.abs(endPoint.x - nodePoint.point.x) + Math.abs(endPoint.y - nodePoint.point.y);
            if (pointWayCost > parentWayCost) return false;
        }

        //Условно можем идти только по положительны координатам
        if (nodePoint.point.x >= 0 && nodePoint.point.y >= 0) {
            //Если точка доступна(не принадлежит объекту через который нельзя рисовать) или это конечная точка - добавляем в очередь
            if (isPointAvailable(nodePoint, objectMap)
                || (nodePoint.point.x === endPoint.x && nodePoint.point.y === endPoint.y)) {
                return true;
            }
        }
    }
    return false;
}


/*
* Определение доступна ли точка, т.е. через неё можно нарисовать линию
* */
function isPointAvailable(nodePoint, objectMap) {
    //Проверяем что точка не лежит ни в одном объекте
    for (const objItem of objectMap.values()) {
        if (objItem.absoluteX <= nodePoint.point.x && nodePoint.point.x <= objItem.absoluteX + objItem.width
            && objItem.absoluteY <= nodePoint.point.y && nodePoint.point.y <= objItem.absoluteY + objItem.height) {
            return false;
        }
    }
    return true;
}


/*
* Возвращает коллекцию точек - узлы соединительной линии
* */
function buildPathByPoint(nodePoint) {
    let res = [];
    while (nodePoint.parent != null) {
        res.push(nodePoint.point);
        //ToDo: дописать схлопывание линии в две точки по прямой вместо N точек
        nodePoint = nodePoint.parent;
    }
    return res;
}


/*
* Сжатие точек в линию.
* points - коллекция точек
* */
function compressPoints(points) {
    const res = [];

    res.push(points[0]);

    let edgePoint = points[0];
    for (let i=1; i<points.length; i++) {
        if (points[i].x !== edgePoint.x && points[i].y !== edgePoint.y) {
            res.push(points[i-1]);
            edgePoint = points[i-1];
        }
    }

    res.push(points[points.length-1]);

    return res;
}