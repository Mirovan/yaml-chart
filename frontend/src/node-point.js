export class NodePoint {
    /*
    * point - точка с координатами
    * parent - предыдущая NodePoint-точка родитель
    * priority - приоритет для очереди (из точки можно пойти в четыре стороны - приоритет у всех одинаковый, какая из них будет приоритетней решает directionPriority)
    * directionPriority - приоритет для очереди 1..4 (по направлению от верха до лева)
    * */
    constructor(point, parent, priority, directionPriority) {
        this.point = point;
        this.parent = parent;
        this.priority = priority;
        this.directionPriority = directionPriority;
    }
}