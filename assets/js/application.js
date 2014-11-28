var isTouchDevice = 'ontouchstart' in document.documentElement;
var application = function() {
    init = function() {
        var width = window.innerWidth;
        var height = window.innerHeight;
        var game = new Phaser.Game(width, height, Phaser.AUTO, '', {
            preload: preload,
            create: create,
            update: update
        });
        return game;
    };

    load = {
        images: function() {
            application.game.load.image('sky', '/assets/images/sky.jpg');
            application.game.load.image('ground', '/assets/images/platform.gif');
            application.game.load.image('star', '/assets/images/star.png');
            application.game.load.spritesheet('dude', '/assets/images/dude.png', 32, 48);
        },
        audio: function() {
            application.game.load.audio('sfx', 'assets/audio/soundeffects/fx_mixdown.ogg');
            application.game.audio = application.game.add.audio('sfx');
            application.game.audio.addMarker('ping', 10, 1.0);
            application.game.audio.addMarker('move', 9, 1.0);
        },
        config: function() {
            application.game.config = {
                size: {
                    brick: 32
                },
                count: {
                    stars: Math.floor(application.game.world.width / 64)
                }
            };
        }
    };

    preload = function() {
        load.images();
        load.audio();
        load.config();
    };

    return {
        game: init()
    }
}();

var player;
var platforms;
var cursors;

var stars;
var score = 0;
var scoreText;

var time = 0;

function create() {

    //  We're going to be using physics, so enable the Arcade Physics system
    application.game.physics.startSystem(Phaser.Physics.ARCADE);

    //  A simple background for our game
    application.game.add.sprite(0, 0, 'sky');

    //  The platforms group contains the ground and the 2 ledges we can jump on
    platforms = application.game.add.group();

    //  We will enable physics for any object that is created in this group
    platforms.enableBody = true;


    createGround();

    //  Now let's create two ledges
    var ledge = platforms.create(400, 400, 'ground');
    ledge.body.immovable = true;

    ledge = platforms.create(-150, 250, 'ground');
    ledge.body.immovable = true;

    // The player and its settings
    player = application.game.add.sprite(32, application.game.world.height - 150, 'dude');

    //  We need to enable physics on the player
    application.game.physics.arcade.enable(player);

    //  Player physics properties. Give the little guy a slight bounce.
    player.body.bounce.y = 0.1;
    player.body.gravity.y = 300;
    player.body.collideWorldBounds = true;
    player.body.bounce.set(1);

    //  Our two animations, walking left and right.
    player.animations.add('left', [0, 1, 2, 3], 10, true);
    player.animations.add('right', [5, 6, 7, 8], 10, true);
    addMoves();
    //  Finally some stars to collect
    stars = application.game.add.group();

    //  We will enable physics for any star that is created in this group
    stars.enableBody = true;

    //  Here we'll create 12 of them evenly spaced apart
    for (var i = 0; i < application.game.config.count.stars; i++) {
        //  Create a star inside of the 'stars' group
        var star = stars.create(i * 70, 0, 'star');

        //  Let gravity do its thing
        star.body.gravity.y = 300;

        //  This just gives each star a slightly random bounce value
        star.body.bounce.y = 0.7 + Math.random() * 0.2;
    }

    addScore();
    addTimer();
    //  Our controls.
    cursors = application.game.input.keyboard.createCursorKeys();
    if (isTouchDevice) {
        initiateGameController();
    }
    attachEvent();
}

function addScore() {
    scoreText = application.game.add.text(16, 16, 'Score: 0', {
        fontSize: '32px',
        fill: '#fff'
    });
}

function addTimer() {
    var timer = 0,
        timerText = 'Time: ';
    var timerElement = application.game.add.text(application.game.world.width - 140, 16, timerText + timer, {
        fontSize: '32px',
        fill: '#fff'
    });
    setInterval(function () {
        timerElement.text = timerText + ++timer;
    }, 1000);
}

function initiateGameController() {
    GameController.init({
        left: {
            type: 'joystick',
            radius: 1,
            position: {
                left: '20%',
                bottom: '12%'
            },
            joystick: {
                touchEnd: function() {
                    player.move.reset();
                },
                touchMove: function(details) {
                    player.move.reset();
                    if (Math.floor(details.dx) < 0) {
                        player.move.left();
                    } else {
                        player.move.right();
                    }
                }
            }
        },
        right: {
            position: {
                right: '5%',
                bottom: '12%'
            },
            type: 'buttons',
            buttons: [{
                    label: 'jump',
                    fontSize: 13,
                    touchStart: function() {
                        player.body.velocity.y = -200;
                    }
                },
                false, false, false
            ]
        }
    });
}

function addMoves() {
    player.move = {
        reset: function() {
            player.body.velocity.x = 0;
        },

        left: function() {
            player.body.velocity.x = -100;
            player.animations.play('left');
        },

        right: function() {
            player.body.velocity.x = 100;
            player.animations.play('right');
        },

        up: function() {
            player.body.velocity.y = -200;
        }
    }
}

function createGround() {
    var heights = [application.game.world.height - (application.game.config.size.brick * 2), application.game.world.height - application.game.config.size.brick];
    for (var index = 0; index < heights.length; index++) {
        for (var i = 0; i < application.game.world.width; i += application.game.config.size.brick) {
            createBrick(i, heights[index]);
        }
    }
    createSteps();
}

function createSteps() {
    var numberOfSteps = 20;
    for (var index = 0; index < numberOfSteps; index++) {
        var randomX = getRandomInt(0, application.game.world.width);
        var randomY = getRandomInt((application.game.config.size.brick * 2), application.game.world.height - 100);
        createBrick(randomX, randomY);
    }
}

function getRandomInt(min, max) {
    var random = Math.floor(Math.random() * (max - min)) + min;
    var step_size = random % application.game.config.size.brick;
    if (step_size !== 0) {
        random -= step_size;
    }
    return random;
}

function createBrick(posX, posY) {
    var ground = platforms.create(posX, posY, 'ground');
    ground.scale.setTo(1, 1);
    ground.body.immovable = true;
}

function update() {
    application.game.physics.arcade.collide(player, platforms);
    application.game.physics.arcade.collide(stars, platforms);

    application.game.physics.arcade.overlap(player, stars, collectStar, null, this);
    if (!isTouchDevice) {
        keyboardCursorEvents();
    }

}

function keyboardCursorEvents() {
    player.move.reset();

    if (cursors.left.isDown) {
        player.move.left();
    } else if (cursors.right.isDown) {
        player.move.right();
    } else {
        //  Stand still
        player.animations.stop();

        player.frame = 4;
    }

    //  Allow the player to jump if they are touching the ground.
    if ((cursors.up.isDown) && player.body.touching.down) {
        player.body.velocity.y = -250;
    }
}

function collectStar(player, star) {
    // Removes the star from the screen
    star.kill();
    //  Add and update the score
    score += 10;
    scoreText.text = 'Score: ' + score;
    application.game.audio.play('ping');
    checkIfGameEnds();
}

function checkIfGameEnds() {
    if (stars.countDead() === (application.game.config.count.stars - 1)) {
        $('#game-end').modal('show');
    }
}

function attachEvent() {
    $(function() {
        new Share('#share-button');

        $('#reload-button').click(function() {
            window.location.reload();
        });
    });
}