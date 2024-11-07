import "./css/styles.scss";

import Konva from 'konva';
import YAML from 'yaml';

document.addEventListener('DOMContentLoaded', function () {

    const yamlData = YAML.parse(document.getElementById("yaml-text").value);
    console.log(yamlData);

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

    const rect = new Konva.Rect({
        x: 20,
        y: 20,
        width: 100,
        height: 50,
        fill: '#eeeeee',
        stroke: 'black',
        strokeWidth: 2,
    });

    canvasLayer.add(rect);
});