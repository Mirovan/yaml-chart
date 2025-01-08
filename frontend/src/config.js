class Config {
    //Размер шага для поиска пути
    defaultStepX = 10;
    defaultStepY = 10;

    //Коэфициент приоритета для поиска пути соединительной линии
    relationPriorityKoef = 10;
}

export let config = new Config();