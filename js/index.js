/*
for the shooting I used these tutorials: 
https://www.codecaptain.io/blog/game-development/shooting-bullets-phaser-3-using-arcade-physics-groups/696?fbclid=IwAR2T37t9hk3NQHONzkHrwVQJq0nP-qlxDUiG9gLPHDARWcCeDJfK3EwPo3U
https://phaser.io/examples/v2/arcade-physics/shoot-the-pointer
 */

import Phaser from "phaser";

let game;
let direction;
let fireRate = 100;
let nextFire = 0;

const gameOptions = {
  birdGravity: 700,
  birdSpeed: 300
};

class Laser extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, "fire");
  }
  fire(x, y) {
    this.body.reset(x, y);
    this.setActive(true);
    this.setVisible(true);
    this.setVelocityX(700);
  }

  preUpdate(time, delta) {
    super.preUpdate(time, delta);
    if (this.x >= game.config.width) {
      this.setActive(false);
      this.setVisible(false);
    }
  }
}

class LaserGroup extends Phaser.Physics.Arcade.Group {
  constructor(scene) {
    super(scene.physics.world, scene);

    this.createMultiple({
      classType: Laser,
      frameQuantity: 30,
      active: false,
      visible: false,
      key: "fire"
    });
  }
  fireLaser(x, y) {
    const laser = this.getFirstDead(false);
    if (laser) {
      laser.fire(x, y);
    }
  }
}

class PlayGame extends Phaser.Scene {
  constructor() {
    super("PlayGame");
    this.score = 0;
  }

  preload() {
    this.load.image("pipe", "assets/pipe.png");
    this.load.image("pipedown", "assets/pipedown.png");
    this.load.image("star", "assets/star.png");
    this.load.image("redstar", "assets/redstar.png");
    this.load.image("enemy", "assets/enemy.png");
    this.load.image("fire", "assets/fire.png");
    this.load.spritesheet("bird", "assets/flappy.png", {
      frameWidth: 66,
      frameHeight: 40
    });
  }

  create() {
    this.laserGroup = new LaserGroup(this);

    this.pipeGroup = this.physics.add.group({
      immovable: true,
      allowGravity: false
    });

    this.bird = this.physics.add.sprite(
      game.config.width / 4,
      game.config.height / 4,
      "bird"
    );
    this.bird.body.gravity.y = gameOptions.birdGravity;

    this.starsGroup = this.physics.add.group({});
    this.redStarsGroup = this.physics.add.group({});
    this.enemiesGroup = this.physics.add.group({});

    this.scoreText = this.add.text(16, 16, "Score: 0", {
      fontSize: "25px",
      fill: "#ffffff"
    });

    this.startText = this.add.text(170, 450, "Game is starting!", {
      fontSize: "45px",
      fill: "#ffffff"
    });
    this.infoText = this.add.text(
      170,
      500,
      "Use ^ to fly\nUse > to shoot\nDon't hit the pipes\nDon't go too high or low\nGet points from collecting stars\nand shooting enemies",
      {
        fontSize: "30px",
        fill: "#ffffff"
      }
    );

    this.cursors = this.input.keyboard.createCursorKeys();

    this.anims.create({
      key: "up",
      frames: this.anims.generateFrameNumbers("bird", { start: 0, end: 2 }),
      frameRate: 10,
      repeat: -1
    });
    this.anims.create({
      key: "fly",
      frames: [{ key: "bird", frame: 0 }],
      frameRate: 10
    });

    this.triggerTimer = this.time.addEvent({
      callback: this.addStuff,
      callbackScope: this,
      delay: 2000,
      loop: true
    });

    this.triggerTimer = this.time.addEvent({
      callback: this.hideText,
      callbackScope: this,
      delay: 3000,
      loop: false
    });
  }

  addStuff() {
    const pos = Phaser.Math.Between(700, 1150);

    if (Phaser.Math.Between(0, 1)) {
      this.starsGroup.create(
        game.config.width + 100,
        Phaser.Math.Between(pos - 550, pos - 350),
        "star"
      );
      this.starsGroup.setVelocityX(-gameOptions.birdSpeed / 2);
    } else if (Phaser.Math.Between(0, 1)) {
      this.redStarsGroup.create(
        game.config.width + 100,
        Phaser.Math.Between(pos - 900, pos - 700),
        "redstar"
      );
      this.redStarsGroup.setVelocityX(-gameOptions.birdSpeed / 2);
      this.redStarsGroup.setVelocityY(gameOptions.birdSpeed / 4);
    } else if (Phaser.Math.Between(0, 1)) {
      this.enemiesGroup.create(
        game.config.width + 100,
        Phaser.Math.Between(pos - 550, pos - 350),
        "enemy"
      );
      this.enemiesGroup.setVelocityX(-gameOptions.birdSpeed / 2);
      this.enemiesGroup.setVelocityY(gameOptions.birdSpeed / 2);
      direction = 1;
    }

    this.physics.add.overlap(
      this.bird,
      this.starsGroup,
      this.collectStar,
      null,
      this
    );

    this.physics.add.overlap(
      this.bird,
      this.redStarsGroup,
      this.collectRedStar,
      null,
      this
    );

    this.physics.add.overlap(
      this.bird,
      this.enemiesGroup,
      this.gameOver,
      null,
      this
    );

    this.physics.add.overlap(
      this.laserGroup,
      this.enemiesGroup,
      this.hit,
      null,
      this
    );

    this.pipeGroup = this.physics.add.group({
      immovable: true,
      allowGravity: false
    });

    this.pipeGroup.create(game.config.width + 100, pos, "pipe");

    this.pipeGroup.create(game.config.width + 100, pos - 900, "pipedown");

    this.pipeGroup.setVelocityX(-gameOptions.birdSpeed / 2);

    this.physics.add.overlap(
      this.bird,
      this.pipeGroup,
      this.gameOver,
      null,
      this
    );

    this.physics.add.collider(
      this.pipeGroup,
      this.enemiesGroup,
      this.moveEnemy,
      null,
      this
    );
  }

  gameOver(bird) {
    bird.disableBody(true, true);
    this.score = 0;
    this.scene.start("PlayGame");
  }

  collectStar(bird, star) {
    star.disableBody(true, true);
    this.score += 1;
    this.scoreText.setText("Score: " + this.score);
  }

  collectRedStar(bird, star) {
    star.disableBody(true, true);
    this.score += 2;
    this.scoreText.setText("Score: " + this.score);
  }

  moveEnemy(pipe, enemy) {
    if (direction === 1) {
      this.enemiesGroup.setVelocityY(-gameOptions.birdSpeed / 2);
      direction = 0;
    } else {
      this.enemiesGroup.setVelocityY(gameOptions.birdSpeed / 2);
      direction = 1;
    }
  }

  hideText() {
    this.startText.destroy();
    this.infoText.destroy();
  }

  update() {
    if (this.cursors.up.isDown) {
      this.bird.body.velocity.y = -gameOptions.birdGravity / 3;
      this.bird.anims.play("up", true);
    } else {
      this.bird.anims.play("fly", true);
    }

    if (this.cursors.right.isDown) {
      this.shoot();
    }

    if (this.bird.y > game.config.height || this.bird.y < 0) {
      this.score = 0;
      this.scene.start("PlayGame");
    }
  }

  shoot() {
    if (this.time.now > nextFire) {
      nextFire = this.time.now + fireRate;
      this.laserGroup.fireLaser(this.bird.x, this.bird.y);
    }
  }

  hit(laser, enemy) {
    enemy.disableBody(true, true);
    this.score += 3;
    this.scoreText.setText("Score: " + this.score);
  }
}

let gameConfig = {
  type: Phaser.AUTO,
  backgroundColor: "#78ceeb",
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 800,
    height: 1000
  },
  pixelArt: true,
  physics: {
    default: "arcade",
    arcade: {
      gravity: {
        y: 0
      }
    }
  },
  scene: PlayGame
};

game = new Phaser.Game(gameConfig);
