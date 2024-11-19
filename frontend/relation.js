import * as Func from "./functions.js";
import * as Box from "./box.js";

//Размер первого сегмента линии от объекта
const marginFirst = 6;
const defaultStepX = 10;
const defaultStepY = 10;

/*
* Расчет линий
* */
export function calcPathes(relationObject, object, canvasLayer) {
    //Список всех объектов в плоской структуре
    const objectMap = Box.dataObjectToMap(object, null);

    //Map связей
    let relations = new Map(Object.entries(relationObject));

    //Проходим по всем связям объектов
    for (let key of relations.keys()) {
        const rel = relations.get(key);
        const fromObj = objectMap.get(rel.from);
        const toObj = objectMap.get(rel.to);

        //Линия, состоящая из точек от одного объекта до другого
        let pathPoint = [];

        //Стартовая точка для рисования линия
        let point = getRelationStartPoint(fromObj, toObj, objectMap, canvasLayer);
        // console.log(point);
    }

}


/*
* Определение координаты первой точки соединительной линии
* */
function getRelationStartPoint(fromObj, toObj, objectMap, canvasLayer) {
    let absoluteX = 0;
    let absoluteY = 0;
    let parentId = fromObj.parent;

    //Координаты (точек верхнего угла) объектов которые надо соединить
    const absolutePointFromObj = Box.getAbsoluteStartPoint(fromObj, objectMap);
    const absolutePointToObj = Box.getAbsoluteStartPoint(toObj, objectMap);

    //Получаем абсолютные координаты
    // while (Func.notNull(parentId)) {
    //     let parentObj = objectMap.get(parentId);
    //     absoluteX += parentObj.x;
    //     absoluteY += parentObj.y;
    //     parentId = parentObj.parent;
    // }

    //Начальные координаты от объекта
    let startX = absolutePointFromObj.x + fromObj.width;
    let startY = absolutePointFromObj.y + fromObj.height / 2;

    //↗️ ➡️ ↘️  fromObj слева, toObj справа
    if (absolutePointFromObj.x < absolutePointToObj.x) {
        startX = absolutePointFromObj.x + fromObj.width;
        startY = absolutePointFromObj.y + fromObj.height / 2;
    }
    //↙️ ⬅️ ↖️  fromObj справа, toObj слева
    else if (absolutePointToObj.x < absolutePointFromObj.x) {
        startX = absolutePointFromObj.x;
        startY = absolutePointFromObj.y + fromObj.height / 2;
    }
    //⬆️ fromObj снизу, toObj сверху
    else if (absolutePointFromObj.x === absolutePointToObj.x && absolutePointFromObj.y > absolutePointToObj.y) {
        startX = absolutePointFromObj.x + fromObj.width / 2;
        startY = absolutePointFromObj.y;
    }
    //⬇️ fromObj снизу, toObj сверху
    else if (absolutePointFromObj.x === absolutePointToObj.x && absolutePointFromObj.y < absolutePointToObj.y) {
        startX = absolutePointFromObj.x + fromObj.width / 2;
        startY = absolutePointFromObj.y + fromObj.height;
    }


    // //fromObj слева, toObj справа
    // if (absolutePointFromObj.x + fromObj.width < absolutePointToObj.x) {
    //     startX = absolutePointFromObj.x + fromObj.width;
    //     console.log("1 startX = ", startX);
    // }
    // //toObj слева, fromObj справа
    // else if (absolutePointToObj.x + toObj.width < absolutePointFromObj.x) {
    //     startX = absolutePointFromObj.x;
    //     console.log("2 startX = ", startX);
    // }
    // //toObj и fromObj на одной вертикали (друг под другом)
    // else if (absolutePointFromObj.x === absolutePointToObj.x) {
    //     startX = absolutePointFromObj.x + fromObj.width / 2;
    //     console.log("3 startX = ", startX);
    // }
    //
    // //fromObj сверху, toObj снизу
    // if (absolutePointFromObj.y + fromObj.height < absolutePointToObj.y) {
    //     startY = absolutePointFromObj.y + fromObj.height;
    // }
    // //toObj сверху, fromObj снизу
    // else if (absolutePointToObj.y + toObj.height < absolutePointFromObj.y) {
    //     startY = absolutePointFromObj.y;
    // }
    // //toObj и fromObj на одной горизонтали
    // else if (absolutePointFromObj.y === absolutePointToObj.y) {
    //     startY = absolutePointFromObj.y + fromObj.height / 2;
    // }

    // console.log(fromObj);
    // console.log(toObj);
    console.log(startX, startY);

    let circle = new Konva.Circle({
        x: startX,
        y: startY,
        radius: 6,
        fill: 'green',
        stroke: 'black',
        strokeWidth: 2,
    });
    canvasLayer.add(circle);

    return {x: startX, y: startY};
}