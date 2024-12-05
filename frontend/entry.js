import "./css/styles.scss";

import Konva from 'konva';
import YAML from 'yaml';
import * as Box from "./box.js";
import * as Relation from "./relation.js";

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
        .then(response => response.text())
        .then(response => {
            document.getElementById("yaml-text").innerHTML = response;
            // const yamlData = YAML.parse(document.getElementById("yaml-text").value);

            reloadChart(response);
        });
});


function reloadChart(yaml) {
    const yamlData = YAML.parse(yaml);

    //Вычисление координат
    const diagramObj = Box.calcLayout(yamlData.data, null, null);

    //Отрисовка
    Box.draw(diagramObj, canvasLayer);

    //Вычисление координат
    const relations = Relation.calcAllPathes(yamlData.relations, diagramObj, stage, canvasLayer);
    for (let rel of relations) {
        const points = []
        for (let p of rel) {
            points.push(p.x);
            points.push(p.y);
        }

        const line = new Konva.Arrow({
            points: points,
            stroke: "#492f2f",
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

    for (let i=0; i<300; i += 10) {
        const line = new Konva.Line({
            points: [0, i, 300, i],
            stroke: color,
            strokeWidth: 1,
            lineCap: 'round',
            lineJoin: 'round',
            opacity: 0.5,
        });
        canvasLayer.add(line);
    }

    for (let i=0; i<300; i += 10) {
        const line = new Konva.Line({
            points: [i, 0, i, 300],
            stroke: color,
            strokeWidth: 1,
            lineCap: 'round',
            lineJoin: 'round',
            opacity: 0.5,
        });
        canvasLayer.add(line);
    }

    // let circle = new Konva.Circle({
    //     x: 120,
    //     y: 90,
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