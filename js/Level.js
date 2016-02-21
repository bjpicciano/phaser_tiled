function Level (game, tilemap, color, debug) {
    if (debug) { this.debug = true; }
    if (color != undefined) { this.color = color; }

    this.enemies;
    
    this.player;
    this.spawnX;
    this.spawnY;
    
    this.map;
    this.tilemap = tilemap;
    this.layer = {};
    
    this.edgeUp;
    this.edgeDown;
    this.edgeLeft;
    this.edgeRight;
    
    this.score;
};

Level.prototype = {
    
    preload: function () {
        //tilemap
        game.load.tilemap(this.tilemap.name, this.tilemap.URL, null, Phaser.Tilemap.TILED_JSON);
    },
    
    init: function (keys, stateData) {
        if (keys != null) {
            this.keys = keys;
        }
        
        if (stateData != null) {
            initEdge(this, stateData);
        }
        
        this.score = 0;
    },
    
    render: function () {
        if (this.debug) {
            game.debug.spriteInfo(this.player.swordSprite, 32, 32);
            game.debug.body(this.player);
            game.debug.body(this.player.swordSprite);
            
            this.enemies.forEachAlive(function (member) {
                game.debug.body(member);
                }, this);
        }
    },
    
    create: function () {
        this.initGraphics();
        this.initPhysics();
        this.initEntities();
        initBackground(this, this.color);
    },
    
    update: function () {
        checkBoundaries(this);
        game.physics.arcade.overlap(this.player.swordSprite, this.enemies, this.collision, null, this);
        // console.log(game.state.getCurrentState())
        // for (var i = 0; i < this.enemies.length; i++) {
        //     if (this.enemies[i].alive) {
        //         // this.enemies[i].update();
        //         game.physics.arcade.overlap(this.player.swordSprite, this.enemies[i], this.collision, null, this);
        //     }
        // }
    },
    
    collision: function (hitter, hitee) {
        hitee.kill();
    },
    
    initGraphics: function () {
        //set up tilemap
        this.map = game.add.tilemap(this.tilemap.name);
        
        //#610B0B - dark red
        //#585 - light green
        var saturation = '#333333';
        initLevelGraphics(this, saturation);
        
        //scale options
        // self.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
    },
    
    initPhysics: function () {
        game.physics.startSystem(Phaser.Physics.ARCADE);
        // game.physics.startSystem(Phaser.Physics.P2JS);

        initLevelPhysics(this);
    },
    
    initEntities: function () {
        this.enemies = game.add.group();
        
        initPlayer(this, this.spawnX, this.spawnY);

        this.map.createFromObjects('sprite', 5, graphicAssets.skall.name, 0, true, false, this.enemies, Skall);
    },
    
    updateScore: function (score) {
        this.score += score;
        this.tf_score.text = this.score;
    },
};

function initLevelGraphics (self, saturation) {    
    //the first parameter is the tileset name, as specified in the Tiled map editor (and in the tilemap json file)
    //the second parameter maps this name to the Phaser.Cache key 'tiles'
    self.map.addTilesetImage(graphicAssets.protoTiles.name, graphicAssets.protoTiles.name);
    
    //creates a layer with the name given in Tiled
    self.layer[0] = self.map.createLayer("background");

    self.layer[1] = self.map.createLayer("collision");
    
    self.layer[0].resizeWorld();
    
    //score text
    self.tf_score = game.add.text(game.width * .985, game.height * .01, self.score, fontAssets.counterFontStyle);
    self.tf_score.align = 'right';
    self.tf_score.anchor.set(1, 0);
    
    if (self.debug) {
        self.layer[1].debug = true;
    }
    
    if (saturation != null) {
        // self.game.stage.backgroundColor = saturation;
    }
};

function initBackground (self, color) {
    self.backgroundSprite = game.add.sprite(0, 0, graphicAssets.background.name);
    self.backgroundSprite.width = game.world.width;
    self.backgroundSprite.height = game.world.height;

    self.backgroundSprite.tint = color;
    self.backgroundSprite.alpha = 0.4;
};

function initLevelPhysics (self) {
    //tilemap physics
    self.map.setCollisionBetween(1, 100, true, 'collision');
    // self.layer[1].debug = true;
};

function getRemainingLevels () {
    var randomLevelIndex = game.rnd.integerInRange(0, states.levels.length - 1);
    var nextLevel = states.levels[randomLevelIndex];
    states.levels.splice(randomLevelIndex, 1);
    
    return nextLevel;
};

function initEdge (self, stateData) {
    self.spawnX = stateData.spawnX;
    self.spawnY = stateData.spawnY;

    if (stateData.edge == 'x') {
        if (stateData.spawnX < game.world.width / 2) {
            self.edgeLeft = stateData.returnState;
        } else {
            self.edgeRight = stateData.returnState;
        }
    } else if (stateData.edge == 'y') {
        if (stateData.spawnY < game.world.height / 2) {
            self.edgeUp = stateData.returnState;
        } else {
            self.edgeDown = stateData.returnState;
        }
    }
};


function checkBoundaries (self) {
    var sprite = self.player;
    var stateData;
    if (sprite.x + gameProperties.padding < 0) { //left
        stateData = {
            spawnX: game.world.width + gameProperties.padding,  //x coord to spawn at in new state
            spawnY: sprite.y,   //y coord to spawn at in new state
            edge: 'x', //x or y to determine the new level's edge that will return here
            returnState: game.state.current, //this state to return back to
        }

        if (self.edgeLeft == null) {
            self.edgeLeft = getRemainingLevels();
        }

        if (self.edgeLeft != null) {
            //param2: clear world data , param3: clear cache data, extra custom data
            game.state.start(self.edgeLeft, true, false, self.keys, stateData);
        }
    } else if (sprite.x - gameProperties.padding > game.world.width) { //right
        stateData = {
            spawnX: -gameProperties.padding,
            spawnY: sprite.y,
            edge: 'x', //x or y to determine the new level's edge that will return here
            returnState: game.state.current, //this state to return back to
        }

        if (self.edgeRight == null) {
            self.edgeRight = getRemainingLevels();
        }

        if (self.edgeRight != null) {
            //param2: clear world data , param3: clear cache data, extra custom data
            game.state.start(self.edgeRight, true, false, self.keys, stateData);
        }
    } 

    if (sprite.y + gameProperties.padding < 0) { //up
        stateData = {
            spawnX: sprite.x,
            spawnY: game.world.height + gameProperties.padding,
            edge: 'y', //x or y to determine the new level's edge that will return here
            returnState: game.state.current, //this state to return back to
        }

        if (self.edgeUp == null) {
            self.edgeUp = getRemainingLevels();
        }

        if (self.edgeUp != null) {
            //param2: clear world data , param3: clear cache data, extra custom data
            game.state.start(self.edgeUp, true, false, self.keys, stateData);
        }
    } else if (sprite.y - gameProperties.padding > game.world.height) { //down
        stateData = {
            spawnX: sprite.x,
            spawnY: -gameProperties.padding,
            edge: 'y', //x or y to determine the new level's edge that will return here
            returnState: game.state.current, //this state to return back to
        }

        if (self.edgeDown == null) {
            self.edgeDown = getRemainingLevels();
        }

        if (self.edgeDown != null) {
            //param2: clear world data , param3: clear cache data, extra custom data
            game.state.start(self.edgeDown, true, false, self.keys, stateData);
        }
    }
};