import * as Func from "./functions.js";
import * as Box from "./box.js";
import {NodePoint} from "./node-point.js";
import {Point} from "./point.js";
import {config} from './config.js';
import {Heap} from 'heap-js';
import Konva from "konva";

export class ObjectRelation {
    /*
    * from, to - соединяемые объекты
    * sideFrom, sideTo - тип входа/выхода в объект - top|right|bottom|left
    * color - цвет линии
    * */
    constructor(from, to, relation) {
        Object.assign(this, relation);
        this.from = from;
        this.to = to;
    }
}


/*
* Расчет линий
* */
export function calcAllPathes(relations, diagramObject, stage, canvasLayer) {
    const resultPathes = [];

    //Список всех объектов в Map
    const objectMap = Box.dataObjectToMap(diagramObject, null);

    if (Func.notNull(relations)) {
        //Map всех связей. Ключ - id как в yaml, значение - сама связь
        const relationRawMap = new Map(Object.entries(relations));

        //формируем Map всех связей.
        //Ключ - id объекта из которого выходит связь, значение - массив его связей
        const objectRelationMap = new Map();
        for (let key of relationRawMap.keys()) {
            const rel = relationRawMap.get(key);
            const fromObj = objectMap.get(rel.from);
            if (!objectRelationMap.has(fromObj.id)) {
                objectRelationMap.set(fromObj.id, []);
            }
            let relArr = objectRelationMap.get(fromObj.id);
            relArr.push(rel);
            objectRelationMap.set(fromObj.id, relArr);
        }

        //Перебираем все объекты и добавляем им связи
        //Для каждого объекта добавляется 4 списка с исходящими связями от разных сторон
        for (let key of objectMap.keys()) {
            const obj = objectMap.get(key);
            Box.updateObjectRelations(obj, objectRelationMap.get(obj.id), objectMap);
        }

        //Проходим по всем объектам, и расчитываем соединительные линии для каждого
        for (let key of objectMap.keys()) {
            const obj = objectMap.get(key);

            calcPathesBySide(obj.relations.left, obj, objectMap, resultPathes, stage, canvasLayer);
            calcPathesBySide(obj.relations.right, obj, objectMap, resultPathes, stage, canvasLayer);
            calcPathesBySide(obj.relations.top, obj, objectMap, resultPathes, stage, canvasLayer);
            calcPathesBySide(obj.relations.bottom, obj, objectMap, resultPathes, stage, canvasLayer);
        }

    }


    /*
    if (Func.notNull(relations)) {
        //Map связей
        let relationMap = new Map(Object.entries(relations));

        //Проходим по всем связям объектов
        for (let key of relationMap.keys()) {
            const rel = relationMap.get(key);

            const objectRelation = new ObjectRelation(objectMap.get(rel.from), objectMap.get(rel.to), rel.sideFrom, rel.sideTo, rel.color);

            //////////////////////////////////////////////////
            //Рисуем для дебага
            // let circle = new Konva.Circle({
            //     x: relExtremePoints.startX,
            //     y: relExtremePoints.startY,
            //     radius: 6,
            //     // fill: 'green',
            //     stroke: '#068400',
            //     strokeWidth: 2,
            // });
            // circle.on('mouseover', function () {
            //     console.log('x: ' + relExtremePoints.startX + ', y: ' + relExtremePoints.startY);
            // });
            // canvasLayer.add(circle);
            //
            // circle = new Konva.Circle({
            //     x: relExtremePoints.endX,
            //     y: relExtremePoints.endY,
            //     radius: 6,
            //     // fill: 'green',
            //     stroke: '#068400',
            //     strokeWidth: 2,
            // });
            // canvasLayer.add(circle);
            //////////////////////////////////////////////////


            //Линия, состоящая из точек от одного объекта до другого
            let pathPoints = calcPath(objectRelation, objectMap, resultPathes, stage, canvasLayer);

            const path = {points: pathPoints, color: rel.color};

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

            resultPathes.push(path);
        }
    }
     */

    return resultPathes;
}


/*
* Расчет точек соединительных линий для стороны sideArr[]
* sideArr - массив соелинительных линий на определенной стороне
* */
function calcPathesBySide(sideArr, obj, objectMap, resultPathes, stage, canvasLayer) {
    //Для каждой соединительной линии (на определенной стороне) вычисляем путь
    for (let i = 0; i < sideArr.length; i++) {
        const rel = sideArr[i];
        const objectRelation = new ObjectRelation(obj, objectMap.get(rel.to), rel);

        //Линия, состоящая из точек от одного объекта до другого
        let pathPoints = calcRelationPath(objectRelation, i, objectMap, resultPathes, stage, canvasLayer);

        const path = {points: pathPoints, color: rel.color};
        resultPathes.push(path);
    }
}


/*
* Определение крайних точек соединительной линии
* */

/*
function getExtremePoints(relation, objectMap, pathes) {
    //Координаты (точек верхнего угла) объектов которые надо соединить
    const absolutePointFromObj = Box.getAbsolutePoint(relation.from, objectMap);
    const absolutePointToObj = Box.getAbsolutePoint(relation.to, objectMap);


    //Координаты по дефолту
    let startX = absolutePointFromObj.x + relation.from.width;
    //извлекаем точку из очереди у объекта и добавляем её в конец очереди
    const fromPointY = relation.from.pointsQueueRight.shift();
    relation.from.pointsQueueRight.push(fromPointY);
    let startY = absolutePointFromObj.y + fromPointY;

    let endX = absolutePointToObj.x;
    let endY = absolutePointToObj.y + relation.to.height / 2;
    //END координаты по дефолту


    //Откуда и Куда
    let sideFrom = relation.sideFrom;
    let sideTo = relation.sideTo;


    //Вычисляем расположение точек (от какой стороны и куда) по дефолту (если не указано откуда и куда)
    //↗️ ➡️ ↘️  fromObj стоит слева, toObj стоит справа
    if (absolutePointFromObj.x < absolutePointToObj.x) {
        startX = absolutePointFromObj.x + relation.from.width;
        startY = absolutePointFromObj.y + fromPointY;
        endX = absolutePointToObj.x;
        endY = absolutePointToObj.y + relation.to.height / 2;
        if (Func.isNull(relation.sideFrom)) sideFrom = "right";
        if (Func.isNull(relation.sideTo)) sideTo = "left";
    }
    //↙️ ⬅️ ↖️  fromObj стоит справа, toObj стоит слева
    else if (absolutePointToObj.x < absolutePointFromObj.x) {
        startX = absolutePointFromObj.x;
        startY = absolutePointFromObj.y + fromPointY;
        endX = absolutePointToObj.x + relation.to.width;
        endY = absolutePointToObj.y + relation.to.height / 2;
        if (Func.isNull(relation.sideFrom)) sideFrom = "left";
        if (Func.isNull(relation.sideTo)) sideTo = "right";
    }
    //⬆️ fromObj стоит снизу, toObj стоит сверху
    else if (absolutePointFromObj.x === absolutePointToObj.x && absolutePointFromObj.y > absolutePointToObj.y) {
        startX = absolutePointFromObj.x + relation.from.width / 2;
        startY = absolutePointFromObj.y;
        endX = absolutePointToObj.x + relation.to.width / 2;
        endY = absolutePointToObj.y + relation.to.height;
        if (Func.isNull(relation.sideFrom)) sideFrom = "top";
        if (Func.isNull(relation.sideTo)) sideTo = "bottom";
    }
    //⬇️ fromObj стоит сверху, toObj стоит снизу
    else if (absolutePointFromObj.x === absolutePointToObj.x && absolutePointFromObj.y < absolutePointToObj.y) {
        startX = absolutePointFromObj.x + relation.from.width / 2;
        startY = absolutePointFromObj.y + relation.from.height;
        endX = absolutePointToObj.x + relation.to.width / 2;
        endY = absolutePointToObj.y;
        if (Func.isNull(relation.sideFrom)) sideFrom = "bottom";
        if (Func.isNull(relation.sideTo)) sideTo = "top";
    }

    //Если указано положение точки начального from объекта
    if (relation.sideFrom === "top") {
        startX = absolutePointFromObj.x + relation.from.width / 2;
        startY = absolutePointFromObj.y;
    }
    if (relation.sideFrom === "right") {
        startX = absolutePointFromObj.x + relation.from.width;
        startY = absolutePointFromObj.y + relation.from.height / 2;
    }
    if (relation.sideFrom === "bottom") {
        startX = absolutePointFromObj.x + relation.from.width / 2;
        startY = absolutePointFromObj.y + relation.from.height;
    }
    if (relation.sideFrom === "left") {
        startX = absolutePointFromObj.x;
        startY = absolutePointFromObj.y + relation.from.height / 2;
    }

    //Если указано положение точки конечного to объекта
    if (relation.sideTo === "top") {
        endX = absolutePointToObj.x + relation.to.width / 2;
        endY = absolutePointToObj.y;
    }
    if (relation.sideTo === "right") {
        endX = absolutePointToObj.x + relation.to.width;
        endY = absolutePointToObj.y + relation.to.height / 2;
    }
    if (relation.sideTo === "bottom") {
        endX = absolutePointToObj.x + relation.to.width / 2;
        endY = absolutePointToObj.y + relation.to.height;
    }
    if (relation.sideTo === "left") {
        endX = absolutePointToObj.x;
        endY = absolutePointToObj.y + relation.to.height / 2;
    }

    //Пытаемся сдвинуть начальную координату, чтобы линии не накладывались
    // console.log("---------------------------");
    // console.log(relation);
    // console.log("pathes len", pathes.length);
    //ToDo: переписать pathes[] на set("x,y") для ускорения поиска крайних точек соединительной линии
    // for (let i = 0; i < pathes.length; i++) {
    //     if (pathes[i][0].x === startX && pathes[i][0].y === startY) {
    //         console.log("Equals start point", pathes[i][0]);
    //         startY = startY + config.defaultStepY;
    //     }
    // }

    return {startX: startX, startY: startY, sideFrom: sideFrom, endX: endX, endY: endY, sideTo: sideTo};
}
*/

function getExtremePoints(relation, indexBySide, objectMap) {
    //Координаты (точек верхнего угла) объектов которые надо соединить
    const absolutePointFromObj = Box.getAbsolutePoint(relation.from, objectMap);
    const absolutePointToObj = Box.getAbsolutePoint(relation.to, objectMap);

    //Координаты по дефолту
    let startX = absolutePointFromObj.x + relation.from.width;
    let startY = absolutePointFromObj.y + relation.from.height / 2;
    let endX = absolutePointToObj.x;
    let endY = absolutePointToObj.y + relation.to.height / 2;
    //END координаты по дефолту

    if (relation.sideFrom === "left") {
        const startIndex = getRelationStartSideIndex(relation.from.relations.left, relation.from.height, config.defaultStepY);
        startX = absolutePointFromObj.x;
        startY = absolutePointFromObj.y + config.defaultStepY * (startIndex + indexBySide);
    } else if (relation.sideFrom === "right") {
        const startIndex = getRelationStartSideIndex(relation.from.relations.right, relation.from.height, config.defaultStepY);
        startX = absolutePointFromObj.x + relation.from.width;
        startY = absolutePointFromObj.y + config.defaultStepY * (startIndex + indexBySide);
    } else if (relation.sideFrom === "top") {
        const startIndex = getRelationStartSideIndex(relation.from.relations.top, relation.from.width, config.defaultStepX);
        startX = absolutePointFromObj.x + config.defaultStepX * (startIndex + indexBySide);
        startY = absolutePointFromObj.y;
    } else if (relation.sideFrom === "bottom") {
        const startIndex = getRelationStartSideIndex(relation.from.relations.bottom, relation.from.width, config.defaultStepX);
        startX = absolutePointFromObj.x + config.defaultStepX * (startIndex + indexBySide);
        startY = absolutePointFromObj.y + relation.from.height;
    }


    return {
        startX: startX,
        startY: startY,
        sideFrom: relation.sideFrom,
        endX: endX,
        endY: endY,
        sideTo: relation.sideTo
    };
}


/*
* Возвращает начальный индекс
* */
function getRelationStartSideIndex(sideArr, sideLength, step) {
    //Число связей по текущей стороне
    const relCount = sideArr.length;
    //Число возможных начальных точек установки соединительных линий на текущей стороне
    const sidePointCount = Math.floor(sideLength / step) + 1;
    //Начальная позиция расстановки соединительных линий
    const startIndex = Math.floor((sidePointCount - relCount) / 2);

    // console.log("relCount", relCount);
    // console.log("posCount", sidePointCount);
    // console.log("startIndex", startIndex);
    return startIndex;
}


/*
* Расчет точек для соединительной линии
* Используется алгоритм А* и манхеттеновские расстояния
*
* objectRelation - объект - путь
* indexBySide - порядковый индекс соединильной линии по рассматриваемой стороне
* objectMap - плоская Map с объектами
* pathes - уже расчитанные пути
* */
function calcRelationPath(objectRelation, indexBySide, objectMap, pathes, stage, canvasLayer) {
    console.log("objectRelation", objectRelation);
    //Крайние точки для рисования линии (начальная и конечная)
    // console.log("relation.pointsQueueRight", objectRelation.pointsQueueRight);
    let extremePoints = getExtremePoints(objectRelation, indexBySide, objectMap);

    console.log("extremePoints", extremePoints);
    // console.log("---");


    //Стартовая точка с координатами x, y. Приоритет в очереди = 1
    const startNodePoint = new NodePoint(new Point(extremePoints.startX, extremePoints.startY), null, 1, 1);

    //Конечная точка
    const endPoint = new Point(extremePoints.endX, extremePoints.endY);
    // let circle = new Konva.Circle({
    //     x: endPoint.x,
    //     y: endPoint.y,
    //     radius: 4,
    //     fill: 'green',
    //     stroke: 'black',
    //     strokeWidth: 2,
    // });
    // canvasLayer.add(circle);

    //множество частных решений
    const open = new Heap(function (a, b) {
        if (a.priority === b.priority) {
            return a.directionPriority - b.directionPriority;
        } else {
            return a.priority - b.priority;
        }
    });

    //Добавляем в очередь первую точку
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
            closed.add(pointHashCode);  //Помечаем что точка посещена

            // if (objectRelation.to.id === "ccc") {
            //     let circle = new Konva.Circle({
            //         x: nodePoint.point.x,
            //         y: nodePoint.point.y,
            //         radius: 3,
            //         fill: '#62a0ce',
            //         stroke: '#458ba9',
            //         strokeWidth: 1,
            //     });
            //     circle.on('mouseover', function () {
            //         const mousePos = stage.getPointerPosition();
            //         console.log('x: ' + nodePoint.point.x + ', y: ' + nodePoint.point.y + ', level: ' + nodePoint.priority);
            //     });
            //     canvasLayer.add(circle);

                // const txt = new Konva.Text({
                //     x: nodePoint.point.x - 3,
                //     y: nodePoint.point.y - 4,
                //     text: nodePoint.priority,
                //     fontSize: 10,
                //     fontFamily: 'Calibri',
                //     fill: 'red',
                // });
                // canvasLayer.add(txt);
            // }

            // console.log("---------------");
            // console.log("Point: ", pointHashCode);
            // console.log(nodePoint);


            //Если почти пришли к конечной точке, т.е. nodePoint - около финальной точки
            /*
            if (isLatestStepPoint(nodePoint.point, extremePoints, objectRelation)) {
                //координаты предпоследней точки
                const latestPoint = new Point(nodePoint.point.x, endPoint.y);
                // console.log("latestX", latestPoint.x);
                // console.log("latestY", latestPoint.y);

                // let circle = new Konva.Circle({
                //     x: latestPoint.x,
                //     y: latestPoint.y,
                //     radius: 3,
                //     fill: '#ff0000',
                //     stroke: '#540303',
                //     strokeWidth: 1,
                // });
                // canvasLayer.add(circle);

                const path = [startNodePoint.point, ...buildPathByPoint(nodePoint), latestPoint, endPoint];
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


                //Сжимаем путь
                // return compressPoints(path);

                return path;

             */
            if (nodePoint.point.x === endPoint.x && nodePoint.point.y === endPoint.y) {
                const path = [startNodePoint.point, ...buildPathByPoint(nodePoint), endPoint];
                return path;
            } else {

                //Защита от зацикливания
                exitIterator++;
                if (exitIterator > 10000) {
                    console.log("EXIT BY ITERATOR !!!");
                    break;
                }


                //вверх
                let stepNodePoint = new NodePoint(new Point(nodePoint.point.x, nodePoint.point.y - config.defaultStepY), nodePoint, nodePoint.priority + 1, 1);

                if (objectRelation.to.id === "ccc" && stepNodePoint.point.x === 210 && stepNodePoint.point.y === 200) {
                    console.log("TOP stepNodePoint", stepNodePoint);
                }

                if (tryStep(stepNodePoint, closed, cleanedObjectMap, endPoint)) {
                    if (isOccupiedPoint(stepNodePoint.point, pathes)) {
                        stepNodePoint.priority += config.relationPriorityKoef;
                        // console.log("occupied 1");
                    }
                    open.push(stepNodePoint);
                }
                //вправо
                stepNodePoint = new NodePoint(new Point(nodePoint.point.x + config.defaultStepX, nodePoint.point.y), nodePoint, nodePoint.priority + 1, 2);
                if (tryStep(stepNodePoint, closed, cleanedObjectMap, endPoint)) {
                    if (isOccupiedPoint(stepNodePoint.point, pathes)) {
                        stepNodePoint.priority += config.relationPriorityKoef;
                        // console.log("occupied 2");
                    }
                    open.push(stepNodePoint);
                }
                //вниз
                stepNodePoint = new NodePoint(new Point(nodePoint.point.x, nodePoint.point.y + config.defaultStepY), nodePoint, nodePoint.priority + 1, 3);
                if (tryStep(stepNodePoint, closed, cleanedObjectMap, endPoint)) {
                    if (isOccupiedPoint(stepNodePoint.point, pathes)) {
                        stepNodePoint.priority += config.relationPriorityKoef;
                        // console.log("occupied 3");
                    }
                    open.push(stepNodePoint);
                }
                //влево
                stepNodePoint = new NodePoint(new Point(nodePoint.point.x - config.defaultStepX, nodePoint.point.y), nodePoint, nodePoint.priority + 1, 4);
                if (tryStep(stepNodePoint, closed, cleanedObjectMap, endPoint)) {
                    if (isOccupiedPoint(stepNodePoint.point, pathes)) {
                        stepNodePoint.priority += config.relationPriorityKoef;
                        // console.log("occupied 4");
                    }
                    open.push(stepNodePoint);
                }
            }
        }
    }

    return result;
}


/*
* Проверяем - занята ли эта точка, т.е. через неё уже проходит другая линия
* */
function isOccupiedPoint(point, pathes) {
    //ToDo: переписать на использование set
    for (let i = 0; i < pathes.length; i++) {
        for (let j = 0; j < pathes[i].points.length; j++) {
            if (pathes[i].points[j].x === point.x && pathes[i].points[j].y === point.y) {
                // console.log("Equal", pathes[i][0]);
                return true;
            }
        }
    }
    return false;
}


/*
* Определение что stepPoint - предпоследняя точка, т.е. следующая - принадлежит конечному объекту
* */
function isLatestStepPoint(stepPoint, extremePoints, objectRelation) {
    const startPoint = new Point(extremePoints.startX, extremePoints.startY);
    const endPoint = new Point(extremePoints.endX, extremePoints.endY);
    //Следующая точка куда потенциально можем пойти от текущей
    let nextPoint = null;

    // if (stepPoint.x == 350 && stepPoint.y == 80) {
    //     console.log("LOOOOOOOOOOOOOOOOOOOOOgG");
    //     console.log("extremePoints", extremePoints);
    // }

    if (extremePoints.sideTo === "left") {
        nextPoint = new Point(stepPoint.x + config.defaultStepX, stepPoint.y);

        //Определяем - находится ли точка stepPoint у границы объекта, т.е. если шагнуть еще в nextPoint - то попадем в сам объект
        if (isPointInObject(nextPoint, objectRelation.to)) {
            //определили что stepPoint около границы с конечным объектом

            //Определяем что дальше искать уже не надо и stepPoint - последняя точка перед конечной
            if (startPoint.y >= endPoint.y) {   //идем снизу вверх
                //проверка - перешла ли stepPoint конечную точку
                if (stepPoint.y - config.defaultStepY < endPoint.y) {
                    return true;
                }
            } else {
                if (stepPoint.y + config.defaultStepY > endPoint.y) {
                    return true;
                }
            }
        }
    } else if (extremePoints.sideTo === "bottom") {
        nextPoint = new Point(stepPoint.x, stepPoint.y - config.defaultStepY);

        if (isPointInObject(nextPoint, objectRelation.to)) {
            if (startPoint.x >= endPoint.x) {
                if (stepPoint.x - config.defaultStepX < endPoint.x) {
                    return true;
                }
            } else {
                if (stepPoint.x + config.defaultStepX > endPoint.x) {
                    return true;
                }
            }
        }
    } else if (extremePoints.sideTo === "right") {
        nextPoint = new Point(stepPoint.x - config.defaultStepX, stepPoint.y);

        if (isPointInObject(nextPoint, objectRelation.to)) {
            if (startPoint.y <= endPoint.y) {
                if (stepPoint.y + config.defaultStepX > endPoint.y) {
                    return true;
                }
            } else {
                if (stepPoint.y - config.defaultStepY < endPoint.y) {
                    return true;
                }
            }
        }
    } else if (extremePoints.sideTo === "top") {
        nextPoint = new Point(stepPoint.x, stepPoint.y + config.defaultStepY);

        if (isPointInObject(nextPoint, objectRelation.to)) {
            if (startPoint.x <= endPoint.x) {
                if (stepPoint.x + config.defaultStepX > endPoint.x) {
                    return true;
                }
            } else {
                if (stepPoint.x - config.defaultStepX < endPoint.x) {
                    return true;
                }
            }
        }
    }

    return false;
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
* Определение - принадлежит ли точка объекту
* */
function isPointInObject(point, object) {
    // console.log("point", point);
    // console.log("object", object);
    if (object.absoluteX <= point.x && point.x <= object.absoluteX + object.width
        && object.absoluteY <= point.y && point.y <= object.absoluteY + object.height) {

        // console.log("true");
        // console.log("object.absoluteX <= point.x", object.absoluteX <= point.x);
        // console.log("point.x <= object.absoluteX + object.width", point.x <= object.absoluteX + object.width);

        return true;
    }
    // console.log("false");

    return false;
}


/*
* Попытка пойти в точку с координатами x,y
* nodePoint - точка в которую пытаемся пойти
* closed - коллекция всех посещенных точек
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

        /*
        //ToDo: сократить число просматриваемых точек
        //Отсекаем точки в которые нет смысла идти - они отдаляют наш искомый путь
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
         */


        //Можем идти только по положительны координатам (условно)
        if (nodePoint.point.x >= 0 && nodePoint.point.y >= 0) {
            //Если точка доступна(не принадлежит объекту через который нельзя рисовать)
            // или это конечная точка - добавляем в очередь
            if (isPointAvailable(nodePoint.point, objectMap)
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
* Определяется путем что точка не лежит внутри объекта типа box
* */
function isPointAvailable(point, objectMap) {
    // if (nodePoint.point.x == 200 && nodePoint.point.y == 70) {
    //     console.log("11111111111111111111111111111111");
    //     console.log(objectMap);
    // }
    //Проверяем что точка не лежит ни в одном объекте типа box
    for (const objItem of objectMap.values()) {
        if (objItem.absoluteX <= point.x && point.x <= objItem.absoluteX + objItem.width
            && objItem.absoluteY <= point.y && point.y <= objItem.absoluteY + objItem.height) {
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
export function compressPoints(points) {
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