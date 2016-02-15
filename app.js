(function(){

    // Utility function
    function getRandomIntInclusive(min, max) {
        return Math.floor(Math.random() * (max - min +1)) + min;
    }
    // Link the easel stage to the canvas
    var stage = new createjs.Stage("game");

    stage.mouseEventsEnabled = true;
    stage.enableMouseOver(60); // 60 updates per second

    // Function call at a regular frequency
    createjs.Ticker.setFPS(32);
    createjs.Ticker.addEventListener("tick", tick);

    // Global variables
    var globalWidth = window.innerWidth
    || document.documentElement.clientWidth
    || document.body.clientWidth;

    var globalHeight = window.innerHeight
    || document.documentElement.clientHeight
    || document.body.clientHeight;

    var startContainer = new createjs.Container();
    var looseContainer = new createjs.Container();
    var timer, shapeContainer;
    var beginDate = 0;
    var player = {
        score : 0,
        objectif : null,
        isPlaying : false,
        checkLooseOnce : true
    };




    stage.canvas.width =  globalWidth;
    stage.canvas.height =  globalHeight;

    // Sound loader
    createjs.Sound.registerSound({id:"fond", src:"./asset/fond.mp3"});
    createjs.Sound.addEventListener("fileload", handleFileLoad);

    function handleFileLoad(e) {
        console.log("Preloaded:", e.id, e.src);
    }

    // Function call in first
    // Ask to player when start the game
    function alert(){
        shapeContainer = new createjs.Container();
        shapeContainer.name = 'shapeContainer';
        var overlay = new createjs.Shape();
        overlay.name = 'startAlert';
        overlay.graphics.beginFill('#000');
        overlay.graphics.drawRect(0,0, globalWidth, globalWidth);
        var btn = new createjs.Shape();
        btn.graphics.setStrokeStyle(2);
        btn.graphics.beginStroke('#fff');
        btn.graphics.drawRect(-100, -25, 200, 100);
        btn.x = globalWidth / 2;
        btn.y = globalHeight / 2;
        // Display start button
        var start = new createjs.Text('Play', '20px Arial', '#FFF');
        start.textAlign = 'center';
        start.x = globalWidth / 2;
        start.y = globalHeight / 2;
        var baseline = new createjs.Text('Click to start', '12px Arial', '#FFF');
        baseline.textAlign = 'center';
        baseline.x = globalWidth / 2;
        baseline.y = globalHeight / 2 + 24;
        startContainer.addChild(overlay, start, baseline, btn);
        stage.addChild(startContainer, shapeContainer);
        stage.update();
        clickToStart(overlay);
    }

    // Bind click to start game
    function clickToStart(elmt){
        elmt.on('click', function(e){
            if(e.target.name === 'startAlert'){
                createjs.Tween.get(startContainer).to({ y : globalHeight * 2 }, 600);
                var globalSound = createjs.Sound.play("fond");
            } else if(e.target.name === 'looseAlert') {
                createjs.Tween.get(looseContainer).to({ y : globalHeight * 2 }, 600);
            };
            // Restart timer
            beginDate = Date.now();
            player.score = 0;
            player.isPlaying = true;
            player.checkLooseOnce = true;
            displayObjectif();
            displayScore();
            displayHelper();
        });
    }

    // Call in Tick() function
    // Start timer
    function startGame(){
        var now = Date.now();
        if(player.isPlaying){
            timer = Math.floor((now - beginDate) / 1000);
            setLvl(timer); // Set difficulty then addShapes()
        }
    }

    // Set difficulty then addShapes()
    function setLvl(time){
        if(time < 10){
            addShapes(10);
        } else if(time < 20){
            addShapes(15);
        } else if(time < 30){
            addShapes(25);
        } else if(time < 40){
            addShapes(30);
        } else if(time < 50){
            addShapes(40);
        } else if(time < 60){
            addShapes(50);
        } else {
            addShapes(65);
        }
    }

    // Create random shape
    function addShapes(nbr){
        if(player.isPlaying){
            var possibleColors = ["#1A3DE5", "#2F344C", "#C5845B", "#E54C1A", "#2688B2"];
            var shape, hit, selectColor, selectShape;
            // Create shape loop
            while(shapeContainer.children.length < nbr){
                // Create a random shape with random color
                shape = new createjs.Shape();
                selectColor = possibleColors[getRandomIntInclusive(0, possibleColors.length - 1)];
                shape.graphics.beginFill(selectColor);
                shape.color = selectColor;
                selectShape = randomShape(shape);
                // Random position in stage
                shape.x = getRandomIntInclusive(-1000, -20);
                shape.y = getRandomIntInclusive(40, globalHeight - 40);
                // Bind each shape to mouse event
                bindShapeToMouse(shape);
                // Add each shape into the container
                shapeContainer.addChild(shape);
                // Animate shape to left side
                createjs.Tween.get(shape)
                .to({ x : globalWidth + 60, y : getRandomIntInclusive(40, globalHeight - 40) }, getRandomIntInclusive(7000, 10000))
                .call(removeShape);
            }
        }
    }

    // Call in addShapes() function
    function randomShape(shape){
        var possibleShapes = ["rect", "circle", "star", "losange"];
        var selectShape = possibleShapes[getRandomIntInclusive(0, possibleShapes.length - 1)];
        shape.form = selectShape;
        switch(selectShape){
            case "circle" :
            shape.graphics.drawCircle(0, 0, 20);
            break;
            case "losange" :
            shape.graphics.drawPolyStar(0, 0, 20, 2, 0.01, -90);
            break;
            case "star" :
            shape.graphics.drawPolyStar(0, 0, 20, 5, 0.6, -90);
            break;
            case "rect" :
            shape.graphics.drawRect(-20, -20, 40, 40);
            break;
        }
        return selectShape;
    }

    // Remove shape after animation
    function removeShape(e){
        var shapeIndex = shapeContainer.getChildIndex(e.target);
        shapeContainer.children.splice(shapeIndex, 1);
    }

    // Bind shape to the mouse
    function bindShapeToMouse(shape){
        shape.on('mouseover', function(e){
            if(e.target.color === player.objectif || e.target.form === player.objectif){
                updateScore(10);
                displayObjectif();
                removeShape(e);
                // var killSound = createjs.Sound.play("kill01");
                // killSound.volume = 0.15;
            }
        });
    }

    // Define a shape or a color the player had to kill
    function defineObjectif(){
        var possibilities = ["rect", "circle", "star", "losange"];
        var shapeContainer = stage.getChildByName('shapeContainer');
        // Check if form or color property is too near from left side
        // then remove then from the objective
        if(shapeContainer != null){
            for(var i = 0, x = shapeContainer.children.length; i < x; i++){
                if(shapeContainer.children[i].x > (globalWidth - (globalWidth / 6))){
                    var formNotPossible = shapeContainer.children[i].form;
                    if(possibilities.length > 1){
                        if(formNotPossible != undefined){
                            var formToSplice = possibilities.indexOf(formNotPossible);
                            possibilities.splice(formToSplice, 1);
                        }
                    }
                }
            }
        }
        var maxP = possibilities.length - 1;
        var objectif = possibilities[getRandomIntInclusive(0, maxP)];
        console.log(possibilities);
        return objectif;
    };

    // Call in clickToStart() function
    function displayObjectif(){
        player.objectif = defineObjectif();
        // Delete last objectif
        var toDelete = stage.getChildByName('objectif');
        if(toDelete != null){
            stage.removeChild(toDelete);
        }
        // Create objective shape indicator
        var s = new createjs.Shape();
        var shapeColor = '#000';
        s.name = 'objectif';
        s.x = globalWidth / 2;
        s.y = globalHeight / 2;
        s.scaleX = 5;
        s.scaleY = 5;
        s.alpha = 0;
        // Display the right objectif
        switch (player.objectif) {
            case 'rect':
            s.graphics.beginFill(shapeColor);
            s.graphics.drawRect(-20, -20, 40, 40);
            break;
            case 'circle':
            s.graphics.beginFill(shapeColor);
            s.graphics.drawCircle(0, 0, 20);
            break;
            case 'star':
            s.graphics.beginFill(shapeColor);
            s.graphics.drawPolyStar(0, 0, 20, 5, 0.6, -90);
            break;
            case 'losange':
            s.graphics.beginFill(shapeColor);
            s.graphics.drawPolyStar(0, 0, 20, 2, 0.01, -90);
            break;
        }
        stage.addChild(s);
        stage.update();
        // set shapeContainer z-index above the objective
        stage.setChildIndex(shapeContainer, stage.getNumChildren()-1);
        createjs.Tween.get(s).to({ alpha : 0.3 }, 150);
    }

    // Display score
    function displayScore(){
        var score = new createjs.Text('Score: 0', '14px Arial', '#000');
        score.name = 'score';
        score.textAlign = 'center';
        score.x = globalWidth / 2;
        score.y = 10;
        stage.addChild(score);
        stage.update();
    }

    function updateScore(nbr){
        player.score += nbr;
        var scoreUi = stage.getChildByName('score');
        scoreUi.text = 'Score: ' + player.score;
        stage.update();
    }

    function displayHelper(){
        var graphics = new createjs.Graphics().beginFill("red").drawRect(0, 0, 10, 100);
        var shape = new createjs.Shape(graphics);
        shape.name = 'helper';
        shape.x = globalWidth - 10;
        shape.y = globalHeight / 2 - 50;
        if(stage.getChildByName('helper') === null){
            stage.addChild(shape);
        }
    }

    // Check if objectif has been missed
    function checkIfGameOver(){
        var danger = {};
        danger.x = 0;
        if(player.isPlaying && player.checkLooseOnce){
            for(var i = 0, x = shapeContainer.children.length; i < x; i++){
                if(shapeContainer.children[i] != undefined){
                    if(shapeContainer.children[i].form === player.objectif){
                        if(shapeContainer.children[i].x > (globalWidth + 40)){
                            gameOver();
                        }
                        // Add helper
                        if(shapeContainer.children[i].x > danger.x){
                            danger = shapeContainer.children[i];
                            stage.getChildByName('helper').y = danger.y - 50;
                        }
                    }
                }
            }
        }
    }

    // reload the game
    function gameOver(){
        // Stop the game
        player.isPlaying = false;
        player.checkLooseOnce = false;
        // Display game informations
        var overlay = new createjs.Shape();
        overlay.name = 'looseAlert';
        overlay.graphics.beginFill('#000');
        overlay.graphics.drawRect(0,0, globalWidth, globalHeight);
        var btn = new createjs.Shape();
        btn.graphics.setStrokeStyle(2);
        btn.graphics.beginStroke('#fff');
        btn.graphics.drawRect(-100, -40, 200, 100);
        btn.x = globalWidth / 2;
        btn.y = globalHeight / 2;
        var loose = new createjs.Text('You loose', '20px Arial', '#fff');
        loose.textAlign = 'center';
        loose.x = globalWidth / 2;
        loose.y = globalHeight / 2 - 10;
        var restart = new createjs.Text('click to restart', '12px Arial', '#FFF');
        restart.textAlign = 'center';
        restart.x = globalWidth / 2;
        restart.y = globalHeight / 2 + 80;
        var score = new createjs.Text('Score: ' + player.score , '14px Arial', '#FFF');
        score.textAlign = 'center';
        score.x = globalWidth / 2;
        score.y = globalHeight / 2 + 14;
        clickToStart(overlay);
        looseContainer.addChild(overlay, loose, restart, score, btn);
        looseContainer.y = globalHeight * 2;
        stage.addChild(looseContainer);
        stage.update();
        createjs.Tween.get(looseContainer).to({ y : 0 }, 600).call(deleteShape);
    }

    function deleteShape(){
        shapeContainer.removeAllChildren();
        stage.removeChild(stage.getChildByName('objectif'));
        stage.removeChild(stage.getChildByName('score'));
    }

    // Function call at every frame
    function tick(e){
        startGame();
        checkIfGameOver();
        stage.update();
    }

    alert();

}());
