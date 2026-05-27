module.exports = {
  apps: [
    {
      name: "minecraft-server",
      script: "java",
      args: "-Xmx8G -Xms2G -jar paper.jar nogui",
      cwd: "C:\\Users\\Admin\\Desktop\\ACHIVKA",
      instances: 1,
      autorestart: false,
      watch: false
    }
  ]
};