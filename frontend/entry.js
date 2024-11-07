import "./css/styles.scss";

import Konva from 'konva';
import YAML from 'yaml';

const defaultBoxWidth = 100;
const defaultBoxHeight = 50;

/*
* Расчет координат для каждого объекта.
* Координаты расстановки объектов - относительные
* */
function calcLayout(objects, startX, startY) {
    console.log(objects);
    let currentX = 0;
    let currentY = 0;

    //Для каждого объекта вычисляем куда его поставить
    for (let key of objects.keys()) {
        const obj = objects.get(key);

        //Если у объекта дочерние объекты, то вычисляем куда их поставить
        if (obj.objects != null) {
            obj.objects = calcLayout(obj.objects, 0, 0);
        }
        if (obj.x == null) {
            obj.x = 0;
        }
        if (obj.y == null) {
            obj.y = 0;
        }
        obj.y += currentY + defaultBoxHeight;

        //Обновляем Y для объекта
        currentY += defaultBoxHeight;
    }
}


/*
* Преобразовывает рекурсивно объект в Map с вложенными объектам
* */
function toMap(objects) {
    let map = new Map(Object.entries(objects));
    for (let key of map.keys()) {
        if (map.get(key).objects != null) {
            map.get(key).objects = toMap(map.get(key).objects);
        }
    }
    return map;
}


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
    let data = new Map(Object.entries(yamlData.data));
    let relations = new Map(Object.entries(yamlData.relations));

    const objects = toMap(data.get("objects"));

    if (data.get("layout") === "column") {
        calcLayout(objects, 0, 0);
    }

    /*
    //перебираем все связи
    for (const key of relations.keys()) {
        const relation = relations.get(key);
        const from = objects.get(relation.from);
        const to = objects.get(relation.to);

        from.x = 0;
        from.y = 0;

        //По связи рисуем два объекта исходя их связи
        const rect1 = new Konva.Rect({
            x: from.x,
            y: from.y,
            width: 100,
            height: 50,
            fill: '#eeeeee',
            stroke: 'black',
            strokeWidth: 2,
        });
        canvasLayer.add(rect1);

        const rect2 = new Konva.Rect({
            x: to.x,
            y: to.y,
            width: 100,
            height: 50,
            fill: '#eeeeee',
            stroke: 'black',
            strokeWidth: 2,
        });
        canvasLayer.add(rect2);
    }
     */

});