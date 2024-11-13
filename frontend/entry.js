import "./css/styles.scss";

import Konva from 'konva';
import YAML from 'yaml';
import * as Func from "./functions.js";

const defaultBoxWidth = 100;
const defaultBoxHeight = 50;
const defaultMarginX = 10;
const defaultMarginY = 10;

/*
* Расчет координат для каждого объекта.
* Координаты расстановки объектов - относительные
* startX, startY - начальные координаты расчета установки относительно родителя
* */
function calcLayout(objects, parent) {
    let startObjX = defaultMarginX;
    let startObjY = defaultMarginY;
    let endObjX = startObjX + defaultBoxWidth;
    let endObjY = startObjY + defaultBoxHeight;

    //Для каждого объекта вычисляем куда его поставить
    for (let key of objects.keys()) {
        const obj = objects.get(key);

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

        //Если у объекта дочерние объекты, то вычисляем куда их поставить
        if (Func.notNull(obj.objects)) {
            obj.objects = calcLayout(obj.objects, obj);

            //Когда посчитали координаты всех внутренних объектов - вычисляем размер родителя-контейнера
            for (let k of obj.objects.keys()) {
                const tempObj = obj.objects.get(k);
                endObjX = Math.max(endObjX, tempObj.x + tempObj.width);
                endObjY = Math.max(endObjY, tempObj.y + tempObj.height);
            }

            //обновляем вторую границу родительского объекта
            endObjX += defaultMarginX;
            endObjY += defaultMarginY;
            obj.width = endObjX;
            obj.height = endObjY;
        }



        if (obj.name === "container3") {

        }

        if (Func.notNull(parent)) {
            //стиль размещения объектов указанный у родительского контейнера
            if (Func.isNull(parent.layout) || parent.layout === "inline") {
                //Координата вставки следующего элемента
                startObjX = endObjX + defaultMarginX;
            } else if (parent.layout === "column") {
                //Координата вставки следующего элемента
                startObjY = endObjY + defaultMarginY;
            }
        }

        console.log(obj.name, startObjX, startObjY);
        console.log(obj.name, endObjX, endObjY);
    }
    return objects;
}


/*
* Отрисовка
* */
function draw(objects, parent, dx, dy, canvasLayer) {
    console.log(objects);

    if (Func.notNull(parent)) {
        dx += parent.x;
        dy += parent.y;
    }

    //Перебираем все объекты
    for (let key of objects.keys()) {
        const obj = objects.get(key);

        const rect = new Konva.Rect({
            x: obj.x + dx,
            y: obj.y + dy,
            width: obj.width,
            height: obj.height,
            fill: obj.color,
            stroke: 'black',
            strokeWidth: 2,
            draggable: true
        });
        canvasLayer.add(rect);

        if (Func.notNull(obj.objects)) {
            draw(obj.objects, obj, dx, dy, canvasLayer);
        }
    }
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
    let data = new Map(Object.entries(yamlData.data));
    let relations = new Map(Object.entries(yamlData.relations));

    const objects = Func.toMap(data.get("objects"));

    //Вычисление координат
    calcLayout(objects, null);

    //Отрисовка
    draw(objects, null, 0, 0, canvasLayer);


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