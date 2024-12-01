import * as Func from "./functions.js";
import * as Box from "./box.js";
import {NodePoint} from "./node-point.js";
import {Point} from "./point.js";
import { Heap } from 'heap-js';
import Konva from "konva";

//Размер шага для поиска пути
const defaultStepX = 10;
const defaultStepY = 10;


export class ObjectRelation {
    /*
    * from, to - объекты
    * entry - тип входа в объект - top|right|bottom|left
    * */
    constructor(from, to, posFrom, posTo) {
        this.from = from;
        this.to = to;
        this.posFrom = posFrom;
        this.posTo = posTo;
    }
}


/*
* Расчет линий
* */
export function calcAllPathes(relationObject, object, stage, canvasLayer) {
    const result = [];

    //Список всех объектов в плоской структуре
    const objectMap = Box.dataObjectToMap(object, null);

    //Map связей
    let relations = new Map(Object.entries(relationObject));

    //Проходим по всем связям объектов
    for (let key of relations.keys()) {
        const rel = relations.get(key);

        const objectRelation = new ObjectRelation(objectMap.get(rel.from), objectMap.get(rel.to), rel.posFrom, rel.posTo);

        //Крайние точки для рисования линии (начальная и конечная)
        let relExtremePoints = getExtremePoints(objectRelation, objectMap);


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
        circle.on('mouseover', function () {
            console.log('x: ' + relExtremePoints.startX + ', y: ' + relExtremePoints.startY);
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
        let pathPoints = calcPath(relExtremePoints, objectMap, stage, canvasLayer);

        // for (let p of pathPoints) {
        //     let circle = new Konva.Circle({
        //         x: p.x,
        //         y: p.y,
        //         radius: 3,
        //         fill: '#ff0d00',
        //         stroke: '#8a2924',
        //         strokeWidth: 1,
        //     });
        //     canvasLayer.add(circle);
        // }

        result.push(pathPoints);
    }

    return result;
}


/*
* Определение координаты первой точки соединительной линии
* */
function getExtremePoints(relation, objectMap) {
    //Координаты (точек верхнего угла) объектов которые надо соединить
    const absolutePointFromObj = Box.getAbsolutePoint(relation.from, objectMap);
    const absolutePointToObj = Box.getAbsolutePoint(relation.to, objectMap);

    //Координаты по дефолту
    let startX = absolutePointFromObj.x + relation.from.width;
    let startY = absolutePointFromObj.y + relation.from.height / 2;
    let endX = absolutePointToObj.x;
    let endY = absolutePointToObj.y + relation.to.height / 2;

    //Вычисляем расположение точек по дефолту (если не указано откуда и куда)

    //↗️ ➡️ ↘️  fromObj стоит слева, toObj стоит справа
    if (absolutePointFromObj.x < absolutePointToObj.x) {
        startX = absolutePointFromObj.x + relation.from.width;
        startY = absolutePointFromObj.y + relation.from.height / 2;
        endX = absolutePointToObj.x;
        endY = absolutePointToObj.y + relation.to.height / 2;
    }
    //↙️ ⬅️ ↖️  fromObj стоит справа, toObj стоит слева
    else if (absolutePointToObj.x < absolutePointFromObj.x) {
        startX = absolutePointFromObj.x;
        startY = absolutePointFromObj.y + relation.from.height / 2;
        endX = absolutePointToObj.x + relation.to.width;
        endY = absolutePointToObj.y + relation.to.height / 2;
    }
    //⬆️ fromObj стоит снизу, toObj стоит сверху
    else if (absolutePointFromObj.x === absolutePointToObj.x && absolutePointFromObj.y > absolutePointToObj.y) {
        startX = absolutePointFromObj.x + relation.from.width / 2;
        startY = absolutePointFromObj.y;
        endX = absolutePointToObj.x + relation.to.width / 2;
        endY = absolutePointToObj.y + relation.to.height;
    }
    //⬇️ fromObj стоит сверху, toObj стоит снизу
    else if (absolutePointFromObj.x === absolutePointToObj.x && absolutePointFromObj.y < absolutePointToObj.y) {
        startX = absolutePointFromObj.x + relation.from.width / 2;
        startY = absolutePointFromObj.y + relation.from.height;
        endX = absolutePointToObj.x + relation.to.width / 2;
        endY = absolutePointToObj.y;
    }

    //Если указано положение точки начального from объекта
    if (relation.posFrom === "top") {
        startX = absolutePointFromObj.x + relation.from.width / 2;
        startY = absolutePointFromObj.y;
    }
    if (relation.posFrom === "right") {
        startX = absolutePointFromObj.x + relation.from.width;
        startY = absolutePointFromObj.y + relation.from.height / 2;
    }
    if (relation.posFrom === "bottom") {
        startX = absolutePointFromObj.x + relation.from.width / 2;
        startY = absolutePointFromObj.y + relation.from.height;
    }
    if (relation.posFrom === "left") {
        startX = absolutePointFromObj.x;
        startY = absolutePointFromObj.y + relation.from.height / 2;
    }

    //Если указано положение точки конечного to объекта
    if (relation.posTo === "top") {
        endX = absolutePointToObj.x + relation.to.width / 2;
        endY = absolutePointToObj.y;
    }
    if (relation.posTo === "right") {
        endX = absolutePointToObj.x + relation.to.width;
        endY = absolutePointToObj.y + relation.to.height / 2;
    }
    if (relation.posTo === "bottom") {
        endX = absolutePointToObj.x + relation.to.width / 2;
        endY = absolutePointToObj.y + relation.to.height;
    }
    if (relation.posTo === "left") {
        endX = absolutePointToObj.x;
        endY = absolutePointToObj.y + relation.to.height / 2;
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
function calcPath(extremePoints, objectMap, stage, canvasLayer) {
    //Стартовая точка с координатами x, y. Приоритет в очереди = 1
    const startNodePoint = new NodePoint(new Point(extremePoints.startX, extremePoints.startY), null, 1, 1);

    //Конечная точка
    const endPoint = new Point(extremePoints.endX, extremePoints.endY);

    //множество частных решений
    const open = new Heap(function (a, b) {
        if (a.priority === b.priority) {
            return a.directionPriority - b.directionPriority;
        } else {
            return a.priority - b.priority;
        }
    });

    // open.push(new NodePoint(new Point(150, 60), null, 2, 1));
    // open.push(new NodePoint(new Point(160, 70), null, 2, 2));
    // open.push(new NodePoint(new Point(150, 80), null, 2, 3));
    // open.push(new NodePoint(new Point(140, 70), null, 2, 4));
    //
    // console.log(open.pop());
    // console.log(open.pop());
    // console.log(open.pop());
    // console.log(open.pop());
    // return;


    open.push(startNodePoint);

    //множество уже пройденных вершин
    const closed = new Set();

    //Результирующий массив - путь
    const result = [];

    //Мапа с объектами которых нельзя пересекать линиями
    const cleanedObjectMap = getCleanedObjectMap(objectMap);

    let exitIterator = 0;
    //Пока очередь не пустая
    while (open.length > 0) {
        //Достам точку из очереди, помечаем как посещенную
        const nodePoint = open.pop();
        const pointHashCode = nodePoint.point.x + "," + nodePoint.point.y;

        //Если еще эту точку не посещали, и значит не просматривали смежные с ней
        if (!closed.has(pointHashCode)) {
            closed.add(pointHashCode);

            console.log("---------------");
            console.log(pointHashCode, " - ", nodePoint.level);
            console.log(nodePoint);

            //Если пришли к финальной точке
            if (nodePoint.point.x === endPoint.x && nodePoint.point.y === endPoint.y) {
                const path = [startNodePoint.point, ...buildPathByPoint(nodePoint)];

                // for (let p of path) {
                //     let circle = new Konva.Circle({
                //         x: p.x,
                //         y: p.y,
                //         radius: 5,
                //         fill: '#ff0000',
                //         stroke: '#540303',
                //         strokeWidth: 1,
                //     });
                //     canvasLayer.add(circle);
                // }

                //Результат, включая стартовую точку
                return compressPoints(path);
            }


            // let circle = new Konva.Circle({
            //     x: nodePoint.point.x,
            //     y: nodePoint.point.y,
            //     radius: 3,
            //     fill: '#62a0ce',
            //     stroke: '#458ba9',
            //     strokeWidth: 1,
            // });
            // circle.on('mouseover', function () {
            //     const mousePos = stage.getPointerPosition();
            //     console.log('x: ' + nodePoint.point.x + ', y: ' + nodePoint.point.y + ', level: ' + nodePoint.level);
            // });
            // canvasLayer.add(circle);
            // const txt = new Konva.Text({
            //     x: nodePoint.point.x - 3,
            //     y: nodePoint.point.y - 4,
            //     text: nodePoint.level,
            //     fontSize: 10,
            //     fontFamily: 'Calibri',
            //     fill: 'red',
            // });
            // canvasLayer.add(txt);


            //Защита от зацикливания
            exitIterator++;
            if (exitIterator > 10000) break;


            //вверх
            let stepNodePoint = new NodePoint(new Point(nodePoint.point.x, nodePoint.point.y - defaultStepY), nodePoint, nodePoint.priority + 1, 1);
            if (tryStep(stepNodePoint, closed, cleanedObjectMap, endPoint)) {
                open.push(stepNodePoint);
            }
            //вправо
            stepNodePoint = new NodePoint(new Point(nodePoint.point.x + defaultStepX, nodePoint.point.y), nodePoint, nodePoint.priority + 1, 2);
            if (tryStep(stepNodePoint, closed, cleanedObjectMap, endPoint)) {
                open.push(stepNodePoint);
            }
            //вниз
            stepNodePoint = new NodePoint(new Point(nodePoint.point.x, nodePoint.point.y + defaultStepY), nodePoint, nodePoint.priority + 1, 3);
            if (tryStep(stepNodePoint, closed, cleanedObjectMap, endPoint)) {
                open.push(stepNodePoint);
            }
            //влево
            stepNodePoint = new NodePoint(new Point(nodePoint.point.x - defaultStepX, nodePoint.point.y), nodePoint, nodePoint.priority + 1, 4);
            if (tryStep(stepNodePoint, closed, cleanedObjectMap, endPoint)) {
                open.push(stepNodePoint);
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
* */
function tryStep(nodePoint, closed, objectMap, endPoint) {
    const pointHashCode = nodePoint.point.x + "," + nodePoint.point.y;
    // console.log("---------------");
    // console.log(pointHashCode);

    //Проверяем что эту точку мы еще не посещали
    if (!closed.has(pointHashCode)) {
        // console.log("not closed");

        //Отсекаем точки в которые нет смысла идти - они удаляют наш искомый путь
        if (Func.notNull(nodePoint.parent)
            && Func.notNull(nodePoint.parent.parent)
            && Func.notNull(nodePoint.parent.parent.parent)) {
            //Смотрим на предка и если мы отдаляемся от конечной точки - то эту точку не рассматриваем
            const parentWayCost = Math.abs(endPoint.x - nodePoint.parent.parent.parent.point.x) + Math.abs(endPoint.y - nodePoint.parent.parent.parent.point.y);
            const pointWayCost = Math.abs(endPoint.x - nodePoint.point.x) + Math.abs(endPoint.y - nodePoint.point.y);
            if (pointWayCost > parentWayCost) {
                // console.log("pointWayCost > parentWayCost");
                // console.log("FALSE");

                return false;
            }
        }

        //Условно можем идти только по положительны координатам
        if (nodePoint.point.x >= 0 && nodePoint.point.y >= 0) {
            //Если точка доступна(не принадлежит объекту через который нельзя рисовать) или это конечная точка - добавляем в очередь
            if (isPointAvailable(nodePoint, objectMap)
                || (nodePoint.point.x === endPoint.x && nodePoint.point.y === endPoint.y)) {
                // console.log("TRUE");

                return true;
            }
        }
    }
    // console.log("FALSE");

    return false;
}


/*
* Определение доступна ли точка, т.е. через неё можно нарисовать линию
* */
function isPointAvailable(nodePoint, objectMap) {
    //Проверяем что точка не лежит ни в одном объекте типа box
    for (const objItem of objectMap.values()) {
        if (objItem.absoluteX <= nodePoint.point.x && nodePoint.point.x <= objItem.absoluteX + objItem.width
            && objItem.absoluteY <= nodePoint.point.y && nodePoint.point.y <= objItem.absoluteY + objItem.height) {
            // console.log("nodePoint not available", nodePoint);

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
        nodePoint = nodePoint.parent;
    }
    return res.reverse();
}


/*
* Сжатие точек в линию.
* points - коллекция точек
* */
function compressPoints(points) {
    const res = [];
    res.push(points[0]);

    let edgePoint = points[0];
    for (let i = 1; i < points.length; i++) {
        if (points[i].x !== edgePoint.x && points[i].y !== edgePoint.y) {
            res.push(points[i - 1]);
            edgePoint = points[i - 1];
        }
    }
    res.push(points[points.length - 1]);

    return res;
}