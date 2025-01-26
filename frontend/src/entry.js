import "../css/styles.scss";

import Konva from 'konva';
import YAML from 'yaml';
import * as Box from "./box.js";
import * as Relation from "./relation.js";
import * as Func from "./functions.js";
import {initManualRelation} from "./manual-relation.js";

/**********************************************************************************/
let stage;
let canvasLayer;

document.addEventListener('DOMContentLoaded', function () {
     stage = new Konva.Stage({
        container: 'watman',
        width: 1000,
        height: 1000,
    });

    canvasLayer = new Konva.Layer({
        x: 0,
        y: 0,
    });
    stage.add(canvasLayer);

    fetch('http://localhost:3000/work/io.yaml')
    // fetch('http://localhost:3000/test9.yaml')
        .then(response => response.text())
        .then(response => {
            initManualRelation();
            document.getElementById("yaml-text").innerHTML = response;
            // const yamlData = YAML.parse(document.getElementById("yaml-text").value);

            reloadChart(response);
        });
});


function reloadChart(yaml) {
    const yamlData = YAML.parse(yaml);
    const mainObj = yamlData.data;
    mainObj.id = "data";

    //Вычисление координат для расстановки объектов
    const diagramObj = Box.calcLayout(mainObj, null, null);

    //Отрисовка обеъктов
    Box.draw(diagramObj, canvasLayer);

    //Вычисление связей
    const relations = Relation.calcAllPathes(yamlData.relations, diagramObj, stage, canvasLayer);

    for (let rel of relations) {
        const points = [];

        const compressRel = Relation.compressPoints(rel.points);
        // console.log("compressRel", compressRel);
        for (let p of compressRel) {
            if (Func.notNull(p)) {
                points.push(p.x);
                points.push(p.y);
            }
        }

        let color = "#492f2f";
        if (Func.notNull(rel.color)) color = rel.color;
        const line = new Konva.Arrow({
            points: points,
            stroke: color,
            strokeWidth: 2,
            pointerWidth: 6,
            pointerLength: 6,
            lineCap: 'round',
            lineJoin: 'round',
        });
        canvasLayer.add(line);
    }

    // drawLineNet(canvasLayer);
}


function drawLineNet(canvasLayer) {
    const color = '#1c4d9c';

    for (let i=0; i<400; i += 10) {
        const line = new Konva.Line({
            points: [0, i, 400, i],
            stroke: color,
            strokeWidth: 1,
            lineCap: 'round',
            lineJoin: 'round',
            opacity: 0.5,
        });
        canvasLayer.add(line);
    }

    for (let i=0; i<400; i += 10) {
        const line = new Konva.Line({
            points: [i, 0, i, 400],
            stroke: color,
            strokeWidth: 1,
            lineCap: 'round',
            lineJoin: 'round',
            opacity: 0.5,
        });
        canvasLayer.add(line);
    }

    // let circle = new Konva.Circle({
    //     x: 320,
    //     y: 170,
    //     radius: 6,
    //     fill: 'green',
    //     stroke: 'black',
    //     strokeWidth: 2,
    // });
    // canvasLayer.add(circle);
    //
    // circle = new Konva.Circle({
    //     x: 20,
    //     y: 90,
    //     radius: 4,
    //     fill: 'red',
    //     stroke: 'black',
    //     strokeWidth: 2,
    // });
    // canvasLayer.add(circle);
    //
    // circle = new Konva.Circle({
    //     x: 150,
    //     y: 20,
    //     radius: 4,
    //     fill: 'red',
    //     stroke: 'black',
    //     strokeWidth: 2,
    // });
    // canvasLayer.add(circle);
}